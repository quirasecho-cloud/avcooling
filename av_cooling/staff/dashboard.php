<?php require '../includes/bootstrap.php';
if(empty($_SESSION['uid'])||$_SESSION['role']==='customer'){header('Location: login.php');exit;}
// label => [permission, page]. Each module page must ALSO call require_permission().
$modules=['POS'=>['use_pos','pos.php'],'Orders'=>['view_orders','orders.php'],'Payments'=>['view_payments','payments.php'],
 'Products'=>['view_products','products.php'],'Inventory'=>['view_inventory','inventory.php'],
 'Restock'=>['create_restock','restock.php'],'Service Requests'=>['view_service_requests','service_requests.php'],
 'Technician Scheduling'=>['schedule_technicians','scheduling.php'],'My Jobs'=>['view_assigned_jobs','my_jobs.php'],
 'Customers'=>['view_customers','customers.php'],'Feedback'=>['view_feedback','feedback.php'],
 'Reports'=>['view_reports','reports.php'],'Staff Accounts'=>['manage_staff','staff_accounts.php'],
 'Audit Logs'=>['view_audit_logs','audit_logs.php'],'Settings'=>['manage_settings','settings.php']];
?><!doctype html><html><head><meta charset="utf-8"><title>Dashboard</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"></head>
<body><div class="d-flex"><nav class="bg-dark text-white p-3" style="width:240px;min-height:100vh">
<h6>AV COOLING SYSTEM</h6><small><?=e($_SESSION['name'])?> (<?=e($_SESSION['role'])?>)</small><hr>
<ul class="nav flex-column"><li><a class="nav-link text-white" href="dashboard.php">Dashboard</a></li>
<?php foreach($modules as $label=>[$perm,$file]) if(can($perm)):?>
<li><a class="nav-link text-white" href="<?=$file?>"><?=e($label)?></a></li><?php endif;?>
<li><a class="nav-link text-white" href="logout.php">Logout</a></li></ul></nav>
<main class="p-4"><h3>Welcome, <?=e($_SESSION['name'])?></h3><p>Only modules your role is permitted to use appear in the sidebar.</p></main></div></body></html>
