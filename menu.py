"""
MusicMatch - aplicação Flask.

Este arquivo monta o app (chave da sessão, cookies) e entrega a página.
As rotas da API ficam em api.py (Blueprint) e o banco em repositorio.py.

Como rodar:  uv run flask --app app run --debug
"""
import os

from dotenv import load_dotenv
from flask import Flask, render_template

load_dotenv()  # lê o arquivo .env (SECRET_KEY, DATABASE_URL, chaves de API)

from api import api  # noqa: E402  (precisa vir depois do load_dotenv)

app = Flask(__name__)

# Chave que assina o cookie de sessão. Em produção, defina SECRET_KEY no .env
# com um valor longo e aleatório. O valor abaixo é só para desenvolvimento.
CHAVE_PADRAO = "dev-troque-esta-chave"
app.secret_key = os.environ.get("SECRET_KEY", CHAVE_PADRAO)
if app.secret_key == CHAVE_PADRAO:
    app.logger.warning("SECRET_KEY não definida no .env: usando chave de desenvolvimento.")

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,    # o JavaScript não consegue ler o cookie
    SESSION_COOKIE_SAMESITE="Lax",   # o navegador não manda o cookie em pedidos de outros sites
)

app.register_blueprint(api)          # liga todas as rotas /api/... de api.py


@app.get("/")
def pagina_inicial():
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True)