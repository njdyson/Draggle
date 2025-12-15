// When the document is ready, execute this function
$(document).ready(function() { 
    // Global error handler to surface issues during interactive debugging
    window.addEventListener('error', function(e) {
        console.error('Runtime error caught:', e.message, e.error);
    });
    console.log('App initializing...');
   
    var BOARD_API_URL = 'board.php';
    var AUTOSAVE_DELAY = 2000;
    var autosaveTimer = null;
    var isSaving = false;
    var pendingAutosave = false;
    var isLoadingBoard = false;

    function getBoardIdFromUrl() {
        var params = new URLSearchParams(window.location.search);
        return params.get('boardId');
    }

    function setBoardIdInUrl(id) {
        var params = new URLSearchParams(window.location.search);
        if (id) {
            params.set('boardId', id);
        } else {
            params.delete('boardId');
        }
        var newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
        window.history.replaceState({}, '', newUrl);
    }

    // Active board ID (from URL if present)
    var boardID = getBoardIdFromUrl() || '';
    var lastBoardId = localStorage.getItem('lastBoardId') || '';
    
    // Declare vaiables
    var grid_size = 10;
    var panel_width = 400; // Define the default panel width
    var panel_height = 300; // Define the default panel height
    var initial_pos_x = 0;
    var initial_pos_y = 0;
    var highestZIndex = 100; // Set the initial z-index for panels
    var backgrounds = [
        'Auora.jpg',
        'Bridge.jpg',
        'Jagged.jpg',
        'Mist.jpg',
        'Rice.jpg',
        'Road.jpg',
        'Storm.jpg',
        'Valley.jpg',
        'Yosemite.jpg'
    ];

    // Expose shared app config for modules
    window.App = window.App || {};
    window.App.grid_size = grid_size;
    window.App.panel_width = panel_width;
    window.App.panel_height = panel_height;
    window.App.initial_pos_x = initial_pos_x;
   window.App.initial_pos_y = initial_pos_y;
    window.App.highestZIndex = highestZIndex;
    window.App.backgrounds = backgrounds;
    // Expose boardID globally for helpers
    window.boardID = boardID;

    makeSubtasksSortable();
    // Initialize modules when available
    if (window.Tables && typeof Tables.init === 'function') Tables.init();
    if (window.Panels && typeof Panels.init === 'function') Panels.init();
    if (window.ContextMenus && typeof ContextMenus.init === 'function') ContextMenus.init();
    if (window.UI && typeof UI.init === 'function') UI.init();

    //Function to create a new board
    function newBoard() {
        // Clear existing panels and notes
        $('.panel').remove();

        boardID = '';
        window.boardID = '';
        setBoardIdInUrl(null);
        localStorage.removeItem('lastBoardId');

        // Set the board title
        $("#canvasTitle").text("New Board");
    }

    async function loadBoardFromServer(id) {
        if (!id) return;
        isLoadingBoard = true;
        try {
            var response = await fetch(BOARD_API_URL + '?id=' + encodeURIComponent(id));
            if (!response.ok) {
                throw new Error('Load failed with status ' + response.status);
            }
            var text = await response.text();
            var data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error('Invalid JSON from server: ' + text.slice(0, 200));
            }
            window.boardID = data.boardId || id;
            boardID = window.boardID;
            setBoardIdInUrl(window.boardID);
            if (window.boardID) {
                localStorage.setItem('lastBoardId', window.boardID);
            }
            if (data.settings && data.settings.background) {
                localStorage.setItem('lastBackground', data.settings.background);
                document.documentElement.style.setProperty('--initial-background', 'url("Backgrounds/' + data.settings.background + '")');
            }
            loadBoardFromData(data);
        } catch (err) {
            console.error('Error loading board', err);
            alert('Unable to load board: ' + err.message);
        } finally {
            isLoadingBoard = false;
        }
    }

    function scheduleAutosave() {
        if (isLoadingBoard) return;
        // Don't autosave an untouched empty board
        if (!window.boardID && $('.panel').length === 0) return;
        if (isSaving) { pendingAutosave = true; return; }
        pendingAutosave = true;
        if (autosaveTimer) clearTimeout(autosaveTimer);
        autosaveTimer = setTimeout(function() {
            autosaveTimer = null;
            pendingAutosave = false;
            saveBoardToServer({ silent: true });
        }, AUTOSAVE_DELAY);
    }

    async function saveBoardToServer(options) {
        var opts = options || {};
        var silent = !!opts.silent;
        if (isSaving) { pendingAutosave = true; return; }
        isSaving = true;
        try {
            var payload = window.collectBoardData();
            var method = window.boardID ? 'PUT' : 'POST';
            var url = BOARD_API_URL + (window.boardID ? ('?id=' + encodeURIComponent(window.boardID)) : '');

            var response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                var errorText = await response.text();
                throw new Error(errorText || ('Save failed with status ' + response.status));
            }

            var raw = await response.text();
            var data;
            try {
                data = JSON.parse(raw);
            } catch (e) {
                throw new Error('Invalid JSON from server: ' + raw.slice(0, 200));
            }
            if (data.boardId) {
                window.boardID = data.boardId;
                boardID = window.boardID;
                setBoardIdInUrl(window.boardID);
                localStorage.setItem('lastBoardId', window.boardID);
            }
            if (payload.settings && payload.settings.background) {
                localStorage.setItem('lastBackground', payload.settings.background);
            }
            if (!silent) {
                var shareUrl = window.boardID
                    ? window.location.origin + window.location.pathname + '?boardId=' + encodeURIComponent(window.boardID)
                    : window.location.href;
                alert('Board saved.\nOpen/share this link:\n' + shareUrl);
            }
        } catch (err) {
            console.error('Error saving board', err);
            if (!silent) {
                alert('Unable to save board: ' + err.message);
            }
        }
        finally {
            isSaving = false;
            if (pendingAutosave) {
                pendingAutosave = false;
                scheduleAutosave();
            }
        }
    }

    // Event handler for adding a new checklist
    $('#addChecklist').click(function() {
        console.log('addChecklist clicked');
        // Count the number of existing panels to generate a unique ID
        var checklistCount = $('.checklist').length + 1;
        var panelId = 'checklist-' + checklistCount;
    
        // HTML markup for the new panel
        var panelHtml = `<div class="panel checklist" id="${panelId}" style="left:${initial_pos_x}px; top:${initial_pos_y}px;">
        <div class="handle"></div> <!-- Handle for dragging the panel -->
        <div class="corner-buttons">
            <button class="delete-panel">X</button> <!-- Delete button -->
        </div>
        <input type="text" class="panel-title" value="Checklist ${checklistCount}" onfocus="this.select()" onkeyup="if(event.keyCode==13) {this.blur();}">
        <ul class="todo-list"></ul> <!-- List for todo items -->
        <input type="text" class="todo-input" placeholder="Add new todo"/> <!-- Input field for adding new todos -->
        </div>`;

        Panels.createPanel(panelHtml, panelId);
    });

    // Event handler for adding a new note
    $('#addNote').click(function() {
        console.log('addNote clicked');
        // Count the number of existing panels to generate a unique ID
        var noteCount = $('.note').length + 1;
        var panelId = 'note-' + noteCount;

        var editorId = 'editor-' + noteCount; // Generate a unique ID for each editor instance
        var panelHtml = `<div class="panel note" id="${panelId}" style="left:${initial_pos_x}px; top:${initial_pos_y}px;">
            <div class="handle"></div>
            <div class="corner-buttons">
                <button class="delete-panel">X</button>
            </div>
            <div id="${editorId}"></div> <!-- Unique ID for the Quill editor container -->
        </div>`;

        Panels.createPanel(panelHtml, panelId);

        const toolbarOptions = [[{ 'header': 1 }, { 'header': 2 },'bold', 'italic', 'underline', 'strike',{ 'color': [] }], 
        [{ 'list': 'bullet' }, { 'list': 'ordered'}],['code-block', 'link']];

        var quill = new Quill(`#${editorId}`, { 
            modules: {
                toolbar: toolbarOptions,
              },
              placeholder: 'Content...',
              theme: 'snow'
        });
        var $panel = $('#' + panelId);
        $panel.removeClass('toolbar-hidden');
        $(`#${editorId}`).siblings('.ql-toolbar').show();
    });
    
    // Event handler for adding a tabel panel
    $('#addTable').click(function() {
        console.log('addTable clicked');
        var tableCount = $('.table-panel').length + 1;
        var panelId = 'table-' + tableCount;
    
        var panelHtml = `<div class="panel table-panel" id="${panelId}" style="left:${initial_pos_x}px; top:${initial_pos_y}px;">
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
        </div>`;
    
        Panels.createPanel(panelHtml, panelId);
        // Ensure table handlers are initialized (delegated in tables.js)
        if (window.Tables && typeof Tables.init === 'function') Tables.init();
    });

    // Event handler for adding a new process panel
    $('#addProcess').click(function() {
        console.log('addProcess clicked');
        var processCount = $('.process-panel').length + 1;
        var panelId = 'process-' + processCount;
    
        var panelHtml = `<div class="panel process-panel" id="${panelId}" style="left:${initial_pos_x}px; top:${initial_pos_y}px;">
            <div class="handle"></div>
            <div class="corner-buttons">
                <button class="delete-panel">X</button>
            </div>
            <input type="text" class="panel-title" value="Process ${processCount}">
            <ol class="process-list"></ol>
            <input type="text" class="process-input" placeholder="Add new step"/>
        </div>`;
    
        Panels.createPanel(panelHtml, panelId);

    });

    // Event handler for adding a new links panel
    $('#addLinkPanel').click(function() {
        console.log('addLinkPanel clicked');
        var linksCount = $('.links').length + 1;
        var panelId = 'links-' + linksCount;
    
        var panelHtml = `<div class="panel links-panel" id="${panelId}" style="left:${initial_pos_x}px; top:${initial_pos_y}px;">
            <div class="handle"></div>
            <div class="corner-buttons">
                <button class="delete-panel">X</button>
            </div>
            <input type="text" class="panel-title" value="Links ${linksCount}">
            <ol class="link-list"></ol>
            <button class="add-link-button">+</button>
        </div>`;
    
        Panels.createPanel(panelHtml, panelId);

    });

    //Add the panel to the canvas
    // Panels.createPanel has been moved to `panels.js` to reduce file size and improve modularity.
    // Use `Panels.createPanel(panelHtml, panelId)` to add new panels and `Panels.init()` to initialize behaviours.

    // Double-click to minimise panels has been disabled per user preference.
    // If you want to re-enable this behaviour, restore the dblclick handler here.
    
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
            scheduleAutosave();

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
                <div class="process-description"></div>
                </li>`); 
            listItem.data('description', ''); // Store the description as part of the process item's data
            $(this).siblings('.process-list').append(listItem);
            scheduleAutosave();
        }
    });

    // Todo/process/subtask context menus moved to `context-menus.js` (ContextMenus.init())

    // Process and subtask context menu behaviour moved to `context-menus.js` (ContextMenus.init())
    // Call `ContextMenus.init()` where appropriate to attach behaviour.   

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
        makeSubtasksSortable();

        // Focus on the newly created .editable field
        $('#' + uniqueSubtaskId + ' .editable').focus();

        $('#contextMenu').remove();
    }
    // Expose for context menus that call addSubtask on right-click
    window.addSubtask = addSubtask;

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

    // Subtask context menu behaviour moved to `context-menus.js` (ContextMenus.init())

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

    // Subtask context menu behaviour moved to `context-menus.js` (ContextMenus.init())

    
    // Overlay behaviour moved to `ui.js` (createOverlayPanel/createProcessOverlayPanel/toggleSettingsOverlay/makeTitleEditable)

    // Process overlay behaviour moved to `ui.js` (createProcessOverlayPanel)


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

    // Table behaviours have been moved to `tables.js` (Tables.init())
    // Tables.init() is called on startup if available. Delegated handlers in tables.js
    // will handle future table elements dynamically.
    
    $(document).on('click', '.edit-process-btn', function() {
        var processId = $(this).attr('data-process-id');
        createProcessOverlayPanel(processId);
    });

    // Links: open link on click
    $(document).off('click.link-open').on('click.link-open', '.link-item', function(e) {
        var url = $(this).data('url');
        var newTab = !!$(this).data('newTab');
        if (!url) return;
        if (newTab) { window.open(url, '_blank'); }
        else { window.location.href = url; }
    });

    // Links: add new link via overlay
    $(document).off('click.link-add').on('click.link-add', '.add-link-button', function(e) {
        e.preventDefault();
        var panelId = $(this).closest('.links-panel').attr('id');
        if (typeof window.createLinkOverlay === 'function') {
            createLinkOverlay(panelId);
        }
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
        scheduleAutosave();
    });

    // Event handler for saving the board to the server
    // Event handler for clearing the board when the newBoard button is pressed
    $('#newBoard').click(function() {
        newBoard();
    });

    // Title editing moved to `ui.js` (makeTitleEditable)

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

    // Settings button (guarded and namespaced to avoid duplicate bindings)
    $(document).off('click.board-settings').on('click.board-settings', '#settings', function(e) {
        e.preventDefault();
        if (typeof window.toggleSettingsOverlay === 'function') {
            console.log('Board Settings clicked');
            window.toggleSettingsOverlay();
        } else {
            console.error('toggleSettingsOverlay is not available');
        }
    });

    async function deleteBoardFromServer() {
        if (!window.boardID) {
            alert('No saved board to delete. Starting a new board instead.');
            newBoard();
            return;
        }
        try {
            var response = await fetch(BOARD_API_URL + '?id=' + encodeURIComponent(window.boardID), { method: 'DELETE' });
            if (!response.ok) {
                var errorText = await response.text();
                throw new Error(errorText || ('Delete failed with status ' + response.status));
            }
            alert('Board deleted.');
            localStorage.removeItem('lastBoardId');
            newBoard();
        } catch (err) {
            console.error('Error deleting board', err);
            alert('Unable to delete board: ' + err.message);
        }
    }

    // Delete board button
    $(document).off('click.delete-board').on('click.delete-board', '#deleteBoard', function(e) {
        e.preventDefault();
        var confirmDelete = confirm('Delete this board permanently? This cannot be undone.');
        if (confirmDelete) {
            deleteBoardFromServer();
        }
    });

    // Auto-load a board: priority is URL param, otherwise last used board from localStorage
    if (boardID) {
        loadBoardFromServer(boardID);
    } else if (lastBoardId) {
        loadBoardFromServer(lastBoardId);
    }

    // Mark changes for autosave on common input interactions (checkboxes, text edits)
    $(document).on('input change blur', '.todo-input, .process-input, .panel-title, .editable, .ql-editor, .item-line, .process-item, .process-description, .todo-checkbox', function() {
        scheduleAutosave();
    });

    // Global autosave: watch for DOM changes within the canvas and debounce saves
    var canvasEl = document.getElementById('canvas');
    if (canvasEl && window.MutationObserver) {
        var observer = new MutationObserver(function(mutationsList) {
            // Ignore changes while loading
            if (isLoadingBoard) return;
            // Skip context menu creation noise
            var relevant = mutationsList.some(function(m) {
                if (m.type === 'attributes' && m.attributeName === 'style') return true;
                if (m.type === 'characterData') return true;
                if (m.type === 'childList') return true;
                return false;
            });
            if (relevant) scheduleAutosave();
        });
        observer.observe(canvasEl, { attributes: true, childList: true, characterData: true, subtree: true });
    }

    // Settings overlay behaviour moved to `ui.js` (toggleSettingsOverlay)

});
