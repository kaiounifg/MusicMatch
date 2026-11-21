# Site
https://kaiounifg.github.io/MusicMatch
```
# MusicMatch
 
Aplicação Desktop para Descoberta Musical com Integração de APIs
 
 Descrição
 
O MusicMatch é uma aplicação desktop desenvolvida em Python, criada para facilitar a descoberta de bandas e músicas. O usuário seleciona um gênero musical, e o sistema consulta a TheAudioDB para buscar a lista de bandas relacionadas, trazendo fotografias, país de origem, biografia e demais dados dos artistas.
 
Para cada banda encontrada, a aplicação faz uma requisição à iTunes Search API, que retorna as músicas e os trechos de áudio (previews) de aproximadamente 30 segundos, reproduzidos diretamente dentro do programa.
 
Também conta com um CRUD de usuários, permitindo que várias pessoas usem o mesmo computador com perfis independentes, cada um com seus favoritos, histórico de buscas e dados pessoais isolados.
 
 Fluxo Principal
 
plaintext
  
Usuário
   ↓
Login / Perfil
   ↓
Escolha do gênero musical
   ↓
TheAudioDB → Lista de bandas, fotos e informações
   ↓
iTunes Search API → Músicas + previews
   ↓
Exibição dos dados e reprodução dos trechos
 
 
 Funcionalidades
 
-  CRUD de usuários: criação, consulta, atualização e exclusão de contas
-  Perfis individuais: favoritos e histórico separados para cada usuário
-  Descoberta por gênero: busca de bandas pelo estilo musical escolhido
-  Pesquisa direta: procurar por uma banda específica
-  Perfil completo da banda: foto, nome, país e biografia
-  Reprodução de previews: trechos de aproximadamente 30 segundos
-  Lista de favoritos: salvar bandas preferidas
-  Histórico de pesquisas: visualizar buscas já realizadas
-  Descoberta aleatória: exibir uma banda sorteada
- Comparação de bandas: visualizar duas bandas lado a lado
-  Estatísticas por gênero: dados sobre países e décadas das bandas encontradas
 
Tecnologias Utilizadas
 
Tecnologia Finalidade 
Python Linguagem de desenvolvimento 
CustomTkinter Interface gráfica 
TheAudioDB API Dados, imagens e lista das bandas 
iTunes Search API Músicas e trechos de áudio 
VLC / Biblioteca de áudio Reprodução dos previews 
SQLite Banco de dados local (usuários, favoritos, histórico) 
 
📁 Estrutura Geral
 
plaintext
  
                    MUSICMATCH
                        │
             ┌──────────┴──────────┐
             │                     │
         Usuários                APIs
             │                     │
          CRUD              ┌──────┼──────┐
             │              │             │
        ┌────┴────┐    TheAudioDB   iTunes
        │         │
     Perfil A  Perfil B
        │         │
   Favoritos   Favoritos
   Histórico   Histórico
 
 
 Objetivo
 
O MusicMatch une integração com APIs, CRUD de usuários, banco de dados local, reprodução de mídia e interface gráfica, criando uma aplicação simples e personalizada para facilitar a descoberta de novas bandas e músicas.
 
 Pré-requisitos
 
- Python 3.x instalado
- Chaves de acesso para TheAudioDB e iTunes Search API
- Conexão com a internet para carregar os dados e reproduzir os previews
 
 Aviso
 
Este é um projeto acadêmico/educacional. Todas as imagens, informações e trechos de áudio são obtidos por meio de APIs públicas e pertencem aos seus respectivos proprietários.
