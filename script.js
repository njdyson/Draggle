// When the document is ready, execute this function
$(document).ready(function() { 
    
    // Event handler for adding a new panel
    $('#addPanel').click(function() {
        // Count the number of existing panels to generate a unique ID
        var panelCount = $('.panel').length + 1;
        var panelId = 'panel-' + panelCount;

        // Calculate the center position for the new panel
        var grid_size = 50; // Define the grid size
        var panel_width = 200; // Define the panel width
        var panel_height = 200; // Define the panel height
        var centerX = Math.round(($('#canvas').width() / 2 - panel_width / 2) / grid_size) * grid_size;
        var centerY = Math.round(($('#canvas').height() / 2 - panel_height / 2) / grid_size) * grid_size;// Calculate the center position for the new panel
    

        // HTML markup for the new panel
        var panelHtml = `<div class="panel" id="${panelId}" style="left:${centerX}px; top:${centerY}px;">
        <div class="handle"></div> <!-- Handle for dragging the panel -->
        <button class="delete-panel">X</button> <!-- Delete button -->
        <input type="text" class="panel-title" value="Todo List ${panelCount}" onfocus="this.select()" onkeyup="if(event.keyCode==13) {this.blur();}"> <!-- Input field for the panel title -->
        <ul class="todo-list"></ul> <!-- List for todo items -->
        <input type="text" class="todo-input" placeholder="Add new todo"/> <!-- Input field for adding new todos -->
        </div>`;

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
    });

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

    //Add a note
    $('#addNote').click(function() {
        // Count the number of existing panels to generate a unique ID
        var noteCount = $('.note').length + 1;
        var panelId = 'note-' + noteCount;

        // Calculate the center position for the new panel
        var grid_size = 50; // Define the grid size
        var panel_width = 200; // Define the panel width
        var panel_height = 200; // Define the panel height
        var centerX = Math.round(($('#canvas').width() / 2 - panel_width / 2) / grid_size) * grid_size;
        var centerY = Math.round(($('#canvas').height() / 2 - panel_height / 2) / grid_size) * grid_size;// Calculate the center position for the new panel
    

        // HTML markup for the new panel
        var panelHtml = `<div class="note" id="${panelId}" style="left:${centerX}px; top:${centerY}px;">
            <div class="handle"></div> <!-- Handle for dragging the panel -->
            <button class="delete-panel">X</button> <!-- Delete button -->
            <input type="text" class="panel-title" value="Note ${noteCount}" onfocus="this.select()" onkeyup="if(event.keyCode==13) {this.blur();}"> <!-- Input field for the panel title -->
            <div class="note-body" contenteditable="true"></div> <!-- Text area for the panel body -->
        </div>`;

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
    });

    // Add a new button for saving the panels to a text file
    $('#saveToFile').click(function() {
        var data = '';
        // Iterate over all panels
        $('.panel, .note').each(function() {
            var title = $(this).find('.panel-title').val(); // Get the panel title
            var content = '';
            if ($(this).hasClass('panel')) {
                // If it's a todo panel, get the todo items
                $(this).find('.todo-item').each(function() {
                    content += $(this).find('.editable').text() + '\n';
                });
            } else if ($(this).hasClass('note')) {
                // If it's a note panel, get the note body
                content = $(this).find('.note-body').text();
            }
            // Append the panel title and content to the data string
            data += 'Title: ' + title + '\n' + 'Content: ' + content + '\n\n';
        });
        // Save the data to a text file
        var blob = new Blob([data], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "panels.txt");

        // Show success message
        swal("Success!", "Panels saved to file.", "success");
    });

});
