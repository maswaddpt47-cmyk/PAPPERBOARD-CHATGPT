#!/usr/bin/env python3
"""Tests HTTP contre un serveur configuré pour les tests (voir README)."""
import json, urllib.request, urllib.error, http.cookiejar, os, time
BASE=os.environ.get('WOOC_URL','http://localhost:8000/')
PASSWORD=os.environ.get('WOOC_TEST_PASSWORD','test-password')
class Client:
 def __init__(self):
  self.http=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar())); self.csrf=''
 def call(self,action,expected=200,**data):
  body=json.dumps(dict(action=action,csrf=self.csrf,**data)).encode()
  req=urllib.request.Request(BASE+'api.php',data=body,headers={'Content-Type':'application/json'})
  try: r=self.http.open(req)
  except urllib.error.HTTPError as e:r=e
  value=json.loads(r.read());assert r.status==expected,(action,r.status,value);return value
 def get(self,path,headers=None,expected=200):
  try:r=self.http.open(urllib.request.Request(BASE+path,headers=headers or {}))
  except urllib.error.HTTPError as e:r=e
  assert r.status==expected,(r.status,path);return r
admin=Client();bootstrap=json.loads(admin.get('api.php?action=bootstrap').read());admin.csrf=bootstrap['csrf']
admin.call('login',password=PASSWORD)
assert Client().call('create',expected=401,title='interdit')['error']
old=admin.csrf;admin.csrf='incorrect';admin.call('create',expected=403,title='interdit');admin.csrf=old
code=admin.call('create',title='Atelier de test')['code']
participants=[Client() for _ in range(3)]
for p in participants:p.call('identity')
values={'yesno':0,'truefalse':1,'single':1,'multiple':[0,1],'poll':0,'cloud':'École','text':'<script>alert(1)</script>','scale':5,'points':[3,7]}
for index,(kind,value) in enumerate(values.items()):
 q={'type':kind,'title':'Question '+kind,'options':['A','B'],'correct':[1] if kind in ['single','multiple'] else [],'scale':5,'budget':10,'duration':0}
 admin.call('save_question',code=code,question=q)
 admin.call('control',code=code,op='select',index=index)
 admin.call('control',code=code,op='changes',enabled=False)
 admin.call('control',code=code,op='open')
 s=participants[0].call('state',code=code);qid=s['question']['id'];assert 'correct' not in s['question'];assert s['results'] is None
 for p in participants:p.call('vote',code=code,question_id=qid,value=value)
 participants[0].call('vote',expected=409,code=code,question_id=qid,value=value)
 admin.call('control',code=code,op='changes',enabled=True)
 participants[0].call('vote',code=code,question_id=qid,value=value)
 participants[0].call('vote',expected=409,code=code,question_id='stale',value=value)
 admin.call('control',code=code,op='close')
 participants[0].call('vote',expected=409,code=code,question_id=qid,value=value)
 admin.call('control',code=code,op='show')
 s=participants[0].call('state',code=code);assert s['results']['total']==3
 if kind=='cloud':assert s['results']['counts']['ecole']==3
 if kind=='scale':assert s['results']['average']==5
 if kind=='points':assert list(s['results']['counts'])==[9,21] or list(s['results']['counts'].values())==[9,21]
 if kind=='text':
  item=admin.call('admin_state',code=code)['results']['items'][0];admin.call('moderate',code=code,id=item['id']);assert len(participants[0].call('state',code=code)['results']['items'])==2
 export=admin.call('export',code=code);assert export['questions'][index]['results']['total']==3
 admin.call('control',code=code,op='hide');assert participants[0].call('state',code=code)['results'] is None
 print('PASS',kind,'création, 3 votes, doublon, modification, fermeture, résultats, export')
# ETag, absence de réponses et de jetons dans la projection.
r=participants[0].get('api.php?action=screen&code='+code);etag=r.headers['ETag'];state=json.loads(r.read());assert 'answer' not in state and 'votes' not in state['question']
participants[0].get('api.php?action=screen&code='+code,headers={'If-None-Match':etag},expected=304)
copy=admin.call('duplicate',code=code,title='Copie')['code'];assert admin.call('admin_state',code=copy)['participants']==0
admin.call('reorder',code=code,order=list(reversed(range(9))))
admin.call('control',code=code,op='reset');assert admin.call('admin_state',code=code)['results']['total']==0
admin.call('control',code=code,op='open');qid=admin.call('admin_state',code=code)['question']['id']
participants[0].call('vote',expected=400,code=code,question_id=qid,value=[1,1]) # budget incorrect
admin.call('delete',code=copy);participants[0].call('state',expected=404,code=copy)
# Durée, longueur maximale et configuration du filtre.
admin.call('save_question',code=code,question={'type':'text','title':'Chronomètre','duration':1})
admin.call('control',code=code,op='select',index=9);admin.call('control',code=code,op='open');qid=admin.call('admin_state',code=code)['question']['id']
participants[0].call('vote',expected=400,code=code,question_id=qid,value='a'*81)
time.sleep(1.1);participants[0].call('vote',expected=409,code=code,question_id=qid,value='fin')
print('PASS ETag, CSRF, accès admin, modération, duplication, ordre, reset, suppression, durée, validation')
# Purge : uniquement en mode de test, dossier explicitement donné hors projet.
data_dir=os.environ.get('WOOC_TEST_DATA')
if data_dir:
 path=os.path.join(data_dir,'store.json');db=json.load(open(path));db['sessions'][code]['updated']=int(time.time())-31*86400
 with open(path,'w') as f:json.dump(db,f)
 admin.call('list');participants[0].call('state',expected=404,code=code)
 print('PASS purge à 30 jours')
else:print('NON EXÉCUTÉ : purge (WOOC_TEST_DATA requis)')

# Limite par défaut : 150 participants, même réseau IP ; le 151e est refusé.
capacity=admin.call('create',title='Capacité')['code']
admin.call('save_question',code=capacity,question={'type':'yesno','title':'Présent ?'})
admin.call('control',code=capacity,op='open');qid=admin.call('admin_state',code=capacity)['question']['id']
for i in range(151):
 p=Client();p.call('identity');p.call('vote',expected=200 if i<150 else 409,code=capacity,question_id=qid,value=0)
assert admin.call('admin_state',code=capacity)['participants']==150
admin.call('delete',code=capacity)
print('PASS 150 participants acceptés, 151e refusé')
