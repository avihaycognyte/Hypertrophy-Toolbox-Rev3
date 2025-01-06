import { createVolumeChart, createProgressChart } from './charts.js';
import { fetchWeeklySummary, fetchSessionSummary } from './summary.js';

export function initializeUIHandlers() {
    // Handle editable fields
    document.querySelectorAll('.editable').forEach(cell => {
        cell.addEventListener('click', function(e) {
            // Don't trigger if clicking on the input
            if (e.target.classList.contains('editable-input')) {
                return;
            }
            
            const input = this.querySelector('.editable-input');
            const text = this.querySelector('.editable-text');
            
            if (input) {
                text.style.display = 'none';
                input.style.display = 'block';
                input.focus();
            }
        });
    });

    // Handle clicking outside editable fields
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.editable') && !e.target.classList.contains('editable-input')) {
            document.querySelectorAll('.editable-input').forEach(input => {
                input.style.display = 'none';
            });
            document.querySelectorAll('.editable-text').forEach(text => {
                text.style.display = 'block';
            });
        }
    });

    // Handle routine dropdown click state
    const routineDropdown = document.querySelector('.routine-dropdown');
    if (routineDropdown) {
        routineDropdown.addEventListener('click', function() {
            this.classList.add('clicked');
        });

        // Reset background when clicking outside
        document.addEventListener('click', function(event) {
            if (!routineDropdown.contains(event.target)) {
                routineDropdown.classList.remove('clicked');
            }
        });
    }

    initializeSummaryMethodHandlers();

    // Add validation for editable inputs
    document.querySelectorAll('.editable-input').forEach(input => {
        input.addEventListener('input', function() {
            const field = this.closest('[data-field]').dataset.field;
            const isValid = validateScoredValue(this.value, field);
            
            this.classList.toggle('is-invalid', !isValid);
            this.classList.toggle('is-valid', isValid);
        });
    });
}

export function initializeFormHandlers() {
    // Add Exercise button handler
    const addExerciseBtn = document.getElementById('add-exercise-btn');
    if (addExerciseBtn) {
        addExerciseBtn.addEventListener('click', () => {
            console.log('Add Exercise button clicked');
            // The actual addExercise function will be imported where needed
        });
    }

    // Form validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            if (!form.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });
}

export function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

export function initializeDropdowns() {
    // Initialize all dropdowns
    const dropdowns = document.querySelectorAll('.dropdown-toggle');
    dropdowns.forEach(dropdown => {
        new bootstrap.Dropdown(dropdown);
    });
}

export function handleTableSort() {
    document.querySelectorAll('th[data-sort]').forEach(header => {
        header.addEventListener('click', () => {
            const table = header.closest('table');
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            const column = header.dataset.sort;
            const ascending = header.classList.toggle('sort-asc');

            const sortedRows = rows.sort((a, b) => {
                const aValue = a.querySelector(`td[data-${column}]`)?.textContent;
                const bValue = b.querySelector(`td[data-${column}]`)?.textContent;
                return ascending ? 
                    aValue.localeCompare(bValue) : 
                    bValue.localeCompare(aValue);
            });

            tbody.innerHTML = '';
            sortedRows.forEach(row => tbody.appendChild(row));
        });
    });
}

export function initializeDataTables() {
    const tables = document.querySelectorAll('.data-table');
    tables.forEach(table => {
        $(table).DataTable({
            pageLength: 25,
            order: [[0, 'desc']],
            responsive: true
        });
    });
}

export function initializeCharts() {
    const chartContainers = document.querySelectorAll('[data-chart]');
    chartContainers.forEach(container => {
        const chartType = container.dataset.chart;
        const chartData = JSON.parse(container.dataset.chartData || '{}');
        
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);
        
        switch (chartType) {
            case 'volume':
                createVolumeChart(canvas, chartData);
                break;
            case 'progress':
                createProgressChart(canvas, chartData);
                break;
        }
    });
}

export function initializeSummaryMethodHandlers() {
    const methodSelect = document.getElementById('summary-method');
    if (!methodSelect) return;

    methodSelect.addEventListener('change', (e) => {
        const method = e.target.value;
        const currentPath = window.location.pathname;
        
        if (currentPath === '/weekly_summary') {
            fetchWeeklySummary(method);
        } else if (currentPath === '/session_summary') {
            fetchSessionSummary(method);
        }
    });
}

function initializeSuggestionCards() {
    document.querySelectorAll('.suggestion-card').forEach(card => {
        const toggle = card.querySelector('.expand-toggle');
        if (toggle) {
            toggle.addEventListener('click', () => {
                card.classList.toggle('expanded');
                toggle.textContent = card.classList.contains('expanded') ? 'Show Less' : 'Show More';
            });
        }
    });
}

// Call this function when suggestions are loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeSuggestionCards();
}); 