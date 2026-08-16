/* =========================================================
   ONECLICK — LOGIN PAGE JAVASCRIPT
   Handles: show/hide password, client-side validation
   (email format + required fields), Bootstrap validation
   styling, and a mock submit flow with loading state.
========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  var form = document.getElementById('loginForm');
  var emailInput = document.getElementById('loginEmail');
  var passwordInput = document.getElementById('loginPassword');
  var toggleBtn = document.getElementById('togglePassword');
  var loginAlert = document.getElementById('loginAlert');
  var submitBtn = form.querySelector('.oc-auth-submit');
  var btnText = submitBtn.querySelector('.oc-btn-text');
  var btnSpinner = submitBtn.querySelector('.oc-btn-spinner');
  var googleBtn = document.getElementById('googleLoginBtn');

  /* ---------- Show / Hide Password ---------- */
  toggleBtn.addEventListener('click', function () {
    var targetId = toggleBtn.getAttribute('data-target');
    var input = document.getElementById(targetId);
    var icon = toggleBtn.querySelector('i');
    var isHidden = input.type === 'password';

    input.type = isHidden ? 'text' : 'password';
    icon.classList.toggle('fa-eye', !isHidden);
    icon.classList.toggle('fa-eye-slash', isHidden);

    toggleBtn.setAttribute('aria-pressed', String(isHidden));
    toggleBtn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  });

  /* ---------- Helpers: field-level validity ---------- */

  function isValidEmail(value) {
    // Standard, pragmatic email pattern — matches Bootstrap's built-in
    // type="email" behavior but lets us also validate manually on submit.
    var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(value.trim());
  }

  function setFieldValidity(input, valid) {
    input.classList.toggle('is-valid', valid);
    input.classList.toggle('is-invalid', !valid);
  }

  function validateEmailField() {
    var value = emailInput.value.trim();
    var valid = value.length > 0 && isValidEmail(value);
    setFieldValidity(emailInput, valid);
    return valid;
  }

  function validatePasswordField() {
    var value = passwordInput.value;
    var valid = value.length >= 6;
    setFieldValidity(passwordInput, valid);
    return valid;
  }

  /* ---------- Live validation on blur / input ---------- */
  emailInput.addEventListener('input', function () {
    if (emailInput.classList.contains('is-invalid') || emailInput.classList.contains('is-valid')) {
      validateEmailField();
    }
  });
  emailInput.addEventListener('blur', validateEmailField);

  passwordInput.addEventListener('input', function () {
    if (passwordInput.classList.contains('is-invalid') || passwordInput.classList.contains('is-valid')) {
      validatePasswordField();
    }
  });
  passwordInput.addEventListener('blur', validatePasswordField);

  /* ---------- Alert helper ---------- */
  function showAlert(message) {
    loginAlert.textContent = message;
    loginAlert.classList.remove('d-none');
  }

  function hideAlert() {
    loginAlert.classList.add('d-none');
    loginAlert.textContent = '';
  }

  /* ---------- Loading state on submit button ---------- */
  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    btnText.textContent = isLoading ? 'Logging in...' : 'Login';
    btnSpinner.classList.toggle('d-none', !isLoading);
  }

  /* ---------- Form Submit ---------- */
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    event.stopPropagation();
    hideAlert();

    var emailValid = validateEmailField();
    var passwordValid = validatePasswordField();

    // Apply Bootstrap's validation styling classes to the form as a whole.
    form.classList.add('was-validated');

    if (!emailValid || !passwordValid) {
      // Prevent empty / invalid submission — focus the first invalid field.
      if (!emailValid) {
        emailInput.focus();
      } else if (!passwordValid) {
        passwordInput.focus();
      }
      showAlert('Please fix the highlighted fields before continuing.');
      return;
    }

    // ---- Mock authentication flow (no backend wired up yet) ----
    // Replace this block with a real fetch()/API call to the OneClick
    // backend once the authentication endpoint is available.
    setLoading(true);

    window.setTimeout(function () {
      setLoading(false);
      // Placeholder success behavior: redirect to the customer dashboard.
      // Swap this for real role-based redirect logic once auth is wired up.
      window.location.href = 'customer-dashboard.html';
    }, 1200);
  });

  /* ---------- Google Login (placeholder) ---------- */
  googleBtn.addEventListener('click', function () {
    // Placeholder — wire this up to real Google OAuth once configured.
    showAlert('Google login is not connected yet. Please use email and password for now.');
  });

});