"""
repositorio.py - camada de armazenamento do MusicMatch (PostgreSQL).

Este é o ÚNICO arquivo que fala com o banco. O app.py chama as funções
abaixo e não sabe nada de SQL. Os nomes, os argumentos e o que cada função
devolve são os mesmos da versão em memória.

Conexão: variável DATABASE_URL (arquivo .env), no formato
    postgresql://postgres:SUA_SENHA@localhost:5432/musicmatch

Tabelas usadas (ver o .sql do projeto):
    usuarios, usuario_generos, bandas_favoritas, bandas_salvas,
    playlists, playlist_faixas, historico, visualizacoes
(artistas, albuns e musicas existem no banco, mas o site não as usa.)

Formato do usuário (dict) devolvido pelas funções:

    {
      "id": int, "nome": str, "email": str (minúsculas), "senha_hash": str,
      "foto": str, "bio": str,
      "gen":  list[str],            # gêneros, na ordem em que foram escolhidos
      "fav":  list[str],            # bandas favoritas, na ordem
      "sav":  list[str],            # bandas salvas, na ordem
      "pl":   list[dict],           # {"id": str, "nome": str, "t": [{"t","a","u","c"}]}
      "hist": list[dict],           # {"n": banda, "t": ms} na ordem em que foi enviado
    }

Regras:
  * e-mail único -> EmailJaCadastrado (o banco garante com UNIQUE);
  * as funções devolvem dados novos a cada chamada (nada compartilhado);
  * quem não existe devolve None / False.
"""
import os

import psycopg
from psycopg.errors import UniqueViolation
from psycopg.rows import dict_row


class EmailJaCadastrado(Exception):
    """O e-mail já pertence a outra conta."""


def _conectar():
    """Abre uma conexão nova. A URL é lida aqui (e não no import) porque o
    app.py só carrega o .env DEPOIS de importar este módulo."""
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL não definida. Coloque no arquivo .env.")
    return psycopg.connect(url, row_factory=dict_row)


# ---------------------------------------------------------------------
# Leitura: monta o dict do usuário juntando as tabelas
# ---------------------------------------------------------------------
def _montar_usuario(cur, linha):
    uid = linha["id"]

    def lista(sql):
        cur.execute(sql, (uid,))
        return [r["v"] for r in cur.fetchall()]

    usuario = {
        "id": uid,
        "nome": linha["nome"],
        "email": linha["email"],
        "senha_hash": linha["senha_hash"],
        "foto": linha["foto"],
        "bio": linha["bio"],
        "gen": lista("SELECT genero AS v FROM usuario_generos WHERE usuario_id = %s ORDER BY posicao"),
        "fav": lista("SELECT banda AS v FROM bandas_favoritas WHERE usuario_id = %s ORDER BY posicao"),
        "sav": lista("SELECT banda AS v FROM bandas_salvas WHERE usuario_id = %s ORDER BY posicao"),
    }

    # Playlists (id TEXTO, como o front espera) e suas faixas, em duas consultas
    cur.execute(
        "SELECT id, nome FROM playlists WHERE usuario_id = %s ORDER BY posicao", (uid,))
    playlists = [{"id": r["id"], "nome": r["nome"], "t": []} for r in cur.fetchall()]
    por_id = {p["id"]: p for p in playlists}
    cur.execute(
        "SELECT playlist_id, titulo, artista, audio_url, capa_url "
        "FROM playlist_faixas WHERE usuario_id = %s ORDER BY playlist_id, posicao", (uid,))
    for r in cur.fetchall():
        por_id[r["playlist_id"]]["t"].append(
            {"t": r["titulo"], "a": r["artista"], "u": r["audio_url"], "c": r["capa_url"]})
    usuario["pl"] = playlists

    cur.execute(
        "SELECT banda, visto_em FROM historico WHERE usuario_id = %s ORDER BY id", (uid,))
    usuario["hist"] = [{"n": r["banda"], "t": r["visto_em"]} for r in cur.fetchall()]
    return usuario


def _buscar(condicao, valor):
    with _conectar() as conn, conn.cursor() as cur:
        cur.execute(f"SELECT * FROM usuarios WHERE {condicao} = %s", (valor,))
        linha = cur.fetchone()
        return _montar_usuario(cur, linha) if linha else None


def buscar_por_email(email):
    """Devolve o usuário com esse e-mail (já em minúsculas) ou None."""
    return _buscar("email", email)


def buscar_por_id(usuario_id):
    """Devolve o usuário com esse id ou None."""
    return _buscar("id", usuario_id)


# ---------------------------------------------------------------------
# Escrita
# ---------------------------------------------------------------------
def criar_usuario(nome, email, senha_hash):
    """Cria o usuário (listas vazias, foto e bio vazias) e devolve o dict.
    Levanta EmailJaCadastrado se o e-mail já existe."""
    try:
        with _conectar() as conn, conn.cursor() as cur:
            cur.execute(
                "INSERT INTO usuarios (nome, email, senha_hash) VALUES (%s, %s, %s) RETURNING *",
                (nome, email, senha_hash))
            return _montar_usuario(cur, cur.fetchone())
    except UniqueViolation:
        raise EmailJaCadastrado(email)


def atualizar_perfil(usuario_id, nome, email, bio, senha_hash=None):
    """Atualiza nome, e-mail e bio. Se senha_hash não for None, troca a senha.
    Levanta EmailJaCadastrado se o e-mail já é de OUTRA conta.
    Devolve o usuário atualizado, ou None se o id não existe."""
    try:
        with _conectar() as conn, conn.cursor() as cur:
            if senha_hash is None:
                cur.execute(
                    "UPDATE usuarios SET nome = %s, email = %s, bio = %s "
                    "WHERE id = %s RETURNING *", (nome, email, bio, usuario_id))
            else:
                cur.execute(
                    "UPDATE usuarios SET nome = %s, email = %s, bio = %s, senha_hash = %s "
                    "WHERE id = %s RETURNING *", (nome, email, bio, senha_hash, usuario_id))
            linha = cur.fetchone()
            return _montar_usuario(cur, linha) if linha else None
    except UniqueViolation:
        raise EmailJaCadastrado(email)


def _sem_repetidos(itens, limite=None):
    """Tira repetidos mantendo a ordem (as tabelas têm chave única por item)."""
    vistos, saida = set(), []
    for x in itens:
        x = x[:limite] if limite else x
        if x not in vistos:
            vistos.add(x)
            saida.append(x)
    return saida


def salvar_dados(usuario_id, dados):
    """Substitui gen, fav, sav, pl, hist e foto pelos valores de `dados`
    (já validados pelo app.py). Apaga o que havia e grava de novo, tudo numa
    transação: ou grava tudo, ou nada. Devolve True, ou False se o id não existe."""
    with _conectar() as conn, conn.cursor() as cur:
        cur.execute("UPDATE usuarios SET foto = %s WHERE id = %s", (dados["foto"], usuario_id))
        if cur.rowcount == 0:
            return False

        # Apaga tudo do usuário (playlist_faixas some junto, por ON DELETE CASCADE)
        for tabela in ("usuario_generos", "bandas_favoritas", "bandas_salvas",
                       "playlists", "historico"):
            cur.execute(f"DELETE FROM {tabela} WHERE usuario_id = %s", (usuario_id,))

        # genero é VARCHAR(50) no banco
        cur.executemany(
            "INSERT INTO usuario_generos (usuario_id, genero, posicao) VALUES (%s, %s, %s)",
            [(usuario_id, g, i) for i, g in enumerate(_sem_repetidos(dados["gen"], 50))])
        cur.executemany(
            "INSERT INTO bandas_favoritas (usuario_id, banda, posicao) VALUES (%s, %s, %s)",
            [(usuario_id, b, i) for i, b in enumerate(_sem_repetidos(dados["fav"]))])
        cur.executemany(
            "INSERT INTO bandas_salvas (usuario_id, banda, posicao) VALUES (%s, %s, %s)",
            [(usuario_id, b, i) for i, b in enumerate(_sem_repetidos(dados["sav"]))])

        for pos, p in enumerate(dados["pl"]):
            cur.execute(
                "INSERT INTO playlists (usuario_id, id, nome, posicao) VALUES (%s, %s, %s, %s)",
                (usuario_id, p["id"], p["nome"], pos))
            # Faixas no formato antigo {n, i} não têm título/artista: são ignoradas
            faixas = [f for f in p["t"] if "t" in f]
            cur.executemany(
                "INSERT INTO playlist_faixas "
                "(usuario_id, playlist_id, posicao, titulo, artista, audio_url, capa_url) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                [(usuario_id, p["id"], i, f["t"], f["a"], f["u"], f["c"])
                 for i, f in enumerate(faixas)])

        cur.executemany(
            "INSERT INTO historico (usuario_id, banda, visto_em) VALUES (%s, %s, %s)",
            [(usuario_id, h["n"], int(h["t"])) for h in dados["hist"]])
        return True


def apagar_usuario(usuario_id):
    """Apaga o usuário e tudo dele (as outras tabelas caem por ON DELETE CASCADE).
    Devolve True, ou False se não existia."""
    with _conectar() as conn, conn.cursor() as cur:
        cur.execute("DELETE FROM usuarios WHERE id = %s", (usuario_id,))
        return cur.rowcount > 0


# ---------------------------------------------------------------------
# Visualizações de faixas (contador global, de todos os usuários)
# ---------------------------------------------------------------------
# Tabela visualizacoes: chave = "titulo|artista" em minúsculas.
def incrementar_visualizacao(titulo: str, artista: str, capa: str = "", url: str = "") -> int:
    """Soma 1 na contagem da faixa e devolve o novo total.
    Se a faixa ainda não existe, cria com valor 1. Capa e URL só são
    preenchidas se ainda estiverem vazias. O UPSERT é atômico: dois pedidos
    ao mesmo tempo não perdem contagem."""
    chave = f"{titulo.lower()}|{artista.lower()}"
    with _conectar() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO visualizacoes (chave, titulo, artista, capa, audio_url, total)
            VALUES (%s, %s, %s, %s, %s, 1)
            ON CONFLICT (chave) DO UPDATE SET
                total     = visualizacoes.total + 1,
                capa      = CASE WHEN visualizacoes.capa = '' THEN EXCLUDED.capa
                                 ELSE visualizacoes.capa END,
                audio_url = CASE WHEN visualizacoes.audio_url = '' THEN EXCLUDED.audio_url
                                 ELSE visualizacoes.audio_url END
            RETURNING total
            """,
            (chave, titulo, artista, capa or "", url or ""))
        return cur.fetchone()["total"]


def listar_mais_visualizadas(limite: int = 10) -> list:
    """Devolve as `limite` faixas mais visualizadas, da maior para a menor:
    [{"t", "a", "c", "u", "visualizacoes"}]."""
    with _conectar() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT titulo, artista, capa, audio_url, total FROM visualizacoes "
            "ORDER BY total DESC, chave LIMIT %s", (limite,))
        return [{"t": r["titulo"], "a": r["artista"], "c": r["capa"],
                 "u": r["audio_url"], "visualizacoes": r["total"]} for r in cur.fetchall()]