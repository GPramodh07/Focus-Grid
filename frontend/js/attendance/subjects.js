document.addEventListener('DOMContentLoaded', () => {
    // Sidebar Toggle Logic
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');

    if (sidebarToggle && sidebar) {
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

    // Drag and Drop Logic
    const attendanceList = document.getElementById('attendanceList');

    function attachDragEvents(element) {
        element.addEventListener('dragstart', () => {
            element.classList.add('dragging');
        });

        element.addEventListener('dragend', () => {
            element.classList.remove('dragging');
        });
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.subject-block:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    if (attendanceList) {
        attendanceList.addEventListener('dragover', e => {
            e.preventDefault();
            const afterElement = getDragAfterElement(attendanceList, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (!draggable) return;
            if (afterElement == null) {
                attendanceList.appendChild(draggable);
            } else {
                attendanceList.insertBefore(draggable, afterElement);
            }
        });
    }

    // Check for logged-in user
    const userStr = localStorage.getItem('focusGridUser');
    if (!userStr) {
        window.location.href = '../start/login.html';
        return;
    }
    const user = JSON.parse(userStr);

    // Update header with user info
    const headerName = document.getElementById('headerName');
    const headerUsername = document.getElementById('headerUsername');
    const headerAvatar = document.getElementById('headerAvatar');

    if (headerName) headerName.textContent = user.name || user.username;
    if (headerUsername) headerUsername.textContent = '@' + user.username;
    if (user.name && headerAvatar) {
        const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        headerAvatar.textContent = initials;
    }

    const API_BASE_URL = API_CONFIG.ENDPOINTS.SUBJECTS;

    // Modal Elements
    const subjectModal = document.getElementById('subjectModal');
    const closeSubjectModal = document.getElementById('closeSubjectModal');
    const subjectForm = document.getElementById('subjectForm');
    const subjectNameInput = document.getElementById('subjectName');
    const subjectIdInput = document.getElementById('subjectId');
    const subjectModalTitle = document.getElementById('subjectModalTitle');
    const deleteSubjectBtn = document.getElementById('deleteSubjectBtn');

    // Modal Functions
    function openAddSubjectModal() {
        subjectModalTitle.innerText = "Add New Subject";
        subjectForm.reset();
        subjectIdInput.value = "";
        deleteSubjectBtn.style.display = "none";
        subjectModal.style.display = "flex";
        subjectNameInput.focus();
    }

    function openEditSubjectModal(subjectId, subjectName) {
        subjectModalTitle.innerText = "Edit Subject";
        subjectIdInput.value = subjectId;
        subjectNameInput.value = subjectName;
        deleteSubjectBtn.style.display = "block";
        subjectModal.style.display = "flex";
        subjectNameInput.focus();
    }

    function closeModal() {
        subjectModal.style.display = "none";
        subjectForm.reset();
        clearFormError();
    }

    function showFormError(message) {
        const errorEl = document.getElementById('subjectFormError');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    function clearFormError() {
        const errorEl = document.getElementById('subjectFormError');
        if (errorEl) {
            errorEl.style.display = 'none';
            errorEl.textContent = '';
        }
    }

    function isSubjectNameExists(name, excludeId = null) {
        const blocks = document.querySelectorAll('.subject-block');
        for (const block of blocks) {
            const existingName = block.querySelector('.subject-name')?.textContent || '';
            const blockId = block.dataset.id;
            if (existingName.toLowerCase().trim() === name.toLowerCase().trim()) {
                if (!excludeId || blockId !== excludeId) {
                    return true;
                }
            }
        }
        return false;
    }

    // Modal Event Listeners
    if (closeSubjectModal) {
        closeSubjectModal.addEventListener('click', closeModal);
    }

    window.addEventListener('click', (e) => {
        if (e.target === subjectModal) {
            closeModal();
        }
    });

    // Add, Edit, Delete Logic
    const addSubjectBtn = document.getElementById('addSubjectBtn');

    function attachActionEvents(block) {
        const editBtn = block.querySelector('.edit-btn');
        const deleteBtn = block.querySelector('.delete-btn');
        const nameEl = block.querySelector('.subject-name');
        const subjectId = block.dataset.id;

        if (editBtn) {
            editBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                openEditSubjectModal(subjectId, nameEl.textContent);
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete ${nameEl.textContent}?`)) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}`, {
                            method: 'DELETE'
                        });
                        const data = await response.json();
                        if (data.success) {
                            block.style.opacity = '0';
                            block.style.transform = 'scale(0.95)';
                            setTimeout(() => block.remove(), 200);
                        } else {
                            alert(data.message || 'Failed to delete subject');
                        }
                    } catch (error) {
                        console.error('Error deleting subject:', error);
                        alert('Error communicating with the server');
                    }
                }
            });
        }
    }

    function createSubjectBlock(subject) {
        const block = document.createElement('div');
        block.className = 'subject-block glass-panel';
        block.setAttribute('draggable', 'true');
        block.dataset.id = subject.id; // Assign ID to dataset

        block.innerHTML = `
            <div class="subject-info">
                <span class="drag-handle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                </span>
                <h4 class="subject-name">${subject.subject_name}</h4>
            </div>
            
            <div class="attendance-controls">
                <div class="attendance-circle">
                    <svg viewBox="0 0 36 36" class="circular-chart">
                        <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path class="circle" stroke-dasharray="0, 100" style="stroke: var(--primary);" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <span class="percentage">0%</span>
                </div>
                
                <div class="subject-actions">
                    <button class="action-btn edit-btn" title="Edit Subject">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="action-btn delete-btn" title="Delete Subject">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            </div>
        `;

        // Fetch actual percentage
        fetch(`${API_BASE_URL}/attendance/percentage/${subject.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const percentage = data.percentage;
                    const circle = block.querySelector('.circle');
                    const percentageText = block.querySelector('.percentage');
                    
                    let color = 'var(--primary)';
                    if (percentage >= 90) {
                        color = '#10b981';
                    } else if (percentage < 75 && percentage >= 65) {
                        color = '#f59e0b';
                    } else if (percentage < 65 && percentage > 0) {
                        color = '#ef4444';
                    }

                    circle.style.strokeDasharray = `${percentage}, 100`;
                    circle.style.stroke = color;
                    percentageText.textContent = `${percentage}%`;
                }
            })
            .catch(err => console.error("Error fetching percentage:", err));

        // Click event for the whole block to open calendar
        block.addEventListener('click', () => {
            window.location.href = `calendar.html?subject_id=${subject.id}`;
        });

        attachDragEvents(block);
        attachActionEvents(block, subject);

        return block;
    }

    async function loadSubjects() {
        try {
            const response = await fetch(`${API_BASE_URL}/subjects?user_id=${user.id}`);
            const data = await response.json();

            if (data.success) {
                attendanceList.innerHTML = ''; // clear existing
                data.subjects.forEach(subject => {
                    const block = createSubjectBlock(subject);
                    attendanceList.appendChild(block);
                });
            } else {
                console.error("Failed to fetch subjects:", data.message);
            }
        } catch (error) {
            console.error("Error fetching subjects:", error);
        }
    }

    if (addSubjectBtn) {
        addSubjectBtn.addEventListener('click', openAddSubjectModal);
    }

    // Form Submission Handler
    if (subjectForm) {
        subjectForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const subjectId = subjectIdInput.value;
            const subjectName = subjectNameInput.value.trim();

            // Clear previous errors
            clearFormError();

            // Validation: Empty name
            if (!subjectName) {
                showFormError("Subject name cannot be empty");
                subjectNameInput.focus();
                return;
            }

            // Validation: Duplicate name (only check for new subjects or if name changed)
            if (isSubjectNameExists(subjectName, subjectId)) {
                showFormError("This subject name already exists");
                subjectNameInput.focus();
                return;
            }

            try {
                const isEdit = !!subjectId;
                const method = isEdit ? 'PUT' : 'POST';
                const endpoint = isEdit ? `${API_BASE_URL}/subjects/${subjectId}` : `${API_BASE_URL}/subjects`;
                const payload = isEdit 
                    ? { subject_name: subjectName }
                    : { user_id: user.id, subject_name: subjectName };

                const response = await fetch(endpoint, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (data.success) {
                    if (isEdit) {
                        // Update existing subject
                        const block = document.querySelector(`[data-id="${subjectId}"]`);
                        if (block) {
                            block.querySelector('.subject-name').textContent = subjectName;
                        }
                    } else {
                        // Add new subject
                        const newSubject = {
                            id: data.id,
                            subject_name: data.subject_name
                        };
                        const block = createSubjectBlock(newSubject);
                        attendanceList.appendChild(block);

                        // Fade in animation
                        block.style.opacity = '0';
                        block.style.transform = 'translateY(10px)';
                        setTimeout(() => {
                            block.style.transition = 'all 0.3s ease';
                            block.style.opacity = '1';
                            block.style.transform = 'translateY(0)';
                        }, 10);
                    }
                    closeModal();
                } else {
                    showFormError(data.message || 'Failed to save subject');
                }
            } catch (error) {
                console.error('Error saving subject:', error);
                showFormError('Error communicating with the server');
            }
        });
    }

    // Delete Button Handler in Modal
    if (deleteSubjectBtn) {
        deleteSubjectBtn.addEventListener('click', async () => {
            const subjectId = subjectIdInput.value;
            if (!subjectId) return;

            if (confirm("Are you sure you want to delete this subject?")) {
                try {
                    const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}`, {
                        method: 'DELETE'
                    });
                    const data = await response.json();
                    
                    if (data.success) {
                        const block = document.querySelector(`[data-id="${subjectId}"]`);
                        if (block) {
                            block.style.opacity = '0';
                            block.style.transform = 'scale(0.95)';
                            setTimeout(() => block.remove(), 200);
                        }
                        closeModal();
                    } else {
                        showFormError(data.message || 'Failed to delete subject');
                    }
                } catch (error) {
                    console.error('Error deleting subject:', error);
                    showFormError('Error communicating with the server');
                }
            }
        });
    }

    // Initialize
    document.querySelectorAll('.subject-block').forEach(attachDragEvents);
    loadSubjects();
});
