document.addEventListener('DOMContentLoaded', () => {
	const sidebarToggle = document.getElementById('sidebarToggle');
	const sidebar = document.querySelector('.sidebar');
	const tasksBtn = document.getElementById('tasksBtn');
	const addRoutineBtn = document.getElementById('addRoutineBtn');
	const routineGrid = document.getElementById('routineGrid');
	const routineEmptyState = document.getElementById('routineEmptyState');

	const routineModal = document.getElementById('routineModal');
	const closeRoutineModal = document.getElementById('closeRoutineModal');
	const cancelRoutineBtn = document.getElementById('cancelRoutineBtn');
	const routineForm = document.getElementById('routineForm');
	const routineModalTitle = document.getElementById('routineModalTitle');
	const routineIdInput = document.getElementById('routineId');
	const routineFormError = document.getElementById('routineFormError');
	const routineTitleInput = document.getElementById('routineTitle');
	const routineStartTimeInput = document.getElementById('routineStartTime');
	const routineEndTimeInput = document.getElementById('routineEndTime');
	const routineSubmitBtn = routineForm ? routineForm.querySelector('button[type="submit"]') : null;

	let routines = [];
	const API_URL = API_CONFIG.ENDPOINTS.ROUTINES;

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

	if (!userId) {
		userId = localStorage.getItem('user_id') || 1;
	}

	const routineModalApi = window.FocusGridRoutineModal
		? window.FocusGridRoutineModal.init({
			userId,
			apiUrl: API_URL,
			openTriggerSelector: '#addRoutineBtn',
			onRoutineSaved: async () => {
				await loadRoutines();
			}
		})
		: { openRoutineModal: () => {}, closeRoutineModal: () => {} };

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

	if (tasksBtn) {
		tasksBtn.addEventListener('click', () => {
			window.location.href = 'tasks.html';
		});
	}

	if (addRoutineBtn && !window.FocusGridRoutineModal) {
		addRoutineBtn.addEventListener('click', () => {
			openRoutineModal();
		});
	}

	if (closeRoutineModal && !window.FocusGridRoutineModal) {
		closeRoutineModal.addEventListener('click', closeModal);
	}

	if (cancelRoutineBtn && !window.FocusGridRoutineModal) {
		cancelRoutineBtn.addEventListener('click', closeModal);
	}

	if (routineModal && !window.FocusGridRoutineModal) {
		routineModal.addEventListener('click', event => {
			if (event.target === routineModal) {
				closeModal();
			}
		});
	}

	if (routineGrid) {
		routineGrid.addEventListener('click', async event => {
			const editBtn = event.target.closest('[data-action="edit"]');
			const deleteBtn = event.target.closest('[data-action="delete"]');

			if (!editBtn && !deleteBtn) {
				return;
			}

			const id = Number((editBtn || deleteBtn).dataset.id);
			const routine = routines.find(item => Number(item.id) === id);

			if (!routine) {
				return;
			}

			if (editBtn) {
				routineModalApi.openRoutineModal(routine);
				return;
			}

			if (deleteBtn) {
				const confirmed = window.confirm('Delete this routine?');
				if (!confirmed) {
					return;
				}

				const previous = [...routines];
				routines = routines.filter(item => Number(item.id) !== id);
				renderRoutines();

				try {
					const response = await fetch(`${API_URL}/${id}`, {
						method: 'DELETE',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ user_id: userId })
					});

					const data = await response.json();
					if (!response.ok || !data.success) {
						throw new Error(data.error || 'Failed to delete routine');
					}
				} catch (error) {
					console.error('Delete routine failed:', error);
					routines = previous;
					renderRoutines();
					window.alert(error.message || 'Unable to delete routine');
				}
			}
		});
	}

	if (routineForm && !window.FocusGridRoutineModal) {
		routineTitleInput.addEventListener('input', () => {
			clearRoutineFormError();
			if (routineSubmitBtn) {
				routineSubmitBtn.disabled = routineTitleInput.value.trim() === '';
			}
		});

		routineStartTimeInput.addEventListener('input', clearRoutineFormError);
		routineEndTimeInput.addEventListener('input', clearRoutineFormError);

		routineForm.addEventListener('submit', async event => {
			event.preventDefault();
			clearRoutineFormError();

			const id = routineIdInput.value;
			const title = routineTitleInput.value;

			if (!title || title.trim() === '') {
				showRoutineFormError('Title cannot be empty');
				return;
			}

			const payload = {
				user_id: userId,
				title: title.trim(),
				start_time: routineStartTimeInput.value,
				end_time: routineEndTimeInput.value
			};

			if (!payload.start_time || !payload.end_time) {
				showRoutineFormError('start_time and end_time are required');
				return;
			}

			if (payload.start_time >= payload.end_time) {
				showRoutineFormError('End time must be greater than start time');
				return;
			}

			const isEdit = Boolean(id);
			const url = isEdit ? `${API_URL}/${id}` : API_URL;
			const method = isEdit ? 'PUT' : 'POST';

			try {
				const response = await fetch(url, {
					method,
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});

				const data = await response.json();
				if (!response.ok) {
					showRoutineFormError(data.message || data.error || 'Failed to save routine');
					return;
				}

				if (!data.success) {
					throw new Error(data.message || data.error || 'Failed to save routine');
				}

				closeModal();
				await loadRoutines();
			} catch (error) {
				console.error('Save routine failed:', error);
				showRoutineFormError(error.message || 'Unable to save routine');
			}
		});
	}

	function showRoutineFormError(message) {
		if (!routineFormError) {
			return;
		}

		routineFormError.textContent = message;
		routineFormError.classList.add('show');
	}

	function clearRoutineFormError() {
		if (!routineFormError) {
			return;
		}

		routineFormError.textContent = '';
		routineFormError.classList.remove('show');
	}

	function formatTime(value) {
		if (!value) return '';
		return String(value).slice(0, 5);
	}

	function toMinutes(timeValue) {
		const time = formatTime(timeValue);
		const [hours, minutes] = time.split(':').map(Number);
		if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
			return Number.POSITIVE_INFINITY;
		}
		return (hours * 60) + minutes;
	}

	function sortRoutinesByTime(list) {
		return [...list].sort((a, b) => {
			const startDiff = toMinutes(a.start_time) - toMinutes(b.start_time);
			if (startDiff !== 0) return startDiff;

			const endDiff = toMinutes(a.end_time) - toMinutes(b.end_time);
			if (endDiff !== 0) return endDiff;

			return String(a.title || '').localeCompare(String(b.title || ''));
		});
	}

	function escapeHtml(text) {
		const map = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#039;'
		};
		return String(text).replace(/[&<>"']/g, char => map[char]);
	}

	function openRoutineModal(routine = null) {
		if (!routineModal || !routineForm) {
			return;
		}

		routineForm.reset();
		clearRoutineFormError();
		if (routine) {
			routineModalTitle.textContent = 'Edit Routine';
			routineIdInput.value = routine.id;
			routineTitleInput.value = routine.title || '';
			routineStartTimeInput.value = formatTime(routine.start_time);
			routineEndTimeInput.value = formatTime(routine.end_time);
		} else {
			routineModalTitle.textContent = 'Add Routine';
			routineIdInput.value = '';
		}

		if (routineSubmitBtn) {
			routineSubmitBtn.disabled = routineTitleInput.value.trim() === '';
		}

		routineModal.style.display = 'flex';
	}

	function closeModal() {
		if (routineModal) {
			routineModal.style.display = 'none';
		}
		clearRoutineFormError();
	}

	function renderRoutines() {
		if (!routineGrid) {
			return;
		}

		routineGrid.innerHTML = '';

		if (!routines.length) {
			if (routineEmptyState) {
				routineGrid.appendChild(routineEmptyState);
			}
			return;
		}

		routines.forEach(routine => {
			const card = document.createElement('article');
			card.className = 'routine-card glass-panel';
			card.innerHTML = `
				<div class="routine-content">
					<h4>${escapeHtml(routine.title || '')}</h4>
					<p>${formatTime(routine.start_time)} -> ${formatTime(routine.end_time)}</p>
				</div>
				<div class="routine-actions">
					<button class="action-btn edit-btn" type="button" data-action="edit" data-id="${routine.id}" title="Edit">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
							<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
						</svg>
					</button>
					<button class="action-btn delete-btn" type="button" data-action="delete" data-id="${routine.id}" title="Delete">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="3 6 5 6 21 6"></polyline>
							<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
							<line x1="10" y1="11" x2="10" y2="17"></line>
							<line x1="14" y1="11" x2="14" y2="17"></line>
						</svg>
					</button>
				</div>
			`;
			routineGrid.appendChild(card);
		});
	}

	async function loadRoutines() {
		try {
			const response = await fetch(`${API_URL}?user_id=${encodeURIComponent(userId)}`);
			const data = await response.json();

			if (!response.ok || !data.success) {
				throw new Error(data.error || 'Failed to load routines');
			}

			routines = Array.isArray(data.routines) ? sortRoutinesByTime(data.routines) : [];
			renderRoutines();
		} catch (error) {
			console.error('Load routines failed:', error);
			routines = [];
			renderRoutines();
		}
	}

	loadRoutines();
});
