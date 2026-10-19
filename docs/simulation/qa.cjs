const fs=require('fs'),vm=require('vm'),assert=require('assert');
const listeners={},elements=new Map(),memory=new Map();
function element(id=''){return {id,dataset:{},innerHTML:'',textContent:'',open:false,hidden:false,isConnected:true,disabled:false,value:'',attrs:{},classList:{toggle(){},add(){},remove(){},contains(){return false}},setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]||null},removeAttribute(k){delete this.attrs[k]},addEventListener(k,fn){(this.events||(this.events={}))[k]=fn},remove(){this.isConnected=false},appendChild(){},click(){},focus(){document.activeElement=this},showModal(){this.open=true},close(){this.open=false},getBoundingClientRect(){return {left:0,top:0,right:1000,bottom:1000}},querySelector(){return null},querySelectorAll(){return []},closest(){return null}};}
const nav=['overview','workshop','library','history'].map(n=>{const e=element();e.dataset.nav=n;return e});
const document={activeElement:null,body:element('body'),getElementById(id){if(!elements.has(id))elements.set(id,element(id));return elements.get(id)},querySelectorAll(sel){return sel==='[data-nav]'?nav:[]},querySelector(sel){if(sel.startsWith('#'))return document.getElementById(sel.slice(1));return null},createElement(){return element()},addEventListener(k,fn){(listeners[k]||(listeners[k]=[])).push(fn)}};
document.activeElement=element('start');
const sandbox={document,window:{icon:()=>'<svg class="icon"></svg>'},localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},setTimeout:()=>1,clearTimeout(){},confirm:()=>true,Blob,URL:{createObjectURL:()=> 'blob:demo',revokeObjectURL(){}},FormData:class{constructor(form){this.data=form.values}get(k){return this.data[k]??null}},console};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(__dirname+'/../../assets/qrcode.js','utf8'),sandbox);
sandbox.window.document=document;
vm.runInContext(fs.readFileSync(__dirname+'/preparation-tools.js','utf8'),sandbox);
let source=fs.readFileSync(__dirname+'/app.js','utf8');
source=source.replace(/\}\(\)\);\s*$/, 'globalThis.__test={state:()=>state,workshops:()=>allWorkshops(),dialogHtml:()=>dialog&&dialog.innerHTML,validState,readState,answers,fixture,recordAnswer,render,esc,csvCell,projection,gallerySlides,resultGallery};}());');
vm.runInContext(source,sandbox);const app=sandbox.__test;
let tests=0;function test(label,fn){fn();tests++;console.log('OK '+label)}
function action(name,data={}){const e=element();e.dataset={action:name,...data};e.closest=sel=>sel==='[data-action]'?e:null;(listeners.click||[]).forEach(fn=>fn({target:e}));}
function submit(form){(listeners.submit||[]).forEach(fn=>fn({target:form,preventDefault(){}}));}
test('Préparer ouvre les huit questions sans proposer un import après création',()=>{assert.equal(app.state().questions.length,8);assert.equal(app.state().current,1);assert(!elements.get('workspace').innerHTML.includes('data-action="prep-import"'));action('tab',{tab:'live'});assert(elements.get('workspace').innerHTML.includes('Fermer le vote'));});
test('Les graphes Oui/Non et QCM multiples reprennent les réponses fictives',()=>{const fixture=app.fixture('scams');const binary=fixture.questions[6],multi=fixture.questions[7];assert(app.answers(binary,false).includes('donut-chart'));assert(app.answers(binary,false).includes('67 %'));assert(app.answers(multi,false).includes('58 %'));assert(app.answers(multi,false).includes('83 %'));assert.equal((app.answers(multi,false).match(/is-correct/g)||[]).length,2);});
test('La projection permet de publier puis masquer le graphe',()=>{const q=app.state().questions[1];q.responses=14;q.state='open';q.published=false;app.projection();action('projection-toggle-results');assert.equal(q.published,true);action('projection-toggle-results');assert.equal(q.published,false);});
test('La galerie couvre chaque forme de graphe et de résultat',()=>{const slides=app.gallerySlides();assert.equal(slides.length,12);assert(slides.some(slide=>slide.label==='Nuage de mots'));assert(slides.some(slide=>slide.label==='Post-it'));assert(slides.some(slide=>slide.label==='Gommettes'));app.resultGallery();action('gallery-next');action('result-gallery');});
test('Une simulation alimente le graphique et le compteur',()=>{action('simulate');assert.equal(app.state().questions[1].responses,15);assert.equal(app.state().questions[1].counts.reduce((a,b)=>a+b),15)});
test('Un vote fermé refuse les nouvelles réponses',()=>{action('toggle-vote');const q=app.state().questions[1];assert.equal(q.state,'closed');assert.equal(app.recordAnswer(q,[1],''),false);assert.equal(q.responses,15)});
test('La publication contrôle réellement les résultats publics',()=>{const q=app.state().questions[1];assert(app.answers(q,true).includes('restent masqués'));action('toggle-results');assert(!app.answers(q,true).includes('restent masqués'));assert(app.answers(q,true).includes('answer-fill'));action('toggle-results');});
test('La préparation permet d’ajouter une question échelle',()=>{action('tab',{tab:'prep'});const form={id:'question-form',dataset:{index:''},values:{type:'scale',title:'Mon niveau de confiance',description:'De 1 à 5',options:'',correct:'1',explanation:''}};submit(form);assert.equal(app.state().questions.length,9);const q=app.state().questions[8];assert.equal(q.options.length,5);assert.equal(q.responses,0);assert.equal(q.state,'draft')});
test('La validation refuse les questions sans choix',()=>{const form={id:'question-form',dataset:{index:''},values:{type:'poll',title:'Question incomplète',description:'',options:'',correct:'1'}};submit(form);assert.equal(app.state().questions.length,9);assert(elements.get('question-error').textContent.includes('2 à 10'))});
test('Le réordonnancement conserve la question courante',()=>{const id=app.state().questions[app.state().current].id;action('move-down',{index:'1'});assert.equal(app.state().questions[app.state().current].id,id);assert.equal(app.state().current,2)});
test('Une réponse participant est enregistrée puis le formulaire remplacé',()=>{action('toggle-vote');const q=app.state().questions[app.state().current];const prev=q.responses;const form={id:'participant-form',querySelectorAll(){return [{value:'2'}]},querySelector(){return null}};submit(form);assert.equal(q.responses,prev+1)});
test('Les questions à étapes comptent une personne et plusieurs étapes',()=>{const q=app.fixture('scams').questions[4];q.state='open';assert(app.recordAnswer(q,[0,2],''));assert.equal(q.responses,1);assert.equal(q.counts[0],1);assert.equal(q.counts[2],1);assert.equal(q.counts[1],0)});
test('Les réponses libres et titres ne produisent pas de HTML injecté',()=>{const q=app.fixture('scams').questions[5];q.state='open';app.recordAnswer(q,[],'<img src=x onerror=alert(1)>');const html=app.answers(q,false);assert(html.includes('&lt;img'));assert(!html.includes('<img'))});
test('La capacité limite les réponses à dix-huit',()=>{const q=app.state().questions[app.state().current];while(q.responses<18)app.recordAnswer(q,[0],'');assert.equal(app.recordAnswer(q,[0],''),false);assert.equal(q.responses,18)});
test('La fin d’atelier ferme les votes et la réouverture fonctionne',()=>{action('end-session');assert(app.state().ended);assert(app.state().questions.every(q=>q.state!=='open'));action('end-session');assert(!app.state().ended)});
test('Les formules CSV sont neutralisées et les guillemets échappés',()=>{assert(app.csvCell('=1+1').startsWith('"\''));assert(app.csvCell('  +1').startsWith('"\''));assert.equal(app.csvCell('a"b'),'"a""b"')});
test('La bibliothèque charge une séance complète dans l’essai local',()=>{action('load-library',{id:'phone'});assert(app.state().title.includes('smartphone'));assert.equal(app.state().questions.length,8);assert(elements.get('workspace').innerHTML.includes('Le déroulé'))});
test('La persistance reste limitée aux clés propres à la simulation',()=>{assert(memory.has('wl_sandbox_v3'));assert([...memory.keys()].every(key=>['wl_sandbox_v3','wl_sandbox_workshops_v1'].includes(key)));JSON.parse(memory.get('wl_sandbox_v3'))});
test('Changer de question remet la vue au début, avec les deux sens et la liste',()=>{
  action('tab',{tab:'live'});
  const panel=document.getElementById('current-question');
  const scrolls=[];
  panel.scrollIntoView=options=>scrolls.push(options.block);
  const initial=app.state().current;
  action('next');assert.equal(app.state().current,initial+1);
  action('previous');assert.equal(app.state().current,initial);
  action('select-question',{index:'4'});assert.equal(app.state().current,4);
  assert.deepEqual(scrolls,['start','start','start']);
});
test('Créer un atelier vide conserve le précédent et passe à l’ajout manuel',()=>{
  action('close-dialog');
  const previous=JSON.parse(JSON.stringify(app.state()));
  action('create-workshop');
  submit({id:'workshop-form',values:{title:'Mon nouvel atelier'}});
  const state=app.state();
  assert.equal(state.title,'Mon nouvel atelier');assert.equal(state.questions.length,0);
  assert.equal(state.current,0);assert.equal(state.participants,0);assert(app.validState(state));
  assert.equal(app.readState().title,state.title);
  const saved=JSON.parse(memory.get('wl_sandbox_workshops_v1'));
  assert(saved.some(entry=>entry.title===previous.title&&entry.questions.length===previous.questions.length));
  assert(!elements.get('workspace').innerHTML.includes('data-action="prep-import"'));
  action('tab',{tab:'live'});assert(elements.get('workspace').innerHTML.includes('Aucune question'));
  action('participant');action('projection');action('tab',{tab:'recap'});
  action('tab',{tab:'prep'});
});
test('Le nom de l’atelier est validé avant toute modification',()=>{
  const before=JSON.stringify(app.state());
  for(const title of ['   ','a'.repeat(121)])submit({id:'workshop-form',values:{title}});
  assert.equal(JSON.stringify(app.state()),before);
  assert(elements.get('workshop-error').textContent);
});
test('L’ajout manuel dans un atelier vide reste rechargeable',()=>{
  submit({id:'question-form',dataset:{index:''},values:{type:'yesno',title:'Une première question ?',description:'',correct:'1'}});
  assert.equal(app.state().questions.length,1);assert(app.validState(app.state()));
  assert.equal(app.readState().questions.length,1);
});
test('Les ateliers conservés peuvent être rouverts sans perdre le nouvel atelier',()=>{
  const created=JSON.parse(JSON.stringify(app.state()));
  const saved=JSON.parse(memory.get('wl_sandbox_workshops_v1'));
  const previous=saved.find(entry=>entry.title!==created.title);
  action('open-saved-workshop',{id:previous.workshopId});
  assert.equal(app.state().workshopId,previous.workshopId);
  assert.equal(JSON.stringify(app.state().questions),JSON.stringify(previous.questions));
  action('open-saved-workshop',{id:created.workshopId});
  assert.equal(app.state().title,created.title);assert.equal(app.state().questions.length,1);
});
test('Un refus d’enregistrement empêche de remplacer l’atelier actif',()=>{
  const before=JSON.stringify(app.state()),write=sandbox.localStorage.setItem;
  for(const blocked of ['wl_sandbox_workshops_v1','wl_sandbox_v3']){
    sandbox.localStorage.setItem=(key,value)=>{if(key===blocked)throw new Error('quota');write(key,value);};
    submit({id:'workshop-form',values:{title:'Ne doit pas remplacer l’atelier'}});
    assert.equal(JSON.stringify(app.state()),before);
    assert(elements.get('workshop-error').textContent.includes('enregistrer'));
  }
  sandbox.localStorage.setItem=write;
});
test('Annuler la création par JSON ne crée rien et conserve l’atelier actif',()=>{
  const before=JSON.stringify(app.state()),stored=JSON.stringify([...memory]);
  action('create-workshop');submit({id:'workshop-form',values:{title:'Brouillon JSON',source:'json'}});
  assert.equal(JSON.stringify(app.state()),before);assert.equal(JSON.stringify([...memory]),stored);
  action('prep-cancel');assert.equal(JSON.stringify(app.state()),before);
  assert.equal(JSON.stringify([...memory]),stored);
});
test('Le JSON est vérifié avant de créer le nouvel atelier avec sa sélection',()=>{
  const before=JSON.stringify(app.state());
  action('create-workshop');submit({id:'workshop-form',values:{title:'Atelier créé par JSON',source:'json'}});
  document.getElementById('prep-commit').lastChild={textContent:''};
  action('prep-example');action('prep-verify');
  assert.equal(JSON.stringify(app.state()),before);
  action('prep-commit');
  assert.equal(app.state().title,'Atelier créé par JSON');assert.equal(app.state().questions.length,2);
  assert(app.state().conclusion);assert(app.validState(app.readState()));
  assert(!elements.get('workspace').innerHTML.includes('data-action="prep-import"'));
});
test('Un échec de création par JSON permet de réessayer sans doubler les questions',()=>{
  const before=JSON.stringify(app.state()),write=sandbox.localStorage.setItem;
  action('create-workshop');submit({id:'workshop-form',values:{title:'JSON après réessai',source:'json'}});
  action('prep-example');action('prep-verify');
  sandbox.localStorage.setItem=()=>{throw new Error('quota');};
  action('prep-commit');assert.equal(JSON.stringify(app.state()),before);
  sandbox.localStorage.setItem=write;action('prep-commit');
  assert.equal(app.state().title,'JSON après réessai');assert.equal(app.state().questions.length,2);
});
test('Dupliquer conserve le contenu et remet les votes à zéro sans modifier l’original',()=>{
  const original=app.state();original.questions[0].state='open';app.recordAnswer(original.questions[0],[1],'');original.questions[0].published=true;
  const before=JSON.parse(JSON.stringify(original));
  action('duplicate-workshop',{id:original.workshopId});
  const copy=app.state();assert.notEqual(copy.workshopId,before.workshopId);
  assert.equal(copy.title,('Copie de '+before.title).slice(0,120));assert.equal(copy.conclusion,before.conclusion);
  assert.equal(copy.questions.length,before.questions.length);assert.equal(copy.participants,0);
  copy.questions.forEach((q,i)=>{assert.notEqual(q.id,before.questions[i].id);assert.equal(q.title,before.questions[i].title);assert.equal(q.responses,0);assert(q.counts.every(n=>n===0));assert.equal(q.state,'draft');assert.equal(q.published,false);});
  assert(app.validState(copy));assert.equal(app.workshops().find(w=>w.workshopId===before.workshopId).questions[0].responses,1);
});
test('Archiver conserve les données, ouvre le bilan et permet la restauration',()=>{
  const id=app.state().workshopId,questions=JSON.stringify(app.state().questions);
  action('archive-workshop',{id});assert.equal(app.state().archived,true);
  assert(elements.get('workspace').innerHTML.includes('Ateliers archivés'));
  action('go-prep');assert(elements.get('workspace').innerHTML.includes('Ce que l’atelier nous apprend'));
  assert(!elements.get('workspace').innerHTML.includes('data-action="add-question"'));
  action('restore-workshop',{id});assert.equal(app.state().archived,false);
  assert.equal(JSON.stringify(app.state().questions),questions);assert(app.validState(app.readState()));
});
test('Une archive peut servir de modèle de duplication sans être modifiée',()=>{
  const id=app.state().workshopId;action('archive-workshop',{id});action('duplicate-workshop',{id});
  assert.equal(app.state().archived,false);assert.notEqual(app.state().workshopId,id);
  assert.equal(app.workshops().find(w=>w.workshopId===id).archived,true);
});
test('Supprimer un autre atelier exige confirmation et conserve l’atelier actif',()=>{
  const current=app.state().workshopId,target=app.workshops().find(w=>w.workshopId!==current);
  sandbox.confirm=()=>false;action('delete-workshop',{id:target.workshopId});assert(app.workshops().some(w=>w.workshopId===target.workshopId));
  sandbox.confirm=()=>true;action('delete-workshop',{id:target.workshopId});
  assert(!app.workshops().some(w=>w.workshopId===target.workshopId));assert.equal(app.state().workshopId,current);
  assert(!JSON.parse(memory.get('wl_sandbox_workshops_v1')).some(w=>w.workshopId===target.workshopId));
});
test('Supprimer l’atelier actif ouvre un atelier restant et préserve les autres',()=>{
  const id=app.state().workshopId,remaining=app.workshops().filter(w=>w.workshopId!==id).map(w=>w.workshopId).sort();
  action('delete-workshop',{id});assert.notEqual(app.state().workshopId,id);
  assert.deepEqual(app.workshops().map(w=>w.workshopId).sort(),remaining);assert(app.validState(app.readState()));
});
test('Un échec d’enregistrement empêche les actions de gestion de modifier les ateliers',()=>{
  const before=JSON.stringify(app.workshops()),write=sandbox.localStorage.setItem,id=app.state().workshopId;
  sandbox.localStorage.setItem=()=>{throw new Error('quota');};
  for(const name of ['archive-workshop','restore-workshop','duplicate-workshop','delete-workshop']){action(name,{id});assert.equal(JSON.stringify(app.workshops()),before);}
  sandbox.localStorage.setItem=write;
});
test('Supprimer le dernier atelier laisse une liste vide et permet une nouvelle création',()=>{
  for(const atelier of app.workshops().slice())action('delete-workshop',{id:atelier.workshopId});
  assert.equal(app.workshops().length,0);assert(app.validState(app.readState()));
  assert.equal(JSON.parse(memory.get('wl_sandbox_workshops_v1')).length,0);
  submit({id:'workshop-form',values:{title:'Premier atelier après suppression'}});
  assert.equal(app.workshops().length,1);assert.equal(JSON.parse(memory.get('wl_sandbox_workshops_v1')).length,0);
});
test('Pilotage regroupe la session et le retour vers Animer conserve la question',()=>{
  submit({id:'question-form',dataset:{index:''},values:{type:'yesno',title:'Question de pilotage',description:'',correct:'1'}});
  action('tab',{tab:'live'});const before=JSON.stringify(app.state());
  action('go-pilotage');const html=elements.get('workspace').innerHTML;
  assert(html.includes('data:image/gif;base64,'));
  for(const control of ['toggle-registrations','toggle-qr','copy-invitation','share-invitation','toggle-asks','toggle-pseudos','toggle-podium','project-asks'])assert(html.includes('data-action="'+control+'"'));
  action('go-live');const live=elements.get('workspace').innerHTML;
  assert(live.includes('data-action="reset-question"'));assert(live.includes('data-action="go-pilotage"'));
  assert(!live.includes('data-action="toggle-registrations"'));assert(!live.includes('data-action="publish-question"'));
  assert.equal(JSON.stringify(app.state()),before);
  action('tab',{tab:'prep'});
  const target=element();target.setAttribute('role','tab');
  for(const expected of ['control','live','recap']){
    (listeners.keydown||[]).forEach(fn=>fn({target,key:'ArrowRight',preventDefault(){}}));
    assert.equal(document.activeElement.id,'tab-'+expected);
  }
  action('tab',{tab:'live'});
});
test('Fermer les inscriptions bloque les nouveaux inscrits sans bloquer les inscrits',()=>{
  action('simulate-registration');const registered=app.state().participants;assert.equal(registered,1);
  action('toggle-registrations');action('simulate-registration');assert.equal(app.state().participants,registered);
  action('toggle-vote');assert(app.recordAnswer(app.state().questions[0],[0],''));
  assert.equal(app.state().questions[0].responses,1);action('toggle-registrations');
});
test('Le QR peut être masqué et réaffiché dans la projection',()=>{
  action('toggle-qr');app.projection();assert(!elements.get('workspace').innerHTML.includes('projection-invitation'));
  action('toggle-qr');app.projection();assert(elements.get('workspace').innerHTML.includes('projection-invitation'));
});
test('L’accueil puis Suivante lance la première question et ouvre son vote',()=>{
  action('show-welcome');assert(app.state().session.welcome);action('next');
  assert.equal(app.state().current,0);assert.equal(app.state().session.welcome,false);assert.equal(app.state().questions[0].state,'open');
});
test('Réinitialiser demande confirmation et conserve les inscrits',()=>{
  sandbox.confirm=()=>false;action('reset-question');assert.equal(app.state().questions[0].responses,1);
  sandbox.confirm=()=>true;action('reset-question');assert.equal(app.state().questions[0].responses,0);
  assert.equal(app.state().questions[0].state,'draft');assert.equal(app.state().participants,1);
});
test('Les trois signaux se comptent et peuvent être effacés ensemble',()=>{
  for(const kind of ['fast','again','help'])action('send-signal',{kind});
  assert.deepEqual(JSON.parse(JSON.stringify(app.state().session.signals)),{fast:1,again:1,help:1});
  action('acknowledge-help');assert(Object.values(app.state().session.signals).every(n=>n===0));
});
test('Oser demander ferme les nouvelles questions et permet la modération avant projection',()=>{
  const text='<img src=x onerror=alert(1)> Question anonyme';
  submit({id:'anonymous-question-form',values:{text}});assert.equal(app.state().session.asks.length,1);
  action('toggle-asks');submit({id:'anonymous-question-form',values:{text:'Interdit lorsque fermé'}});assert.equal(app.state().session.asks.length,1);
  action('toggle-asks');action('simulate-ask');
  const id=app.state().session.asks[0].id;action('publish-question',{id});action('project-asks');app.projection();
  const html=elements.get('workspace').innerHTML;assert(html.includes('&lt;img'));assert(!html.includes('sans utiliser le lien reçu'));
  action('delete-ask',{id});assert.equal(app.state().session.asks.length,1);action('project-asks');
});
test('Les pseudonymes et le podium sont réversibles et identifiés comme fictifs',()=>{
  action('toggle-pseudos');action('toggle-podium');app.projection();
  assert(elements.get('workspace').innerHTML.includes('Podium de démonstration'));
  assert(elements.get('workspace').innerHTML.includes('scores individuels ne sont pas calculés'));
  action('toggle-pseudos');assert.equal(app.state().session.podium,false);
});
function rosterNames(html=elements.get('workspace').innerHTML){
  const list=html.match(/<ol class="participant-roster-list">([\s\S]*?)<\/ol>/);
  return list?[...list[1].matchAll(/<li>([^<]+)<\/li>/g)].map(match=>match[1]):[];
}
test('Chaque inscription ajoute un pseudonyme au-delà des trois places du podium',()=>{
  action('tab',{tab:'control'});const before=app.state().participants;
  action('toggle-pseudos');assert.equal(app.state().participants,before);
  assert.equal(rosterNames().length,before);
  for(let i=0;i<4;i++)action('simulate-registration');
  const names=rosterNames();assert.equal(names.length,before+4);assert.equal(new Set(names).size,names.length);
  assert.equal(names[0],'Panda curieux');assert(!elements.get('workspace').innerHTML.includes(' — 3 points'));
  assert.equal(app.readState().participants,names.length);assert(app.readState().session.pseudos);
  app.render();assert.deepEqual(rosterNames(),names);
  action('toggle-pseudos');assert.equal(rosterNames().length,0);
  action('toggle-pseudos');assert.deepEqual(rosterNames(),names);
});
test('La liste des pseudonymes respecte la fermeture et la capacité des inscriptions',()=>{
  action('toggle-registrations');const before=rosterNames();action('simulate-registration');assert.deepEqual(rosterNames(),before);
  action('toggle-registrations');while(app.state().participants<app.state().capacity)action('simulate-registration');
  action('simulate-registration');assert.equal(rosterNames().length,18);assert.equal(new Set(rosterNames()).size,18);
  action('toggle-podium');app.projection();assert.equal((elements.get('workspace').innerHTML.match(/<li>/g)||[]).length,3);
  action('toggle-pseudos');
});
test('L’invitation reste copiable sans API de presse-papiers',()=>{
  action('copy-invitation');assert(app.dialogHtml().includes('invitation-copy'));assert(app.dialogHtml().includes('Invitation de simulation'));action('close-dialog');
});
test('Pilotage permet de terminer et rouvrir avec confirmation et conservation des réponses',()=>{
  action('tab',{tab:'control'});
  assert(elements.get('workspace').innerHTML.includes('Terminer la session'));
  const questions=JSON.parse(JSON.stringify(app.state().questions));
  sandbox.confirm=()=>false;action('end-session');assert.equal(app.state().ended,false);
  sandbox.confirm=()=>true;action('end-session');assert.equal(app.state().ended,true);
  assert(elements.get('workspace').innerHTML.includes('Rouvrir la session'));
  for(const [index,q] of app.state().questions.entries()){
    assert.notEqual(q.state,'open');assert.deepEqual([...q.counts],questions[index].counts);assert.equal(q.responses,questions[index].responses);
  }
  assert(app.readState().ended);action('end-session');assert.equal(app.state().ended,false);
});
function rename(id,title){submit({id:'rename-workshop-form',dataset:{id},values:{title}});}
test('Renommer l’atelier actif conserve son identité et ses réponses après rechargement',()=>{
  const previous=JSON.parse(JSON.stringify(app.state()));
  action('rename-workshop',{id:previous.workshopId});
  assert(app.dialogHtml().includes('value="'+app.esc(previous.title)+'"'));
  rename(previous.workshopId,'  Atelier renommé <test>  ');
  assert.equal(app.state().title,'Atelier renommé <test>');
  assert.equal(app.readState().title,app.state().title);
  assert.deepEqual(JSON.parse(JSON.stringify(app.state())),{...previous,title:app.state().title,updated:app.state().updated});
  action('go-pilotage');assert(elements.get('workspace').innerHTML.includes('Atelier renommé &lt;test&gt;'));
});
test('Annuler ou donner un nom invalide laisse tous les ateliers intacts',()=>{
  const before=JSON.stringify(app.workshops()),stored=JSON.stringify([...memory]),id=app.state().workshopId;
  action('rename-workshop',{id});action('close-dialog');
  for(const title of ['   ','x'.repeat(121)]){
    action('rename-workshop',{id});rename(id,title);
    assert(elements.get('rename-workshop-error').textContent.includes('120 caractères'));
  }
  assert.equal(JSON.stringify(app.workshops()),before);assert.equal(JSON.stringify([...memory]),stored);action('close-dialog');
});
test('Renommer un autre atelier archivé ne change pas la session active',()=>{
  const active=JSON.stringify(app.state()),id=app.state().workshopId;
  submit({id:'workshop-form',values:{title:'Autre atelier'}});
  action('archive-workshop',{id});
  const archived=JSON.parse(JSON.stringify(app.workshops().find(w=>w.workshopId===id)));
  const current=JSON.stringify(app.state());
  action('rename-workshop',{id});rename(id,'Archive renommée');
  const saved=JSON.parse(memory.get('wl_sandbox_workshops_v1')).find(w=>w.workshopId===id);
  assert.equal(saved.title,'Archive renommée');assert.equal(saved.archived,true);
  assert.deepEqual(saved.questions,archived.questions);assert.equal(JSON.stringify(app.state()),current);
  assert.notEqual(current,active);
});
test('Un refus de stockage garde le nom précédent et permet de réessayer',()=>{
  const write=sandbox.localStorage.setItem;
  for(const [key,id] of [['wl_sandbox_v3',app.state().workshopId],['wl_sandbox_workshops_v1',app.workshops().find(w=>w.workshopId!==app.state().workshopId).workshopId]]){
    const before=JSON.stringify(app.workshops()),stored=JSON.stringify([...memory]);
    action('rename-workshop',{id});
    sandbox.localStorage.setItem=(name,value)=>{if(name===key)throw new Error('quota');write(name,value);};
    rename(id,'Échec de renommage');
    assert.equal(JSON.stringify(app.workshops()),before);assert.equal(JSON.stringify([...memory]),stored);
    assert(elements.get('rename-workshop-error').textContent.includes('nom précédent'));
    sandbox.localStorage.setItem=write;rename(id,'Nom enregistré après réessai');
    assert.equal(app.workshops().find(w=>w.workshopId===id).title,'Nom enregistré après réessai');
  }
});
console.log(tests+' scénarios validés. Aucun réseau, aucune donnée réelle.');
