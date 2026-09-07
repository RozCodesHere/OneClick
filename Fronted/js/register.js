/* =========================================================
   ONECLICK — REGISTER PAGE JAVASCRIPT
   Role-Based Registration Flow

   Handles:
     - AOS initialization
     - Sticky navbar
     - Back-to-top button
     - Customer / Provider role selection
     - Password show/hide
     - File upload labels
     - Client-side validation
     - Customer registration through Django API
     - Provider form validation
     - Bootstrap validation styling

   Backend:
     Customer registration:
     POST http://127.0.0.1:8000/api/users/register/

========================================================= */

document.addEventListener('DOMContentLoaded', function () {


  /* =========================================================
     INIT AOS
  ========================================================= */

  if (window.AOS) {

    AOS.init({
      duration: 650,
      easing: 'ease-out-cubic',
      once: true,
      offset: 40
    });

  }


  /* =========================================================
     FOOTER YEAR
  ========================================================= */

  var yearEl = document.getElementById('year');

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }


  /* =========================================================
     STICKY NAVBAR SHADOW ON SCROLL
  ========================================================= */

  var navbar = document.getElementById('mainNavbar');

  function handleNavbarScroll() {

    if (!navbar) {
      return;
    }

    if (window.scrollY > 40) {

      navbar.classList.add('oc-scrolled');

    } else {

      navbar.classList.remove('oc-scrolled');

    }

  }

  if (navbar) {

    handleNavbarScroll();

    window.addEventListener(
      'scroll',
      handleNavbarScroll
    );

  }


  /* =========================================================
     AUTO-CLOSE MOBILE MENU
  ========================================================= */

  var navMenu = document.getElementById('navMenu');

  var navLinks = navMenu
    ? navMenu.querySelectorAll(
        '.nav-link, .oc-nav-actions .btn'
      )
    : [];

  navLinks.forEach(function (link) {

    link.addEventListener('click', function () {

      if (
        navMenu.classList.contains('show') &&
        window.bootstrap
      ) {

        var bsCollapse =
          bootstrap.Collapse.getOrCreateInstance(
            navMenu
          );

        bsCollapse.hide();

      }

    });

  });


  /* =========================================================
     BACK TO TOP BUTTON
  ========================================================= */

  var backToTop =
    document.getElementById('backToTop');

  if (backToTop) {

    window.addEventListener(
      'scroll',
      function () {

        backToTop.classList.toggle(
          'oc-visible',
          window.scrollY > 500
        );

      }
    );

    backToTop.addEventListener(
      'click',
      function () {

        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });

      }
    );

  }


  /* =========================================================
     STEP NAVIGATION
     
     Role Selection
          ↓
     Customer Form
          OR
     Provider Form
  ========================================================= */

  var roleSelect =
    document.getElementById('roleSelect');

  var customerSection =
    document.getElementById(
      'customerFormSection'
    );

  var providerSection =
    document.getElementById(
      'providerFormSection'
    );

  var allPanels = [
    roleSelect,
    customerSection,
    providerSection
  ];


  function showPanel(panelToShow) {

    allPanels.forEach(function (panel) {

      if (!panel) {
        return;
      }

      panel.classList.toggle(
        'd-none',
        panel !== panelToShow
      );

    });


    /* Scroll to form area */

    if (panelToShow) {

      window.scrollTo({
        top: panelToShow.offsetTop - 100,
        behavior: 'smooth'
      });

    }


    /* Refresh AOS */

    if (window.AOS) {
      window.AOS.refreshHard();
    }

  }


  /* =========================================================
     CUSTOMER ROLE BUTTON
  ========================================================= */

  var chooseCustomerBtn =
    document.getElementById(
      'chooseCustomerBtn'
    );

  if (chooseCustomerBtn) {

    chooseCustomerBtn.addEventListener(
      'click',
      function () {

        showPanel(customerSection);

      }
    );

  }


  /* =========================================================
     PROVIDER ROLE BUTTON
  ========================================================= */

  var chooseProviderBtn =
    document.getElementById(
      'chooseProviderBtn'
    );

  if (chooseProviderBtn) {

    chooseProviderBtn.addEventListener(
      'click',
      function () {

        showPanel(providerSection);

      }
    );

  }


  /* =========================================================
     BACK BUTTONS
  ========================================================= */

  document
    .querySelectorAll('.oc-back-btn')
    .forEach(function (btn) {

      btn.addEventListener(
        'click',
        function () {

          showPanel(roleSelect);

        }
      );

    });


  /* =========================================================
     SHOW / HIDE PASSWORD
  ========================================================= */

  document
    .querySelectorAll('.oc-password-toggle')
    .forEach(function (btn) {

      btn.addEventListener(
        'click',
        function () {

          var targetId =
            btn.getAttribute('data-target');

          var input =
            document.getElementById(targetId);

          var icon =
            btn.querySelector('i');


          if (!input || !icon) {
            return;
          }


          var isHidden =
            input.type === 'password';


          input.type =
            isHidden
              ? 'text'
              : 'password';


          icon.classList.toggle(
            'fa-eye',
            !isHidden
          );

          icon.classList.toggle(
            'fa-eye-slash',
            isHidden
          );


          btn.setAttribute(
            'aria-pressed',
            String(isHidden)
          );


          btn.setAttribute(
            'aria-label',
            isHidden
              ? 'Hide password'
              : 'Show password'
          );

        }
      );

    });


  /* =========================================================
     FILE UPLOAD
  ========================================================= */

  function wireFileUpload(
    inputId,
    labelId,
    defaultText
  ) {

    var input =
      document.getElementById(inputId);

    var label =
      document.getElementById(labelId);


    if (!input || !label) {
      return;
    }


    input.addEventListener(
      'change',
      function () {

        var span =
          label.querySelector('span');


        if (
          input.files &&
          input.files.length > 0
        ) {

          span.textContent =
            input.files[0].name;

          label.classList.add(
            'oc-file-selected'
          );

        } else {

          span.textContent =
            defaultText;

          label.classList.remove(
            'oc-file-selected'
          );

        }


        if (
          input.classList.contains(
            'is-invalid'
          ) ||
          input.classList.contains(
            'is-valid'
          )
        ) {

          validateFileInput(input);

        }

      }
    );

  }


  wireFileUpload(
    'provCitizenship',
    'provCitizenshipLabel',
    'Choose file — JPG, PNG or PDF'
  );


  wireFileUpload(
    'provPhoto',
    'provPhotoLabel',
    'Choose file — JPG or PNG'
  );


  /* =========================================================
     VALIDATION HELPERS
  ========================================================= */


  /* ---------- Email ---------- */

  function isValidEmail(value) {

    var pattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return pattern.test(
      value.trim()
    );

  }


  /* ---------- Phone ---------- */

  function isValidPhone(value) {

    var cleaned =
      value
        .trim()
        .replace(/[\s-]/g, '');


    /*
      Accept:
        9812345678
        +9779812345678
    */

    var pattern =
      /^(?:\+977)?[9][6-9]\d{8}$/;


    return pattern.test(cleaned);

  }


  /* ---------- Field validity ---------- */

  function setFieldValidity(
    input,
    valid
  ) {

    if (!input) {
      return;
    }

    input.classList.toggle(
      'is-valid',
      valid
    );

    input.classList.toggle(
      'is-invalid',
      !valid
    );

  }


  /* ---------- Required text ---------- */

  function validateRequiredText(
    input,
    minLength
  ) {

    if (!input) {
      return false;
    }

    var valid =
      input.value.trim().length >=
      (minLength || 1);


    setFieldValidity(
      input,
      valid
    );


    return valid;

  }


  /* ---------- Email validation ---------- */

  function validateEmailField(input) {

    if (!input) {
      return false;
    }

    var valid =
      isValidEmail(input.value);


    setFieldValidity(
      input,
      valid
    );


    return valid;

  }


  /* ---------- Phone validation ---------- */

  function validatePhoneField(input) {

    if (!input) {
      return false;
    }

    var valid =
      isValidPhone(input.value);


    setFieldValidity(
      input,
      valid
    );


    return valid;

  }


  /* ---------- Password validation ---------- */

  function validatePasswordField(input) {

    if (!input) {
      return false;
    }

    var valid =
      input.value.length >= 8;


    setFieldValidity(
      input,
      valid
    );


    return valid;

  }


  /* ---------- Confirm password ---------- */

  function validateConfirmField(
    passwordInput,
    confirmInput
  ) {

    if (
      !passwordInput ||
      !confirmInput
    ) {

      return false;

    }


    var valid =
      confirmInput.value.length > 0 &&
      confirmInput.value ===
      passwordInput.value;


    setFieldValidity(
      confirmInput,
      valid
    );


    return valid;

  }


  /* ---------- Select ---------- */

  function validateSelectField(select) {

    if (!select) {
      return false;
    }

    var valid =
      select.value !== '';


    setFieldValidity(
      select,
      valid
    );


    return valid;

  }


  /* ---------- Number ---------- */

  function validateNumberField(
    input,
    min,
    max
  ) {

    if (!input) {
      return false;
    }


    var value =
      input.value.trim();


    var num =
      Number(value);


    var valid =
      value !== '' &&
      !isNaN(num) &&
      num >= min &&
      num <= max;


    setFieldValidity(
      input,
      valid
    );


    return valid;

  }


  /* ---------- File ---------- */

  function validateFileInput(input) {

    if (!input) {
      return false;
    }


    var valid =
      input.files &&
      input.files.length > 0;


    input.classList.toggle(
      'is-valid',
      valid
    );

    input.classList.toggle(
      'is-invalid',
      !valid
    );


    var feedback =
      document.getElementById(
        input.getAttribute(
          'aria-describedby'
        )
      );


    if (feedback) {

      feedback.classList.toggle(
        'd-block',
        !valid
      );

    }


    return valid;

  }


  /* ---------- Checkbox ---------- */

  function validateCheckbox(input) {

    if (!input) {
      return false;
    }


    var valid =
      input.checked;


    setFieldValidity(
      input,
      valid
    );


    return valid;

  }


  /* =========================================================
     LIVE VALIDATION
  ========================================================= */

  function wireLiveValidation(
    input,
    validateFn
  ) {

    if (!input) {
      return;
    }


    input.addEventListener(
      'input',
      function () {

        if (
          input.classList.contains(
            'is-invalid'
          ) ||
          input.classList.contains(
            'is-valid'
          )
        ) {

          validateFn();

        }

      }
    );


    input.addEventListener(
      'blur',
      validateFn
    );

  }


  /* =========================================================
     SUBMIT BUTTON LOADING
  ========================================================= */

  function setSubmitLoading(
    form,
    isLoading,
    loadingText,
    idleText
  ) {

    if (!form) {
      return;
    }


    var btn =
      form.querySelector(
        '.oc-form-submit'
      );


    if (!btn) {
      return;
    }


    var btnText =
      btn.querySelector(
        '.oc-btn-text'
      );


    var btnSpinner =
      btn.querySelector(
        '.oc-btn-spinner'
      );


    btn.disabled =
      isLoading;


    if (btnText) {

      btnText.textContent =
        isLoading
          ? loadingText
          : idleText;

    }


    if (btnSpinner) {

      btnSpinner.classList.toggle(
        'd-none',
        !isLoading
      );

    }

  }


  /* =========================================================
     CUSTOMER FORM
  ========================================================= */

  var customerForm =
    document.getElementById(
      'customerForm'
    );


  var custFirstName =
    document.getElementById(
      'custFirstName'
    );


  var custLastName =
    document.getElementById(
      'custLastName'
    );


  var custEmail =
    document.getElementById(
      'custEmail'
    );


  var custPhone =
    document.getElementById(
      'custPhone'
    );


  var custPassword =
    document.getElementById(
      'custPassword'
    );


  var custConfirmPassword =
    document.getElementById(
      'custConfirmPassword'
    );


  var custAgreeTerms =
    document.getElementById(
      'custAgreeTerms'
    );


  var customerSuccessAlert =
    document.getElementById(
      'customerSuccessAlert'
    );


  /* =========================================================
     CUSTOMER LIVE VALIDATION
  ========================================================= */

  wireLiveValidation(
    custFirstName,
    function () {

      return validateRequiredText(
        custFirstName,
        2
      );

    }
  );


  wireLiveValidation(
    custLastName,
    function () {

      return validateRequiredText(
        custLastName,
        2
      );

    }
  );


  wireLiveValidation(
    custEmail,
    function () {

      return validateEmailField(
        custEmail
      );

    }
  );


  wireLiveValidation(
    custPhone,
    function () {

      return validatePhoneField(
        custPhone
      );

    }
  );


  wireLiveValidation(
    custPassword,
    function () {

      var valid =
        validatePasswordField(
          custPassword
        );


      if (
        custConfirmPassword &&
        custConfirmPassword.value.length > 0
      ) {

        validateConfirmField(
          custPassword,
          custConfirmPassword
        );

      }


      return valid;

    }
  );


  wireLiveValidation(
    custConfirmPassword,
    function () {

      return validateConfirmField(
        custPassword,
        custConfirmPassword
      );

    }
  );


  if (custAgreeTerms) {

    custAgreeTerms.addEventListener(
      'change',
      function () {

        validateCheckbox(
          custAgreeTerms
        );

      }
    );

  }


  /* =========================================================
     CUSTOMER FORM SUBMIT
     
     This sends the registration data
     to Django REST Framework.
  ========================================================= */

  if (customerForm) {

    customerForm.addEventListener(
      'submit',
      function (event) {

        event.preventDefault();

        event.stopPropagation();


        /* Hide previous success message */

        if (customerSuccessAlert) {

          customerSuccessAlert.classList.add(
            'd-none'
          );

        }


        /* ---------- Validate fields ---------- */

        var firstNameValid =
          validateRequiredText(
            custFirstName,
            2
          );


        var lastNameValid =
          validateRequiredText(
            custLastName,
            2
          );


        var emailValid =
          validateEmailField(
            custEmail
          );


        var phoneValid =
          validatePhoneField(
            custPhone
          );


        var passwordValid =
          validatePasswordField(
            custPassword
          );


        var confirmValid =
          validateConfirmField(
            custPassword,
            custConfirmPassword
          );


        var termsValid =
          validateCheckbox(
            custAgreeTerms
          );


        customerForm.classList.add(
          'was-validated'
        );


        /* ---------- Check all fields ---------- */

        var allValid =
          firstNameValid &&
          lastNameValid &&
          emailValid &&
          phoneValid &&
          passwordValid &&
          confirmValid &&
          termsValid;


        if (!allValid) {

          var firstInvalid =
            customerForm.querySelector(
              '.is-invalid'
            );


          if (firstInvalid) {

            firstInvalid.focus();

          }


          return;

        }


        /* =====================================================
           REAL DJANGO REGISTRATION
        ===================================================== */

        setSubmitLoading(
          customerForm,
          true,
          'Creating Account...',
          'Create Customer Account'
        );


        fetch(
          'http://127.0.0.1:8000/api/users/register/',
          {

            method: 'POST',

            headers: {

              'Content-Type':
                'application/json'

            },

          body: JSON.stringify({

  first_name:
    custFirstName.value.trim(),

  last_name:
    custLastName.value.trim(),

  email:
    custEmail.value.trim(),

  phone:
    custPhone.value.trim(),

  password:
    custPassword.value

})

          }
        )


        /* =====================================================
           HANDLE DJANGO RESPONSE
        ===================================================== */

        .then(
  async function (response) {

    // Read the response as plain text first
    var responseText = await response.text();

    console.log("Django status:", response.status);
    console.log("Django response:", responseText);

    // Try to convert response into JSON
    var data;

    try {
      data = JSON.parse(responseText);
    } catch (error) {
      throw new Error(
        "Django returned something that is not JSON. Check the browser console."
      );
    }

    // Handle Django validation errors
    if (!response.ok) {
      throw new Error(
        data.email?.[0] ||
        data.password?.[0] ||
        data.first_name?.[0] ||
        data.last_name?.[0] ||
        data.phone?.[0] ||
        data.detail ||
        "Registration failed."
      );
    }

    return data;
  }
)


        /* =====================================================
           REGISTRATION SUCCESS
        ===================================================== */

        .then(
          function (data) {

            console.log(
              'Registration successful:',
              data
            );


            setSubmitLoading(
              customerForm,
              false,
              'Creating Account...',
              'Create Customer Account'
            );


            /* Show success message */

            if (customerSuccessAlert) {

              customerSuccessAlert.classList.remove(
                'd-none'
              );


              customerSuccessAlert.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });

            }


            /* Reset form */

            customerForm.reset();


            customerForm.classList.remove(
              'was-validated'
            );


            /* Remove validation styling */

            [
              custFirstName,
              custLastName,
              custEmail,
              custPhone,
              custPassword,
              custConfirmPassword
            ].forEach(
              function (input) {

                if (input) {

                  input.classList.remove(
                    'is-valid',
                    'is-invalid'
                  );

                }

              }
            );


            if (custAgreeTerms) {

              custAgreeTerms.classList.remove(
                'is-valid',
                'is-invalid'
              );

            }

          }
        )


        /* =====================================================
           REGISTRATION ERROR
        ===================================================== */

        .catch(
          function (error) {

            console.error(
              'Registration error:',
              error
            );


            setSubmitLoading(
              customerForm,
              false,
              'Creating Account...',
              'Create Customer Account'
            );


            alert(
              error.message ||
              'Something went wrong during registration.'
            );

          }
        );

      }
    );

  }


  /* =========================================================
     PROVIDER FORM
     
     Provider backend integration will be connected later.
  ========================================================= */

  var providerForm =
    document.getElementById(
      'providerForm'
    );


  var provFullName =
    document.getElementById(
      'provFullName'
    );


  var provEmail =
    document.getElementById(
      'provEmail'
    );


  var provPhone =
    document.getElementById(
      'provPhone'
    );


  var provCategory =
    document.getElementById(
      'provCategory'
    );


  var provPassword =
    document.getElementById(
      'provPassword'
    );


  var provConfirmPassword =
    document.getElementById(
      'provConfirmPassword'
    );


  var provExperience =
    document.getElementById(
      'provExperience'
    );


  var provAddress =
    document.getElementById(
      'provAddress'
    );


  var provBio =
    document.getElementById(
      'provBio'
    );


  var provCitizenship =
    document.getElementById(
      'provCitizenship'
    );


  var provPhoto =
    document.getElementById(
      'provPhoto'
    );


  var provAgreeTerms =
    document.getElementById(
      'provAgreeTerms'
    );


  var providerSuccessAlert =
    document.getElementById(
      'providerSuccessAlert'
    );


  /* =========================================================
     PROVIDER LIVE VALIDATION
  ========================================================= */

  wireLiveValidation(
    provFullName,
    function () {

      return validateRequiredText(
        provFullName,
        3
      );

    }
  );


  wireLiveValidation(
    provEmail,
    function () {

      return validateEmailField(
        provEmail
      );

    }
  );


  wireLiveValidation(
    provPhone,
    function () {

      return validatePhoneField(
        provPhone
      );

    }
  );


  if (provCategory) {

    provCategory.addEventListener(
      'change',
      function () {

        validateSelectField(
          provCategory
        );

      }
    );

  }


  wireLiveValidation(
    provPassword,
    function () {

      var valid =
        validatePasswordField(
          provPassword
        );


      if (
        provConfirmPassword &&
        provConfirmPassword.value.length > 0
      ) {

        validateConfirmField(
          provPassword,
          provConfirmPassword
        );

      }


      return valid;

    }
  );


  wireLiveValidation(
    provConfirmPassword,
    function () {

      return validateConfirmField(
        provPassword,
        provConfirmPassword
      );

    }
  );


  wireLiveValidation(
    provExperience,
    function () {

      return validateNumberField(
        provExperience,
        0,
        60
      );

    }
  );


  wireLiveValidation(
    provAddress,
    function () {

      return validateRequiredText(
        provAddress,
        5
      );

    }
  );


  wireLiveValidation(
    provBio,
    function () {

      return validateRequiredText(
        provBio,
        20
      );

    }
  );


  if (provAgreeTerms) {

    provAgreeTerms.addEventListener(
      'change',
      function () {

        validateCheckbox(
          provAgreeTerms
        );

      }
    );

  }


  /* =========================================================
     PROVIDER FORM SUBMIT
     
     Still frontend-only for now.
  ========================================================= */

  if (providerForm) {

    providerForm.addEventListener(
      'submit',
      function (event) {

        event.preventDefault();

        event.stopPropagation();


        if (providerSuccessAlert) {

          providerSuccessAlert.classList.add(
            'd-none'
          );

        }


        /* ---------- Validate fields ---------- */

        var nameValid =
          validateRequiredText(
            provFullName,
            3
          );


        var emailValid =
          validateEmailField(
            provEmail
          );


        var phoneValid =
          validatePhoneField(
            provPhone
          );


        var categoryValid =
          validateSelectField(
            provCategory
          );


        var passwordValid =
          validatePasswordField(
            provPassword
          );


        var confirmValid =
          validateConfirmField(
            provPassword,
            provConfirmPassword
          );


        var experienceValid =
          validateNumberField(
            provExperience,
            0,
            60
          );


        var addressValid =
          validateRequiredText(
            provAddress,
            5
          );


        var bioValid =
          validateRequiredText(
            provBio,
            20
          );


        var citizenshipValid =
          validateFileInput(
            provCitizenship
          );


        var photoValid =
          validateFileInput(
            provPhoto
          );


        var termsValid =
          validateCheckbox(
            provAgreeTerms
          );


        providerForm.classList.add(
          'was-validated'
        );


        var allValid =
          nameValid &&
          emailValid &&
          phoneValid &&
          categoryValid &&
          passwordValid &&
          confirmValid &&
          experienceValid &&
          addressValid &&
          bioValid &&
          citizenshipValid &&
          photoValid &&
          termsValid;


        if (!allValid) {

          var firstInvalid =
            providerForm.querySelector(
              '.is-invalid'
            );


          if (firstInvalid) {

            firstInvalid.focus();

          }


          return;

        }


        /* =====================================================
           MOCK PROVIDER APPLICATION
           
           Provider backend integration comes later.
        ===================================================== */

        setSubmitLoading(
          providerForm,
          true,
          'Creating Account...',
          'Apply as Provider'
        );


        window.setTimeout(
          function () {

            setSubmitLoading(
              providerForm,
              false,
              'Creating Account...',
              'Apply as Provider'
            );


            if (providerSuccessAlert) {

              providerSuccessAlert.classList.remove(
                'd-none'
              );


              providerSuccessAlert.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });

            }


            providerForm.reset();


            providerForm.classList.remove(
              'was-validated'
            );


            [
              provFullName,
              provEmail,
              provPhone,
              provCategory,
              provPassword,
              provConfirmPassword,
              provExperience,
              provAddress,
              provBio,
              provCitizenship,
              provPhoto
            ].forEach(
              function (input) {

                if (input) {

                  input.classList.remove(
                    'is-valid',
                    'is-invalid'
                  );

                }

              }
            );


            if (provAgreeTerms) {

              provAgreeTerms.classList.remove(
                'is-valid',
                'is-invalid'
              );

            }


            /* Reset citizenship label */

            var citizenshipLabel =
              document.getElementById(
                'provCitizenshipLabel'
              );


            if (citizenshipLabel) {

              citizenshipLabel
                .querySelector('span')
                .textContent =
                  'Choose file — JPG, PNG or PDF';


              citizenshipLabel.classList.remove(
                'oc-file-selected'
              );

            }


            /* Reset profile photo label */

            var photoLabel =
              document.getElementById(
                'provPhotoLabel'
              );


            if (photoLabel) {

              photoLabel
                .querySelector('span')
                .textContent =
                  'Choose file — JPG or PNG';


              photoLabel.classList.remove(
                'oc-file-selected'
              );

            }

          },
          1500
        );

      }
    );

  }


});