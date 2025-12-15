/* Tables module: Handles table cell editing and context menu for add/remove rows/cols
   Provides Tables.init() to attach delegated event handlers (namespaced '.tables')
*/
(function(window, $) {
    var Tables = {};

    Tables.init = function() {
        // Remove any previous handlers in this namespace to avoid duplicates
        $(document).off('.tables');

        // Click to edit (single-line input that doesn't resize cell)
        $(document).on('click.tables', '.editable-table th, .editable-table td', function() {
            var $cell = $(this);
            if (!$cell.is('.editing')) {
                var cellText = $cell.text();
                $cell.addClass('editing').html('<input type="text" class="cell-editor" value="' + cellText + '">').find('input.cell-editor').focus();
            }
        });

        // Save on blur
        $(document).on('blur.tables', '.editable-table input.cell-editor', function() {
            var $input = $(this);
            var $cell = $input.closest('th,td');
            var newText = $input.val();
            $cell.removeClass('editing').html(newText);
        });

        // Enter to commit
        $(document).on('keypress.tables', '.editable-table input.cell-editor', function(e) {
            if (e.which == 13) { $(this).blur(); }
        });

        // Context menu on table cells
        $(document).on('contextmenu.tables', '.editable-table th, .editable-table td', function(e) {
            e.preventDefault();
            $('.table-context-menu').remove();

            var $cell = $(this);
            var menu = $('<div class="table-context-menu"></div>');
            menu.append('<div class="tcmi" data-action="add-row">Add row below</div>');
            menu.append('<div class="tcmi" data-action="delete-row">Delete row</div>');
            menu.append('<div class="tcmi" data-action="add-col">Add column to right</div>');
            menu.append('<div class="tcmi" data-action="delete-col">Delete column</div>');

            $('body').append(menu);
            menu.css({ top: e.pageY + 'px', left: e.pageX + 'px' });
            menu.data('cell', $cell);
        });

        // Menu actions
        $(document).on('click.tables', '.table-context-menu .tcmi', function() {
            var action = $(this).data('action');
            var menu = $(this).closest('.table-context-menu');
            var $cell = menu.data('cell');
            var $table = $cell.closest('table');
            var $row = $cell.closest('tr');
            var colIndex = $cell.index();

            if (action === 'add-row') {
                var newRow = $('<tr></tr>');
                $row.children('th,td').each(function() { newRow.append('<td></td>'); });
                $row.after(newRow);
            }
            else if (action === 'delete-row') {
                if ($table.find('tr').length <= 1) { alert('Cannot delete the last row.'); }
                else { $row.remove(); }
            }
            else if (action === 'add-col') {
                $table.find('tr').each(function() {
                    var $cells = $(this).children('th,td');
                    if ($cells.length <= colIndex) { $(this).append('<td></td>'); }
                    else {
                        var cellTag = $cells.eq(colIndex).prop('tagName').toLowerCase();
                        var newCell = (cellTag === 'th') ? '<th></th>' : '<td></td>';
                        $cells.eq(colIndex).after(newCell);
                    }
                });
            }
            else if (action === 'delete-col') {
                var firstRowCells = $table.find('tr:first').children('th,td').length;
                if (firstRowCells <= 1) { alert('Cannot delete the last column.'); }
                else { $table.find('tr').each(function() { $(this).children('th,td').eq(colIndex).remove(); }); }
            }

            $('.table-context-menu').remove();
        });

        // Close menu on outside click
        $(document).on('click.tables', function(e) {
            if (!$(e.target).closest('.table-context-menu').length) { $('.table-context-menu').remove(); }
        });
    };

    // Expose
    window.Tables = Tables;
})(window, jQuery);
