<?php
declare(strict_types=1);
date_default_timezone_set('Europe/Istanbul');
if(session_status()!==PHP_SESSION_ACTIVE){session_name('ege_medikal_erp');session_set_cookie_params(['httponly'=>true,'secure'=>(!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off'),'samesite'=>'Lax','path'=>'/']);session_start();}
require_once dirname(__DIR__).'/config/database.php';
function h(?string $v):string{return htmlspecialchars((string)$v,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');}
function csrf_token():string{if(empty($_SESSION['_csrf']))$_SESSION['_csrf']=bin2hex(random_bytes(32));return $_SESSION['_csrf'];}
function csrf_field():string{return '<input type="hidden" name="_csrf" value="'.h(csrf_token()).'">';}
function verify_csrf():void{$v=$_POST['_csrf']??'';if(!$v||!hash_equals($_SESSION['_csrf']??'',$v)){http_response_code(419);exit('CSRF doğrulaması başarısız.');}}
function logged():bool{return !empty($_SESSION['user_id']);}
function require_login():void{if(!logged()){header('Location: login.php');exit;}}
function tenant_id():int{return (int)($_SESSION['tenant_id']??1);}
function user_id():int{return (int)($_SESSION['user_id']??0);}
function role():string{return $_SESSION['user_role']??'MISAFIR';}
function role_in(array $r):bool{return in_array(role(),$r,true);}
function flash(string $m):void{$_SESSION['_flash']=$m;}
function uuid4():string{$d=random_bytes(16);$d[6]=chr((ord($d[6])&15)|64);$d[8]=chr((ord($d[8])&63)|128);return vsprintf('%s%s-%s-%s-%s-%s%s%s',str_split(bin2hex($d),4));}
