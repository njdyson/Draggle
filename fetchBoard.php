<?php
// Set header to indicate the response type is JSON
header('Content-Type: application/json');

// Hardcoded JSON data as an array
$boardData = [
    "boardTitle" => "Basecamp",
    "items" => [
        [
            "id" => "checklist-1",
            "type" => "checklist",
            "location" => [
                "top" => "76.8px",
                "left" => "51.2px"
            ],
            "size" => [
                "width" => 400,
                "height" => 504.8
            ],
            "title" => "Todos",
            "content" => "<li class=\"todo-item\"><div class=\"drag-handle\">☰</div><input type=\"checkbox\" class=\"todo-checkbox\"><span class=\"editable\">Item 1</span></li><li class=\"todo-item\"><div class=\"drag-handle\">☰</div><input type=\"checkbox\" class=\"todo-checkbox\"><span class=\"editable\">Item 2</span></li><li class=\"todo-item completed\"><div class=\"drag-handle\">☰</div><input type=\"checkbox\" class=\"todo-checkbox\"><span class=\"editable\">Item 3</span></li>"
        ],
        [
            "id" => "note-1",
            "type" => "note",
            "location" => [
                "top" => "614.4px",
                "left" => "51.2px"
            ],
            "size" => [
                "width" => 400,
                "height" => 300
            ],
            "title" => "Notes",
            "content" => "Hello world"
        ],
        [
            "id" => "table-1",
            "type" => "table",
            "location" => [
                "top" => "76.8px",
                "left" => "486.4px"
            ],
            "size" => [
                "width" => 860.8,
                "height" => 274.4
            ],
            "title" => "Diet",
            "content" => "\n                    <tbody><tr><th class=\"\"></th><th class=\"\">Mon</th><th class=\"\">Tue</th><th class=\"\">Wed</th><th class=\"\">Thu</th><th class=\"\">Fri</th></tr>\n                    <tr><td class=\"\">Breakfast</td><td></td><td></td><td></td><td></td><td></td></tr>\n                <tr><td class=\"\">Lunch</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td class=\"\">Dinner</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td class=\"\"></td><td></td><td></td><td></td><td></td><td></td></tr></tbody>"
        ]
    ]
];

// Convert the array to a JSON string
echo json_encode($boardData);
?>