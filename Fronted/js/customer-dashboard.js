/* ==========================================================
   OneClick — Customer Dashboard
   Dynamic Customer + Statistics + Bookings + Providers
   ========================================================== */


/* ==========================================================
   API CONFIGURATION
   ========================================================== */

const API_BASE = "http://127.0.0.1:8000/api";

const API_ORIGIN = new URL(API_BASE).origin;


/* ==========================================================
   AUTHENTICATION
   ========================================================== */

const accessToken = localStorage.getItem("access_token");

if (!accessToken) {

    window.location.href = "login.html";

}


/* ==========================================================
   PAGE INITIALIZATION
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    if (!accessToken) {
        return;
    }


    /* ---------- AOS ---------- */

    if (typeof AOS !== "undefined") {

        AOS.init({
            duration: 650,
            easing: "ease-out-cubic",
            once: true,
            offset: 60
        });

    }


    /* ---------- Page functions ---------- */

    setGreeting();

    renderServices();

    loadCustomer();

    loadDashboardStats();

    loadRecentBookings();

    loadRecommendedProviders();


    /* ---------- Other interactions ---------- */

    setupLogout();

    setupServiceClicks();

    setupSearch();

});


/* ==========================================================
   API HEADERS
   ========================================================== */

function getHeaders() {

    return {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
    };

}


/* ==========================================================
   DYNAMIC GREETING
   ========================================================== */

function setGreeting() {

    const element =
        document.getElementById("greetingText");

    if (!element) {
        return;
    }


    const hour =
        new Date().getHours();


    let text = "Good Morning";

    let icon = "fa-regular fa-sun";


    if (hour >= 12 && hour < 17) {

        text = "Good Afternoon";

        icon = "fa-solid fa-cloud-sun";

    }
    else if (hour >= 17 || hour < 5) {

        text = "Good Evening";

        icon = "fa-regular fa-moon";

    }


    element.innerHTML = `
        <i class="${icon}"></i>
        ${text}
    `;

}


/* ==========================================================
   SERVICES
   ========================================================== */

function renderServices() {

    const grid =
        document.getElementById("servicesGrid");

    if (!grid) {
        return;
    }


    const services = [

        {
            name: "Electrician",
            icon: "fa-solid fa-bolt"
        },

        {
            name: "Plumber",
            icon: "fa-solid fa-faucet-drip"
        },

        {
            name: "Home Cleaning",
            icon: "fa-solid fa-broom"
        },

        {
            name: "Painting",
            icon: "fa-solid fa-paint-roller"
        },

        {
            name: "Carpenter",
            icon: "fa-solid fa-hammer"
        },

        {
            name: "AC Repair",
            icon: "fa-solid fa-snowflake"
        },

        {
            name: "Appliance Repair",
            icon: "fa-solid fa-blender"
        },

        {
            name: "Pest Control",
            icon: "fa-solid fa-bug-slash"
        },

        {
            name: "Home Shifting",
            icon: "fa-solid fa-truck-moving"
        },

        {
            name: "Salon for Women",
            icon: "fa-solid fa-spa"
        },

        {
            name: "Salon for Men",
            icon: "fa-solid fa-scissors"
        },

        {
            name: "Gardening",
            icon: "fa-solid fa-seedling"
        },

        {
            name: "Car Wash",
            icon: "fa-solid fa-car"
        },

        {
            name: "CCTV Install",
            icon: "fa-solid fa-video"
        },

        {
            name: "Water Purifier",
            icon: "fa-solid fa-droplet"
        }

    ];


    grid.innerHTML = services.map(
        (service, index) => {

            return `

                <div
                    class="col-6 col-sm-4 col-lg-3 col-xl-2"
                    data-aos="fade-up"
                    data-aos-delay="${(index % 6) * 60}"
                >

                    <div
                        class="oc-service-card"
                        data-service="${escapeHtml(service.name)}"
                    >

                        <div class="oc-service-icon">

                            <i class="${service.icon}"></i>

                        </div>

                        <h6>
                            ${escapeHtml(service.name)}
                        </h6>

                    </div>

                </div>

            `;

        }
    ).join("");


    refreshAOS();

}


/* ==========================================================
   LOAD CUSTOMER
   ========================================================== */

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


        /* ---------- First name ---------- */

        const firstName =
            String(
                user.first_name ||
                user.username ||
                user.email?.split("@")[0] ||
                "User"
            ).trim();


        /* ---------- Full name ---------- */

        const fullName =
            `${user.first_name || ""} ${user.last_name || ""}`
                .trim() ||
            firstName;


        /* ---------- Welcome name ---------- */

        const customerName =
            document.getElementById(
                "customerName"
            );

        if (customerName) {

            customerName.textContent =
                firstName;

        }


        /* ---------- Profile name ---------- */

        const profileName =
            document.getElementById(
                "profileName"
            );

        if (profileName) {

            profileName.textContent =
                fullName;

        }


        /* ---------- Avatar ---------- */

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


        /* ---------- Save user ---------- */

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


/* ==========================================================
   DASHBOARD STATISTICS
   ========================================================== */

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
            data.statistics ||
            data.stats ||
            data ||
            {};


        /* ---------- Total bookings ---------- */

        updateCounter(
            document.getElementById("totalBookings"),
            firstExistingValue(
                stats.total_bookings,
                stats.totalBookings,
                stats.bookings_count,
                0
            )
        );


        /* ---------- Completed ---------- */

        updateCounter(
            document.getElementById("completedJobs"),
            firstExistingValue(
                stats.completed_bookings,
                stats.completedBookings,
                stats.completed_jobs,
                0
            )
        );


        /* ---------- Pending ---------- */

        updateCounter(
            document.getElementById("pendingBookings"),
            firstExistingValue(
                stats.pending_bookings,
                stats.pendingBookings,
                stats.pending,
                0
            )
        );


        /* ---------- Favourite providers ---------- */

        updateCounter(
            document.getElementById("favoriteProviders"),
            firstExistingValue(
                stats.favorite_providers,
                stats.favourite_providers,
                stats.favoriteProviders,
                stats.favouriteProviders,
                0
            )
        );

    }
    catch (error) {

        console.error(
            "Error loading dashboard statistics:",
            error
        );

    }

}


/* ==========================================================
   COUNTER
   ========================================================== */

function updateCounter(element, value) {

    if (!element) {
        return;
    }


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


/* ==========================================================
   NUMBER ANIMATION
   ========================================================== */

function animateNumber(element, target) {

    const duration = 900;

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

            requestAnimationFrame(step);

        }
        else {

            element.textContent =
                target;

        }

    }


    requestAnimationFrame(step);

}


/* ==========================================================
   RECENT BOOKINGS
   ========================================================== */

async function loadRecentBookings() {

    const tableBody =
        document.getElementById(
            "recentBookingsBody"
        );


    if (!tableBody) {

        console.error(
            "recentBookingsBody does not exist."
        );

        return;

    }


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


        /* ======================================================
           DRF PAGINATION SUPPORT
        ====================================================== */

        let bookings = [];


        if (Array.isArray(responseData)) {

            bookings = responseData;

        }
        else if (
            Array.isArray(
                responseData.results
            )
        ) {

            bookings =
                responseData.results;

        }
        else if (
            Array.isArray(
                responseData.data
            )
        ) {

            bookings =
                responseData.data;

        }


        window.oneClickBookings =
            bookings;


        console.log(
            "Bookings found:",
            bookings.length
        );


        /* ======================================================
           EMPTY
        ====================================================== */

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


        /* ======================================================
           SORT BOOKINGS
        ====================================================== */

        const sortedBookings =
            [...bookings]
                .sort(compareBookings)
                .slice(0, 5);


        /* ======================================================
           RENDER
        ====================================================== */

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


/* ==========================================================
   SORT BOOKINGS
   ========================================================== */

function compareBookings(a, b) {

    const dateA =
        getBookingSortDate(a);

    const dateB =
        getBookingSortDate(b);


    return dateB - dateA;

}


function getBookingSortDate(booking) {

    const candidates = [

        booking.created_at,

        booking.createdAt,

        booking.booking_datetime,

        booking.bookingDateTime,

        booking.scheduled_at,

        booking.scheduledAt

    ];


    for (const value of candidates) {

        if (value) {

            const timestamp =
                new Date(value).getTime();

            if (!Number.isNaN(timestamp)) {

                return timestamp;

            }

        }

    }


    const id =
        Number(
            booking.id ??
            booking.booking_id ??
            0
        );


    return id;

}


/* ==========================================================
   CREATE BOOKING ROW
   ========================================================== */

function createBookingRow(booking) {

    const bookingId =
        getBookingId(booking);


    const serviceName =
        getServiceName(booking);


    const providerName =
        getProviderName(booking);


    const address =
        getBookingAddress(booking);


    const bookingDate =
        getBookingDate(booking);


    const bookingTime =
        getBookingTime(booking);


    const price =
        getBookingPrice(booking);


    const status =
        getBookingStatus(booking);


    const initials =
        getInitials(providerName);


    const statusInfo =
        getStatusInfo(status);


    return `

        <tr>

            <!-- Booking ID -->

            <td>

                <span class="oc-booking-id">

                    #${escapeHtml(bookingId)}

                </span>

            </td>


            <!-- Service -->

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


            <!-- Provider -->

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


            <!-- Address -->

            <td>

                <span
                    class="oc-booking-address"
                    title="${escapeHtml(address)}"
                >
                    ${escapeHtml(address)}
                </span>

            </td>


            <!-- Date + Time -->

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


            <!-- Price -->

            <td>

                <span class="oc-booking-price">
                    ${escapeHtml(price)}
                </span>

            </td>


            <!-- Status -->

            <td>

                <span
                    class="oc-badge ${statusInfo.className}"
                >

                    <i class="${statusInfo.icon}"></i>

                    ${escapeHtml(statusInfo.text)}

                </span>

            </td>


            <!-- Action -->

            <td>

                <a
                    href="#"
                    class="oc-row-action"
                    title="View booking"
                    data-booking-id="${escapeHtml(bookingId)}"
                    onclick="return false;"
                >

                    <i class="fa-solid fa-ellipsis-vertical"></i>

                </a>

            </td>

        </tr>

    `;

}


/* ==========================================================
   BOOKING FIELD HELPERS
   ========================================================== */

function getBookingId(booking) {

    return (
        booking.id ??
        booking.booking_id ??
        booking.bookingId ??
        booking.pk ??
        "N/A"
    );

}


function getServiceName(booking) {

    return (
        booking.service_name ??
        booking.serviceName ??
        booking.service?.name ??
        booking.service?.title ??
        booking.category_name ??
        booking.category?.name ??
        "Service"
    );

}


function getProviderName(booking) {

    return (
        booking.provider_name ??
        booking.providerName ??
        booking.provider?.full_name ??
        booking.provider?.name ??
        booking.provider?.user?.first_name ??
        "Provider"
    );

}


function getBookingAddress(booking) {

    const address =
        booking.address ??
        booking.service_address ??
        booking.booking_address ??
        booking.location ??
        booking.customer_address ??
        booking.address_details;


    if (typeof address === "string") {

        return address || "Address not provided";

    }


    if (address && typeof address === "object") {

        return (
            address.full_address ??
            address.address ??
            address.location ??
            address.street ??
            "Address not provided"
        );

    }


    return "Address not provided";

}


function getBookingDate(booking) {

    const value =
        booking.booking_date ??
        booking.bookingDate ??
        booking.date ??
        booking.scheduled_date ??
        booking.scheduledDate;


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
            month:"short",
            day:"2-digit",
            year:"numeric"
        }
    );

}


function getBookingTime(booking) {

    const value =
        booking.booking_time ??
        booking.bookingTime ??
        booking.time ??
        booking.scheduled_time ??
        booking.scheduledTime ??
        booking.start_time ??
        booking.startTime;


    return formatBookingTime(value);

}


function getBookingPrice(booking) {

    const value =
        booking.total_price ??
        booking.totalPrice ??
        booking.price ??
        booking.amount ??
        booking.final_price ??
        booking.finalPrice;


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


/* ==========================================================
   TIME FORMAT
   ========================================================== */

function formatBookingTime(time) {

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


/* ==========================================================
   BOOKING STATUS
   ========================================================== */

function getBookingStatus(booking) {

    return String(
        booking.status ??
        booking.booking_status ??
        booking.bookingStatus ??
        "pending"
    ).trim();

}


function getStatusInfo(status) {

    const normalized =
        String(status)
            .toLowerCase()
            .replace(/[\s_-]+/g, "");


    if (
        normalized === "completed" ||
        normalized === "accepted" ||
        normalized === "confirmed" ||
        normalized === "approved"
    ) {

        return {
            className:"oc-badge-success",
            text:formatStatusText(status),
            icon:"fa-solid fa-circle-check"
        };

    }


    if (
        normalized === "cancelled" ||
        normalized === "canceled" ||
        normalized === "rejected" ||
        normalized === "failed"
    ) {

        return {
            className:"oc-badge-danger",
            text:formatStatusText(status),
            icon:"fa-solid fa-circle-xmark"
        };

    }


    return {
        className:"oc-badge-warning",
        text:formatStatusText(status),
        icon:"fa-solid fa-clock"
    };

}


function formatStatusText(status) {

    if (!status) {

        return "Pending";

    }


    return String(status)
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(
            /\w\S*/g,
            word =>
                word.charAt(0).toUpperCase() +
                word.substring(1).toLowerCase()
        );

}


/* ==========================================================
   RECOMMENDED PROVIDERS
   ========================================================== */

async function loadRecommendedProviders() {

    const grid =
        document.getElementById(
            "providersGrid"
        );


    if (!grid) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_BASE}/providers/`,
                {
                    method:"GET",
                    headers:getHeaders()
                }
            );


        if (!response.ok) {

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                logoutUser();

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


        let providers = [];


        if (Array.isArray(data)) {

            providers = data;

        }
        else if (
            Array.isArray(data.results)
        ) {

            providers = data.results;

        }
        else if (
            Array.isArray(data.data)
        ) {

            providers = data.data;

        }


        window.oneClickProviders =
            providers;


        if (providers.length === 0) {

            grid.innerHTML = `

                <div class="col-12">

                    <div class="oc-loading-state">

                        <i class="fa-regular fa-face-frown"></i>

                        No providers available right now.

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


/* ==========================================================
   CREATE PROVIDER CARD
   ========================================================== */

function createProviderCard(provider) {

    const providerId =
        provider.id ??
        provider.provider_id ??
        provider.pk;


    const userFullName =
    `${provider.user?.first_name || ""} ${provider.user?.last_name || ""}`.trim();

const providerName =
    provider.full_name ||
    provider.name ||
    provider.user?.full_name ||
    userFullName ||
    "Provider";


    const category =
        provider.category_name ??
        provider.category?.name ??
        provider.service_name ??
        provider.service?.name ??
        "Service Provider";


    const experience =
        provider.experience ??
        provider.experience_years ??
        0;


    const rating =
        Number(
            provider.rating ??
            provider.average_rating ??
            0
        );


    const reviewCount =
        provider.review_count ??
        provider.reviewCount ??
        provider.reviews_count ??
        0;


    const verified =
        provider.verified === true ||
        provider.is_verified === true;


    const image =
        provider.profile_image ??
        provider.profileImage ??
        provider.image ??
        provider.user?.profile_image ??
        provider.user?.profileImage ??
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
            >

            <div
                class="oc-provider-photo-fallback"
                style="display:none;"
            >

                <i class="fa-solid fa-user"></i>

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
        Number(reviewCount) > 0
            ? ` (${Number(reviewCount)})`
            : "";


    return `

        <div
            class="col-sm-6 col-lg-3"
            data-aos="fade-up"
        >

            <div
                class="oc-provider-card"
                data-provider-id="${escapeHtml(providerId ?? "")}"
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

                        ${reviews}

                    </span>

                </div>


                <button
                    class="btn oc-btn-book"
                    type="button"
                    data-provider-id="${escapeHtml(providerId ?? "")}"
                >

                    Book Now

                </button>

            </div>

        </div>

    `;

}


/* ==========================================================
   PROVIDER IMAGE URL
   ========================================================== */

function resolveMediaUrl(value) {

    if (!value) {

        return "";

    }


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


/* ==========================================================
   PROVIDER PROFILE
   ========================================================== */

function openProviderProfile(providerId) {

    if (!providerId) {

        console.error(
            "Provider ID is missing."
        );

        return;

    }


    window.location.href =
        `provider-profile.html?id=${encodeURIComponent(providerId)}`;

}


/* ==========================================================
   CLICK HANDLERS
   ========================================================== */

function setupServiceClicks() {

    document.addEventListener(
        "click",
        event => {

            const serviceCard =
                event.target.closest(
                    ".oc-service-card"
                );


            if (serviceCard) {

                const service =
                    serviceCard.dataset.service;


                console.log(
                    "Selected service:",
                    service
                );

                return;

            }


            const quickCard =
                event.target.closest(
                    ".oc-quick-card"
                );


            if (quickCard) {

                event.preventDefault();

                const service =
                    quickCard.dataset.service;


                console.log(
                    "Quick service:",
                    service
                );

            }


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

            }

        }
    );

}


/* ==========================================================
   SEARCH
   ========================================================== */

function setupSearch() {

    const navbarSearch =
        document.getElementById(
            "navbarSearch"
        );


    const bannerSearch =
        document.getElementById(
            "bannerSearch"
        );


    const searchButton =
        document.getElementById(
            "bannerSearchButton"
        );


    function performSearch(value) {

        const query =
            String(value || "").trim();


        if (!query) {

            return;

        }


        console.log(
            "Service search:",
            query
        );

        /*
         * Later you can connect this to:
         *
         * services.html?search=...
         */

    }


    if (navbarSearch) {

        navbarSearch.addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {

                    performSearch(
                        navbarSearch.value
                    );

                }

            }
        );

    }


    if (bannerSearch) {

        bannerSearch.addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {

                    performSearch(
                        bannerSearch.value
                    );

                }

            }
        );

    }


    if (searchButton) {

        searchButton.addEventListener(
            "click",
            () => {

                performSearch(
                    bannerSearch?.value
                );

            }
        );

    }

}


/* ==========================================================
   LOGOUT
   ========================================================== */

function setupLogout() {

    document.addEventListener(
        "click",
        event => {

            const logoutButton =
                event.target.closest(
                    ".js-logout"
                );


            if (!logoutButton) {

                return;

            }


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


    window.location.href =
        "login.html";

}


/* ==========================================================
   UTILITY — FIRST AVAILABLE VALUE
   ========================================================== */

function firstExistingValue(...values) {

    for (const value of values) {

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {

            return value;

        }

    }


    return 0;

}


/* ==========================================================
   INITIALS
   ========================================================== */

function getInitials(name) {

    const value =
        String(name || "Provider")
            .trim();


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


/* ==========================================================
   HTML ESCAPE
   ========================================================== */

function escapeHtml(value) {

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


/* ==========================================================
   AOS REFRESH
   ========================================================== */

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