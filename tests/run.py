#!/usr/bin/env python3
"""Exécute les tests sur une copie jetable ; ne touche jamais aux données réelles."""
import os, pathlib, shutil, subprocess, tempfile, time, urllib.request
ROOT=pathlib.Path(__file__).resolve().parent.parent
PHP=os.environ.get('PHP_BIN','php');PORT=os.environ.get('WOOC_TEST_PORT','8001')
with tempfile.TemporaryDirectory(prefix='wooclight-tests-') as tmp:
 tmp=pathlib.Path(tmp);app=tmp/'wooclight';shutil.copytree(ROOT/'wooclight',app,ignore=shutil.ignore_patterns('config.php','store.*','write-*'))
 data=tmp/'data';data.mkdir();sessions=tmp/'sessions';sessions.mkdir()
 config="<?php return ['admin_hash'=>'"+subprocess.check_output([PHP,'-r','echo password_hash("test-password",PASSWORD_DEFAULT);']).decode()+"','rate_salt'=>'test-only-salt','data_dir'=>"+repr(str(data))+",'rate_ip'=>10000,'rate_token'=>10000];"
 (app/'config.php').write_text(config)
 log=open(tmp/'server.log','w');server=subprocess.Popen([PHP,'-d','session.save_path='+str(sessions),'-d','display_errors=0','-S','localhost:'+PORT,'-t',str(app)],stdout=log,stderr=log)
 env=dict(os.environ,WOOC_URL='http://localhost:'+PORT+'/',WOOC_TEST_DATA=str(data),WOOC_TEST_PASSWORD='test-password')
 try:
  for _ in range(50):
   if server.poll() is not None:raise RuntimeError('Le serveur n’a pas démarré : '+(tmp/'server.log').read_text())
   try:urllib.request.urlopen(env['WOOC_URL']+'index.php',timeout=1);break
   except OSError:time.sleep(.1)
  else:raise RuntimeError('Délai de démarrage dépassé')
  for p in app.rglob('*.php'):subprocess.run([PHP,'-l',str(p)],check=True)
  for p in (app/'assets').glob('*.js'):subprocess.run(['node','--check',str(p)],check=True)
  subprocess.run([PHP,str(ROOT/'tests/limits.php')],check=True,env=env)
  subprocess.run(['python3',str(ROOT/'tests/e2e.py')],check=True,env=env)
  subprocess.run(['node',str(ROOT/'tests/browser.cjs')],check=True,env=env)
 finally:
  server.terminate();server.wait(timeout=5);log.close()
