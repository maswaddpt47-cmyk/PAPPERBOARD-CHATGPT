<?php
// Vérifications sans serveur, dans un dossier temporaire isolé.
ob_start();
require __DIR__.'/../wooclight/lib.php';
$cfg['data_dir']=sys_get_temp_dir().'/wooclight-limits-'.bin2hex(random_bytes(6));
$cfg['rate_salt']=bin2hex(random_bytes(32)); $cfg['rate_token']=2; $cfg['rate_ip']=5;
$cfg['forbidden_words']=['interdit'];
function check(bool $ok,string $name): void { if(!$ok) throw new Exception('Échec : '.$name); echo "PASS $name\n"; }
function rejected(callable $f): bool { try{$f();return false;}catch(RuntimeException $e){return true;} }
try {
 transaction(function(&$db){rate($db,'jeton');}); transaction(function(&$db){rate($db,'jeton');});
 check(rejected(fn()=>transaction(function(&$db){rate($db,'jeton');})),'limite par jeton');
 foreach(['a','b','c'] as $token) transaction(function(&$db)use($token){rate($db,$token);});
 check(rejected(fn()=>transaction(function(&$db){rate($db,'d');})),'limite par IP');
 $raw=file_get_contents($cfg['data_dir'].'/store.json'); check(!str_contains($raw,'127.0.0.1'),'pas d’IP en clair');
 $q=question(['type'=>'text','title'=>'Texte']);check(rejected(fn()=>vote_value($q,'mot INTERDIT')),'filtre configurable');
 check(rejected(fn()=>vote_value($q,str_repeat('é',81))),'longueur UTF-8');
 check(vote_value($q,str_repeat('é',80))===str_repeat('é',80),'80 caractères UTF-8 acceptés');
 $q=question(['type'=>'cloud','title'=>'Mots']);$q['votes']=['a'=>'ÉCOLE école','b'=>'ecole'];check(results($q)['counts']['ecole']===3,'nuage : mots, casse et accents');
 check(rejected(fn()=>question(['type'=>'single','title'=>'Q','options'=>['A','A']])),'options distinctes');
 check(rejected(fn()=>question(['type'=>'scale','title'=>'Q','scale'=>6])),'échelles bornées');
 check(rejected(fn()=>question(['type'=>'single','title'=>'Q','options'=>['A','B'],'correct'=>[2]])),'correction validée');
 transaction(function(&$db){$db['sessions']['OLD']=['updated'=>time()-31*86400];});
 $purged=transaction(fn(&$db)=>!isset($db['sessions']['OLD']));check($purged,'purge réelle du stockage');
}finally{foreach(glob($cfg['data_dir'].'/*')?:[]as $file)unlink($file);if(is_dir($cfg['data_dir']))rmdir($cfg['data_dir']);}
