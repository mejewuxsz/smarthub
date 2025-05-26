<?php
session_start();
require_once 'connect.php';

$user_id = $_SESSION['user_id'];

$stmt = $conn->prepare("SELECT id, title, description, category, deadline, reminder, status FROM tasks WHERE user_id = ?");
$stmt->execute([$user_id]);
$tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($tasks);
?>
