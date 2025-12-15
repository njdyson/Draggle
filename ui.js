/* UI helpers: overlays, settings overlay, title editing */
(function(window, $) {
    var UI = {};

    // Create overlay to edit a todo item
    window.createOverlayPanel = function(todoId) {
        var todoItem = $('#' + todoId);
        var todoText = todoItem.find('.editable').text();
        var description = todoItem.data('description') || '';
        var currentTodoDate = todoItem.data('date') || '';

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
            zIndex: (window.App.highestZIndex = (window.App.highestZIndex || 100) + 1)
        });

        $('#canvas').append(overlay);

        overlay.find('.date-picker').datepicker({
            dateFormat: 'dd-mm-yy',
            onSelect: function(dateText) { todoItem.data('date', dateText); }
        });

        if (currentTodoDate) overlay.find('.date-picker').datepicker('setDate', currentTodoDate);

        overlay.find('#cancel-item').on('click', function() { overlay.remove(); });

        overlay.find('#save-item').on('click', function() {
            var itemLine = overlay.find('#item-line').val();
            var description = overlay.find('.note-body').text();
            var todoDate = overlay.find('#todo-date').val();
            todoItem.find('.todo-content .editable').text(itemLine);
            todoItem.data('description', description);
            todoItem.data('date', todoDate);
            todoItem.find('.due-by').text(todoDate);
            overlay.remove();
        });
    };

    // Create overlay to edit process item
    window.createProcessOverlayPanel = function(processId) {
        var processItem = $('#' + processId);
        var $li = processItem.closest('li');
        var processText = processItem.text();
        var processDescription = $li.find('.process-description').text() || '';

        var overlay = $(`<div class="overlay-panel">
            <div class="overlay-title">Edit Process</div>
            <div style="padding:10px;">
                <label for="process-title" style='color:#ffffff;'>Title</label><br>
                <input type="text" id="process-title" class="item-line" value="${processText}" onfocus="this.select()">
                <label for="process-description" style='color:#ffffff;'>Subtext</label>
                <div id="process-description" class="note-body" contenteditable="true" style='padding:10px;opacity:0.7;'>${processDescription}</div>
                <div class="overlay-nav"><button id='save-process' class='overlay-button'>Save</button><button id='cancel-process' class='overlay-button'>Cancel</button></div>
            </div></div>`);

        var panel = processItem.closest('.panel');
        overlay.css({ width: panel.outerWidth(), height: panel.outerHeight(), top: panel.position().top, left: panel.position().left, zIndex: (window.App.highestZIndex = (window.App.highestZIndex || 100) + 1) });
        $('#canvas').append(overlay);

        overlay.find('#cancel-process').on('click', function() { overlay.remove(); });
        overlay.find('#save-process').on('click', function() {
            var newTitle = overlay.find('#process-title').val();
            var newDescription = overlay.find('#process-description').text();
            processItem.text(newTitle);
            $li.find('.process-description').text(newDescription);
            overlay.remove();
        });
    };

    // Create overlay to add/edit a link
    window.createLinkOverlay = function(panelId, linkId) {
        var $panel = $('#' + panelId);
        if (!$panel.length) return;
        var $existing = linkId ? $('#' + linkId) : null;
        var currentTitle = $existing ? $existing.text() : '';
        var currentUrl = $existing ? ($existing.data('url') || '') : '';
        var currentNewTab = $existing ? !!$existing.data('newTab') : false;
        var overlay = $(`<div class="overlay-panel">
            <div class="overlay-title">Link</div>
            <div style="padding:10px;">
                <label for="link-title" style='color:#ffffff;'>Title</label><br>
                <input type="text" id="link-title" class="item-line" value="${currentTitle}" onfocus="this.select()">
                <label for="link-url" style='color:#ffffff;'>URL</label><br>
                <input type="text" id="link-url" class="item-line" value="${currentUrl}" placeholder="https://example.com" onfocus="this.select()">
                <div style="margin-top:8px;">
                    <input type="checkbox" id="link-new-tab" ${currentNewTab ? 'checked' : ''}>
                    <label for="link-new-tab" style='color:#ffffff;'>Open in new tab</label>
                </div>
                <div class="overlay-nav"><button id='save-link' class='overlay-button'>Save</button><button id='cancel-link' class='overlay-button'>Cancel</button></div>
            </div>
        </div>`);

        overlay.css({
            width: $panel.outerWidth(),
            height: $panel.outerHeight(),
            top: $panel.position().top,
            left: $panel.position().left,
            zIndex: (window.App.highestZIndex = (window.App.highestZIndex || 100) + 1)
        });

        $('#canvas').append(overlay);

        overlay.find('#cancel-link').on('click', function() { overlay.remove(); });
        overlay.find('#save-link').on('click', function() {
            var title = overlay.find('#link-title').val() || '';
            var url = overlay.find('#link-url').val() || '';
            var newTab = overlay.find('#link-new-tab').is(':checked');
            if (!title || !url) { alert('Please provide both title and URL'); return; }
            var $list = $panel.find('.link-list');
            if (!$list.length) $list = $('<ol class="link-list"></ol>').appendTo($panel);
            if ($existing && $existing.length) {
                $existing.text(title).data('url', url).data('newTab', newTab);
            } else {
                var newId = 'link-' + Date.now() + '-' + Math.random().toString(36).slice(2,5);
                var $item = $('<li class="link-item" id="' + newId + '" data-url="' + url + '"></li>').text(title);
                if (newTab) $item.data('newTab', true);
                $list.append($item);
            }
            overlay.remove();
        });
    };

    // Toggle settings overlay
    window.toggleSettingsOverlay = function() {
        try {
            if ($('.settings-overlay').length === 0) {
                var currentBackgroundUrl = $('body').css('background-image');
                var match = /"([^"]+)"\)/.exec(currentBackgroundUrl) || /'([^']+)'/.exec(currentBackgroundUrl);
                var currentBackground = match ? match[1].split('/').pop() : "";
                var isBoardTitleVisible = $('.editable-title').is(':visible');
                var backgrounds = (window.App && window.App.backgrounds) || [];
                var currentFontSize = parseInt(getComputedStyle(document.body).fontSize, 10) || 15;
                var backgroundOptions = backgrounds.map(function(name) {
                    var label = name.replace(/\.[^/.]+$/, '');
                    return '<option value="' + name + '">' + label + '</option>';
                }).join('');
                if (currentBackground && backgrounds.indexOf(currentBackground) === -1) {
                    var currentLabel = currentBackground.replace(/\.[^/.]+$/, '');
                    backgroundOptions = '<option value="' + currentBackground + '">' + currentLabel + '</option>' + backgroundOptions;
                }
                var overlayHtml = `<div class="settings-overlay"><div class="overlay-title">Board Settings</div><div style="padding: 15px;">` +
                    `<label for="board-id">Board ID:</label><span>${window.boardID || ''}</span><br>` +
                    `<label for="background-selector">Background:</label><select id="background-selector" class="overlay-select">${backgroundOptions}</select><br>` +
                    `<label for="opacity-slider">Panel Opacity:</label><input type="range" id="opacity-slider" class="overlay-slider" min="0.7" max="1" step="0.05" value="${$('.panel').css('opacity')}"><br>` +
                    `<label for="font-size-slider">Text Size:</label><input type="range" id="font-size-slider" class="overlay-slider" min="12" max="20" step="1" value="${currentFontSize}"><span id="font-size-value">${currentFontSize}px</span><br>` +
                    `<label for="toggle-board-title">Show Board Title:</label><input type="checkbox" id="toggle-board-title" class="overlay-checkbox" ${isBoardTitleVisible ? 'checked' : ''}></div>` +
                    `<div class="overlay-nav"><button id='close-overlay' class="overlay-button">Close</button></div></div>`;

                $('#canvas').append(overlayHtml);
                $('#background-selector').val(currentBackground);
                $('#close-overlay').click(function() { $('.settings-overlay').remove(); });
                $('#background-selector').change(function() { 
                    var selectedBackground = $(this).val(); 
                    $('body').css('background-image', 'url("Backgrounds/' + selectedBackground + '")'); 
                    try { localStorage.setItem('lastBackground', selectedBackground); } catch (e) {}
                });
                $('#opacity-slider').on('input', function() { var opacityValue = $(this).val(); $('.panel').css('opacity', opacityValue); });
                $('#font-size-slider').on('input', function() {
                    var size = $(this).val();
                    document.documentElement.style.setProperty('--body-font-size', size + 'px');
                    $('#font-size-value').text(size + 'px');
                });
                $('#toggle-board-title').change(function() { var isBoardTitleVisible = $(this).is(':checked'); $('.editable-title').toggle(isBoardTitleVisible); });
            } else {
                $('.settings-overlay').remove();
            }
        } catch (err) {
            console.error('Failed to toggle settings overlay', err);
        }
    };

    // Make canvas title editable
    window.makeTitleEditable = function() {
        $('#canvasTitle').one('click', function() {
            var currentTitle = $(this).text();
            var editInputHtml = '<input type="text" class="title-input" value="' + currentTitle + '">';
            var $editInput = $(editInputHtml).replaceAll($(this));
            $editInput.focus();
            $editInput.on('blur keyup', function(e) {
                if (e.type === 'blur' || e.key === 'Enter') {
                    var newTitle = $editInput.val();
                    $editInput.replaceWith('<div id="canvasTitle" class="editable-title">' + newTitle + '</div>');
                    makeTitleEditable();
                }
            });
        });
    };

    UI.init = function() {
        // Ensure functions are available and attach any initial behaviours
        makeTitleEditable();
    };

    window.UI = UI;
})(window, jQuery);
