/* Context Menus module: todo/process/subtask context menus */
(function(window, $) {
    var ContextMenus = {};

    ContextMenus.init = function() {
        $(document).off('.ctx');

        // Todo item menu
        $(document).on('contextmenu.ctx', '.todo-content', function(e) {
            e.preventDefault();
            $('.context-menu').remove();
            var todoId = $(this).closest('.todo-item').attr('id');
            var $menu = $('<div id="contextMenu" class="context-menu"></div>');
            $menu.append('<ul><li class="context-menu-item" data-action="edit" data-todo-id="' + todoId + '">Edit</li>' +
                         '<li class="context-menu-item" data-action="delete" data-todo-id="' + todoId + '">Delete</li>' +
                         '<li class="context-menu-item" data-action="add-subtask" data-todo-id="' + todoId + '">Add Subtask</li></ul>');
            $('body').append($menu);
            $menu.css({ top: e.pageY + 'px', left: e.pageX + 'px' });
        });

        // Todo menu actions
        $(document).on('click.ctx', '#contextMenu [data-action="edit"]', function(e) {
            e.stopPropagation();
            var todoId = $(this).data('todo-id');
            if (typeof window.createOverlayPanel === 'function') createOverlayPanel(todoId);
            $('#contextMenu').remove();
        });

        $(document).on('click.ctx', '#contextMenu [data-action="delete"]', function(e) {
            e.stopPropagation();
            var todoId = $(this).data('todo-id');
            $('#' + todoId).remove();
            $('#contextMenu').remove();
        });

        $(document).on('click.ctx', '#contextMenu [data-action="add-subtask"]', function(e) {
            e.stopPropagation();
            var todoId = $(this).data('todo-id');
            if (typeof window.addSubtask === 'function') addSubtask(todoId);
            $('#contextMenu').remove();
        });

        // Process item menu
        $(document).on('contextmenu.ctx', '.process-item', function(e) {
            e.preventDefault();
            $('.process-context-menu').remove();
            var processId = $(this).attr('id');
            var $menu = $('<div id="process-context-menu" class="context-menu"></div>');
            $menu.append('<ul><li class="context-menu-item" data-action="edit" data-process-id="' + processId + '">Edit</li>' +
                         '<li class="context-menu-item" data-action="delete" data-process-id="' + processId + '">Delete</li></ul>');
            $('body').append($menu);
            $menu.css({ top: e.pageY + 'px', left: e.pageX + 'px' });
        });

        $(document).on('click.ctx', '#process-context-menu [data-action="edit"]', function(e) {
            e.stopPropagation();
            var processId = $(this).data('process-id');
            if (typeof window.createProcessOverlayPanel === 'function') createProcessOverlayPanel(processId);
            $('#process-context-menu').remove();
        });

        $(document).on('click.ctx', '#process-context-menu [data-action="delete"]', function(e) {
            e.stopPropagation();
            var processId = $(this).data('process-id');
            $('#' + processId).closest('li').remove();
            $('#process-context-menu').remove();
        });

        // Subtask menu
        $(document).on('contextmenu.ctx', '.subtask', function(e) {
            e.preventDefault();
            $('.subtask-contextMenu').remove();
            var subtaskId = $(this).attr('id');
            var $menu = $('<div class="subtask-contextMenu context-menu"></div>');
            $menu.append('<ul><li class="context-menu-item" data-action="delete-subtask" data-subtask-id="' + subtaskId + '">Delete</li></ul>');
            $('body').append($menu);
            $menu.css({ top: e.pageY + 'px', left: e.pageX + 'px' });
        });

        $(document).on('click.ctx', '.subtask-contextMenu [data-action="delete-subtask"]', function(e) {
            e.stopPropagation();
            var subtaskId = $(this).data('subtask-id');
            $('#' + subtaskId).remove();
            $('.subtask-contextMenu').remove();
        });

        // Link item menu
        $(document).on('contextmenu.ctx', '.link-item', function(e) {
            e.preventDefault();
            $('.link-context-menu').remove();
            var linkId = $(this).attr('id');
            var panelId = $(this).closest('.links-panel').attr('id');
            var $menu = $('<div class="link-context-menu context-menu"></div>');
            $menu.append('<ul><li class="context-menu-item" data-action="edit-link" data-link-id="' + linkId + '" data-panel-id="' + panelId + '">Edit</li></ul>');
            $('body').append($menu);
            $menu.css({ top: e.pageY + 'px', left: e.pageX + 'px' });
        });

        $(document).on('click.ctx', '.link-context-menu [data-action="edit-link"]', function(e) {
            e.stopPropagation();
            var linkId = $(this).data('link-id');
            var panelId = $(this).data('panel-id');
            if (typeof window.createLinkOverlay === 'function') {
                createLinkOverlay(panelId, linkId);
            }
            $('.link-context-menu').remove();
        });

        // Close any menu on outside click
        $(document).on('click.ctx', function(e) {
            if (!$(e.target).closest('.context-menu').length) $('.context-menu').remove();
        });
    };

    window.ContextMenus = ContextMenus;
})(window, jQuery);
