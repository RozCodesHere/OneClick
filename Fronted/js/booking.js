/* =========================================================
   ONECLICK — SERVICE BOOKING PAGE SCRIPT
   Backend integrated with Django REST API

   APIs used:
   GET  /api/services/
   GET  /api/providers/<id>/
   POST /api/bookings/

   Authentication:
   JWT access token from localStorage
   ========================================================= */

const API_BASE = "http://127.0.0.1:8000/api";

const accessToken = localStorage.getItem("access_token");


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /*
     * User must be logged in before creating a booking.
     */
    if (!accessToken) {
        window.location.href = "login.html";
        return;
    }

    initDateTimeDefaults();
    initServices();
    initEmergencyToggle();
    initCharCounter();
    initUseLocation();
    initFormValidation();
    initRippleButtons();
    initScrollAnimations();

    /*
     * Load provider from URL.
     *
     * Example:
     * booking.html?id=1
     */
    loadProvider();

});


/* =========================================================
   GLOBAL BOOKING DATA
   ========================================================= */

/*
 * The selected service from the Django database.
 *
 * Example:
 *
 * {
 *     id: 1,
 *     name: "Electrician",
 *     base_price: "800.00",
 *     ...
 * }
 */
let services = [];


/*
 * Provider selected for this booking.
 */
let providerId = null;


/*
 * Currently selected service object.
 */
let selectedService = null;


/* =========================================================
   1. GET PROVIDER ID FROM URL
   ========================================================= */

function getProviderIdFromURL() {

    const params = new URLSearchParams(window.location.search);

    const id = params.get("id");

    if (!id) {
        console.error(
            "No provider ID found in URL."
        );

        return null;
    }

    return id;
}


/* =========================================================
   2. LOAD PROVIDER
   ========================================================= */

async function loadProvider() {

    providerId = getProviderIdFromURL();

    const providerElement =
        document.querySelector(".summary-provider");

    /*
     * If there is no provider ID,
     * keep the existing UI message.
     */
    if (!providerId) {

        if (providerElement) {

            providerElement.innerHTML = `
                <i class="fa-regular fa-clock"></i>
                Not Assigned Yet
            `;

        }

        return;
    }


    try {

        const response = await fetch(
            `${API_BASE}/providers/${providerId}/`
        );


        if (!response.ok) {

            console.error(
                "Failed to load provider."
            );

            if (providerElement) {

                providerElement.innerHTML = `
                    <i class="fa-solid fa-circle-exclamation"></i>
                    Provider unavailable
                `;

            }

            return;
        }


        const provider = await response.json();

        console.log(
            "Booking provider:",
            provider
        );


        /*
         * Display provider name in booking summary.
         */
        if (providerElement) {

            providerElement.innerHTML = `
                <i class="fa-solid fa-user-check"></i>
                ${escapeHtml(
                    provider.full_name || "Provider"
                )}
            `;

        }


    } catch (error) {

        console.error(
            "Error loading provider:",
            error
        );

    }

}


/* =========================================================
   3. LOAD SERVICES FROM DJANGO
   ========================================================= */

async function initServices() {

    const serviceSelect =
        document.getElementById("serviceCategory");

    if (!serviceSelect) {
        return;
    }


    /*
     * Show loading state.
     */
    serviceSelect.innerHTML = `
        <option value="">
            Loading services...
        </option>
    `;


    try {

        const response = await fetch(
            `${API_BASE}/services/`
        );


        if (!response.ok) {

            throw new Error(
                `Services API returned ${response.status}`
            );

        }


        const data = await response.json();


        console.log(
            "Services API data:",
            data
        );


        /*
         * DRF pagination may return:
         *
         * {
         *     count: 10,
         *     results: [...]
         * }
         *
         * Or the API may return:
         *
         * [...]
         */
        services =
            Array.isArray(data)
                ? data
                : (data.results || []);


        /*
         * Remove inactive services just in case.
         */
        services =
            services.filter(function (service) {

                return service.is_active !== false;

            });


        if (services.length === 0) {

            serviceSelect.innerHTML = `
                <option value="">
                    No services available
                </option>
            `;

            updateEstimate();

            return;
        }


        /*
         * First option.
         */
        serviceSelect.innerHTML = `
            <option value="" selected disabled>
                Select a service
            </option>
        `;


        /*
         * Create options from Django database.
         *
         * IMPORTANT:
         *
         * value = service.id
         *
         * This is what BookingSerializer expects.
         */
        services.forEach(function (service) {

            const option =
                document.createElement("option");


            option.value = service.id;


            option.textContent =
                service.name;


            /*
             * Keep base price available
             * for the frontend estimate.
             */
            option.dataset.price =
                service.base_price;


            /*
             * Category information.
             */
            if (service.category_name) {

                option.dataset.category =
                    service.category_name;

            }


            serviceSelect.appendChild(option);

        });


        /*
         * Start price estimator
         * AFTER services are loaded.
         */
        initPriceEstimator();


        updateSummary();


    } catch (error) {

        console.error(
            "Error loading services:",
            error
        );


        serviceSelect.innerHTML = `
            <option value="">
                Failed to load services
            </option>
        `;


        const estimateNote =
            document.getElementById(
                "estimateNote"
            );


        if (estimateNote) {

            estimateNote.textContent =
                "Unable to load services from server.";

        }

    }

}


/* =========================================================
   4. DATE / TIME DEFAULTS
   ========================================================= */

function initDateTimeDefaults() {

    const dateInput =
        document.getElementById(
            "preferredDate"
        );

    const timeInput =
        document.getElementById(
            "preferredTime"
        );


    if (!dateInput) {
        return;
    }


    /*
     * Use local date instead of UTC.
     *
     * This avoids the date becoming
     * yesterday/tomorrow because of timezone.
     */
    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            today.getDate()
        ).padStart(2, "0");


    const isoToday =
        `${year}-${month}-${day}`;


    dateInput.setAttribute(
        "min",
        isoToday
    );


    dateInput.addEventListener(
        "change",
        updateSummary
    );


    if (timeInput) {

        timeInput.addEventListener(
            "change",
            updateSummary
        );

    }

}


/* =========================================================
   5. PRICE ESTIMATOR
   ========================================================= */

function initPriceEstimator() {

    const categorySelect =
        document.getElementById(
            "serviceCategory"
        );


    if (!categorySelect) {
        return;
    }


    categorySelect.addEventListener(
        "change",
        function () {

            updateEstimate();

        }
    );


    updateEstimate();

}


/* =========================================================
   GET SELECTED SERVICE
   ========================================================= */

function getSelectedService() {

    const categorySelect =
        document.getElementById(
            "serviceCategory"
        );


    if (!categorySelect) {
        return null;
    }


    const serviceId =
        categorySelect.value;


    if (!serviceId) {
        return null;
    }


    return services.find(
        function (service) {

            return String(service.id) ===
                   String(serviceId);

        }
    ) || null;

}


/* =========================================================
   GET SELECTED SERVICE PRICE
   ========================================================= */

function getSelectedServicePrice() {

    const service =
        getSelectedService();


    if (!service) {
        return 0;
    }


    return parseFloat(
        service.base_price
    ) || 0;

}


/* =========================================================
   UPDATE ESTIMATE
   ========================================================= */

function updateEstimate() {

    const categorySelect =
        document.getElementById(
            "serviceCategory"
        );


    const estimateValue =
        document.getElementById(
            "estimateValue"
        );


    const estimateNote =
        document.getElementById(
            "estimateNote"
        );


    const emergencyToggle =
        document.getElementById(
            "emergencyToggle"
        );


    if (!categorySelect) {
        return;
    }


    const selectedOption =
        categorySelect.options[
            categorySelect.selectedIndex
        ];


    const service =
        getSelectedService();


    const basePrice =
        getSelectedServicePrice();


    const isEmergency =
        emergencyToggle &&
        emergencyToggle.checked;


    /*
     * IMPORTANT:
     *
     * Your Django Booking model currently
     * calculates total_price as:
     *
     * service.estimated_price
     *
     * However your Service model contains:
     *
     * base_price
     *
     * Therefore the backend currently does
     * NOT include the booking fee,
     * visit charge, or emergency surcharge
     * in total_price.
     *
     * We keep the frontend display for now,
     * but the actual database total is controlled
     * by Django.
     */
    const bookingFee = 100;
    const visitCharge = 150;
    const emergencySurcharge = 500;


    const total =
        basePrice +
        bookingFee +
        visitCharge +
        (
            isEmergency
                ? emergencySurcharge
                : 0
        );


    if (service && basePrice > 0) {

        if (estimateValue) {

            estimateValue.textContent =
                formatCurrency(total);

        }


        if (estimateNote) {

            estimateNote.textContent =
                `${service.name} — includes booking fee & visit charge`;

        }

    } else {

        if (estimateValue) {

            estimateValue.textContent =
                formatCurrency(0);

        }


        if (estimateNote) {

            estimateNote.textContent =
                "Select a service to see pricing";

        }

    }


    updateSummary();

}


/* =========================================================
   6. LIVE BOOKING SUMMARY
   ========================================================= */

function updateSummary() {

    const categorySelect =
        document.getElementById(
            "serviceCategory"
        );


    const dateInput =
        document.getElementById(
            "preferredDate"
        );


    const timeInput =
        document.getElementById(
            "preferredTime"
        );


    const emergencyToggle =
        document.getElementById(
            "emergencyToggle"
        );


    const summaryService =
        document.getElementById(
            "summaryService"
        );


    const summarySlot =
        document.getElementById(
            "summarySlot"
        );


    const summaryBookingFee =
        document.getElementById(
            "summaryBookingFee"
        );


    const summaryVisitCharge =
        document.getElementById(
            "summaryVisitCharge"
        );


    const summaryEmergencyFee =
        document.getElementById(
            "summaryEmergencyFee"
        );


    const summaryTotal =
        document.getElementById(
            "summaryTotal"
        );


    const service =
        getSelectedService();


    const basePrice =
        getSelectedServicePrice();


    const isEmergency =
        emergencyToggle &&
        emergencyToggle.checked;


    /*
     * Service name.
     */
    if (summaryService) {

        summaryService.textContent =
            service
                ? service.name
                : "Not selected";

    }


    /*
     * Preferred date/time.
     */
    if (summarySlot) {

        const dateVal =
            dateInput &&
            dateInput.value
                ? formatDate(
                    dateInput.value
                )
                : "";


        const timeVal =
            timeInput &&
            timeInput.value
                ? formatTime(
                    timeInput.value
                )
                : "";


        if (dateVal && timeVal) {

            summarySlot.textContent =
                `${dateVal} at ${timeVal}`;

        } else if (dateVal) {

            summarySlot.textContent =
                dateVal;

        } else {

            summarySlot.textContent =
                "—";

        }

    }


    /*
     * Frontend display fees.
     */
    const bookingFee = 100;
    const visitCharge = 150;
    const emergencySurcharge = 500;


    if (summaryBookingFee) {

        summaryBookingFee.textContent =
            formatCurrency(
                bookingFee
            );

    }


    if (summaryVisitCharge) {

        summaryVisitCharge.textContent =
            formatCurrency(
                visitCharge
            );

    }


    if (summaryEmergencyFee) {

        summaryEmergencyFee.textContent =
            formatCurrency(
                isEmergency
                    ? emergencySurcharge
                    : 0
            );

    }


    const total =
        basePrice +
        bookingFee +
        visitCharge +
        (
            isEmergency
                ? emergencySurcharge
                : 0
        );


    if (summaryTotal) {

        summaryTotal.textContent =
            formatCurrency(total);

    }

}


/* =========================================================
   7. CURRENCY FORMAT
   ========================================================= */

function formatCurrency(amount) {

    return (
        "Rs. " +
        Math.round(
            Number(amount) || 0
        ).toLocaleString("en-US")
    );

}


/* =========================================================
   8. DATE FORMAT
   ========================================================= */

function formatDate(isoDate) {

    const date =
        new Date(
            isoDate + "T00:00:00"
        );


    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );

}


/* =========================================================
   9. TIME FORMAT
   ========================================================= */

function formatTime(time24) {

    const [
        hourStr,
        minuteStr
    ] = time24.split(":");


    let hour =
        parseInt(
            hourStr,
            10
        );


    const suffix =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12 || 12;


    return (
        hour +
        ":" +
        minuteStr +
        " " +
        suffix
    );

}


/* =========================================================
   10. EMERGENCY TOGGLE
   ========================================================= */

function initEmergencyToggle() {

    const toggle =
        document.getElementById(
            "emergencyToggle"
        );


    const block =
        document.querySelector(
            ".emergency-toggle-block"
        );


    if (!toggle) {
        return;
    }


    toggle.addEventListener(
        "change",
        function () {

            if (block) {

                block.classList.toggle(
                    "active",
                    toggle.checked
                );

            }


            updateEstimate();

        }
    );

}


/* =========================================================
   11. CHARACTER COUNTER
   ========================================================= */

function initCharCounter() {

    const textarea =
        document.getElementById(
            "problemDescription"
        );


    const counter =
        document.getElementById(
            "charCount"
        );


    const maxLength = 500;


    if (!textarea || !counter) {
        return;
    }


    textarea.setAttribute(
        "maxlength",
        maxLength
    );


    textarea.addEventListener(
        "input",
        function () {

            if (
                textarea.value.length >
                maxLength
            ) {

                textarea.value =
                    textarea.value.slice(
                        0,
                        maxLength
                    );

            }


            counter.textContent =
                textarea.value.length;

        }
    );

}


/* =========================================================
   12. USE CURRENT LOCATION
   ========================================================= */

function initUseLocation() {

    const btn =
        document.getElementById(
            "useLocationBtn"
        );


    const input =
        document.getElementById(
            "serviceLocation"
        );


    if (!btn || !input) {
        return;
    }


    btn.addEventListener(
        "click",
        function () {

            /*
             * Browser geolocation.
             */
            if (
                !navigator.geolocation
            ) {

                alert(
                    "Geolocation is not supported by your browser."
                );

                return;

            }


            btn.classList.add(
                "locating"
            );


            const icon =
                btn.querySelector("i");


            if (icon) {

                icon.classList.remove(
                    "fa-crosshairs"
                );

                icon.classList.add(
                    "fa-spinner",
                    "fa-spin"
                );

            }


            navigator.geolocation.getCurrentPosition(

                function (position) {

                    /*
                     * We receive coordinates.
                     *
                     * Your Booking model stores
                     * address as text, not latitude/
                     * longitude.
                     *
                     * Therefore we cannot automatically
                     * convert coordinates into Kathmandu
                     * address without a reverse-geocoding API.
                     *
                     * For now show coordinates so the
                     * user knows location was obtained.
                     */
                    const latitude =
                        position.coords.latitude;


                    const longitude =
                        position.coords.longitude;


                    input.value =
                        `Location detected (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;


                    input.classList.remove(
                        "is-invalid"
                    );


                    resetLocationButton();

                },


                function (error) {

                    console.error(
                        "Geolocation error:",
                        error
                    );


                    let message =
                        "Unable to get your location.";


                    if (
                        error.code ===
                        error.PERMISSION_DENIED
                    ) {

                        message =
                            "Location permission was denied. Please enter your address manually.";

                    }


                    alert(message);


                    resetLocationButton();

                },

                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }

            );

        }
    );

}


/* =========================================================
   RESET LOCATION BUTTON
   ========================================================= */

function resetLocationButton() {

    const btn =
        document.getElementById(
            "useLocationBtn"
        );


    if (!btn) {
        return;
    }


    btn.classList.remove(
        "locating"
    );


    const icon =
        btn.querySelector("i");


    if (icon) {

        icon.classList.remove(
            "fa-spinner",
            "fa-spin"
        );


        icon.classList.add(
            "fa-crosshairs"
        );

    }

}


/* =========================================================
   13. FORM VALIDATION
   ========================================================= */

function initFormValidation() {

    const form =
        document.getElementById(
            "bookingForm"
        );


    if (!form) {
        return;
    }


    const fields = [

        {
            el: document.getElementById(
                "serviceCategory"
            )
        },

        {
            el: document.getElementById(
                "serviceLocation"
            )
        },

        {
            el: document.getElementById(
                "preferredDate"
            )
        },

        {
            el: document.getElementById(
                "preferredTime"
            )
        },

        {
            el: document.getElementById(
                "problemDescription"
            )
        }

    ];


    /*
     * Remove invalid state
     * when user fixes field.
     */
    fields.forEach(
        function (field) {

            if (!field.el) {
                return;
            }


            field.el.addEventListener(
                "input",
                function () {

                    if (
                        field.el.value.trim()
                    ) {

                        field.el.classList.remove(
                            "is-invalid"
                        );

                    }

                }
            );


            field.el.addEventListener(
                "change",
                function () {

                    if (
                        field.el.value.trim()
                    ) {

                        field.el.classList.remove(
                            "is-invalid"
                        );

                    }

                }
            );

        }
    );


    /*
     * Form submission.
     */
    form.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();


            let isValid = true;


            fields.forEach(
                function (field) {

                    if (!field.el) {
                        return;
                    }


                    if (
                        !field.el.value ||
                        !field.el.value.trim()
                    ) {

                        field.el.classList.add(
                            "is-invalid"
                        );

                        isValid = false;

                    } else {

                        field.el.classList.remove(
                            "is-invalid"
                        );

                    }

                }
            );


            /*
             * Provider is required by backend.
             */
            if (!providerId) {

                isValid = false;


                alert(
                    "No provider was selected. Please open the booking page from a provider profile."
                );

            }


            /*
             * Service must come from backend.
             */
            const service =
                getSelectedService();


            if (!service) {

                isValid = false;


                const serviceSelect =
                    document.getElementById(
                        "serviceCategory"
                    );


                if (serviceSelect) {

                    serviceSelect.classList.add(
                        "is-invalid"
                    );

                }

            }


            if (!isValid) {

                const firstInvalid =
                    form.querySelector(
                        ".is-invalid"
                    );


                if (firstInvalid) {

                    firstInvalid.scrollIntoView(
                        {
                            behavior: "smooth",
                            block: "center"
                        }
                    );


                    firstInvalid.focus(
                        {
                            preventScroll: true
                        }
                    );

                }


                return;

            }


            /*
             * Send the real booking.
             */
            await submitBooking(form);

        }
    );

}


/* =========================================================
   14. REAL BOOKING SUBMISSION
   ========================================================= */

async function submitBooking(form) {

    const submitBtn =
        form.querySelector(
            ".btn-book-service"
        );


    if (!submitBtn) {
        return;
    }


    const originalHTML =
        submitBtn.innerHTML;


    /*
     * Get form values.
     */
    const service =
        getSelectedService();


    const location =
        document.getElementById(
            "serviceLocation"
        ).value.trim();


    const bookingDate =
        document.getElementById(
            "preferredDate"
        ).value;


    const bookingTime =
        document.getElementById(
            "preferredTime"
        ).value;


    const description =
        document.getElementById(
            "problemDescription"
        ).value.trim();


    const emergencyToggle =
        document.getElementById(
            "emergencyToggle"
        );


    const emergency =
        emergencyToggle &&
        emergencyToggle.checked;


    /*
     * Emergency is NOT a field in your
     * Django Booking model.
     *
     * Therefore we cannot send:
     *
     * emergency: true
     *
     * because BookingSerializer does not
     * accept it.
     *
     * We include it inside the note instead.
     */
    let note =
        description;


    if (emergency) {

        note =
            "[Emergency Service] " +
            description;

    }


    /*
     * This is the exact structure expected
     * by your current BookingSerializer.
     */
    const bookingData = {

        provider: Number(
            providerId
        ),

        service: Number(
            service.id
        ),

        booking_date:
            bookingDate,

        booking_time:
            bookingTime,

        address:
            location,

        note:
            note

    };


    console.log(
        "Sending booking data:",
        bookingData
    );


    /*
     * Loading state.
     */
    submitBtn.disabled = true;


    submitBtn.classList.add(
        "is-loading"
    );


    submitBtn.innerHTML =
        `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Processing Booking...
        `;


    try {

        const response =
            await fetch(
                `${API_BASE}/bookings/`,
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${accessToken}`

                    },

                    body:
                        JSON.stringify(
                            bookingData
                        )

                }
            );


        const data =
            await response.json();


        console.log(
            "Booking API response:",
            data
        );


        /*
         * SUCCESS
         */
        if (response.ok) {

            submitBtn.classList.remove(
                "is-loading"
            );


            submitBtn.disabled =
                false;


            submitBtn.innerHTML =
                originalHTML;


            showBookingToast(
                true,
                data
            );


            /*
             * Reset form after successful booking.
             */
            form.reset();


            /*
             * Reset emergency UI.
             */
            const emergencyBlock =
                document.querySelector(
                    ".emergency-toggle-block"
                );


            if (emergencyBlock) {

                emergencyBlock.classList.remove(
                    "active"
                );

            }


            /*
             * Reset character counter.
             */
            const charCount =
                document.getElementById(
                    "charCount"
                );


            if (charCount) {

                charCount.textContent =
                    "0";

            }


            /*
             * Update estimate.
             */
            updateEstimate();


            /*
             * Keep provider summary.
             */
            loadProvider();


            return;

        }


        /*
         * AUTHENTICATION ERROR
         */
        if (
            response.status === 401
        ) {

            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "refresh_token"
            );

            localStorage.removeItem(
                "user"
            );


            alert(
                "Your session has expired. Please login again."
            );


            window.location.href =
                "login.html";


            return;

        }


        /*
         * Other backend errors.
         */
        let errorMessage =
            "Unable to create booking.";


        if (data) {

            /*
             * DRF validation errors
             * normally look like:
             *
             * {
             *     "service": ["..."],
             *     "booking_date": ["..."]
             * }
             */
            const messages = [];


            Object.keys(data).forEach(
                function (key) {

                    const value =
                        data[key];


                    if (Array.isArray(value)) {

                        messages.push(
                            `${key}: ${value.join(", ")}`
                        );

                    } else {

                        messages.push(
                            `${key}: ${value}`
                        );

                    }

                }
            );


            if (messages.length > 0) {

                errorMessage =
                    messages.join("\n");

            }

        }


        alert(
            errorMessage
        );


    } catch (error) {

        console.error(
            "Booking submission error:",
            error
        );


        alert(
            "Could not connect to the server. Make sure Django is running."
        );


    } finally {

        /*
         * Restore button unless
         * we redirected to login.
         */
        submitBtn.disabled =
            false;


        submitBtn.classList.remove(
            "is-loading"
        );


        submitBtn.innerHTML =
            originalHTML;

    }

}


/* =========================================================
   15. BOOKING TOAST
   ========================================================= */

function showBookingToast(
    success = true,
    booking = null
) {

    const toast =
        document.getElementById(
            "bookingToast"
        );


    const closeBtn =
        document.getElementById(
            "toastClose"
        );


    if (!toast) {
        return;
    }


    const title =
        toast.querySelector(
            ".toast-title"
        );


    const text =
        toast.querySelector(
            ".toast-text"
        );


    const icon =
        toast.querySelector(
            ".toast-icon i"
        );


    if (success) {

        if (title) {

            title.textContent =
                "Booking Requested!";

        }


        if (text) {

            const bookingId =
                booking &&
                booking.id
                    ? ` Booking #${booking.id} has been created.`
                    : "";


            text.textContent =
                "Your booking has been sent to the provider." +
                bookingId;

        }


        if (icon) {

            icon.className =
                "fa-solid fa-circle-check";

        }

    } else {

        if (title) {

            title.textContent =
                "Booking Failed";

        }


        if (text) {

            text.textContent =
                "We could not create your booking.";

        }


        if (icon) {

            icon.className =
                "fa-solid fa-circle-exclamation";

        }

    }


    toast.classList.add(
        "show"
    );


    const autoHide =
        window.setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            5000
        );


    if (closeBtn) {

        closeBtn.onclick =
            function () {

                toast.classList.remove(
                    "show"
                );


                window.clearTimeout(
                    autoHide
                );

            };

    }

}


/* =========================================================
   16. RIPPLE EFFECT
   ========================================================= */

function initRippleButtons() {

    document
        .querySelectorAll(".ripple")
        .forEach(
            function (btn) {

                btn.addEventListener(
                    "click",
                    function (e) {

                        const rect =
                            btn.getBoundingClientRect();


                        const circle =
                            document.createElement(
                                "span"
                            );


                        const size =
                            Math.max(
                                rect.width,
                                rect.height
                            );


                        circle.className =
                            "ripple-circle";


                        circle.style.width =
                            size + "px";


                        circle.style.height =
                            size + "px";


                        circle.style.left =
                            (
                                e.clientX -
                                rect.left -
                                size / 2
                            ) + "px";


                        circle.style.top =
                            (
                                e.clientY -
                                rect.top -
                                size / 2
                            ) + "px";


                        btn.appendChild(
                            circle
                        );


                        window.setTimeout(
                            function () {

                                circle.remove();

                            },
                            600
                        );

                    }
                );

            }
        );

}


/* =========================================================
   17. SCROLL ANIMATIONS
   ========================================================= */

function initScrollAnimations() {

    const items =
        document.querySelectorAll(
            ".fade-up"
        );


    if (
        !items.length ||
        !(
            "IntersectionObserver"
            in window
        )
    ) {

        return;

    }


    const observer =
        new IntersectionObserver(
            function (entries) {

                entries.forEach(
                    function (entry) {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target.style.animationPlayState =
                                "running";


                            observer.unobserve(
                                entry.target
                            );

                        }

                    }
                );

            },
            {
                threshold: 0.15
            }
        );


    items.forEach(
        function (item) {

            observer.observe(
                item
            );

        }
    );

}


/* =========================================================
   18. HTML ESCAPE
   Prevents API data from being inserted as raw HTML.
   ========================================================= */

function escapeHtml(value) {

    if (value === null ||
        value === undefined) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}

