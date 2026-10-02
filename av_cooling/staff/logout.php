<?php require '../includes/bootstrap.php';audit('logout');session_destroy();header('Location: login.php');
