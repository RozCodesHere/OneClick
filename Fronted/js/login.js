/* =========================================================
   ONECLICK — LOGIN PAGE JAVASCRIPT

   Handles:
   - Show / hide password
   - Client-side validation
   - Django JWT login
   - Google Sign-In
   - Saving JWT tokens
   - Role-based dashboard redirect
   - Loading state
   - Backend error messages
========================================================= */

document.addEventListener('DOMContentLoaded', function () {

    /* =====================================================
       GET HTML ELEMENTS
    ===================================================== */

    var form = document.getElementById('loginForm');
    var emailInput = document.getElementById('loginEmail');
    var passwordInput = document.getElementById('loginPassword');
    var toggleBtn = document.getElementById('togglePassword');
    var loginAlert = document.getElementById('loginAlert');

    var submitBtn = form ? form.querySelector('.oc-auth-submit') : null;
    var btnText = submitBtn ? submitBtn.querySelector('.oc-btn-text') : null;
    var btnSpinner = submitBtn ? submitBtn.querySelector('.oc-btn-spinner') : null;

    var googleBtn = document.getElementById('googleLoginBtn');
    /* =====================================================
       BACKEND URLS
    ===================================================== */

   

var USE_LOCAL_BACKEND = (
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'localhost'
);

var BACKEND_URL = USE_LOCAL_BACKEND
    ? 'http://127.0.0.1:8000'
    : 'https://oneclick-backend-6hk7.onrender.com';

var API_URL = BACKEND_URL + '/api/users/login/';
var GOOGLE_API_URL = BACKEND_URL + '/api/users/login/google/';
console.log("Current website:", window.location.origin);
console.log("Selected backend:", BACKEND_URL);


    var GOOGLE_CLIENT_ID =
        '673099442634-24da2mp2sqofhqv2uh28pt8309k2pl3r.apps.googleusercontent.com';
    /* =====================================================
       SHOW / HIDE PASSWORD
    ===================================================== */

    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', function () {
            var targetId = toggleBtn.getAttribute('data-target');
            var input = document.getElementById(targetId);
            var icon = toggleBtn.querySelector('i');

            if (!input) return;

            var isHidden = input.type === 'password';

            input.type = isHidden ? 'text' : 'password';

            if (icon) {
                icon.classList.toggle('fa-eye', !isHidden);
                icon.classList.toggle('fa-eye-slash', isHidden);
            }

            toggleBtn.setAttribute('aria-pressed', String(isHidden));
            toggleBtn.setAttribute(
                'aria-label',
                isHidden ? 'Hide password' : 'Show password'
            );
        });
    }

    /* =====================================================
       EMAIL VALIDATION
    ===================================================== */

    
function isValidEmail(value) {
    var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(value.trim());
}


    function setFieldValidity(input, valid) {
        if (!input) return;

        input.classList.toggle('is-valid', valid);
        input.classList.toggle('is-invalid', !valid);
    }

    function validateEmailField() {
        if (!emailInput) return false;

        var value = emailInput.value.trim();
        var valid = value.length > 0 && isValidEmail(value);

        setFieldValidity(emailInput, valid);
        return valid;
    }

    /* =====================================================
       PASSWORD VALIDATION
    ===================================================== */

    function validatePasswordField() {
        if (!passwordInput) return false;

        var valid = passwordInput.value.length >= 6;

        setFieldValidity(passwordInput, valid);
        return valid;
    }

    /* =====================================================
       LIVE VALIDATION
    ===================================================== */

    if (emailInput) {
        emailInput.addEventListener('input', function () {
            if (
                emailInput.classList.contains('is-invalid') ||
                emailInput.classList.contains('is-valid')
            ) {
                validateEmailField();
            }
        });

        emailInput.addEventListener('blur', validateEmailField);
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', function () {
            if (
                passwordInput.classList.contains('is-invalid') ||
                passwordInput.classList.contains('is-valid')
            ) {
                validatePasswordField();
            }
        });

        passwordInput.addEventListener('blur', validatePasswordField);
    }

    /* =====================================================
       ALERT FUNCTIONS
    ===================================================== */

    function showAlert(message) {
        if (!loginAlert) {
            console.error(message);
            return;
        }

        loginAlert.textContent = message;
        loginAlert.classList.remove('d-none');
    }

    function hideAlert() {
        if (!loginAlert) return;

        loginAlert.classList.add('d-none');
        loginAlert.textContent = '';
    }

    /* =====================================================
       LOADING STATE
    ===================================================== */

    function setLoading(isLoading) {
        if (submitBtn) {
            submitBtn.disabled = isLoading;
        }

        if (btnText) {
            btnText.textContent = isLoading ? 'Logging in...' : 'Login';
        }

        if (btnSpinner) {
            btnSpinner.classList.toggle('d-none', !isLoading);
        }
    }

    /* =====================================================
       SAVE LOGIN DATA AND REDIRECT
    ===================================================== */

    function saveLoginAndRedirect(data) {
        if (
            !data ||
            !data.user ||
            !data.tokens ||
            !data.tokens.access ||
            !data.tokens.refresh
        ) {
            showAlert('The server returned an invalid login response.');
            return;
        }

        var role = data.user.role;

        var dashboardPages = {
            customer: 'customer-dashboard.html',
            provider: 'provider-dashboard.html',
            admin: 'admin-dashboard.html'
        };

        if (!dashboardPages[role]) {
            showAlert('Your account role is invalid.');
            return;
        }

        localStorage.setItem('access_token', data.tokens.access);
        localStorage.setItem('refresh_token', data.tokens.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));

        window.location.href = dashboardPages[role];
    }

    /* =====================================================
       EMAIL / PASSWORD LOGIN
    ===================================================== */

    if (form) {
        form.addEventListener('submit', async function (event) {
            event.preventDefault();
            event.stopPropagation();

            hideAlert();

            var emailValid = validateEmailField();
            var passwordValid = validatePasswordField();

            form.classList.add('was-validated');

            if (!emailValid || !passwordValid) {
                if (!emailValid && emailInput) {
                    emailInput.focus();
                } else if (passwordInput) {
                    passwordInput.focus();
                }

                showAlert(
                    'Please fix the highlighted fields before continuing.'
                );
                return;
            }

            setLoading(true);

            try {
                var response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: emailInput.value.trim(),
                        password: passwordInput.value
                    })
                });

                var data = await response.json();

                if (!response.ok) {
                    showAlert(
                        data.error ||
                        data.detail ||
                        'Invalid email or password.'
                    );
                    return;
                }

                saveLoginAndRedirect(data);

            } catch (error) {
                console.error('Email login error:', error);

                showAlert(
                    'Unable to connect to the server. Make sure Django is running.'
                );
            } finally {
                setLoading(false);
            }
        });
    }

    /* =====================================================
       GOOGLE SIGN-IN
    ===================================================== */

    function initializeGoogleSignIn() {
        if (!googleBtn) return true;

        if (!window.google?.accounts?.id) {
            return false;
        }

        // Create a container for Google's official sign-in button.
        var googleContainer = document.createElement('div');
        googleContainer.id = 'googleSignInContainer';
        googleContainer.className = googleBtn.className;

        googleBtn.replaceWith(googleContainer);

        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,

            callback: async function (googleResponse) {
                hideAlert();

                if (!googleResponse || !googleResponse.credential) {
                    showAlert(
                        'Google did not return a sign-in credential. Please try again.'
                    );
                    return;
                }

                googleContainer.style.pointerEvents = 'none';

                try {
                    var response = await fetch(GOOGLE_API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        
                        body: JSON.stringify({
    credential: googleResponse.credential,
    requested_role: new URLSearchParams(window.location.search).get("role") || "customer"
})

                    });

                    var data = await response.json();

                    if (!response.ok) {
                        console.error('Google backend response:', data);

                        showAlert(
                            data.error ||
                            data.detail ||
                            'Google login failed. Please try again.'
                        );
                        return;
                    }

                    saveLoginAndRedirect(data);

                } catch (error) {
                    console.error('Google login error:', error);

                    showAlert(
                        'Unable to connect to Django. Check that the backend is running.'
                    );
                } finally {
                    googleContainer.style.pointerEvents = '';
                }
            }
        });

        window.google.accounts.id.renderButton(
            googleContainer,
            {
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                shape: 'rectangular',
                width: 300,
                locale: 'en'
                
            }
        );

        return true;
    }

    // Google Identity Services loads asynchronously, so retry briefly
    // if the Google script is not ready when this page first loads.
    if (googleBtn) {
        var googleAttempts = 0;
        var maxGoogleAttempts = 40;

        function tryInitializeGoogle() {
            googleAttempts++;

            if (initializeGoogleSignIn()) {
                return;
            }

            if (googleAttempts < maxGoogleAttempts) {
                window.setTimeout(tryInitializeGoogle, 250);
            } else {
                showAlert(
                    'Google Sign-In could not load. Check your internet connection and refresh the page.'
                );
            }
        }

        tryInitializeGoogle();
    }

});
