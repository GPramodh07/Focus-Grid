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
				const initials = user.name
					.split(' ')
					.map(part => part[0])
					.join('')
					.substring(0, 2)
					.toUpperCase();
				headerAvatar.textContent = initials;
			}
		} catch (error) {
			console.error('Error parsing user data:', error);
		}
	}

	// Fallback for user_id
	if (!userId) {
		console.warn('Missing user session. Redirecting to login.');
		if (window.FocusGridAuth && typeof window.FocusGridAuth.clearSession === 'function') {
			window.FocusGridAuth.clearSession();
		}
		if (window.FocusGridAuth && typeof window.FocusGridAuth.redirectToLogin === 'function') {
			window.FocusGridAuth.redirectToLogin();
		} else {
			window.location.href = '../start/login.html';
		}
		return;
	}

	// API endpoint
	const API_URL = API_CONFIG.ENDPOINTS.TIMETABLE;
	const TIMETABLE_START_HOUR = 8;
	const TIMETABLE_END_HOUR = 18;
	const SLOT_COUNT = TIMETABLE_END_HOUR - TIMETABLE_START_HOUR;
	const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	const timetableGrid = document.querySelector('.timetable-grid');
	const addClassModal = document.getElementById('addClassModal');
	const addClassForm = document.getElementById('addClassForm');
	const closeAddClassModal = document.getElementById('closeAddClassModal');
	const cancelAddClassBtn = document.getElementById('cancelAddClassBtn');
	const saveClassBtn = document.getElementById('saveClassBtn');
	const classFormError = document.getElementById('classFormError');
	const classTitleInput = document.getElementById('classTitle');
	const classStartTimeInput = document.getElementById('classStartTime');
	const classEndTimeInput = document.getElementById('classEndTime');
	const classDayInput = document.getElementById('classDay');
	const classTypeInput = document.getElementById('classType');
	const classColorInput = document.getElementById('classColor');
	const editTimeTableBtn = document.getElementById('editTimeTableBtn');
	const modalHeaderTitle = addClassModal ? addClassModal.querySelector('.modal-header h3') : null;

	let isEditMode = false;
	let currentRecords = [];
	let editingClassId = null;

	function showClassFormError(message) {
		if (!classFormError) return;
		classFormError.textContent = message;
		classFormError.classList.add('show');
	}

	function clearClassFormError() {
		if (!classFormError) return;
		classFormError.textContent = '';
		classFormError.classList.remove('show');
	}

	function setSelectedColor(colorValue) {
		const colorOptions = document.querySelectorAll('.color-option');
		const normalizedColor = isHexColor(colorValue) ? colorValue.trim().toLowerCase() : '';
		let matched = false;

		colorOptions.forEach((option) => {
			const optionColor = (option.dataset.color || '').trim().toLowerCase();
			const isSelected = normalizedColor && optionColor === normalizedColor;
			option.classList.toggle('selected', isSelected);
			if (isSelected) matched = true;
		});

		if (!matched && colorOptions.length > 0) {
			colorOptions[0].classList.add('selected');
			if (classColorInput) classColorInput.value = colorOptions[0].dataset.color;
			return;
		}

		if (classColorInput && matched) {
			classColorInput.value = normalizedColor;
		}
	}

	function setModalMode(isEditing) {
		if (modalHeaderTitle) {
			modalHeaderTitle.textContent = isEditing ? 'Edit Class' : 'Add Class';
		}
		if (saveClassBtn) {
			saveClassBtn.textContent = isEditing ? 'Update' : 'Save';
		}
	}

	function openModal() {
		if (!addClassModal) return;
		clearClassFormError();
		setModalMode(Boolean(editingClassId));
		addClassModal.style.display = 'flex';
	}

	function closeModal() {
		if (!addClassModal) return;
		addClassModal.style.display = 'none';
		if (addClassForm) addClassForm.reset();
		editingClassId = null;
		setModalMode(false);
		clearClassFormError();
		// Reset color selection when modal closes
		setSelectedColor(classColorInput && classColorInput.value ? classColorInput.value : '#8B5CF6');
	}

	// Color Picker Setup
	function initializeColorPicker() {
		const colorOptions = document.querySelectorAll('.color-option');
		
		colorOptions.forEach(option => {
			option.addEventListener('click', () => {
				// Remove previous selection
				colorOptions.forEach(opt => opt.classList.remove('selected'));
				// Add selection to clicked option
				option.classList.add('selected');
				// Store color value
				if (classColorInput) {
					classColorInput.value = option.dataset.color;
				}
			});
		});

		// Set default color on page load
		if (colorOptions.length > 0 && classColorInput) {
			colorOptions[0].classList.add('selected');
			classColorInput.value = colorOptions[0].dataset.color;
		}
	}

	function isHexColor(value) {
		if (typeof value !== 'string') return false;
		return /^#[0-9a-fA-F]{6}$/.test(value.trim());
	}

	function escapeHtml(value) {
		return String(value ?? '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	// Initialize color picker when DOM is ready
	initializeColorPicker();

	if (classTitleInput) classTitleInput.addEventListener('input', clearClassFormError);
	if (classStartTimeInput) classStartTimeInput.addEventListener('input', clearClassFormError);
	if (classEndTimeInput) classEndTimeInput.addEventListener('input', clearClassFormError);
	if (classDayInput) classDayInput.addEventListener('change', clearClassFormError);
	if (classTypeInput) classTypeInput.addEventListener('change', clearClassFormError);
	if (classColorInput) classColorInput.addEventListener('change', clearClassFormError);

	function timeToMinutes(timeString) {
		if (!timeString || typeof timeString !== 'string') return null;
		const [h, m] = timeString.split(':').map(Number);
		if (Number.isNaN(h) || Number.isNaN(m)) return null;
		return h * 60 + m;
	}

	function getSlotElement(day, slotIndex) {
		if (!timetableGrid) return null;
		const dayIndex = DAY_ORDER.indexOf(day);
		if (dayIndex < 0 || slotIndex < 0 || slotIndex >= SLOT_COUNT) return null;

		const base = 11 + dayIndex * 11;
		return timetableGrid.children[base + 1 + slotIndex] || null;
	}

	function clearRenderedClasses() {
		if (!timetableGrid) return;
		const slots = timetableGrid.querySelectorAll('.time-slot');
		slots.forEach((slot) => {
			slot.innerHTML = '';
			slot.classList.remove('break-slot');
		});
	}

	function classStyleByType(type) {
		if (type === 'break') return 'class-break';
		return 'class-math';
	}

	function renderRecords(records) {
		clearRenderedClasses();

		if (!Array.isArray(records)) return;

		records.forEach((record) => {
			const day = record.day;
			const type = (record.type || 'class').toLowerCase();
			const title = type === 'break' ? 'Break' : (record.title || 'Class');
			const bgColor = isHexColor(record.color) ? record.color.trim() : '#4CAF50';
			const startMinutes = timeToMinutes(record.start_time);
			const endMinutes = timeToMinutes(record.end_time);

			if (!day || startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
				return;
			}

			const minStart = TIMETABLE_START_HOUR * 60;
			const minEnd = TIMETABLE_END_HOUR * 60;
			const clampedStart = Math.max(startMinutes, minStart);
			const clampedEnd = Math.min(endMinutes, minEnd);

			if (clampedEnd <= clampedStart) {
				return;
			}

			const startSlot = Math.max(0, Math.floor((clampedStart - minStart) / 60));
			const endSlot = Math.min(SLOT_COUNT, Math.ceil((clampedEnd - minStart) / 60));

			for (let i = startSlot; i < endSlot; i++) {
				const slotEl = getSlotElement(day, i);
				if (!slotEl) continue;

				slotEl.classList.toggle('break-slot', type === 'break');
				if (slotEl.innerHTML.trim()) continue;

				const actionsHTML = isEditMode ? `
						<div class="class-actions">
							<button class="action-btn edit-btn" type="button" data-action="edit" data-id="${record.id}" title="Edit Class">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
									<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
								</svg>
							</button>
							<button class="action-btn delete-btn" type="button" data-action="delete" data-id="${record.id}" title="Delete Class">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<polyline points="3 6 5 6 21 6"></polyline>
									<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
									<line x1="10" y1="11" x2="10" y2="17"></line>
									<line x1="14" y1="11" x2="14" y2="17"></line>
								</svg>
							</button>
						</div>
				` : '';

				slotEl.innerHTML = `
					<div class="class-block ${classStyleByType(type)}" style="background-color: ${escapeHtml(bgColor)}; color: #fff;" data-class-id="${record.id}" data-class-day="${record.day}">
						<div class="class-name">${escapeHtml(title)}</div>
						${actionsHTML}
					</div>
				`;
			}
		});

		// Sync mobile layout (no-op on desktop — container remains hidden via CSS)
		renderMobileLayout(records);
	}

	// ---------------------------------------------------------------
	// MOBILE LAYOUT RENDERER
	// Builds the day-wise stacked card UI inside #mobileTimetable.
	// Called every time renderRecords() runs — single source of truth.
	// ---------------------------------------------------------------
	function renderMobileLayout(records) {
		const mobileContainer = document.getElementById('mobileTimetable');
		if (!mobileContainer) return;

		// Group records by day, preserving DAY_ORDER sequence
		const byDay = {};
		DAY_ORDER.forEach((day) => { byDay[day] = []; });
		if (Array.isArray(records)) {
			records.forEach((record) => {
				if (byDay[record.day]) byDay[record.day].push(record);
			});
		}

		// Sort each day's records by start_time ascending
		DAY_ORDER.forEach((day) => {
			byDay[day].sort((a, b) => {
				return (timeToMinutes((a.start_time || '').slice(0, 5)) || 0)
					 - (timeToMinutes((b.start_time || '').slice(0, 5)) || 0);
			});
		});

		// Format a raw HH:MM:SS time string as readable "H:MM"
		function fmtTime(t) {
			if (!t) return '';
			const [hStr, mStr] = t.slice(0, 5).split(':');
			const h = parseInt(hStr, 10);
			return `${h}:${mStr}`;
		}

		// Detect today to highlight its card
		const todayDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];

		let html = '';

		DAY_ORDER.forEach((day) => {
			const dayRecords = byDay[day];
			const count = dayRecords.length;
			const isToday = day === todayDayName;

			// Build slot rows HTML
			let slotsHTML = '';
			if (count === 0) {
				slotsHTML = '<div class="mobile-empty-state">No classes scheduled</div>';
			} else {
				dayRecords.forEach((record) => {
					const type = (record.type || 'class').toLowerCase();
					const title = type === 'break' ? 'Break' : (record.title || 'Class');
					const bgColor = isHexColor(record.color) ? record.color.trim() : '#4CAF50';
					const timeRange = `${fmtTime(record.start_time)} – ${fmtTime(record.end_time)}`;

					// Edit/delete buttons — rendered always, shown via CSS only in edit-mode
					const actionsHTML = `
						<div class="mobile-slot-actions">
							<button class="action-btn edit-btn" type="button" data-action="mobile-edit" data-id="${record.id}" title="Edit Class" aria-label="Edit ${escapeHtml(title)}">
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
									<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
									<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
								</svg>
							</button>
							<button class="action-btn delete-btn" type="button" data-action="mobile-delete" data-id="${record.id}" title="Delete Class" aria-label="Delete ${escapeHtml(title)}">
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
									<polyline points="3 6 5 6 21 6"></polyline>
									<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
								</svg>
							</button>
						</div>`;

					slotsHTML += `
						<div class="mobile-slot-row">
							<div class="mobile-slot-time">${escapeHtml(timeRange)}</div>
							<div class="mobile-slot-subject" style="background-color: ${escapeHtml(bgColor)}22; border-left: 3px solid ${escapeHtml(bgColor)};">
								<span class="mobile-subject-name" style="color: ${escapeHtml(bgColor)};">${escapeHtml(title)}</span>
								${actionsHTML}
							</div>
						</div>`;
				});
			}

			html += `
				<div class="mobile-day-card${isToday ? ' today' : ''}" data-day="${escapeHtml(day)}">
					<div class="mobile-day-header">
						<div class="mobile-day-title-group">
							<span class="mobile-day-title">${escapeHtml(day)}</span>
							${isToday ? '<span class="mobile-today-badge">Today</span>' : ''}
						</div>
						<div class="mobile-day-right">
							<span class="mobile-day-badge">${count} ${count === 1 ? 'class' : 'classes'}</span>
							<svg class="mobile-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
								<polyline points="6 9 12 15 18 9"></polyline>
							</svg>
						</div>
					</div>
					<div class="mobile-slot-list">${slotsHTML}</div>
				</div>`;
		});

		mobileContainer.innerHTML = html;
		mobileContainer.classList.toggle('edit-mode', isEditMode);

		// Accordion: toggle collapsed class on card header click
		mobileContainer.querySelectorAll('.mobile-day-header').forEach((header) => {
			header.addEventListener('click', () => {
				header.closest('.mobile-day-card').classList.toggle('collapsed');
			});
		});

		// Event delegation for mobile edit/delete taps
		mobileContainer.querySelectorAll('[data-action="mobile-edit"]').forEach((btn) => {
			btn.addEventListener('click', (e) => {
				e.stopPropagation(); // prevent accordion toggle
				const numericId = Number(btn.dataset.id);
				if (!Number.isInteger(numericId) || numericId <= 0) return;
				const selectedRecord = currentRecords.find((r) => Number(r.id) === numericId);
				if (!selectedRecord) return;
				editingClassId = numericId;
				if (classTitleInput) classTitleInput.value = selectedRecord.title || '';
				if (classDayInput) classDayInput.value = selectedRecord.day || 'Monday';
				if (classStartTimeInput) classStartTimeInput.value = (selectedRecord.start_time || '').slice(0, 5);
				if (classEndTimeInput) classEndTimeInput.value = (selectedRecord.end_time || '').slice(0, 5);
				if (classTypeInput) classTypeInput.value = (selectedRecord.type || 'class').toLowerCase();
				setSelectedColor(selectedRecord.color || '#8B5CF6');
				openModal();
			});
		});

		mobileContainer.querySelectorAll('[data-action="mobile-delete"]').forEach((btn) => {
			btn.addEventListener('click', (e) => {
				e.stopPropagation(); // prevent accordion toggle
				const numericId = Number(btn.dataset.id);
				if (!Number.isInteger(numericId) || numericId <= 0) return;
				if (confirm('Are you sure you want to delete this class?')) {
					fetch(`${API_URL}/${encodeURIComponent(numericId)}?user_id=${encodeURIComponent(userId)}`, {
						method: 'DELETE'
					})
						.then(async (response) => {
							const responseData = await response.json().catch(() => ({}));
							if (!response.ok || !responseData.success) {
								throw new Error(responseData.message || responseData.error || 'Failed to delete class');
							}
							await initializeTimeTable();
						})
						.catch((error) => {
							console.error('Error deleting class (mobile):', error);
							showClassFormError(error.message || 'Unable to delete class. Please try again.');
						});
				}
			});
		});
	}

	// 3. Add Class Button
	const addClassBtn = document.getElementById('addClassBtn');
	if (addClassBtn) {
		addClassBtn.addEventListener('click', () => {
		editingClassId = null;
		if (addClassForm) addClassForm.reset();
		setSelectedColor('#8B5CF6');
			openModal();
		});
	}

	// 3a. Edit Time Table Button
	if (editTimeTableBtn) {
		editTimeTableBtn.addEventListener('click', () => {
			isEditMode = !isEditMode;
			if (timetableGrid) {
				if (isEditMode) {
					timetableGrid.classList.add('edit-mode');
					editTimeTableBtn.textContent = 'Done Editing';
					editTimeTableBtn.classList.add('active');
				} else {
					timetableGrid.classList.remove('edit-mode');
					editTimeTableBtn.textContent = 'Edit Time Table';
					editTimeTableBtn.classList.remove('active');
				}
			}
			// Sync mobile container edit-mode class immediately
			const mobileContainer = document.getElementById('mobileTimetable');
			if (mobileContainer) mobileContainer.classList.toggle('edit-mode', isEditMode);
			// Re-render both layouts with updated edit mode state
			if (currentRecords) {
				renderRecords(currentRecords);
			}
		});
	}

	if (closeAddClassModal) {
		closeAddClassModal.addEventListener('click', closeModal);
	}

	if (cancelAddClassBtn) {
		cancelAddClassBtn.addEventListener('click', closeModal);
	}

	if (addClassModal) {
		addClassModal.addEventListener('click', (event) => {
			if (event.target === addClassModal) {
				closeModal();
			}
		});
	}

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && addClassModal && addClassModal.style.display === 'flex') {
			closeModal();
		}
	});

	if (addClassForm) {
		addClassForm.addEventListener('submit', async (event) => {
			event.preventDefault();
			clearClassFormError();

			const title = document.getElementById('classTitle').value.trim();
			const day = document.getElementById('classDay').value;
			const start_time = document.getElementById('classStartTime').value;
			const end_time = document.getElementById('classEndTime').value;
			const type = document.getElementById('classType').value;
			const color = document.getElementById('classColor').value || '#4CAF50';

			if (!title || !start_time || !end_time) {
				showClassFormError('Please fill all required fields');
				return;
			}

			if (end_time <= start_time) {
				showClassFormError('End time must be later than start time');
				return;
			}

			const payload = {
				title,
				day,
				start_time,
				end_time,
				type,
				color,
				user_id: Number(userId)
			};

			const isEditing = Number.isInteger(editingClassId) && editingClassId > 0;
			const requestUrl = isEditing
				? `${API_URL}/${encodeURIComponent(editingClassId)}?user_id=${encodeURIComponent(userId)}`
				: API_URL;
			const requestMethod = isEditing ? 'PUT' : 'POST';

			try {
				if (saveClassBtn) {
					saveClassBtn.disabled = true;
					saveClassBtn.textContent = isEditing ? 'Updating...' : 'Saving...';
				}

				const response = await fetch(requestUrl, {
					method: requestMethod,
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(payload)
				});

				const responseData = await response.json().catch(() => ({}));

				if (!response.ok || !responseData.success) {
					throw new Error(responseData.message || responseData.error || (isEditing ? 'Failed to update class' : 'Failed to save class'));
				}

				closeModal();
				await initializeTimeTable();
			} catch (error) {
				console.error('Error submitting class form:', error);
				showClassFormError(error.message || 'Unable to submit class right now. Please try again.');
			} finally {
				if (saveClassBtn) {
					saveClassBtn.disabled = false;
					saveClassBtn.textContent = Number.isInteger(editingClassId) && editingClassId > 0 ? 'Update' : 'Save';
				}
			}
		});
	}

	// 4. Event Delegation for Edit/Delete Actions in Edit Mode

	// 5. Initialize Time Table
	async function initializeTimeTable() {
		if (!userId) return;

		try {
			const response = await fetch(`${API_URL}?user_id=${encodeURIComponent(userId)}`);
			const data = await response.json().catch(() => ({}));

			if (!response.ok || !data.success) {
				throw new Error(data.message || data.error || 'Failed to fetch timetable records');
			}

			currentRecords = data.records || [];
			renderRecords(currentRecords);
		} catch (error) {
			console.error('Error loading timetable:', error);
			clearRenderedClasses();
		}
	}

	// Event delegation for class block actions (edit/delete)
	if (timetableGrid) {
		timetableGrid.addEventListener('click', (event) => {
			if (!isEditMode) return;

			const editBtn = event.target.closest('[data-action="edit"]');
			const deleteBtn = event.target.closest('[data-action="delete"]');

			if (editBtn) {
				const classId = editBtn.dataset.id;
				if (classId) {
					const numericId = Number(classId);
					if (!Number.isInteger(numericId) || numericId <= 0) return;

					const selectedRecord = currentRecords.find((record) => Number(record.id) === numericId);
					if (!selectedRecord) {
						showClassFormError('Selected class was not found. Please refresh and try again.');
						return;
					}

					editingClassId = numericId;
					if (classTitleInput) classTitleInput.value = selectedRecord.title || '';
					if (classDayInput) classDayInput.value = selectedRecord.day || 'Monday';
					if (classStartTimeInput) classStartTimeInput.value = (selectedRecord.start_time || '').slice(0, 5);
					if (classEndTimeInput) classEndTimeInput.value = (selectedRecord.end_time || '').slice(0, 5);
					if (classTypeInput) classTypeInput.value = (selectedRecord.type || 'class').toLowerCase();
					setSelectedColor(selectedRecord.color || '#8B5CF6');
					openModal();
				}
			}

			if (deleteBtn) {
				const classId = deleteBtn.dataset.id;
				const numericId = Number(classId);
				if (!Number.isInteger(numericId) || numericId <= 0) return;

				if (confirm('Are you sure you want to delete this class?')) {
					fetch(`${API_URL}/${encodeURIComponent(numericId)}?user_id=${encodeURIComponent(userId)}`, {
						method: 'DELETE'
					})
						.then(async (response) => {
							const responseData = await response.json().catch(() => ({}));
							if (!response.ok || !responseData.success) {
								throw new Error(responseData.message || responseData.error || 'Failed to delete class');
							}
							await initializeTimeTable();
						})
						.catch((error) => {
							console.error('Error deleting class:', error);
							showClassFormError(error.message || 'Unable to delete class right now. Please try again.');
						});
				}
			}
		});
	}

	// Start initialization
	initializeTimeTable();
});
