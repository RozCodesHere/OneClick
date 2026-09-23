/* =========================================================
   ONECLICK — LOGIN PAGE JAVASCRIPT

   Handles:
   - Show / hide password
   - Client-side validation
   - Django JWT login
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

    var submitBtn = form.querySelector('.oc-auth-submit');

    var btnText = submitBtn.querySelector('.oc-btn-text');

    var btnSpinner = submitBtn.querySelector('.oc-btn-spinner');

    var googleBtn = document.getElementById('googleLoginBtn');


    /* =====================================================
       DJANGO BACKEND URL
    ===================================================== */

    var API_URL = 'http://127.0.0.1:8000/api/users/login/';


    /* =====================================================
       SHOW / HIDE PASSWORD
    ===================================================== */

    toggleBtn.addEventListener('click', function () {

        var targetId = toggleBtn.getAttribute('data-target');

        var input = document.getElementById(targetId);

        var icon = toggleBtn.querySelector('i');

        var isHidden = input.type === 'password';

        input.type = isHidden ? 'text' : 'password';

        icon.classList.toggle('fa-eye', !isHidden);

        icon.classList.toggle('fa-eye-slash', isHidden);

        toggleBtn.setAttribute(
            'aria-pressed',
            String(isHidden)
        );

        toggleBtn.setAttribute(
            'aria-label',
            isHidden ? 'Hide password' : 'Show password'
        );

    });


    /* =====================================================
       EMAIL VALIDATION
    ===================================================== */

    function isValidEmail(value) {

        var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return pattern.test(value.trim());

    }


    function setFieldValidity(input, valid) {

        input.classList.toggle('is-valid', valid);

        input.classList.toggle('is-invalid', !valid);

    }


    function validateEmailField() {

        var value = emailInput.value.trim();

        var valid =
            value.length > 0 &&
            isValidEmail(value);

        setFieldValidity(emailInput, valid);

        return valid;

    }


    /* =====================================================
       PASSWORD VALIDATION
    ===================================================== */

    function validatePasswordField() {

        var value = passwordInput.value;

        var valid = value.length >= 6;

        setFieldValidity(passwordInput, valid);

        return valid;

    }


    /* =====================================================
       LIVE VALIDATION
    ===================================================== */

    emailInput.addEventListener('input', function () {

        if (
            emailInput.classList.contains('is-invalid') ||
            emailInput.classList.contains('is-valid')
        ) {

            validateEmailField();

        }

    });


    emailInput.addEventListener(
        'blur',
        validateEmailField
    );


    passwordInput.addEventListener('input', function () {

        if (
            passwordInput.classList.contains('is-invalid') ||
            passwordInput.classList.contains('is-valid')
        ) {

            validatePasswordField();

        }

    });


    passwordInput.addEventListener(
        'blur',
        validatePasswordField
    );


    /* =====================================================
       ALERT FUNCTIONS
    ===================================================== */

    function showAlert(message) {

        loginAlert.textContent = message;

        loginAlert.classList.remove('d-none');

    }


    function hideAlert() {

        loginAlert.classList.add('d-none');

        loginAlert.textContent = '';

    }


    /* =====================================================
       LOADING STATE
    ===================================================== */

    function setLoading(isLoading) {

        submitBtn.disabled = isLoading;

        btnText.textContent =
            isLoading ? 'Logging in...' : 'Login';

        btnSpinner.classList.toggle(
            'd-none',
            !isLoading
        );

    }


    /* =====================================================
       LOGIN FORM SUBMISSION
    ===================================================== */

    form.addEventListener('submit', async function (event) {

        event.preventDefault();

        event.stopPropagation();

        hideAlert();


        /* -----------------------------------------------
           STEP 1: Validate form
        ------------------------------------------------ */

        var emailValid = validateEmailField();

        var passwordValid = validatePasswordField();

        form.classList.add('was-validated');


        if (!emailValid || !passwordValid) {

            if (!emailValid) {

                emailInput.focus();

            } else {

                passwordInput.focus();

            }

            showAlert(
                'Please fix the highlighted fields before continuing.'
            );

            return;

        }


        /* -----------------------------------------------
           STEP 2: Show loading
        ------------------------------------------------ */

        setLoading(true);


        try {

            /* -------------------------------------------
               STEP 3: Send login request to Django
            -------------------------------------------- */

            var response = await fetch(
                API_URL,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        email: emailInput.value.trim(),
                        password: passwordInput.value
                    })
                }
            );


            /* -------------------------------------------
               STEP 4: Read Django response
            -------------------------------------------- */

            var data = await response.json();


            /* -------------------------------------------
               STEP 5: Check if login failed
            -------------------------------------------- */

            if (!response.ok) {

                showAlert(
                    data.error ||
                    'Invalid email or password.'
                );

                setLoading(false);

                return;

            }


            /* -------------------------------------------
               STEP 6: Get user information
            -------------------------------------------- */

            var user = data.user;

            var accessToken = data.tokens.access;

            var refreshToken = data.tokens.refresh;


            /* -------------------------------------------
               STEP 7: Save JWT tokens
            -------------------------------------------- */

         localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');

localStorage.setItem(
    'access_token',
    accessToken
);

localStorage.setItem(
    'refresh_token',
    refreshToken
);

            /* -------------------------------------------
               STEP 8: Save user information
            -------------------------------------------- */

            localStorage.setItem(
                'user',
                JSON.stringify(user)
            );


            /* -------------------------------------------
               STEP 9: Redirect based on role
            -------------------------------------------- */

            if (user.role === 'customer') {

                window.location.href =
                    'customer-dashboard.html';

            }

            else if (user.role === 'provider') {

                window.location.href =
                    'provider-dashboard.html';

            }

            else if (user.role === 'admin') {

                window.location.href =
                    'admin-dashboard.html';

            }

            else {

                showAlert(
                    'Login successful, but your account role is invalid.'
                );

                setLoading(false);

            }

        }

        catch (error) {

            console.error(
                'Login error:',
                error
            );

            showAlert(
                'Unable to connect to the server. Make sure Django is running.'
            );

            setLoading(false);

        }

    });


    /* =====================================================
       GOOGLE LOGIN
    ===================================================== */

    googleBtn.addEventListener('click', function () {

        showAlert(
            'Google login is not connected yet. Please use email and password for now.'
        );

    });

});