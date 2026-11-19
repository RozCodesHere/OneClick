var BACKEND_URL =
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'localhost'
        ? 'http://127.0.0.1:8000'
        : 'https://oneclick-backend-6hk7.onrender.com';

document.getElementById('forgotPasswordForm').addEventListener('submit', async function (event) {

    event.preventDefault();

    var email = document.getElementById('resetEmail').value.trim();
    var message = document.getElementById('forgotMessage');
    var button = this.querySelector('button[type="submit"]');

    button.disabled = true;
    button.textContent = 'Sending...';

    try {

        var response = await fetch(
            BACKEND_URL + '/api/users/forgot-password/',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email })
            }
        );

        var data = await response.json();

        message.className = 'alert alert-success';
        message.textContent = data.message || 'Please check your email or the Django terminal for the reset link.';

    } catch (error) {

        message.className = 'alert alert-danger';
        message.textContent = 'Unable to connect to the server.';

    }

    button.disabled = false;
    button.textContent = 'Send Reset Link';

});
