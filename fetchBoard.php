<?php
// Set header to indicate the response type is JSON
header('Content-Type: application/json');

// Read the JSON data from the file
$boardData = file_get_contents('/Boards/Basecamp.json');

// Convert the JSON string to an array
$boardDataArray = json_decode($boardData, true);

// Convert the array to a JSON string
echo json_encode($boardDataArray);
?>