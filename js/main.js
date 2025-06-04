var Draggle = {
    username: "nick",
    boardID: "",
    grid_size: 10,
    panel_width: 400,
    panel_height: 300,
    initial_pos_x: 0,
    initial_pos_y: 0,
    highestZIndex: 100
};

$(document).ready(function() {
    var timestamp = new Date().getTime().toString().slice(-8);
    Draggle.boardID = Draggle.username.toUpperCase() + timestamp;

    Draggle.makeSubtasksSortable();
    Draggle.makeTitleEditable();

    //Function to create a new board
    function newBoard() {
        // Clear existing panels and notes
        $('.panel').remove();

        var timestamp = new Date().getTime().toString().slice(-8); // Get current timestamp
        Draggle.boardID = Draggle.username + timestamp;

        // Set the board title
        $("#canvasTitle").text("New Board");
    }

    Draggle.newBoard = newBoard;

    function fetchBoardData() {
        $.ajax({
            url: 'fetchBoard.php', 
            type: 'GET', // or 'POST', depending on your requirements
            dataType: 'json', // Expect JSON in response
            success: function(response) {
                // Handle success
                console.log('Success:', response);
                Draggle.loadBoardFromData(response);
            },
            error: function(xhr, status, error) {
                // Handle error
                console.log('Error:', error);
            }
        });
    }

    // Call the function
    //fetchBoardData();

    // Event handler for adding a new checklist
    $('#addChecklist').click(function() {
        // Count the number of existing panels to generate a unique ID
        var checklistCount = $('.checklist').length + 1;
        var panelId = 'checklist-' + checklistCount;
    
        // HTML markup for the new panel
        var panelHtml = `<div class="panel checklist" id="${panelId}" style="left:${Draggle.initial_pos_x}px; top:${Draggle.initial_pos_y}px;">
        <div class="handle"></div> <!-- Handle for dragging the panel -->
        <div class="corner-buttons">
            <button class="delete-panel">X</button> <!-- Delete button -->
        </div>
        <input type="text" class="panel-title" value="Checklist ${checklistCount}" onfocus="this.select()" onkeyup="if(event.keyCode==13) {this.blur();}">
        <ul class="todo-list"></ul> <!-- List for todo items -->
        <input type="text" class="todo-input" placeholder="Add new todo"/> <!-- Input field for adding new todos -->
        </div>`;

        Draggle.createPanel(panelHtml, panelId);
    });

    // Event handler for adding a new note
    $('#addNote').click(function() {
        // Count the number of existing panels to generate a unique ID
        var noteCount = $('.note').length + 1;
        var panelId = 'note-' + noteCount;

        var editorId = 'editor-' + noteCount; // Generate a unique ID for each editor instance
        var panelHtml = `<div class="panel note" id="${panelId}" style="left:${Draggle.initial_pos_x}px; top:${Draggle.initial_pos_y}px;">
            <div class="handle"></div>
            <div class="corner-buttons">
                <button class="delete-panel">X</button>
            </div>
            <div id="${editorId}"></div> <!-- Unique ID for the Quill editor container -->
        </div>`;

        Draggle.createPanel(panelHtml, panelId);

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
    
    // Event handler for adding a tabel panel
    $('#addTable').click(function() {
        var tableCount = $('.table-panel').length + 1;
        var panelId = 'table-' + tableCount;
    
        var panelHtml = `<div class="panel table-panel" id="${panelId}" style="left:${Draggle.initial_pos_x}px; top:${Draggle.initial_pos_y}px;">
            <div class="handle"></div>
            <div class="corner-buttons">
                <button class="delete-panel">X</button>
            </div>
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
    
        Draggle.createPanel(panelHtml, panelId);
        // Call function to make table cells editable
        Draggle.makeCellsEditable();
        positionPlusSymbols(panelId);
    });

    // Event handler for adding a new process panel
    $('#addProcess').click(function() {
        var processCount = $('.process-panel').length + 1;
        var panelId = 'process-' + processCount;
    
        var panelHtml = `<div class="panel process-panel" id="${panelId}" style="left:${Draggle.initial_pos_x}px; top:${Draggle.initial_pos_y}px;">
            <div class="handle"></div>
            <div class="corner-buttons">
                <button class="delete-panel">X</button>
            </div>
            <input type="text" class="panel-title" value="Process ${processCount}">
            <ol class="process-list"></ol>
            <input type="text" class="process-input" placeholder="Add new step"/>
        </div>`;
    
        Draggle.createPanel(panelHtml, panelId);

    });

    // Event handler for adding a new links panel
    $('#addLinkPanel').click(function() {
        var linksCount = $('.links').length + 1;
        var panelId = 'links-' + linksCount;
    
        var panelHtml = `<div class="panel links-panel" id="${panelId}" style="left:${Draggle.initial_pos_x}px; top:${Draggle.initial_pos_y}px;">
            <div class="handle"></div>
            <div class="corner-buttons">
                <button class="delete-panel">X</button>
            </div>
            <input type="text" class="panel-title" value="Links ${linksCount}">
            <ol class="link-list"></ol>
            <button class="add-link-button">+</button>
        </div>`;
    
        Draggle.createPanel(panelHtml, panelId);

    });

    //Add the panel to the canvas
    function createPanel(panelHtml, panelId) {
        // Append the new panel to the canvas
        $('#canvas').append(panelHtml);

        $('#' + panelId).css({
            minWidth: 250,
            minHeight: Draggle.panel_height,
            width: Draggle.panel_width,
            height: Draggle.panel_height,
            zIndex: Draggle.highestZIndex++
        })
        
        $('#' + panelId).draggable({
            handle: ".handle", // Specify the handle for dragging
            cancel: ".panel-title, .editable", // Specify elements to exclude from dragging
            grid: [Draggle.grid_size, Draggle.grid_size], // Set the grid size to snap to during dragging
            containment: "#canvas", // Specify the containment element
            start: function() {
                // Increment the z-index global variable and apply it to the current panel
                $(this).css('zIndex', ++Draggle.highestZIndex);
            },
            stop: function() {
                // Check if the panel is minimized
                if ($(this).hasClass('minimized')) {
                    // Calculate the viewport height and the panel's bottom position
                    var viewportHeight = $(window).height() - 60;
                    var panelBottom = $(this).offset().top + $(this).outerHeight();
        
                    // Check if the panel's bottom is at or beyond the bottom of the viewport
                    if (panelBottom >= viewportHeight) {
                        // Trigger the popup
                        alert('Minimized Panel ID: ' + $(this).attr('id') + ' is touching the bottom of the screen.');
                    }
                }
            }
        }).resizable({
            minHeight: Draggle.panel_height, // Set the minimum height of the panel
            minWidth: 250, // Set the minimum width of the panel
            grid: [Draggle.grid_size, Draggle.grid_size] // Set the grid size to snap to during resizing
        });

        function makePanelSortable(panelId, listClass) {
            $('#' + panelId + ' .' + listClass).sortable({
                placeholder: "sortable-placeholder",
                update: function(event, ui) {
                    updateProcessNumbers(panelId);
                }
            }).disableSelection();
        }

        // Call the sortable function for process panels
        makePanelSortable(panelId, 'process-list');
        
        // Call the sortable function for checklist panels
        makePanelSortable(panelId, 'todo-list');

        makePanelsInterconnected();
    }

    Draggle.createPanel = createPanel;

    $(document).on('dblclick', '.panel', function() {
        const panel = $(this).closest('.panel');
        const isMinimized = panel.hasClass('minimized');

        if (!isMinimized) {
            panel.data('original-size', { height: panel.height() });
            // Minimise the panel
            panel.addClass('minimized').css({ height: '35px', minHeight: '35px', marginBottom: '50px'});
            panel.resizable("disable");                            
        } else {
            // Maximise the panel
            const originalSize = panel.data('original-size');
            panel.removeClass('minimized').css({ height: originalSize.height + 'px', minHeight: '', marginBottom: '' });
            panel.resizable("enable");
            
        }
    });
    
    function makePanelsInterconnected() {
        // Initialize sortable on all checklist todo lists and connect them
        $('.todo-list').sortable({
            connectWith: ".todo-list", // This allows dragging between all todo lists
            placeholder: "sortable-placeholder",
            helper: 'clone', // Use a clone as the helper that follows the mouse
            appendTo: 'body', // Append the helper to the body to ensure it's not confined
            start: function(event, ui) {
                ui.item.addClass('being-dragged');
                // Additional code as needed for when dragging starts
            },
            stop: function(event, ui) {
                ui.item.removeClass('being-dragged');
                // Additional code as needed for when dragging stops
            },
            receive: function(event, ui) {
                // Optional: code to execute when an item is received from another list
            },
            update: function(event, ui) {
                if (this === ui.item.parent()[0]) {
                    // Optional: code to execute to handle the update within the same list
                }
            }
        }).disableSelection();
    }

    Draggle.makePanelsInterconnected = makePanelsInterconnected;

     // Event handler for adding a new todo item
     $(document).on('keypress', '.todo-input', function(e) {
        if (e.which == 13) {
            var timestamp = new Date().getTime().toString().slice(-8);  // Get current timestamp
            var todoText = $(this).val();
            $(this).val('');
            var listItem = $(`<li class='todo-item' id='todo-${timestamp}'>
                                <div class="todo-content"> <!-- This div wraps the inline elements -->
                                    <input type="checkbox" class="todo-checkbox"/>
                                    <span class="editable">${todoText}</span>
                                    <div class="due-by"></div> <!-- Placeholder for date -->
                                </div>
                                <ul class='subtasks'></ul>
                            </li>`);
            listItem.data('description', ''); // Store the description as part of the todo item's data
            listItem.data('date');
            $(this).siblings('.todo-list').append(listItem);

        }
    });

    // Event handler to add a new step to the process panel
    $(document).on('keypress', '.process-input', function(e) {
        if (e.which == 13) { // Enter key pressed
            var timestamp = new Date().getTime().toString().slice(-8);  // Get current timestamp
            var stepText = $(this).val();
            $(this).val(''); // Clear the input field after adding the step
            var listItem = $(`<li>
                <span class="process-item" id='process-${timestamp}'>${stepText}</span>
                <div class="process-description"></div> <!-- Placeholder for description -->
                </li>`); 
            listItem.data('description', 'Description'); // Store the description as part of the todo item's data
            $(this).siblings('.process-list').append(listItem);
        }
    });

    // Function to create and show the todo parent item context menu
    function showContextMenu(todoId, pageX, pageY) {
        // Remove existing contextMenu if any
        $('#contextMenu').remove();

        const contextMenu = document.createElement('div');
        contextMenu.id = 'contextMenu';
        contextMenu.className = 'context-menu';
        contextMenu.innerHTML = `
            <ul class="context-menu">
                <li class="context-menu-item" data-action="edit" data-todo-id="${todoId}">Edit</li>
                <li class="context-menu-item" data-action="delete" data-todo-id="${todoId}">Delete</li>
                <li class="context-menu-item" data-action="add-subtask" data-todo-id="${todoId}">Add Subtask</li>
            </ul>
        `;
        document.body.appendChild(contextMenu);

        contextMenu.style.top = `${pageY}px`;
        contextMenu.style.left = `${pageX}px`;
        contextMenu.classList.add('show');
    }

    // Attach context menu to todo items
    $(document).on('contextmenu', '.todo-content', function(event) {    
        event.preventDefault();
        
        var todoId = $(this).closest('.todo-item').attr('id');

        showContextMenu(todoId, event.pageX, event.pageY);

        // Add event listener for the Edit todo item action
        contextMenu.querySelector('[data-action="edit"]').addEventListener('click', function() {
            Draggle.createOverlayPanel(todoId); // Call createOverlayPanel with the todoId
        });

        // Close and remove the context menu on document click
        $(document).on('click', function(e) {
            $('#contextMenu').remove();
        });
    });

    // Separate event handler for delete action to avoid nested event listeners
    $(document).on('click', '#contextMenu [data-action="delete"]', function() {
        var todoId = $(this).data('todo-id'); // Retrieve the todoId stored in data attribute

        // Confirm deletion
        if (confirm('Are you sure you want to delete this todo item?')) {
            $('#' + todoId).remove(); // Remove the todo item using its ID
        }
    });

    // Event handler for the Add Subtask action
    $(document).on('click', '#contextMenu [data-action="add-subtask"]', function() {
        var todoId = $(this).data('todo-id'); // Retrieve the todoId stored in data attribute
        
        addSubtask(todoId);
    });

    $(document).ready(function() {
        // Correct the initial event binding to process items for showing the context menu
        $(document).on('contextmenu', '.process-item', function(event) {
            event.preventDefault();
            var processId = $(this).attr('id');
            showProcessContextMenu(processId, event.pageX, event.pageY);
            return false; // Prevent the browser's default context menu
        });
    
        // Use delegated event handling for dynamically added context menu items
        $(document).on('click', '#process-context-menu [data-action="edit"]', function(event) {
            event.stopPropagation();
            var processId = $(this).data('process-id');
            Draggle.createProcessOverlayPanel(processId);
            $('#process-context-menu').remove(); // Close the context menu
        });
    
        $(document).on('click', '#process-context-menu [data-action="delete"]', function(event) {
            event.stopPropagation();
            var processId = $(this).data('process-id');
            // Implement your logic to confirm and delete the process item
            $('#process-context-menu').remove(); // Close the context menu
        });
    
        // Also consider adding a global click listener to close the context menu when clicking elsewhere
        $(document).on('click', function() {
            $('#process-context-menu').remove();
        });

        function showProcessContextMenu(processId, pageX, pageY) {
            // Remove existing context menus
            $('#process-context-menu').remove();
        
            // Construct the context menu HTML
            const menuHtml = `<ul id='process-context-menu' class='context-menu' style='position:absolute; top:${pageY}px; left:${pageX}px;'>
                <li class="context-menu-item" data-action="edit" data-process-id="${processId}">Edit</li>
                <li class="context-menu-item" data-action="delete" data-process-id="${processId}">Delete</li>
            </ul>`;
        
            // Append the menu to the body and show it
            $('body').append(menuHtml);
        }
    
    });   

    // Event handler for pressing Enter on the .subtask .editable field
    $(document).on('keypress', '.subtask .editable', function(e) {
        if (e.which == 13) { // Enter key pressed
            e.preventDefault(); // Prevent the default action (inserting a new line)
            
            var todoId = $(this).closest('.todo-item').attr('id'); // Retrieve the todoId from the closest .todo-item element
            if (todoId) {
                addSubtask(todoId); // Call the addSubtask function with the todoId
            } else {
                console.error("Todo ID not found for subtask.");
            }
        }
    });

    function addSubtask(todoId) {
        var subtasksList = $('#' + todoId).find('.subtasks');
        var uniqueSubtaskId = 'subtask-' + Date.now();
        subtasksList.append('<li class="subtask" id="' + uniqueSubtaskId + '" data-due-date=""><input type="checkbox" class="todo-checkbox"/><span class="editable" contenteditable="true" tabindex="-1"></span></li>');
        Draggle.makeSubtasksSortable();

        // Focus on the newly created .editable field
        $('#' + uniqueSubtaskId + ' .editable').focus();

        $('#contextMenu').remove();
    }

    Draggle.addSubtask = addSubtask;

    // Function to make subtasks sortable
    function makeSubtasksSortable() {
        $(".subtasks").sortable({
            items: "li.subtask", // Only make the li.subtask elements sortable
            containment: "parent", // Constrain sorting to within the parent ul.subtasks element
            axis: "y", // Constrain movement to the y-axis
            update: function(event, ui) {
                // Optional: Callback function that runs when the order changes.
                // Use this if you need to save the order persistently.
            }
        }).disableSelection(); // Prevent text selection during dragging
    }

    Draggle.makeSubtasksSortable = makeSubtasksSortable;

    // Function to show the subtask context menu
    function showSubtaskContextMenu(subtaskId, pageX, pageY) {
        // Remove existing contextMenu if any
        $('.subtask-contextMenu').remove();

        const contextMenu = document.createElement('div');
        contextMenu.className = 'subtask-contextMenu context-menu';
        contextMenu.innerHTML = `<ul class="context-menu"><li class="context-menu-item" data-action="delete-subtask" data-subtask-id="${subtaskId}">Delete</li></ul>`;
        document.body.appendChild(contextMenu);

        contextMenu.style.top = `${pageY}px`;
        contextMenu.style.left = `${pageX}px`;
        contextMenu.classList.add('show');
    }

    // Function to check if two elements are touching or overlapping
    function isTouching(a, b) {
        var aRect = a.getBoundingClientRect();
        var bRect = b.getBoundingClientRect();

        return !(
            aRect.bottom < bRect.top || 
            aRect.top > bRect.bottom || 
            aRect.right < bRect.left || 
            aRect.left > bRect.right
        );
    }

    // Event handler to attach context menu to subtasks
    $(document).on('contextmenu', '.subtask', function(event) {
        event.preventDefault();

        var subtaskId = $(this).attr('id'); // Ensure each subtask has a unique ID when created
        showSubtaskContextMenu(subtaskId, event.pageX, event.pageY);

        // Prevent the document-level click handler from immediately removing the context menu
        event.stopPropagation();
    });

    // Global event handler for deleting a subtask using the subtask context menu
    $(document).on('click', '.subtask-contextMenu [data-action="delete-subtask"]', function() {
        var subtaskId = $(this).data('subtask-id');
        $('#' + subtaskId).remove(); // Remove the subtask

        // Cleanup: remove the context menu
        $('.subtask-contextMenu').remove();     
    });

    // Hide context menu when clicking elsewhere
    $(document).on('click', function() {
        $('.subtask-contextMenu').remove();
    });

    
    // Create overlay to checklist to edit details
    function createOverlayPanel(todoId) {
        // Remove any existing overlay before creating a new one
        $('.overlay-panel').remove();
    
        var todoItem = $('#' + todoId);
        var todoText = todoItem.find('.todo-content .editable').text();
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
                         
    
        var panel = todoItem.closest('.checklist');
        overlay.css({
            width: panel.outerWidth(),
            height: panel.outerHeight(),
            top: panel.position().top,
            left: panel.position().left,
            zIndex: Draggle.highestZIndex++
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
            todoItem.find('.todo-content .editable').text(itemLine); // Update the todo item line
            todoItem.data('description', description); // Store the description as part of the todo item's data
            todoItem.data('date', todoDate); // Store the due date as part of the todo item's data
            todoItem.find('.due-by').text(todoDate); // Update the description display, which is a <div>

            // Remove overlay panel after saving
            overlayPanel.remove();
        });
    }

    Draggle.createOverlayPanel = createOverlayPanel;

    // Function to create an overlay for the process panel to edit details
    function createProcessOverlayPanel(processId) {
        // Remove any existing overlay before creating a new one
        $('.overlay-panel').remove();

        // Find the button that was clicked and then the corresponding <li> element
        var processItemBtn = $('#' + processId); // This is the button, not the <span> or <li>
        var listItem = processItemBtn.closest('li'); // This finds the <li> parent of the button
        
        //var processItem = $('#' + processId);
        //console.log(processItem);
        var processText = listItem.find('.process-item').text();
        var description = listItem.data('description');
        console.log(processText, description);

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

        var panel = processItemBtn.closest('.process-panel');
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

        $('#canvas').off('click', '#save-process').on('click', '#save-process', function() {
            var overlayPanel = $(this).closest('.overlay-panel');
            var title = overlayPanel.find('#process-title').val(); // Get updated title from input
            var description = overlayPanel.find('#process-description').val(); // Get updated description from textarea

            // Assuming processId is the ID of the button which needs to target its corresponding process item
            var processIdButton = $('#' + processId); // This is your button
            var listItem = processIdButton.closest('li'); // Find the <li> parent of the button

            listItem.find('.process-item').text(title); // Update the text/title of the process item, which is a <span>
            listItem.data('description', description); // Store the updated description in the data of the <li>
            listItem.find('.process-description').text(description); // Update the description display, which is a <div>

        overlayPanel.remove(); // Remove overlay panel after saving
        });
    }

    Draggle.createProcessOverlayPanel = createProcessOverlayPanel;


    // Event handler for deleting a panel or note
    $(document).on('click', '.delete-panel', function() {
        if (confirm('Are you sure you want to delete this panel/note?')) {
            $(this).closest('.panel').remove();
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

    Draggle.makeCellsEditable = makeCellsEditable;

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
        Draggle.makeCellsEditable();

    });
    
    $(document).on('click', '.edit-process-btn', function() {
        var processId = $(this).attr('data-process-id');
        Draggle.createProcessOverlayPanel(processId);
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
        Draggle.saveTextFile();
    });

    // Event handler for clearing the board when the newBoard button is pressed
    $('#newBoard').click(function() {
        Draggle.newBoard();
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

    Draggle.makeTitleEditable = makeTitleEditable;

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

    Draggle.saveTextFile = saveTextFile;

    function collectBoardData() {
        var boardData = {
            boardTitle: $("#canvasTitle").text(),
            boardID: Draggle.boardID,
            items: []
        };
    
        // Iterate through each panel regardless of its type
        $('.panel').each(function() {
            var panel = $(this);
    
            var item = {
                id: panel.attr('id'),
                location: { top: panel.css('top'), left: panel.css('left') },
                size: { width: panel.width(), height: panel.height() },
                content: panel.html() // Capture the entire HTML content of the panel
            };
            
            boardData.items.push(item);
        });
    
        // Convert the boardData object to JSON
        return JSON.stringify(boardData, null, 2); // Pretty-print the JSON
    }

    Draggle.collectBoardData = collectBoardData;
    
    document.getElementById('loadBoard').addEventListener('click', function() {
        // Programmatically click the hidden file input
        document.getElementById('loadBoardFile').click();
        Draggle.loadBoardFromData(boardData);
    });
    
    document.getElementById('loadBoardFile').addEventListener('change', function() {
        if (this.files.length > 0) {
            var file = this.files[0];
            var reader = new FileReader();
    
            reader.onload = function(e) {
                var boardData = JSON.parse(e.target.result);
                Draggle.loadBoardFromData(boardData);
            };
    
            reader.readAsText(file);
        }
    });

    function loadBoardFromData(boardData) {
        // Clear existing panels
        $('.panel').remove();
    
        // Set the board title
        $("#canvasTitle").text(boardData.boardTitle);
    
        boardData.items.forEach(function(item) {
            // Generic panel HTML structure using the captured content directly
            var panelHtml = `
                <div class="panel ${item.type}" id="${item.id}" style="left:${item.location.left}; top:${item.location.top}; width: ${item.size.width}px; height: ${item.size.height}px;">
                    ${item.content}
                </div>`;
    
            // Append the panel HTML to the board or a specific container within the board
            // This assumes you have a function createPanel that does the appending based on the HTML and possibly sets up additional behaviors
            Draggle.createPanel(panelHtml, item.id);
        });
    }

    Draggle.loadBoardFromData = loadBoardFromData;
    
    // Add an event listener for the settings button
    document.getElementById('settings').addEventListener('click', function() {
        Draggle.toggleSettingsOverlay(); // Call function to toggle the visibility of the settings overlay
    });

    function toggleSettingsOverlay() {
        if ($('.settings-overlay').length === 0) {
            // Extract the current background image URL from the body's style
            var currentBackgroundUrl = $('body').css('background-image');
            // Use a regex to extract the filename from the URL
            var match = /"([^"]+)"\)/.exec(currentBackgroundUrl) || /'([^']+)'/.exec(currentBackgroundUrl);
            var currentBackground = match ? match[1].split('/').pop() : "";
            // Create the overlay if it doesn't exist
            var isBoardTitleVisible = $('.editable-title').is(':visible'); // Check if the board title is visible
            var overlayHtml = `<div class="settings-overlay">
                <div class="overlay-title">Board Settings</div>
                <div style="padding: 15px;">
                    <label for="board-id">Board ID:</label>
                    <span>${Draggle.boardID}</span><br>
                    <label for="background-selector">Background:</label>
                    <select id="background-selector" class="overlay-select">
                        <option value="Rice.jpg">Rice</option>
                        <option value="Bridge.jpg">Bridge</option>
                        <option value="Road.jpg">Road</option>
                        <option value="Mist.jpg">Mist</option>
                        <option value="Auora.jpg">Auora</option>
                        <option value="Jagged.jpg">Jagged</option>
                        <option value="Yosemite.jpg">Yosemite</option>
                        <!-- Add more options here -->
                    </select>
                    <br>
                    <label for="opacity-slider">Panel Opacity:</label>
                    <input type="range" id="opacity-slider" class="overlay-slider" min="0.7" max="1" step="0.05" value="${$('.panel').css('opacity')}">
                    <br>
                    <label for="toggle-board-title">Show Board Title:</label>
                    <input type="checkbox" id="toggle-board-title" class="overlay-checkbox" ${isBoardTitleVisible ? 'checked' : ''}> <!-- Set the 'checked' attribute based on the visibility of the board title -->
                </div>
                <div class="overlay-nav">
                    <button id='close-overlay' class="overlay-button">Close</button>
                </div>
            </div>`;

            $('#canvas').append(overlayHtml);

            // Prefill the background selector
            $('#background-selector').val(currentBackground);

            // Close button functionality
            $('#close-overlay').click(function() {
                $('.settings-overlay').remove();
            });

            // Event listeners for input elements
            $('#background-selector').change(function() {
                var selectedBackground = $(this).val();
                $('body').css('background-image', 'url("Backgrounds/' + selectedBackground + '")');
            });

            $('#opacity-slider').on('input', function() {
                var opacityValue = $(this).val();
                $('.panel').css('opacity', opacityValue);
            });

            $('#toggle-board-title').change(function() {
                var isBoardTitleVisible = $(this).is(':checked');
                $('.editable-title').toggle(isBoardTitleVisible);
            });
        }
    }

    Draggle.toggleSettingsOverlay = toggleSettingsOverlay;

    });
