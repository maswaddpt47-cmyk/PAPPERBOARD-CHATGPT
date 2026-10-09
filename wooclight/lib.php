<?php
// Fonctions communes : sécurité, transactions JSON et agrégation.
declare(strict_types=1);
$cfg = require __DIR__.'/config.sample.php';
if (is_file(__DIR__.'/config.php')) $cfg = array_replace($cfg, require __DIR__.'/config.php');
function headers_secure(): void {
 header('X-Content-Type-Options: nosniff'); header('X-Frame-Options: DENY');
 header('Referrer-Policy: no-referrer');
 header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
 header('Cache-Control: no-store');
}
headers_secure();
function fail(string $message, int $status=400): never { http_response_code($status); throw new RuntimeException($message); }
function config(string $key): mixed { global $cfg; return $cfg[$key]; }
function e(string $s): string { return htmlspecialchars($s, ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8'); }
function cookie_path(): string { return rtrim(str_replace('\\','/',dirname($_SERVER['SCRIPT_NAME']??'/api.php')),'/').'/'; }
function admin_session(): void {
 session_name('wooc_admin_'.substr(hash('sha256',__DIR__),0,12)); session_set_cookie_params(['httponly'=>true,'secure'=>!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS']!=='off','samesite'=>'Strict','path'=>cookie_path()]); session_start();
 $_SESSION['csrf'] ??= bin2hex(random_bytes(24));
}
function require_admin(array $in): void {
 admin_session(); if (empty($_SESSION['admin'])) fail('Connexion animateur requise.',401);
 if (!hash_equals($_SESSION['csrf'], (string)($in['csrf']??''))) fail('Jeton de sécurité invalide. Rechargez la page.',403);
}
function text_value(mixed $v, int $max): string {
 if (!is_string($v) || !preg_match('//u',$v)) fail('Texte invalide.');
 $v=trim($v); preg_match_all('/./us',$v,$m); if (count($m[0])>$max) fail("Texte trop long (maximum $max caractères)."); return $v;
}
function normalize(string $s): string {
 $s=strtr(strtolower(trim($s)),['à'=>'a','â'=>'a','ä'=>'a','À'=>'a','é'=>'e','è'=>'e','ê'=>'e','ë'=>'e','É'=>'e','î'=>'i','ï'=>'i','ô'=>'o','ö'=>'o','ù'=>'u','û'=>'u','ü'=>'u','ç'=>'c','œ'=>'oe','Â'=>'a','Ä'=>'a','È'=>'e','Ê'=>'e','Ë'=>'e','Î'=>'i','Ï'=>'i','Ô'=>'o','Ö'=>'o','Ù'=>'u','Û'=>'u','Ü'=>'u','Ç'=>'c','Œ'=>'oe']); return $s;
}
// Le verrou porte sur un fichier stable, jamais sur le fichier remplacé.
function transaction(callable $fn): mixed {
 $dir=config('data_dir'); if (!is_dir($dir) && !mkdir($dir,0700,true)) fail('Dossier data inaccessible.',500);
 $lock=fopen($dir.'/store.lock','c'); if (!$lock || !flock($lock,LOCK_EX)) fail('Stockage occupé.',503);
 $tmp=null;
 try {
  $path=$dir.'/store.json'; $db=is_file($path)?json_decode(file_get_contents($path),true,512,JSON_THROW_ON_ERROR):['sessions'=>[],'rates'=>[]];
  $now=time(); foreach($db['sessions'] as $code=>$s) if ($s['updated']<$now-config('expiry_days')*86400) unset($db['sessions'][$code]);
  foreach($db['rates'] as $key=>$r) if ($r['at']<$now-60) unset($db['rates'][$key]);
  $out=$fn($db); $after=json_encode($db,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
  if(is_file($path) && file_get_contents($path)===$after) return $out;
  $tmp=tempnam($dir,'write-');
  if ($tmp===false || file_put_contents($tmp,$after)===false || !rename($tmp,$path)) fail('Écriture impossible.',500);
  return $out;
 } finally { if ($tmp && is_file($tmp)) unlink($tmp); flock($lock,LOCK_UN); fclose($lock); }
}
function participant(array $in): string {
 $cookie=$_COOKIE['wooc_token']??''; $candidate=$in['token']??'';
 $token=preg_match('/^[a-f0-9]{64}$/D',$cookie)?$cookie:(preg_match('/^[a-f0-9]{64}$/D',(string)$candidate)?$candidate:bin2hex(random_bytes(32)));
 setcookie('wooc_token',$token,['expires'=>time()+86400*30,'path'=>cookie_path(),'httponly'=>true,'secure'=>!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS']!=='off','samesite'=>'Lax']); return $token;
}
function rate(array &$db,string $token): void {
 if (!config('rate_salt')) fail('Configuration incomplète : rate_salt requis.',503);
 foreach(['ip:'.hash_hmac('sha256',$_SERVER['REMOTE_ADDR']??'',config('rate_salt'))=>config('rate_ip'),'token:'.hash('sha256',$token)=>config('rate_token')] as $key=>$limit) {
  $r=$db['rates'][$key]??['at'=>time(),'n'=>0]; if($r['at']<time()-60) $r=['at'=>time(),'n'=>0];
  if($r['n']>=$limit) fail('Trop de demandes. Réessayez dans une minute.',429); $r['n']++; $db['rates'][$key]=$r;
 }
}
function question(array $in): array {
 $types=['yesno','truefalse','single','multiple','poll','cloud','text','scale','points'];
 $type=$in['type']??''; if(!in_array($type,$types,true)) fail('Type de question invalide.');
 $title=text_value($in['title']??'',240); if(!$title) fail('Intitulé requis.');
 $options=$in['options']??[]; if(!is_array($options)) fail('Options invalides.');
 if($type==='yesno') $options=['Oui','Non']; if($type==='truefalse') $options=['Vrai','Faux'];
 $options=array_map(fn($s)=>text_value($s,80),array_values($options));
 if(in_array($type,['yesno','truefalse','single','multiple','poll','points']) && (count($options)<2 || count($options)>12 || in_array('',$options,true) || count(array_unique($options))!==count($options))) fail('Choisissez 2 à 12 options distinctes.');
 $correct=$in['correct']??[]; if(!is_array($correct)) fail('Correction invalide.');
 foreach($correct as $i) if(!is_int($i) || !isset($options[$i])) fail('Bonne réponse invalide.');
 $scale=(int)($in['scale']??5); if(!in_array($scale,[5,10])) fail('Échelle invalide.');
 $duration=(int)($in['duration']??0); if($duration<0 || $duration>7200) fail('Durée invalide.');
 $budget=(int)($in['budget']??10); if($budget<1 || $budget>100) fail('Budget invalide.');
 return ['id'=>bin2hex(random_bytes(8)),'title'=>$title,'type'=>$type,'options'=>$options,'correct'=>array_values(array_unique($correct)),'scale'=>$scale,'budget'=>$budget,'duration'=>$duration,'anonymous'=>true,'votes'=>[],'hidden'=>[]];
}
function vote_value(array $q,mixed $v): mixed {
 switch($q['type']) {
 case 'text': case 'cloud':
  $v=text_value($v,config('max_text')); if(!$v) fail('Saisissez une réponse.');
  foreach(config('forbidden_words') as $word) if(str_contains(normalize($v),normalize($word))) fail('Cette réponse contient un mot interdit.'); return $v;
 case 'scale': if(!is_int($v)||$v<1||$v>$q['scale']) fail('Note invalide.'); return $v;
 case 'points':
  if(!is_array($v)||count($v)!==count($q['options'])||!array_is_list($v)) fail('Répartition invalide.');
  foreach($v as $n) if(!is_int($n)||$n<0||$n>$q['budget']) fail('Points invalides.');
  if(array_sum($v)!==$q['budget']) fail('Répartissez exactement '.$q['budget'].' points.'); return $v;
 case 'multiple':
  if(!is_array($v)||!$v||count($v)!==count(array_unique($v))) fail('Choix invalides.');
  foreach($v as $n) if(!is_int($n)||!isset($q['options'][$n])) fail('Choix invalide.'); sort($v); return $v;
 default: if(!is_int($v)||!isset($q['options'][$v])) fail('Choix invalide.'); return $v;
 }
}
function results(array $q): array {
 $r=['total'=>count($q['votes']),'counts'=>[],'items'=>[],'average'=>null]; $sum=0;
 foreach($q['votes'] as $token=>$v) {
  if(in_array($q['type'],['text','cloud'])) {
   if(in_array($token,$q['hidden'],true)) continue;
   if($q['type']==='text') $r['items'][]=['id'=>$token,'text'=>$v];
   else { foreach(preg_split('/[\s,;.!?]+/u',normalize($v),-1,PREG_SPLIT_NO_EMPTY) as $key) $r['counts'][$key]=($r['counts'][$key]??0)+1; }
  } elseif($q['type']==='points') { foreach($v as $i=>$n) $r['counts'][$i]=($r['counts'][$i]??0)+$n; }
  else { foreach(is_array($v)?$v:[$v] as $n) $r['counts'][$n]=($r['counts'][$n]??0)+1; if($q['type']==='scale') $sum+=$v; }
 }
 if($q['type']==='scale' && $r['total']) $r['average']=$sum/$r['total']; return $r;
}
function public_state(array $s, string $token='',bool $admin=false): array {
 $q=$s['questions'][$s['active']]??null; $out=['code'=>$s['code'],'title'=>$s['title'],'version'=>$s['version'],'open'=>$s['open'] && (!$s['deadline']||time()<$s['deadline']),'show'=>$s['show'],'deadline'=>$s['deadline'],'allow_change'=>$s['allow_change'],'question'=>null,'results'=>null,'poll_ms'=>config('poll_ms')];
 if($q) {
  $out['question']=array_diff_key($q,array_flip(['votes','hidden','correct']));
  if($s['show']||$admin) { $out['results']=results($q); if(!$admin) $out['results']['items']=array_map(fn($item)=>['text'=>$item['text']],$out['results']['items']); $out['question']['correct']=$q['correct']; }
  if($token) { $key=hash('sha256',$token); $out['answer']=$q['votes'][$key]??null; }
 }
 if($admin) { $out['questions']=array_map(fn($q)=>array_diff_key($q,array_flip(['votes','hidden'])),$s['questions']); $out['active']=$s['active']; $out['participants']=count($s['participants']); }
 return $out;
}
