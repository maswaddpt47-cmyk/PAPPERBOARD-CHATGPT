'use strict';
let state=null,etag='';
const code=(new URLSearchParams(location.search).get('s')||'').toUpperCase();
if(code)W.qr(code);else W.status('Ouvrez la projection depuis votre atelier.',true);
W.$('theme').onclick=()=>document.body.classList.toggle('dark');
W.$('fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>W.status('Le plein écran est indisponible.',true));};
async function pollScreen(){try{const s=await W.api('screen',{code},etag);if(!s.unchanged){state=s;etag=s.etag;W.$('session-title').textContent=s.title;W.$('question-title').textContent=s.question?.title||'L’atelier va commencer…';W.$('vote-state').textContent=s.open?'À vous de répondre !':'Votes fermés';W.renderResults(W.$('results'),s.question,s.show?s.results:null);W.status('');}}catch(e){W.status(e.message,true);}finally{setTimeout(pollScreen,state?.poll_ms||2000);}}
if(code)pollScreen();setInterval(()=>{if(state)W.countdown(state);},1000);
