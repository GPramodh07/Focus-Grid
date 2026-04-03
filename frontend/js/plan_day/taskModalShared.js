(function () {
    function getLocalDateString(dateObj) {
        const date = dateObj || new Date();
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function normalizeTaskDate(rawDate) {
        if (!rawDate) return '';
        if (typeof rawDate === 'string') return rawDate.split('T')[0];
        if (rawDate instanceof Date) return getLocalDateString(rawDate);
        return String(rawDate).split('T')[0];
    }

    function initTaskModal(config) {
        const settings = Object.assign({
            userId: null,
            apiUrl: API_CONFIG.ENDPOINTS.TASKS,
            openTriggerSelector: '#addTaskBtn',
            onTaskSaved: null,
            onTaskDeleted: null
        }, config || {});

        const taskFormModal = document.getElementById('taskFormModal');
        const closeTaskFormModal = document.getElementById('closeTaskFormModal');
        const taskForm = document.getElementById('taskForm');
        const deleteTaskBtn = document.getElementById('deleteTaskBtn');
        const taskModal = document.getElementById('taskModal');

        if (!taskFormModal || !taskForm) {
            return {
                openAddTask: function () {},
                openEditTask: function () {}
            };
        }

        function openAddTask(datePrefill) {
            const formTitle = document.getElementById('formModalTitle');
            const taskIdInput = document.getElementById('taskId');
            const taskDateInput = document.getElementById('taskDate');
            const statusGroup = document.getElementById('statusGroup');

            if (formTitle) formTitle.innerText = 'Add Task';
            taskForm.reset();
            if (taskIdInput) taskIdInput.value = '';
            if (statusGroup) statusGroup.style.display = 'none';
            if (deleteTaskBtn) deleteTaskBtn.style.display = 'none';

            if (taskDateInput) {
                taskDateInput.value = datePrefill || getLocalDateString();
            }

            taskFormModal.style.display = 'flex';
        }

        function openEditTask(task) {
            const formTitle = document.getElementById('formModalTitle');
            const taskIdInput = document.getElementById('taskId');
            const taskTitleInput = document.getElementById('taskTitle');
            const taskDescInput = document.getElementById('taskDesc');
            const taskDateInput = document.getElementById('taskDate');
            const taskStartInput = document.getElementById('taskStart');
            const taskEndInput = document.getElementById('taskEnd');
            const taskStatusInput = document.getElementById('taskStatus');
            const statusGroup = document.getElementById('statusGroup');

            if (formTitle) formTitle.innerText = 'Edit Task';
            if (taskIdInput) taskIdInput.value = task.id || '';
            if (taskTitleInput) taskTitleInput.value = task.title || '';
            if (taskDescInput) taskDescInput.value = task.description || '';
            if (taskDateInput) taskDateInput.value = normalizeTaskDate(task.task_date);
            if (taskStartInput) taskStartInput.value = task.start_time || '';
            if (taskEndInput) taskEndInput.value = task.end_time || '';
            if (taskStatusInput) taskStatusInput.value = task.status || 'pending';
            if (statusGroup) statusGroup.style.display = 'block';
            if (deleteTaskBtn) deleteTaskBtn.style.display = 'block';

            if (taskModal) taskModal.style.display = 'none';
            taskFormModal.style.display = 'flex';
        }

        if (!taskForm.dataset.modalBound) {
            taskForm.dataset.modalBound = 'true';
            taskForm.addEventListener('submit', async function (e) {
                e.preventDefault();

                const taskId = document.getElementById('taskId').value;
                const payload = {
                    user_id: settings.userId,
                    title: document.getElementById('taskTitle').value,
                    description: document.getElementById('taskDesc').value,
                    task_date: document.getElementById('taskDate').value,
                    start_time: document.getElementById('taskStart').value,
                    end_time: document.getElementById('taskEnd').value,
                    status: (document.getElementById('taskStatus').value || 'pending')
                };

                if (!payload.title || !payload.title.trim()) {
                    alert('Task title is required');
                    return;
                }

                if (!payload.task_date) {
                    alert('Task date is required');
                    return;
                }

                if (!payload.start_time) payload.start_time = null;
                if (!payload.end_time) payload.end_time = null;

                const method = taskId ? 'PUT' : 'POST';
                const endpoint = taskId ? `${settings.apiUrl}/${taskId}` : settings.apiUrl;

                try {
                    const res = await fetch(endpoint, {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    const data = await res.json();
                    if (!data.success) {
                        const errorMsg = data.error || 'Unknown error';
                        alert('Error saving task: ' + errorMsg);
                        return;
                    }

                    taskFormModal.style.display = 'none';
                    if (typeof settings.onTaskSaved === 'function') {
                        settings.onTaskSaved(payload, taskId);
                    }
                } catch (err) {
                    alert('Network error while saving task: ' + err.message);
                }
            });
        }

        if (deleteTaskBtn && !deleteTaskBtn.dataset.modalBound) {
            deleteTaskBtn.dataset.modalBound = 'true';
            deleteTaskBtn.addEventListener('click', async function () {
                const taskId = document.getElementById('taskId').value;
                if (!taskId) return;

                if (!confirm('Confirm deletion of this task?')) return;

                try {
                    const res = await fetch(`${settings.apiUrl}/${taskId}?user_id=${encodeURIComponent(settings.userId)}`, {
                        method: 'DELETE'
                    });
                    const data = await res.json();

                    if (!data.success) {
                        alert('Delete failed: ' + (data.error || 'Unknown error'));
                        return;
                    }

                    taskFormModal.style.display = 'none';
                    if (typeof settings.onTaskDeleted === 'function') {
                        settings.onTaskDeleted(taskId);
                    }
                } catch (err) {
                    alert('Error deleting task');
                }
            });
        }

        if (closeTaskFormModal && !closeTaskFormModal.dataset.modalBound) {
            closeTaskFormModal.dataset.modalBound = 'true';
            closeTaskFormModal.addEventListener('click', function () {
                taskFormModal.style.display = 'none';
            });
        }

        const openTrigger = document.querySelector(settings.openTriggerSelector);
        if (openTrigger && !openTrigger.dataset.modalBound) {
            openTrigger.dataset.modalBound = 'true';
            openTrigger.addEventListener('click', function () {
                openAddTask();
            });
        }

        if (!window.__focusGridTaskModalOverlayBound) {
            window.__focusGridTaskModalOverlayBound = true;
            window.addEventListener('click', function (e) {
                if (taskFormModal && e.target === taskFormModal) {
                    taskFormModal.style.display = 'none';
                }
            });
        }

        return {
            openAddTask,
            openEditTask
        };
    }

    window.FocusGridTaskModal = {
        init: initTaskModal
    };
})();
