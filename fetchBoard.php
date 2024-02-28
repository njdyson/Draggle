<?php
// Set header to indicate the response type is JSON
header('Content-Type: application/json');

// Hardcoded JSON data as an array
$boardData = json_decode('{
    "boardTitle": "Test Board",
    "boardID": "NICK38567331",
    "items": [
        {
            "id": "checklist-1",
            "type": "checklist",
            "location": {
                "top": "120px",
                "left": "220px"
            },
            "size": {
                "width": 380,
                "height": 280
            },
            "title": "My Checklist",
            "todos": [
                {
                    "text": "Item 1",
                    "description": "",
                    "subtasks": ""
                }
            ]
        }
    ]
}', true);

// Convert the array to a JSON string
echo json_encode($boardData);
?>