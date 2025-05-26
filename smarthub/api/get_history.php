<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
require_once 'connect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

try {
    $stmt = $conn->prepare("
        SELECT 
            h.id,
            t.title,
            h.action,
            h.before_values,
            h.after_values,
            h.created_at
        FROM task_history h
        JOIN tasks t ON h.task_id = t.id
        WHERE t.user_id = ?
        ORDER BY h.created_at DESC
    ");
    $stmt->execute([$_SESSION['user_id']]);
    $history = [];
    while ($item = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $note = '';
        if ($item['action'] === 'edited') {
            $before = json_decode($item['before_values'], true);
            $after = json_decode($item['after_values'], true);
            $changes = [];
            foreach ($before as $key => $val) {
                if (isset($after[$key]) && $after[$key] != $val) {
                    $changes[] = ucfirst($key) . ': "' . $val . '" → "' . $after[$key] . '"';
                }
            }
            $note = $changes ? implode('; ', $changes) : 'No visible changes.';
        }
        $history[] = [
            'id' => $item['id'],
            'title' => $item['title'],
            'action' => $item['action'],
            'note' => $note,
            'timestamp' => $item['created_at']
        ];
    }
    echo json_encode(['success' => true, 'history' => $history]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
} 