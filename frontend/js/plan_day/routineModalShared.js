(function () {
    function formatTime(value) {
        if (!value) return '';
        return String(value).slice(0, 5);
    }

    function initRoutineModal(config) {
        const settings = Object.assign({
            userId: null,
            apiUrl: API_CONFIG.ENDPOINTS.ROUTINES,
            openTriggerSelector: '#addRoutineBtn',
            onRoutineSaved: null
        }, config || {});

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

        if (!routineModal || !routineForm) {
            return {
                openRoutineModal: function () {},
                closeRoutineModal: function () {}
            };
        }

        function showRoutineFormError(message) {
            if (!routineFormError) return;
            routineFormError.textContent = message;
            routineFormError.classList.add('show');
        }

        function clearRoutineFormError() {
            if (!routineFormError) return;
            routineFormError.textContent = '';
            routineFormError.classList.remove('show');
        }

        function openRoutineModal(routine) {
            routineForm.reset();
            clearRoutineFormError();

            if (routine) {
                if (routineModalTitle) routineModalTitle.textContent = 'Edit Routine';
                if (routineIdInput) routineIdInput.value = routine.id || '';
                if (routineTitleInput) routineTitleInput.value = routine.title || '';
                if (routineStartTimeInput) routineStartTimeInput.value = formatTime(routine.start_time);
                if (routineEndTimeInput) routineEndTimeInput.value = formatTime(routine.end_time);
            } else {
                if (routineModalTitle) routineModalTitle.textContent = 'Add Routine';
                if (routineIdInput) routineIdInput.value = '';
            }

            if (routineSubmitBtn) {
                routineSubmitBtn.disabled = !routineTitleInput || routineTitleInput.value.trim() === '';
            }

            routineModal.style.display = 'flex';
        }

        function closeModal() {
            routineModal.style.display = 'none';
            clearRoutineFormError();
        }

        if (routineTitleInput && !routineTitleInput.dataset.modalBound) {
            routineTitleInput.dataset.modalBound = 'true';
            routineTitleInput.addEventListener('input', function () {
                clearRoutineFormError();
                if (routineSubmitBtn) {
                    routineSubmitBtn.disabled = routineTitleInput.value.trim() === '';
                }
            });
        }

        if (routineStartTimeInput && !routineStartTimeInput.dataset.modalBound) {
            routineStartTimeInput.dataset.modalBound = 'true';
            routineStartTimeInput.addEventListener('input', clearRoutineFormError);
        }

        if (routineEndTimeInput && !routineEndTimeInput.dataset.modalBound) {
            routineEndTimeInput.dataset.modalBound = 'true';
            routineEndTimeInput.addEventListener('input', clearRoutineFormError);
        }

        if (!routineForm.dataset.modalBound) {
            routineForm.dataset.modalBound = 'true';
            routineForm.addEventListener('submit', async function (event) {
                event.preventDefault();
                clearRoutineFormError();

                const id = routineIdInput ? routineIdInput.value : '';
                const title = routineTitleInput ? routineTitleInput.value : '';

                if (!title || title.trim() === '') {
                    showRoutineFormError('Title cannot be empty');
                    return;
                }

                const payload = {
                    user_id: settings.userId,
                    title: title.trim(),
                    start_time: routineStartTimeInput ? routineStartTimeInput.value : '',
                    end_time: routineEndTimeInput ? routineEndTimeInput.value : ''
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
                const url = isEdit ? `${settings.apiUrl}/${id}` : settings.apiUrl;
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
                        showRoutineFormError(data.message || data.error || 'Failed to save routine');
                        return;
                    }

                    closeModal();
                    if (typeof settings.onRoutineSaved === 'function') {
                        settings.onRoutineSaved(payload, id, data);
                    }
                } catch (error) {
                    showRoutineFormError(error.message || 'Unable to save routine');
                }
            });
        }

        const openTrigger = document.querySelector(settings.openTriggerSelector);
        if (openTrigger && !openTrigger.dataset.modalBound) {
            openTrigger.dataset.modalBound = 'true';
            openTrigger.addEventListener('click', function () {
                openRoutineModal();
            });
        }

        if (closeRoutineModal && !closeRoutineModal.dataset.modalBound) {
            closeRoutineModal.dataset.modalBound = 'true';
            closeRoutineModal.addEventListener('click', closeModal);
        }

        if (cancelRoutineBtn && !cancelRoutineBtn.dataset.modalBound) {
            cancelRoutineBtn.dataset.modalBound = 'true';
            cancelRoutineBtn.addEventListener('click', closeModal);
        }

        if (!routineModal.dataset.modalBound) {
            routineModal.dataset.modalBound = 'true';
            routineModal.addEventListener('click', function (event) {
                if (event.target === routineModal) {
                    closeModal();
                }
            });
        }

        return {
            openRoutineModal,
            closeRoutineModal: closeModal
        };
    }

    window.FocusGridRoutineModal = {
        init: initRoutineModal
    };
})();
