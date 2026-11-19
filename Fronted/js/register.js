/*
=========================================================
ONECLICK — REGISTER PAGE JAVASCRIPT

Handles:
- AOS initialization
- Sticky navbar
- Back-to-top button
- Customer / Provider role selection
- Password show/hide
- File upload labels
- Client-side validation
- Customer registration
- Provider registration + onboarding
- Dynamic service categories
- Bootstrap validation styling

Customer flow:
1. Submit customer registration
2. Backend creates account
3. Show success message
4. Redirect to login.html

Provider flow:
1. Create normal customer account
2. Login and receive JWT
3. Submit provider onboarding
4. Backend changes role to provider
5. Provider profile waits for admin verification
=========================================================
*/

document.addEventListener("DOMContentLoaded", function () {

    /* =========================================================
       API BASE
    ========================================================= */

    var API_BASE = "https://oneclick-backend-6hk7.onrender.com/api";


    /* =========================================================
       INIT AOS
    ========================================================= */

    if (window.AOS) {
        AOS.init({
            duration: 650,
            easing: "ease-out-cubic",
            once: true,
            offset: 40
        });
    }


    /* =========================================================
       FOOTER YEAR
    ========================================================= */

    var yearEl = document.getElementById("year");

    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }


    /* =========================================================
       STICKY NAVBAR
    ========================================================= */

    var navbar = document.getElementById("mainNavbar");

    function handleNavbarScroll() {

        if (!navbar) {
            return;
        }

        if (window.scrollY > 40) {
            navbar.classList.add("oc-scrolled");
        } else {
            navbar.classList.remove("oc-scrolled");
        }
    }

    if (navbar) {
        handleNavbarScroll();
        window.addEventListener("scroll", handleNavbarScroll);
    }


    /* =========================================================
       AUTO-CLOSE MOBILE MENU
    ========================================================= */

    var navMenu = document.getElementById("navMenu");

    var navLinks = navMenu
        ? navMenu.querySelectorAll(
            ".nav-link, .oc-nav-actions .btn"
        )
        : [];

    navLinks.forEach(function (link) {

        link.addEventListener("click", function () {

            if (
                navMenu &&
                navMenu.classList.contains("show") &&
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
       BACK TO TOP
    ========================================================= */

    var backToTop =
        document.getElementById("backToTop");

    if (backToTop) {

        window.addEventListener("scroll", function () {

            backToTop.classList.toggle(
                "oc-visible",
                window.scrollY > 500
            );

        });

        backToTop.addEventListener("click", function () {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        });
    }


    /* =========================================================
       ROLE / PANEL NAVIGATION
    ========================================================= */

    var roleSelect =
        document.getElementById("roleSelect");

    var customerSection =
        document.getElementById("customerFormSection");

    var providerSection =
        document.getElementById("providerFormSection");

    var allPanels = [
        roleSelect,
        customerSection,
        providerSection
    ];
var registerParams = new URLSearchParams(
    window.location.search
);

var requestedRole = registerParams.get("role");

    function showPanel(panelToShow) {

        allPanels.forEach(function (panel) {

            if (!panel) {
                return;
            }

            panel.classList.toggle(
                "d-none",
                panel !== panelToShow
            );
        });

        if (panelToShow) {

            window.scrollTo({
                top: Math.max(
                    panelToShow.offsetTop - 100,
                    0
                ),
                behavior: "smooth"
            });
        }

        if (window.AOS) {
            window.AOS.refreshHard();
        }
    }


    /* =========================================================
       CUSTOMER ROLE BUTTON
    ========================================================= */

    var chooseCustomerBtn =
        document.getElementById(
            "chooseCustomerBtn"
        );

    if (chooseCustomerBtn) {

        chooseCustomerBtn.addEventListener(
            "click",
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
            "chooseProviderBtn"
        );

    if (chooseProviderBtn) {

        chooseProviderBtn.addEventListener(
            "click",
            function () {
                showPanel(providerSection);
            }
        );
    }


    /* =========================================================
       BACK BUTTONS
    ========================================================= */

    document
        .querySelectorAll(".oc-back-btn")
        .forEach(function (btn) {

            btn.addEventListener(
                "click",
                function () {
                    showPanel(roleSelect);
                }
            );
        });

        if (requestedRole === "customer") {
    showPanel(customerSection);
}
else if (requestedRole === "provider") {
    showPanel(providerSection);
}

/* =========================================================
   OPEN REGISTRATION FORM FROM URL
   Examples:
   register.html?role=customer
   register.html?role=provider
========================================================= */

if (requestedRole === "customer") {
    showPanel(customerSection);
}

else if (requestedRole === "provider") {
    showPanel(providerSection);
}

    /* =========================================================
       SHOW / HIDE PASSWORD
    ========================================================= */

    document
        .querySelectorAll(".oc-password-toggle")
        .forEach(function (btn) {

            btn.addEventListener(
                "click",
                function () {

                    var targetId =
                        btn.getAttribute(
                            "data-target"
                        );

                    var input =
                        document.getElementById(
                            targetId
                        );

                    var icon =
                        btn.querySelector("i");

                    if (!input || !icon) {
                        return;
                    }

                    var isHidden =
                        input.type === "password";

                    input.type =
                        isHidden
                            ? "text"
                            : "password";

                    icon.classList.toggle(
                        "fa-eye",
                        !isHidden
                    );

                    icon.classList.toggle(
                        "fa-eye-slash",
                        isHidden
                    );

                    btn.setAttribute(
                        "aria-pressed",
                        String(isHidden)
                    );

                    btn.setAttribute(
                        "aria-label",
                        isHidden
                            ? "Hide password"
                            : "Show password"
                    );
                }
            );
        });


    /* =========================================================
       FILE UPLOAD LABEL
    ========================================================= */

         function wireFileUpload(inputId, labelId, defaultText) {

        var input =
            document.getElementById(inputId);

        var label =
            document.getElementById(labelId);

        if (!input || !label) {
            return;
        }

        input.addEventListener(
            "change",
            function () {

                var span =
                    label.querySelector("span");

                if (
                    input.files &&
                    input.files.length > 0
                ) {

                    if (span) {
                        span.textContent =
                            input.files[0].name;
                    }

                    label.classList.add(
                        "oc-file-selected"
                    );

                } else {

                    if (span) {
                        span.textContent =
                            defaultText;
                    }

                    label.classList.remove(
                        "oc-file-selected"
                    );
                }

                if (
                    input.classList.contains(
                        "is-invalid"
                    ) ||
                    input.classList.contains(
                        "is-valid"
                    )
                ) {
                    validateFileInput(input);
                }
            }
        );
    }


    wireFileUpload(
        "provCitizenship",
        "provCitizenshipLabel",
        "Choose file — JPG, PNG or PDF"
    );

    wireFileUpload(
        "provPhoto",
        "provPhotoLabel",
        "Choose file — JPG or PNG"
    );


    /* =========================================================
       VALIDATION HELPERS
    ========================================================= */

    function isValidEmail(value) {

        var pattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return pattern.test(
            value.trim()
        );
    }


    function isValidPhone(value) {

        var cleaned =
            value
                .trim()
                .replace(/[\s-]/g, "");

        var pattern =
            /^(?:\+977)?9[6-9]\d{8}$/;

        return pattern.test(cleaned);
    }


    function setFieldValidity(
        input,
        valid
    ) {

        if (!input) {
            return;
        }

        input.classList.toggle(
            "is-valid",
            valid
        );

        input.classList.toggle(
            "is-invalid",
            !valid
        );
    }


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


    function validateSelectField(select) {

        if (!select) {
            return false;
        }

        var valid =
            select.value !== "";

        setFieldValidity(
            select,
            valid
        );

        return valid;
    }


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
            value !== "" &&
            !isNaN(num) &&
            num >= min &&
            num <= max;

        setFieldValidity(
            input,
            valid
        );

        return valid;
    }


    function validateFileInput(input) {

        if (!input) {
            return false;
        }

        var valid =
            input.files &&
            input.files.length > 0;

        input.classList.toggle(
            "is-valid",
            valid
        );

        input.classList.toggle(
            "is-invalid",
            !valid
        );

        return valid;
    }


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
            "input",
            function () {

                if (
                    input.classList.contains(
                        "is-invalid"
                    ) ||
                    input.classList.contains(
                        "is-valid"
                    )
                ) {
                    validateFn();
                }
            }
        );

        input.addEventListener(
            "blur",
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
                ".oc-form-submit"
            );

        if (!btn) {
            return;
        }

        var btnText =
            btn.querySelector(
                ".oc-btn-text"
            );

        var btnSpinner =
            btn.querySelector(
                ".oc-btn-spinner"
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
                "d-none",
                !isLoading
            );
        }
    }


    /* =========================================================
       API ERROR HELPER
    ========================================================= */

    function getApiErrorMessage(
        data,
        fallback
    ) {

        if (!data) {
            return fallback;
        }

        if (typeof data === "string") {
            return data;
        }

        if (data.detail) {
            return data.detail;
        }

        if (data.error) {
            return data.error;
        }

        var fields = [
            "email",
            "password",
            "first_name",
            "last_name",
            "phone",
            "category",
            "experience",
            "address",
            "bio",
            "hourly_rate",
            "profile_image"
        ];

        for (
            var i = 0;
            i < fields.length;
            i++
        ) {

            var field =
                fields[i];

            if (
                data[field] &&
                Array.isArray(data[field]) &&
                data[field].length > 0
            ) {
                return data[field][0];
            }
        }

        return fallback;
    }


   

/* =========================================================
   PROVIDER SERVICES + CATEGORY FILTER
========================================================= */


var provCategory =
    document.getElementById("provCategory");

var provServices =
    document.getElementById("provServices");

var allProviderServices = [];

async function loadProviderServices() {

    if (!provServices || !provCategory) {
        return;
    }

    try {

        allProviderServices = [];

        var nextUrl = API_BASE + "/services/";

        /* ---------------------------------------------
           LOAD ALL SERVICE PAGES
        --------------------------------------------- */

        while (nextUrl) {

            var response = await fetch(nextUrl);

            var responseText = await response.text();

            console.log(
                "Services status:",
                response.status
            );

            console.log(
                "Services response:",
                responseText
            );

            if (!response.ok) {
                throw new Error(
                    "Could not load services."
                );
            }

            var data = responseText
                ? JSON.parse(responseText)
                : {};

            if (Array.isArray(data)) {

                allProviderServices =
                    allProviderServices.concat(data);

                nextUrl = null;

            } else {

                if (Array.isArray(data.results)) {

                    allProviderServices =
                        allProviderServices.concat(
                            data.results
                        );
                }

                nextUrl = data.next || null;
            }
        }

        /* ---------------------------------------------
           ONLY ACTIVE SERVICES
        --------------------------------------------- */

        allProviderServices =
            allProviderServices.filter(
                function (service) {
                    return service.is_active !== false;
                }
            );

        console.log(
            "All active provider services:",
            allProviderServices
        );

        /* ---------------------------------------------
           BUILD UNIQUE CATEGORIES
        --------------------------------------------- */

        var categories = [];

        allProviderServices.forEach(
            function (service) {

                if (
    service.category &&
    service.category_name
) {

                    var exists =
                        categories.some(
                            function (category) {
                                return (
                                   String(
    category.id
) ===
String(
    service.category
)
                                );
                            }
                        );

                    if (!exists) {

                        categories.push({
    id:
        service.category,

    name:
        service.category_name
});
                    }
                }
            }
        );

        /* ---------------------------------------------
           SORT CATEGORIES
        --------------------------------------------- */

        categories.sort(
            function (a, b) {
                return a.name.localeCompare(
                    b.name
                );
            }
        );

        /* ---------------------------------------------
           POPULATE CATEGORY DROPDOWN
        --------------------------------------------- */

        provCategory.innerHTML =
            '<option value="">Select a service category</option>';

        categories.forEach(
            function (category) {

                var option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    String(category.id);

                option.textContent =
                    category.name;

                provCategory.appendChild(
                    option
                );
            }
        );

        /* ---------------------------------------------
           CATEGORY CHANGE
        --------------------------------------------- */

        provCategory.addEventListener(
            "change",
            function () {

                validateSelectField(
                    provCategory
                );

                renderProviderServicesByCategory();
            }
        );

        console.log(
            "Provider categories loaded:",
            categories
        );

    } catch (error) {

        console.error(
            "Service loading error:",
            error
        );

        provCategory.innerHTML =
            '<option value="">Unable to load categories</option>';

        provServices.innerHTML = `
            <div class="text-danger small">
                Unable to load services.
            </div>
        `;
    }
}


/* =========================================================
   RENDER SERVICES FOR SELECTED CATEGORY
========================================================= */

function renderProviderServicesByCategory() {

    if (!provServices || !provCategory) {
        return;
    }

    var selectedCategoryId =
        provCategory.value;

    /* ---------------------------------------------
       NO CATEGORY SELECTED
    --------------------------------------------- */

    if (!selectedCategoryId) {

        provServices.innerHTML = `
            <div class="text-muted small">
                Please select a category first.
            </div>
        `;

        return;
    }

    /* ---------------------------------------------
       FILTER SERVICES
    --------------------------------------------- */

    var categoryServices =
        allProviderServices.filter(
            function (service) {

               return (
    String(
        service.category
    ) ===
    String(
        selectedCategoryId
    )
);
            }
        );

    /* ---------------------------------------------
       NO SERVICES
    --------------------------------------------- */

    if (categoryServices.length === 0) {

        provServices.innerHTML = `
            <div class="text-danger small">
                No services available in this category.
            </div>
        `;

        return;
    }

    /* ---------------------------------------------
       RENDER SERVICES
    --------------------------------------------- */

    provServices.innerHTML = "";

    categoryServices.forEach(
        function (service) {

            var wrapper =
                document.createElement(
                    "div"
                );

            wrapper.className =
                "form-check oc-service-check";

            var input =
                document.createElement(
                    "input"
                );

            input.type = "checkbox";

            input.className =
                "form-check-input";

            input.id =
                "provService_" +
                service.id;

            input.name =
                "services";

            input.value =
                String(service.id);

            input.dataset.serviceId =
                String(service.id);

            input.dataset.categoryId =
    String(service.category);

            var label =
                document.createElement(
                    "label"
                );

            label.className =
                "form-check-label";

            label.htmlFor =
                input.id;

            label.innerHTML = `
                <strong>${service.name}</strong>
                <small class="text-muted d-block">
                    ${service.category_name || ""}
                </small>
            `;

            wrapper.appendChild(input);

            wrapper.appendChild(label);

            provServices.appendChild(
                wrapper
            );

            input.addEventListener(
                "change",
                function () {
                    validateProviderServices();
                }
            );
        }
    );

    console.log(
        "Services rendered for category:",
        selectedCategoryId,
        categoryServices
    );

    validateProviderServices();
}


/* ---------------------------------------------
   LOAD SERVICES
--------------------------------------------- */

loadProviderServices();
    /* =========================================================
       CUSTOMER FORM ELEMENTS
    ========================================================= */

    var customerForm =
        document.getElementById(
            "customerForm"
        );

    var custFirstName =
        document.getElementById(
            "custFirstName"
        );

    var custLastName =
        document.getElementById(
            "custLastName"
        );

    var custEmail =
        document.getElementById(
            "custEmail"
        );

    var custPhone =
        document.getElementById(
            "custPhone"
        );

    var custPassword =
        document.getElementById(
            "custPassword"
        );

    var custConfirmPassword =
        document.getElementById(
            "custConfirmPassword"
        );

    var custAgreeTerms =
        document.getElementById(
            "custAgreeTerms"
        );

    var customerSuccessAlert =
        document.getElementById(
            "customerSuccessAlert"
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
            "change",
            function () {

                validateCheckbox(
                    custAgreeTerms
                );
            }
        );
    }


    /* =========================================================
       CUSTOMER FORM SUBMIT
       REGISTER → SUCCESS → LOGIN
    ========================================================= */

    if (customerForm) {

        customerForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();
                event.stopPropagation();

                if (customerSuccessAlert) {

                    customerSuccessAlert.classList.add(
                        "d-none"
                    );
                }


                /* ---------- Validation ---------- */

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
                    "was-validated"
                );

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
                            ".is-invalid"
                        );

                    if (firstInvalid) {
                        firstInvalid.focus();
                    }

                    return;
                }


                /* ---------- Loading ---------- */

                setSubmitLoading(
                    customerForm,
                    true,
                    "Creating Account...",
                    "Create Customer Account"
                );


                try {

                    /* =============================================
                       SEND CUSTOMER REGISTRATION
                    ============================================= */

                    var response =
                        await fetch(
                            API_BASE +
                            "/users/register/",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({

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
                        );


                    var responseText =
                        await response.text();


                    console.log(
                        "Customer registration status:",
                        response.status
                    );

                    console.log(
                        "Customer registration response:",
                        responseText
                    );


                    var data = {};


                    try {

                        data =
                            responseText
                                ? JSON.parse(responseText)
                                : {};

                    } catch (error) {

                        throw new Error(
                            "Django returned an invalid response."
                        );
                    }


                    /* =============================================
                       HANDLE REGISTRATION ERROR
                    ============================================= */

                    if (!response.ok) {

                        throw new Error(
                            getApiErrorMessage(
                                data,
                                "Registration failed."
                            )
                        );
                    }


                    console.log(
                        "Customer registration successful:",
                        data
                    );


                    /* =============================================
                       SUCCESS MESSAGE
                    ============================================= */

                    if (customerSuccessAlert) {

    customerSuccessAlert.classList.remove("d-none");

    customerSuccessAlert.innerHTML = `
        <strong>
            <i class="fa-solid fa-envelope me-2"></i>
            Verification email sent!
        </strong>
        <br>
        Please check your email for the verification code.
        You must verify your email before logging in.
    `;

    customerSuccessAlert.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

sessionStorage.setItem(
    "pending_verification_email",
    custEmail.value.trim()
);

setSubmitLoading(
    customerForm,
    false,
    "Creating Account...",
    "Create Customer Account"
);

setTimeout(function () {

    window.location.href =
        "verify-email.html";

}, 1500);

                } catch (error) {

                    setSubmitLoading(
                        customerForm,
                        false,
                        "Creating Account...",
                        "Create Customer Account"
                    );

                    alert(error.message);
                }

            }
        );
    }

                   

                    

    /* =========================================================
       PROVIDER FORM ELEMENTS
    ========================================================= */

  var providerForm =
    document.getElementById(
        "providerForm"
    );
    
    var provFullName =
        document.getElementById(
            "provFullName"
        );

    var provEmail =
        document.getElementById(
            "provEmail"
        );

    var provPhone =
        document.getElementById(
            "provPhone"
        );

    var provPassword =
        document.getElementById(
            "provPassword"
        );

    var provConfirmPassword =
        document.getElementById(
            "provConfirmPassword"
        );

    var provExperience =
        document.getElementById(
            "provExperience"
        );

    var provHourlyRate =
        document.getElementById(
            "provHourlyRate"
        );

    var provAddress =
        document.getElementById(
            "provAddress"
        );

        /* ---------- Provider Service Location ---------- */

var provCountry =
    document.getElementById("provCountry");

var provProvince =
    document.getElementById("provProvince");

var provDistrict =
    document.getElementById("provDistrict");

var provCity =
    document.getElementById("provCity");

    var provBio =
        document.getElementById(
            "provBio"
        );

    

    var provPhoto =
        document.getElementById(
            "provPhoto"
        );

    var provAgreeTerms =
        document.getElementById(
            "provAgreeTerms"
        );

    var providerSuccessAlert =
        document.getElementById(
            "providerSuccessAlert"
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
        provHourlyRate,
        function () {

            return validateNumberField(
                provHourlyRate,
                1,
                100000
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
            "change",
            function () {

                validateCheckbox(
                    provAgreeTerms
                );
            }
        );
    }

function validateProviderServices() {

    if (!provServices) {
        return false;
    }

    var selected =
        provServices.querySelectorAll(
            'input[name="services"]:checked'
        );

    var valid =
        selected.length > 0;

    provServices.classList.toggle(
        "is-invalid",
        !valid
    );

    provServices.classList.toggle(
        "is-valid",
        valid
    );

    return valid;
}

    /* =========================================================
       PROVIDER FORM SUBMIT
    ========================================================= */

    if (providerForm) {

        providerForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();
                event.stopPropagation();


                if (providerSuccessAlert) {

                    providerSuccessAlert.classList.add(
                        "d-none"
                    );
                }


                /* =================================================
                   VALIDATE PROVIDER FIELDS
                ================================================= */

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

var servicesValid =
    validateProviderServices();

               

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

                var hourlyRateValid =
                    validateNumberField(
                        provHourlyRate,
                        1,
                        100000
                    );

                var addressValid =
                    validateRequiredText(
                        provAddress,
                        5
                    );

                    var countryValid =
    validateRequiredText(provCountry, 2);

var provinceValid =
    validateRequiredText(provProvince, 2);

var districtValid =
    validateRequiredText(provDistrict, 2);

// City is optional, so it does not block registration.


                var bioValid =
                    validateRequiredText(
                        provBio,
                        20
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
                    "was-validated"
                );


                var allValid =
    nameValid &&
    emailValid &&
    phoneValid &&
    categoryValid &&
    servicesValid &&
                    passwordValid &&
                    confirmValid &&
                    experienceValid &&
                    hourlyRateValid &&
                    addressValid &&
                    countryValid &&
provinceValid &&
districtValid &&
                    bioValid &&
                    
                    photoValid &&
                    termsValid;


                if (!allValid) {

                    var firstInvalid =
                        providerForm.querySelector(
                            ".is-invalid"
                        );

                    if (firstInvalid) {
                        firstInvalid.focus();
                    }

                    return;
                }

                sessionStorage.setItem(
    "pending_verification_email",
    provEmail.value.trim()
);

sessionStorage.setItem(
    "pending_verification_role",
    "provider"
);

var verificationWindow =
    window.open("about:blank", "_blank");

if (!verificationWindow) {
    alert("Please allow pop-ups to continue email verification.");
    return;
}


                /* =================================================
                   PREPARE NAME
                ================================================= */

                var fullName =
                    provFullName.value.trim();

                var nameParts =
                    fullName.split(/\s+/);


                if (nameParts.length < 2) {

                    alert(
                        "Please enter your first name and last name."
                    );

                    provFullName.focus();

                    return;
                }


                var firstName =
                    nameParts[0];

                var lastName =
                    nameParts
                        .slice(1)
                        .join(" ");


                /* =================================================
                   START LOADING
                ================================================= */

                setSubmitLoading(
                    providerForm,
                    true,
                    "Creating Account...",
                    "Apply as Provider"
                );


                try {

                    /* =============================================
                       STEP 1
                       CREATE CUSTOMER ACCOUNT
                    ============================================= */

                    var registerResponse =
                        await fetch(
                            API_BASE +
                            "/users/register/",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({

                                        first_name:
                                            firstName,

                                        last_name:
                                            lastName,

                                        email:
                                            provEmail.value.trim(),

                                        phone:
                                            provPhone.value.trim(),

                                        password:
                                            provPassword.value
                                    })
                            }
                        );


                    var registerText =
                        await registerResponse.text();


                    console.log(
                        "Provider account creation status:",
                        registerResponse.status
                    );

                    console.log(
                        "Provider account creation response:",
                        registerText
                    );


                    var registerData = {};


                    try {

                        registerData =
                            registerText
                                ? JSON.parse(registerText)
                                : {};

                    } catch (error) {

                        throw new Error(
                            "Django returned an invalid response during account creation."
                        );
                    }


                    if (!registerResponse.ok) {

                        throw new Error(
                            getApiErrorMessage(
                                registerData,
                                "Provider account creation failed."
                            )
                        );
                    }


                    console.log(
                        "Provider account created successfully:",
                        registerData
                    );


                    /* =============================================
                       STEP 2
                       LOGIN
                    ============================================= */


                    /* =============================================
   STEP 2
   VERIFY EMAIL OTP
============================================= */

/* =============================================
   STEP 2
   OPEN EMAIL VERIFICATION PAGE
============================================= */

setSubmitLoading(
    providerForm,
    true,
    "Waiting for Email Verification...",
    "Apply as Provider"
);

await new Promise(function (resolve, reject) {

    function handleVerification(event) {

        if (event.origin !== window.location.origin) {
            return;
        }

        if (
            event.data &&
            event.data.type === "ONECLICK_EMAIL_VERIFIED" &&
            event.data.email.toLowerCase() ===
                provEmail.value.trim().toLowerCase()
        ) {
            window.removeEventListener(
                "message",
                handleVerification
            );

            resolve();
        }
    }

    window.addEventListener(
        "message",
        handleVerification
    );

    verificationWindow.location.href =
        "verify-email.html";
});
                    setSubmitLoading(
                        providerForm,
                        true,
                        "Signing In...",
                        "Apply as Provider"
                    );


                    var loginResponse =
                        await fetch(
                            API_BASE +
                            "/users/login/",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({

                                        email:
                                            provEmail.value.trim(),

                                        password:
                                            provPassword.value
                                    })
                            }
                        );


                    var loginText =
                        await loginResponse.text();


                    console.log(
                        "Provider login status:",
                        loginResponse.status
                    );

                    console.log(
                        "Provider login response:",
                        loginText
                    );


                    var loginData = {};


                    try {

                        loginData =
                            loginText
                                ? JSON.parse(loginText)
                                : {};

                    } catch (error) {

                        throw new Error(
                            "Login returned an invalid response."
                        );
                    }


                    if (!loginResponse.ok) {

                        throw new Error(
                            getApiErrorMessage(
                                loginData,
                                "Automatic login failed. Please try logging in manually."
                            )
                        );
                    }


                    var accessToken =
                        loginData.tokens &&
                        loginData.tokens.access
                            ? loginData.tokens.access
                            : null;


                    if (!accessToken) {

                        throw new Error(
                            "Login succeeded, but Django did not return an access token."
                        );
                    }


                    localStorage.setItem(
                        "access_token",
                        accessToken
                    );


                    console.log(
                        "Provider login successful."
                    );


                    /* =============================================
                       STEP 3
                       PROVIDER ONBOARDING
                    ============================================= */

                    setSubmitLoading(
                        providerForm,
                        true,
                        "Submitting Application...",
                        "Apply as Provider"
                    );


                    var formData =
                        new FormData();

/* ---------- Category ---------- */

formData.append(
    "category",
    provCategory.value
);

                    /* ---------- Services ---------- */

var selectedServices =
    provServices.querySelectorAll(
        'input[name="services"]:checked'
    );

selectedServices.forEach(
    function (checkbox) {

        formData.append(
            "services",
            checkbox.value
        );

    }
);

console.log(
    "Selected provider services:",
    Array.from(
        selectedServices
    ).map(
        function (checkbox) {
            return checkbox.value;
        }
    )
);


                    /* ---------- Experience ---------- */

                    formData.append(
                        "experience",
                        provExperience.value
                    );


                    /* ---------- Address ---------- */

                    formData.append(
                        "address",
                        provAddress.value.trim()
                    );

                    /* ---------- Primary Service Location ---------- */

formData.append(
    "country",
    provCountry.value.trim()
);

formData.append(
    "province",
    provProvince.value.trim()
);

formData.append(
    "district",
    provDistrict.value.trim()
);

formData.append(
    "city",
    provCity.value.trim()
);


                    /* ---------- Bio ---------- */

                    formData.append(
                        "bio",
                        provBio.value.trim()
                    );


                    /* ---------- Hourly Rate ---------- */

                    formData.append(
                        "hourly_rate",
                        provHourlyRate.value
                    );


                    /* ---------- Profile Photo ---------- */

                    if (
                        provPhoto.files &&
                        provPhoto.files.length > 0
                    ) {

                        formData.append(
                            "profile_image",
                            provPhoto.files[0]
                        );
                    }


                    /*
                    Citizenship document is currently
                    validated on the frontend but NOT sent.

                    The current ProviderProfile model does not
                    contain a citizenship_document field.
                    */


                    /* =============================================
                       SEND PROVIDER ONBOARDING
                    ============================================= */

                    var onboardingResponse =
                        await fetch(
                            API_BASE +
                            "/providers/onboard/",
                            {
                                method: "POST",

                                headers: {
                                    "Authorization":
                                        "Bearer " +
                                        accessToken
                                },

                                body:
                                    formData
                            }
                        );


                    var onboardingText =
                        await onboardingResponse.text();


                    console.log(
                        "Provider onboarding status:",
                        onboardingResponse.status
                    );

                    console.log(
                        "Provider onboarding response:",
                        onboardingText
                    );


                    var onboardingData = {};


                    try {

                        onboardingData =
                            onboardingText
                                ? JSON.parse(
                                    onboardingText
                                )
                                : {};

                    } catch (error) {

                        throw new Error(
                            "Provider onboarding returned an invalid response."
                        );
                    }


                    if (!onboardingResponse.ok) {

                        throw new Error(
                            getApiErrorMessage(
                                onboardingData,
                                "Provider application could not be submitted."
                            )
                        );
                    }


                    /* =============================================
                       STEP 4
                       SAVE JWT
                    ============================================= */

                    localStorage.setItem(
                        "access_token",
                        accessToken
                    );


                    /* =============================================
                       STEP 5
                       SUCCESS
                    ============================================= */

                    console.log(
                        "Provider onboarding successful:",
                        onboardingData
                    );


                    setSubmitLoading(
                        providerForm,
                        false,
                        "Creating Account...",
                        "Apply as Provider"
                    );


                    if (providerSuccessAlert) {

                        providerSuccessAlert.classList.remove(
                            "d-none"
                        );

                        providerSuccessAlert.innerHTML = `
                            <strong>
                                <i class="fa-solid fa-circle-check me-2"></i>
                                Provider application submitted successfully!
                            </strong>
                            <br>
                            Your provider profile has been created
                            and is waiting for admin verification.
                        `;

                        providerSuccessAlert.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });
                    }


                    /* ---------- Reset form ---------- */

                    providerForm.reset();

                    providerForm.classList.remove(
                        "was-validated"
                    );


                   [
    provFullName,
    provEmail,
    provPhone,
    provPassword,
    provConfirmPassword,
    provExperience,
    provHourlyRate,
    provAddress,
    provCountry,
    provProvince,
    provDistrict,
    provCity,
    provBio,
   
    provPhoto
].forEach(
                        function (input) {

                            if (input) {

                                input.classList.remove(
                                    "is-valid",
                                    "is-invalid"
                                );
                            }
                        }
                    );


                    if (provAgreeTerms) {

                        provAgreeTerms.classList.remove(
                            "is-valid",
                            "is-invalid"
                        );
                    }


                   

                    


                    /* ---------- Reset photo label ---------- */

                    var photoLabel =
                        document.getElementById(
                            "provPhotoLabel"
                        );


                    if (photoLabel) {

                        var photoSpan =
                            photoLabel.querySelector(
                                "span"
                            );

                        if (photoSpan) {

                            photoSpan.textContent =
                                "Choose file — JPG or PNG";
                        }

                        photoLabel.classList.remove(
                            "oc-file-selected"
                        );
                    }


                } catch (error) {

                    console.error(
                        "Provider registration error:",
                        error
                    );


                    setSubmitLoading(
                        providerForm,
                        false,
                        "Creating Account...",
                        "Apply as Provider"
                    );


                    alert(
                        error.message ||
                        "Something went wrong during provider registration."
                    );
                }
            }
        );
    }

});
