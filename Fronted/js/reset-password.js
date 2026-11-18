var BACKEND_URL = 'https://oneclick-backend-6hk7.onrender.com';

var params = new URLSearchParams(window.location.search);

var uid = params.get('uid');
var token = params.get('token');

document.getElementById('resetPasswordForm').addEventListener('submit', async function (event) {

    event.preventDefault();

    var newPassword = document.getElementById('newPassword').value;
    var confirmPassword = document.getElementById('confirmPassword').value;

    var message = document.getElementById('resetMessage');
    var button = this.querySelector('button[type="submit"]');

    if (!uid || !token) {
        message.className = 'alert alert-danger';
        message.textContent = 'Invalid reset link. Please request a new one.';
        return;
    }

    button.disabled = true;
    button.textContent = 'Resetting...';

    try {

        var response = await fetch(
            BACKEND_URL + '/api/users/reset-password/',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    uid: uid,
                    token: token,
                    new_password: newPassword,
                    confirm_password: confirmPassword
                })
            }
        );

        var data = await response.json();

        if (response.ok) {
    message.className = 'alert alert-success';
    message.textContent = 'Password reset successfully! Redirecting to login...';

    this.reset();

    setTimeout(function () {
        window.location.href = 'login.html';
    }, 2000);
} else {
            message.className = 'alert alert-danger';
            message.textContent = Array.isArray(data.error)
                ? data.error.join(' ')
                : data.error || 'Password reset failed.';
        }

    } catch (error) {

        message.className = 'alert alert-danger';
        message.textContent = 'Unable to connect to the server.';

    }

    button.disabled = false;
    button.textContent = 'Reset Password';

});
