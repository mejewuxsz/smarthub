<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Task History - Smart Study Hub</title>
  <link rel="stylesheet" href="css/styles.css" />
  <style>
    .history-container {
      max-width: 1000px;
      margin: 2rem auto;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      padding: 2rem;
    }
    .history-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
    }
    .history-header h1 {
      margin: 0;
      font-size: 2rem;
      color: #2196F3;
    }
    .back-btn {
      background: #2196F3;
      color: #fff;
      border: none;
      border-radius: 4px;
      padding: 0.5rem 1.25rem;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .back-btn:hover {
      background: #0b7dda;
      transform: translateY(-1px);
    }
    .history-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
      font-size: 1rem;
    }
    .history-table th, .history-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
    }
    .history-table th {
      background: #f1f5f9;
      color: #0284c7;
      font-weight: 600;
    }
    .history-table tr:last-child td {
      border-bottom: none;
    }
    .history-action {
      font-weight: 600;
      color: #16a34a;
    }
    .history-action.edited {
      color: #f59e42;
    }
    .history-before, .history-after {
      font-size: 0.95rem;
      color: #64748b;
      white-space: pre-line;
    }
    @media (max-width: 700px) {
      .history-container { padding: 1rem; }
      .history-header h1 { font-size: 1.2rem; }
      .history-table th, .history-table td { padding: 0.5rem; font-size: 0.95rem; }
    }
  </style>
</head>
<body>
  <div class="history-container">
    <div class="history-header">
      <h1>Task History</h1>
      <div style="display: flex; gap: 1rem; align-items: center;">
        <button id="clearHistoryBtn" style="background:#dc2626;color:#fff;border:none;border-radius:4px;padding:0.5rem 1.25rem;font-size:1rem;cursor:pointer;">Clear History</button>
        <button id="exportCsvBtn" style="background:#22c55e;color:#fff;border:none;border-radius:4px;padding:0.5rem 1.25rem;font-size:1rem;cursor:pointer;">Export to CSV</button>
        <a href="/smarthub/htmlfiles/dashboard.html" class="back-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          Back to Dashboard
        </a>
      </div>
    </div>
    <table class="history-table">
      <thead>
        <tr>
          <th>Task Title</th>
          <th>Action</th>
          <th>Note</th>
          <th>Date & Time</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="historyTableBody">
        <!-- History rows will be rendered here by backend or JS -->
        <tr><td colspan="5" style="text-align:center; color:#b0b7c3;">No history yet.</td></tr>
      </tbody>
    </table>
  </div>
  <script>
    let lastLoadedHistory = [];
    async function loadHistory() {
      try {
        const response = await fetch('/smarthub/api/get_history.php');
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to load history');
        }

        lastLoadedHistory = data.history;
        const tbody = document.getElementById('historyTableBody');
        tbody.innerHTML = '';

        if (data.history.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#b0b7c3;">No history yet.</td></tr>';
          return;
        }

        data.history.forEach(item => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${item.title}</td>
            <td><span class="history-action ${item.action}">${item.action.charAt(0).toUpperCase() + item.action.slice(1)}</span></td>
            <td>${item.action === 'edited' ? item.note : (item.action === 'completed' ? 'Task marked as completed.' : '')}</td>
            <td>${new Date(item.timestamp).toLocaleString()}</td>
            <td><button class="delete-history-btn" data-id="${item.id}" title="Delete" style="background:none;border:none;color:#dc2626;font-size:1.2rem;cursor:pointer;">&times;</button></td>
          `;
          tbody.appendChild(row);
        });
        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-history-btn').forEach(btn => {
          btn.onclick = async function() {
            if (confirm('Delete this history entry?')) {
              await fetch('/smarthub/api/delete_history.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'id=' + encodeURIComponent(this.dataset.id)
              });
              loadHistory();
            }
          };
        });
      } catch (error) {
        console.error('Error loading history:', error);
        const tbody = document.getElementById('historyTableBody');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ef4444;">Error loading history. Please try again.</td></tr>';
      }
    }

    function exportHistoryToCSV(history) {
      if (!history || !history.length) {
        alert('No history to export!');
        return;
      }
      const headers = ['Task Title', 'Action', 'Note', 'Date & Time'];
      const rows = history.map(item => [
        `"${item.title.replace(/"/g, '""')}"`,
        `"${item.action.replace(/"/g, '""')}"`,
        `"${(item.action === 'edited' ? item.note : (item.action === 'completed' ? 'Task marked as completed.' : '')).replace(/"/g, '""')}"`,
        `"${new Date(item.timestamp).toLocaleString().replace(/"/g, '""')}"`
      ]);
      const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'task_history.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    // Load history when page loads
    document.addEventListener('DOMContentLoaded', () => {
      loadHistory();
      document.getElementById('clearHistoryBtn').onclick = async function() {
        if (confirm('Clear all history?')) {
          await fetch('/smarthub/api/delete_history.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'all=1'
          });
          loadHistory();
        }
      };
      document.getElementById('exportCsvBtn').onclick = function() {
        exportHistoryToCSV(lastLoadedHistory);
      };
    });
  </script>
</body>
</html> 