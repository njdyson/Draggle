// When the document is ready, execute this function
$(document).ready(function() { 
   
    // Declare vaiables
    var grid_size_x = $(window).width() / 80; // Define the x grid size as one 40th of the screen width
    var grid_size_y = $(window).height() / 40; // Define the y grid size as one 40th of the screen height
    var panel_width = $(window).width() / 8; // Define the default panel width
    var panel_height = $(window).height() / 4; // Define the default panel height
    //var centerX = Math.round(($('#canvas').width() / 2 - panel_width / 2) / grid_size) * grid_size;// Calculate the center x position for the new panel
    //var centerY = Math.round(($('#canvas').height() / 2 - panel_height / 2) / grid_size) * grid_size;// Calculate the center y position for the new panel
    var centerX = 0;
    var centerY = 0;
    

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

    // Event handler for adding a new note
    $('#addNote').click(function() {
        // Count the number of existing panels to generate a unique ID
        var noteCount = $('.note').length + 1;
        var panelId = 'note-' + noteCount;

        var editorId = 'editor-' + noteCount; // Generate a unique ID for each editor instance
        var panelHtml = `<div class="note" id="${panelId}" style="left:${centerX}px; top:${centerY}px;">
            <div class="handle"></div>
            <button class="delete-panel">X</button>
            <div id="${editorId}"></div> <!-- Unique ID for the Quill editor container -->
        </div>`;

        createPanel(panelHtml, panelId);

        const toolbarOptions = [[{ 'header': 1 }, { 'header': 2 },'bold', 'italic', 'underline', 'strike',{ 'color': [] }], 
        [{ 'list': 'bullet' }, { 'list': 'ordered'}],['code-block', 'link']];

        var quill = new Quill(`#${editorId}`, { 
            modules: {
                toolbar: toolbarOptions,
              },
              placeholder: 'Content...',
              theme: 'snow'
        });
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

    $('#addProcess').click(function() {
        var processCount = $('.process-panel').length + 1;
        var panelId = 'process-' + processCount;
    
        var panelHtml = `<div class="process-panel" id="${panelId}" style="left:${centerX}px; top:${centerY}px;">
            <div class="handle"></div>
            <button class="delete-panel">X</button>
            <input type="text" class="panel-title" value="Process ${processCount}">
            <ol class="process-list"></ol>
            <input type="text" class="process-input" placeholder="Add new step"/>
        </div>`;
    
        createPanel(panelHtml, panelId);

    });
    

    function createPanel(panelHtml, panelId) {
        // Append the new panel to the canvas
        $('#canvas').append(panelHtml);

        $('#' + panelId).draggable({
            handle: ".handle", // Specify the handle for dragging
            cancel: ".panel-title, .editable", // Specify elements to exclude from dragging
            grid: [grid_size_x, grid_size_y], // Set the grid size to snap to during dragging
            containment: "#canvas" // Specify the containment element
        }).resizable({
            minHeight: 200, // Set the minimum height of the panel
            minWidth: 200, // Set the minimum width of the panel
            grid: [grid_size_x, grid_size_y], // Set the grid size to snap to during resizing
        });

        // Check if this is a process panel and make its list sortable
        if ($('#' + panelId).hasClass('process-panel')) {
            $('#' + panelId + ' .process-list').sortable({
                placeholder: "sortable-placeholder",
                update: function(event, ui) {
                    updateProcessNumbers(panelId);
                }
            }).disableSelection();
        }

        // Check if this is a checklist panel and make its list sortable
        if ($('#' + panelId).hasClass('checklist')) {
            $('#' + panelId + ' .todo-list').sortable({
                placeholder: "sortable-placeholder",
                update: function(event, ui) {
                    updateProcessNumbers(panelId);
                }
            }).disableSelection();
        }
    }

     // Event handler for adding a new todo item
     $(document).on('keypress', '.todo-input', function(e) {
        if (e.which == 13) {
            var timestamp = new Date().getTime(); // Get current timestamp
            var todoText = $(this).val();
            $(this).val('');
            var listItem = $(`<li class='todo-item' id='todo-${timestamp}'><input type="checkbox" class="todo-checkbox"/><span class="editable">${todoText}</span><button class="edit-todo-btn" data-todo-id='todo-${timestamp}'>...</button></li>`);
            listItem.data('description', ''); // Store the description as part of the todo item's data
            listItem.data('date');
            $(this).siblings('.todo-list').append(listItem);

        }
    });
    
    // Function to add a new step to the process panel
    $(document).on('keypress', '.process-input', function(e) {
        if (e.which == 13) { // Enter key pressed
            var timestamp = new Date().getTime(); // Get current timestamp
            var stepText = $(this).val();
            $(this).val(''); // Clear the input field after adding the step
            var listItem = $(`<li>
                <span class="process-item" id='process-${timestamp}'>${stepText}</span>
                <button class="edit-process-btn" data-process-id='process-${timestamp}'>...</button>
                <div class="process-description"></div> <!-- Placeholder for description -->
                </li>`); 
            listItem.data('description', ''); // Store the description as part of the todo item's data
            $(this).siblings('.process-list').append(listItem);
        }
    });
    
    // Create overlay to checklist to edit details
    function createOverlayPanel(todoId) {
        // Remove any existing overlay before creating a new one
        $('.overlay-panel').remove();
    
        var todoItem = $('#' + todoId);
        var todoText = todoItem.find('.editable').text();
        var description = todoItem.data('description');
        var currentTodoDate = todoItem.data('date'); // Get the current date
    
        var overlay = $(`<div class="overlay-panel">
                    <div class="overlay-title" style='text-align:center;background-color:#202020;'>Edit Item</div>
                        <div style="padding: 10px;">
                            <label for="item-line" style='color: #ffffff;'>Item</label><br>
                            <input type="text" id="item-line" class="item-line" value="${todoText}" onfocus="this.select()" onkeyup="if(event.keyCode==13) {this.blur();}">
                            <label for="todo-date" style='color: #ffffff;'>Due Date</label><br>
                            <input type="text" id="todo-date" class="date-picker" placeholder="DD-MM-YYYY" /><br>
                            <label for="note-body" style='color: #ffffff;'>Description</label>
                            <div class="note-body" contenteditable="true" style='padding:10px;opacity:0.6;'>${description}</div>
                            <div class="overlay-nav">
                                <button id='save-item' class="overlay-button">Save</button>
                                <button id='cancel-item' class="overlay-button">Cancel</button>
                            </div>
                    </div>
                </div>`);
                         
    
        var panel = todoItem.closest('.table-panel, .checklist, .note');
        overlay.css({
            width: panel.outerWidth(),
            height: panel.outerHeight(),
            top: panel.position().top,
            left: panel.position().left
        });
    
        $('#canvas').append(overlay);

        // Then, initialize the datepicker
        overlay.find('.date-picker').datepicker({
            dateFormat: 'dd-mm-yy',
            onSelect: function(dateText) {
                var todoItem = $('#' + todoId);
                todoItem.data('date', dateText); // Store the selected date
            }
        });

        // Set the date on the datepicker if it exists
        if(currentTodoDate) {
            // Assuming currentTodoDate is in 'DD-MM-YYYY' format
            var parts = currentTodoDate.split('-');
            // Note: JavaScript months are 0-based, so subtract 1 from the month part
            var formattedDate = new Date(parts[2], parts[1] - 1, parts[0]);
        
            // Now set the date on the datepicker
            overlay.find('.date-picker').datepicker('setDate', formattedDate);
        }
          
        // Event handler for canceling the overlay
        overlay.find('#cancel-item').click(function() {
            overlay.remove();
        });

        // Event handler for saving the updated todo item
        $('#canvas').off('click', '#save-item').on('click', '#save-item', function() {
            var overlayPanel = $(this).closest('.overlay-panel');
            var itemLine = overlayPanel.find('.item-line').val(); // Get updated item line
            var description = overlayPanel.find('.note-body').text(); // Get updated description
            var todoDate = overlayPanel.find('.date-picker').val(); // Get updated due date

            // Find the original todo item and update its contents
            var todoItem = $('#' + todoId);
            todoItem.find('.editable').text(itemLine); // Update the todo item line
            todoItem.data('description', description); // Store the description as part of the todo item's data
            todoItem.data('date', todoDate); // Store the due date as part of the todo item's data

            // Remove overlay panel after saving
            overlayPanel.remove();
        });       
    }

   // Function to add a new step to the process panel
   $(document).on('keypress', '.process-input', function(e) {
    if (e.which == 13) { // Enter key pressed
        var timestamp = new Date().getTime(); // Get current timestamp
        var stepText = $(this).val();
        $(this).val(''); // Clear the input field after adding the step
        var listItem = $(`<li>
            <span class="process-item" id='process-${timestamp}'>${stepText}</span>
            <button class="edit-process-btn" data-process-id='process-${timestamp}'>...</button>
            <div class="process-description"></div> <!-- Placeholder for description -->
            </li>`); 
        listItem.data('description', ''); // Store the description as part of the todo item's data
        $(this).siblings('.process-list').append(listItem);
        }
    });

    // Function to create an overlay for the process panel to edit details
    function createProcessOverlayPanel(processId) {
        // Remove any existing overlay before creating a new one
        $('.overlay-panel').remove();

        var processItem = $('#' + processId);
        var processText = processItem.find('.process-item').text();
        var description = processItem.data('description'); // Assuming you store additional data like description

        var overlayHtml = `<div class="overlay-panel">
            <div class="overlay-title" style='text-align:center;background-color:#202020;'>Edit Process</div>
            <div style="padding: 10px;">
                <label for="process-title" style='color: #ffffff;'>Item</label><br>
                <input type="text" id="process-title" class="item-line" value="${processText}" onfocus="this.select()">
                <label for="process-description" style='color: #ffffff;'>Description</label>
                <textarea id="process-description" class="note-body" style='padding:10px;opacity:0.6;'>${description}</textarea>
                <div class="overlay-nav">
                    <button id='save-process' class="overlay-button">Save</button>
                    <button id='cancel-process' class="overlay-button">Cancel</button>
                </div>
            </div>
        </div>`;

        var panel = processItem.closest('.process-panel');
        var overlay = $(overlayHtml).css({
            width: panel.outerWidth(),
            height: panel.outerHeight(),
            top: panel.position().top,
            left: panel.position().left
        });

        $('#canvas').append(overlay);

        // Event handler for canceling the overlay
        overlay.find('#cancel-process').click(function() {
            overlay.remove();
        });

        // Updated event handler for saving the updated process item
        $('#canvas').off('click', '#save-process').on('click', '#save-process', function() {
            var overlayPanel = $(this).closest('.overlay-panel');
            var title = overlayPanel.find('#process-title').val(); // Get updated title
            var description = overlayPanel.find('#process-description').val(); // Get updated description

            var processItem = $('#' + processId); // Assuming processId is the ID of the <li>
            processItem.find('.process-item').val(title); // Update the text/title of the process item
            processItem.data('description', description); // Store the updated description
            processItem.find('.process-description').val(description); // Update the description display

            overlayPanel.remove(); // Remove overlay panel after saving
        });
   
    }


    // Event handler for deleting a panel or note
    $(document).on('click', '.delete-panel', function() {
        if (confirm('Are you sure you want to delete this panel/note?')) {
            $(this).closest('.checklist, .note, .table-panel, .process-panel').remove();
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

    $(document).on('click', '.edit-todo-btn', function() {
        var todoId = $(this).attr('data-todo-id');
        createOverlayPanel(todoId);
    });
    
    $(document).on('click', '.edit-process-btn', function() {
        var processId = $(this).attr('data-process-id');
        createProcessOverlayPanel(processId);
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

    // Event handler for clearing the board when the newBoard button is pressed
    $('#newBoard').click(function() {
        // Clear existing panels and notes
        $('.checklist, .note').remove();

        // Reset panel count if necessary
        var checklistCount = 0;
        var noteCount = 0;
        var tableCount = 0;

        // Set the board title
        $("#canvasTitle").text("New Board");
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
            var checklistItems = [];
            panel.find('.todo-item').each(function() {
                var todoItem = $(this);
                checklistItems.push({
                    text: todoItem.find('.editable').text(),
                    description: todoItem.data('description'),
                    date: todoItem.data('date')
                });
            });
    
            var item = {
                id: panel.attr('id'),
                type: 'checklist',
                location: { top: panel.css('top'), left: panel.css('left') },
                size: { width: panel.width(), height: panel.height() },
                title: panel.find('.panel-title').val(),
                todos: checklistItems,
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
                content: note.find('.note-body').html()
            };
            boardData.items.push(item);
        });

        // Iterate through all table panels
        $('.table-panel').each(function() {
            var panel = $(this);
            var item = {
                id: panel.attr('id'),
                type: 'table',
                location: { top: panel.css('top'), left: panel.css('left') },
                size: { width: panel.width(), height: panel.height() },
                title: panel.find('.panel-title').val(),
                content: panel.find('table').html() // Capture the HTML content of the table
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
        var tableCount = 0;

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
            else if (item.type === 'table') {
                var panelHtml = `
                    <div class="table-panel" id="${item.id}" style="left:${item.location.left}; top:${item.location.top}; width: ${item.size.width}px; height: ${item.size.height}px;">
                        <div class="handle"></div>
                        <button class="delete-panel">X</button>
                        <input type="text" class="panel-title" value="Table ${item.title}" onfocus="this.select()" onkeyup="if(event.keyCode==13) {this.blur();}">
                        <div class="table-container">
                        <table class="editable-table">${item.content}</table>
                        </div>
                    <div class="add-row-symbol">+</div>
                    <div class="add-column-symbol">+</div>
                    </div>`;
            }

            createPanel(panelHtml, item.id);
        });

        
    }
    
});
