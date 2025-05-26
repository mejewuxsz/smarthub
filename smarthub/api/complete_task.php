<?php
session_start();
require_once 'connect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$taskId = $data['task_id'] ?? null;

if (!$taskId) {
    http_response_code(400);
    echo json_encode(['error' => 'Task ID is required']);
    exit;
}

try {
    $conn->beginTransaction();

    // Get task details before completion
    $stmt = $conn->prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?");
    $stmt->execute([$taskId, $_SESSION['user_id']]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$task) {
        throw new Exception('Task not found');
    }

    // Record history
    $stmt = $conn->prepare("
        INSERT INTO task_history (task_id, action, before_values, after_values)
        VALUES (?, 'completed', ?, ?)
    ");
    $beforeValues = json_encode([
        'status' => $task['status'],
        'completed_at' => $task['completed_at'] ?? null
    ]);
    $afterValues = json_encode([
        'status' => 'completed',
        'completed_at' => date('Y-m-d H:i:s')
    ]);
    $stmt->execute([$taskId, $beforeValues, $afterValues]);

    // Update task status
    $stmt = $conn->prepare("
        UPDATE tasks 
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND user_id = ?
    ");
    $stmt->execute([$taskId, $_SESSION['user_id']]);

    $conn->commit();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    $conn->rollBack();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
} 