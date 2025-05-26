<?php
session_start();
require_once 'connect.php';

// Set proper JSON header
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit();
}

// Get and validate input
$required_fields = ['title', 'description', 'category', 'deadline'];
foreach ($required_fields as $field) {
    if (empty($_POST[$field])) {
        echo json_encode(['success' => false, 'message' => "$field is required"]);
        exit();
    }
}

try {
    $user_id = $_SESSION['user_id'];
    $title = trim($_POST['title']);
    $description = trim($_POST['description']);
    $category = trim($_POST['category']);
    $deadline = $_POST['deadline'];
    $reminder = isset($_POST['reminder']) && $_POST['reminder'] !== '' ? $_POST['reminder'] : null;

    // Validate date format
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $deadline)) {
        throw new Exception('Invalid date format');
    }

    // Prepare and execute statement
    $stmt = $conn->prepare("INSERT INTO tasks (user_id, title, description, category, deadline, reminder, status) VALUES (?, ?, ?, ?, ?, ?, 'Pending')");
    $stmt->execute([$user_id, $title, $description, $category, $deadline, $reminder]);
    
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>