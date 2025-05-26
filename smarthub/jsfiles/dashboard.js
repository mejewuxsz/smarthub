// --- SESSION/AUTH CHECK AND USER INFO DISPLAY ---
(async function() {
  try {
    const res = await fetch('/smarthub/api/dashboard.php');
    const data = await res.json();
    if (!data.success) {
      window.location.href = '/smarthub/htmlfiles/login.html';
      return;
    }
    // Optionally fetch user info (username, etc.)
    if (data.user && data.user.username) {
      const welcomeText = document.getElementById('welcomeText');
      if (welcomeText) welcomeText.textContent = `Welcome to your hub, ${data.user.username}!`;
    }
  } catch (err) {
    window.location.href = '/smarthub/htmlfiles/login.html';
  }
})();

// Logout logic
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.onclick = async function(e) {
    e.preventDefault();
    await fetch('/smarthub/api/logout.php');
    window.location.href = '/smarthub/htmlfiles/login.html';
  };
}
// --- END SESSION/AUTH/LOGOUT ---

// Render Calendar with highlighted dates and tooltips for task descriptions
function renderCalendar(taskDates = {}, tasks = []) {
  const calendar = document.getElementById("calendar");
  if (!calendar) return;
  
  calendar.innerHTML = "";

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startDay = firstDay.getDay(); // 0 = Sunday

  // Add blank days before the 1st
  for (let i = 0; i < startDay; i++) {
    const blank = document.createElement("div");
    blank.className = "calendar-day blank";
    calendar.appendChild(blank);
  }

  // Add each day of the month
  for (let date = 1; date <= lastDate; date++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day";
    cell.textContent = date;

    const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;

    if (taskDates[isoDate]) {
      const task = taskDates[isoDate];
      const deadlineDate = new Date(isoDate);
      const daysDiff = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 0) {
        cell.classList.add("due-today");
      } else if (daysDiff <= 7) {
        cell.classList.add("due-week");
      } else {
        cell.classList.add("due-later");
      }

      cell.title = task.title;

      cell.onmouseenter = function () {
        const tooltip = document.createElement("div");
        tooltip.className = "tooltip";
        tooltip.textContent = task.description;
        cell.appendChild(tooltip);
      };

      cell.onmouseleave = function () {
        const tooltip = cell.querySelector(".tooltip");
        if (tooltip) tooltip.remove();
      };

      cell.onclick = () => showTasksOnDate(isoDate);
    }

    calendar.appendChild(cell);
  }

  renderCalendarLegend();
}

// Calendar legend for color meanings
function renderCalendarLegend() {
  const legend = document.getElementById("calendarLegend");
  if (!legend) return;

  legend.innerHTML = `
    <span><span class="legend-box due-later"></span> Due in 8+ days</span>
    <span><span class="legend-box due-week"></span> Due this week</span>
    <span><span class="legend-box due-today"></span> Due today</span>
  `;
}

// Show tasks due on a specific date
function showTasksOnDate(date) {
  const tasksContainer = document.getElementById("tasksContainer");
  if (!tasksContainer) return;
  
  tasksContainer.innerHTML = "";

  fetch("/smarthub/api/get_tasks.php")
    .then(res => res.json())
    .then(data => {
      data.forEach(task => {
        if (task.deadline === date) {
          const div = document.createElement("div");
          div.className = "task";
          div.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.description}</p>
            <p><strong>Category:</strong> ${task.category}</p>
            <p><strong>Deadline:</strong> ${task.deadline}</p>
            <button onclick="markDone(${task.id})">Mark as Done</button>
            <button onclick="deleteTask(${task.id})">Delete</button>
          `;
          tasksContainer.appendChild(div);
        }
      });
    });
}

// Request notification permission on page load
if ('Notification' in window && Notification.permission !== 'granted') {
  Notification.requestPermission();
}

// Add new task with improved error handling and loading state
const addTaskForm = document.getElementById("addTaskForm");
if (addTaskForm) {
    addTaskForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const submitButton = this.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Adding...';
            const formData = new FormData(this);
            // Add reminder field
            const reminderInput = document.getElementById('reminder');
            if (reminderInput && reminderInput.value) {
                formData.set('reminder', reminderInput.value);
            }
            const response = await fetch("/smarthub/api/add_task.php", {
                method: "POST",
                body: formData
            });
            if (!response.ok) {
                throw new Error('Failed to add task');
            }
            const result = await response.json();
            if (result.success) {
                this.reset();
                await loadTasks();
                showNotification('Task added successfully!', 'success');
            } else {
                throw new Error(result.message || 'Failed to add task');
            }
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
}

// Enhanced task loading with error handling and loading states
let allPendingTasks = [];

async function loadTasks() {
    const tasksContainer = document.getElementById("tasksContainer");
    const historyContainer = document.getElementById("historyContainer");
    try {
        if (tasksContainer) {
            tasksContainer.innerHTML = '<div class="loading">Loading tasks...</div>';
        }
        if (historyContainer) {
            historyContainer.innerHTML = '<div class="loading">Loading history...</div>';
        }
        const response = await fetch("/smarthub/api/get_tasks.php");
        if (!response.ok) {
            throw new Error('Failed to load tasks');
        }
        const data = await response.json();
        const taskDates = {};
        // Sort tasks by deadline only (priority field doesn't exist)
        data.sort((a, b) => {
            return new Date(a.deadline) - new Date(b.deadline);
        });
        if (tasksContainer) {
            tasksContainer.innerHTML = "";
        }
        if (historyContainer) {
            historyContainer.innerHTML = "";
        }
        allPendingTasks = data.filter(task => task.status === "Pending");
        // Render filtered tasks (initially all)
        renderPendingTasks();
        data.forEach(task => {
            const div = createTaskElement(task);
            if (task.deadline && task.status !== "Done") {
                taskDates[task.deadline] = {
                    title: task.title,
                    description: task.description,
                    priority: 'normal' // Set default priority since column doesn't exist
                };
            }
            if (task.status === "Done" && historyContainer) {
                historyContainer.appendChild(div);
            }
        });
        updateCalendarTasks(taskDates);
        updateRemindersInBell(data);
        scheduleReminders(data);
        updateDashboardAnalytics(data);
    } catch (error) {
        if (tasksContainer) {
            tasksContainer.innerHTML = `<div class="error">Error loading tasks: ${error.message}</div>`;
        }
        if (historyContainer) {
            historyContainer.innerHTML = `<div class="error">Error loading history: ${error.message}</div>`;
        }
        showNotification('Failed to load tasks', 'error');
    }
}

function renderPendingTasks() {
    const tasksContainer = document.getElementById("tasksContainer");
    const filter = document.getElementById("categoryFilter");
    if (!tasksContainer) return;
    let filtered = allPendingTasks;
    if (filter && filter.value) {
        filtered = allPendingTasks.filter(task => task.category === filter.value);
    }
    tasksContainer.innerHTML = "";
    if (filtered.length === 0) {
        tasksContainer.innerHTML = '<div class="no-tasks">No pending tasks found.</div>';
        return;
    }
    filtered.forEach(task => {
        const div = createTaskElement(task);
        tasksContainer.appendChild(div);
    });
}

// Set up filter and load tasks on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    const filter = document.getElementById("categoryFilter");
    if (filter) {
        filter.addEventListener('change', renderPendingTasks);
    }
    loadTasks();
});

// Helper function to create task element
function createTaskElement(task) {
    const div = document.createElement("div");
    div.className = "task priority-normal"; // Always use normal priority
    div.innerHTML = `
        <div class="task-header">
            <h3>${escapeHtml(task.title)}</h3>
            <span class="priority-badge priority-normal">Normal</span>
        </div>
        <p>${escapeHtml(task.description)}</p>
        <p><strong>Category:</strong> ${escapeHtml(task.category)}</p>
        <p class="${getDeadlineClass(task.deadline)}"><strong>Deadline:</strong> ${formatDate(task.deadline)}</p>
        <div class="task-actions">
            ${task.status === "Pending" ? `
                <button onclick="markDone(${task.id})" class="btn-success" title="Mark as Done">
                  <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </button>
                <button onclick="editTask(${task.id}, '${escapeHtml(task.title)}', '${task.deadline}', '${escapeHtml(task.reminder)}')" class="btn-edit" title="Edit">
                  <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z"></path></svg>
                </button>
            ` : ''}
            <button onclick="deleteTask(${task.id})" class="btn-danger" title="Delete">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
        </div>
    `;
    
    return div;
}

// Helper functions
function getPriorityClass(priority) {
    switch(priority?.toLowerCase()) {
        case 'high': return 'priority-high';
        case 'low': return 'priority-low';
        default: return 'priority-normal';
    }
}

function getDeadlineClass(deadline) {
    if (!deadline) return '';
    const daysUntilDeadline = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilDeadline < 0) return 'deadline-overdue';
    if (daysUntilDeadline <= 1) return 'deadline-urgent';
    if (daysUntilDeadline <= 3) return 'deadline-warning';
    return '';
}

function formatDate(dateString) {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Delete a task
function deleteTask(id) {
  fetch("/smarthub/api/delete_task.php?id=" + id)
    .then(() => loadTasks());
}

// Mark a task as done
function markDone(id) {
  fetch("/smarthub/api/mark_done.php?id=" + id)
    .then(() => loadTasks());
}

// Export tasks to XML
function exportXML() {
  window.location.href = "/smarthub/api/export_xml.php";
}

// --- FILE IMPORT HANDLER ---
function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const fileExtension = file.name.split('.').pop().toLowerCase();

  if (fileExtension === 'xml') {
    importXML(event);
  } else if (fileExtension === 'xlsx') {
    const reader = new FileReader();
    reader.onload = function(e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      let tasks = XLSX.utils.sheet_to_json(sheet, { raw: false });

      fetch('/smarthub/api/import_excel_json.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tasks)
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          loadTasks();
        } else {
          showSystemModal(data.message || 'Import failed.');
        }
      })
      .catch(() => showSystemModal('Import failed.'));
    };
    reader.readAsArrayBuffer(file);
  } else {
    showSystemModal('Please upload either an XML or XLSX file');
  }
}

document.getElementById('fileImport').addEventListener('change', handleFileImport);

function importXML(event) {
  const file = event.target.files[0];
  const formData = new FormData();
  formData.append('file', file);

  fetch('/smarthub/api/import_xml.php', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      loadTasks();
    } else {
      showSystemModal(data.message || 'Import failed.');
    }
  })
  .catch(() => showSystemModal('Import failed.'));
}
// --- END FILE IMPORT HANDLER ---

// Export tasks in different formats
function exportTasks(format) {
  switch(format) {
    case 'xml':
      window.location.href = "/smarthub/api/export_xml.php";
      break;
    case 'xlsx':
      exportToExcel();
      break;
    case 'pdf':
      exportToPDF();
      break;
    case 'word':
      exportToWord();
      break;
    default:
      window.location.href = "/smarthub/api/export_xml.php";
  }
}

// Export to Excel (XLSX)
function exportToExcel() {
  fetch("/smarthub/api/get_tasks.php")
    .then(res => res.json())
    .then(data => {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Tasks");
      XLSX.writeFile(wb, "tasks.xlsx");
    });
}

// Export to PDF (requires jsPDF library - add to your head)
function exportToPDF() {
  // You'll need to add jsPDF library to your project
  // <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  fetch("/smarthub/api/get_tasks.php")
    .then(res => res.json())
    .then(data => {
      let y = 20;
      doc.text("Task List", 10, 10);
      
      data.forEach(task => {
        doc.text(`Title: ${task.title}`, 10, y);
        y += 10;
        doc.text(`Description: ${task.description}`, 10, y);
        y += 10;
        doc.text(`Category: ${task.category}`, 10, y);
        y += 10;
        doc.text(`Deadline: ${task.deadline}`, 10, y);
        y += 10;
        doc.text(`Status: ${task.status}`, 10, y);
        y += 15;
        
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      });
      
      doc.save("tasks.pdf");
    });
}

// Export to Word (requires docx library - add to your head)
function exportToWord() {
  // You'll need to add docx library to your project
  // <script src="https://unpkg.com/docx@7.8.1/build/index.js"></script>
  fetch("/smarthub/api/get_tasks.php")
    .then(res => res.json())
    .then(data => {
      const { Document, Paragraph, TextRun, Packer } = docx;
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Task List",
                  bold: true,
                  size: 28
                })
              ]
            }),
            ...data.map(task => new Paragraph({
              children: [
                new TextRun({
                  text: `Title: ${task.title}`,
                  bold: true,
                  break: 1
                }),
                new TextRun({
                  text: `Description: ${task.description}`,
                  break: 1
                }),
                new TextRun({
                  text: `Category: ${task.category}`,
                  break: 1
                }),
                new TextRun({
                  text: `Deadline: ${task.deadline}`,
                  break: 1
                }),
                new TextRun({
                  text: `Status: ${task.status}`,
                  break: 2
                })
              ]
            }))
          ]
        }]
      });
      
      Packer.toBlob(doc).then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'tasks.docx';
        link.click();
        URL.revokeObjectURL(link.href);
      });
    });
}

// Edit Task Modal Logic
window.editTask = function(id, title, deadline, reminder) {
    const modal = document.getElementById('editTaskModal');
    document.getElementById('editTaskId').value = id;
    document.getElementById('editTitle').value = title;
    document.getElementById('editDeadline').value = deadline;
    if (reminder) {
      document.getElementById('editReminder').value = reminder.slice(0, 16); // yyyy-MM-ddTHH:mm
    } else {
      document.getElementById('editReminder').value = '';
    }
    modal.style.display = 'flex';
};

document.getElementById('closeEditModal').onclick = function() {
    document.getElementById('editTaskModal').style.display = 'none';
};

document.getElementById('editTaskForm').onsubmit = async function(e) {
    e.preventDefault();
    const id = document.getElementById('editTaskId').value;
    const title = document.getElementById('editTitle').value;
    const deadline = document.getElementById('editDeadline').value;
    const reminder = document.getElementById('editReminder').value;
    try {
        const formData = new FormData();
        formData.append('id', id);
        formData.append('title', title);
        formData.append('deadline', deadline);
        if (reminder) {
          formData.append('reminder', reminder);
        }
        // You may want to send description/category as well, but only title/deadline/reminder are editable here
        const response = await fetch('/smarthub/api/edit_task.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (result.success) {
            showNotification('Task updated successfully!', 'success');
            document.getElementById('editTaskModal').style.display = 'none';
            loadTasks();
        } else {
            showNotification(result.message || 'Failed to update task', 'error');
        }
    } catch (error) {
        showNotification('Failed to update task', 'error');
    }
};

// Schedule browser notifications for reminders
function scheduleReminders(tasks) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (window._reminderTimeouts) {
    window._reminderTimeouts.forEach(clearTimeout);
  }
  window._reminderTimeouts = [];
  const now = Date.now();
  tasks.forEach(task => {
    if (task.reminder && task.status === 'Pending') {
      const reminderTime = new Date(task.reminder).getTime();
      if (reminderTime > now) {
        const timeout = setTimeout(() => {
          new Notification('Task Reminder', {
            body: `${task.title} is due soon!`,
            icon: '/smarthub/assets/notification-icon.png'
          });
        }, reminderTime - now);
        window._reminderTimeouts.push(timeout);
      }
    }
  });
}

function getUnreadReminderIds(reminders) {
  const readIds = JSON.parse(localStorage.getItem('readReminders') || '[]');
  return reminders.filter(r => !readIds.includes(r.id)).map(r => r.id);
}

function markAllRemindersRead(reminders) {
  const allIds = reminders.map(r => r.id);
  localStorage.setItem('readReminders', JSON.stringify(allIds));
}

function updateRemindersInBell(tasks) {
  const now = Date.now();
  const reminders = tasks.filter(task =>
    task.status === 'Pending' &&
    task.reminder &&
    new Date(task.reminder).getTime() > now
  ).sort((a, b) => new Date(a.reminder) - new Date(b.reminder));

  // Track read/unread
  const readIds = JSON.parse(localStorage.getItem('readReminders') || '[]');
  const unreadReminders = reminders.filter(r => !readIds.includes(r.id));

  // Update badge
  const badge = document.getElementById('notificationBadge');
  if (badge) {
    badge.textContent = unreadReminders.length;
    badge.style.display = unreadReminders.length > 0 ? 'inline-block' : 'none';
  }

  // Update dropdown
  const dropdown = document.getElementById('notificationDropdownList');
  if (dropdown) {
    dropdown.innerHTML = '';
    if (reminders.length === 0) {
      dropdown.innerHTML = '<div class="notification-item">No upcoming reminders.</div>';
    } else {
      reminders.forEach(reminder => {
        const soon = (new Date(reminder.reminder).getTime() - now) < 60 * 60 * 1000; // within 1 hour
        const isUnread = !readIds.includes(reminder.id);
        const div = document.createElement('div');
        div.className = 'notification-item' + (soon ? ' imminent' : '') + (isUnread ? ' unread' : '');
        div.innerHTML = `
          <strong>${escapeHtml(reminder.title)}</strong><br>
          <span>${new Date(reminder.reminder).toLocaleString()}</span>
        `;
        dropdown.appendChild(div);
      });
    }
  }
}

// Mark all as read
const markAllReadBtn = document.getElementById('markAllReadBtn');
if (markAllReadBtn) {
  markAllReadBtn.onclick = function(e) {
    e.stopPropagation();
    // Get all reminders currently in the dropdown
    const reminders = Array.from(document.querySelectorAll('.notification-item'))
      .map(div => div.querySelector('strong')?.textContent)
      .filter(Boolean);
    // Find all task IDs from the loaded tasks
    const allTasks = typeof allPendingTasks !== 'undefined' ? allPendingTasks : [];
    const now = Date.now();
    const allReminders = allTasks.filter(task =>
      task.status === 'Pending' &&
      task.reminder &&
      new Date(task.reminder).getTime() > now
    );
    markAllRemindersRead(allReminders);
    updateRemindersInBell(allTasks);
  };
}

// See all reminders
const seeAllBtn = document.getElementById('seeAllBtn');
if (seeAllBtn) {
  seeAllBtn.onclick = function(e) {
    e.stopPropagation();
    const now = Date.now();
    const allTasks = typeof allPendingTasks !== 'undefined' ? allPendingTasks : [];
    const allReminders = allTasks.filter(task =>
      task.status === 'Pending' &&
      task.reminder &&
      new Date(task.reminder).getTime() > now
    );
    const modal = document.getElementById('reminderModal');
    const modalList = document.getElementById('reminderModalList');
    if (modal && modalList) {
      if (allReminders.length === 0) {
        modalList.innerHTML = '<div class="notification-item">No upcoming reminders.</div>';
      } else {
        modalList.innerHTML = allReminders.map(r =>
          `<div class="notification-item${((new Date(r.reminder).getTime() - now) < 60 * 60 * 1000 ? ' imminent' : '')}">
            <strong>${escapeHtml(r.title)}</strong><br>
            <span>${new Date(r.reminder).toLocaleString()}</span>
          </div>`
        ).join('');
      }
      modal.style.display = 'flex';
    }
  };
}

// Close modal logic
const closeReminderModal = document.getElementById('closeReminderModal');
if (closeReminderModal) {
  closeReminderModal.onclick = function() {
    document.getElementById('reminderModal').style.display = 'none';
  };
}
// Optional: close modal when clicking outside content
const reminderModal = document.getElementById('reminderModal');
if (reminderModal) {
  reminderModal.onclick = function(e) {
    if (e.target === this) this.style.display = 'none';
  };
}

// Notification bell toggle and auto-hide
const bell = document.getElementById('notificationBell');
const dropdown = document.getElementById('notificationDropdown');
if (bell && dropdown) {
  bell.onclick = function(e) {
    e.stopPropagation();
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  };
  document.addEventListener('click', function() {
    dropdown.style.display = 'none';
  });
}

const darkModeToggle = document.getElementById('darkModeToggle');
if (darkModeToggle) {
  // Set initial state from localStorage
  if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    darkModeToggle.textContent = '☀️ Light Mode';
  }
  darkModeToggle.onclick = function() {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
      localStorage.setItem('darkMode', 'enabled');
      darkModeToggle.textContent = '☀️ Light Mode';
    } else {
      localStorage.setItem('darkMode', 'disabled');
      darkModeToggle.textContent = '🌙 Dark Mode';
    }
  };
}

function updateDashboardAnalytics(tasks) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'Done').length;
  const pending = tasks.filter(t => t.status === 'Pending').length;
  // Tasks completed this week
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Sunday
  weekStart.setHours(0,0,0,0);
  const completedThisWeek = tasks.filter(t => {
    if (t.status !== 'Done' || !t.deadline) return false;
    const d = new Date(t.deadline);
    return d >= weekStart && d <= now;
  }).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const analytics = document.getElementById('dashboardAnalytics');
  if (analytics) {
    analytics.innerHTML = `
      <div class="stat">
        <span class="stat-label">Total Tasks</span>
        <span class="stat-value">${total}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Completed Tasks</span>
        <span class="stat-value">${completed}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Completed This Week</span>
        <span class="stat-value">${completedThisWeek}</span>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width:${percent}%;"></div>
        </div>
        <div class="progress-bar-label">${percent}% completed</div>
      </div>
    `;
  }
}

function showSystemModal(message) {
  const modal = document.getElementById('systemModal');
  const body = document.getElementById('systemModalBody');
  if (modal && body) {
    body.innerHTML = message;
    modal.style.display = 'flex';
  }
}
const closeSystemModal = document.getElementById('closeSystemModal');
if (closeSystemModal) {
  closeSystemModal.onclick = function() {
    document.getElementById('systemModal').style.display = 'none';
  };
}
const systemModal = document.getElementById('systemModal');
if (systemModal) {
  systemModal.onclick = function(e) {
    if (e.target === this) this.style.display = 'none';
  };
}

document.addEventListener('dragover', function(e) {
  console.log('Global dragover on', e.target);
});
