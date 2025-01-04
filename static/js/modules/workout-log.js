import { showToast } from './toast.js';

export function initializeWorkoutLog() {
    console.log('Initializing workout log');
    
    // Fix date input format
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const date = e.target.value;
            if (date === "None" || date === "") {
                e.target.value = new Date().toISOString().split('T')[0];
            }
        });
    });

    // Initialize progression checks
    initializeProgressionChecks();

    // Initialize editable cells
    initializeEditableCells();

    // Initialize filters
    initializeWorkoutLogFilters();

    // Initialize DataTables
    const workoutLogTable = document.querySelector('#workout-log-table');
    if (workoutLogTable) {
        $(workoutLogTable).DataTable({
            pageLength: 25,
            order: [[0, 'desc']],
            responsive: true
        });
    }
}

export function initializeProgressionChecks() {
    // Initialize progression status for all log entries
    document.querySelectorAll('[data-log-id]').forEach(entry => {
        const logId = entry.dataset.logId;
        checkProgressiveOverload(logId);
    });

    // Initialize date inputs
    initializeDateInputs();
}

function initializeDateInputs() {
    document.querySelectorAll('.progression-date').forEach(dateInput => {
        // Set default date to today if empty
        if (!dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }

        // Add change handler
        dateInput.addEventListener('change', (e) => {
            const logId = e.target.closest('[data-log-id]').dataset.logId;
            updateProgressionDate(logId, e.target.value);
        });
    });
}

export async function updateProgressionDate(logId, newDate) {
    try {
        const response = await fetch('/update_progression_date', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: logId,
                date: newDate
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update progression date');
        }

        const data = await response.json();
        showToast('Progression date updated successfully');

        // Update UI
        const dateCell = document.querySelector(`tr[data-log-id="${logId}"] .progression-date`);
        if (dateCell) {
            dateCell.textContent = newDate || 'Not set';
        }

        // Update progression status
        checkProgressiveOverload(logId);

    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to update progression date', true);
    }
}

export async function updateProgressionStatus(logId) {
    try {
        const response = await fetch(`/check_progression/${logId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to check progression');
        }

        const badge = document.querySelector(`tr[data-log-id="${logId}"] .progression-badge`);
        if (badge) {
            badge.className = `badge ${data.achieved ? 'bg-success' : 'bg-warning'}`;
            badge.textContent = data.achieved ? 'Achieved' : 'Pending';
        }

    } catch (error) {
        console.error('Error checking progression:', error);
        showToast('Failed to check progression status', true);
    }
}

export async function updateScoredValue(logId, field, value) {
    try {
        const response = await fetch('/update_workout_log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: logId,
                updates: {
                    [field]: value === '' ? null : value
                }
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to update value');
        }

        // Update the display text
        const row = document.querySelector(`tr[data-log-id="${logId}"]`);
        const cell = row.querySelector(`[data-field="${field}"]`);
        if (cell) {
            const display = cell.querySelector('.editable-text');
            if (display) {
                display.textContent = value || 'Click to set';
            }
        }

        // Update badge status
        const badge = row.querySelector('.badge');
        if (badge) {
            // Get all the values
            const planned_rir = parseFloat(row.querySelector('[data-field="planned_rir"]')?.textContent) || 0;
            const planned_rpe = parseFloat(row.querySelector('[data-field="planned_rpe"]')?.textContent) || 0;
            const planned_min_reps = parseFloat(row.querySelector('[data-field="planned_min_reps"]')?.textContent) || 0;
            const planned_max_reps = parseFloat(row.querySelector('[data-field="planned_max_reps"]')?.textContent) || 0;
            const planned_weight = parseFloat(row.querySelector('[data-field="planned_weight"]')?.textContent) || 0;

            const scored_rir = parseFloat(row.querySelector('[data-field="scored_rir"] .editable-text')?.textContent) || 0;
            const scored_rpe = parseFloat(row.querySelector('[data-field="scored_rpe"] .editable-text')?.textContent) || 0;
            const scored_min_reps = parseFloat(row.querySelector('[data-field="scored_min_reps"] .editable-text')?.textContent) || 0;
            const scored_max_reps = parseFloat(row.querySelector('[data-field="scored_max_reps"] .editable-text')?.textContent) || 0;
            const scored_weight = parseFloat(row.querySelector('[data-field="scored_weight"] .editable-text')?.textContent) || 0;

            const isProgressive = (
                (scored_rir && planned_rir && scored_rir < planned_rir) ||
                (scored_rpe && planned_rpe && scored_rpe > planned_rpe) ||
                (scored_min_reps && planned_min_reps && scored_min_reps > planned_min_reps) ||
                (scored_max_reps && planned_max_reps && scored_max_reps > planned_max_reps) ||
                (scored_weight && planned_weight && scored_weight > planned_weight)
            );

            badge.className = `badge ${isProgressive ? 'bg-success' : 'bg-warning'}`;
            badge.textContent = isProgressive ? 'Achieved' : 'Pending';
        }

        showToast('Value updated successfully');
    } catch (error) {
        console.error('Error updating value:', error);
        showToast('Failed to update value', true);
    }
}

export function validateScoredValue(value, field) {
    if (value === '') return true;
    
    const num = Number(value);
    if (isNaN(num)) return false;

    switch (field) {
        case 'scored_sets':
            return num > 0 && num <= 10;
        case 'scored_reps':
            return num > 0 && num <= 100;
        case 'scored_weight':
            return num >= 0 && num <= 1000;
        case 'scored_rir':
            return num >= 0 && num <= 5;
        case 'scored_rpe':
            return num >= 0 && num <= 10;
        default:
            return true;
    }
}

export function checkProgressiveOverload(logId) {
    const row = document.querySelector(`tr[data-log-id="${logId}"]`);
    if (!row) {
        console.error('Row not found for log ID:', logId);
        return;
    }

    // Get planned values
    const planned_rir = parseFloat(row.querySelector('[data-field="planned_rir"]')?.textContent) || 0;
    const planned_rpe = parseFloat(row.querySelector('[data-field="planned_rpe"]')?.textContent) || 0;
    const planned_min_reps = parseFloat(row.querySelector('[data-field="planned_min_reps"]')?.textContent) || 0;
    const planned_max_reps = parseFloat(row.querySelector('[data-field="planned_max_reps"]')?.textContent) || 0;
    const planned_weight = parseFloat(row.querySelector('[data-field="planned_weight"]')?.textContent) || 0;

    // Get scored values
    const scored_rir = parseFloat(row.querySelector('[data-field="scored_rir"] .editable-text')?.textContent) || 0;
    const scored_rpe = parseFloat(row.querySelector('[data-field="scored_rpe"] .editable-text')?.textContent) || 0;
    const scored_min_reps = parseFloat(row.querySelector('[data-field="scored_min_reps"] .editable-text')?.textContent) || 0;
    const scored_max_reps = parseFloat(row.querySelector('[data-field="scored_max_reps"] .editable-text')?.textContent) || 0;
    const scored_weight = parseFloat(row.querySelector('[data-field="scored_weight"] .editable-text')?.textContent) || 0;

    const isProgressive = (
        (scored_rir && planned_rir && scored_rir < planned_rir) ||
        (scored_rpe && planned_rpe && scored_rpe > planned_rpe) ||
        (scored_min_reps && planned_min_reps && scored_min_reps > planned_min_reps) ||
        (scored_max_reps && planned_max_reps && scored_max_reps > planned_max_reps) ||
        (scored_weight && planned_weight && scored_weight > planned_weight)
    );

    const badge = row.querySelector('.badge');
    if (badge) {
        badge.className = `badge ${isProgressive ? 'bg-success' : 'bg-warning'}`;
        badge.textContent = isProgressive ? 'Achieved' : 'Pending';
    }
}

export function initializeEditableCells() {
    document.querySelectorAll('.editable-cell').forEach(cell => {
        const input = cell.querySelector('input');
        const display = cell.querySelector('.display-value');

        if (input && display) {
            input.addEventListener('change', async () => {
                try {
                    const logId = cell.dataset.logId;
                    const field = cell.dataset.field;
                    const value = input.value;

                    await updateScoredValue(logId, field, value);
                    display.textContent = value || 'Click to edit';
                    input.style.display = 'none';
                    display.style.display = 'block';
                } catch (error) {
                    console.error('Error updating value:', error);
                    showToast('Failed to update value', true);
                }
            });
        }
    });
}

export function initializeWorkoutLogFilters() {
    const dateFilter = document.getElementById('date-filter');
    const routineFilter = document.getElementById('routine-filter');
    
    if (dateFilter) {
        dateFilter.addEventListener('change', filterWorkoutLogs);
    }
    if (routineFilter) {
        routineFilter.addEventListener('change', filterWorkoutLogs);
    }
}

async function filterWorkoutLogs() {
    try {
        const date = document.getElementById('date-filter')?.value;
        const routine = document.getElementById('routine-filter')?.value;

        const response = await fetch('/filter_workout_logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, routine })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        updateWorkoutLogTable(data);
    } catch (error) {
        console.error('Error filtering workout logs:', error);
        showToast('Failed to filter workout logs', true);
    }
}

function updateWorkoutLogTable(data) {
    const tbody = document.querySelector('#workout-log-table tbody');
    if (!tbody) return;

    tbody.innerHTML = data.length ? 
        data.map(log => createWorkoutLogRow(log)).join('') :
        '<tr><td colspan="8" class="text-center">No workout logs found</td></tr>';
}

function createWorkoutLogRow(log) {
    return `
        <tr data-log-id="${log.id}">
            <td>${log.date}</td>
            <td>${log.routine}</td>
            <td>${log.exercise}</td>
            <td class="editable-cell" data-field="scored_sets">
                <span class="editable-text">${log.scored_sets || 'Click to edit'}</span>
                <input type="number" class="editable-input form-control" 
                    value="${log.scored_sets || ''}" style="display: none;">
            </td>
            <td class="editable-cell" data-field="scored_reps">
                <span class="editable-text">${log.scored_reps || 'Click to edit'}</span>
                <input type="number" class="editable-input form-control" 
                    value="${log.scored_reps || ''}" style="display: none;">
            </td>
            <td class="editable-cell" data-field="scored_weight">
                <span class="editable-text">${log.scored_weight || 'Click to edit'}</span>
                <input type="number" class="editable-input form-control" 
                    value="${log.scored_weight || ''}" style="display: none;">
            </td>
            <td>
                <span class="badge ${log.progression_status === 'Achieved' ? 'bg-success' : 'bg-warning'}">
                    ${log.progression_status}
                </span>
            </td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteWorkoutLog(${log.id})">
                    Delete
                </button>
            </td>
        </tr>
    `;
}

export function checkProgressionStatus(logId) {
    const row = document.querySelector(`tr[data-log-id="${logId}"]`);
    if (!row) return;

    const progressionBadge = row.querySelector('.progression-badge');
    if (!progressionBadge) return;

    fetch(`/check_progression/${logId}`)
        .then(response => response.json())
        .then(data => {
            if (!response.ok) throw new Error(data.error);
            
            progressionBadge.className = `badge ${data.achieved ? 'bg-success' : 'bg-warning'}`;
            progressionBadge.textContent = data.achieved ? 'Achieved' : 'Pending';
        })
        .catch(error => {
            console.error('Error checking progression:', error);
            showToast('Failed to check progression status', true);
        });
}

export async function deleteWorkoutLog(logId) {
    try {
        const response = await fetch('/delete_workout_log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: logId })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete log entry');
        }

        // Remove the row from the table
        const row = document.querySelector(`tr[data-log-id="${logId}"]`);
        if (row) {
            row.remove();
        }

        showToast('Log entry deleted successfully');
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to delete log entry', true);
    }
}

export async function handleDateChange(event, logId) {
    try {
        const newDate = event.target.value;
        const response = await fetch('/update_progression_date', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: logId,
                date: newDate
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to update progression date');
        }

        // Update the display text
        const cell = event.target.closest('.editable');
        const display = cell.querySelector('.editable-text');
        if (display) {
            const formattedDate = new Date(newDate).toLocaleDateString('en-GB');
            display.textContent = formattedDate;
        }

        // Get the row and update badge status
        const row = document.querySelector(`tr[data-log-id="${logId}"]`);
        const badge = row.querySelector('.badge');
        if (badge) {
            // Get all the values
            const planned_rir = parseFloat(row.querySelector('[data-field="planned_rir"]')?.textContent) || 0;
            const planned_rpe = parseFloat(row.querySelector('[data-field="planned_rpe"]')?.textContent) || 0;
            const planned_min_reps = parseFloat(row.querySelector('[data-field="planned_min_reps"]')?.textContent) || 0;
            const planned_max_reps = parseFloat(row.querySelector('[data-field="planned_max_reps"]')?.textContent) || 0;
            const planned_weight = parseFloat(row.querySelector('[data-field="planned_weight"]')?.textContent) || 0;

            const scored_rir = parseFloat(row.querySelector('[data-field="scored_rir"] .editable-text')?.textContent) || 0;
            const scored_rpe = parseFloat(row.querySelector('[data-field="scored_rpe"] .editable-text')?.textContent) || 0;
            const scored_min_reps = parseFloat(row.querySelector('[data-field="scored_min_reps"] .editable-text')?.textContent) || 0;
            const scored_max_reps = parseFloat(row.querySelector('[data-field="scored_max_reps"] .editable-text')?.textContent) || 0;
            const scored_weight = parseFloat(row.querySelector('[data-field="scored_weight"] .editable-text')?.textContent) || 0;

            const isProgressive = (
                (scored_rir && planned_rir && scored_rir < planned_rir) ||
                (scored_rpe && planned_rpe && scored_rpe > planned_rpe) ||
                (scored_min_reps && planned_min_reps && scored_min_reps > planned_min_reps) ||
                (scored_max_reps && planned_max_reps && scored_max_reps > planned_max_reps) ||
                (scored_weight && planned_weight && scored_weight > planned_weight)
            );

            badge.className = `badge ${isProgressive ? 'bg-success' : 'bg-warning'}`;
            badge.textContent = isProgressive ? 'Achieved' : 'Pending';
        }

        showToast('Progression date updated successfully');
    } catch (error) {
        console.error('Error updating progression date:', error);
        showToast('Failed to update progression date', true);
    }
} 