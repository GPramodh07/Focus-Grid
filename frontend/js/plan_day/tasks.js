/* frontend/js/plan_day/tasks.js */

document.addEventListener('DOMContentLoaded', () => {

    // 1. Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Auto-collapse sidebar on mobile
    if (sidebar && window.innerWidth <= 768) {
        sidebar.classList.add('collapsed');
    }

    // Sidebar close button
    const sidebarCloseBtn = document.querySelector('.sidebar-close-btn');
    if (sidebarCloseBtn && sidebar) {
        sidebarCloseBtn.addEventListener('click', () => {
            sidebar.classList.add('collapsed');
        });
    }

    // Navigate to Routines page
    const routineBtn = document.getElementById('routineBtn');
    if (routineBtn) {
        routineBtn.addEventListener('click', () => {
            window.location.href = 'routines.html';
        });
    }

    // 2. User Info Setup
    const userStr = localStorage.getItem('focusGridUser');
    let userId = null;
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            userId = user.id;
            const headerName = document.getElementById('headerName');
            const headerUsername = document.getElementById('headerUsername');
            const headerAvatar = document.getElementById('headerAvatar');

            if (headerName) headerName.textContent = user.name || user.username;
            if (headerUsername) headerUsername.textContent = '@' + user.username;
            if (user.name && headerAvatar) {
                const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                headerAvatar.textContent = initials;
            }
        } catch (e) {
            console.error("Error parsing user data", e);
        }
    }
    
    // Fallback logic, should come from login usually
    if (!userId) {
       userId = localStorage.getItem('user_id') || 1; // Default fallback for dev
    }

    // Point to backend server on port 5000
    const API_URL = "http://localhost:5000/api/tasks";

    // Keep date handling in plain YYYY-MM-DD to avoid timezone shifts.
    function getLocalDateString(dateObj = new Date()) {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function normalizeTaskDate(rawDate) {
        if (!rawDate) return "";
        if (typeof rawDate === 'string') return rawDate.split('T')[0];
        if (rawDate instanceof Date) return getLocalDateString(rawDate);
        return String(rawDate).split('T')[0];
    }

    function parseLocalDate(dateStr) {
        const normalized = normalizeTaskDate(dateStr);
        const [year, month, day] = normalized.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    function refreshSelectedDay(delayMs = 100) {
        if (!selectedDateStr) return;
        setTimeout(() => fetchAndOpenDayTasks(selectedDateStr), delayMs);
    }

    // 3. Calendar State
    let currentDate = new Date();
    let selectedDateStr = "";

    // 4. Modals & Forms Elements
    const taskModal = document.getElementById('taskModal');
    const taskFormModal = document.getElementById('taskFormModal');
    const closeTaskModal = document.getElementById('closeTaskModal');
    const closeTaskFormModal = document.getElementById('closeTaskFormModal');
    const taskForm = document.getElementById('taskForm');
    const modalDateDisplay = document.getElementById('modalDateDisplay');
    const taskListUI = document.getElementById('taskListUI');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const modalAddTaskBtn = document.getElementById('modalAddTaskBtn');
    const deleteTaskBtn = document.getElementById('deleteTaskBtn');


    // 5. Fetch Tasks & Render
    async function loadTasks() {
        let tasks = [];
        try {
            const response = await fetch(`${API_URL}?user_id=${userId}`);
            const data = await response.json();
            if (data.success) {
                tasks = data.tasks;
            } else {
                console.error("Failed to load tasks", data.error);
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
        
        // ALWAYS render calendar, even if fetch fails or returns 0 tasks
        renderCalendar(tasks);
    }
    
    // 6. Calendar Rendering
    function renderCalendar(tasks) {
        const grid = document.getElementById('calendarGrid');
        const display = document.getElementById('monthDisplay');

        if (!grid || !display) return;
        grid.innerHTML = '';

        // Headers
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(name => {
            const el = document.createElement('div');
            el.className = 'day-name';
            el.textContent = name;
            grid.appendChild(el);
        });

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        display.textContent = currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });

        // Group fetched tasks by date
        const tasksByDate = {};
        if (tasks && tasks.length) {
            tasks.forEach(t => {
                const dateKey = normalizeTaskDate(t.task_date);
                if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
                tasksByDate[dateKey].push(t);
            });
        }

        // Empty cells for alignment
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            grid.appendChild(empty);
        }

        // Actual day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day window-effect';

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            const dayNum = document.createElement('div');
            dayNum.className = 'day-number';
            dayNum.textContent = day;
            dayEl.appendChild(dayNum);

            const realToday = new Date();
            if (day === realToday.getDate() && month === realToday.getMonth() && year === realToday.getFullYear()) {
                dayEl.classList.add('today');
            }

            const tasksForDay = tasksByDate[dateStr] || [];
            
            if (tasksForDay.length > 0) {
                const badge = document.createElement('div');
                badge.className = 'task-badge';
                badge.textContent = `${tasksForDay.length} Tasks`;
                // Add minor specific styling based on counts
                badge.style.background = 'rgba(74, 144, 226, 0.2)';
                badge.style.padding = '2px 6px';
                badge.style.borderRadius = '4px';
                badge.style.fontSize = '0.75rem';
                badge.style.marginTop = '4px';
                dayEl.appendChild(badge);

                const previewList = document.createElement('div');
                previewList.className = 'task-list-preview';
                
                const maxPreviews = Math.min(tasksForDay.length, 2);
                for(let i = 0; i < maxPreviews; i++) {
                    const dot = document.createElement('div');
                    dot.className = 'task-dot';
                    dot.textContent = tasksForDay[i].title;
                    previewList.appendChild(dot);
                }
                if(tasksForDay.length > 2) {
                     const more = document.createElement('div');
                     more.className = 'task-dot';
                     more.style.color = "rgba(255,255,255,0.5)";
                     more.textContent = `+${tasksForDay.length - 2} more`;
                     previewList.appendChild(more);
                }
                dayEl.appendChild(previewList);
            }

            // Still clickable even if no tasks
            dayEl.onclick = () => fetchAndOpenDayTasks(dateStr);
            grid.appendChild(dayEl);
        }
    }

    // 7. Load Tasks for Specific Day
    async function fetchAndOpenDayTasks(dateStr) {
        selectedDateStr = dateStr;
        const dateObj = parseLocalDate(dateStr);
        if (modalDateDisplay) {
            modalDateDisplay.textContent = dateObj.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' });
        }

        try {
            const response = await fetch(`${API_URL}/${dateStr}?user_id=${userId}`);
            const data = await response.json();
            
            if (taskListUI) {
                taskListUI.innerHTML = '';
                if (!data.success || !data.tasks || data.tasks.length === 0) {
                    taskListUI.innerHTML = `
                        <div class="task-empty-state">
                            <div class="task-empty-state-icon">📝</div>
                            <p>No tasks for this day</p>
                        </div>
                    `;
                    updateTaskCount(0);
                } else {
                    updateTaskCount(data.tasks.length);
                    data.tasks.forEach(task => {
                        const taskCard = createTaskCard(task);
                        taskListUI.appendChild(taskCard);
                    });
                }
            }
            if (taskModal) taskModal.style.display = 'flex';
        } catch (error) {
            console.error("Error fetching daily tasks:", error);
            if(taskListUI) taskListUI.innerHTML = `<p style="color: red; text-align: center; padding: 20px;">Error loading tasks.</p>`;
            if(taskModal) taskModal.style.display = 'flex';
        }
    }

    // Helper function to create task card
    function createTaskCard(task) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.setAttribute('data-task-id-card', task.id);
        
        // Format time display
        let displayTime = '';
        if(task.start_time && task.end_time) {
            displayTime = `${task.start_time.substring(0, 5)} - ${task.end_time.substring(0, 5)}`;
        } else if(task.start_time) {
            displayTime = task.start_time.substring(0, 5);
        }
        
        const timeClass = !task.start_time ? 'all-day' : '';
        const isCompleted = task.status === 'completed';
        
        // Build the card HTML with checkbox on the left
        card.innerHTML = `
            <div class="task-card-checkbox-wrapper">
                <input type="checkbox" class="task-checkbox" data-task-id="${task.id}" ${isCompleted ? 'checked' : ''} />
            </div>
            <div class="task-card-content">
                <h4 class="task-card-title ${isCompleted ? 'completed' : ''}">
                    ${escapeHtml(task.title)}
                </h4>
                ${displayTime ? `<span class="task-card-time ${timeClass}">${displayTime}</span>` : ''}
                ${task.description ? `<p class="task-card-description">${escapeHtml(task.description)}</p>` : ''}
            </div>
            <div class="task-card-actions">
                <button class="task-btn task-btn-edit" data-task-id="${task.id}" data-action="edit" title="Edit">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="task-btn task-btn-delete" data-task-id="${task.id}" data-action="delete" title="Delete">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
        `;
        
        // Add event listeners
        const checkbox = card.querySelector('.task-checkbox');
        const editBtn = card.querySelector('[data-action="edit"]');
        const deleteBtn = card.querySelector('[data-action="delete"]');
        
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            toggleTaskStatus(task.id, checkbox.checked);
        });
        
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditTask(task);
        });
        
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if(confirm("Confirm deletion of this task?")) {
                deleteTaskAction(task.id);
            }
        });
        
        return card;
    }

    // Helper to escape HTML
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // Helper to update task count display
    function updateTaskCount(count) {
        const taskCountDisplay = document.getElementById('taskCountDisplay');
        if (taskCountDisplay) {
            taskCountDisplay.textContent = `${count} ${count === 1 ? 'task' : 'tasks'}`;
        }
    }

    // Helper for delete action
    async function deleteTaskAction(taskId) {
        try {
            const res = await fetch(`${API_URL}/${taskId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });
            const data = await res.json();
            if(data.success) {
                await loadTasks();
                refreshSelectedDay();
            } else {
                alert("Delete failed: " + data.error);
            }
        } catch(err) {
            console.error("Delete error:", err);
            alert("Error deleting task");
        }
    }

    // Helper to toggle task status (mark complete/incomplete)
    async function toggleTaskStatus(taskId, isChecked) {
        const newStatus = isChecked ? 'completed' : 'pending';
        
        try {
            // Immediately update UI - find the task card and update it visually
            const taskCard = document.querySelector(`[data-task-id-card="${taskId}"]`);
            if (taskCard) {
                const titleEl = taskCard.querySelector('.task-card-title');
                const checkbox = taskCard.querySelector('.task-checkbox');
                
                if (isChecked) {
                    titleEl.classList.add('completed');
                    checkbox.checked = true;
                } else {
                    titleEl.classList.remove('completed');
                    checkbox.checked = false;
                }
            }
            
            // Update database in background (don't wait for response, don't reload UI)
            // Fetch current task data to get all required fields
            const allResponse = await fetch(`${API_URL}?user_id=${userId}`);
            const allData = await allResponse.json();
            
            if (!allData.success) {
                throw new Error("Failed to fetch tasks");
            }
            
            // Find the specific task
            const currentTask = allData.tasks.find(t => t.id == taskId);
            if (!currentTask) {
                throw new Error("Task not found");
            }
            
            // Send all required fields with updated status
            const updatePayload = {
                user_id: userId,
                title: currentTask.title,
                description: currentTask.description || "",
                task_date: normalizeTaskDate(currentTask.task_date),
                start_time: currentTask.start_time || null,
                end_time: currentTask.end_time || null,
                status: newStatus
            };
            
            // Fire and forget - update database without blocking UI
            fetch(`${API_URL}/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload)
            }).then(res => res.json()).then(data => {
                if(!data.success) {
                    console.error("Status update failed:", data.error);
                }
            }).catch(err => {
                console.error("Background status update error:", err);
            });
            
        } catch(err) {
            console.error("Status update error:", err);
            alert("Error updating task status: " + err.message);
        }
    }


    // 8. Modals UI
    function openAddTask(datePrefill = "") {
        document.getElementById('formModalTitle').innerText = "Add Task";
        if(taskForm) taskForm.reset();
        document.getElementById('taskId').value = "";
        
        const statusGroup = document.getElementById('statusGroup');
        if (statusGroup) statusGroup.style.display = "none";
        
        if (deleteTaskBtn) deleteTaskBtn.style.display = "none";
        
        if (datePrefill) {
            document.getElementById('taskDate').value = datePrefill;
        } else {
            // Default to today in local timezone (no UTC conversion)
            document.getElementById('taskDate').value = getLocalDateString();
        }
        
        if (taskFormModal) taskFormModal.style.display = "flex";
    }

    function openEditTask(task) {
        document.getElementById('formModalTitle').innerText = "Edit Task";
        document.getElementById('taskId').value = task.id;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDesc').value = task.description || "";
        
        // Ensure date formatting is YYYY-MM-DD
        const dateVal = normalizeTaskDate(task.task_date);
        document.getElementById('taskDate').value = dateVal;
        
        document.getElementById('taskStart').value = task.start_time || "";
        document.getElementById('taskEnd').value = task.end_time || "";
        document.getElementById('taskStatus').value = task.status || 'pending';
        
        const statusGroup = document.getElementById('statusGroup');
        if(statusGroup) statusGroup.style.display = "block";
        if(deleteTaskBtn) deleteTaskBtn.style.display = "block"; 
        
        if(taskModal) taskModal.style.display = "none"; 
        if(taskFormModal) taskFormModal.style.display = "flex";
    }

    // 9. Database CRUD Handlers
    
    // Save/Update Submit Form
    if(taskForm) {
        taskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const taskId = document.getElementById('taskId').value;
            
            const payload = {
                user_id: userId,
                title: document.getElementById('taskTitle').value,
                description: document.getElementById('taskDesc').value,
                task_date: document.getElementById('taskDate').value,
                start_time: document.getElementById('taskStart').value,
                end_time: document.getElementById('taskEnd').value,
                status: document.getElementById('taskStatus').value || 'pending'
            };

            // Validate required fields
            if (!payload.title || !payload.title.trim()) {
                alert("Task title is required");
                return;
            }
            if (!payload.task_date) {
                alert("Task date is required");
                return;
            }

            // Fix empty times sending string issues
            if(!payload.start_time) payload.start_time = null;
            if(!payload.end_time) payload.end_time = null;

            const method = taskId ? 'PUT' : 'POST';
            const endpoint = taskId ? `${API_URL}/${taskId}` : API_URL;

            try {
                const res = await fetch(endpoint, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();

                if(data.success) {
                    taskFormModal.style.display = "none";
                    await loadTasks(); // Refresh calendar completely

                    // If we were inside the day view, optionally reopen it updated
                    if (selectedDateStr === payload.task_date) {
                        refreshSelectedDay();
                    }
                } else {
                    const errorMsg = data.error || "Unknown error";
                    console.error(`[TASK] Save failed:`, errorMsg);
                    alert("Error saving task: " + errorMsg);
                }
            } catch (err) {
                console.error("[TASK] Save Error:", err);
                alert("Network error while saving task: " + err.message);
            }
        });
    }

    // Delete Task Handler
    if(deleteTaskBtn) {
        deleteTaskBtn.addEventListener('click', async () => {
            const taskId = document.getElementById('taskId').value;
            if(!taskId) return;
            
            if(confirm("Confirm deletion of this task?")) {
                try {
                    const res = await fetch(`${API_URL}/${taskId}?user_id=${userId}`, {
                        method: 'DELETE'
                    });
                    const data = await res.json();
                    if(data.success) {
                        taskFormModal.style.display = "none";
                        await loadTasks();

                        refreshSelectedDay();
                    } else {
                        alert("Delete failed: " + data.error);
                    }
                } catch(err) {
                    console.error("Delete error:", err);
                }
            }
        });
    }

    // 10. Nav & Modals Toggles Listeners
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');

    if (prevBtn) {
        prevBtn.onclick = () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            loadTasks();
        };
    }
    if (nextBtn) {
        nextBtn.onclick = () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            loadTasks();
        };
    }
    if (addTaskBtn) {
        addTaskBtn.onclick = () => openAddTask();
    }
    if (routineBtn) {
        routineBtn.onclick = () => {
            window.location.href = 'routines.html';
        };
    }
    if (modalAddTaskBtn) {
        modalAddTaskBtn.onclick = () => {
            if (taskModal) taskModal.style.display = 'none';
            openAddTask(selectedDateStr);
        };
    }
    if (closeTaskModal) {
        closeTaskModal.onclick = () => {
            if (taskModal) taskModal.style.display = 'none';
        }
    }
    if (closeTaskFormModal) {
        closeTaskFormModal.onclick = () => {
            if (taskFormModal) taskFormModal.style.display = 'none';
        }
    }

    window.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            taskModal.style.display = 'none';
        }
        if (e.target === taskFormModal) {
            taskFormModal.style.display = 'none';
        }
    });

    // 11. Initial Startup Load
    loadTasks();
});

