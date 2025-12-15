/* Panels module: handles creating panels, draggable/resizable behaviour and inter-panel interactions */
(function(window, $) {
    var Panels = {};

    Panels.createPanel = function(panelHtml, panelId) {
        var App = window.App || {};

        $('#canvas').append(panelHtml);

        var $panel = $('#' + panelId);
        var parsedWidth = parseFloat($panel[0].style.width) || parseFloat($panel.css('width'));
        var parsedHeight = parseFloat($panel[0].style.height) || parseFloat($panel.css('height'));
        $panel.css({
            minWidth: 250,
            minHeight: App.panel_height || 300,
            width: parsedWidth || App.panel_width || 400,
            height: parsedHeight || App.panel_height || 300,
            zIndex: (App.highestZIndex = (App.highestZIndex || 100) + 1)
        });

        Panels.makePanelInteractive($panel);
        Panels.makePanelsInterconnected();
    };

    Panels.makePanelInteractive = function($panel) {
        var App = window.App || {};

        $panel.draggable({
            handle: ".handle",
            cancel: ".panel-title, .editable",
            grid: [App.grid_size || 10, App.grid_size || 10],
            containment: "#canvas",
            start: function() { $(this).css('zIndex', ++App.highestZIndex); },
            stop: function() {
                if ($(this).hasClass('minimized')) {
                    var viewportHeight = $(window).height() - 60;
                    var panelBottom = $(this).offset().top + $(this).outerHeight();
                    if (panelBottom >= viewportHeight) {
                        alert('Minimized Panel ID: ' + $(this).attr('id') + ' is touching the bottom of the screen.');
                    }
                }
            }
        }).resizable({
            minHeight: App.panel_height || 300,
            minWidth: 250,
            grid: [App.grid_size || 10, App.grid_size || 10]
        });

        function makePanelSortable(panelId, listClass) {
            $('#' + panelId + ' .' + listClass).sortable({
                placeholder: "sortable-placeholder",
                update: function(event, ui) {
                    if (typeof window.updateProcessNumbers === 'function') {
                        updateProcessNumbers(panelId);
                    }
                }
            }).disableSelection();
        }

        var panelId = $panel.attr('id');
        makePanelSortable(panelId, 'process-list');
        makePanelSortable(panelId, 'todo-list');
    };

    Panels.makePanelsInterconnected = function() {
        $('.todo-list').sortable({
            connectWith: ".todo-list",
            placeholder: "sortable-placeholder",
            helper: 'clone',
            appendTo: 'body',
            start: function(event, ui) { ui.item.addClass('being-dragged'); },
            stop: function(event, ui) { ui.item.removeClass('being-dragged'); }
        }).disableSelection();
    };

    Panels.init = function() {
        // Remove previous handlers to prevent duplicates
        $(document).off('.panels');

        // Delete panel
        $(document).on('click.panels', '.delete-panel', function() {
            if (confirm('Are you sure you want to delete this panel/note?')) {
                $(this).closest('.panel').remove();
            }
        });

        // If panels already exist on the page, ensure they are interactive
        $('.panel').each(function() { Panels.makePanelInteractive($(this)); });
        Panels.makePanelsInterconnected();
    };

    window.Panels = Panels;
})(window, jQuery);
