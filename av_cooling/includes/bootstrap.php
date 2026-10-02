<?php
// Config, DB, sessions, RBAC helpers. Edit DB credentials for your XAMPP.
session_start();
$pdo = new PDO('mysql:host=localhost;dbname=av_cooling;charset=utf8mb4','root','',
  [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
function e($s){return htmlspecialchars((string)$s,ENT_QUOTES,'UTF-8');}
function csrf(){return $_SESSION['csrf']??($_SESSION['csrf']=bin2hex(random_bytes(16)));}
function check_csrf(){if(!hash_equals($_SESSION['csrf']??'',$_POST['csrf']??'')){http_response_code(419);exit('Invalid CSRF token');}}
function audit($action,$details=''){global $pdo;
  $pdo->prepare('INSERT INTO audit_logs(user_id,action,details,ip) VALUES(?,?,?,?)')
      ->execute([$_SESSION['uid']??null,$action,$details,$_SERVER['REMOTE_ADDR']??'']);}
function login_user($email,$pass,$staff){global $pdo;
  $s=$pdo->prepare('SELECT u.*,r.name role FROM users u JOIN roles r ON r.id=u.role_id WHERE email=? AND status="active"');
  $s->execute([$email]);$u=$s->fetch();
  if(!$u||!password_verify($pass,$u['password_hash'])) return false;
  if($staff===($u['role']==='customer')) return false; // staff portal rejects customers & vice versa
  session_regenerate_id(true);
  $_SESSION['uid']=$u['id'];$_SESSION['role']=$u['role'];$_SESSION['name']=$u['name'];
  $p=$pdo->prepare('SELECT p.code FROM role_permissions rp JOIN permissions p ON p.id=rp.permission_id WHERE rp.role_id=?');
  $p->execute([$u['role_id']]);$_SESSION['perms']=array_column($p->fetchAll(),'code');
  audit('login');return true;}
function can($perm){return in_array($perm,$_SESSION['perms']??[],true);}
// Call at the top of EVERY protected page/endpoint. Sidebar hiding is NOT security.
function require_permission($perm){
  if(empty($_SESSION['uid'])){header('Location: /av_cooling/staff/login.php');exit;}
  if(!can($perm)){http_response_code(403);audit('denied',$perm);exit('403 Forbidden');}}
