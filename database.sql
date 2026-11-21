-- BANCO DE DADOS DO APLICATIVO DE MÚSICA (MusicMatch) - PostgreSQL

CREATE TABLE usuarios (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    foto TEXT NOT NULL DEFAULT '',
    bio VARCHAR(140) NOT NULL DEFAULT '',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE artistas (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    biografia TEXT,
    imagem_url TEXT
);

CREATE TABLE albuns (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    artista_id BIGINT REFERENCES artistas(id),
    lancamento DATE,
    capa_url TEXT
);

CREATE TABLE musicas (
    id BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    album_id BIGINT REFERENCES albuns(id),
    artista_id BIGINT REFERENCES artistas(id),
    duracao_segundos INTEGER,
    audio_url TEXT NOT NULL,
    capa_url TEXT
);

CREATE TABLE usuario_generos (
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    genero     VARCHAR(50) NOT NULL,
    posicao    INTEGER NOT NULL,
    PRIMARY KEY (usuario_id, genero)
);

CREATE TABLE bandas_favoritas (
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    banda      VARCHAR(100) NOT NULL,
    posicao    INTEGER NOT NULL,
    PRIMARY KEY (usuario_id, banda)
);

CREATE TABLE bandas_salvas (
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    banda      VARCHAR(100) NOT NULL,
    posicao    INTEGER NOT NULL,
    PRIMARY KEY (usuario_id, banda)
);

CREATE TABLE playlists (
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    id         VARCHAR(40) NOT NULL,
    nome       VARCHAR(40) NOT NULL,
    posicao    INTEGER NOT NULL,
    PRIMARY KEY (usuario_id, id)
);

CREATE TABLE playlist_faixas (
    usuario_id  BIGINT NOT NULL,
    playlist_id VARCHAR(40) NOT NULL,
    posicao     INTEGER NOT NULL,
    titulo      TEXT NOT NULL,
    artista     TEXT NOT NULL,
    audio_url   TEXT NOT NULL DEFAULT '',
    capa_url    TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (usuario_id, playlist_id, posicao),
    FOREIGN KEY (usuario_id, playlist_id)
        REFERENCES playlists (usuario_id, id) ON DELETE CASCADE
);

CREATE TABLE historico (
    id         BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    banda      VARCHAR(100) NOT NULL,
    visto_em   BIGINT NOT NULL
);

-- Contador de visualizações por faixa (global, de todos os usuários)
CREATE TABLE visualizacoes (
    chave     TEXT PRIMARY KEY,          -- "titulo|artista" em minúsculas
    titulo    TEXT NOT NULL,
    artista   TEXT NOT NULL,
    capa      TEXT NOT NULL DEFAULT '',
    audio_url TEXT NOT NULL DEFAULT '',
    total     BIGINT NOT NULL DEFAULT 0
);