# Site
https://kaiounifg.github.io/MusicMatch/
```
pip freeze > requirements.txt
```

MusicMatch
 
Aplicação desktop para descoberta musical utilizando Inteligência Artificial e integração de APIs
 
 
 
 Descrição
 
O MusicMatch é uma aplicação desktop desenvolvida em Python com o objetivo de facilitar a descoberta de bandas e músicas a partir dos gêneros musicais escolhidos pelo usuário.
 
O usuário seleciona um gênero musical e a aplicação utiliza a API do Gemini para gerar uma lista de bandas relacionadas. A partir dessa lista, a TheAudioDB é consultada para obter fotos, gênero, país, biografia e outras informações. Para cada banda, a iTunes Search API retorna músicas e trechos de aproximadamente 30 segundos, que podem ser reproduzidos diretamente no aplicativo.
 
O sistema também conta com um CRUD de usuários, permitindo que diferentes pessoas usem o mesmo computador com perfis independentes — cada usuário mantém seus favoritos, histórico e dados pessoais de forma isolada.
 
 
 
 Fluxo Principal
 
plaintext
  
Usuário
   ↓
Login / Perfil
   ↓
Escolha de gênero
   ↓
Gemini API → Lista de bandas
   ↓
TheAudioDB → Fotos + informações
   ↓
iTunes Search API → Músicas + previews
   ↓
Exibição e reprodução
 
 
 
  Funcionalidades
 
-  CRUD de usuários — criação, consulta, atualização e exclusão de contas
-  Perfis individuais — dados, favoritos e histórico separados por usuário
-  Descoberta por gênero — lista de bandas sugeridas por IA conforme o estilo escolhido
-  Perfil completo da banda — foto, nome, gênero, país, biografia
-  Pesquisa direta — busca por bandas específicas
-  Reprodução de previews — trechos de ~30s dentro da aplicação
-  Favoritos — salve suas bandas preferidas
-  Histórico — acompanhe o que você já pesquisou
-  Descoberta aleatória — surpreenda-se com uma banda sugerida
-  Comparação de bandas — veja duas bandas lado a lado
-  Estatísticas do gênero — países, décadas e dados das bandas encontradas
 
 
 
 Tecnologias Utilizadas
 
Tecnologia Finalidade 
Python Linguagem de desenvolvimento 
CustomTkinter Interface gráfica moderna 
Gemini API Geração de sugestões de bandas 
TheAudioDB API Informações e imagens das bandas 
iTunes Search API Músicas e trechos de áudio 
VLC / biblioteca de áudio Reprodução dos previews 
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
             │              │      │      │
        ┌────┴────┐       Gemini  AudioDB iTunes
        │         │
     Perfil A  Perfil B
        │         │
   Favoritos   Favoritos
   Histórico   Histórico
 
 
 
 
 Objetivo
 
O MusicMatch alia consumo de APIs, inteligência artificial, gerenciamento de dados com CRUD, banco de dados local, reprodução de mídia e desenvolvimento de interface em uma única aplicação acessível e personalizada, focada em tornar a descoberta de novas bandas mais simples e prazerosa.
 
 
 
 Pré-requisitos
 
- Python 3.x instalado
- Chaves de acesso para as APIs utilizadas (Gemini, TheAudioDB, iTunes Search API)
- Conexão com a internet para busca de dados e reprodução dos previews
 
 
  Nota: Este é um projeto acadêmico/educacional. As imagens, informações e trechos de áudio são obtidos de APIs públicas e pertencem aos seus respectivos proprietários.
 
 
