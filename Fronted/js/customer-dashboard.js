const API_BASE = "http://127.0.0.1:8000/api";

const API_ORIGIN = new URL(API_BASE).origin;

const SAVED_PROVIDERS_API =
    `${API_BASE}/providers/saved-providers`;

const accessToken =
    localStorage.getItem("access_token");


/* =========================================================
   LOGIN CHECK
   ========================================================= */

if (!accessToken) {

    window.location.href = "login.html";

}


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    if (!accessToken) return;

    if (typeof AOS !== "undefined") {

        AOS.init({
            duration: 650,
            easing: "ease-out-cubic",
            once: true,
            offset: 60
        });

    }

    setGreeting();

    loadCustomer();

    loadDashboardStats();

    loadFavoriteProviders();

    loadServices();

    loadRecentBookings();

    loadRecommendedProviders();

    loadCustomerQuotations();

    setupLogout();

    setupServiceClicks();

    setupSearch();

    setupBookingActions();

});


/* =========================================================
   API HEADERS
   ========================================================= */

function getHeaders() {

    return {

        Authorization:
            `Bearer ${accessToken}`,

        "Content-Type":
            "application/json"

    };

}


/* =========================================================
   GREETING
   ========================================================= */

function setGreeting() {

    const element =
        document.getElementById(
            "greetingText"
        );

    if (!element) return;

    const hour =
        new Date().getHours();

    let text =
        "Good Morning";

    let icon =
        "fa-regular fa-sun";

    if (
        hour >= 12 &&
        hour < 17
    ) {

        text =
            "Good Afternoon";

        icon =
            "fa-solid fa-cloud-sun";

    }

    else if (
        hour >= 17 ||
        hour < 5
    ) {

        text =
            "Good Evening";

        icon =
            "fa-regular fa-moon";

    }

    element.innerHTML =
        `<i class="${icon}"></i> ${text}`;

}


/* =========================================================
   LOAD CUSTOMER
   ========================================================= */

async function loadCustomer() {

    try {

        const response =
            await fetch(
                `${API_BASE}/users/me/`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );

        if (!response.ok) {

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                logoutUser();

                return;

            }

            throw new Error(
                `Customer API error: ${response.status}`
            );

        }

        const user =
            await response.json();

        console.log(
            "Customer data:",
            user
        );

        const firstName =
            String(
                user.first_name ||
                user.email?.split("@")[0] ||
                "User"
            ).trim();

        const fullName =
            `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
            firstName;

        const customerName =
            document.getElementById(
                "customerName"
            );

        if (customerName) {

            customerName.textContent =
                firstName;

        }

        const profileName =
            document.getElementById(
                "profileName"
            );

        if (profileName) {

            profileName.textContent =
                fullName;

        }

        const avatar =
            document.getElementById(
                "customerAvatar"
            );

        if (avatar) {

            avatar.textContent =
                firstName
                    .charAt(0)
                    .toUpperCase();

        }

        window.oneClickCustomer =
            user;

    }

    catch (error) {

        console.error(
            "Error loading customer:",
            error
        );

    }

}


/* =========================================================
   LOAD DASHBOARD STATISTICS
   ========================================================= */

async function loadDashboardStats() {

    try {

        const response =
            await fetch(
                `${API_BASE}/users/dashboard/`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );

        if (!response.ok) {

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                logoutUser();

                return;

            }

            throw new Error(
                `Dashboard API error: ${response.status}`
            );

        }

        const data =
            await response.json();

        console.log(
            "Dashboard data:",
            data
        );

        const stats =
            data.statistics || {};

        updateCounter(
            document.getElementById(
                "totalBookings"
            ),
            stats.total_bookings
        );

        updateCounter(
            document.getElementById(
                "completedJobs"
            ),
            stats.completed_bookings
        );

        updateCounter(
            document.getElementById(
                "pendingBookings"
            ),
            stats.pending_bookings
        );

    }

    catch (error) {

        console.error(
            "Error loading dashboard statistics:",
            error
        );

    }

}


/* =========================================================
   LOAD FAVORITE PROVIDERS
   ========================================================= */

async function loadFavoriteProviders() {

    const counter =
        document.getElementById(
            "favoriteProviders"
        );

    if (!counter) return;

    try {

        const response =
            await fetch(
                SAVED_PROVIDERS_API,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );

        if (!response.ok) {

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                logoutUser();

                return;

            }

            throw new Error(
                `Saved providers API error: ${response.status}`
            );

        }

        const data =
            await response.json();

        console.log(
            "Saved providers data:",
            data
        );

        let savedProviders = [];

        if (Array.isArray(data)) {

            savedProviders =
                data;

        }

        else if (
            Array.isArray(data.results)
        ) {

            savedProviders =
                data.results;

        }

        else if (
            Array.isArray(data.saved_providers)
        ) {

            savedProviders =
                data.saved_providers;

        }

        updateCounter(
            counter,
            savedProviders.length
        );

    }

    catch (error) {

        console.error(
            "Error loading favourite providers:",
            error
        );

        updateCounter(
            counter,
            0
        );

    }

}


/* =========================================================
   COUNTER
   ========================================================= */

function updateCounter(
    element,
    value
) {

    if (!element) return;

    const numericValue =
        Number(value) || 0;

    element.setAttribute(
        "data-count",
        numericValue
    );

    animateNumber(
        element,
        numericValue
    );

}


/* =========================================================
   NUMBER ANIMATION
   ========================================================= */

function animateNumber(
    element,
    target
) {

    const duration =
        900;

    const startTime =
        performance.now();

    function step(currentTime) {

        const progress =
            Math.min(
                (currentTime - startTime) /
                    duration,
                1
            );

        const eased =
            1 -
            Math.pow(
                1 - progress,
                3
            );

        const current =
            Math.floor(
                eased * target
            );

        element.textContent =
            current;

        if (progress < 1) {

            requestAnimationFrame(
                step
            );

        }

        else {

            element.textContent =
                target;

        }

    }

    requestAnimationFrame(
        step
    );

}


async function loadServices() {

    try {

        const response =
            await fetch(
                `${API_BASE}/services/`
            );

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }

        const data =
            await response.json();

        console.log(
            "SERVICES API DATA:",
            data
        );

        const services =
            Array.isArray(data)
                ? data
                : (
                    Array.isArray(data.results)
                        ? data.results
                        : []
                );

        console.log(
            "SERVICES ARRAY:",
            services
        );

        window.oneClickServices =
            services;

        /*
         * Render the main All Services section
         */
        renderServiceCards(
            services
        );

        /*
         * Render Quick Actions
         * using the same real database services.
         */
        renderQuickServices(
            services
        );

    }

    catch (error) {

        console.error(
            "LOAD SERVICES ERROR:",
            error
        );

        const container =
            document.getElementById(
                "servicesGrid"
            );

        if (container) {

            container.innerHTML = `

                <div class="col-12">

                    <div class="alert alert-warning">

                        Unable to load services.

                    </div>

                </div>

            `;

        }

        const quickGrid =
            document.getElementById(
                "quickServicesGrid"
            );

        if (quickGrid) {

            quickGrid.innerHTML = `

                <div class="col-12">

                    <div class="oc-loading-state">

                        <i class="fa-solid fa-triangle-exclamation"></i>

                        Unable to load quick services.

                    </div>

                </div>

            `;

        }

    }

}


/* =========================================================
   RENDER QUICK ACTION SERVICES
   ========================================================= */

function renderQuickServices(services) {

    const grid =
        document.getElementById("quickServicesGrid");

    if (!grid) {
        return;
    }

    if (!services || services.length === 0) {

        grid.innerHTML = `

            <div class="col-12">

                <div class="oc-loading-state">

                    <i class="fa-regular fa-face-frown"></i>

                    No services are available right now.

                </div>

            </div>

        `;

        return;
    }

    /*
     * Show the first 4 services from the Django API.
     *
     * Nothing is hardcoded here.
     */

    grid.innerHTML =
        services
            .slice(0, 4)
            .map(function (service, index) {

                const serviceName =
                    service.name ||
                    "Service";

                const serviceId =
                    service.id ?? "";

                const description =
                    service.description ||
                    "Professional service from OneClick.";

                const icon =
                    getServiceIcon(serviceName);

                return `

                    <div
                        class="col-6 col-lg-3"
                        data-aos="fade-up"
                        data-aos-delay="${index * 60}"
                    >

                        <a
                            href="#"
                            class="oc-quick-card"
                            data-service="${escapeHtml(serviceName)}"
                            data-service-id="${escapeHtml(serviceId)}"
                        >

                            <div class="oc-quick-icon oc-quick-${(index % 4) + 1}">

                                <i class="${icon}"></i>

                            </div>

                            <h5>
                                ${escapeHtml(serviceName)}
                            </h5>

                            <p>
                                ${escapeHtml(description)}
                            </p>

                            <span>

                                Find Providers

                                <i class="fa-solid fa-arrow-right ms-1"></i>

                            </span>

                        </a>

                    </div>

                `;

            })
            .join("");

    refreshAOS();
}
/* =========================================================
   RENDER SERVICE CARDS
   ========================================================= */

function renderServiceCards(
    services
) {

    const grid =
        document.getElementById(
            "servicesGrid"
        );

    if (!grid) return;

    grid.innerHTML =
        services
            .map(
                (
                    service,
                    index
                ) => {

                    const serviceName =
                        service.name ||
                        "Service";

                    const serviceId =
                        service.id ?? "";

                    const icon =
                        getServiceIcon(
                            serviceName
                        );

                    return `

                        <div
                            class="col-6 col-sm-4 col-lg-3 col-xl-2"
                            data-aos="fade-up"
                            data-aos-delay="${(index % 6) * 60}"
                        >

                            <div
                                class="oc-service-card"
                                data-service="${escapeHtml(serviceName)}"
                                data-service-id="${escapeHtml(serviceId)}"
                            >

                                <div class="oc-service-icon">

                                    <i class="${icon}"></i>

                                </div>

                                <h6>
                                    ${escapeHtml(serviceName)}
                                </h6>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

    refreshAOS();

}


/* =========================================================
   SERVICE ICON
   ========================================================= */

function getServiceIcon(
    serviceName
) {

    const name =
        String(
            serviceName || ""
        ).toLowerCase();

    if (name.includes("plumb")) {
        return "fa-solid fa-faucet-drip";
    }

    if (name.includes("electric")) {
        return "fa-solid fa-bolt";
    }

    if (name.includes("clean")) {
        return "fa-solid fa-broom";
    }

    if (
        name.includes("car wash") ||
        name.includes("vehicle")
    ) {
        return "fa-solid fa-car";
    }

    if (name.includes("paint")) {
        return "fa-solid fa-paint-roller";
    }

    if (name.includes("carpent")) {
        return "fa-solid fa-hammer";
    }

    if (
        name.includes("ac") ||
        name.includes("air condition")
    ) {
        return "fa-solid fa-snowflake";
    }

    if (name.includes("appliance")) {
        return "fa-solid fa-blender";
    }

    if (name.includes("pest")) {
        return "fa-solid fa-bug-slash";
    }

    if (
        name.includes("moving") ||
        name.includes("shifting")
    ) {
        return "fa-solid fa-truck-moving";
    }

    if (
        name.includes("salon") ||
        name.includes("beauty")
    ) {
        return "fa-solid fa-spa";
    }

    if (name.includes("garden")) {
        return "fa-solid fa-seedling";
    }

    if (
        name.includes("cctv") ||
        name.includes("camera")
    ) {
        return "fa-solid fa-video";
    }

    if (
        name.includes("water") ||
        name.includes("purifier")
    ) {
        return "fa-solid fa-droplet";
    }

    return "fa-solid fa-screwdriver-wrench";

}


/* =========================================================
   LOAD RECENT BOOKINGS
   ========================================================= */

async function loadRecentBookings() {

    const tableBody =
        document.getElementById(
            "recentBookingsBody"
        );

    if (!tableBody) return;

    try {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="oc-table-loading"
                >

                    <i class="fa-solid fa-spinner fa-spin"></i>

                    Loading bookings...

                </td>

            </tr>

        `;

        const response =
            await fetch(
                `${API_BASE}/bookings/`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );

        if (!response.ok) {

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                logoutUser();

                return;

            }

            throw new Error(
                `Bookings API error: ${response.status}`
            );

        }

        const responseData =
            await response.json();

        console.log(
            "Bookings API response:",
            responseData
        );

        let bookings = [];

        if (Array.isArray(responseData)) {

            bookings =
                responseData;

        }

        else if (
            Array.isArray(
                responseData.results
            )
        ) {

            bookings =
                responseData.results;

        }

        window.oneClickBookings =
            bookings;

        if (bookings.length === 0) {

            tableBody.innerHTML = `

                <tr>

                    <td
                        colspan="8"
                        class="oc-empty-bookings"
                    >

                        <i class="fa-regular fa-calendar-xmark"></i>

                        <strong>
                            No bookings found
                        </strong>

                        <div>
                            Your recent bookings will appear here.
                        </div>

                    </td>

                </tr>

            `;

            return;

        }

        const sortedBookings =
            [...bookings]
                .sort(
                    compareBookings
                )
                .slice(0, 5);

        tableBody.innerHTML =
            sortedBookings
                .map(
                    createBookingRow
                )
                .join("");

        refreshAOS();

    }

    catch (error) {

        console.error(
            "Error loading bookings:",
            error
        );

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="oc-empty-bookings"
                >

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    <strong>
                        Unable to load bookings
                    </strong>

                    <div>
                        Please check your API connection.
                    </div>

                </td>

            </tr>

        `;

    }

}


/* =========================================================
   BOOKING SORT
   ========================================================= */

function compareBookings(
    a,
    b
) {

    const dateA =
        getBookingSortDate(a);

    const dateB =
        getBookingSortDate(b);

    return dateB - dateA;

}


function getBookingSortDate(
    booking
) {

    if (booking.created_at) {

        const timestamp =
            new Date(
                booking.created_at
            ).getTime();

        if (!Number.isNaN(timestamp)) {

            return timestamp;

        }

    }

    return Number(
        booking.id || 0
    );

}



/* =========================================================
   CREATE BOOKING ROW
   ========================================================= */

function createBookingRow(
    booking
) {

    const bookingId =
        booking.id ?? "N/A";

    const serviceName =
        booking.service_name ||
        "Service";

    const providerName =
        booking.provider_name ||
        "Provider";

    const address =
        booking.address ||
        "Address not provided";

    const bookingDate =
        formatBookingDate(
            booking.booking_date
        );

    const bookingTime =
        formatBookingTime(
            booking.booking_time
        );

    const price =
        formatBookingPrice(
            booking.total_price
        );

    const status =
        booking.status ||
        "pending";

    const initials =
        getInitials(
            providerName
        );

    const statusInfo =
        getStatusInfo(
            status
        );


    /*
     * ---------------------------------------------------------
     * CANCEL BUTTON
     * ---------------------------------------------------------
     *
     * Customers can cancel:
     *
     * - pending bookings
     * - accepted bookings
     *
     * Completed, rejected and already cancelled bookings
     * do not show the cancel button.
     */

    const normalizedStatus =
        String(status)
            .trim()
            .toLowerCase();


    let cancelButton = "";


    if (
        normalizedStatus === "pending" ||
        normalizedStatus === "accepted"
    ) {

        cancelButton = `

            <button
                type="button"
                class="oc-row-action oc-cancel-booking"
                title="Cancel booking"
                data-booking-id="${escapeHtml(bookingId)}"
            >

                <i class="fa-solid fa-xmark"></i>

            </button>

        `;

    }


    return `

        <tr>

            <td>

                <span class="oc-booking-id">
                    #${escapeHtml(bookingId)}
                </span>

            </td>

            <td>

                <div class="oc-booking-service">

                    <strong>
                        ${escapeHtml(serviceName)}
                    </strong>

                    <small>
                        Service booking
                    </small>

                </div>

            </td>

            <td>

                <div class="oc-table-user">

                    <span class="oc-table-avatar">
                        ${escapeHtml(initials)}
                    </span>

                    <div>

                        <strong>
                            ${escapeHtml(providerName)}
                        </strong>

                        <small>
                            Service Provider
                        </small>

                    </div>

                </div>

            </td>

            <td>

                <span
                    class="oc-booking-address"
                    title="${escapeHtml(address)}"
                >
                    ${escapeHtml(address)}
                </span>

            </td>

            <td>

                <div class="oc-booking-datetime">

                    <strong>
                        ${escapeHtml(bookingDate)}
                    </strong>

                    <small>
                        ${escapeHtml(bookingTime)}
                    </small>

                </div>

            </td>

            <td>

                <span class="oc-booking-price">
                    ${escapeHtml(price)}
                </span>

            </td>

            <td>

                <span
                    class="oc-badge ${statusInfo.className}"
                >

                    <i class="${statusInfo.icon}"></i>

                    ${escapeHtml(statusInfo.text)}

                </span>

            </td>

            <td>

                ${cancelButton}

                <button
                    type="button"
                    class="oc-row-action"
                    title="View booking"
                    data-booking-id="${escapeHtml(bookingId)}"
                >

                    <i class="fa-solid fa-ellipsis-vertical"></i>

                </button>

            </td>

        </tr>

    `;

}




/* =========================================================
   BOOKING ACTIONS
   ========================================================= */

function setupBookingActions() {

    document.addEventListener(
        "click",
        event => {

            const bookingButton =
                event.target.closest(
                    ".oc-row-action"
                );

            if (!bookingButton) return;


            const bookingId =
                bookingButton.dataset.bookingId;


            if (
                !bookingId ||
                bookingId === "N/A"
            ) {

                console.error(
                    "Booking ID is missing."
                );

                return;

            }


            /*
             * -------------------------------------------------
             * CANCEL BOOKING
             * -------------------------------------------------
             */

            if (
                bookingButton.classList.contains(
                    "oc-cancel-booking"
                )
            ) {

                event.preventDefault();

                cancelCustomerBooking(
                    bookingId
                );

                return;

            }


            /*
             * -------------------------------------------------
             * VIEW BOOKING
             * -------------------------------------------------
             */

            event.preventDefault();

            window.location.href =
                `booking-details.html?id=${encodeURIComponent(bookingId)}`;

        }
    );

}


/* =========================================================
   CANCEL CUSTOMER BOOKING
   ========================================================= */

async function cancelCustomerBooking(
    bookingId
) {

    const confirmed =
        window.confirm(
            "Are you sure you want to cancel this booking?"
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_BASE}/bookings/${bookingId}/`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization":
                            "Bearer " +
                            localStorage.getItem(
                                "access_token"
                            )
                    },

                    body: JSON.stringify({
                        status: "cancelled"
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "Cancellation failed:",
                data
            );

            alert(
                data.error ||
                data.detail ||
                "Unable to cancel the booking."
            );

            return;

        }


        alert(
            "Booking cancelled successfully."
        );


        /*
         * Reload bookings so the status changes
         * from Pending → Cancelled and the
         * Cancel button disappears.
         */

       await loadRecentBookings();

       await loadDashboardStats();

    } catch (error) {

        console.error(
            "Error cancelling booking:",
            error
        );

        alert(
            "Unable to connect to the server."
        );

    }

}



/* =========================================================
   BOOKING DATE
   ========================================================= */

function formatBookingDate(
    value
) {

    if (!value) {
        return "Date not provided";
    }

    const date =
        new Date(
            `${String(value).substring(0, 10)}T00:00:00`
        );

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "2-digit",
            year: "numeric"
        }
    );

}


/* =========================================================
   BOOKING TIME
   ========================================================= */

function formatBookingTime(
    time
) {

    if (!time) {
        return "Time not provided";
    }

    const value =
        String(time);

    const parts =
        value.split(":");

    if (parts.length < 2) {
        return value;
    }

    const hours =
        Number(parts[0]);

    const minutes =
        parts[1];

    if (Number.isNaN(hours)) {
        return value;
    }

    const suffix =
        hours >= 12
            ? "PM"
            : "AM";

    let displayHour =
        hours % 12;

    if (displayHour === 0) {
        displayHour = 12;
    }

    return `${displayHour}:${minutes} ${suffix}`;

}


/* =========================================================
   BOOKING PRICE
   ========================================================= */

function formatBookingPrice(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "Rs. 0";

    }

    const numeric =
        Number(value);

    if (Number.isNaN(numeric)) {
        return String(value);
    }

    return `Rs. ${numeric.toLocaleString("en-IN")}`;

}


/* =========================================================
   BOOKING STATUS
   ========================================================= */

function getStatusInfo(
    status
) {

    const normalized =
        String(
            status || "pending"
        )
        .toLowerCase()
        .replace(/[\s_-]+/g, "");

    if (
        normalized === "completed" ||
        normalized === "accepted" ||
        normalized === "confirmed" ||
        normalized === "approved"
    ) {

        return {

            className:
                "oc-badge-success",

            text:
                formatStatusText(status),

            icon:
                "fa-solid fa-circle-check"

        };

    }

    if (
        normalized === "cancelled" ||
        normalized === "canceled" ||
        normalized === "rejected" ||
        normalized === "failed"
    ) {

        return {

            className:
                "oc-badge-danger",

            text:
                formatStatusText(status),

            icon:
                "fa-solid fa-circle-xmark"

        };

    }

    return {

        className:
            "oc-badge-warning",

        text:
            formatStatusText(status),

        icon:
            "fa-solid fa-clock"

    };

}


/* =========================================================
   STATUS TEXT
   ========================================================= */

function formatStatusText(
    status
) {

    if (!status) {
        return "Pending";
    }

    return String(status)

        .replace(
            /[\s_-]+/g,
            " "
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim()

        .replace(
            /\w\S*/g,
            word =>
                word.charAt(0).toUpperCase() +
                word.substring(1).toLowerCase()
        );

}


/* =========================================================
   LOAD RECOMMENDED PROVIDERS
   ========================================================= */

async function loadRecommendedProviders() {

    const grid =
        document.getElementById(
            "providersGrid"
        );

    if (!grid) {
        return;
    }

    try {

        grid.innerHTML = `

            <div class="col-12">

                <div class="oc-loading-state">

                    <i class="fa-solid fa-spinner fa-spin"></i>

                    Loading providers...

                </div>

            </div>

        `;

        const response =
            await fetch(
                `${API_BASE}/providers/`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );

        if (!response.ok) {

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                logoutUser();

                return;

            }

            throw new Error(
                `Providers API error: ${response.status}`
            );

        }

        const data =
            await response.json();

        console.log(
            "Providers data:",
            data
        );

        const providers =
            Array.isArray(data.results)
                ? data.results
                : Array.isArray(data)
                    ? data
                    : [];

        window.oneClickProviders =
            providers;

        console.log(
            "Providers found:",
            providers.length
        );

        if (providers.length === 0) {

            renderProviderResults(
                [],
                "No verified providers are available right now."
            );

            return;

        }

        renderProviderResults(
            providers,
            "Verified service providers available on OneClick"
        );

    }

    catch (error) {

        console.error(
            "Error loading providers:",
            error
        );

        grid.innerHTML = `

            <div class="col-12">

                <div class="oc-loading-state">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    Unable to load providers.

                </div>

            </div>

        `;

    }

}

/* =========================================================
   RENDER PROVIDERS
   ========================================================= */

function renderProviderResults(
    providers,
    subtitle
) {

    const grid =
        document.getElementById(
            "providersGrid"
        );

    if (!grid) return;

    const subtitleElement =
        document.getElementById(
            "providersSectionSubtitle"
        );

    if (subtitleElement) {

        subtitleElement.textContent =
            subtitle;

    }

   if (!providers.length) {

    grid.innerHTML = `

        <div class="col-12">

            <div class="oc-loading-state">

                <i class="fa-solid fa-magnifying-glass"></i>

                ${escapeHtml(
                    subtitle || "No providers found."
                )}

            </div>

        </div>

    `;

    return;
}

    grid.innerHTML =
        providers
            .slice(0, 8)
            .map(
                createProviderCard
            )
            .join("");

    refreshAOS();

}


/* =========================================================
   PROVIDER CARD
   ========================================================= */

function createProviderCard(
    provider
) {

    const providerId =
        provider.id;

    const providerName =
        provider.full_name ||
        "Provider";

    const category =
        provider.category_name ||
        "Service Provider";

    const experience =
        provider.experience ?? 0;

    const rating =
        Number(
            provider.rating ?? 0
        );

    const reviewCount =
        Number(
            provider.review_count ?? 0
        );

    const verified =
        provider.verified === true;

    const image =
        provider.profile_image ||
        "";

    const safeImage =
        resolveMediaUrl(image);

    const initials =
        getInitials(providerName);

    let photoHTML = `

        <div class="oc-provider-photo-fallback">

            <i class="fa-solid fa-user"></i>

        </div>

    `;

    if (safeImage) {

        photoHTML = `

            <img
                src="${escapeHtml(safeImage)}"
                alt="${escapeHtml(providerName)}"
                class="oc-provider-profile-image"
                loading="lazy"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            >

            <div
                class="oc-provider-photo-fallback"
                style="display:none;"
            >

                ${escapeHtml(initials)}

            </div>

        `;

    }

    const verifiedBadge =
        verified
            ? `

                <span class="oc-provider-badge">

                    <i class="fa-solid fa-check"></i>

                    Verified

                </span>

            `
            : "";

    const ratingValue =
        rating > 0
            ? rating.toFixed(1)
            : "New";

    const reviews =
        reviewCount > 0
            ? ` (${reviewCount})`
            : "";

    return `

        <div
            class="col-sm-6 col-lg-3"
            data-aos="fade-up"
        >

            <div
                class="oc-provider-card"
                data-provider-id="${escapeHtml(providerId)}"
            >

                <div class="oc-provider-photo">

                    ${photoHTML}

                </div>

                ${verifiedBadge}

                <h5
                    title="${escapeHtml(providerName)}"
                >

                    ${escapeHtml(providerName)}

                </h5>

                <p class="oc-provider-cat">

                    ${escapeHtml(category)}

                </p>

                <div class="oc-provider-meta">

                    <span>

                        <i class="fa-solid fa-briefcase"></i>

                        ${escapeHtml(experience)} yrs

                    </span>

                    <span class="oc-rating">

                        <i class="fa-solid fa-star"></i>

                        ${escapeHtml(ratingValue)}

                        ${escapeHtml(reviews)}

                    </span>

                </div>

                <button
                    class="btn oc-btn-book"
                    type="button"
                    data-provider-id="${escapeHtml(providerId)}"
                >

                    Book Now

                </button>

            </div>

        </div>

    `;

}


/* =========================================================
   MEDIA URL
   ========================================================= */

function resolveMediaUrl(
    value
) {

    if (!value) return "";

    const raw =
        String(value).trim();

    if (
        raw.startsWith("http://") ||
        raw.startsWith("https://")
    ) {

        return raw;

    }

    if (raw.startsWith("//")) {

        return `${window.location.protocol}${raw}`;

    }

    if (raw.startsWith("/")) {

        return `${API_ORIGIN}${raw}`;

    }

    return `${API_ORIGIN}/${raw.replace(/^\/+/, "")}`;

}


/* =========================================================
   OPEN PROVIDER PROFILE
   ========================================================= */

function openProviderProfile(
    providerId
) {

    if (!providerId) {

        console.error(
            "Provider ID is missing."
        );

        return;

    }

    window.location.href =
        `provider-profile.html?id=${encodeURIComponent(providerId)}`;

}


/* =========================================================
   SERVICE / PROVIDER CLICK ACTIONS
   ========================================================= */

function setupServiceClicks() {

    document.addEventListener(
        "click",
        event => {

            /* =================================================
               ALL SERVICES
               ================================================= */

            const serviceCard =
                event.target.closest(
                    ".oc-service-card"
                );

            if (serviceCard) {

                event.preventDefault();

                const serviceId =
                    serviceCard.dataset.serviceId;

                const service =
                    serviceCard.dataset.service;

                /*
                 * If the service has a real database ID,
                 * open the provider discovery page with
                 * that service ID.
                 */

                if (serviceId) {

                    window.location.href =
                        `providers.html?service_id=${encodeURIComponent(serviceId)}`;

                    return;

                }

                /*
                 * Fallback to the existing dashboard search
                 * if no service ID is available.
                 */

                if (service) {

                    performServiceSearch(service);

                }

                return;

            }


            /* =================================================
               QUICK ACTION SERVICES
               ================================================= */

            const quickCard =
                event.target.closest(
                    ".oc-quick-card"
                );

            if (quickCard) {

                event.preventDefault();

                const serviceId =
                    quickCard.dataset.serviceId;

                const service =
                    quickCard.dataset.service ||
                    quickCard.querySelector("h5")?.textContent;

                /*
                 * Use the real database service ID.
                 */

                if (serviceId) {

                    window.location.href =
                        `providers.html?service_id=${encodeURIComponent(serviceId)}`;

                    return;

                }

                /*
                 * Fallback if service ID is missing.
                 */

                if (service) {

                    performServiceSearch(service);

                }

                return;

            }


            /* =================================================
               PROVIDER BOOK NOW
               ================================================= */

            const providerButton =
                event.target.closest(
                    ".oc-btn-book"
                );

            if (providerButton) {

                event.preventDefault();

                const providerId =
                    providerButton.dataset.providerId;

                openProviderProfile(
                    providerId
                );

                return;

            }

        }
    );

}

/* =========================================================
   SEARCH SETUP
   ========================================================= */

function setupSearch() {

    const searchInput =
        document.getElementById(
            "dashboardServiceSearch"
        );

    const searchButton =
        document.getElementById(
            "dashboardSearchButton"
        );

    if (!searchInput) {

        console.warn(
            "dashboardServiceSearch not found."
        );

        return;

    }

    function performSearch() {

        const query =
            String(
                searchInput.value || ""
            ).trim();

        if (!query) return;

        console.log(
            "Dashboard service search:",
            query
        );

        performServiceSearch(query);

    }

    searchInput.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                performSearch();

            }

        }
    );

    if (searchButton) {

        searchButton.addEventListener(
            "click",
            performSearch
        );

    }

}


/* =========================================================
   PERFORM SERVICE SEARCH
   ========================================================= */

function performServiceSearch(
    query
) {

    const normalizedQuery =
        String(
            query || ""
        )
        .trim()
        .toLowerCase();

    if (!normalizedQuery) {
        return;
    }

    const services =
        window.oneClickServices || [];

    const providers =
        window.oneClickProviders || [];

    console.log(
        "Searching for:",
        normalizedQuery
    );


    /*
     * ---------------------------------------------------------
     * SEARCH ALIASES
     * ---------------------------------------------------------
     *
     * Only include aliases for services that actually exist
     * in the current database.
     */

    const searchAliases = {

        electrician: [
            "electrical repair",
            "electrical"
        ],

        electrical: [
            "electrical repair"
        ],

        plumber: [
            "plumbing"
        ],

        plumbing: [
            "plumbing"
        ],

        cleaner: [
            "deep home cleaning",
            "cleaning"
        ],

        cleaning: [
            "deep home cleaning",
            "cleaning"
        ],

        "home cleaning": [
            "deep home cleaning"
        ],

        carwash: [
            "car wash"
        ],

        "car wash": [
            "car wash"
        ]

    };


    const searchTerms = [

        normalizedQuery,

        ...(searchAliases[
            normalizedQuery
        ] || [])

    ];


    /*
     * ---------------------------------------------------------
     * FIND MATCHING SERVICES
     * ---------------------------------------------------------
     */

    const matchingServices =
        services.filter(
            function (
                service
            ) {

                const name =
                    String(
                        service.name || ""
                    ).toLowerCase();

                const description =
                    String(
                        service.description || ""
                    ).toLowerCase();

                const category =
                    String(
                        service.category_name || ""
                    ).toLowerCase();

                return searchTerms.some(
                    function (
                        term
                    ) {

                        return (

                            name.includes(term) ||

                            description.includes(term) ||

                            category.includes(term)

                        );

                    }
                );

            }
        );


    /*
     * ---------------------------------------------------------
     * FIND MATCHING PROVIDERS DIRECTLY
     * ---------------------------------------------------------
     */

    const matchingProviders =
        providers.filter(
            function (
                provider
            ) {

                const providerName =
                    String(
                        provider.full_name || ""
                    ).toLowerCase();

                const category =
                    String(
                        provider.category_name || ""
                    ).toLowerCase();

                const providerLocation =
                    String(
                        provider.location ||
                        provider.address ||
                        provider.city ||
                        ""
                    ).toLowerCase();

                return searchTerms.some(
                    function (
                        term
                    ) {

                        return (

                            providerName.includes(term) ||

                            category.includes(term) ||

                            providerLocation.includes(term)

                        );

                    }
                );

            }
        );


    /*
     * ---------------------------------------------------------
     * MATCH PROVIDERS THROUGH SERVICE CATEGORY
     * ---------------------------------------------------------
     *
     * Example:
     *
     * Electrical Repair
     *        ↓
     * Home Repair
     *        ↓
     * Home Repair providers
     *
     * Car Wash
     *        ↓
     * Vehicle Services
     *        ↓
     * Vehicle Services providers
     */

    if (
        matchingServices.length > 0
    ) {

        const serviceCategories =
            matchingServices
                .map(
                    function (
                        service
                    ) {

                        return String(
                            service.category_name || ""
                        )
                        .trim()
                        .toLowerCase();

                    }
                )
                .filter(Boolean);


        const serviceProviders =
            providers.filter(
                function (
                    provider
                ) {

                    const providerCategory =
                        String(
                            provider.category_name || ""
                        )
                        .trim()
                        .toLowerCase();

                    return serviceCategories.includes(
                        providerCategory
                    );

                }
            );


        if (
            serviceProviders.length > 0
        ) {

            renderProviderResults(
                serviceProviders,
                `Providers available for "${query}"`
            );

        }

        else if (
            matchingProviders.length > 0
        ) {

            renderProviderResults(
                matchingProviders,
                `Providers matching "${query}"`
            );

        }

        else {

            renderProviderResults(
                [],
                `No providers found for "${query}"`
            );

        }

    }

    else if (
        matchingProviders.length > 0
    ) {

        renderProviderResults(
            matchingProviders,
            `Providers matching "${query}"`
        );

    }

    else {

        renderProviderResults(
            [],
            `No providers found for "${query}"`
        );

    }


    /*
     * ---------------------------------------------------------
     * SCROLL TO PROVIDERS
     * ---------------------------------------------------------
     */

    const providersGrid =
        document.getElementById(
            "providersGrid"
        );

    if (providersGrid) {

        setTimeout(
            function () {

                providersGrid.scrollIntoView({

                    behavior:
                        "smooth",

                    block:
                        "center"

                });

            },
            100
        );

    }

}

/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogout() {

    document.addEventListener(
        "click",
        event => {

            const logoutButton =
                event.target.closest(
                    ".js-logout"
                );

            if (!logoutButton) return;

            event.preventDefault();

            logoutUser();

        }
    );

}


function logoutUser() {

    localStorage.removeItem(
        "access_token"
    );

    localStorage.removeItem(
        "refresh_token"
    );

    localStorage.removeItem(
        "user"
    );

    window.oneClickCustomer =
        null;

    window.oneClickServices =
        [];

    window.oneClickBookings =
        [];

    window.oneClickProviders =
        [];

    window.oneClickQuotations =
        [];

    window.location.replace(
        "login.html"
    );

}


/* =========================================================
   INITIALS
   ========================================================= */

function getInitials(
    name
) {

    const value =
        String(
            name || "Provider"
        ).trim();

    const parts =
        value
            .split(/\s+/)
            .filter(Boolean);

    if (!parts.length) {
        return "P";
    }

    return parts
        .slice(0, 2)
        .map(
            part =>
                part.charAt(0)
        )
        .join("")
        .toUpperCase();

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

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


/* =========================================================
   REFRESH AOS
   ========================================================= */

function refreshAOS() {

    if (
        typeof AOS !== "undefined"
    ) {

        setTimeout(
            () => AOS.refresh(),
            100
        );

    }

}


/* =========================================================
   CUSTOMER QUOTATIONS
   ========================================================= */

async function loadCustomerQuotations() {

    try {

        console.log(
            "Loading customer quotations..."
        );

        const response =
            await fetch(
                `${API_BASE}/services/quotations/`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );

        console.log(
            "Customer quotations response:",
            response.status
        );

        if (!response.ok) {

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                logoutUser();

                return;

            }

            throw new Error(
                `Quotation API error: ${response.status}`
            );

        }

        const data =
            await response.json();

        console.log(
            "Customer quotations data:",
            data
        );

        const quotations =
            Array.isArray(data.results)
                ? data.results
                : Array.isArray(data)
                    ? data
                    : [];

        window.oneClickQuotations =
            quotations;

        console.log(
            "Customer quotations found:",
            quotations.length
        );

        renderCustomerQuotations(
            quotations
        );

    }

    catch (error) {

        console.error(
            "Error loading customer quotations:",
            error
        );

        renderCustomerQuotationsError();

    }

}


/* =========================================================
   CREATE QUOTATION SECTION
   ========================================================= */

function createQuotationSection() {

    let section =
        document.getElementById(
            "customerQuotationsSection"
        );

    if (section) {
        return section;
    }

    const bookingsBody =
        document.getElementById(
            "recentBookingsBody"
        );

    if (!bookingsBody) {

        console.warn(
            "recentBookingsBody not found. Cannot place quotation section."
        );

        return null;

    }

    const bookingsContainer =
        bookingsBody.closest(
            ".card, section, .dashboard-card"
        );

    section =
        document.createElement(
            "div"
        );

    section.id =
        "customerQuotationsSection";

    section.className =
        "card mt-4";

    section.innerHTML = `

        <div class="card-body">

            <div
                class="d-flex justify-content-between align-items-center mb-3"
            >

                <div>

                    <h4 class="mb-1">

                        <i
                            class="fa-solid fa-file-invoice-dollar me-2"
                        ></i>

                        Provider Quotations

                    </h4>

                    <p
                        id="customerQuotationsSubtitle"
                        class="text-muted mb-0"
                    >

                        Compare quotations from service providers.

                    </p>

                </div>

                <span
                    id="customerQuotationBadge"
                    class="badge bg-primary"
                    style="display:none;"
                >

                    0

                </span>

            </div>

            <div
                id="customerQuotationsGrid"
                class="row g-3"
            ></div>

        </div>

    `;

    if (bookingsContainer) {

        bookingsContainer.parentNode.insertBefore(
            section,
            bookingsContainer
        );

    }

    else {

        bookingsBody.parentNode.insertBefore(
            section,
            bookingsBody
        );

    }

    return section;

}


/* =========================================================
   RENDER CUSTOMER QUOTATIONS
   ========================================================= */

function renderCustomerQuotations(
    quotations
) {

    const section =
        createQuotationSection();

    if (!section) {
        return;
    }

    const grid =
        document.getElementById(
            "customerQuotationsGrid"
        );

    const badge =
        document.getElementById(
            "customerQuotationBadge"
        );

    const subtitle =
        document.getElementById(
            "customerQuotationsSubtitle"
        );

    if (!grid) {
        return;
    }

    if (badge) {

        badge.textContent =
            quotations.length;

        badge.style.display =
            quotations.length > 0
                ? "inline-block"
                : "none";

    }

    if (quotations.length === 0) {

        if (subtitle) {

            subtitle.textContent =
                "No quotations have been received yet.";

        }

        grid.innerHTML = `

            <div class="col-12">

                <div class="oc-loading-state">

                    <i class="fa-regular fa-file-lines"></i>

                    <strong class="d-block mt-2">

                        No quotations yet

                    </strong>

                    <div>

                        Provider quotations for your service requests
                        will appear here.

                    </div>

                </div>

            </div>

        `;

        return;

    }

    if (subtitle) {

        subtitle.textContent =
            `${quotations.length} quotation${quotations.length === 1 ? "" : "s"} received from providers.`;

    }

    grid.innerHTML =
        quotations
            .map(
                createCustomerQuotationCard
            )
            .join("");

    refreshAOS();

}


/* =========================================================
   CUSTOMER QUOTATION CARD
   ========================================================= */

function createCustomerQuotationCard(
    quotation
) {

    const quotationId =
        quotation.id ?? "N/A";

    const providerName =
        quotation.provider_name ||
        "Service Provider";

    const serviceName =
        quotation.service_name ||
        "Service";

    const price =
        formatQuotationPrice(
            quotation.price
        );

    const status =
        String(
            quotation.status || "pending"
        ).toLowerCase();

    const createdDate =
        quotation.created_at
            ? formatQuotationDate(
                quotation.created_at
            )
            : "Date not available";

    const initials =
        getInitials(
            providerName
        );

    const statusInfo =
        getQuotationStatusInfo(
            status
        );


    /* =====================================================
       MESSAGE DISPLAY
       ===================================================== */

    let messageHTML = "";


    if (status === "pending") {

        messageHTML = `

            <div class="mb-3">

                <small class="text-muted d-block mb-1">
                    Provider Message
                </small>

                <p class="mb-0">

                    ${escapeHtml(
                        quotation.message ||
                        "No message provided."
                    )}

                </p>

            </div>

        `;

    }


    else if (status === "countered") {

        messageHTML = `

            <div class="mb-3">

                <small class="text-muted d-block mb-1">
                    Provider Message
                </small>

                <p class="mb-2">

                    ${escapeHtml(
                        quotation.message ||
                        "No message provided."
                    )}

                </p>

                <div class="border rounded p-2 bg-light">

                    <small class="text-muted d-block">
                        Your Counter Offer
                    </small>

                    <strong class="d-block">

                        ${escapeHtml(
                            formatQuotationPrice(
                                quotation.counter_price
                            )
                        )}

                    </strong>

                    <small class="text-muted d-block mt-1">

                        ${escapeHtml(
                            quotation.counter_message ||
                            "No counter message provided."
                        )}

                    </small>

                </div>

            </div>

        `;

    }


    else if (status === "final") {

        messageHTML = `

            <div class="mb-3">

                <small class="text-muted d-block mb-1">
                    Provider Final Message
                </small>

                <p class="mb-0">

                    ${escapeHtml(
                        quotation.final_message ||
                        quotation.message ||
                        "No message provided."
                    )}

                </p>

            </div>

        `;

    }


    else if (
        status === "accepted" ||
        status === "rejected"
    ) {

        messageHTML = `

            <div class="mb-3">

                <small class="text-muted d-block mb-1">
                    Provider Message
                </small>

                <p class="mb-0">

                    ${escapeHtml(
                        quotation.final_message ||
                        quotation.message ||
                        quotation.counter_message ||
                        "No message provided."
                    )}

                </p>

            </div>

        `;

    }


    else {

        messageHTML = `

            <div class="mb-3">

                <small class="text-muted d-block mb-1">
                    Provider Message
                </small>

                <p class="mb-0">

                    ${escapeHtml(
                        quotation.message ||
                        "No message provided."
                    )}

                </p>

            </div>

        `;

    }


    /* =====================================================
       ACTION BUTTONS
       ===================================================== */

    let actionButtons = "";


    /*
     * Pending:
     * Customer can currently Accept or Reject.
     *
     * Counter Offer will be added next.
     */

   
if (status === "pending") {

    actionButtons = `

        <button
            type="button"
            class="btn btn-primary btn-sm"
            onclick="acceptCustomerQuotation(${quotationId})"
        >
            <i class="fa-solid fa-check me-1"></i>
            Accept
        </button>

        <button
            type="button"
            class="btn btn-warning btn-sm"
            onclick="openCounterOfferModal(${quotationId})"
        >
            <i class="fa-solid fa-handshake me-1"></i>
            Counter Offer
        </button>

        <button
            type="button"
            class="btn btn-outline-danger btn-sm"
            onclick="rejectCustomerQuotation(${quotationId})"
        >
            <i class="fa-solid fa-xmark me-1"></i>
            Reject
        </button>

    `;

}




    /*
     * Countered:
     * Waiting for provider final offer.
     */

    else if (status === "countered") {

        actionButtons = `

            <div class="mt-3">

                <div class="alert alert-warning mb-0">

                    <i class="fa-solid fa-clock me-1"></i>

                    Waiting for the provider's final offer.

                </div>

            </div>

        `;

    }


    /*
     * Final:
     * Customer can Accept or Reject.
     */

    else if (status === "final") {

        actionButtons = `

            <div class="d-flex gap-2 mt-3">

                <button
                    type="button"
                    class="btn btn-success flex-fill"
                    onclick="acceptCustomerQuotation(${quotationId})"
                >

                    <i class="fa-solid fa-check me-1"></i>

                    Accept Final Offer

                </button>

                <button
                    type="button"
                    class="btn btn-outline-danger flex-fill"
                    onclick="rejectCustomerQuotation(${quotationId})"
                >

                    <i class="fa-solid fa-xmark me-1"></i>

                    Reject

                </button>

            </div>

        `;

    }


    return `

        <div
            class="col-md-6 col-xl-4"
            data-aos="fade-up"
        >

            <div
                class="card h-100 border quotation-card"
                data-quotation-id="${escapeHtml(quotationId)}"
            >

                <div class="card-body">


                    <!-- PROVIDER -->

                    <div
                        class="d-flex align-items-center mb-3"
                    >

                        <div
                            class="rounded-circle bg-light d-flex align-items-center justify-content-center me-3"
                            style="
                                width:48px;
                                height:48px;
                                font-weight:600;
                            "
                        >

                            ${escapeHtml(initials)}

                        </div>

                        <div class="flex-grow-1">

                            <h6 class="mb-1">

                                ${escapeHtml(providerName)}

                            </h6>

                            <small class="text-muted">

                                Service Provider

                            </small>

                        </div>

                    </div>


                    <!-- SERVICE -->

                    <div class="mb-3">

                        <small class="text-muted d-block">

                            Service

                        </small>

                        <strong>

                            ${escapeHtml(serviceName)}

                        </strong>

                    </div>


                    <!-- PRICE -->

                    <div class="mb-3">

                        <small class="text-muted d-block">

                            ${status === "final"
                                ? "Final Price"
                                : "Quoted Price"}

                        </small>

                        <h4 class="mb-0">

                            ${escapeHtml(price)}

                        </h4>

                    </div>


                    <!-- MESSAGE -->

                    ${messageHTML}


                    <!-- STATUS + DATE -->

                    <div
                        class="d-flex justify-content-between align-items-center"
                    >

                        <span
                            class="oc-badge ${statusInfo.className}"
                        >

                            <i class="${statusInfo.icon}"></i>

                            ${escapeHtml(
                                statusInfo.text
                            )}

                        </span>

                        <small class="text-muted">

                            ${escapeHtml(createdDate)}

                        </small>

                    </div>


                    <!-- QUOTATION ID -->

                    <div class="mt-3">

                        <small class="text-muted">

                            Quotation #${escapeHtml(
                                quotationId
                            )}

                        </small>

                    </div>


                    <!-- ACTION BUTTONS -->

                    ${actionButtons}

                </div>

            </div>

        </div>

    `;

}


/* =========================================================
   QUOTATION PRICE
   ========================================================= */

function formatQuotationPrice(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "Rs. 0";

    }

    const numeric =
        Number(value);

    if (Number.isNaN(numeric)) {
        return String(value);
    }

    return `Rs. ${numeric.toLocaleString("en-IN")}`;

}


/* =========================================================
   QUOTATION DATE
   ========================================================= */

function formatQuotationDate(
    value
) {

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

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
   QUOTATION STATUS
   ========================================================= */

function getQuotationStatusInfo(
    status
) {

    const normalized =
        String(
            status || "pending"
        )
        .toLowerCase();

    if (
        normalized === "accepted" ||
        normalized === "final"
    ) {

        return {

            className:
                "oc-badge-success",

            text:
                formatQuotationStatus(status),

            icon:
                "fa-solid fa-circle-check"

        };

    }

    if (normalized === "rejected") {

        return {

            className:
                "oc-badge-danger",

            text:
                formatQuotationStatus(status),

            icon:
                "fa-solid fa-circle-xmark"

        };

    }

    if (normalized === "countered") {

        return {

            className:
                "oc-badge-warning",

            text:
                "Countered",

            icon:
                "fa-solid fa-arrow-right-arrow-left"

        };

    }

    return {

        className:
            "oc-badge-warning",

        text:
            formatQuotationStatus(status),

        icon:
            "fa-solid fa-clock"

    };

}


/* =========================================================
   QUOTATION STATUS TEXT
   ========================================================= */

function formatQuotationStatus(
    status
) {

    if (!status) {
        return "Pending";
    }

    return String(status)

        .replace(
            /[\s_-]+/g,
            " "
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim()

        .replace(
            /\w\S*/g,
            word =>
                word.charAt(0).toUpperCase() +
                word.substring(1).toLowerCase()
        );

}



/* =========================================================
   ACCEPT CUSTOMER QUOTATION
   ========================================================= */

function acceptCustomerQuotation(
    quotationId
) {

    const token =
        localStorage.getItem(
            "access_token"
        );

    if (!token) {

        window.location.href =
            "login.html";

        return;

    }

    const quotationIdInput =
        document.getElementById(
            "acceptQuotationId"
        );

    const bookingDate =
        document.getElementById(
            "bookingDate"
        );

    const bookingTime =
        document.getElementById(
            "bookingTime"
        );

    const bookingNote =
        document.getElementById(
            "bookingNote"
        );

    const errorBox =
        document.getElementById(
            "acceptQuotationError"
        );

    const modalElement =
        document.getElementById(
            "acceptQuotationModal"
        );

    if (
        !quotationIdInput ||
        !bookingDate ||
        !bookingTime ||
        !bookingNote ||
        !errorBox ||
        !modalElement
    ) {

        console.error(
            "Accept quotation modal elements are missing."
        );

        return;

    }

    /*
     * Store quotation ID
     */
    quotationIdInput.value =
        quotationId;

    /*
     * Clear old values
     */
    bookingDate.value =
        "";

    bookingTime.value =
        "";

    bookingNote.value =
        "";

    errorBox.textContent =
        "";

    errorBox.classList.add(
        "d-none"
    );

    /*
     * Set minimum date to today
     */
    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );

    bookingDate.min =
        `${year}-${month}-${day}`;

    /*
     * Open Bootstrap modal
     */
    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );

    modal.show();

}


/* =========================================================
   CONFIRM QUOTATION BOOKING
   ========================================================= */

async function confirmCustomerQuotationBooking() {

    const token =
        localStorage.getItem(
            "access_token"
        );

    if (!token) {

        window.location.href =
            "login.html";

        return;

    }

    const quotationId =
        document.getElementById(
            "acceptQuotationId"
        ).value;

    const bookingDate =
        document.getElementById(
            "bookingDate"
        ).value;

    const bookingTime =
        document.getElementById(
            "bookingTime"
        ).value;

    const bookingNote =
        document.getElementById(
            "bookingNote"
        ).value.trim();

    const errorBox =
        document.getElementById(
            "acceptQuotationError"
        );

    const confirmButton =
        document.getElementById(
            "confirmQuotationBookingBtn"
        );

    /*
     * Clear old error
     */
    errorBox.textContent =
        "";

    errorBox.classList.add(
        "d-none"
    );

    /*
     * Validate quotation
     */
    if (!quotationId) {

        errorBox.textContent =
            "Quotation information is missing.";

        errorBox.classList.remove(
            "d-none"
        );

        return;

    }

    /*
     * Validate date
     */
    if (!bookingDate) {

        errorBox.textContent =
            "Please select a booking date.";

        errorBox.classList.remove(
            "d-none"
        );

        return;

    }

    /*
     * Validate time
     */
    if (!bookingTime) {

        errorBox.textContent =
            "Please select a booking time.";

        errorBox.classList.remove(
            "d-none"
        );

        return;

    }

    /*
     * Prevent double click
     */
    confirmButton.disabled =
        true;

    confirmButton.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin me-1"></i>

        Creating Booking...

    `;

    console.log(
        "Accepting quotation:",
        quotationId
    );

    console.log(
        "Booking date:",
        bookingDate
    );

    console.log(
        "Booking time:",
        bookingTime
    );

    try {

        const response =
            await fetch(
                `${API_BASE}/services/quotations/${quotationId}/accept/`,
                {
                    method: "PUT",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            booking_date:
                                bookingDate,

                            booking_time:
                                bookingTime,

                            note:
                                bookingNote

                        })

                }
            );

        const data =
            await response
                .json()
                .catch(
                    function () {
                        return {};
                    }
                );

        console.log(
            "Accept quotation response:",
            response.status
        );

        console.log(
            "Accept quotation data:",
            data
        );

        /*
         * Session expired
         */
        if (
            response.status === 401
        ) {

            alert(
                "Your login session has expired. Please login again."
            );

            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "refresh_token"
            );

            window.location.href =
                "login.html";

            return;

        }

        /*
         * Backend error
         */
        if (!response.ok) {

            errorBox.textContent =
                data.detail ||
                data.error ||
                "Unable to accept quotation.";

            errorBox.classList.remove(
                "d-none"
            );

            return;

        }

        /*
         * Close modal
         */
        const modalElement =
            document.getElementById(
                "acceptQuotationModal"
            );

        const modal =
            bootstrap.Modal.getInstance(
                modalElement
            );

        if (modal) {

            modal.hide();

        }

        /*
         * Show success
         */
        alert(
            `Booking created successfully! Booking #${data.booking_id || "created"}`
        );

        /*
         * Reload quotations
         */
        await loadCustomerQuotations();

        /*
         * Reload dashboard statistics
         */
        if (
            typeof loadDashboardStats ===
            "function"
        ) {

            await loadDashboardStats();

        }

        /*
         * Reload recent bookings
         */
        if (
            typeof loadRecentBookings ===
            "function"
        ) {

            await loadRecentBookings();

        }

    }

    catch (error) {

        console.error(
            "Accept quotation error:",
            error
        );

        errorBox.textContent =
            "Something went wrong while creating the booking.";

        errorBox.classList.remove(
            "d-none"
        );

    }

    finally {

        confirmButton.disabled =
            false;

        confirmButton.innerHTML = `

            <i class="fa-solid fa-calendar-check"></i>

            Confirm Booking

        `;

    }

}




/* =========================================================
   REJECT CUSTOMER QUOTATION
   ========================================================= */

async function rejectCustomerQuotation(
    quotationId
) {

    const token =
        localStorage.getItem(
            "access_token"
        );

    if (!token) {

        window.location.href =
            "login.html";

        return;

    }

    const confirmed =
        confirm(
            "Are you sure you want to reject this quotation?"
        );

    if (!confirmed) {
        return;
    }

    console.log(
        "Rejecting quotation:",
        quotationId
    );

    try {

        const response =
            await fetch(
                `${API_BASE}/services/quotations/${quotationId}/reject/`,
                {
                    method: "PUT",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`,
                        "Content-Type":
                            "application/json"
                    }
                }
            );

        const data =
            await response
                .json()
                .catch(
                    function () {
                        return {};
                    }
                );

        console.log(
            "Reject quotation response:",
            response.status
        );

        console.log(
            "Reject quotation data:",
            data
        );

        if (response.status === 401) {

            alert(
                "Your login session has expired. Please login again."
            );

            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "refresh_token"
            );

            window.location.href =
                "login.html";

            return;

        }

        if (!response.ok) {

            alert(
                data.detail ||
                data.error ||
                "Unable to reject quotation."
            );

            return;

        }

        alert(
            "Quotation rejected successfully!"
        );

        await loadCustomerQuotations();

    }

    catch (error) {

        console.error(
            "Reject quotation error:",
            error
        );

        alert(
            "Something went wrong while rejecting the quotation."
        );

    }

}


/* =========================================================
   QUOTATION ERROR
   ========================================================= */

function renderCustomerQuotationsError() {

    const section =
        createQuotationSection();

    if (!section) {
        return;
    }

    const grid =
        document.getElementById(
            "customerQuotationsGrid"
        );

    if (!grid) {
        return;
    }

    grid.innerHTML = `

        <div class="col-12">

            <div class="oc-loading-state">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <strong class="d-block mt-2">

                    Unable to load quotations

                </strong>

                <div>

                    Please check your API connection and try again.

                </div>

            </div>

        </div>

    `;

}


/* =========================================================
   ONECLICK — CREATE SERVICE REQUEST
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupServiceRequestForm();

        loadServiceRequestServices();

    }
);


/* =========================================================
   GET AUTH HEADERS
   ========================================================= */

function getServiceRequestHeaders() {

    const token =
        localStorage.getItem(
            "access_token"
        );

    return {

        "Authorization":
            `Bearer ${token}`

    };

}


/* =========================================================
   LOAD SERVICES INTO REQUEST DROPDOWN
   ========================================================= */

async function loadServiceRequestServices() {

    const select =
        document.getElementById(
            "requestService"
        );

    if (!select) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API_BASE}/services/`,
                {
                    method: "GET",
                    headers:
                        getServiceRequestHeaders()
                }
            );

        if (!response.ok) {

            console.error(
                "Failed to load services:",
                response.status
            );

            return;

        }

        const data =
            await response.json();

        console.log(
            "Service request dropdown data:",
            data
        );

        const services =
            Array.isArray(data)
                ? data
                : data.results || [];

        select.innerHTML = `

            <option value="">

                Select a service

            </option>

        `;

        services.forEach(
            function (service) {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    service.id;

                option.textContent =
                    service.name;

                select.appendChild(
                    option
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Error loading request services:",
            error
        );

    }

}


/* =========================================================
   SETUP SERVICE REQUEST FORM
   ========================================================= */

function setupServiceRequestForm() {

    const form =
        document.getElementById(
            "serviceRequestForm"
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        submitServiceRequest
    );

}


/* =========================================================
   SUBMIT SERVICE REQUEST
   ========================================================= */

async function submitServiceRequest(
    event
) {

    event.preventDefault();

    const service =
        document.getElementById(
            "requestService"
        ).value;

    const description =
        document.getElementById(
            "requestDescription"
        ).value.trim();

    const address =
        document.getElementById(
            "requestAddress"
        ).value.trim();

    const imageInput =
        document.getElementById(
            "requestImage"
        );

    const errorBox =
        document.getElementById(
            "serviceRequestError"
        );

    const successBox =
        document.getElementById(
            "serviceRequestSuccess"
        );

    const submitButton =
        document.getElementById(
            "submitServiceRequestBtn"
        );


    errorBox.classList.add(
        "d-none"
    );

    errorBox.textContent =
        "";

    successBox.classList.add(
        "d-none"
    );

    successBox.textContent =
        "";


    if (!service) {

        errorBox.textContent =
            "Please select a service.";

        errorBox.classList.remove(
            "d-none"
        );

        return;

    }


    if (!description) {

        errorBox.textContent =
            "Please describe the service you need.";

        errorBox.classList.remove(
            "d-none"
        );

        return;

    }


    if (!address) {

        errorBox.textContent =
            "Please enter your service address.";

        errorBox.classList.remove(
            "d-none"
        );

        return;

    }


    submitButton.disabled =
        true;

    submitButton.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin me-2"></i>

        Sending...

    `;


    try {

        const formData =
            new FormData();


        formData.append(
            "service",
            service
        );

        formData.append(
            "description",
            description
        );

        formData.append(
            "address",
            address
        );


        if (
            imageInput.files &&
            imageInput.files.length > 0
        ) {

            formData.append(
                "image",
                imageInput.files[0]
            );

        }


        const response =
            await fetch(
                `${API_BASE}/services/requests/`,
                {
                    method: "POST",

                    headers: {

                        "Authorization":
                            `Bearer ${localStorage.getItem("access_token")}`

                    },

                    body:
                        formData

                }
            );


        const data =
            await response.json();


        console.log(
            "Service request response:",
            response.status,
            data
        );


        if (!response.ok) {

            let message =
                "Failed to create service request.";

            if (data.detail) {

                message =
                    data.detail;

            }

            else {

                const firstError =
                    Object.values(data)[0];

                if (
                    Array.isArray(firstError) &&
                    firstError.length > 0
                ) {

                    message =
                        firstError[0];

                }

            }

            throw new Error(
                message
            );

        }


        successBox.textContent =
            "Service request created successfully! Providers can now send you quotations.";

        successBox.classList.remove(
            "d-none"
        );


        document
            .getElementById(
                "serviceRequestForm"
            )
            .reset();


        if (
            typeof loadCustomerQuotations ===
            "function"
        ) {

            loadCustomerQuotations();

        }


        setTimeout(
            function () {

                const modalElement =
                    document.getElementById(
                        "serviceRequestModal"
                    );

                if (modalElement) {

                    const modal =
                        bootstrap.Modal.getInstance(
                            modalElement
                        );

                    if (modal) {

                        modal.hide();

                    }

                }

                successBox.classList.add(
                    "d-none"
                );

            },
            1500
        );


    }

    catch (error) {

        console.error(
            "Create service request error:",
            error
        );

        errorBox.textContent =
            error.message ||
            "Something went wrong. Please try again.";

        errorBox.classList.remove(
            "d-none"
        );

    }

    finally {

        submitButton.disabled =
            false;

        submitButton.innerHTML = `

            <i class="fa-solid fa-paper-plane me-2"></i>

            Send Request

        `;

    }

}


/* =========================================================
   FIX — CONFIRM BOOKING BUTTON
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const confirmButton =
        document.getElementById("confirmQuotationBookingBtn");

    if (!confirmButton) {
        console.error(
            "Confirm Booking button was not found."
        );
        return;
    }

    console.log(
        "Confirm Booking button connected."
    );

    confirmButton.onclick =
        function () {

            console.log(
                "Confirm Booking button clicked."
            );

            confirmCustomerQuotationBooking();

        };

});


/* =========================================================
   OPEN CUSTOMER COUNTER OFFER MODAL
========================================================= */

function openCounterOfferModal(
    quotationId
) {

    const modalElement =
        document.getElementById(
            "counterOfferModal"
        );

    const quotationIdInput =
        document.getElementById(
            "counterQuotationId"
        );

    const counterPrice =
        document.getElementById(
            "counterPrice"
        );

    const counterMessage =
        document.getElementById(
            "counterMessage"
        );

    const errorBox =
        document.getElementById(
            "counterOfferError"
        );

    if (
        !modalElement ||
        !quotationIdInput ||
        !counterPrice ||
        !counterMessage ||
        !errorBox
    ) {

        console.error(
            "Counter Offer modal elements are missing."
        );

        return;

    }

    quotationIdInput.value =
        quotationId;

    counterPrice.value =
        "";

    counterMessage.value =
        "";

    errorBox.textContent =
        "";

    errorBox.classList.add(
        "d-none"
    );

    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );

    modal.show();

}

/* =========================================================
   SUBMIT CUSTOMER COUNTER OFFER
========================================================= */

async function submitCustomerCounterOffer() {

    const token =
        localStorage.getItem(
            "access_token"
        );

    if (!token) {

        window.location.href =
            "login.html";

        return;

    }

    const quotationId =
        document.getElementById(
            "counterQuotationId"
        ).value;

    const counterPrice =
        document.getElementById(
            "counterPrice"
        ).value;

    const counterMessage =
        document.getElementById(
            "counterMessage"
        ).value.trim();

    const errorBox =
        document.getElementById(
            "counterOfferError"
        );

    const submitButton =
        document.getElementById(
            "submitCounterOfferBtn"
        );

    /*
     * Clear old error
     */
    errorBox.textContent =
        "";

    errorBox.classList.add(
        "d-none"
    );

    /*
     * Validate quotation
     */
    if (!quotationId) {

        errorBox.textContent =
            "Quotation information is missing.";

        errorBox.classList.remove(
            "d-none"
        );

        return;

    }

    /*
     * Validate price
     */
    if (
        !counterPrice ||
        Number(counterPrice) <= 0
    ) {

        errorBox.textContent =
            "Please enter a valid offer price.";

        errorBox.classList.remove(
            "d-none"
        );

        return;

    }

    /*
     * Prevent double submission
     */
    submitButton.disabled =
        true;

    submitButton.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin me-1"></i>
        Sending...
    `;

    console.log(
        "Submitting counter offer..."
    );

    console.log(
        "Quotation ID:",
        quotationId
    );

    console.log(
        "Counter price:",
        counterPrice
    );

    console.log(
        "Counter message:",
        counterMessage
    );

    try {

        const response =
            await fetch(
                `${API_BASE}/services/quotations/${quotationId}/counter/`,
                {
                    method: "PUT",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            counter_price:
                                Number(counterPrice),

                            counter_message:
                                counterMessage

                        })

                }
            );

        const data =
            await response
                .json()
                .catch(
                    function () {
                        return {};
                    }
                );

        console.log(
            "Counter offer response:",
            response.status
        );

        console.log(
            "Counter offer data:",
            data
        );

        /*
         * Session expired
         */
        if (
            response.status === 401
        ) {

            alert(
                "Your login session has expired. Please login again."
            );

            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "refresh_token"
            );

            window.location.href =
                "login.html";

            return;

        }

        /*
         * Backend error
         */
        if (!response.ok) {

            errorBox.textContent =
                data.detail ||
                data.error ||
                "Unable to send counter offer.";

            errorBox.classList.remove(
                "d-none"
            );

            return;

        }

        /*
         * Close modal
         */
        const modalElement =
            document.getElementById(
                "counterOfferModal"
            );

        const modal =
            bootstrap.Modal.getInstance(
                modalElement
            );

        if (modal) {

            modal.hide();

        }

        /*
         * Success
         */
        alert(
            "Counter offer sent successfully!"
        );

        /*
         * Reload quotations
         */
        await loadCustomerQuotations();

    }

    catch (error) {

        console.error(
            "Counter offer error:",
            error
        );

        errorBox.textContent =
            "Something went wrong while sending the counter offer.";

        errorBox.classList.remove(
            "d-none"
        );

    }

    finally {

        submitButton.disabled =
            false;

        submitButton.innerHTML = `
            <i class="fa-solid fa-handshake"></i>
            Send Counter Offer
        `;

    }

}

/* =========================================================
   COUNTER OFFER BUTTON
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const submitButton =
            document.getElementById(
                "submitCounterOfferBtn"
            );

        if (!submitButton) {

            console.error(
                "Counter Offer button not found."
            );

            return;

        }

        console.log(
            "Counter Offer button connected."
        );

        submitButton.addEventListener(
            "click",
            function () {

                console.log(
                    "Counter Offer button clicked."
                );

                submitCustomerCounterOffer();

            }
        );

    }
);




