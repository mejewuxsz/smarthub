<?php
session_start();
require_once 'connect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "message" => "Not authenticated."]);
    exit();
}

$user_id = $_SESSION['user_id'];
$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    echo json_encode(["success" => false, "message" => "Invalid data."]);
    exit();
}

$stmt = $conn->prepare("INSERT INTO tasks (user_id, title, description, category, deadline, status) VALUES (?, ?, ?, ?, ?, ?)");

foreach ($data as $row) {
    $title = $row['title'] ?? '';
    $description = $row['description'] ?? '';
    $category = $row['category'] ?? '';
    $deadline = $row['deadline'] ?? date('Y-m-d');
    $status = $row['status'] ?? 'pending';

    $stmt->execute([$user_id, $title, $description, $category, $deadline, $status]);
}

echo json_encode(["success" => true, "message" => "Tasks imported successfully."]);
?>
