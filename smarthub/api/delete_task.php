<?php
session_start();
require_once 'connect.php';

$id = $_GET['id'];
$user_id = $_SESSION['user_id'];
$stmt = $conn->prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?");
$stmt->execute([$id, $user_id]);
?>
