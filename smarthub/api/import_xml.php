<?php
session_start();
require_once 'connect.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "message" => "Not logged in"]);
    exit;
}

$user_id = $_SESSION['user_id'];

// Check if file is uploaded
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["success" => false, "message" => "No file uploaded or upload error"]);
    exit;
}

// Try to load XML
$xml = @simplexml_load_file($_FILES['file']['tmp_name']);
if ($xml === false) {
    echo json_encode(["success" => false, "message" => "Invalid XML file"]);
    exit;
}

$stmt = $conn->prepare("INSERT INTO tasks (user_id, title, description, category, deadline, status) VALUES (?, ?, ?, ?, ?, ?)");

$imported = 0;
foreach ($xml->task as $task) {
    // Validate required fields
    if (!isset($task->title) || !isset($task->description) || !isset($task->category) || !isset($task->deadline) || !isset($task->status)) {
        continue; // skip incomplete tasks
    }
    try {
        $stmt->execute([
            $user_id,
            (string)$task->title,
            (string)$task->description,
            (string)$task->category,
            (string)$task->deadline,
            (string)$task->status
        ]);
        $imported++;
    } catch (Exception $e) {
        // Optionally log $e->getMessage()
        continue;
    }
}

if ($imported > 0) {
    echo json_encode(["success" => true, "imported" => $imported]);
} else {
    echo json_encode(["success" => false, "message" => "No tasks imported. Check your XML file."]);
}
?>
