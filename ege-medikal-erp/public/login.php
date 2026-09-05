<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/app/bootstrap.php';
if(logged()){header('Location: index.php');exit;}
$error='';
if($_SERVER['REQUEST_METHOD']==='POST'){
 verify_csrf();
 $s=db()->prepare('SELECT u.id,u.tenant_id,u.ad_soyad,u.parola_hash,u.aktif,r.kod rol FROM kullanicilar u JOIN roller r ON r.id=u.rol_id WHERE u.email=? LIMIT 1');
 $s->execute([trim((string)($_POST['email']??''))]);$u=$s->fetch();
 if($u&&$u['aktif']&&password_verify((string)($_POST['password']??''),$u['parola_hash'])){session_regenerate_id(true);$_SESSION['user_id']=(int)$u['id'];$_SESSION['tenant_id']=(int)$u['tenant_id'];$_SESSION['user_name']=$u['ad_soyad'];$_SESSION['user_role']=$u['rol'];header('Location: index.php');exit;}
 $error='E-posta veya parola hatalı.';
}
?><!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Giriş</title><style>body{margin:0;background:#090d13;color:#eef5fb;font-family:system-ui;min-height:100vh;display:grid;place-items:center}.c{width:min(420px,92vw);background:#111821;border:1px solid #263342;border-radius:20px;padding:26px}.i{width:100%;box-sizing:border-box;background:#0c131b;color:#fff;border:1px solid #263645;border-radius:10px;padding:11px;margin:6px 0 12px}.b{width:100%;background:#2484ff;color:#fff;border:0;border-radius:10px;padding:11px;font-weight:800}.m{color:#8da0b3;font-size:12px}.e{color:#ff9aa5}</style></head><body><form class="c" method="post"><?=csrf_field()?><h2>Serdar GÜNLÜ Management System</h2><p class="m">Envanter · Teknik Servis · Bakım · Depo/Stok · Lojistik</p><?php if($error):?><p class="e"><?=h($error)?></p><?php endif;?><label>E-posta</label><input class="i" type="email" name="email" required><label>Parola</label><input class="i" type="password" name="password" required><button class="b">Sisteme Giriş Yap</button><p class="m">Demo: admin@ege.local / Demo123!</p></form></body></html>