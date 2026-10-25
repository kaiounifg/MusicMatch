// Opcional: chave da YouTube Data API v3 (restrinja ao seu site no Google Cloud).
// Com a chave, o botão "Completa" toca a música inteira pelo YouTube para qualquer pessoa.
const YT_KEY="";
const LOGO="logo.webp";
const G={
"Rock":[["Queen","Reino Unido",1970,52,"Bohemian Rhapsody|Don't Stop Me Now"],["Foo Fighters","Estados Unidos",1994,20,"Everlong|The Pretender"],["Nirvana","Estados Unidos",1987,28,"Smells Like Teen Spirit|Come as You Are"],["Arctic Monkeys","Reino Unido",2002,30,"Do I Wanna Know?|R U Mine?"],["The Beatles","Reino Unido",1960,35,"Hey Jude|Let It Be"],["Led Zeppelin","Reino Unido",1968,32,"Stairway to Heaven|Whole Lotta Love"],["The Rolling Stones","Reino Unido",1962,22,"Paint It Black|(I Can't Get No) Satisfaction"]],
"Pop":[["ABBA","Suécia",1972,38,"Dancing Queen|Mamma Mia"],["Coldplay","Reino Unido",1996,70,"Yellow|Fix You"],["Imagine Dragons","Estados Unidos",2008,55,"Believer|Radioactive"],["Maroon 5","Estados Unidos",1994,45,"Sugar|Moves Like Jagger"],["Backstreet Boys","Estados Unidos",1993,14,"I Want It That Way|Everybody (Backstreet's Back)"],["Fleetwood Mac","Reino Unido",1967,22,"Dreams|Go Your Own Way"],["Spice Girls","Reino Unido",1994,6,"Wannabe|Spice Up Your Life"]],
"Jazz":[["Weather Report","Estados Unidos",1970,1,"Birdland|Teen Town"],["Dave Brubeck Quartet","Estados Unidos",1951,3,"Take Five|Blue Rondo à la Turk"],["Snarky Puppy","Estados Unidos",2004,1,"Lingus|Shofukan"],["Return to Forever","Estados Unidos",1971,1,"Spain|No Mystery"],["Pat Metheny Group","Estados Unidos",1977,1,"Last Train Home|Phase Dance"]],
"Eletrônica":[["Daft Punk","França",1993,27,"Around the World|One More Time"],["Kraftwerk","Alemanha",1970,5,"Autobahn|The Model"],["The Chemical Brothers","Reino Unido",1989,6,"Block Rockin' Beats|Galvanize"],["Justice","França",2003,5,"D.A.N.C.E.|Genesis"],["Depeche Mode","Reino Unido",1980,18,"Enjoy the Silence|Personal Jesus"],["Massive Attack","Reino Unido",1988,7,"Teardrop|Unfinished Sympathy"],["Underworld","Reino Unido",1980,2,"Born Slippy|Two Months Off"]],
"Hip hop":[["Run-D.M.C.","Estados Unidos",1981,3,"It's Tricky|Walk This Way"],["Public Enemy","Estados Unidos",1985,4,"Fight the Power|Bring the Noise"],["A Tribe Called Quest","Estados Unidos",1985,6,"Can I Kick It?|Scenario"],["Racionais MC's","Brasil",1988,4,"Diário de um Detento|Capítulo 4, Versículo 3"],["N.W.A","Estados Unidos",1986,8,"Straight Outta Compton|Express Yourself"],["Wu-Tang Clan","Estados Unidos",1992,9,"C.R.E.A.M.|Triumph"],["De La Soul","Estados Unidos",1988,3,"Me Myself and I|Eye Know"]],
"Metal":[["Metallica","Estados Unidos",1981,31,"Enter Sandman|One"],["Iron Maiden","Reino Unido",1975,14,"The Trooper|Run to the Hills"],["Black Sabbath","Reino Unido",1968,20,"Paranoid|Iron Man"],["Sepultura","Brasil",1984,6,"Roots Bloody Roots|Refuse/Resist"],["Slayer","Estados Unidos",1981,7,"Raining Blood|Angel of Death"],["Megadeth","Estados Unidos",1983,12,"Symphony of Destruction|Hangar 18"],["Pantera","Estados Unidos",1981,9,"Walk|Cowboys from Hell"]],
"Rock brasileiro":[["Legião Urbana","Brasil",1982,5,"Tempo Perdido|Pais e Filhos"],["Titãs","Brasil",1982,3,"Epitáfio|Comida"],["Os Mutantes","Brasil",1966,1,"A Minha Menina|Panis et Circenses"],["Nação Zumbi","Brasil",1991,1,"Maracatu Atômico|A Praieira"],["Os Paralamas do Sucesso","Brasil",1977,4,"Alagados|Meu Erro"],["Barão Vermelho","Brasil",1981,2,"Pro Dia Nascer Feliz|Bete Balanço"],["Charlie Brown Jr.","Brasil",1992,6,"Só os Loucos Sabem|Zóio de Lula"]],
"Reggae":[["Bob Marley & The Wailers","Jamaica",1963,25,"No Woman, No Cry|Is This Love"],["Steel Pulse","Reino Unido",1975,0.3,"Ku Klux Klan|Your House"],["Toots and the Maytals","Jamaica",1962,1,"Pressure Drop|54-46 Was My Number"],["UB40","Reino Unido",1978,3,"Red Red Wine|Can't Help Falling in Love"],["Burning Spear","Jamaica",1969,1,"Marcus Garvey|Slavery Days"],["Third World","Jamaica",1973,1,"Now That We Found Love|1865 (96° in the Shade)"],["Black Uhuru","Jamaica",1972,1,"Sinsemilla|Shine Eye Gal"]]};
const B=[];for(const g in G)G[g].forEach(([n,p,y,l,s])=>B.push({n,p,y,l,g,s:s.split("|")}));
const bn=n=>B.find(b=>b.n===n);
const $=s=>document.querySelector(s),app=$("#app");
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const lis=n=>n<1?Math.round(n*1000)+" mil":n.toFixed(n%1?1:0).replace(".",",")+" mi";
const hue=n=>180+[...n].reduce((a,c)=>a+c.charCodeAt(0),0)%100;
const tog=(a,x)=>{const i=a.indexOf(x);i<0?a.push(x):a.splice(i,1)};
const hash=async s=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,"0")).join("");
function load(){try{return JSON.parse(localStorage.getItem("mm"))||{u:[],a:null}}catch{return{u:[],a:null}}}
function save(){try{localStorage.setItem("mm",JSON.stringify(db))}catch{}}
function toast(s){const d=document.createElement("div");d.className="toast";d.textContent=s;d.setAttribute("role","status");document.body.append(d);setTimeout(()=>d.remove(),2200)}
let q="",db=load(),view="home",flt="Todos",tab="fav",authTab="login",addAcc=false,menu=false,md=null,openPl=null,gsel=new Set();
const me=()=>db.u.find(u=>u.id===db.a);
const au=new Audio();au.preload="none";
let ply=null,pid=0,sr=[],st="",tm=null;
const TR=[];const reg=t=>{let i=TR.findIndex(x=>x.t===t.t&&x.a===t.a);if(i<0)i=TR.push(t)-1;return i};
const trk=k=>k.n?{t:(bn(k.n)||{s:[]}).s[k.i]||"",a:k.n,u:"",c:""}:k;
const mmss=s=>isFinite(s)?Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0"):"0:00";
async function itu(term,n,attr){
  const r=await fetch("https://itunes.apple.com/search?media=music&entity=song&limit="+n+(attr?"&attribute="+attr:"")+"&term="+encodeURIComponent(term));
  if(!r.ok)throw 0;
  return(await r.json()).results.filter(x=>x.previewUrl).map(x=>({t:x.trackName,a:x.artistName,al:x.collectionName||"",c:(x.artworkUrl100||"").replace("100x100","200x200"),u:x.previewUrl,v:x.trackViewUrl}));
}
const PH={},fp=document.createElement("div");fp.id="fp";document.body.append(fp);
function syncFull(){
  const e=ply&&ply.mode==="full"&&ply.emb;
  if(!e){fp.style.display="none";if(fp.dataset.u){fp.dataset.u="";fp.innerHTML=""}return}
  fp.style.display="block";
  if(fp.dataset.u!==e.u){
    fp.dataset.u=e.u;fp.innerHTML="";
    const f=document.createElement("iframe");f.src=e.u;f.title="Player da música completa";
    f.allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write";
    if(e.k==="am")f.setAttribute("sandbox","allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation");
    fp.append(f);
  }
}
async function fullEmb(tk){
  if(YT_KEY){
    try{
      const r=await fetch("https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&videoCategoryId=10&maxResults=1&q="+encodeURIComponent(tk.a+" "+tk.t)+"&key="+YT_KEY);
      const j=await r.json(),v=j.items&&j.items[0];
      if(v)return{k:"yt",u:"https://www.youtube.com/embed/"+v.id.videoId+"?autoplay=1"};
    }catch{}
  }
  let v=tk.v;
  if(!v){const r=await itu(tk.a+" "+tk.t,5),f=tk.a.toLowerCase().split(" ")[0],x=r.find(y=>y.a.toLowerCase().includes(f))||r[0];v=x&&x.v;if(x&&!tk.u)tk.u=x.u}
  return v?{k:"am",u:v.replace("music.apple.com","embed.music.apple.com")}:null;
}
async function playT(tk,mode){
  const id=++pid,full=mode==="full";au.pause();
  ply={t:tk.t,a:tk.a,mode:full?"full":"30",on:false,msg:"",emb:tk.emb||null,tk};
  if(full){
    if(!ply.emb){
      ply.msg="Procurando a versão completa...";render();
      try{const e=await fullEmb(tk);if(id!==pid)return;tk.emb=e;ply.emb=e;ply.msg=e?"":"Não foi possível carregar a música completa."}
      catch{if(id!==pid)return;ply.msg="Não foi possível consultar o iTunes."}
    }
    render();return;
  }
  if(!tk.u){
    ply.msg="Buscando prévia...";render();
    try{const r=await itu(tk.a+" "+tk.t,5);if(id!==pid)return;const f=tk.a.toLowerCase().split(" ")[0],x=r.find(y=>y.a.toLowerCase().includes(f))||r[0];tk.u=x?x.u:"";if(x&&!tk.v)tk.v=x.v;ply.msg=tk.u?"":"Prévia não encontrada no iTunes."}
    catch{if(id!==pid)return;ply.msg="Não foi possível consultar o iTunes."}
  }
  if(!tk.u){render();return}
  au.src=tk.u;ply.msg="";
  try{await au.play()}catch{if(id!==pid)return;ply.msg="Não foi possível tocar. Clique em ▶."}
  if(id===pid)render();
}
function dz(n){
  return new Promise(res=>{
    const cb="dz"+Math.random().toString(36).slice(2),s=document.createElement("script");
    const end=u=>{delete window[cb];s.remove();clearTimeout(t);res(u)};
    const t=setTimeout(()=>end(""),6000);
    window[cb]=d=>{const a=d&&d.data&&d.data[0];end(a?(a.picture_xl||a.picture_big||""):"")};
    s.onerror=()=>end("");
    s.src="https://api.deezer.com/search/artist?limit=1&output=jsonp&callback="+cb+"&q="+encodeURIComponent(n);
    document.head.append(s);
  });
}
async function photo(n){
  let u=await dz(n);
  if(!u){try{const r=await itu(n,1,"artistTerm");u=r[0]?r[0].c:""}catch{}}
  return/^https:\/\/[^\s"')]+$/.test(u)?u:"";
}
function paint(n){
  const u=PH[n];if(!u)return;
  document.querySelectorAll(".cv[data-n]").forEach(e=>{if(e.dataset.n===n){e.classList.add("ph");e.style.backgroundImage="linear-gradient(180deg,#0000 35%,#000c),url("+u+")"}});
}
async function loadPh(){
  const names=[...new Set([...document.querySelectorAll(".cv[data-n]")].map(e=>e.dataset.n))].filter(n=>PH[n]===undefined);
  names.forEach(n=>PH[n]=null);
  let i=0;
  const work=async()=>{while(i<names.length){const n=names[i++];PH[n]=await photo(n);paint(n)}};
  await Promise.all([work(),work(),work(),work()]);
}
au.ontimeupdate=()=>upd();
au.onplay=()=>{if(ply){ply.on=true;upd()}};
au.onpause=()=>{if(ply){ply.on=false;upd()}};
au.onended=()=>{if(ply){ply.on=false;upd()}};
function upd(){const r=$("#pr");if(!r||!ply)return;const d=au.duration||30;r.max=d;r.value=au.currentTime;$("#pt").textContent=mmss(au.currentTime)+" / "+mmss(d);$("#pb").textContent=ply.on?"⏸":"▶"}
function playerBar(){
  if(!ply)return"";
  const f=ply.mode==="full",q2=encodeURIComponent(ply.a+" "+ply.t),d=au.duration||30,e=f&&ply.emb;
  const base=ply.msg?esc(ply.msg):e?(e.k==="yt"?"Música completa pelo YouTube":"Apple Music: entre na sua conta no player para ouvir inteira. Sem login, toca só 30 s"):f?"":"Prévia de 30 s via iTunes";
  const alt=f?`${base?" · ":""}ouça também no <a href="https://open.spotify.com/search/${q2}" target="_blank" rel="noopener">Spotify</a> ou no <a href="https://www.youtube.com/results?search_query=${q2}" target="_blank" rel="noopener">YouTube</a>`:"";
  const ctl=f?"":`<button class="btn ppb" id="pb" data-a="pp" aria-label="Tocar ou pausar">${ply.on?"⏸":"▶"}</button><div class="pm"><input type="range" id="pr" min="0" max="${d}" step="0.1" value="${au.currentTime||0}" aria-label="Progresso"><span class="m" id="pt">${mmss(au.currentTime)} / ${mmss(d)}</span></div>`;
  return `<div class="glass pbar${e?" f":""}" role="region" aria-label="Player"><div class="pi"><b>${esc(ply.t)}</b><span class="m">${esc(ply.a)}</span><span class="m">${base}${alt}</span></div>${ctl}<div class="seg" role="group" aria-label="Modo de reprodução"><button data-a="mode" data-m="30" aria-pressed="${!f}">30 s</button><button data-a="mode" data-m="full" aria-pressed="${f}">Completa</button></div><button class="chip" data-a="stop" aria-label="Fechar player">✕</button></div>`;
}
function srHtml(){
  const s=q.trim();if(s.length<2)return"";
  return `<h2 style="margin:28px 0 12px;font-size:20px">Músicas no iTunes</h2>${st?`<p class="m">${esc(st)}</p>`:""}${sr.length?`<div class="glass">${sr.map(tk=>{const k=reg(tk);return `<div class="li">${tk.c?`<img src="${esc(tk.c)}" alt="" width="44" height="44" style="border-radius:8px">`:""}<div style="flex:1;min-width:150px"><b>${esc(tk.t)}</b><p class="m">${esc(tk.a)}${tk.al?" · "+esc(tk.al):""}</p></div><button class="chip" data-a="play" data-k="${k}">▶ 30 s</button><button class="chip" data-a="play" data-k="${k}" data-m="full">▶ Completa</button><button class="chip" data-a="addpl" data-k="${k}">＋ Playlist</button></div>`}).join("")}</div>`:""}`;
}
function paintSr(){const e=$("#sr");if(e)e.innerHTML=srHtml()}
function srch(){
  clearTimeout(tm);const s=q.trim();
  if(s.length<2){sr=[];st="";paintSr();return}
  st="Buscando no iTunes...";sr=[];paintSr();
  tm=setTimeout(async()=>{
    try{const r=await itu(s,12);if(s!==q.trim())return;sr=r;st=r.length?"":"Nenhuma música encontrada no iTunes."}
    catch{sr=[];st="Não foi possível consultar o iTunes. Verifique a internet."}
    paintSr();
  },450);
}
async function loadTr(n){
  md.load=true;
  try{
    const r=await itu(n,25,"artistTerm"),f=n.toLowerCase().split(" ")[0],seen=new Set();
    const l=r.filter(x=>x.a.toLowerCase().includes(f)&&!seen.has(x.t.toLowerCase())&&seen.add(x.t.toLowerCase())).slice(0,10);
    if(md&&md.n===n){md.tr=l.length?l:null;md.load=false;render()}
  }catch{if(md&&md.n===n){md.load=false;render()}}
}
const av=(u,c="")=>u.foto?`<img class="av ${c}" src="${u.foto}" alt="">`:`<span class="av ${c}">${esc((u.nome.trim()[0]||"?").toUpperCase())}</span>`;
const logo=`<div class="lg"><img data-logo alt="" width="38" height="38"><span>Music<span class="g">Match</span></span></div>`;

function render(){
  const y=scrollY,u=me();
  if(!u||addAcc)auth();else if(!u.gen.length||view==="gen")gens(u);else shell(u);
  document.querySelectorAll("img[data-logo]").forEach(i=>i.src=LOGO);syncFull();loadPh();
  scrollTo(0,y);
}
function auth(){
  const r=authTab==="reg";
  app.innerHTML=`<main class="center"><div class="glass auth"><img data-logo class="biglogo" alt="Logo do MusicMatch"><h1>${r?"Criar conta":"Entrar"}</h1>
  <form id="af">${r?'<label>Nome<input name="nome" required maxlength="40" autocomplete="name"></label>':""}
  <label>E-mail<input name="email" type="email" required autocomplete="email"></label>
  <label>Senha<input name="pw" type="password" required minlength="6" autocomplete="${r?"new-password":"current-password"}"></label>
  <p class="err" id="err" role="alert"></p><button class="btn">${r?"Cadastrar":"Entrar"}</button></form>
  <p class="sw">${r?"Já tem conta?":"Novo por aqui?"} <a href="#" data-a="authtab">${r?"Entrar":"Criar conta"}</a>${addAcc?' · <a href="#" data-a="cancel">Cancelar</a>':""}</p>
  ${!r&&db.u.length?`<p class="m">Contas neste dispositivo</p><div class="chips" style="justify-content:center;margin:8px 0 0">${db.u.map(x=>`<button class="chip" data-a="pick" data-e="${esc(x.email)}">${esc(x.nome)}</button>`).join("")}</div>`:""}
  <p class="m" style="margin-top:16px">Demonstração: as contas ficam salvas apenas neste navegador.</p></div></main>`;
}
function gens(u){
  app.innerHTML=`<main class="w">${logo}<div class="hd" style="margin-top:28px"><div><h1>${u.gen.length?"Seus gêneros":"Escolha seus gêneros"}</h1><p class="m">Escolha ao menos um. Você pode mudar depois.</p></div>${u.gen.length?'<button class="btn o" data-a="gback">Voltar</button>':""}</div>
  <div class="gg">${Object.keys(G).map(g=>`<button class="glass gc" data-a="gt" data-g="${esc(g)}" aria-pressed="${gsel.has(g)}"><b>${esc(g)}</b><span class="m">${G[g].length} bandas</span></button>`).join("")}</div>
  <p style="margin-top:24px"><button class="btn" data-a="gsave" ${gsel.size?"":"disabled"}>${u.gen.length?"Salvar":"Continuar"} (${gsel.size})</button></p></main>`;
}
function shell(u){
  const nav=[["home","Início"],["lib","Biblioteca"],["pl","Playlists"],["hist","Histórico"],["prof","Perfil"]];
  const others=db.u.filter(x=>x.id!==u.id);
  app.innerHTML=`<header class="top">${logo}<nav class="nav" aria-label="Principal">${nav.map(([v,l])=>`<button class="nv" data-a="nav" data-v="${v}" ${view===v?'aria-current="page"':""}>${l}</button>`).join("")}</nav>
  <div class="me"><button class="avb" data-a="menu" aria-label="Menu da conta" aria-expanded="${menu}">${av(u)}</button>
  ${menu?`<div class="glass pop"><div class="row">${av(u)}<span><b>${esc(u.nome)}</b><small>${esc(u.email)}</small></span></div>
  ${others.length?`<hr><h4>Trocar de conta</h4>${others.map(x=>`<button class="row" data-a="switch" data-id="${x.id}">${av(x)}<span><b>${esc(x.nome)}</b><small>${esc(x.email)}</small></span></button>`).join("")}`:""}
  <hr><button class="row" data-a="addacc">＋ Adicionar outra conta</button><button class="row" data-a="logout">Sair da conta</button></div>`:""}</div></header>
  <main class="w" ${ply?`style="padding-bottom:${ply.mode==="full"&&ply.emb?380:170}px"`:""}>${page(u)}</main>${md?mdHtml(u):""}${playerBar()}`;
}
function page(u){return{home,lib,pl:pls,hist,prof}[view](u)}
const acts=(b,u)=>{const f=u.fav.includes(b.n),s=u.sav.includes(b.n),n=esc(b.n);return `<button data-a="fav" data-n="${n}" aria-pressed="${f}">♥ ${f?"Favorita":"Favoritar"}</button><button data-a="sav" data-n="${n}" aria-pressed="${s}">${s?"✓ Salva":"＋ Salvar"}</button><button data-a="open" data-n="${n}">♪ Músicas</button>`};
const card=(b,u)=>`<article class="glass bc"><button class="cv${PH[b.n]?" ph":""}" style="--h:${hue(b.n)}${PH[b.n]?`;background-image:linear-gradient(180deg,#0000 35%,#000c),url(${PH[b.n]})`:""}" data-a="open" data-n="${esc(b.n)}">${esc(b.n)}</button><div class="bi"><h3>${esc(b.n)}</h3><p class="m">${b.g} · ${b.p}</p><p class="m">Fundada em <b>${b.y}</b> · <b>${lis(b.l)}</b> de ouvintes</p><p class="s">♪ ${esc(b.s[0])}</p><div class="ac">${acts(b,u)}</div></div></article>`;
const gl=u=>{const s=q.trim().toLowerCase();return s?B.filter(b=>b.n.toLowerCase().includes(s)):B.filter(b=>u.gen.includes(b.g)&&(flt==="Todos"||b.g===flt))};
const gh=u=>{const l=gl(u);return l.length?l.map(b=>card(b,u)).join(""):'<p class="m">Nenhuma banda encontrada no catálogo do site.</p>'};
function home(u){
  
  return `<div class="hd"><div><h1>Olá, ${esc(u.nome.split(" ")[0])}</h1><p class="m">Bandas e músicas sugeridas para você. Números de ouvintes são valores de exemplo.</p></div><button class="btn o" data-a="moregen">＋ Adicionar gêneros</button></div>
  <input id="q" type="search" placeholder="Pesquisar banda ou música (catálogo do site e iTunes)" aria-label="Pesquisar banda" value="${esc(q)}" style="margin:0 0 16px"><div class="chips">${["Todos",...u.gen].map(g=>`<button class="chip" data-a="flt" data-g="${esc(g)}" aria-pressed="${flt===g}">${esc(g)}</button>`).join("")}</div>
  <div class="grid" id="gr">${gh(u)}</div><div id="sr">${srHtml()}</div>`;
}
function lib(u){
  const l=(tab==="fav"?u.fav:u.sav).map(bn).filter(Boolean);
  return `<h1>Biblioteca</h1><div class="chips" style="margin:16px 0">${[["fav","♥ Favoritos",u.fav],["sav","Salvos",u.sav]].map(([t,s,a])=>`<button class="chip" data-a="tab" data-t="${t}" aria-pressed="${tab===t}">${s} (${a.length})</button>`).join("")}</div>
  ${l.length?`<div class="grid">${l.map(b=>card(b,u)).join("")}</div>`:'<p class="m">Nada por aqui ainda. Use Favoritar ou Salvar nas bandas da tela inicial.</p>'}`;
}
function pls(u){
  const p=openPl&&u.pl.find(x=>x.id===openPl);
  if(p)return `<div class="hd"><div><button class="lk" data-a="plback">← Playlists</button><h1>${esc(p.nome)}</h1><p class="m">${p.t.length} músicas</p></div><button class="btn o" data-a="pldel" data-id="${p.id}">Excluir playlist</button></div>
  <div class="glass">${p.t.length?p.t.map((k0,j)=>{const k=trk(k0),b=bn(k.a),id=reg(k);return `<div class="li"><div style="flex:1"><b>${esc(k.t)}</b><p class="m">${esc(k.a)}${b?` · fundada em ${b.y} · ${lis(b.l)} de ouvintes`:""}</p></div><button class="chip" data-a="play" data-k="${id}">▶ 30 s</button><button class="chip" data-a="play" data-k="${id}" data-m="full">▶ Completa</button><button class="chip" data-a="trkdel" data-j="${j}">Remover</button></div>`}).join(""):'<p class="li m">Playlist vazia. Adicione músicas pelas bandas.</p>'}</div>`;
  return `<h1>Playlists</h1><form id="npl" class="hd" style="margin:16px 0"><input name="nome" placeholder="Nome da nova playlist" required maxlength="40" aria-label="Nome da playlist"><button class="btn">Criar playlist</button></form>
  ${u.pl.length?`<div class="grid">${u.pl.map(p=>`<button class="glass pc" data-a="plopen" data-id="${p.id}"><b>${esc(p.nome)}</b><span class="m">${p.t.length} músicas</span></button>`).join("")}</div>`:'<p class="m">Você ainda não criou playlists.</p>'}`;
}
function hist(u){
  return `<div class="hd"><h1>Histórico</h1>${u.hist.length?'<button class="btn o" data-a="hclr">Limpar histórico</button>':""}</div>
  ${u.hist.length?`<div class="glass">${u.hist.map(h=>{const b=bn(h.n);return b?`<div class="li"><div style="flex:1"><b>${esc(b.n)}</b><p class="m">${b.g} · fundada em ${b.y} · visto em ${new Date(h.t).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})}</p></div><button class="chip" data-a="open" data-n="${esc(b.n)}">Abrir</button></div>`:""}).join("")}</div>`:'<p class="m">Você ainda não abriu nenhuma banda.</p>'}`;
}
function prof(u){
  return `<h1>Perfil</h1><div class="glass pfc"><div class="phr">${av(u,"l")}<div><label class="btn o up">Alterar foto<input id="ph" type="file" accept="image/*" hidden></label>${u.foto?'<button class="lk" data-a="phrm">Remover foto</button>':""}</div></div>
  <form id="pf"><label>Nome<input name="nome" value="${esc(u.nome)}" required maxlength="40"></label><label>E-mail<input name="email" type="email" value="${esc(u.email)}" required></label>
  <label>Bio<textarea name="bio" rows="3" maxlength="140">${esc(u.bio)}</textarea></label><label>Nova senha (opcional)<input name="pw" type="password" minlength="6" autocomplete="new-password"></label>
  <p class="err" id="err" role="alert"></p><button class="btn">Salvar alterações</button></form>
  <h3>Gêneros</h3><div class="chips">${u.gen.map(g=>`<span class="chip">${esc(g)}</span>`).join("")}</div><button class="btn o" data-a="moregen">Editar gêneros</button>
  <h3>Excluir conta</h3><p class="m">Apaga seu perfil, favoritos, playlists e histórico.</p><button class="btn d" data-a="delask">Excluir minha conta</button></div>`;
}
function mdHtml(u){
  const b=md.n&&bn(md.n);let h="";
  if(md.t==="band"){
    const tl=md.tr||b.s.map(s=>({t:s,a:b.n,u:""}));
    h=`${PH[b.n]?`<img src="${PH[b.n]}" alt="" style="width:100%;height:150px;object-fit:cover;border-radius:14px;margin-bottom:12px">`:""}<h2>${esc(b.n)}</h2><p class="m">${b.g} · ${b.p}</p><div class="st"><div><b class="g">${b.y}</b><span>Ano de fundação</span></div><div><b class="g">${lis(b.l)}</b><span>Ouvintes</span></div></div><h3>${md.tr?"Músicas do iTunes":"Músicas populares"}</h3>${tl.map(tk=>{const k=reg(tk);return `<div class="li" style="padding-left:0">${tk.c?`<img src="${esc(tk.c)}" alt="" width="40" height="40" style="border-radius:8px">`:""}<span style="flex:1;min-width:140px">♪ ${esc(tk.t)}</span><button class="chip" data-a="play" data-k="${k}">▶ 30 s</button><button class="chip" data-a="play" data-k="${k}" data-m="full">▶ Completa</button><button class="chip" data-a="addpl" data-k="${k}">＋ Playlist</button></div>`}).join("")}${md.load?'<p class="m">Carregando músicas do iTunes...</p>':""}<div class="ac">${acts(b,u)}</div>`;
  }else if(md.t==="pl"){
    const tk=TR[md.k];
    h=`<h2>Adicionar à playlist</h2><p class="m">♪ ${esc(tk.t)} · ${esc(tk.a)}</p>${u.pl.map(p=>`<button class="li rowb" data-a="doadd" data-id="${p.id}">${esc(p.nome)}<span class="m">${p.t.length} músicas</span></button>`).join("")}<div class="hd" style="margin:14px 0 0"><input id="np" placeholder="Nova playlist" maxlength="40" aria-label="Nova playlist"><button class="btn" data-a="newadd">Criar e adicionar</button></div>`;
  }else h=`<h2>Excluir conta?</h2><p class="m">Seu perfil, favoritos, playlists e histórico serão apagados neste navegador. Isso não pode ser desfeito.</p><div class="ac"><button class="btn o" data-a="close">Cancelar</button><button class="btn d" data-a="delyes">Excluir definitivamente</button></div>`;
  return `<div class="ov" data-a="ov"><div class="glass md" role="dialog" aria-modal="true">${h}<button class="x" data-a="close" aria-label="Fechar">✕</button></div></div>`;
}
app.addEventListener("click",e=>{
  const t=e.target.closest("[data-a]");
  if(!t){if(menu){menu=false;render()}return}
  if(t.tagName==="A")e.preventDefault();
  const a=t.dataset.a,d=t.dataset,u=me();
  if(a==="ov"&&e.target!==t)return;
  if(a==="pick"){$("[name=email]").value=d.e;$("[name=pw]").focus();return}
  if(a==="menu")menu=!menu;
  else if(a==="nav"){view=d.v;openPl=null;menu=false;md=null;scrollTo(0,0)}
  else if(a==="authtab")authTab=authTab==="reg"?"login":"reg";
  else if(a==="cancel")addAcc=false;
  else if(a==="flt")flt=d.g;
  else if(a==="tab")tab=d.t;
  else if(a==="fav")tog(u.fav,d.n);
  else if(a==="sav")tog(u.sav,d.n);
  else if(a==="open"){if(!u.hist[0]||u.hist[0].n!==d.n)u.hist.unshift({n:d.n,t:Date.now()});u.hist.length=Math.min(u.hist.length,60);md={t:"band",n:d.n};loadTr(d.n)}
  else if(a==="addpl")md={t:"pl",k:+d.k};
  else if(a==="ov"||a==="close")md=null;
  else if(a==="play"){md=null;playT(TR[+d.k],d.m)}
  else if(a==="pp"){if(au.paused)au.play().catch(()=>{});else au.pause()}
  else if(a==="mode")playT(ply.tk,d.m);
  else if(a==="stop"){pid++;au.pause();ply=null}
  else if(a==="doadd"){const p=u.pl.find(x=>x.id===d.id),tk=TR[md.k];if(!p.t.some(k=>trk(k).t===tk.t&&trk(k).a===tk.a))p.t.push({t:tk.t,a:tk.a,u:tk.u||"",c:tk.c||""});toast("Adicionada a “"+p.nome+"”");md=null}
  else if(a==="newadd"){const v=$("#np").value.trim();if(!v)return;const tk=TR[md.k];u.pl.push({id:Date.now().toString(36),nome:v,t:[{t:tk.t,a:tk.a,u:tk.u||"",c:tk.c||""}]});toast("Playlist “"+v+"” criada");md=null}
  else if(a==="plopen")openPl=d.id;
  else if(a==="plback")openPl=null;
  else if(a==="pldel"){u.pl=u.pl.filter(x=>x.id!==d.id);openPl=null;toast("Playlist excluída")}
  else if(a==="trkdel")u.pl.find(x=>x.id===openPl).t.splice(+d.j,1);
  else if(a==="hclr")u.hist=[];
  else if(a==="phrm")u.foto="";
  else if(a==="moregen"){gsel=new Set(u.gen);view="gen";menu=false}
  else if(a==="gt")gsel.has(d.g)?gsel.delete(d.g):gsel.add(d.g);
  else if(a==="gsave"){if(!gsel.size)return;u.gen=[...gsel];if(!u.gen.includes(flt))flt="Todos";view="home"}
  else if(a==="gback")view="home";
  else if(a==="switch"){db.a=d.id;view="home";flt="Todos";menu=false;openPl=null}
  else if(a==="addacc"){addAcc=true;authTab="login";menu=false}
  else if(a==="logout"){pid++;au.pause();ply=null;db.a=null;addAcc=false;authTab="login";menu=false}
  else if(a==="delask")md={t:"del"};
  else if(a==="delyes"){db.u=db.u.filter(x=>x.id!==u.id);db.a=null;md=null;view="home";authTab="login"}
  save();render();
});
app.addEventListener("submit",async e=>{
  e.preventDefault();
  const f=e.target.id,d=Object.fromEntries(new FormData(e.target)),err=m=>{$("#err").textContent=m};
  if(f==="af"){
    const em=d.email.trim().toLowerCase(),h=await hash(d.pw);
    if(authTab==="reg"){
      if(db.u.some(x=>x.email===em))return err("Este e-mail já está cadastrado.");
      const u={id:Date.now().toString(36),nome:d.nome.trim(),email:em,pw:h,foto:"",bio:"",gen:[],fav:[],sav:[],pl:[],hist:[]};
      db.u.push(u);db.a=u.id;gsel=new Set();
    }else{
      const u=db.u.find(x=>x.email===em&&x.pw===h);
      if(!u)return err("E-mail ou senha incorretos.");
      db.a=u.id;
    }
    addAcc=false;view="home";flt="Todos";
  }else if(f==="pf"){
    const u=me(),em=d.email.trim().toLowerCase();
    if(db.u.some(x=>x.email===em&&x.id!==u.id))return err("Este e-mail já está em uso.");
    Object.assign(u,{nome:d.nome.trim(),email:em,bio:d.bio.trim()});
    if(d.pw)u.pw=await hash(d.pw);
    toast("Perfil atualizado");
  }else if(f==="npl")me().pl.push({id:Date.now().toString(36),nome:d.nome.trim(),t:[]});
  save();render();
});
app.addEventListener("change",e=>{
  if(e.target.id!=="ph"||!e.target.files[0])return;
  const r=new FileReader();
  r.onload=()=>{const i=new Image();i.onload=()=>{const c=document.createElement("canvas"),s=200,x=Math.min(i.width,i.height);c.width=c.height=s;c.getContext("2d").drawImage(i,(i.width-x)/2,(i.height-x)/2,x,x,0,0,s,s);me().foto=c.toDataURL("image/jpeg",.85);save();render();toast("Foto atualizada")};i.src=r.result};
  r.readAsDataURL(e.target.files[0]);
});
app.addEventListener("input",e=>{if(e.target.id==="q"){q=e.target.value;$("#gr").innerHTML=gh(me());srch()}else if(e.target.id==="pr"&&ply){au.currentTime=+e.target.value}});
addEventListener("keydown",e=>{if(e.key==="Escape"&&(md||menu)){md=null;menu=false;render()}});
render();
