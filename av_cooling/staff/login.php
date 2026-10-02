<?php require '../includes/bootstrap.php';
$err='';
if($_SERVER['REQUEST_METHOD']==='POST'){check_csrf();
  if(login_user(trim($_POST['email']),$_POST['password'],true)){header('Location: dashboard.php');exit;}
  $err='Invalid credentials.';}
?><!doctype html><html><head><meta charset="utf-8"><title>Staff Login</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"></head>
<body class="bg-light"><div class="container" style="max-width:380px;margin-top:12vh">
<div class="card p-4 shadow-sm"><h4 class="mb-3">AV COOLING SYSTEM<br><small class="text-muted">Staff Portal</small></h4>
<?php if($err):?><div class="alert alert-danger"><?=e($err)?></div><?php endif;?>
<form method="post"><input type="hidden" name="csrf" value="<?=csrf()?>">
<input class="form-control mb-2" type="email" name="email" placeholder="Email" required>
<input class="form-control mb-3" type="password" name="password" placeholder="Password" required>
<button class="btn btn-primary w-100">Login</button></form></div></div></body></html>
git remote add origin https://github.com/quirasecho-cloud/avcooling.git
