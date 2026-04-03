(function () {
    function getCurrentUser() {
        const userStr = localStorage.getItem('focusGridUser');
        if (!userStr) return null;

        try {
            return JSON.parse(userStr);
        } catch (error) {
            console.error('Error parsing focusGridUser:', error);
            return null;
        }
    }

    function getUserId() {
        const user = getCurrentUser();
        if (user && user.id) return user.id;
        return localStorage.getItem('user_id') || null;
    }

    function buildModalMarkup() {
        return `
            <div class="modal-overlay" id="updateProfileModal" style="display: none;">
                <div class="modal-content glass-panel update-profile-modal-content" role="dialog" aria-modal="true" aria-labelledby="updateProfileTitle">
                    <div class="modal-header">
                        <h3 id="updateProfileTitle">Update Profile</h3>
                        <button class="close-modal" id="closeUpdateProfileModal" type="button" aria-label="Close">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <form id="updateProfileForm" class="task-form">
                        <div id="updateProfileError" class="form-inline-error" role="alert" aria-live="polite"></div>
                        <div class="form-group">
                            <label for="profileName">Name</label>
                            <input type="text" id="profileName" required>
                        </div>
                        <div class="form-group">
                            <label for="profileUsername">Username</label>
                            <input type="text" id="profileUsername" required>
                        </div>
                        <div class="form-group">
                            <label for="profilePassword">Password</label>
                            <input type="password" id="profilePassword" placeholder="Leave blank to keep current password">
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" id="cancelUpdateProfileBtn">Cancel</button>
                            <button type="submit" class="btn btn-primary" id="saveUpdateProfileBtn">Update Profile</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    function updateHeader(user) {
        if (!user) return;

        const profileRoot = document.querySelector('.user-profile');
        const nameEl = document.getElementById('headerName') || (profileRoot ? profileRoot.querySelector('.name') : null);
        const usernameEl = document.getElementById('headerUsername') || (profileRoot ? profileRoot.querySelector('.username') : null);
        const avatarEl = document.getElementById('headerAvatar') || (profileRoot ? profileRoot.querySelector('.avatar') : null);

        if (nameEl) nameEl.textContent = user.name || user.username || '';
        if (usernameEl) usernameEl.textContent = '@' + (user.username || '');
        if (avatarEl) {
            const initials = String(user.name || user.username || '')
                .split(' ')
                .filter(Boolean)
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
            avatarEl.textContent = initials || 'U';
        }
    }

    async function initProfileModal() {
        const profileTrigger = document.querySelector('.user-profile') || document.getElementById('headerAvatar');
        if (!profileTrigger) return;

        updateHeader(getCurrentUser());

        if (!document.getElementById('updateProfileModal')) {
            document.body.insertAdjacentHTML('beforeend', buildModalMarkup());
        }

        const modal = document.getElementById('updateProfileModal');
        const form = document.getElementById('updateProfileForm');
        const nameInput = document.getElementById('profileName');
        const usernameInput = document.getElementById('profileUsername');
        const passwordInput = document.getElementById('profilePassword');
        const closeBtn = document.getElementById('closeUpdateProfileModal');
        const cancelBtn = document.getElementById('cancelUpdateProfileBtn');
        const errorEl = document.getElementById('updateProfileError');

        if (!modal || !form || !nameInput || !usernameInput || !passwordInput || !closeBtn || !cancelBtn || !errorEl) {
            return;
        }

        function showError(message) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
        }

        function clearError() {
            errorEl.textContent = '';
            errorEl.classList.remove('show');
        }

        async function prefillForm() {
            const user = getCurrentUser();
            if (user) {
                nameInput.value = user.name || '';
                usernameInput.value = user.username || '';
            }

            const userId = getUserId();
            if (!userId) return;

            try {
                const response = await fetch(`http://localhost:5000/api/user/profile?user_id=${encodeURIComponent(userId)}`);
                const data = await response.json();
                if (response.ok && data.success && data.user) {
                    nameInput.value = data.user.name || nameInput.value;
                    usernameInput.value = data.user.username || usernameInput.value;
                }
            } catch (error) {
                console.error('Profile prefill failed:', error);
            }
        }

        function openModal() {
            clearError();
            passwordInput.value = '';
            prefillForm();
            modal.style.display = 'flex';
        }

        function closeModal() {
            modal.style.display = 'none';
            clearError();
        }

        if (!profileTrigger.dataset.profileModalBound) {
            profileTrigger.dataset.profileModalBound = 'true';
            profileTrigger.addEventListener('click', openModal);
        }

        if (!closeBtn.dataset.profileModalBound) {
            closeBtn.dataset.profileModalBound = 'true';
            closeBtn.addEventListener('click', closeModal);
        }

        if (!cancelBtn.dataset.profileModalBound) {
            cancelBtn.dataset.profileModalBound = 'true';
            cancelBtn.addEventListener('click', closeModal);
        }

        if (!modal.dataset.profileModalBound) {
            modal.dataset.profileModalBound = 'true';
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    closeModal();
                }
            });
        }

        if (!document.body.dataset.profileModalEscBound) {
            document.body.dataset.profileModalEscBound = 'true';
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && modal.style.display === 'flex') {
                    closeModal();
                }
            });
        }

        if (!form.dataset.profileModalBound) {
            form.dataset.profileModalBound = 'true';
            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                clearError();

                const userId = getUserId();
                const name = nameInput.value.trim();
                const username = usernameInput.value.trim();
                const password = passwordInput.value;

                if (!userId) {
                    showError('User session not found');
                    return;
                }

                if (!name) {
                    showError('Name is required');
                    return;
                }

                if (!username) {
                    showError('Username is required');
                    return;
                }

                try {
                    const response = await fetch('http://localhost:5000/api/user/update-profile', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            user_id: userId,
                            name,
                            username,
                            password
                        })
                    });

                    const data = await response.json();
                    if (!response.ok || !data.success) {
                        showError(data.message || data.error || 'Could not update profile');
                        return;
                    }

                    const currentUser = getCurrentUser() || { id: Number(userId) };
                    const updatedUser = {
                        ...currentUser,
                        id: Number(userId),
                        name,
                        username
                    };
                    localStorage.setItem('focusGridUser', JSON.stringify(updatedUser));
                    localStorage.setItem('user_id', String(userId));

                    updateHeader(updatedUser);
                    closeModal();
                } catch (error) {
                    console.error('Profile update failed:', error);
                    showError('Network error while updating profile');
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProfileModal);
    } else {
        initProfileModal();
    }
})();
