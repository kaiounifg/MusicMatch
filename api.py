"""
api.py - rotas da API do MusicMatch (tudo que começa com /api).

É um Blueprint do Flask: um grupo de rotas que mora neste arquivo e é ligado
ao app em app.py (app.register_blueprint(api)). As URLs continuam as mesmas.
Este arquivo é o único que fala com o repositorio.py; o armazenamento
(PostgreSQL) fica todo lá.

Rotas:
  GET    /api/me                 usuário logado (401 se ninguém)
  POST   /api/register           cria conta e já loga
  POST   /api/login              entra
  POST   /api/logout             sai
  PUT    /api/perfil             grava nome, e-mail, bio e (opcional) nova senha
  DELETE /api/conta              apaga a conta
  PUT    /api/dados              grava gêneros, favoritos, salvos, playlists, histórico e foto
  GET    /api/itunes             busca de músicas (iTunes)
  GET    /api/video              ids de vídeo do YouTube
  GET    /api/banda/<nome>       dados da banda (TheAudioDB)
  POST   /api/visualizacao       soma 1 na contagem de uma faixa
  GET    /api/mais-escutadas     ranking das faixas mais visualizadas

Erros da API sempre voltam como JSON: {"erro": "mensagem"}.
"""
import os
import re
import threading
from functools import wraps

import requests
from dotenv import load_dotenv
from flask import Blueprint, current_app, jsonify, request, session
from werkzeug.exceptions import HTTPException
from werkzeug.security import check_password_hash, generate_password_hash

import banco
from banco import EmailJaCadastrado

load_dotenv()  # garante que o .env já foi lido antes de ler as chaves abaixo

api = Blueprint("api", __name__)


YT_KEY = os.environ.get("YT_KEY", "")                 # chave do YouTube (opcional)
AUDIODB_KEY = os.environ.get("AUDIODB_KEY", "2")      # chave de teste pública da TheAudioDB; confira na documentação deles
SERVIDORES_PIPED = [                                   # alternativa sem chave (não oficial, pode sair do ar)
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.adminforge.de",
    "https://api.piped.private.coffee",
]

EMAIL_VALIDO = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# ---------------------------------------------------------------------
# Utilitários
# ---------------------------------------------------------------------
def erro(mensagem, status):
    """Resposta de erro padrão: {"erro": "..."}."""
    return jsonify({"erro": mensagem}), status


@api.app_errorhandler(HTTPException)
def erro_http(e):
    """Em /api/..., qualquer erro (404, 405, 500...) volta como JSON em vez de
    uma página HTML. Assim o front sempre consegue ler o {"erro": ...}."""
    if request.path.startswith("/api/"):
        return erro(e.description or e.name, e.code)
    return e


def usuario_publico(usuario):
    """O usuário como o front espera. NUNCA inclui senha_hash."""
    return {c: usuario[c] for c in ("id", "nome", "email", "foto", "bio", "gen", "fav", "sav", "pl", "hist")}


def usuario_logado():
    """Usuário da sessão atual, ou None. Se o cookie aponta para um usuário que
    não existe mais (ex.: o Flask reiniciou), limpa a sessão."""
    uid = session.get("uid")
    if uid is None:
        return None
    usuario = banco.buscar_por_id(uid)
    if usuario is None:
        session.clear()
    return usuario


def login_obrigatorio(funcao):
    """Decorador: responde 401 se não há usuário logado; senão passa o usuário
    como primeiro argumento da rota."""
    @wraps(funcao)
    def interna(*args, **kwargs):
        usuario = usuario_logado()
        if usuario is None:
            return erro("Faça login para continuar.", 401)
        return funcao(usuario, *args, **kwargs)
    return interna


def corpo_json():
    """Corpo JSON do pedido como dict. Devolve {} se não for JSON válido
    (get_json só aceita Content-Type application/json, o que também ajuda
    a barrar formulários de outros sites)."""
    dados = request.get_json(silent=True)
    return dados if isinstance(dados, dict) else {}


def texto(valor, minimo, maximo, rotulo):
    """Valida e devolve um texto sem espaços nas pontas. Levanta ValueError."""
    if not isinstance(valor, str):
        raise ValueError(f"{rotulo} inválido.")
    valor = valor.strip()
    if not (minimo <= len(valor) <= maximo):
        if minimo:
            raise ValueError(f"{rotulo} deve ter de {minimo} a {maximo} caracteres.")
        raise ValueError(f"{rotulo} deve ter no máximo {maximo} caracteres.")
    return valor


def email_valido(valor):
    if not isinstance(valor, str):
        raise ValueError("E-mail inválido.")
    valor = valor.strip().lower()
    if len(valor) > 120 or not EMAIL_VALIDO.match(valor):
        raise ValueError("E-mail inválido.")
    return valor


def senha_valida(valor):
    if not isinstance(valor, str) or not (6 <= len(valor) <= 128):
        raise ValueError("A senha deve ter de 6 a 128 caracteres.")
    return valor


# ---------------------------------------------------------------------
# Contas e sessão
# ---------------------------------------------------------------------
@api.get("/api/me")
def me():
    usuario = usuario_logado()
    if usuario is None:
        return erro("Nenhum usuário logado.", 401)
    return jsonify(usuario_publico(usuario))


@api.post("/api/register")
def registrar():
    d = corpo_json()
    try:
        nome = texto(d.get("nome"), 1, 40, "Nome")
        email = email_valido(d.get("email"))
        senha = senha_valida(d.get("pw"))
    except ValueError as e:
        return erro(str(e), 400)
    try:
        usuario = banco.criar_usuario(nome, email, generate_password_hash(senha))
    except EmailJaCadastrado:
        return erro("Este e-mail já está cadastrado.", 409)
    session.clear()
    session["uid"] = usuario["id"]
    return jsonify(usuario_publico(usuario)), 201


@api.post("/api/login")
def entrar():
    d = corpo_json()
    email = str(d.get("email") or "").strip().lower()
    senha = d.get("pw")
    usuario = banco.buscar_por_email(email)
    # Mesma mensagem para e-mail inexistente e senha errada (não revela quais e-mails existem).
    if usuario is None or not isinstance(senha, str) or not check_password_hash(usuario["senha_hash"], senha):
        return erro("E-mail ou senha incorretos.", 401)
    session.clear()
    session["uid"] = usuario["id"]
    return jsonify(usuario_publico(usuario))


@api.post("/api/logout")
def sair():
    session.clear()
    return jsonify({"ok": True})


@api.put("/api/perfil")
@login_obrigatorio
def atualizar_perfil(usuario):
    d = corpo_json()
    try:
        nome = texto(d.get("nome"), 1, 40, "Nome")
        email = email_valido(d.get("email"))
        bio = texto(d.get("bio", ""), 0, 140, "Bio")
        senha = d.get("pw")
        # pw ausente, null ou "" = não trocar a senha
        senha_hash = generate_password_hash(senha_valida(senha)) if senha else None
    except ValueError as e:
        return erro(str(e), 400)
    try:
        atualizado = banco.atualizar_perfil(usuario["id"], nome, email, bio, senha_hash)
    except EmailJaCadastrado:
        return erro("Este e-mail já está em uso.", 409)
    if atualizado is None:
        session.clear()
        return erro("Conta não encontrada.", 401)
    # Devolve SÓ os campos do perfil. O front faz Object.assign(u, resposta), então
    # mandar fav/pl/hist aqui poderia sobrescrever alterações locais mais novas.
    return jsonify({"nome": atualizado["nome"], "email": atualizado["email"], "bio": atualizado["bio"]})


@api.delete("/api/conta")
@login_obrigatorio
def apagar_conta(usuario):
    banco.apagar_usuario(usuario["id"])
    session.clear()
    return jsonify({"ok": True})


# ---------------------------------------------------------------------
# Dados do usuário (gêneros, favoritos, salvos, playlists, histórico, foto)
# ---------------------------------------------------------------------
CAMPOS_FAIXA = ("t", "a", "u", "c")   # título, artista, URL da prévia, capa


def lista_de_textos(valor, maximo_itens, rotulo):
    if not isinstance(valor, list) or len(valor) > maximo_itens:
        raise ValueError(f"{rotulo} inválido.")
    if not all(isinstance(x, str) and len(x) <= 100 for x in valor):
        raise ValueError(f"{rotulo} inválido.")
    return valor


def validar_faixa(f):
    """Aceita o formato novo {t,a,u,c} e o antigo {n,i} (banda + posição)."""
    if not isinstance(f, dict):
        raise ValueError("Faixa inválida.")
    if "n" in f:
        if not (isinstance(f["n"], str) and len(f["n"]) <= 100 and isinstance(f.get("i"), int)):
            raise ValueError("Faixa inválida.")
        return {"n": f["n"], "i": f["i"]}
    faixa = {}
    for campo in CAMPOS_FAIXA:
        v = f.get(campo, "")
        if not isinstance(v, str) or len(v) > 600:
            raise ValueError("Faixa inválida.")
        faixa[campo] = v
    if not faixa["t"] or not faixa["a"]:
        raise ValueError("Faixa sem título ou artista.")
    return faixa


def validar_playlists(valor):
    if not isinstance(valor, list) or len(valor) > 100:
        raise ValueError("Playlists inválidas.")
    saida, ids = [], set()
    for p in valor:
        if not isinstance(p, dict):
            raise ValueError("Playlist inválida.")
        pid, nome, faixas = p.get("id"), p.get("nome"), p.get("t")
        # id TEXTO: o front compara com data-id (sempre texto)
        if not isinstance(pid, str) or not (1 <= len(pid) <= 40) or pid in ids:
            raise ValueError("Id de playlist inválido.")
        if not isinstance(nome, str) or not (1 <= len(nome.strip()) <= 40):
            raise ValueError("Nome de playlist inválido.")
        if not isinstance(faixas, list) or len(faixas) > 500:
            raise ValueError("Faixas da playlist inválidas.")
        ids.add(pid)
        saida.append({"id": pid, "nome": nome.strip(), "t": [validar_faixa(f) for f in faixas]})
    return saida


def validar_historico(valor):
    if not isinstance(valor, list) or len(valor) > 60:
        raise ValueError("Histórico inválido.")
    saida = []
    for h in valor:
        if not (isinstance(h, dict) and isinstance(h.get("n"), str) and len(h["n"]) <= 100
                and isinstance(h.get("t"), (int, float)) and not isinstance(h.get("t"), bool)):
            raise ValueError("Histórico inválido.")
        saida.append({"n": h["n"], "t": h["t"]})
    return saida


def validar_foto(valor):
    # O front gera sempre um JPEG 200x200 em data URL (poucos KB).
    if valor == "":
        return ""
    if not (isinstance(valor, str) and valor.startswith("data:image/jpeg;base64,")
            and len(valor) <= 150_000 and re.fullmatch(r"[A-Za-z0-9+/=]+", valor[23:])):
        raise ValueError("Foto inválida.")
    return valor


@api.put("/api/dados")
@login_obrigatorio
def salvar_dados(usuario):
    d = corpo_json()
    try:
        dados = {
            "gen": lista_de_textos(d.get("gen"), 50, "Gêneros"),
            "fav": lista_de_textos(d.get("fav"), 500, "Favoritos"),
            "sav": lista_de_textos(d.get("sav"), 500, "Salvos"),
            "pl": validar_playlists(d.get("pl")),
            "hist": validar_historico(d.get("hist")),
            "foto": validar_foto(d.get("foto", "")),
        }
    except ValueError as e:
        return erro(str(e), 400)
    if not banco.salvar_dados(usuario["id"], dados):
        session.clear()
        return erro("Conta não encontrada.", 401)
    return jsonify({"ok": True})


# ---------------------------------------------------------------------
# APIs externas (o front só fala com estas rotas; as chaves ficam aqui)
# ---------------------------------------------------------------------
ATRIBUTOS_ITUNES = {"artistTerm", "songTerm", "albumTerm"}


@api.get("/api/itunes")
def itunes():
    termo = (request.args.get("term") or "").strip()
    if not termo or len(termo) > 200:
        return erro("Informe o termo da busca.", 400)
    limite = min(max(request.args.get("limit", default=10, type=int), 1), 50)
    atributo = request.args.get("attribute")
    params = {"media": "music", "entity": "song", "limit": limite, "term": termo}
    if atributo:
        if atributo not in ATRIBUTOS_ITUNES:
            return erro("Atributo inválido.", 400)
        params["attribute"] = atributo
    try:
        r = requests.get("https://itunes.apple.com/search", params=params, timeout=7)
        r.raise_for_status()
        resultados = r.json().get("results", [])
    except (requests.RequestException, ValueError):
        return erro("Não foi possível consultar o iTunes.", 502)
    # Só faixas com prévia de áudio, no formato que o front usa.
    return jsonify([
        {
            "t": x.get("trackName", ""),
            "a": x.get("artistName", ""),
            "al": x.get("collectionName") or "",
            "c": (x.get("artworkUrl100") or "").replace("100x100", "200x200"),
            "u": x["previewUrl"],
            "v": x.get("trackViewUrl", ""),
        }
        for x in resultados if x.get("previewUrl")
    ])


ID_YOUTUBE = re.compile(r"[?&]v=([\w-]{11})")


def ids_youtube(consulta):
    """Até 3 ids de vídeo: YouTube Data API (se houver YT_KEY) ou Piped."""
    busca = consulta + " official video"
    ids = []

    def adicionar(vid):
        if vid and re.fullmatch(r"[\w-]{11}", vid) and vid not in ids:
            ids.append(vid)

    if YT_KEY:
        try:
            r = requests.get(
                "https://www.googleapis.com/youtube/v3/search",
                params={"part": "snippet", "type": "video", "videoEmbeddable": "true",
                        "videoCategoryId": "10", "maxResults": 3, "q": busca, "key": YT_KEY},
                timeout=7,
            )
            for item in r.json().get("items", []):
                adicionar((item.get("id") or {}).get("videoId"))
        except (requests.RequestException, ValueError) as e:
            # Não registra a exceção inteira: a mensagem do requests inclui a URL (com a chave).
            current_app.logger.warning("YouTube Data API indisponível: %s", type(e).__name__)
        if ids:
            return ids[:3]

    for base in SERVIDORES_PIPED:   # alternativa sem chave, tenta um por vez
        try:
            r = requests.get(base + "/search", params={"q": busca, "filter": "videos"}, timeout=5)
            for item in r.json().get("items", []):
                m = ID_YOUTUBE.search(item.get("url") or "")
                adicionar(m.group(1) if m else None)
        except (requests.RequestException, ValueError, AttributeError):
            continue
        if ids:
            break
    return ids[:3]


@api.get("/api/video")
def video():
    consulta = (request.args.get("q") or "").strip()
    if not consulta or len(consulta) > 200:
        return erro("Informe a busca.", 400)
    return jsonify(ids_youtube(consulta))   # lista vazia = não achou (o front pede o link na mão)


_cache_banda = {}                # nome em minúsculas -> dict (ou None se a AudioDB não conhece)
_cache_banda_lock = threading.Lock()


def https_ou_vazio(url):
    return url if isinstance(url, str) and re.fullmatch(r"https://[^\s\"')]+", url) else ""


@api.get("/api/banda/<nome>")
def banda(nome):
    nome = nome.strip()
    if not nome or len(nome) > 100:
        return erro("Nome inválido.", 400)
    chave = nome.lower()

    # Cache: cada banda é consultada uma vez só (a AudioDB tem limite de pedidos
    # e o front chama esta rota para cada card). Falhas de rede NÃO entram no cache.
    with _cache_banda_lock:
        if chave in _cache_banda:
            dados = _cache_banda[chave]
            return (jsonify(dados), 200) if dados else erro("Banda não encontrada.", 404)

    try:
        r = requests.get(f"https://www.theaudiodb.com/api/v1/json/{AUDIODB_KEY}/search.php",
                         params={"s": nome}, timeout=7)
        r.raise_for_status()
        artistas = r.json().get("artists") or []
    except (requests.RequestException, ValueError):
        return erro("Não foi possível consultar a AudioDB.", 502)

    dados = None
    if artistas:
        a = artistas[0]
        dados = {
            "nome": a.get("strArtist") or nome,
            "foto": https_ou_vazio(a.get("strArtistThumb")) or https_ou_vazio(a.get("strArtistFanart")),
            "pais": a.get("strCountry") or "",
            "ano": a.get("intFormedYear") or "",
            "genero": a.get("strGenre") or "",
            "estilo": a.get("strStyle") or "",
            "descricao": a.get("strBiographyPT") or a.get("strBiographyEN") or "",
        }
    with _cache_banda_lock:
        _cache_banda[chave] = dados
    return (jsonify(dados), 200) if dados else erro("Banda não encontrada.", 404)


# ---------------------------------------------------------------------
# Visualizações de faixas
# ---------------------------------------------------------------------
@api.post("/api/visualizacao")
def registrar_visualizacao():
    """Incrementa a contagem de visualizações de uma faixa.
    Corpo JSON: { t: título, a: artista, c: capa (opcional), u: url_prévia (opcional) }
    """
    d = corpo_json()
    titulo = str(d.get("t") or "").strip()[:300]
    artista = str(d.get("a") or "").strip()[:200]
    if not titulo or not artista:
        return erro("Título e artista são obrigatórios.", 400)
    capa = str(d.get("c") or "").strip()[:600]
    url = str(d.get("u") or "").strip()[:600]
    total = banco.incrementar_visualizacao(titulo, artista, capa, url)
    return jsonify({"ok": True, "visualizacoes": total})


@api.get("/api/mais-escutadas")
def mais_escutadas():
    """Retorna o top de músicas mais visualizadas.
    Parâmetro opcional: limit (1–50, padrão 10).
    """
    limite = min(max(request.args.get("limit", default=10, type=int), 1), 50)
    lista = banco.listar_mais_visualizadas(limite)
    return jsonify(lista)