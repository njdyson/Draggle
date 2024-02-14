// When the document is ready, execute this function
$(document).ready(function() { 
   
    // Declare vaiables
    var grid_size = 50; // Define the grid size
    var panel_width = 200; // Define the default panel width
    var panel_height = 200; // Define the default panel height
    var centerX = Math.round(($('#canvas').width() / 2 - panel_width / 2) / grid_size) * grid_size;// Calculate the center x position for the new panel
    var centerY = Math.round(($('#canvas').height() / 2 - panel_height / 2) / grid_size) * grid_size;// Calculate the center y position for the new panel
    
    
    // THIS DOESN'T WORK
    $(document).ready(function() {
        var lastLoadedBoard = localStorage.getItem('lastLoadedBoard'); // Get the filename from local storage
        fetch(lastLoadedBoard + '.json')
        .then(response => response.json())
        .then(data => {
            // Use this data to load the board
            loadBoardFromData(data);
        })
        .catch(error => console.error('Error:', error));
    }); 

    // Event handler for adding a new checklist
    $('#addChecklist').click(function() {
        // Count the number of existing panels to generate a unique ID
        var checklistCount = $('.checklist').length + 1;
        var panelId = 'checklist-' + checklistCount;
    
        // HTML markup for the new panel
        var panelHtml = `<div class="checklist" id="${panelId}" style="left:${centerX}px; top:${centerY}px;">
        <div class="handle"></div> <!-- Handle for dragging the panel -->
        <button class="delete-panel">X</button> <!-- Delete button -->
        <input type="text" class="panel-title" value="Checklist ${checklistCount}" onfocus="this.select()" onkeyup="if(event.keyCode==13) {this.blur();}">
        <ul class="todo-list"></ul> <!-- List for todo items -->
        <input type="text" class="todo-input" placeholder="Add new todo"/> <!-- Input field for adding new todos -->
        </div>`;

        createPanel(panelHtml, panelId);
    });

    //Add a note
    $('#addNote').click(function() {
        // Count the number of existing panels to generate a unique ID
        var noteCount = $('.note').length + 1;
        var panelId = 'note-' + noteCount;

        // HTML markup for the new panel
        var panelHtml = `<div class="note" id="${panelId}" style="left:${centerX}px; top:${centerY}px;">
            <div class="handle"></div> <!-- Handle for dragging the panel -->
            <button class="delete-panel">X</button> <!-- Delete button -->
            <input type="text" class="panel-title" value="Note ${noteCount}" onfocus="this.select()" onkeyup="if(event.keyCode==13) {this.blur();}">
            <div class="note-body" contenteditable="true"></div> <!-- Text area for the panel body -->
        </div>`;

        createPanel(panelHtml, panelId);
    });
    
    $('#addTable').click(function() {
        var tableCount = $('.table-panel').length + 1;
        var panelId = 'table-' + tableCount;
    
        var panelHtml = `<div class="table-panel" id="${panelId}" style="left:${centerX}px; top:${centerY}px;">
            <div class="handle"></div>
            <button class="delete-panel">X</button>
            <input type="text" class="panel-title" value="Table ${tableCount}" onfocus="this.select()" onkeyup="if(event.keyCode==13) {this.blur();}">
            <div class="table-container">
                <table class="editable-table">
                    <tr><th></th><th></th></tr>
                    <tr><td></td><td></td></tr>
                </table>
            </div>
            <div class="add-row-symbol">+</div>
            <div class="add-column-symbol">+</div>
        </div>`;
    
        createPanel(panelHtml, panelId);
        // Call function to make table cells editable
        makeCellsEditable();
        positionPlusSymbols(panelId);
    });

    function createPanel(panelHtml, panelId) {
        // Append the new panel to the canvas
        $('#canvas').append(panelHtml);

        $('#' + panelId).draggable({
            handle: ".handle", // Specify the handle for dragging
            cancel: ".panel-title, .editable", // Specify elements to exclude from dragging
            grid: [grid_size, grid_size], // Set the grid size to snap to during dragging
            containment: "#canvas" // Specify the containment element
        }).resizable({
            minHeight: 200, // Set the minimum height of the panel
            minWidth: 200, // Set the minimum width of the panel
            grid: [grid_size, grid_size] // Set the grid size to snap to during resizing
        });

        // Make the todo items sortable
        $('.todo-list').sortable({
            handle: ".drag-handle", // Specify the handle for sorting
            placeholder: "sortable-placeholder" // Specify the placeholder for sorting
        }).disableSelection(); // Disable text selection while sorting
    }    

    // Event handler for deleting a panel or note
    $(document).on('click', '.delete-panel', function() {
        if (confirm('Are you sure you want to delete this panel/note?')) {
            $(this).closest('.panel, .note').remove();
        }
    });


    // Event handler for adding a new todo item
    $(document).on('keypress', '.todo-input', function(e) {
        if (e.which == 13) { // Check if the Enter key is pressed
            var todoText = $(this).val(); // Get the text entered in the input field
            $(this).val(''); // Clear the input field
            var listItem = `<li class='todo-item'><div class="drag-handle">&#x2630;</div><input type="checkbox" class="todo-checkbox"/><span class="editable">${todoText}</span></li>`; // HTML markup for the new todo item
            $(this).siblings('.todo-list').append($(listItem)); // Append the new todo item to the todo list
        }
    });

    // Event handler for making todo item text editable
    $(document).on('click', '.editable', function() {
        var $editable = $(this);
        $editable.attr('contenteditable', 'true').focus(); // Make the text editable and focus on it

        // Enable cursor movement and text selection
        $editable.on('mousedown', function(e) {
            e.stopPropagation();
        }).on('keydown', function(e) {
            e.stopPropagation();
        }).on('mouseup', function(e) {
            e.stopPropagation();
        }).on('selectstart', function(e) {
            e.stopPropagation();
        });
    });

    function makeCellsEditable() {
        $(document).on('click', '.editable-table th, .editable-table td', function() {
            var $cell = $(this);
            if (!$cell.is('.editing')) {
                var cellText = $cell.text();
                $cell.addClass('editing').html('<input type="text" value="' + cellText + '">').find('input').focus();
            }
    
            $cell.on('blur', 'input', function() {
                var newText = $(this).val();
                $cell.removeClass('editing').html(newText);
            }).on('keypress', function(e) {
                if (e.which == 13) { // Enter key pressed
                    $(this).blur(); // Trigger blur to save
                }
            });
        });
    }

    $(document).on('click', '.add-row-symbol', function() {
        var $table = $(this).siblings('.table-container').find('table');
        var $lastRow = $table.find('tr:last');
        var newRow = $lastRow.clone();
        newRow.find('td').text(''); // Clear the text in new row cells
        $table.append(newRow);

    });

    $(document).on('click', '.add-column-symbol', function() {
        var $table = $(this).siblings('.table-container').find('table');
        // Add a new column header
        var columnHeader = "<th></th>";
        $table.find('tr:first').append(columnHeader);
      
        // Add a new cell to each row in the table body
        $table.find('tr').each(function() {
            if ($(this).find('th').length === 0) { // It's not a header row
                $(this).append('<td></td>');
            }
        });
    
        // Call function to make new cells editable
        makeCellsEditable();

    });
    

    // Event handler for updating todo item text
    $(document).on('blur', '.editable[contenteditable="true"]', function() {
        $(this).attr('contenteditable', 'false'); // Disable editing
        var updatedText = $(this).text(); // Get the updated text
        console.log("Todo updated to: " + updatedText); // Log the updated text
    });

    // Event handler for marking a todo item as completed
    $(document).on('click', '.todo-checkbox', function() {
        $(this).parent().toggleClass('completed');
    });

    // Event handler for saving the text file when the saveToFile button is pressed
    $('#saveToFile').click(function() {
        saveTextFile();
    });

    function makeTitleEditable() {
        $('#canvasTitle').one('click', function() {
            var currentTitle = $(this).text();
            var editInputHtml = '<input type="text" class="title-input" value="' + currentTitle + '">';
            var $editInput = $(editInputHtml).replaceAll($(this));
            $editInput.focus();

            // When the input loses focus, replace it with the title
            $editInput.on('blur keyup', function(e) {
                if (e.type === 'blur' || e.key === 'Enter') {
                    var newTitle = $editInput.val();
                    $editInput.replaceWith('<div id="canvasTitle" class="editable-title">' + newTitle + '</div>');
                    makeTitleEditable(); // Reattach the event listener
                }
            });
        });
    }

    // Initialize the editable title functionality
    makeTitleEditable();

    // Function to save a text file to a local folder
    function saveTextFile() {
        var boardData = collectBoardData();
        var text = boardData; // JSON string of board data
        var filename = $("#canvasTitle").text() + ".json"; // Append .json to the filename
        localStorage.setItem('lastLoadedBoard', filename);
        var blob = new Blob([text], {type: "application/json;charset=utf-8"}); // Specify JSON MIME type
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = filename; // Specify the file name
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function collectBoardData() {
        var boardData = {
            boardTitle: $("#canvasTitle").text(),
            items: []
        };
    
        // Iterate through all checklists
        $('.checklist').each(function() {
            var panel = $(this);
            var item = {
                id: panel.attr('id'),
                type: 'checklist',
                location: { top: panel.css('top'), left: panel.css('left') },
                size: { width: panel.width(), height: panel.height() },
                title: panel.find('.panel-title').val(),
                content: panel.find('.todo-list').html() // Capture the HTML content of the todo-list
            };
            boardData.items.push(item);
        });
    
        // Iterate through all notes
        $('.note').each(function() {
            var note = $(this);
            var item = {
                id: note.attr('id'),
                type: 'note',
                location: { top: note.css('top'), left: note.css('left') },
                size: { width: note.width(), height: note.height() },
                title: note.find('.panel-title').val(),
                content: note.find('.note-body').text()
            };
            boardData.items.push(item);
        });
    
        // Convert the boardData object to JSON
        return JSON.stringify(boardData, null, 2); // Pretty-print the JSON
    }
    
    document.getElementById('loadBoard').addEventListener('click', function() {
        // Programmatically click the hidden file input
        document.getElementById('loadBoardFile').click();
        loadBoardFromData(boardData);
    });
    
    document.getElementById('loadBoardFile').addEventListener('change', function() {
        if (this.files.length > 0) {
            var file = this.files[0];
            var reader = new FileReader();
    
            reader.onload = function(e) {
                var boardData = JSON.parse(e.target.result);
                loadBoardFromData(boardData);
            };
    
            reader.readAsText(file);
        }
    });

    function loadBoardFromData(boardData) {
                
        // Clear existing panels and notes
        $('.checklist, .note').remove();

        // Reset panel count if necessary
        var checklistCount = 0;
        var noteCount = 0;

        // Set the board title
        $("#canvasTitle").text(boardData.boardTitle);

        boardData.items.forEach(function(item) {
            if (item.type === 'checklist') {
                checklistCount++;
                var panelHtml = `
                    <div class="checklist" id="${item.id}" style="left:${item.location.left}; top:${item.location.top}; width: ${item.size.width}px; height: ${item.size.height}px;">
                        <div class="handle"></div>
                        <button class="delete-panel">X</button>
                        <input type="text" class="panel-title" value="${item.title}" onfocus="this.select()" onkeyup="if(event.keyCode==13) {this.blur();}">
                        <ul class="todo-list">${item.content}</ul>
                        <input type="text" class="todo-input" placeholder="Add new item"/>
                    </div>`;
            }
            else if (item.type === 'note') {
                noteCount++;
                var panelHtml = `
                    <div class="note" id="${item.id}" style="left:${item.location.left}; top:${item.location.top}; width: ${item.size.width}px; height: ${item.size.height}px;">
                        <div class="handle"></div>
                        <button class="delete-panel">X</button>
                        <input type="text" class="panel-title" value="${item.title}" onfocus="this.select()" onkeyup="if(event.keyCode==13) {this.blur();}">
                        <div class="note-body" contenteditable="true">${item.content}</div>
                    </div>`;
            }
            createPanel(panelHtml, item.id);
        });

        
    }
    
});
