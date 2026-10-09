<?php
require __DIR__.'/lib.php';
try {
 if((int)($_SERVER['CONTENT_LENGTH']??0)>65536) fail('Requête trop volumineuse.',413);
 $in=$_SERVER['REQUEST_METHOD']==='POST'?json_decode(file_get_contents('php://input',false,null,0,65537),true,32):$_GET;
 if(!is_array($in)) fail('Requête invalide.');
 $action=$in['action']??'state';
 if($_SERVER['REQUEST_METHOD']!=='POST' && !in_array($action,['state','screen','bootstrap'])) fail('Utilisez POST.',405);
 if($action==='bootstrap') { admin_session(); $out=['csrf'=>$_SESSION['csrf'],'logged'=>!empty($_SESSION['admin']),'configured'=>(bool)config('admin_hash')]; }
 elseif($action==='login') {
  admin_session(); if(!hash_equals($_SESSION['csrf'],(string)($in['csrf']??''))) fail('Jeton de sécurité invalide.',403);
  transaction(function(&$db) { rate($db, 'login'); });
  if(!config('admin_hash') || !password_verify((string)($in['password']??''),config('admin_hash'))) fail('Mot de passe incorrect ou non configuré.',401);
  session_regenerate_id(true); $_SESSION['admin']=true; $out=['ok'=>true];
 } elseif($action==='logout') { require_admin($in); $_SESSION=[]; session_destroy(); $out=['ok'=>true]; }
 else {
  $isAdmin=!in_array($action,['state','screen','identity','vote']);
  if($isAdmin) require_admin($in);
  $token=in_array($action,['state','identity','vote'])?participant($in):'';
  if($action==='vote') transaction(function(&$db) use($token) { rate($db,$token); });
  if($action==='identity') $out=['token'=>$token];
  else $out=transaction(function(&$db) use($in,$action,$isAdmin,$token) {
   if($action==='list') return ['sessions'=>array_map(fn($s)=>['code'=>$s['code'],'title'=>$s['title']],array_values($db['sessions']))];
   if($action==='create' || $action==='duplicate') {
    $title=text_value($in['title']??'Nouvel atelier',120); if(!$title) fail('Titre requis.');
    do { $code=''; for($i=0;$i<5;$i++) $code.='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[random_int(0,strlen('ABCDEFGHJKLMNPQRSTUVWXYZ23456789')-1)]; } while(isset($db['sessions'][$code]));
    $questions=[]; if($action==='duplicate') {
     $old=$db['sessions'][strtoupper((string)($in['code']??''))]??null; if(!$old) fail('Code inconnu.',404);
     foreach($old['questions'] as $q) { $q['id']=bin2hex(random_bytes(8)); $q['votes']=[]; $q['hidden']=[]; $questions[]=$q; }
    }
    $db['sessions'][$code]=['code'=>$code,'title'=>$title,'questions'=>$questions,'participants'=>[],'active'=>0,'open'=>false,'show'=>false,'allow_change'=>true,'deadline'=>null,'version'=>1,'updated'=>time()]; return ['code'=>$code];
   }
   $code=strtoupper((string)($in['code']??'')); if(!preg_match('/^[A-Z2-9]{5}$/D',$code)||!isset($db['sessions'][$code])) fail('Code inconnu ou session terminée.',404);
   $s=&$db['sessions'][$code];
   if(in_array($action,['state','screen','admin_state'])) return public_state($s,$token,$isAdmin);
   if($action==='delete') { unset($db['sessions'][$code]); return ['ok'=>true]; }
   if($action==='export') return ['title'=>$s['title'],'questions'=>array_map(fn($q)=>['title'=>$q['title'],'type'=>$q['type'],'options'=>$q['options'],'results'=>results($q)],$s['questions'])];
   if($action==='save_question') {
    $q=question($in['question']??[]); $index=$in['index']??null;
    if($index===null) { if(count($s['questions'])>=100) fail('Maximum 100 questions.'); $s['questions'][]=$q; }
    else { if(!is_int($index)||!isset($s['questions'][$index])) fail('Question inconnue.'); if($s['questions'][$index]['votes']) fail('Réinitialisez les votes avant de modifier cette question.'); $s['questions'][$index]=$q; }
    $s['open']=false; $s['show']=false; $s['deadline']=null;
   } elseif($action==='remove_question') {
    $i=$in['index']??-1; if(!is_int($i)||!isset($s['questions'][$i])) fail('Question inconnue.'); array_splice($s['questions'],$i,1); $s['active']=min($s['active'],max(0,count($s['questions'])-1)); $s['open']=false; $s['show']=false;
   } elseif($action==='reorder') {
    $order=$in['order']??[]; $sorted=$order; sort($sorted); if($sorted!==array_keys($s['questions'])) fail('Ordre invalide.');
    $activeId=$s['questions'][$s['active']]['id']??''; $old=$s['questions']; $s['questions']=array_map(fn($i)=>$old[$i],$order); foreach($s['questions'] as $i=>$q) if($q['id']===$activeId) $s['active']=$i;
   } elseif($action==='control') {
    $op=$in['op']??'';
    if($op==='select') { $i=$in['index']??-1; if(!is_int($i)||!isset($s['questions'][$i])) fail('Question inconnue.'); $s['active']=$i; $s['open']=false; $s['show']=false; $s['deadline']=null; }
    elseif($op==='open') { $q=$s['questions'][$s['active']]??null; if(!$q) fail('Ajoutez une question.'); $s['open']=true; $s['deadline']=$q['duration']?time()+$q['duration']:null; }
    elseif($op==='close') $s['open']=false;
    elseif($op==='show') $s['show']=true;
    elseif($op==='hide') $s['show']=false;
    elseif($op==='changes') $s['allow_change']=!empty($in['enabled']);
    elseif($op==='reset') { if(isset($s['questions'][$s['active']])) { $s['questions'][$s['active']]['votes']=[]; $s['questions'][$s['active']]['hidden']=[]; } $s['open']=false; $s['show']=false; $s['deadline']=null; }
    else fail('Commande inconnue.');
   } elseif($action==='moderate') {
    $q=&$s['questions'][$s['active']]; $id=$in['id']??''; if($q['type']!=='text'||!isset($q['votes'][$id])) fail('Réponse inconnue.'); if(!in_array($id,$q['hidden'],true)) $q['hidden'][]=$id;
   } elseif($action==='vote') {
    if(!$s['open'] || ($s['deadline'] && time()>=$s['deadline'])) fail('Le vote est fermé.',409);
    $q=&$s['questions'][$s['active']]; if(($in['question_id']??'')!==$q['id']) fail('La question a changé. Rechargez-la.',409);
    $key=hash('sha256',$token); if(isset($q['votes'][$key])&&!$s['allow_change']) fail('Vous avez déjà répondu.',409);
    if(!isset($s['participants'][$key]) && count($s['participants'])>=config('max_participants')) fail('La session a atteint sa capacité.',409);
    $v=vote_value($q,$in['value']??null); $s['participants'][$key]=true; $q['votes'][$key]=$v;
   } else fail('Action inconnue.');
   $s['version']++; $s['updated']=time(); return ['ok'=>true,'version'=>$s['version']];
  });
 }
 if(in_array($action,['state','screen'])) {
  $etag='"'.hash('sha256',json_encode($out)).'"'; header('ETag: '.$etag);
  if(($_SERVER['HTTP_IF_NONE_MATCH']??'')===$etag) { http_response_code(304); exit; }
 }
 header('Content-Type: application/json; charset=utf-8'); echo json_encode($out,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
} catch(Throwable $ex) {
 if(http_response_code()<400) http_response_code(500);
 header('Content-Type: application/json; charset=utf-8'); echo json_encode(['error'=>http_response_code()===500?'Erreur interne. Vérifiez le stockage et la configuration.':$ex->getMessage()],JSON_UNESCAPED_UNICODE);
}
