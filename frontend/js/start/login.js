document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const loginBtn = document.querySelector('.login-btn');

            loginBtn.textContent = 'Signing in...';
            loginBtn.disabled = true;

            try {
                const response = await fetch('http://localhost:5000/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    localStorage.setItem('focusGridUser', JSON.stringify(data.user));
                    window.location.href = 'dashboard.html';
                } else {
                    alert(data.message || 'Login failed. Please check your credentials.');
                    loginBtn.textContent = 'Sign In';
                    loginBtn.disabled = false;
                }
            } catch (error) {
                console.error("Login Error:", error);
                alert("Could not connect to the server. Please ensure the backend is running.");
                loginBtn.textContent = 'Sign In';
                loginBtn.disabled = false;
            }
        });
    }
});
