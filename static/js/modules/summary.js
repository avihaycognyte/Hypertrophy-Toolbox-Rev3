import { showToast } from './toast.js';

export async function fetchWeeklySummary(method = 'Total') {
    try {
        const response = await fetch(`/weekly_summary?method=${method}`, {
            headers: {
                'Accept': 'application/json'  // Explicitly request JSON response
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch weekly summary');
        }
        
        const data = await response.json();
        
        if (!data) {
            throw new Error('No data received from server');
        }
        
        updateSummaryUI(data);
    } catch (error) {
        console.error('Error fetching weekly summary:', error);
        showToast('Failed to fetch weekly summary', true);
    }
}

export async function fetchSessionSummary(method = 'Total') {
    try {
        const response = await fetch(`/session_summary?method=${method}`, {
            headers: {
                'Accept': 'application/json'  // Explicitly request JSON response
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch session summary');
        }
        
        const data = await response.json();
        
        if (!data) {
            throw new Error('No data received from server');
        }
        
        updateSummaryUI(data);
    } catch (error) {
        console.error('Error fetching session summary:', error);
        showToast('Failed to fetch session summary', true);
    }
}

function updateSummaryUI(data) {
    const summaryData = data.session_summary || data.weekly_summary || [];
    
    // Update summary tables
    updateSummaryTable(summaryData);
    
    // Update category breakdown
    updateCategoryTable(data.categories || []);
    
    // Update isolated muscles stats
    updateIsolatedMusclesTable(data.isolated_muscles || []);
}

function updateSummaryTable(summaryData) {
    const tbody = document.querySelector('#session-summary-table, #weekly-summary-table');
    if (!tbody || !summaryData) return;

    tbody.innerHTML = summaryData.map(item => `
        <tr>
            ${item.routine ? `<td>${item.routine}</td>` : ''}
            <td>${item.muscle_group || 'N/A'}</td>
            <td>${item.total_sets || 0}</td>
            <td>${item.total_reps || 0}</td>
            <td>${item.total_volume || 0}</td>
            <td>
                <div class="volume-classification">
                    <span class="volume-badge ${getVolumeClass(item.total_sets)}">
                        ${getVolumeLabel(item.total_sets)}
                    </span>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateCategoryTable(categories) {
    const tbody = document.querySelector('#categories-table tbody');
    if (!tbody || !categories) return;

    tbody.innerHTML = categories.map(cat => `
        <tr>
            <td>${cat.category || 'N/A'}</td>
            <td>${cat.subcategory || 'N/A'}</td>
            <td>${cat.total_exercises || 0}</td>
        </tr>
    `).join('');
}

function updateIsolatedMusclesTable(stats) {
    const tbody = document.querySelector('#isolated-muscles-table tbody');
    if (!tbody || !stats) return;

    tbody.innerHTML = stats.map(stat => `
        <tr>
            <td>${stat.isolated_muscle || 'N/A'}</td>
            <td>${stat.exercise_count || 0}</td>
            <td>${stat.total_sets || 0}</td>
            <td>${stat.total_reps || 0}</td>
            <td>${stat.total_volume || 0}</td>
            <td>
                <div class="volume-classification">
                    <span class="volume-badge ${getVolumeClass(stat.total_sets)}">
                        ${getVolumeLabel(stat.total_sets)}
                    </span>
                </div>
            </td>
        </tr>
    `).join('');
}

function getVolumeClass(sets) {
    if (sets >= 30) return 'ultra-volume';
    if (sets >= 20) return 'high-volume';
    if (sets >= 10) return 'medium-volume';
    return 'low-volume';
}

function getVolumeLabel(sets) {
    if (sets >= 30) return 'Ultra Volume';
    if (sets >= 20) return 'High Volume';
    if (sets >= 10) return 'Medium Volume';
    return 'Low Volume';
} 