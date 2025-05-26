<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once 'connect.php';
header('Content-Type: application/json');
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

$id = $_POST['id'] ?? null;
if (!$id) {
    echo json_encode(['success' => false, 'message' => 'Task ID is required.']);
    exit;
}

// Build update fields dynamically
$fields = [];
$params = [];
if (isset($_POST['title'])) {
    $fields[] = 'title = ?';
    $params[] = $_POST['title'];
}
if (isset($_POST['description'])) {
    $fields[] = 'description = ?';
    $params[] = $_POST['description'];
}
if (isset($_POST['category'])) {
    $fields[] = 'category = ?';
    $params[] = $_POST['category'];
}
if (isset($_POST['deadline'])) {
    $fields[] = 'deadline = ?';
    $params[] = $_POST['deadline'];
}
if (isset($_POST['reminder'])) {
    $fields[] = 'reminder = ?';
    $params[] = $_POST['reminder'] !== '' ? $_POST['reminder'] : null;
}

if (empty($fields)) {
    echo json_encode(['success' => false, 'message' => 'No fields to update.']);
    exit;
}

try {
    $conn->beginTransaction();
    // Get task details before edit
    $stmt = $conn->prepare("SELECT * FROM tasks WHERE id = ?");
    $stmt->execute([$id]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$task) {
        throw new Exception('Task not found');
    }
    // Record history
    $beforeValues = json_encode($task);
    $afterValues = json_encode(array_merge($task, array_combine(array_map(function($f){return explode(' = ', $f)[0];}, $fields), $params)));
    $stmt = $conn->prepare("INSERT INTO task_history (task_id, action, before_values, after_values) VALUES (?, 'edited', ?, ?)");
    $stmt->execute([$id, $beforeValues, $afterValues]);
    // Update task
    $sql = "UPDATE tasks SET " . implode(', ', $fields) . " WHERE id = ?";
    $params[] = $id;
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Task updated successfully.']);
} catch (Exception $e) {
    $conn->rollBack();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} 