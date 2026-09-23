// =========================================================
// ONECLICK — CONTACT PAGE JAVASCRIPT
// =========================================================

const API_BASE_URL = "http://127.0.0.1:8000/api";


// =========================================================
// FOOTER YEAR
// =========================================================

document.addEventListener("DOMContentLoaded", function () {

    const footerYear = document.getElementById("footerYear");

    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }

});


// =========================================================
// NAVBAR SCROLL EFFECT
// =========================================================

window.addEventListener("scroll", function () {

    const navbar = document.querySelector(".navbar");

    if (!navbar) {
        return;
    }

    if (window.scrollY > 50) {
        navbar.classList.add("scrolled");
    } else {
        navbar.classList.remove("scrolled");
    }

});


// =========================================================
// BACK TO TOP
// =========================================================

document.addEventListener("DOMContentLoaded", function () {

    const backToTop = document.getElementById("backToTop");

    if (!backToTop) {
        return;
    }

    window.addEventListener("scroll", function () {

        if (window.scrollY > 300) {
            backToTop.classList.add("show");
        } else {
            backToTop.classList.remove("show");
        }

    });

    backToTop.addEventListener("click", function () {

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

});


// =========================================================
// SMOOTH ANCHOR LINKS
// =========================================================

document.addEventListener("DOMContentLoaded", function () {

    const anchorLinks = document.querySelectorAll(
        'a[href^="#"]'
    );

    anchorLinks.forEach(function (link) {

        link.addEventListener("click", function (event) {

            const targetId = link.getAttribute("href");

            if (!targetId || targetId === "#") {
                return;
            }

            const target = document.querySelector(targetId);

            if (!target) {
                return;
            }

            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        });

    });

});


// =========================================================
// SCROLL REVEAL
// =========================================================

document.addEventListener("DOMContentLoaded", function () {

    const animatedElements = document.querySelectorAll(
        "[data-animate]"
    );

    if (!animatedElements.length) {
        return;
    }

    const observer = new IntersectionObserver(
        function (entries) {

            entries.forEach(function (entry) {

                if (entry.isIntersecting) {

                    entry.target.classList.add("animated");

                    observer.unobserve(
                        entry.target
                    );

                }

            });

        },
        {
            threshold: 0.15
        }
    );

    animatedElements.forEach(function (element) {

        observer.observe(element);

    });

});


// =========================================================
// RIPPLE EFFECT
// =========================================================

document.addEventListener("DOMContentLoaded", function () {

    const rippleButtons = document.querySelectorAll(
        ".ripple"
    );

    rippleButtons.forEach(function (button) {

        button.addEventListener("click", function (event) {

            const circle = document.createElement("span");

            const rect = button.getBoundingClientRect();

            const size = Math.max(
                rect.width,
                rect.height
            );

            circle.style.width = `${size}px`;
            circle.style.height = `${size}px`;

            circle.style.left =
                `${event.clientX - rect.left - size / 2}px`;

            circle.style.top =
                `${event.clientY - rect.top - size / 2}px`;

            circle.classList.add("ripple-effect");

            const oldRipple =
                button.querySelector(".ripple-effect");

            if (oldRipple) {
                oldRipple.remove();
            }

            button.appendChild(circle);

        });

    });

});


// =========================================================
// CONTACT FORM
// =========================================================

document.addEventListener("DOMContentLoaded", function () {

    const contactForm =
        document.getElementById("contactForm");

    if (!contactForm) {
        return;
    }


    // -----------------------------------------------------
    // FORM ELEMENTS
    // -----------------------------------------------------

    const fullName =
        contactForm.querySelector('[name="fullName"]');

    const email =
        contactForm.querySelector('[name="email"]');

    const phone =
        contactForm.querySelector('[name="phone"]');

    const subject =
        contactForm.querySelector('[name="subject"]');

    const message =
        contactForm.querySelector('[name="message"]');

    const agreePolicy =
        contactForm.querySelector('[name="agreePolicy"]');

    const messageCounter =
        document.getElementById("messageCounter");


    // -----------------------------------------------------
    // MESSAGE CHARACTER COUNTER
    // -----------------------------------------------------

    if (message && messageCounter) {

        function updateMessageCounter() {

            const length = message.value.length;

            messageCounter.textContent =
                `${length}/500`;

        }

        message.addEventListener(
            "input",
            updateMessageCounter
        );

        updateMessageCounter();

    }


    // -----------------------------------------------------
    // VALIDATION HELPERS
    // -----------------------------------------------------

    function showError(field, messageText) {

        if (!field) {
            return;
        }

        field.classList.add("is-invalid");

        let feedback =
            field.parentElement.querySelector(
                ".invalid-feedback"
            );

        if (!feedback) {

            feedback =
                document.createElement("div");

            feedback.className =
                "invalid-feedback";

            field.parentElement.appendChild(
                feedback
            );

        }

        feedback.textContent = messageText;

    }


    function clearError(field) {

        if (!field) {
            return;
        }

        field.classList.remove(
            "is-invalid"
        );

        const feedback =
            field.parentElement.querySelector(
                ".invalid-feedback"
            );

        if (feedback) {
            feedback.textContent = "";
        }

    }


    function validateForm() {

        let valid = true;


        // Full name

        if (
            !fullName ||
            fullName.value.trim().length < 2
        ) {

            showError(
                fullName,
                "Please enter your full name."
            );

            valid = false;

        } else {

            clearError(fullName);

        }


        // Email

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            !email ||
            !emailPattern.test(
                email.value.trim()
            )
        ) {

            showError(
                email,
                "Please enter a valid email address."
            );

            valid = false;

        } else {

            clearError(email);

        }


        // Phone

        if (phone && phone.value.trim() !== "") {

            const phoneDigits =
                phone.value.replace(/\D/g, "");

            if (
                phoneDigits.length < 7 ||
                phoneDigits.length > 15
            ) {

                showError(
                    phone,
                    "Please enter a valid phone number."
                );

                valid = false;

            } else {

                clearError(phone);

            }

        }


        // Subject

        if (
            !subject ||
            subject.value.trim().length < 3
        ) {

            showError(
                subject,
                "Please enter a subject."
            );

            valid = false;

        } else {

            clearError(subject);

        }


        // Message

        if (
            !message ||
            message.value.trim().length < 10
        ) {

            showError(
                message,
                "Message must contain at least 10 characters."
            );

            valid = false;

        } else if (
            message.value.trim().length > 500
        ) {

            showError(
                message,
                "Message cannot exceed 500 characters."
            );

            valid = false;

        } else {

            clearError(message);

        }


        // Agreement checkbox

        if (
            agreePolicy &&
            !agreePolicy.checked
        ) {

            showError(
                agreePolicy,
                "Please accept the policy before sending."
            );

            valid = false;

        } else {

            clearError(agreePolicy);

        }


        return valid;

    }


    // -----------------------------------------------------
    // FORM SUBMISSION
    // -----------------------------------------------------

    contactForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            // Validate first

            if (!validateForm()) {
                return;
            }


            // Find submit button

            const submitButton =
                contactForm.querySelector(
                    'button[type="submit"]'
                );


            // Save original button text

            const originalButtonText =
                submitButton
                    ? submitButton.innerHTML
                    : "";


            // Disable button

            if (submitButton) {

                submitButton.disabled = true;

                submitButton.innerHTML =
                    "Sending...";

            }


            // Prepare data

            const contactData = {

                full_name:
                    fullName.value.trim(),

                email:
                    email.value.trim(),

                phone:
                    phone
                        ? phone.value.trim()
                        : "",

                subject:
                    subject.value.trim(),

                message:
                    message.value.trim()

            };


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/support/contact/`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    contactData
                                )
                        }
                    );


                const data =
                    await response.json();


                // -------------------------------------------------
                // SUCCESS
                // -------------------------------------------------

                if (response.ok) {

                    alert(
                        "Thank you! Your message has been sent successfully."
                    );

                    contactForm.reset();

                    if (messageCounter) {
                        messageCounter.textContent =
                            "0/500";
                    }

                    return;

                }


                // -------------------------------------------------
                // BACKEND VALIDATION ERROR
                // -------------------------------------------------

                let errorMessage =
                    "Unable to send your message. Please check your information.";

                if (data) {

                    const firstError =
                        Object.values(data)[0];

                    if (
                        Array.isArray(firstError) &&
                        firstError.length > 0
                    ) {

                        errorMessage =
                            firstError[0];

                    }

                }

                alert(errorMessage);

            }

            catch (error) {

                console.error(
                    "Contact form error:",
                    error
                );

                alert(
                    "Unable to connect to OneClick server. Please try again."
                );

            }

            finally {

                if (submitButton) {

                    submitButton.disabled = false;

                    submitButton.innerHTML =
                        originalButtonText;

                }

            }

        }
    );

});