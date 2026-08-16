/* =========================================================
   ONECLICK — REGISTER PAGE JAVASCRIPT (v2 — Role-Based Flow)
   Handles:
     - AOS init + sticky navbar / back-to-top (shared page chrome)
     - Step navigation: role selection -> customer/provider form -> back
     - Show/hide password (both forms, both password fields each)
     - File upload label updates (citizenship + profile photo)
     - Full client-side validation for both forms:
         required fields, email format, phone format,
         password >= 8 chars, confirm-password match,
         terms checkbox, provider-only fields (category,
         experience, address, bio, file uploads)
     - Bootstrap validation styling (is-valid / is-invalid / was-validated)
     - Mock "Creating Account..." loading state -> success alert
   No backend, no fetch — frontend validation only.
========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Init AOS ---------- */
  if (window.AOS) {
    AOS.init({
      duration: 650,
      easing: 'ease-out-cubic',
      once: true,
      offset: 40
    });
  }

  /* ---------- Footer Year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* ---------- Sticky Navbar Shadow on Scroll (matches landing page) ---------- */
  var navbar = document.getElementById('mainNavbar');
  function handleNavbarScroll() {
    if (window.scrollY > 40) {
      navbar.classList.add('oc-scrolled');
    } else {
      navbar.classList.remove('oc-scrolled');
    }
  }
  if (navbar) {
    handleNavbarScroll();
    window.addEventListener('scroll', handleNavbarScroll);
  }

  /* ---------- Auto-close Mobile Menu on Link Click ---------- */
  var navMenu = document.getElementById('navMenu');
  var navLinks = navMenu ? navMenu.querySelectorAll('.nav-link, .oc-nav-actions .btn') : [];
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      if (navMenu.classList.contains('show') && window.bootstrap) {
        var bsCollapse = bootstrap.Collapse.getOrCreateInstance(navMenu);
        bsCollapse.hide();
      }
    });
  });

  /* ---------- Back to Top Button ---------- */
  var backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      backToTop.classList.toggle('oc-visible', window.scrollY > 500);
    });
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* =========================================================
     STEP NAVIGATION — Role Selection <-> Forms
  ========================================================= */
  var roleSelect = document.getElementById('roleSelect');
  var customerSection = document.getElementById('customerFormSection');
  var providerSection = document.getElementById('providerFormSection');

  var allPanels = [roleSelect, customerSection, providerSection];

  function showPanel(panelToShow) {
    allPanels.forEach(function (panel) {
      if (!panel) return;
      panel.classList.toggle('d-none', panel !== panelToShow);
    });
    // Scroll to the top of the form area for a clean transition on mobile.
    window.scrollTo({ top: panelToShow.offsetTop - 100, behavior: 'smooth' });
    if (window.AOS) {
      window.AOS.refreshHard();
    }
  }

  var chooseCustomerBtn = document.getElementById('chooseCustomerBtn');
  var chooseProviderBtn = document.getElementById('chooseProviderBtn');

  if (chooseCustomerBtn) {
    chooseCustomerBtn.addEventListener('click', function () {
      showPanel(customerSection);
    });
  }
  if (chooseProviderBtn) {
    chooseProviderBtn.addEventListener('click', function () {
      showPanel(providerSection);
    });
  }

  document.querySelectorAll('.oc-back-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showPanel(roleSelect);
    });
  });

  /* =========================================================
     SHOW / HIDE PASSWORD (applies to every toggle on the page)
  ========================================================= */
  document.querySelectorAll('.oc-password-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetId = btn.getAttribute('data-target');
      var input = document.getElementById(targetId);
      var icon = btn.querySelector('i');
      var isHidden = input.type === 'password';

      input.type = isHidden ? 'text' : 'password';
      icon.classList.toggle('fa-eye', !isHidden);
      icon.classList.toggle('fa-eye-slash', isHidden);

      btn.setAttribute('aria-pressed', String(isHidden));
      btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    });
  });

  /* =========================================================
     FILE UPLOAD — reflect the chosen filename on the visible label
  ========================================================= */
  function wireFileUpload(inputId, labelId, defaultText) {
    var input = document.getElementById(inputId);
    var label = document.getElementById(labelId);
    if (!input || !label) return;

    input.addEventListener('change', function () {
      var span = label.querySelector('span');
      if (input.files && input.files.length > 0) {
        span.textContent = input.files[0].name;
        label.classList.add('oc-file-selected');
      } else {
        span.textContent = defaultText;
        label.classList.remove('oc-file-selected');
      }
      if (input.classList.contains('is-invalid') || input.classList.contains('is-valid')) {
        validateFileInput(input);
      }
    });
  }

  wireFileUpload('provCitizenship', 'provCitizenshipLabel', 'Choose file — JPG, PNG or PDF');
  wireFileUpload('provPhoto', 'provPhotoLabel', 'Choose file — JPG or PNG');

  /* =========================================================
     SHARED VALIDATION HELPERS
  ========================================================= */

  function isValidEmail(value) {
    var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(value.trim());
  }

  function isValidPhone(value) {
    // Accepts a 10-digit local number (common for Nepali mobile numbers),
    // optionally prefixed with +977 and/or spaces/dashes.
    var cleaned = value.trim().replace(/[\s-]/g, '');
    var pattern = /^(?:\+977)?[9][6-9]\d{8}$|^\d{10}$/;
    return pattern.test(cleaned);
  }

  function setFieldValidity(input, valid) {
    input.classList.toggle('is-valid', valid);
    input.classList.toggle('is-invalid', !valid);
  }

  function validateRequiredText(input, minLength) {
    var valid = input.value.trim().length >= (minLength || 1);
    setFieldValidity(input, valid);
    return valid;
  }

  function validateEmailField(input) {
    var valid = isValidEmail(input.value);
    setFieldValidity(input, valid);
    return valid;
  }

  function validatePhoneField(input) {
    var valid = isValidPhone(input.value);
    setFieldValidity(input, valid);
    return valid;
  }

  function validatePasswordField(input) {
    var valid = input.value.length >= 8;
    setFieldValidity(input, valid);
    return valid;
  }

  function validateConfirmField(passwordInput, confirmInput) {
    var valid = confirmInput.value.length > 0 && confirmInput.value === passwordInput.value;
    setFieldValidity(confirmInput, valid);
    return valid;
  }

  function validateSelectField(select) {
    var valid = select.value !== '';
    setFieldValidity(select, valid);
    return valid;
  }

  function validateNumberField(input, min, max) {
    var value = input.value.trim();
    var num = Number(value);
    var valid = value !== '' && !isNaN(num) && num >= min && num <= max;
    setFieldValidity(input, valid);
    return valid;
  }

  function validateFileInput(input) {
    var valid = input.files && input.files.length > 0;
    input.classList.toggle('is-valid', valid);
    input.classList.toggle('is-invalid', !valid);
    var feedback = document.getElementById(input.getAttribute('aria-describedby'));
    if (feedback) {
      feedback.classList.toggle('d-block', !valid);
    }
    return valid;
  }

  function validateCheckbox(input) {
    var valid = input.checked;
    setFieldValidity(input, valid);
    return valid;
  }

  /* Wires "live" re-validation: once a field has been touched (shows a
     valid/invalid state), keep re-checking it as the user types/blurs. */
  function wireLiveValidation(input, validateFn) {
    input.addEventListener('input', function () {
      if (input.classList.contains('is-invalid') || input.classList.contains('is-valid')) {
        validateFn();
      }
    });
    input.addEventListener('blur', validateFn);
  }

  /* =========================================================
     CUSTOMER FORM
  ========================================================= */
  var customerForm = document.getElementById('customerForm');
  var custFullName = document.getElementById('custFullName');
  var custEmail = document.getElementById('custEmail');
  var custPhone = document.getElementById('custPhone');
  var custPassword = document.getElementById('custPassword');
  var custConfirmPassword = document.getElementById('custConfirmPassword');
  var custAgreeTerms = document.getElementById('custAgreeTerms');
  var customerSuccessAlert = document.getElementById('customerSuccessAlert');

  wireLiveValidation(custFullName, function () { return validateRequiredText(custFullName, 3); });
  wireLiveValidation(custEmail, function () { return validateEmailField(custEmail); });
  wireLiveValidation(custPhone, function () { return validatePhoneField(custPhone); });
  wireLiveValidation(custPassword, function () {
    var valid = validatePasswordField(custPassword);
    if (custConfirmPassword.value.length > 0) {
      validateConfirmField(custPassword, custConfirmPassword);
    }
    return valid;
  });
  wireLiveValidation(custConfirmPassword, function () { return validateConfirmField(custPassword, custConfirmPassword); });
  custAgreeTerms.addEventListener('change', function () { validateCheckbox(custAgreeTerms); });

  function setSubmitLoading(form, isLoading, loadingText, idleText) {
    var btn = form.querySelector('.oc-form-submit');
    var btnText = btn.querySelector('.oc-btn-text');
    var btnSpinner = btn.querySelector('.oc-btn-spinner');
    btn.disabled = isLoading;
    btnText.textContent = isLoading ? loadingText : idleText;
    btnSpinner.classList.toggle('d-none', !isLoading);
  }

  customerForm.addEventListener('submit', function (event) {
    event.preventDefault();
    event.stopPropagation();
    customerSuccessAlert.classList.add('d-none');

    var nameValid = validateRequiredText(custFullName, 3);
    var emailValid = validateEmailField(custEmail);
    var phoneValid = validatePhoneField(custPhone);
    var passwordValid = validatePasswordField(custPassword);
    var confirmValid = validateConfirmField(custPassword, custConfirmPassword);
    var termsValid = validateCheckbox(custAgreeTerms);

    customerForm.classList.add('was-validated');

    var allValid = nameValid && emailValid && phoneValid && passwordValid && confirmValid && termsValid;

    if (!allValid) {
      var firstInvalid = customerForm.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // ---- Mock registration flow (no backend wired up yet) ----
    setSubmitLoading(customerForm, true, 'Creating Account...', 'Create Customer Account');

    window.setTimeout(function () {
      setSubmitLoading(customerForm, false, 'Creating Account...', 'Create Customer Account');
      customerSuccessAlert.classList.remove('d-none');
      customerSuccessAlert.scrollIntoView({ behavior: 'smooth', block: 'start' });

      customerForm.reset();
      customerForm.classList.remove('was-validated');
      [custFullName, custEmail, custPhone, custPassword, custConfirmPassword].forEach(function (input) {
        input.classList.remove('is-valid', 'is-invalid');
      });
      custAgreeTerms.classList.remove('is-valid', 'is-invalid');
    }, 1500);
  });

  /* =========================================================
     PROVIDER FORM
  ========================================================= */
  var providerForm = document.getElementById('providerForm');
  var provFullName = document.getElementById('provFullName');
  var provEmail = document.getElementById('provEmail');
  var provPhone = document.getElementById('provPhone');
  var provCategory = document.getElementById('provCategory');
  var provPassword = document.getElementById('provPassword');
  var provConfirmPassword = document.getElementById('provConfirmPassword');
  var provExperience = document.getElementById('provExperience');
  var provAddress = document.getElementById('provAddress');
  var provBio = document.getElementById('provBio');
  var provCitizenship = document.getElementById('provCitizenship');
  var provPhoto = document.getElementById('provPhoto');
  var provAgreeTerms = document.getElementById('provAgreeTerms');
  var providerSuccessAlert = document.getElementById('providerSuccessAlert');

  wireLiveValidation(provFullName, function () { return validateRequiredText(provFullName, 3); });
  wireLiveValidation(provEmail, function () { return validateEmailField(provEmail); });
  wireLiveValidation(provPhone, function () { return validatePhoneField(provPhone); });
  provCategory.addEventListener('change', function () { validateSelectField(provCategory); });
  wireLiveValidation(provPassword, function () {
    var valid = validatePasswordField(provPassword);
    if (provConfirmPassword.value.length > 0) {
      validateConfirmField(provPassword, provConfirmPassword);
    }
    return valid;
  });
  wireLiveValidation(provConfirmPassword, function () { return validateConfirmField(provPassword, provConfirmPassword); });
  wireLiveValidation(provExperience, function () { return validateNumberField(provExperience, 0, 60); });
  wireLiveValidation(provAddress, function () { return validateRequiredText(provAddress, 5); });
  wireLiveValidation(provBio, function () { return validateRequiredText(provBio, 20); });
  provAgreeTerms.addEventListener('change', function () { validateCheckbox(provAgreeTerms); });

  providerForm.addEventListener('submit', function (event) {
    event.preventDefault();
    event.stopPropagation();
    providerSuccessAlert.classList.add('d-none');

    var nameValid = validateRequiredText(provFullName, 3);
    var emailValid = validateEmailField(provEmail);
    var phoneValid = validatePhoneField(provPhone);
    var categoryValid = validateSelectField(provCategory);
    var passwordValid = validatePasswordField(provPassword);
    var confirmValid = validateConfirmField(provPassword, provConfirmPassword);
    var experienceValid = validateNumberField(provExperience, 0, 60);
    var addressValid = validateRequiredText(provAddress, 5);
    var bioValid = validateRequiredText(provBio, 20);
    var citizenshipValid = validateFileInput(provCitizenship);
    var photoValid = validateFileInput(provPhoto);
    var termsValid = validateCheckbox(provAgreeTerms);

    providerForm.classList.add('was-validated');

    var allValid = nameValid && emailValid && phoneValid && categoryValid && passwordValid &&
      confirmValid && experienceValid && addressValid && bioValid && citizenshipValid &&
      photoValid && termsValid;

    if (!allValid) {
      var firstInvalid = providerForm.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // ---- Mock application flow (no backend wired up yet) ----
    setSubmitLoading(providerForm, true, 'Creating Account...', 'Apply as Provider');

    window.setTimeout(function () {
      setSubmitLoading(providerForm, false, 'Creating Account...', 'Apply as Provider');
      providerSuccessAlert.classList.remove('d-none');
      providerSuccessAlert.scrollIntoView({ behavior: 'smooth', block: 'start' });

      providerForm.reset();
      providerForm.classList.remove('was-validated');
      [provFullName, provEmail, provPhone, provCategory, provPassword, provConfirmPassword,
        provExperience, provAddress, provBio, provCitizenship, provPhoto].forEach(function (input) {
        input.classList.remove('is-valid', 'is-invalid');
      });
      provAgreeTerms.classList.remove('is-valid', 'is-invalid');

      // Reset file upload labels back to their default text.
      document.getElementById('provCitizenshipLabel').querySelector('span').textContent = 'Choose file — JPG, PNG or PDF';
      document.getElementById('provCitizenshipLabel').classList.remove('oc-file-selected');
      document.getElementById('provPhotoLabel').querySelector('span').textContent = 'Choose file — JPG or PNG';
      document.getElementById('provPhotoLabel').classList.remove('oc-file-selected');
    }, 1500);
  });

});