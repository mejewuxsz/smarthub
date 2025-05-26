<?php
session_start();
require_once 'connect.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$id = $_POST['id'] ?? null;
$all = isset($_POST['all']) ? (bool)$_POST['all'] : false;

try {
    if ($all) {
        // Delete all history for this user's tasks
        $stmt = $conn->prepare("DELETE h FROM task_history h JOIN tasks t ON h.task_id = t.id WHERE t.user_id = ?");
        $stmt->execute([$_SESSION['user_id']]);
    } elseif ($id) {
        // Delete a specific history entry, but only if it belongs to this user
        $stmt = $conn->prepare("DELETE h FROM task_history h JOIN tasks t ON h.task_id = t.id WHERE h.id = ? AND t.user_id = ?");
        $stmt->execute([$id, $_SESSION['user_id']]);
    } else {
        throw new Exception('No history id or all flag provided.');
    }
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
} 