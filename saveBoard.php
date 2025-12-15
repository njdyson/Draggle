<?php
header('Content-Type: application/json');

// Database connection details
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "draggle";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die(json_encode(['error' => "Connection failed: " . $conn->connect_error]));
}

// Get the JSON data sent from the client
$jsonData = file_get_contents('php://input');
$boardData = json_decode($jsonData, true);

if (!$boardData) {
    die(json_encode(['error' => 'Invalid JSON data']));
}

// Start a transaction
$conn->begin_transaction();

try {
    // Insert or update board information
    $stmt = $conn->prepare("INSERT INTO boards (board_id, board_title) VALUES (?, ?) ON DUPLICATE KEY UPDATE board_title = ?");
    $stmt->bind_param("sss", $boardData['boardID'], $boardData['boardTitle'], $boardData['boardTitle']);
    $stmt->execute();

    // Delete existing panels for this board (we'll re-insert all panels)
    $stmt = $conn->prepare("DELETE FROM panels WHERE board_id = ?");
    $stmt->bind_param("s", $boardData['boardID']);
    $stmt->execute();

    // Insert panels
    $stmt = $conn->prepare("INSERT INTO panels (board_id, panel_id, panel_type, content, location_top, location_left, size_width, size_height) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

    foreach ($boardData['items'] as $item) {
        $stmt->bind_param("ssssssii", 
            $boardData['boardID'],
            $item['id'],
            $item['type'],
            $item['content'],
            $item['location']['top'],
            $item['location']['left'],
            $item['size']['width'],
            $item['size']['height']
        );
        $stmt->execute();
    }

    // Commit the transaction
    $conn->commit();

    echo json_encode(['success' => true, 'message' => 'Board saved successfully']);
} catch (Exception $e) {
    // An error occurred, rollback the transaction
    $conn->rollback();
    echo json_encode(['error' => 'An error occurred: ' . $e->getMessage()]);
}

$conn->close();
?>
