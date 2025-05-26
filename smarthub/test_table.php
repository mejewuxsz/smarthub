<?php
// Database connection parameters
$host = getenv('DB_HOST') ?: 'db';
$dbname = getenv('DB_NAME') ?: 'smartstudyhub';
$user = getenv('DB_USER') ?: 'smarthub_user';
$pass = getenv('DB_PASSWORD') ?: 'smarthub_password';

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create test table
    $sql = "CREATE TABLE IF NOT EXISTS test_table (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $conn->exec($sql);
    echo "✅ Test table created successfully<br>";

    // Insert test data
    $sql = "INSERT INTO test_table (name) VALUES ('Test Entry 1')";
    $conn->exec($sql);
    echo "✅ Test data inserted successfully<br>";

    // Query the data
    $stmt = $conn->query("SELECT * FROM test_table");
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "<h3>Table Contents:</h3>";
    echo "<pre>";
    print_r($results);
    echo "</pre>";

} catch(PDOException $e) {
    echo "❌ Error: " . $e->getMessage();
}
?> 