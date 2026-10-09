/* Utilitaires partagés, aucune insertion de réponse utilisateur en HTML. */
'use strict';
const storageKey='wooc_token:'+new URL('.',location.href).pathname;
const W = window.W = {
 $: id => document.getElementById(id), csrf: '',
 node(tag, text, cls) { const el=document.createElement(tag); if(text!==undefined) el.textContent=text; if(cls) el.className=cls; return el; },
 status(message,error=false) { const el=this.$('status'); el.textContent=message; el.classList.toggle('error',error); },
 async api(action,data={},etag='') {
  const get=['state','screen','bootstrap'].includes(action);
  const opts=get?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,csrf:this.csrf,...data})};
  if(etag) opts.headers={'If-None-Match':etag};
  const url=get?'api.php?'+new URLSearchParams({action,...data}):'api.php';
  const controller=new AbortController(); opts.signal=controller.signal; const timer=setTimeout(()=>controller.abort(),12000);
  try { const r=await fetch(url,opts); if(r.status===304) return {unchanged:true,etag}; const value=await r.json(); if(!r.ok) throw new Error(value.error||'Demande refusée.'); return {...value,etag:r.headers.get('ETag')}; }
  catch(e) { if(e instanceof TypeError || e.name==='AbortError') throw new Error('Connexion perdue. Reconnexion automatique ; votre saisie est conservée.'); throw e; }
  finally {clearTimeout(timer);}
 },
 joinUrl(code) { const url=new URL('index.php',location.href); url.searchParams.set('s',code); return url.href; },
 qr(code) { const url=this.joinUrl(code); const qr=qrcode(0,'M'); qr.addData(url); qr.make(); const image=this.node('img'); image.src='data:image/gif;base64,'+qr.createDataURL(4).split(',')[1]; image.alt='QR code pour rejoindre l’atelier '+code; this.$('qr').replaceChildren(image); this.$('session-code').textContent=code; const link=this.$('join-url'); link.textContent=url; if(link.tagName==='A') link.href=url; },
 countdown(state) { const el=this.$('countdown'); if(el) el.textContent=state.open&&state.deadline?'Temps restant : '+Math.max(0,state.deadline-Math.floor(Date.now()/1000))+' s':''; },
 renderResults(container,q,r,moderate) {
  container.replaceChildren(); if(!q||!r) return;
  container.append(this.node('p',r.total+' réponse'+(r.total!==1?'s':'')));
  if(r.average!==null) container.append(this.node('h2','Moyenne : '+r.average.toFixed(2)+' / '+q.scale));
  if(q.type==='text') { const wall=this.node('div',undefined,'wall'); for(const item of r.items) { const card=this.node('article',item.text,'note'); if(moderate) { const b=this.node('button','Masquer'); b.onclick=()=>moderate(item.id); card.append(b); } wall.append(card); } container.append(wall); }
  else if(q.type==='cloud') { const cloud=this.node('div',undefined,'cloud'); const max=Math.max(1,...Object.values(r.counts)); for(const [word,n] of Object.entries(r.counts)) { const el=this.node('span',word+' ('+n+')','word level'+Math.max(1,Math.ceil(n/max*5))); cloud.append(el); } container.append(cloud); }
  else {
   const entries=q.type==='scale'?Array.from({length:q.scale},(_,i)=>[i+1,String(i+1)]):q.options.map((label,i)=>[i,label]);
   const denom=q.type==='points'?r.total*q.budget:r.total;
   for(const [i,label] of entries) { const n=r.counts[i]||0; const percent=denom?Math.round(n/denom*100):0; const bar=this.node('div',undefined,'bar'); bar.append(this.node('div',label+' — '+n+(q.type==='points'?' points':' votes')+' ('+percent+' %)'+(q.correct?.includes(i)?' ✓ Bonne réponse':''))); const progress=this.node('progress'); progress.max=100; progress.value=percent; progress.setAttribute('aria-label',label+' : '+percent+' %'); bar.append(progress); container.append(bar); }
  }
 }
};
if(document.body.dataset.role==='participant') {
 let code='',token='',state=null,etag='',timer=null,busy=false,lastId='',lastOpen=null,lastChange=null;
 try {token=localStorage.getItem(storageKey)||'';} catch(_) {}
 async function identity() {const r=await W.api('identity',{token}); token=r.token; try{localStorage.setItem(storageKey,token);}catch(_){} }
 function buildAnswer(s) {
  const target=W.$('answer'); target.replaceChildren(); const q=s.question;
  if(!q) return;
  if(!s.open) { target.append(W.node('p','Le vote est fermé. Attendez l’animateur.')); return; }
  if(s.answer!==null && !s.allow_change) {target.append(W.node('p','Votre réponse est enregistrée.','saved'));return;}
  const form=W.node('form'); const existing=s.answer; let pending=false;
  const inputs=[];
  if(['yesno','truefalse','single','poll'].includes(q.type)) {
   q.options.forEach((label,i)=> {const b=W.node('button',label+(existing===i?' ✓':'')); b.type='button'; b.onclick=()=>send(i,b); const box=W.node('div',undefined,'choice');box.append(b);form.append(box);});
  } else {
   if(q.type==='text'||q.type==='cloud') {const label=W.node('label','Votre réponse (80 caractères maximum)'); const input=W.node('input'); input.maxLength=80; input.value=existing||''; input.required=true; label.append(input); form.append(label); inputs.push(input);}
   else if(q.type==='multiple') q.options.forEach((label,i)=>{const l=W.node('label',undefined,'choice'); const input=W.node('input'); input.type='checkbox';input.value=i;input.checked=Array.isArray(existing)&&existing.includes(i);l.append(input,W.node('span',label)); form.append(l);inputs.push(input);});
   else if(q.type==='scale') {const label=W.node('label','Votre note');const select=W.node('select');for(let i=1;i<=q.scale;i++){const o=W.node('option',String(i));o.value=i;select.append(o);}select.value=existing||1;label.append(select);form.append(label);inputs.push(select);}
   else if(q.type==='points') {form.append(W.node('p','Répartissez exactement '+q.budget+' points.'));q.options.forEach((label,i)=>{const l=W.node('label',label);const input=W.node('input');input.type='number';input.min=0;input.max=q.budget;input.step=1;input.required=true;input.value=existing?.[i]||0;l.append(input);form.append(l);inputs.push(input);});}
   const button=W.node('button',existing===null?'Envoyer ma réponse':'Modifier ma réponse');form.append(button);
   form.onsubmit=e=>{e.preventDefault();let value;if(['text','cloud'].includes(q.type))value=inputs[0].value;else if(q.type==='multiple')value=inputs.filter(i=>i.checked).map(i=>Number(i.value));else if(q.type==='scale')value=Number(inputs[0].value);else value=inputs.map(i=>Number(i.value));send(value,button);};
  }
  async function send(value,button) {
   if(pending)return; pending=true;busy=true;button.disabled=true;W.status('Envoi en cours…');
   try {await W.api('vote',{code,token,question_id:q.id,value});W.status('Votre réponse est enregistrée. Vous pouvez la modifier si le vote reste ouvert.');etag='';const fresh=await W.api('state',{code});state=fresh;buildAnswer(fresh);}
   catch(e){W.status(e.message,true);}finally{pending=false;busy=false;button.disabled=false;}
  }
  target.append(form);
 }
 async function poll() {
  if(!code)return;
  try { const s=await W.api('state',{code},etag);if(!s.unchanged){etag=s.etag;state=s;W.$('session-title').textContent=s.title;W.$('question-title').textContent=s.question?.title||'En attente de l’animateur…';if(!busy&&(lastId!==(s.question?.id||'')||lastOpen!==s.open||lastChange!==s.allow_change)){buildAnswer(s);lastId=s.question?.id||'';lastOpen=s.open;lastChange=s.allow_change;}W.renderResults(W.$('results'),s.question,s.show?s.results:null);} }
  catch(e){W.status(e.message,true);} finally {timer=setTimeout(poll,state?.poll_ms||2000);}
 }
 W.$('join-form').onsubmit=async e=>{e.preventDefault();clearTimeout(timer);code=W.$('code').value.trim().toUpperCase();W.status('Connexion…');try{await identity();const s=await W.api('state',{code});state=s;W.$('join').hidden=true;W.$('live').hidden=false;lastId='';lastOpen=null,lastChange=null;etag='';W.status('Connecté à l’atelier.');poll();}catch(e){code='';W.status(e.message,true);}};
 W.$('leave').onclick=()=>{clearTimeout(timer);code='';W.$('join').hidden=false;W.$('live').hidden=true;};
 setInterval(()=>{if(state)W.countdown(state);},1000);
 const initial=new URLSearchParams(location.search).get('s');if(initial){W.$('code').value=initial;W.$('join-form').requestSubmit();}
}
