<?php
// Display PHP information
phpinfo();

// Database connection parameters from environment variables
$host = getenv('DB_HOST') ?: 'db';
$dbname = getenv('DB_NAME') ?: 'smartstudyhub';
$user = getenv('DB_USER') ?: 'smarthub_user';
$pass = getenv('DB_PASSWORD') ?: 'smarthub_password';

echo "<h1>Database Connection Test</h1>";

try {
    // Create connection
    $conn = new PDO("mysql:host=$host;dbname=$dbname", $user, $pass);
    
    // Set the PDO error mode to exception
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<div style='color: green; font-size: 20px; margin: 20px;'>";
    echo "✅ Successfully connected to MySQL database!<br>";
    echo "Host: $host<br>";
    echo "Database: $dbname<br>";
    echo "</div>";

    // Get MySQL version
    $version = $conn->query('select version()')->fetchColumn();
    echo "<div style='margin: 20px;'>";
    echo "MySQL Version: $version<br>";
    echo "</div>";

} catch(PDOException $e) {
    echo "<div style='color: red; font-size: 20px; margin: 20px;'>";
    echo "❌ Connection failed: " . $e->getMessage();
    echo "</div>";
}

// Add some basic styling
echo "<style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; }
</style>";
?> 