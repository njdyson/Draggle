/* Persistence module: save/load board data */
(function(window, $) {
    function getCurrentSettings() {
        var currentBackgroundUrl = $('body').css('background-image') || '';
        var match = /\"([^"]+)\"|\(([^)]+)\)/.exec(currentBackgroundUrl);
        var backgroundPath = (match && (match[1] || match[2])) || '';
        var backgroundFile = backgroundPath.split('/').pop().replace(/["')]/g, '');
        var opacity = parseFloat($('.panel').first().css('opacity')) || 1;
        var fontSize = parseInt(getComputedStyle(document.body).fontSize, 10) || 15;
        var showTitle = $('.editable-title').is(':visible');
        return {
            background: backgroundFile || '',
            opacity: opacity,
            fontSize: fontSize,
            showTitle: !!showTitle
        };
    }

    // Collect board data and return an object
    window.collectBoardData = function() {
        var boardData = {
            boardTitle: $("#canvasTitle").text(),
            boardId: window.boardID || '',
            settings: getCurrentSettings(),
            items: []
        };

        // Checklists
        $('.checklist').each(function() {
            var panel = $(this);
            var checklistItems = [];
            panel.find('.todo-item').each(function() {
                var todoItem = $(this);
                var subtasks = [];
                todoItem.find('.subtask').each(function() {
                    var sub = $(this);
                    subtasks.push({
                        id: sub.attr('id'),
                        text: sub.find('.editable').html(),
                        checked: sub.find('.todo-checkbox').is(':checked'),
                        dueDate: sub.data('due-date') || ''
                    });
                });
                checklistItems.push({
                    id: todoItem.attr('id'),
                    text: todoItem.find('.todo-content .editable').html(),
                    checked: todoItem.find('.todo-content .todo-checkbox').is(':checked'),
                    description: todoItem.data('description') || '',
                    date: todoItem.data('date') || '',
                    subtasks: subtasks
                });
            });

            boardData.items.push({
                id: panel.attr('id'),
                type: 'checklist',
                location: {
                    top: parseFloat(panel.css('top')) || 0,
                    left: parseFloat(panel.css('left')) || 0
                },
                size: {
                    width: panel.outerWidth(),
                    height: panel.outerHeight()
                },
                title: panel.find('.panel-title').val(),
                todos: checklistItems
            });
        });

        // Notes
        $('.note').each(function() {
            var note = $(this);
            var content = note.find('.ql-editor').html() || note.find('.note-body').html() || '';
            boardData.items.push({
                id: note.attr('id'),
                type: 'note',
                location: {
                    top: parseFloat(note.css('top')) || 0,
                    left: parseFloat(note.css('left')) || 0
                },
                size: {
                    width: note.outerWidth(),
                    height: note.outerHeight()
                },
                title: note.find('.panel-title').val(),
                content: content
            });
        });

        // Tables
        $('.table-panel').each(function() {
            var panel = $(this);
            boardData.items.push({
                id: panel.attr('id'),
                type: 'table',
                location: {
                    top: parseFloat(panel.css('top')) || 0,
                    left: parseFloat(panel.css('left')) || 0
                },
                size: {
                    width: panel.outerWidth(),
                    height: panel.outerHeight()
                },
                title: panel.find('.panel-title').val(),
                content: panel.find('table').html()
            });
        });

        // Process panels
        $('.process-panel').each(function() {
            var panel = $(this);
            var steps = [];
            panel.find('.process-list li').each(function() {
                steps.push({
                    id: $(this).find('.process-item').attr('id') || '',
                    text: $(this).find('.process-item').text() || '',
                    description: $(this).find('.process-description').text() || ''
                });
            });

            boardData.items.push({
                id: panel.attr('id'),
                type: 'process',
                location: {
                    top: parseFloat(panel.css('top')) || 0,
                    left: parseFloat(panel.css('left')) || 0
                },
                size: {
                    width: panel.outerWidth(),
                    height: panel.outerHeight()
                },
                title: panel.find('.panel-title').val(),
                steps: steps
            });
        });

        // Links
        $('.links-panel').each(function() {
            var panel = $(this);
            var links = [];
            panel.find('.link-item').each(function() {
                links.push({
                    id: $(this).attr('id'),
                    title: $(this).text(),
                    url: $(this).data('url') || '',
                    newTab: !!$(this).data('newTab')
                });
            });

            boardData.items.push({
                id: panel.attr('id'),
                type: 'links',
                location: {
                    top: parseFloat(panel.css('top')) || 0,
                    left: parseFloat(panel.css('left')) || 0
                },
                size: {
                    width: panel.outerWidth(),
                    height: panel.outerHeight()
                },
                title: panel.find('.panel-title').val(),
                links: links
            });
        });

        return boardData;
    };

    // JSON string helper for download flow
    window.collectBoardDataJson = function() {
        return JSON.stringify(collectBoardData(), null, 2);
    };

    // Save to file
    window.saveTextFile = function() {
        var text = collectBoardDataJson();
        var filename = $("#canvasTitle").text() + ".json";
        localStorage.setItem('lastLoadedBoard', filename);
        var blob = new Blob([text], {type: "application/json;charset=utf-8"});
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Load board data
    window.loadBoardFromData = function(boardData) {
        if (!boardData) return;

        // Clear existing panels
        $('.panel').remove();

        if (boardData.boardTitle) $("#canvasTitle").text(boardData.boardTitle);
        if (boardData.boardId) window.boardID = boardData.boardId;

        // Apply settings if present
        var panelOpacity = null;
        if (boardData.settings) {
            if (boardData.settings.background) {
                $('body').css('background-image', 'url("Backgrounds/' + boardData.settings.background + '")');
            }
            if (boardData.settings.opacity) {
                panelOpacity = boardData.settings.opacity;
            }
            if (boardData.settings.fontSize) {
                document.documentElement.style.setProperty('--body-font-size', boardData.settings.fontSize + 'px');
            }
            if (typeof boardData.settings.showTitle === 'boolean') {
                $('.editable-title').toggle(boardData.settings.showTitle);
            }
            window.App = window.App || {};
        }

        var items = boardData.items || [];
        items.forEach(function(item) {
            var panelHtml = '';
            var top = (item.location && item.location.top) || 0;
            var left = (item.location && item.location.left) || 0;
            var width = (item.size && item.size.width) || 400;
            var height = (item.size && item.size.height) || 300;

            if (item.type === 'checklist') {
                var listItemsHtml = '';
                (item.todos || []).forEach(function(todo) {
                    var tid = todo.id || ('todo-' + Date.now() + '-' + Math.random().toString(36).slice(2,6));
                    var todoCheckedAttr = todo.checked ? 'checked' : '';
                    var todoCompletedClass = todo.checked ? ' completed' : '';
                    var subtasksHtml = '';
                    if (Array.isArray(todo.subtasks)) {
                        todo.subtasks.forEach(function(sub) {
                            var sid = sub.id || ('subtask-' + Date.now() + '-' + Math.random().toString(36).slice(2,6));
                            var subCheckedAttr = sub.checked ? 'checked' : '';
                            var subCompletedClass = sub.checked ? ' completed' : '';
                            var dueAttr = sub.dueDate ? ` data-due-date="${sub.dueDate}"` : ' data-due-date=""';
                            subtasksHtml += `<li class="subtask${subCompletedClass}" id="${sid}"${dueAttr}><input type="checkbox" class="todo-checkbox" ${subCheckedAttr}/><span class="editable" contenteditable="true" tabindex="-1">${sub.text || ''}</span></li>`;
                        });
                    } else if (typeof todo.subtasks === 'string') {
                        subtasksHtml = todo.subtasks;
                    }
                    listItemsHtml += `<li class='todo-item' id='${tid}'>` +
                        `<div class="todo-content${todoCompletedClass}"><input type="checkbox" class="todo-checkbox" ${todoCheckedAttr}/>` +
                        `<span class="editable">${todo.text || ''}</span>` +
                        `<div class="due-by">${todo.date || ''}</div></div>` +
                        `<ul class='subtasks'>${subtasksHtml}</ul></li>`;
                });
                panelHtml = `<div class="panel checklist" id="${item.id}" style="left:${left}px; top:${top}px; width:${width}px; height:${height}px;">` +
                    `<div class="handle"></div><div class="corner-buttons"><button class="delete-panel">X</button></div>` +
                    `<input type="text" class="panel-title" value="${item.title || ''}" onfocus="this.select()" onkeyup="if(event.keyCode==13) {this.blur();}">` +
                    `<ul class="todo-list">${listItemsHtml}</ul><input type="text" class="todo-input" placeholder="Add new todo"/></div>`;
            } else if (item.type === 'note') {
                var editorId = (item.id || 'note') + '-editor';
                panelHtml = `<div class="panel note" id="${item.id}" style="left:${left}px; top:${top}px; width:${width}px; height:${height}px;">` +
                    `<div class="handle"></div><div class="corner-buttons"><button class="delete-panel">X</button></div>` +
                    `<input type="text" class="panel-title" value="${item.title || ''}" onfocus="this.select()" onkeyup="if(event.keyCode==13) {this.blur();}">` +
                    `<div id="${editorId}" class="note-editor">${item.content || ''}</div></div>`;
            } else if (item.type === 'table') {
                panelHtml = `<div class="panel table-panel" id="${item.id}" style="left:${left}px; top:${top}px; width:${width}px; height:${height}px;">` +
                    `<div class="handle"></div><div class="corner-buttons"><button class="delete-panel">X</button></div>` +
                    `<input type="text" class="panel-title" value="${item.title || ''}" onfocus="this.select()" onkeyup="if(event.keyCode==13) {this.blur();}">` +
                    `<div class="table-container"><table class="editable-table">${item.content || '<tr><th></th></tr>'}</table></div></div>`;
            } else if (item.type === 'links') {
                var linksHtml = '';
                (item.links || []).forEach(function(link) {
                    var lid = link.id || ('link-' + Date.now() + '-' + Math.random().toString(36).slice(2,6));
                    var newTabAttr = link.newTab ? 'data-new-tab="true"' : '';
                    linksHtml += `<li class="link-item" id="${lid}" data-url="${link.url || ''}" ${newTabAttr}>${link.title || ''}</li>`;
                });
                panelHtml = `<div class="panel links-panel" id="${item.id}" style="left:${left}px; top:${top}px; width:${width}px; height:${height}px;">` +
                    `<div class="handle"></div><div class="corner-buttons"><button class="delete-panel">X</button></div>` +
                    `<input type="text" class="panel-title" value="${item.title || ''}" onfocus="this.select()" onkeyup="if(event.keyCode==13) {this.blur();}">` +
                    `<ol class="link-list">${linksHtml}</ol>` +
                    `<button class="add-link-button">+</button>` +
                `</div>`;
            } else if (item.type === 'process') {
                var stepsHtml = '';
                (item.steps || []).forEach(function(step) {
                    var sid = step.id || ('process-' + Date.now() + '-' + Math.random().toString(36).slice(2,6));
                    stepsHtml += `<li><span class="process-item" id="${sid}">${step.text || ''}</span><div class="process-description">${step.description || ''}</div></li>`;
                });
                panelHtml = `<div class="panel process-panel" id="${item.id}" style="left:${left}px; top:${top}px; width:${width}px; height:${height}px;">` +
                    `<div class="handle"></div><div class="corner-buttons"><button class="delete-panel">X</button></div>` +
                    `<input type="text" class="panel-title" value="${item.title || ''}" onfocus="this.select()" onkeyup="if(event.keyCode==13) {this.blur();}">` +
                    `<ol class="process-list">${stepsHtml}</ol>` +
                    `<input type="text" class="process-input" placeholder="Add new step"/>` +
                `</div>`;
            }

            if (panelHtml && window.Panels && typeof Panels.createPanel === 'function') {
                Panels.createPanel(panelHtml, item.id);
            }

            // Restore checklist item metadata
            if (item.type === 'checklist') {
                (item.todos || []).forEach(function(todo) {
                    var tid = todo.id;
                    if (!tid) return;
                    var $todo = $('#' + tid);
                    $todo.data('description', todo.description || '');
                    $todo.data('date', todo.date || '');
                });
            } else if (item.type === 'note') {
                var eid = (item.id || 'note') + '-editor';
                var selector = '#' + eid;
                if (window.Quill && $(selector).length) {
                    var toolbarOptions = [[{ 'header': 1 }, { 'header': 2 },'bold', 'italic', 'underline', 'strike',{ 'color': [] }],
                        [{ 'list': 'bullet' }, { 'list': 'ordered'}],['code-block', 'link']];
                    var quill = new Quill(selector, {
                        modules: { toolbar: toolbarOptions },
                        placeholder: 'Content...',
                        theme: 'snow'
                    });
                    if (item.content) {
                        quill.clipboard.dangerouslyPasteHTML(item.content);
                    }
                }
            }
        });

        if (panelOpacity) {
            $('.panel').css('opacity', panelOpacity);
        }

        // Sync completed styling for restored checked boxes (supports both new and legacy data)
        $('.todo-checkbox:checked').each(function() {
            $(this).parent().addClass('completed');
        });

        // Update backgrounds list in case new options were added at runtime
        window.App = window.App || {};
        if (window.App.backgrounds) {
            window.App.backgrounds = [
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
        }

        // Re-init behaviours
        if (window.Panels && typeof Panels.init === 'function') Panels.init();
        if (window.Tables && typeof Tables.init === 'function') Tables.init();
        if (window.ContextMenus && typeof ContextMenus.init === 'function') ContextMenus.init();
        if (window.UI && typeof UI.init === 'function') UI.init();
    };

})(window, jQuery);
