document.addEventListener('DOMContentLoaded', () => {
    const regForm = document.getElementById('regForm');
    
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const regBtn = document.querySelector('.reg-btn');

            regBtn.textContent = 'Registering...';
            regBtn.disabled = true;

            try {
                const response = await fetch('http://localhost:5000/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, username, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    alert('Registration successful! Please sign in.');
                    window.location.href = 'login.html';
                } else {
                    alert(data.message || 'Registration failed.');
                    regBtn.textContent = 'Sign Up';
                    regBtn.disabled = false;
                }
            } catch (error) {
                console.error("Registration Error:", error);
                alert("Could not connect to the server. Please check your connection.");
                regBtn.textContent = 'Sign Up';
                regBtn.disabled = false;
            }
        });
    }
});
