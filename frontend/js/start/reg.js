document.addEventListener('DOMContentLoaded', () => {
    const regForm = document.getElementById('regForm');
    
    // Password toggle functionality
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordInput = document.getElementById('password');
    
    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const eyeIcon = passwordToggle.querySelector('.eye-icon');
            const eyeOffIcon = passwordToggle.querySelector('.eye-off-icon');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeIcon.style.display = 'none';
                eyeOffIcon.style.display = 'block';
            } else {
                passwordInput.type = 'password';
                eyeIcon.style.display = 'block';
                eyeOffIcon.style.display = 'none';
            }
        });
    }
    
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formError = document.getElementById('formError');
            formError.className = 'form-inline-error'; // Reset class and hide it
            formError.textContent = '';

            const name = document.getElementById('name').value.trim();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const regBtn = document.querySelector('.reg-btn');

            // Frontend Validation
            if (name.length < 2) {
                formError.textContent = "Please enter a valid full name (at least 2 characters).";
                formError.classList.add('show');
                return;
            }

            const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
            if (!usernameRegex.test(username)) {
                formError.textContent = "Username must be 3-20 characters long and contain only letters, numbers, and underscores.";
                formError.classList.add('show');
                return;
            }

            if (password.length < 6) {
                formError.textContent = "Password must be at least 6 characters long.";
                formError.classList.add('show');
                return;
            }

            regBtn.textContent = 'Registering...';
            regBtn.disabled = true;

            try {
                const response = await fetch(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, username, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    formError.className = 'form-inline-success show';
                    formError.textContent = 'Registration successful! Redirecting to login...';
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1500);
                } else {
                    // Backend handles unique username validation
                    formError.textContent = data.message || 'Registration failed.';
                    formError.classList.add('show');
                    regBtn.textContent = 'Sign Up';
                    regBtn.disabled = false;
                }
            } catch (error) {
                console.error("Registration Error:", error);
                formError.textContent = "Could not connect to the server. Please check your connection.";
                formError.classList.add('show');
                regBtn.textContent = 'Sign Up';
                regBtn.disabled = false;
            }
        });
    }
});
