/* Tests de navigateur. Playwright est uniquement un outil de développement. */
const { chromium }=require('playwright');
const fs=require('fs');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});
const base=process.env.WOOC_URL||'http://localhost:8000/';
const errors=[];const admin=await browser.newPage();admin.on('pageerror',e=>errors.push(e.message));
await admin.goto(base+'admin.php');await admin.locator('#password').fill(process.env.WOOC_TEST_PASSWORD||'test-password');await admin.locator('#login-form button').click();await admin.locator('#dashboard').waitFor({state:'visible'});
await admin.locator('#title').fill('Atelier navigateur');await admin.locator('#create-form button').click();await admin.locator('#studio').waitFor({state:'visible'});await admin.locator('#q-title').fill('Vous participez ?');await admin.locator('#question-form button').first().click();await admin.locator('#questions li').waitFor();await admin.locator('[data-op=open]').click();
const code=await admin.locator('#session-code').textContent();
const ctx=await browser.newContext({viewport:{width:390,height:844}});const participant=await ctx.newPage();participant.on('pageerror',e=>errors.push(e.message));await participant.goto(base+'index.php?s='+code);await participant.locator('#answer button').first().click();await participant.locator('#status').filter({hasText:'Votre réponse est enregistrée'}).waitFor();
await admin.locator('[data-op=show]').click();const screen=await browser.newPage();screen.on('pageerror',e=>errors.push(e.message));await screen.goto(base+'screen.php?s='+code);await screen.locator('#results').filter({hasText:'1 réponse'}).waitFor();
if(await screen.locator('#qr img').count()!==1)throw Error('QR absent');
await screen.locator('#theme').click();if(!await screen.locator('body').evaluate(el=>el.classList.contains('dark')))throw Error('Thème');
// Tous les types dans l’export réellement téléchargé depuis l’interface.
await admin.evaluate(async()=>{
 const fixtures={truefalse:1,single:1,multiple:[0,1],poll:0,cloud:'École',text:'<img src=x onerror=alert(1)>',scale:4,points:[3,7]};
 for(const [type,value]of Object.entries(fixtures)){
  await act('save_question',{question:{title:'Question '+type,type,options:['A','B'],scale:5,budget:10}});
  let s=await act('admin_state');await act('control',{op:'select',index:s.questions.length-1});await act('control',{op:'open'});s=await act('admin_state');await W.api('vote',{code,question_id:s.question.id,value});
 }
 await refresh();
});
const downloadEvent=admin.waitForEvent('download');await admin.locator('#csv').click();const download=await downloadEvent;const path=await download.path();const buf=fs.readFileSync(path);if(buf.slice(0,3).toString('hex')!=='efbbbf')throw Error('BOM absent');const csv=buf.toString('utf8');for(const type of ['yesno','truefalse','single','multiple','poll','cloud','text','scale','points'])if(!csv.includes('"'+type+'"'))throw Error('CSV incomplet '+type);if(!csv.includes(';'))throw Error('Séparateur CSV');
await admin.evaluate(()=>window.print=()=>{});await admin.locator('#print').click();await admin.locator('#print-results h2').first().waitFor();if(await admin.locator('#print-results h2').count()<9)throw Error('Impression incomplète');
// Le mur échappe les réponses et la projection ne charge aucune ressource tierce.
await admin.evaluate(async()=>{await act('control',{op:'select',index:6});await act('control',{op:'show'});});
await screen.locator('#results').filter({hasText:'<img src=x onerror=alert(1)>'}).waitFor();if(await screen.locator('#results img').count())throw Error('Injection HTML');
const external=await screen.evaluate(()=>performance.getEntriesByType('resource').filter(r=>new URL(r.name).origin!==location.origin&&!r.name.startsWith('data:')).map(r=>r.name));if(external.length)throw Error('Ressources tierces '+external);
if(errors.length)throw Error(errors.join('\n'));
console.log('PASS navigateur : login, atelier, vote mobile, projection, QR, thème, CSV des 9 types (BOM/point-virgule), impression, XSS, aucune ressource tierce');
await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
