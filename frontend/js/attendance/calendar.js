document.addEventListener('DOMContentLoaded', () => {
    // API Configuration
    const API_BASE_URL = API_CONFIG.ENDPOINTS.ATTENDANCE;
    
    // State Management
    const urlParams = new URLSearchParams(window.location.search);
    const subjectId = urlParams.get('subject_id');
    let currentDate = new Date(); // Controls month display
    let attendanceData = [];

    if (!subjectId) {
        window.location.href = 'subjects.html';
        return;
    }

    // Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const calSidebar = document.querySelector('.sidebar');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            if (calSidebar) calSidebar.classList.toggle('collapsed');
        });
    }

    // Auto-collapse sidebar on mobile
    if (calSidebar && window.innerWidth <= 768) {
        calSidebar.classList.add('collapsed');
    }

    // Sidebar close button
    const sidebarCloseBtn = document.querySelector('.sidebar-close-btn');
    if (sidebarCloseBtn && calSidebar) {
        sidebarCloseBtn.addEventListener('click', () => {
            calSidebar.classList.add('collapsed');
        });
    }

    // User Info Header
    const userStr = localStorage.getItem('focusGridUser');
    if (userStr) {
        const user = JSON.parse(userStr);
        const headerName = document.getElementById('headerName');
        const headerUsername = document.getElementById('headerUsername');
        const headerAvatar = document.getElementById('headerAvatar');

        if (headerName) headerName.textContent = user.name || user.username;
        if (headerUsername) headerUsername.textContent = '@' + user.username;
        if (user.name && headerAvatar) {
            const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            headerAvatar.textContent = initials;
        }
    }

    // Fetch Subject Details
    async function fetchSubjectDetails() {
        try {
            const userStr = localStorage.getItem('focusGridUser');
            if (!userStr) return;
            const user = JSON.parse(userStr);
            const response = await fetch(`${API_BASE_URL}/subjects?user_id=${user.id}`);
            const data = await response.json();
            if (data.success) {
                const subject = data.subjects.find(s => s.id == subjectId);
                if (subject) {
                    const subjectTitle = document.getElementById('subjectTitle');
                    const subjectHeaderName = document.getElementById('subjectHeaderName');
                    if (subjectTitle) subjectTitle.textContent = subject.subject_name;
                    if (subjectHeaderName) subjectHeaderName.textContent = subject.subject_name;
                }
            }
        } catch (error) {
            console.error("Error fetching subject details:", error);
        }
    }

    // Fetch Attendance Records
    async function fetchAttendance() {
        try {
            const response = await fetch(`${API_BASE_URL}/attendance/${subjectId}`);
            const data = await response.json();
            if (data.success) {
                attendanceData = data.attendance;
                renderCalendar();
            }
        } catch (error) {
            console.error("Error fetching attendance:", error);
        }
    }

    // Calendar Rendering Logic
    function renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        const display = document.getElementById('monthDisplay');
        
        if (!grid || !display) return;
        
        grid.innerHTML = '';
        
        // Set header display
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

        // Empty cells for first week
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty glass-panel';
            grid.appendChild(empty);
        }

        // Actual days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day glass-panel';
            
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            const dayNum = document.createElement('div');
            dayNum.className = 'day-number';
            dayNum.textContent = day;
            dayEl.appendChild(dayNum);

            // Today marker
            const today = new Date();
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayEl.classList.add('today');
            }

            // Check for attendance record
            const record = attendanceData.find(a => {
                const recDate = new Date(a.class_date);
                return recDate.getDate() === day && recDate.getMonth() === month && recDate.getFullYear() === year;
            });

            if (record) {
                dayEl.classList.add(`status-${record.status}`);

                const badge = document.createElement('div');
                badge.className = 'hours-badge';
                badge.textContent = `${record.hours}h`;
                dayEl.appendChild(badge);
            }

            dayEl.onclick = () => openModal(dateStr, record);
            grid.appendChild(dayEl);
        }

        // Update statistics after calendar is rendered
        updateStatistics();
    }

    // Update Attendance Statistics
    function updateStatistics() {
        const totalClassesEl = document.getElementById('totalClasses');
        const presentClassesEl = document.getElementById('presentClasses');
        const absentClassesEl = document.getElementById('absentClasses');

        // Calculate sum of hours for each status
        const presentClasses = attendanceData
            .filter(a => a.status === 'present')
            .reduce((sum, a) => sum + parseFloat(a.hours), 0);
        
        const absentClasses = attendanceData
            .filter(a => a.status === 'absent')
            .reduce((sum, a) => sum + parseFloat(a.hours), 0);
        
        const totalClasses = presentClasses + absentClasses;

        if (totalClassesEl) totalClassesEl.textContent = totalClasses;
        if (presentClassesEl) presentClassesEl.textContent = presentClasses;
        if (absentClassesEl) absentClassesEl.textContent = absentClasses;
    }

    // Modal Logic
    const modal = document.getElementById('attendanceModal');
    const form = document.getElementById('attendanceForm');
    const closeModal = document.getElementById('closeModal');
    const deleteAttendanceBtn = document.getElementById('deleteAttendanceBtn');

    function openModal(date, record) {
        const selectedDateInput = document.getElementById('selectedDate');
        const modalDateDisplay = document.getElementById('modalDateDisplay');
        const recordIdInput = document.getElementById('recordId');
        const hoursInput = document.getElementById('hours');
        const statusInput = document.getElementById('status');
        const noteInput = document.getElementById('note');

        if (selectedDateInput) selectedDateInput.value = date;
        if (modalDateDisplay) modalDateDisplay.textContent = new Date(date).toLocaleDateString('default', { day: 'numeric', month: 'long', year: 'numeric' });
        
        if (record) {
            if (recordIdInput) recordIdInput.value = record.id;
            if (hoursInput) hoursInput.value = record.hours;
            if (statusInput) statusInput.value = record.status;
            if (noteInput) noteInput.value = record.note || '';
            if (deleteAttendanceBtn) deleteAttendanceBtn.style.display = 'block';
        } else {
            if (form) form.reset();
            if (recordIdInput) recordIdInput.value = '';
            if (deleteAttendanceBtn) deleteAttendanceBtn.style.display = 'none';
            if (hoursInput) hoursInput.value = 1; // default
            if (statusInput) statusInput.value = 'present';
        }
        
        if (modal) modal.style.display = 'flex';
    }

    if (closeModal) {
        closeModal.onclick = () => { if (modal) modal.style.display = 'none'; };
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Hours Input Validation
    const hoursInput = document.getElementById('hours');
    const hoursError = document.getElementById('hoursError');

    if (hoursInput) {
        hoursInput.addEventListener('input', () => {
            const value = parseFloat(hoursInput.value);
            if (value > 8) {
                if (hoursError) {
                    hoursError.textContent = 'You cannot add more than 8 hours';
                    hoursError.style.display = 'block';
                }
            } else {
                if (hoursError) {
                    hoursError.style.display = 'none';
                    hoursError.textContent = '';
                }
            }
        });
    }

    // Save Attendance
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const formError = document.getElementById('attendanceFormError');
            if (formError) {
                formError.classList.remove('show');
                formError.textContent = '';
            }

            const recordIdInput = document.getElementById('recordId');
            const selectedDateInput = document.getElementById('selectedDate');
            const hoursInput = document.getElementById('hours');
            const statusInput = document.getElementById('status');
            const noteInput = document.getElementById('note');

            // Validate hours
            const hours = parseFloat(hoursInput ? hoursInput.value : 0);
            if (hours > 8) {
                if (formError) {
                    formError.textContent = 'You cannot add more than 8 hours';
                    formError.classList.add('show');
                }
                return;
            }

            const id = recordIdInput ? recordIdInput.value : null;
            const data = {
                subject_id: subjectId,
                class_date: selectedDateInput ? selectedDateInput.value : null,
                hours: hoursInput ? hoursInput.value : null,
                status: statusInput ? statusInput.value : null,
                note: noteInput ? noteInput.value : null
            };

            try {
                let response;
                if (id) {
                    response = await fetch(`${API_BASE_URL}/attendance/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                } else {
                    response = await fetch(`${API_BASE_URL}/attendance`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                }

                const result = await response.json();
                if (result.success) {
                    if (modal) modal.style.display = 'none';
                    fetchAttendance();
                } else {
                    if (formError) {
                        formError.textContent = result.message || 'Failed to save attendance';
                        formError.classList.add('show');
                    }
                }
            } catch (error) {
                console.error("Error saving attendance:", error);
                if (formError) {
                    formError.textContent = 'Error communicating with the server';
                    formError.classList.add('show');
                }
            }
        };
    }

    // Delete Attendance
    if (deleteAttendanceBtn) {
        deleteAttendanceBtn.onclick = async () => {
            const recordIdInput = document.getElementById('recordId');
            const id = recordIdInput ? recordIdInput.value : null;
            if (!id || !confirm("Delete this attendance record?")) return;

            try {
                const response = await fetch(`${API_BASE_URL}/attendance/${id}`, { method: 'DELETE' });
                const result = await response.json();
                if (result.success) {
                    if (modal) modal.style.display = 'none';
                    fetchAttendance();
                }
            } catch (error) {
                console.error("Error deleting attendance:", error);
            }
        };
    }

    // Month Navigation
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');

    if (prevMonthBtn) {
        prevMonthBtn.onclick = () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        };
    }

    if (nextMonthBtn) {
        nextMonthBtn.onclick = () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        };
    }

    // Init
    fetchSubjectDetails();
    fetchAttendance();
});
