<?php
session_start();
require_once 'connect.php';

header("Content-Type: application/xml");
header("Content-Disposition: attachment; filename=tasks.xml");

$user_id = $_SESSION['user_id'];
$stmt = $conn->prepare("SELECT * FROM tasks WHERE user_id = ?");
$stmt->execute([$user_id]);
$result = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<tasks>\n";
foreach ($result as $row) {
    echo "  <task>\n";
    echo "    <title>{$row['title']}</title>\n";
    echo "    <description>{$row['description']}</description>\n";
    echo "    <category>{$row['category']}</category>\n";
    echo "    <deadline>{$row['deadline']}</deadline>\n";
    echo "    <status>{$row['status']}</status>\n";
    echo "  </task>\n";
}
echo "</tasks>";
?>
