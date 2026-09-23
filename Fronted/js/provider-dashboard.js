/* ==========================================================================
   ONECLICK — PROVIDER DASHBOARD
   Connected to Django REST API
   ========================================================================== */

const API_BASE = "http://127.0.0.1:8000/api";


/* ==========================================================================
   PAGE INITIALIZATION
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
    const dashboardDate =
    document.getElementById("dashboardDate");

if (dashboardDate) {

    const today =
        new Date();

    dashboardDate.textContent =
        today.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );
}

    loadProviderDashboard();

    initSidebarToggle();
    initDropdowns();
    initOnlineToggle();
    initAvailabilitySwitches();

    initProgressBars();
    initRadialProgress();
    initEarningsChart();

   initRippleButtons();
initJobRequestActions();


initSearchInteraction();
    initBackToTop();
    initNavActiveState();

    setupQuotationForm();
});


/* ==========================================================================
   GET JWT ACCESS TOKEN
   ========================================================================== */

function getAccessToken() {

    return localStorage.getItem("access_token");
}


/* ==========================================================================
   LOAD PROVIDER DASHBOARD
   ========================================================================== */

async function loadProviderDashboard() {

    const token = getAccessToken();

    if (!token) {

        console.error("No access token found.");

        showDashboardError(
            "Please login again."
        );

        return;
    }

    try {

        console.log(
            "Loading authenticated provider dashboard..."
        );


        /* ---------------------------------------------------------
           LOAD PROVIDER
           --------------------------------------------------------- */

        const providerResponse =
            await fetch(
                `${API_BASE}/providers/dashboard/`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        console.log(
            "Provider dashboard response:",
            providerResponse.status
        );


        if (
            providerResponse.status === 401
        ) {

            throw new Error(
                "Your login session has expired. Please login again."
            );
        }


        if (!providerResponse.ok) {

            const errorData =
                await providerResponse
                    .json()
                    .catch(
                        function () {
                            return {};
                        }
                    );


            throw new Error(
                errorData.error ||
                errorData.detail ||
                `Provider dashboard API failed: ${providerResponse.status}`
            );
        }


        const dashboardData =
            await providerResponse.json();


        console.log(
            "Provider dashboard data:",
            dashboardData
        );


        const provider =
            dashboardData.provider;


        if (!provider) {

            throw new Error(
                "Provider data was not returned by the server."
            );
        }


        window.oneClickProvider =
            provider;


        renderProviderDashboard(
            provider
        );


        /* ---------------------------------------------------------
           LOAD SERVICE REQUESTS
           --------------------------------------------------------- */

        const serviceRequests =
            await loadProviderServiceRequests();

        window.oneClickServiceRequests =
            serviceRequests;

           
/* ---------------------------------------------------------
   LOAD PROVIDER QUOTATIONS
   --------------------------------------------------------- */

const quotations =
    await loadProviderQuotations();

window.oneClickQuotations =
    quotations;
renderProviderCounterOffers(
    quotations
);



        /* ---------------------------------------------------------
           LOAD BOOKINGS
           --------------------------------------------------------- */

        const bookings =
            await loadProviderBookings();

        window.oneClickBookings =
            bookings;


        /* ---------------------------------------------------------
           RENDER ALL REAL DASHBOARD DATA
           --------------------------------------------------------- */

        renderDashboardStatistics(
            bookings
        );


        renderJobRequests(
            serviceRequests
        );


        renderTodaySchedule(
            bookings
        );


        renderCurrentJob(
            bookings
        );

renderUpcomingJob(
    bookings
);

        renderPerformance(
            bookings
        );


        renderMonthlyEarnings(
            bookings
        );


        renderEarningsChart(
            bookings
        );


        renderBookingDateIndicators(
            bookings
        );


        console.log(
            "Provider dashboard loaded successfully."
        );

    }
    catch (error) {

        console.error(
            "Failed to load provider dashboard:",
            error
        );


        showDashboardError(
            error.message
        );
    }
}


/* ==========================================================================
   LOAD PROVIDER SERVICE REQUESTS
   ========================================================================== */

async function loadProviderServiceRequests() {

    const token =
        getAccessToken();


    if (!token) {

        throw new Error(
            "No login token found. Please login again."
        );
    }


    console.log(
        "Loading provider service requests..."
    );


    const response =
        await fetch(
            `${API_BASE}/services/requests/provider/`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


    console.log(
        "Provider service requests response:",
        response.status
    );


    const data =
        await response
            .json()
            .catch(
                function () {
                    return {};
                }
            );


    if (
        response.status === 401
    ) {

        throw new Error(
            "Your login session has expired. Please login again."
        );
    }


    if (!response.ok) {

        throw new Error(
            data.error ||
            data.detail ||
            `Service request API failed: ${response.status}`
        );
    }


    if (
        !data.results ||
        !Array.isArray(data.results)
    ) {

        console.error(
            "Unexpected service request response:",
            data
        );

        throw new Error(
            "Invalid service request data received from server."
        );
    }


    console.log(
        "Provider service requests:",
        data.results
    );


    return data.results;
}


/* ==========================================================================
   LOAD PROVIDER QUOTATIONS
   ========================================================================== */

async function loadProviderQuotations() {

    const token =
        getAccessToken();


    if (!token) {

        throw new Error(
            "No login token found. Please login again."
        );
    }


    console.log(
        "Loading provider quotations..."
    );


    const response =
        await fetch(
            `${API_BASE}/services/quotations/`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


    console.log(
        "Provider quotations response:",
        response.status
    );


    const data =
        await response
            .json()
            .catch(
                function () {
                    return {};
                }
            );


    if (
        response.status === 401
    ) {

        throw new Error(
            "Your login session has expired. Please login again."
        );
    }


    if (!response.ok) {

        throw new Error(
            data.error ||
            data.detail ||
            `Quotation API failed: ${response.status}`
        );
    }


    if (
        !data.results ||
        !Array.isArray(data.results)
    ) {

        console.error(
            "Unexpected quotation response:",
            data
        );

        throw new Error(
            "Invalid quotation data received from server."
        );
    }


    console.log(
        "Provider quotations:",
        data.results
    );


    return data.results;
}


/* ==========================================================================
   LOAD PROVIDER BOOKINGS
   ========================================================================== */

async function loadProviderBookings() {

    const token =
        getAccessToken();


    if (!token) {

        throw new Error(
            "No login token found. Please login again."
        );
    }


    console.log(
        "Loading provider bookings..."
    );


    const response =
        await fetch(
            `${API_BASE}/bookings/provider/`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


    console.log(
        "Provider bookings response:",
        response.status
    );


    const data =
        await response
            .json()
            .catch(
                function () {
                    return {};
                }
            );


    if (
        response.status === 401
    ) {

        throw new Error(
            "Your login session has expired. Please login again."
        );
    }


    if (!response.ok) {

        throw new Error(
            data.error ||
            data.detail ||
            `Booking API failed: ${response.status}`
        );
    }


    if (!Array.isArray(data)) {

        console.error(
            "Unexpected booking API response:",
            data
        );

        throw new Error(
            "Invalid booking data received from server."
        );
    }


    console.log(
        "Provider bookings:",
        data
    );


    return data;
}


/* ==========================================================================
   RENDER CUSTOMER COUNTER OFFERS
   ========================================================================== */

function renderProviderCounterOffers(quotations) {

    const container =
        document.getElementById(
            "providerCounterOffersContainer"
        );

    const badge =
        document.getElementById(
            "counterOfferBadge"
        );

    if (!container) {

        console.error(
            "providerCounterOffersContainer not found."
        );

        return;
    }

    if (!badge) {

        console.error(
            "counterOfferBadge not found."
        );

        return;
    }


    /*
     * ---------------------------------------------------------
     * FIND COUNTERED QUOTATIONS
     * ---------------------------------------------------------
     */

    const counterOffers =
        quotations.filter(
            function (quotation) {

                return (
                    quotation.status === "countered" &&
                    quotation.counter_price !== null &&
                    quotation.counter_price !== ""
                );

            }
        );


    /*
     * ---------------------------------------------------------
     * UPDATE BADGE
     * ---------------------------------------------------------
     */

    badge.textContent =
        counterOffers.length;


    /*
     * ---------------------------------------------------------
     * NO COUNTER OFFERS
     * ---------------------------------------------------------
     */

    if (counterOffers.length === 0) {

        container.innerHTML = `

            <div class="request-empty-state">

                <span class="item-icon bg-warning-soft">

                    <i class="fa-solid fa-comments-dollar"></i>

                </span>

                <div>

                    <h5>
                        No counter offers
                    </h5>

                    <p>
                        Customer counter offers will appear here.
                    </p>

                </div>

            </div>

        `;

        return;
    }


    /*
     * ---------------------------------------------------------
     * RENDER COUNTER OFFERS
     * ---------------------------------------------------------
     */

    container.innerHTML =
        counterOffers
            .map(
                function (quotation) {

                    const counterPrice =
                        Number(
                            quotation.counter_price
                        ).toLocaleString(
                            "en-IN"
                        );


                    const originalPrice =
                        Number(
                            quotation.price
                        ).toLocaleString(
                            "en-IN"
                        );


                    const message =
                        quotation.counter_message ||
                        "The customer has submitted a counter offer.";


                    return `

                        <div class="request-card">

                            <div class="request-card-header">

                                <div>

                                    <span class="badge bg-warning text-dark">
                                        Counter Offer
                                    </span>

                                </div>

                                <small class="text-muted">
                                    Quotation #${quotation.id}
                                </small>

                            </div>


                            <div class="request-card-body">

                                <h5>
                                    ${quotation.service_name || "Service"}
                                </h5>

                                <p class="text-muted mb-2">
                                    Customer:
                                    ${quotation.request_customer || "Customer"}
                                </p>


                                <div class="mb-2">

                                    <strong>
                                        Your original price:
                                    </strong>

                                    <span>
                                        Rs. ${originalPrice}
                                    </span>

                                </div>


                                <div class="mb-2">

                                    <strong>
                                        Customer counter offer:
                                    </strong>

                                    <span class="text-warning fw-bold">
                                        Rs. ${counterPrice}
                                    </span>

                                </div>


                                <div class="mt-3 p-3 bg-light rounded">

                                    <small class="text-muted d-block mb-1">
                                        Customer message
                                    </small>

                                    <span>
                                        ${message}
                                    </span>

                                </div>

                            </div>


                            <div class="request-card-footer">

                                <button
                                    type="button"
                                    class="btn btn-primary final-offer-btn"
                                    data-quotation-id="${quotation.id}"
                                >

                                    <i class="fa-solid fa-handshake me-1"></i>

                                    Send Final Offer

                                </button>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");
}


/* ==========================================================================
   RENDER PROVIDER INFORMATION
   ========================================================================== */

function renderProviderDashboard(provider) {

    const fullName =
        provider.full_name ||
        "Provider";


    setText(
        "#dashboardProviderName",
        fullName
    );


    const firstName =
        fullName.split(" ")[0];


    setText(
        "#dashboardGreetingName",
        firstName
    );


    const category =
        provider.category_name ||
        "Service Provider";


    const verified =
        provider.verified === true;


    const roleElement =
        document.querySelector(
            "#dashboardProviderRole"
        );


    if (roleElement) {

        roleElement.innerHTML =
            `${escapeHtml(category)}
             ·
             ${verified ? "Verified" : "Not Verified"}
             ${
                 verified
                     ? '<i class="fa-solid fa-circle-check verified-icon"></i>'
                     : ""
             }`;
    }


    const profileImage =
        document.querySelector(
            "#dashboardProfileImage"
        );


    if (
        profileImage &&
        provider.profile_image
    ) {

        profileImage.src =
            provider.profile_image;

        profileImage.alt =
            fullName;

        profileImage.style.display =
            "";
    }


    updateOnlineStatus(
        provider.available
    );


    const rating =
        Number(
            provider.rating ?? 0
        );


    const reviewCount =
        Number(
            provider.review_count ?? 0
        );


    console.log(
        "Provider rating:",
        rating
    );


    console.log(
        "Provider review count:",
        reviewCount
    );


    updateRatingDisplay(
        rating,
        reviewCount
    );


    updateProviderProfileUI(
        provider
    );


    window.oneClickProvider =
        provider;
}


/* ==========================================================================
   UPDATE PROVIDER PROFILE UI
   ========================================================================== */

function updateProviderProfileUI(provider) {

    const fullName =
        provider.full_name ||
        "Provider";


    const nameSelectors = [
        "#profileName",
        "#topbarProfileName",
        ".profile-name",
        ".provider-profile-name"
    ];


    nameSelectors.forEach(
        function (selector) {

            setText(
                selector,
                fullName
            );
        }
    );


    const imageSelectors = [
        "#profileImage",
        "#topbarProfileImage",
        ".profile-image"
    ];


    imageSelectors.forEach(
        function (selector) {

            const image =
                document.querySelector(
                    selector
                );


            if (
                image &&
                provider.profile_image
            ) {

                image.src =
                    provider.profile_image;

                image.alt =
                    fullName;

                image.style.display =
                    "";
            }
        }
    );
}


/* ==========================================================================
   UPDATE RATING DISPLAY
   ========================================================================== */

function updateRatingDisplay(
    rating,
    reviewCount
) {

    const ratingSelectors = [
        "#providerRating",
        ".provider-rating",
        ".rating-value",
        ".average-rating"
    ];


    ratingSelectors.forEach(
        function (selector) {

            const elements =
                document.querySelectorAll(
                    selector
                );


            elements.forEach(
                function (element) {

                    element.textContent =
                        Number(rating)
                            .toFixed(1);

                }
            );
        }
    );


    const reviewSelectors = [
        "#reviewCount",
        ".review-count",
        ".rating-count"
    ];


    reviewSelectors.forEach(
        function (selector) {

            const elements =
                document.querySelectorAll(
                    selector
                );


            elements.forEach(
                function (element) {

                    element.textContent =
                        reviewCount;

                }
            );
        }
    );
}


/* ==========================================================================
   DASHBOARD STATISTICS
   ========================================================================== */

function renderDashboardStatistics(bookings) {

    const pendingBookings =
        bookings.filter(
            function (booking) {

                return booking.status === "pending";

            }
        );


    const today =
        getTodayDateString();


    const todayJobs =
        bookings.filter(
            function (booking) {

                return (
                    booking.booking_date === today &&
                    booking.status === "accepted"
                );

            }
        );


    const completedBookings =
        bookings.filter(
            function (booking) {

                return booking.status === "completed";

            }
        );


    const currentDate =
        new Date();


    const currentYear =
        currentDate.getFullYear();


    const currentMonth =
        currentDate.getMonth() + 1;


    const monthlyEarnings =
        completedBookings.reduce(
            function (total, booking) {

                if (!booking.booking_date) {
                    return total;
                }


                const parts =
                    booking.booking_date.split("-");


                if (parts.length !== 3) {
                    return total;
                }


                const year =
                    Number(parts[0]);


                const month =
                    Number(parts[1]);


                if (
                    year === currentYear &&
                    month === currentMonth
                ) {

                    return (
                        total +
                        Number(
                            booking.total_price || 0
                        )
                    );
                }


                return total;

            },
            0
        );


    const provider =
        window.oneClickProvider || {};


    const rating =
        Number(
            provider.rating ?? 0
        );


    const respondedBookings =
        bookings.filter(
            function (booking) {

                return (
                    booking.status === "accepted" ||
                    booking.status === "rejected" ||
                    booking.status === "completed"
                );

            }
        );


    const responseRate =
        bookings.length > 0
            ? Math.round(
                (
                    respondedBookings.length /
                    bookings.length
                ) * 100
            )
            : 0;


    const statValues =
        document.querySelectorAll(
            ".stat-value"
        );


    if (statValues.length >= 6) {

        updateStat(
            statValues[0],
            pendingBookings.length
        );


        updateStat(
            statValues[1],
            todayJobs.length
        );


        updateStat(
            statValues[2],
            completedBookings.length
        );


        updateStat(
            statValues[3],
            monthlyEarnings,
            "Rs. "
        );


        updateStat(
            statValues[4],
            rating,
            "",
            "",
            1
        );


        updateStat(
            statValues[5],
            responseRate,
            "",
            "%",
            0
        );

    } else {

        console.warn(
            "Expected 6 statistic cards but found:",
            statValues.length
        );
    }


    const requestBadge =
        document.getElementById(
            "jobRequestBadge"
        );


    if (requestBadge) {

        requestBadge.textContent =
            pendingBookings.length;


        requestBadge.style.display =
            pendingBookings.length > 0
                ? "inline-flex"
                : "none";
    }


    updateRatingDisplay(
        rating,
        Number(
            provider.review_count ?? 0
        )
    );


    console.log(
        "Real dashboard statistics:",
        {
            pendingRequests:
                pendingBookings.length,

            todayJobs:
                todayJobs.length,

            completedJobs:
                completedBookings.length,

            monthlyEarnings:
                monthlyEarnings,

            averageRating:
                rating,

            responseRate:
                responseRate
        }
    );
}


/* ==========================================================================
   UPDATE STATISTIC
   ========================================================================== */

function updateStat(
    element,
    value,
    prefix = "",
    suffix = "",
    decimals = 0
) {

    if (!element) {
        return;
    }


    element.setAttribute(
        "data-count",
        value
    );


    element.setAttribute(
        "data-prefix",
        prefix
    );


    element.setAttribute(
        "data-suffix",
        suffix
    );


    element.setAttribute(
        "data-decimal",
        decimals
    );


    element.textContent =
        prefix +
        formatNumber(
            value,
            decimals
        ) +
        suffix;
}


/* ==========================================================================
   RENDER JOB REQUESTS
   ========================================================================== */

function renderJobRequests(serviceRequests) {

    const container =
        document.querySelector(
            "#jobRequestsGrid"
        );


    if (!container) {

        console.warn(
            "#jobRequestsGrid was not found."
        );

        return;
    }


    const requests =
        Array.isArray(serviceRequests)
            ? serviceRequests
            : [];


    console.log(
        "Rendering provider service requests:",
        requests
    );


    const badge =
        document.getElementById(
            "jobRequestBadge"
        );


    if (badge) {

        badge.textContent =
            requests.length;


        badge.style.display =
            requests.length > 0
                ? "inline-flex"
                : "none";
    }


    if (requests.length === 0) {

        container.innerHTML = `
            <div class="request-empty-state">

                <span class="item-icon bg-primary-soft">

                    <i class="fa-solid fa-inbox"></i>

                </span>

                <div>

                    <h5>
                        No new service requests
                    </h5>

                    <p>
                        New customer requests for your service
                        category will appear here.
                    </p>

                </div>

            </div>
        `;

        return;
    }


    container.innerHTML =
        requests
            .map(
                function (request) {

                    return createServiceRequestCard(
                        request
                    );

                }
            )
            .join("");
}


/* ==========================================================================
   CREATE SERVICE REQUEST CARD
   ========================================================================== */

function createServiceRequestCard(request) {

    const customer =
        request.customer_name ||
        "Customer";


    const service =
        request.service_name ||
        "Service";


    const description =
        request.description ||
        "No description provided";


    const address =
        request.address ||
        "Address not provided";


    const createdDate =
        request.created_at
            ? new Date(
                request.created_at
            ).toLocaleDateString(
                "en-US",
                {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                }
            )
            : "Date not provided";


    const avatarLetter =
        customer
            .charAt(0)
            .toUpperCase();


    return `
        <div
            class="request-card"
            data-request-id="${escapeHtml(request.id)}"
        >

            <div class="request-top">

                <div class="req-avatar">
                    ${escapeHtml(
                        avatarLetter
                    )}
                </div>


                <div class="req-customer">

                    <strong>
                        ${escapeHtml(
                            customer
                        )}
                    </strong>


                    <span>
                        ${escapeHtml(
                            service
                        )}
                    </span>

                </div>


                <div class="req-price">

                    <span class="text-muted small">
                        New Request
                    </span>

                </div>

            </div>


            <div class="req-details">

                <div>

                    <i class="fa-solid fa-location-dot"></i>

                    ${escapeHtml(
                        address
                    )}

                </div>


                <div>

                    <i class="fa-regular fa-calendar"></i>

                    ${escapeHtml(
                        createdDate
                    )}

                </div>


                <div>

                    <i class="fa-solid fa-circle-info"></i>

                    Request #${escapeHtml(request.id)}

                </div>

            </div>


            <div class="mt-3">

                <p class="mb-0 small">

                    ${escapeHtml(
                        description
                    )}

                </p>

            </div>


            <div class="req-actions mt-3">

                <button
                    type="button"
                    class="btn-oc-success btn-sm ripple quote-request-btn"
                    data-request-id="${escapeHtml(request.id)}"
                >

                    <i class="fa-solid fa-file-invoice-dollar"></i>

                    Send Quote

                </button>

            </div>

        </div>
    `;
}


/* ==========================================================================
   SEND QUOTE BUTTON
   ========================================================================== */

document.addEventListener(
    "click",
    function (event) {

        const button =
            event.target.closest(
                ".quote-request-btn"
            );


        if (!button) {
            return;
        }


        event.preventDefault();


        const requestId =
            button.getAttribute(
                "data-request-id"
            );


        console.log(
            "SEND QUOTE BUTTON CLICKED"
        );


        console.log(
            "REQUEST ID:",
            requestId
        );


        if (!requestId) {

            console.error(
                "Service request ID not found."
            );

            return;
        }


        openQuotationModal(
            requestId
        );
    }
);


/* ==========================================================================
   RENDER TODAY'S SCHEDULE
   ========================================================================== */

function renderTodaySchedule(bookings) {

    const timeline =
        document.querySelector(
            "#todayScheduleTimeline"
        );


    if (!timeline) {

        console.warn(
            "#todayScheduleTimeline was not found."
        );

        return;
    }


    const today =
        getTodayDateString();


    const todayDate =
        document.getElementById(
            "todayScheduleDate"
        );


    if (todayDate) {

        todayDate.textContent =
            formatDisplayDate(today);
    }


    const todayBookings =
        bookings
            .filter(
                function (booking) {

                    return (
                        booking.booking_date === today &&
                        (
                            booking.status === "accepted" ||
                            booking.status === "completed"
                        )
                    );

                }
            )
            .sort(
                function (a, b) {

                    return String(
                        a.booking_time || ""
                    ).localeCompare(
                        String(
                            b.booking_time || ""
                        )
                    );

                }
            );


    if (todayBookings.length === 0) {

        timeline.innerHTML = `

            <div class="schedule-empty-state">

                <span class="item-icon bg-secondary-soft">

                    <i class="fa-regular fa-calendar-xmark"></i>

                </span>

                <div>

                    <h5>
                        No jobs scheduled for today
                    </h5>

                    <p>
                        Your accepted and completed jobs for today
                        will appear here.
                    </p>

                </div>

            </div>

        `;

        return;
    }


    timeline.innerHTML =
        todayBookings
            .map(
                function (booking) {

                    return createTimelineItem(
                        booking
                    );

                }
            )
            .join("");
}


/* ==========================================================================
   CREATE TIMELINE ITEM
   ========================================================================== */

function createTimelineItem(
    booking
) {

    const time =
        formatDisplayTime(
            booking.booking_time
        );


    const service =
        booking.service_name ||
        "Service";


    const customer =
        booking.customer_email ||
        "Customer";


    const address =
        booking.address ||
        "Address not provided";


    let statusClass =
        "status-upcoming";


    let statusText =
        "Upcoming";


    if (
        booking.status === "completed"
    ) {

        statusClass =
            "status-completed";

        statusText =
            "Completed";

    }
    else if (
        booking.status === "accepted"
    ) {

        statusClass =
            "status-upcoming";

        statusText =
            "Accepted";
    }


    return `

        <div
            class="timeline-item"
            data-booking-id="${booking.id}"
        >

            <div class="timeline-time">

                ${escapeHtml(time)}

            </div>


            <div class="timeline-dot"></div>


            <div class="timeline-card">

                <div class="d-flex
                            justify-content-between
                            align-items-start">

                    <div>

                        <strong>
                            ${escapeHtml(service)}
                        </strong>


                        <div class="small text-muted mt-1">

                            ${escapeHtml(customer)}

                        </div>


                        <div class="small text-muted mt-1">

                            <i class="fa-solid fa-location-dot"></i>

                            ${escapeHtml(address)}

                        </div>

                    </div>


                    <span
                        class="status-pill ${statusClass}"
                    >

                        ${statusText}

                    </span>

                </div>

            </div>

        </div>

    `;
}


/* ==========================================================================
   RENDER CURRENT JOB
   ========================================================================== */

function renderCurrentJob(bookings) {

    const panel =
        document.querySelector(
            ".current-job-panel"
        );


    if (!panel) {

        console.warn(
            ".current-job-panel was not found."
        );

        return;
    }


    const today =
        getTodayDateString();


    const currentJob =
        bookings
            .filter(
                function (booking) {

                    return (
                        booking.booking_date === today &&
                        (
                            booking.status === "accepted" ||
                            booking.status === "completed"
                        )
                    );

                }
            )
            .sort(
                function (a, b) {

                    return String(
                        a.booking_time || ""
                    ).localeCompare(
                        String(
                            b.booking_time || ""
                        )
                    );

                }
            )[0];


    const customerElement =
        document.getElementById(
            "currentJobCustomer"
        );


    const addressElement =
        document.getElementById(
            "currentJobAddress"
        );


    const serviceElement =
        document.getElementById(
            "currentJobService"
        );


    const statusBadge =
        document.getElementById(
            "currentJobStatusBadge"
        );


    const progressText =
        document.getElementById(
            "currentJobProgressText"
        );


    const progressBar =
        document.getElementById(
            "currentJobProgressBar"
        );


    const pendingStep =
        document.getElementById(
            "jobStepPending"
        );


    const acceptedStep =
        document.getElementById(
            "jobStepAccepted"
        );


    const completedStep =
        document.getElementById(
            "jobStepCompleted"
        );


    if (!currentJob) {

        if (customerElement) {

            customerElement.textContent =
                "No active job";
        }


        if (addressElement) {

            addressElement.innerHTML =
                '<i class="fa-solid fa-location-dot"></i> No active job scheduled';
        }


        if (serviceElement) {

            serviceElement.innerHTML =
                '<i class="fa-solid fa-screwdriver-wrench"></i> Waiting for an accepted job';
        }


        if (statusBadge) {

            statusBadge.innerHTML = `
                <span class="live-dot"></span>
                No Active Job
            `;
        }


        if (progressText) {

            progressText.textContent =
                "Waiting";
        }


        if (progressBar) {

            progressBar.style.width =
                "0%";

            progressBar.setAttribute(
                "data-progress",
                "0"
            );
        }


        if (pendingStep) {

            pendingStep.classList.remove(
                "active",
                "completed"
            );
        }


        if (acceptedStep) {

            acceptedStep.classList.remove(
                "active",
                "completed"
            );
        }


        if (completedStep) {

            completedStep.classList.remove(
                "active",
                "completed"
            );
        }


        delete panel.dataset.bookingId;

        return;
    }


    if (customerElement) {

        customerElement.textContent =
            currentJob.customer_email ||
            "Customer";
    }


    if (addressElement) {

        addressElement.innerHTML = `
            <i class="fa-solid fa-location-dot"></i>
            ${escapeHtml(
                currentJob.address ||
                "Address not provided"
            )}
        `;
    }


    if (serviceElement) {

        serviceElement.innerHTML = `
            <i class="fa-solid fa-screwdriver-wrench"></i>
            ${escapeHtml(
                currentJob.service_name ||
                "Service"
            )}
        `;
    }


    if (statusBadge) {

        if (
            currentJob.status === "completed"
        ) {

            statusBadge.innerHTML = `
                <span class="live-dot"></span>
                Completed
            `;

        } else {

            statusBadge.innerHTML = `
                <span class="live-dot"></span>
                Active Job
            `;
        }
    }


    let progress = 50;

    let progressLabel =
        "Accepted";


    if (
        currentJob.status === "completed"
    ) {

        progress = 100;

        progressLabel =
            "Completed";
    }


    if (progressText) {

        progressText.textContent =
            progressLabel;
    }


    if (progressBar) {

        progressBar.style.width =
            progress + "%";

        progressBar.setAttribute(
            "data-progress",
            progress
        );
    }


    if (pendingStep) {

        pendingStep.classList.add(
            "completed"
        );

        pendingStep.classList.remove(
            "active"
        );
    }


    if (acceptedStep) {

        acceptedStep.classList.add(
            "completed"
        );

        acceptedStep.classList.remove(
            "active"
        );
    }


    if (completedStep) {

        if (
            currentJob.status === "completed"
        ) {

            completedStep.classList.add(
                "completed"
            );

        } else {

            completedStep.classList.remove(
                "completed"
            );

            completedStep.classList.add(
                "active"
            );
        }
    }


    panel.dataset.bookingId =
        currentJob.id;
}

/* ==========================================================================
   RENDER UPCOMING JOB
   ========================================================================== */

function renderUpcomingJob(bookings) {

    const customerElement =
        document.getElementById(
            "upcomingJobCustomer"
        );

    const serviceElement =
        document.getElementById(
            "upcomingJobService"
        );

    const addressElement =
        document.getElementById(
            "upcomingJobAddress"
        );

    const dateElement =
        document.getElementById(
            "upcomingJobDate"
        );

    const statusElement =
        document.getElementById(
            "upcomingJobStatus"
        );

    const detailsButton =
        document.getElementById(
            "upcomingJobDetailsBtn"
        );


    if (
        !customerElement ||
        !serviceElement ||
        !addressElement ||
        !dateElement ||
        !statusElement
    ) {

        console.warn(
            "Upcoming Job elements were not found."
        );

        return;
    }


    /*
     * ---------------------------------------------------------
     * FIND FUTURE ACCEPTED BOOKINGS
     * ---------------------------------------------------------
     */

    const now =
        new Date();

    const upcomingBookings =
        bookings
            .filter(
                function (booking) {

                    if (
                        booking.status !== "accepted"
                    ) {
                        return false;
                    }

                    if (
                        !booking.booking_date
                    ) {
                        return false;
                    }


                    const bookingTime =
                        booking.booking_time ||
                        "00:00:00";


                    const bookingDateTime =
                        new Date(
                            `${booking.booking_date}T${bookingTime}`
                        );


                    if (
                        Number.isNaN(
                            bookingDateTime.getTime()
                        )
                    ) {
                        return false;
                    }


                    return bookingDateTime >= now;

                }
            )
            .sort(
                function (a, b) {

                    const dateA =
                        new Date(
                            `${a.booking_date}T${a.booking_time || "00:00:00"}`
                        );

                    const dateB =
                        new Date(
                            `${b.booking_date}T${b.booking_time || "00:00:00"}`
                        );

                    return (
                        dateA.getTime() -
                        dateB.getTime()
                    );

                }
            );


    /*
     * ---------------------------------------------------------
     * NO UPCOMING JOB
     * ---------------------------------------------------------
     */

    if (
        upcomingBookings.length === 0
    ) {

        customerElement.textContent =
            "No upcoming job";

        serviceElement.textContent =
            "No accepted booking scheduled";

        addressElement.innerHTML = `
            <i class="fa-solid fa-location-dot"></i>
            No upcoming job scheduled
        `;

        dateElement.innerHTML = `
            <i class="fa-regular fa-calendar"></i>
            —
        `;

        statusElement.innerHTML = `
            <i class="fa-solid fa-circle-info"></i>
            Waiting for an accepted booking
        `;

        if (detailsButton) {

            detailsButton.disabled =
                true;

            detailsButton.removeAttribute(
                "data-booking-id"
            );
        }

        return;
    }


    /*
     * ---------------------------------------------------------
     * GET NEAREST UPCOMING BOOKING
     * ---------------------------------------------------------
     */

    const upcomingJob =
        upcomingBookings[0];


    const customer =
        upcomingJob.customer_name ||
        upcomingJob.customer_email ||
        "Customer";

    const service =
        upcomingJob.service_name ||
        "Service";

    const address =
        upcomingJob.address ||
        "Address not provided";

    const bookingDate =
        formatDisplayDate(
            upcomingJob.booking_date
        );

    const bookingTime =
        formatDisplayTime(
            upcomingJob.booking_time
        );


    /*
     * ---------------------------------------------------------
     * DISPLAY REAL DATA
     * ---------------------------------------------------------
     */

    customerElement.textContent =
        customer;

    serviceElement.textContent =
        `${service} · ${bookingTime}`;

    addressElement.innerHTML = `
        <i class="fa-solid fa-location-dot"></i>
        ${escapeHtml(address)}
    `;

    dateElement.innerHTML = `
        <i class="fa-regular fa-calendar"></i>
        ${escapeHtml(bookingDate)}
    `;

    statusElement.innerHTML = `
        <i class="fa-solid fa-circle-check"></i>
        Accepted
    `;


    /*
     * ---------------------------------------------------------
     * VIEW DETAILS BUTTON
     * ---------------------------------------------------------
     */

    if (detailsButton) {

        detailsButton.disabled =
            false;

        detailsButton.setAttribute(
            "data-booking-id",
            upcomingJob.id
        );
    }
}

/* ==========================================================================
   PERFORMANCE
   ========================================================================== */

function renderPerformance(bookings) {

    const total =
        bookings.length;


    const accepted =
        bookings.filter(
            function (booking) {

                return (
                    booking.status === "accepted" ||
                    booking.status === "completed"
                );

            }
        ).length;


    const completed =
        bookings.filter(
            function (booking) {

                return booking.status === "completed";

            }
        ).length;


    const rejected =
        bookings.filter(
            function (booking) {

                return booking.status === "rejected";

            }
        ).length;


    const acceptanceRate =
        total > 0
            ? Math.round(
                (
                    accepted /
                    total
                ) * 100
            )
            : 0;


    const acceptedOrCompleted =
        bookings.filter(
            function (booking) {

                return (
                    booking.status === "accepted" ||
                    booking.status === "completed"
                );

            }
        ).length;


    const completionRate =
        acceptedOrCompleted > 0
            ? Math.round(
                (
                    completed /
                    acceptedOrCompleted
                ) * 100
            )
            : 0;


    const responded =
        bookings.filter(
            function (booking) {

                return (
                    booking.status === "accepted" ||
                    booking.status === "rejected" ||
                    booking.status === "completed"
                );

            }
        ).length;


    const responseRate =
        total > 0
            ? Math.round(
                (
                    responded /
                    total
                ) * 100
            )
            : 0;


    const radials =
        document.querySelectorAll(
            "#performance .radial-progress"
        );


    const provider =
        window.oneClickProvider || {};


    const satisfaction =
        Number(
            provider.rating ?? 0
        );


    const satisfactionPercent =
        Math.round(
            (
                satisfaction /
                5
            ) * 100
        );


    const performanceData = [

        {
            value: responseRate,
            label: "Response Rate"
        },

        {
            value: completionRate,
            label: "Completion Rate"
        },

        {
            value: satisfactionPercent,
            label: "Customer Satisfaction"
        }

    ];


    radials.forEach(
        function (radial, index) {

            const item =
                performanceData[index];


            if (!item) {
                return;
            }


            const value =
                item.value;


            radial.setAttribute(
                "data-percent",
                value
            );


            const radialBar =
                radial.querySelector(
                    ".radial-bar"
                );


            if (radialBar) {

                const circumference =
                    2 *
                    Math.PI *
                    52;


                const offset =
                    circumference -
                    (
                        value /
                        100
                    ) *
                    circumference;


                radialBar.style.strokeDasharray =
                    circumference;


                radialBar.style.strokeDashoffset =
                    offset;
            }


            const radialValue =
                radial.querySelector(
                    ".radial-value"
                );


            if (radialValue) {

                radialValue.textContent =
                    value + "%";
            }
        }
    );


    console.log(
        "Real Performance:",
        {
            totalBookings: total,
            accepted: accepted,
            completed: completed,
            rejected: rejected,
            responseRate: responseRate,
            completionRate: completionRate,
            customerSatisfaction:
                satisfactionPercent
        }
    );
}


/* ==========================================================================
   MONTHLY EARNINGS
   ========================================================================== */

function renderMonthlyEarnings(bookings) {

    const now = new Date();

    const currentYear =
        now.getFullYear();

    const currentMonth =
        now.getMonth();


    const previousMonthDate =
        new Date(
            currentYear,
            currentMonth - 1,
            1
        );


    const previousYear =
        previousMonthDate.getFullYear();


    const previousMonth =
        previousMonthDate.getMonth();


    const completedThisMonth =
        bookings.filter(
            function (booking) {

                if (
                    booking.status !== "completed"
                ) {
                    return false;
                }


                if (
                    !booking.booking_date
                ) {
                    return false;
                }


                const date =
                    new Date(
                        booking.booking_date +
                        "T00:00:00"
                    );


                return (
                    date.getFullYear() ===
                    currentYear &&
                    date.getMonth() ===
                    currentMonth
                );

            }
        );


    let monthlyTotal = 0;


    completedThisMonth.forEach(
        function (booking) {

            monthlyTotal +=
                Number(
                    booking.total_price || 0
                );

        }
    );


    let averageJobValue = 0;


    if (
        completedThisMonth.length > 0
    ) {

        averageJobValue =
            monthlyTotal /
            completedThisMonth.length;

    }


   


    const completedPreviousMonth =
        bookings.filter(
            function (booking) {

                if (
                    booking.status !== "completed"
                ) {
                    return false;
                }


                if (
                    !booking.booking_date
                ) {
                    return false;
                }


                const date =
                    new Date(
                        booking.booking_date +
                        "T00:00:00"
                    );


                return (
                    date.getFullYear() ===
                    previousYear &&
                    date.getMonth() ===
                    previousMonth
                );

            }
        );


    let previousMonthTotal = 0;


    completedPreviousMonth.forEach(
        function (booking) {

            previousMonthTotal +=
                Number(
                    booking.total_price || 0
                );

        }
    );


    let changeText = "";


    if (
        previousMonthTotal === 0 &&
        monthlyTotal > 0
    ) {

        changeText =
            "New earnings this month";

    }
    else if (
        previousMonthTotal === 0 &&
        monthlyTotal === 0
    ) {

        changeText =
            "No completed earnings this month";

    }
    else {

        const percentageChange =
            (
                (
                    monthlyTotal -
                    previousMonthTotal
                ) /
                previousMonthTotal
            ) * 100;


        const roundedChange =
            Math.round(
                percentageChange
            );


        if (
            roundedChange > 0
        ) {

            changeText =
                "+" +
                roundedChange +
                "% from last month";

        }
        else if (
            roundedChange < 0
        ) {

            changeText =
                roundedChange +
                "% from last month";

        }
        else {

            changeText =
                "Same as last month";

        }
    }


    const monthName =
        now.toLocaleString(
            "en-US",
            {
                month: "long"
            }
        );


    const monthElement =
        document.querySelector(
            "#earningsMonth"
        ) ||
        document.querySelector(
            ".earnings-panel .panel-date"
        );


    if (monthElement) {

        monthElement.textContent =
            monthName +
            " " +
            currentYear;
    }


    const totalElement =
        document.querySelector(
            "#monthlyEarningsValue"
        ) ||
        document.querySelector(
            ".earnings-highlight .eh-value"
        );


    if (totalElement) {

        totalElement.textContent =
            "Rs. " +
            formatNumber(
                monthlyTotal,
                0
            );
    }


    const changeElement =
        document.querySelector(
            "#earningsChange"
        ) ||
        document.querySelector(
            ".earnings-highlight .eh-change"
        );


    if (changeElement) {

        changeElement.innerHTML =
            '<i class="fa-solid fa-chart-line"></i> ' +
            changeText;
    }


    const completedElement =
        document.querySelector(
            "#earningsCompletedJobs"
        );


    if (completedElement) {

        completedElement.textContent =
            completedThisMonth.length;

    }
    else {

        const miniStats =
            document.querySelectorAll(
                ".earnings-mini-stats .mini-stat h4"
            );


        if (miniStats[0]) {

            miniStats[0].textContent =
                completedThisMonth.length;
        }
    }


    const averageElement =
        document.querySelector(
            "#averageJobValue"
        );


    if (averageElement) {

        averageElement.textContent =
            "Rs. " +
            formatNumber(
                averageJobValue,
                0
            );

    }
    else {

        const miniStats =
            document.querySelectorAll(
                ".earnings-mini-stats .mini-stat h4"
            );


        if (miniStats[1]) {

            miniStats[1].textContent =
                "Rs. " +
                formatNumber(
                    averageJobValue,
                    0
                );
        }
    }



    console.log(
        "Real Monthly Earnings:",
        {
            month:
                monthName +
                " " +
                currentYear,

            completedJobs:
                completedThisMonth.length,

            totalEarnings:
                monthlyTotal,

            averageJobValue:
                averageJobValue,

           

            previousMonthEarnings:
                previousMonthTotal
        }
    );
}


/* ==========================================================================
   EARNINGS CHART
   ========================================================================== */

function renderEarningsChart(bookings) {

    const bars =
        document.querySelectorAll(
            "#earningsChart .bar"
        );


    if (!bars.length) {
        return;
    }


    const today =
        new Date();


    const dayOfWeek =
        today.getDay();


    const monday =
        new Date(today);


    const daysSinceMonday =
        dayOfWeek === 0
            ? 6
            : dayOfWeek - 1;


    monday.setDate(
        today.getDate() -
        daysSinceMonday
    );


    monday.setHours(
        0,
        0,
        0,
        0
    );


    const dailyTotals =
        new Array(7)
            .fill(0);


    bookings.forEach(
        function (booking) {

            if (
                booking.status !== "completed" ||
                !booking.booking_date
            ) {

                return;
            }


            const bookingDate =
                new Date(
                    `${booking.booking_date}T00:00:00`
                );


            if (
                Number.isNaN(
                    bookingDate.getTime()
                )
            ) {

                return;
            }


            const difference =
                Math.floor(
                    (
                        bookingDate -
                        monday
                    ) /
                    (
                        1000 *
                        60 *
                        60 *
                        24
                    )
                );


            if (
                difference >= 0 &&
                difference <= 6
            ) {

                dailyTotals[difference] +=
                    Number(
                        booking.total_price || 0
                    );
            }
        }
    );


    const max =
        Math.max(
            ...dailyTotals,
            1
        );


    bars.forEach(
        function (bar, index) {

            const amount =
                dailyTotals[index] || 0;


            let percentage =
                (
                    amount /
                    max
                ) * 100;


            if (
                amount === 0
            ) {

                percentage = 4;
            }


            bar.style.height =
                percentage + "%";


            bar.style.setProperty(
                "--val",
                percentage + "%"
            );


            bar.setAttribute(
                "data-real-earnings",
                amount
            );


            bar.setAttribute(
                "title",
                `Rs. ${formatNumber(
                    amount,
                    0
                )}`
            );
        }
    );


    console.log(
        "Real weekly earnings chart:",
        dailyTotals
    );
}


/* ==========================================================================
   BOOKING DATE INDICATORS
   ========================================================================== */

function renderBookingDateIndicators(
    bookings
) {

    const bookingDates =
        new Set();


    bookings.forEach(
        function (booking) {

            if (
                booking.booking_date
            ) {

                bookingDates.add(
                    booking.booking_date
                );
            }
        }
    );


    window.oneClickBookingDates =
        bookingDates;


    const dateElements =
        document.querySelectorAll(
            "[data-date]"
        );


    dateElements.forEach(
        function (element) {

            const date =
                element.getAttribute(
                    "data-date"
                );


            if (
                bookingDates.has(date)
            ) {

                element.classList.add(
                    "has-booking"
                );

            } else {

                element.classList.remove(
                    "has-booking"
                );
            }
        }
    );


    console.log(
        "Booking dates:",
        Array.from(
            bookingDates
        )
    );
}


/* ==========================================================================
   SIDEBAR TOGGLE
   ========================================================================== */

function initSidebarToggle() {

    const appShell =
        document.querySelector(
            ".app-shell"
        );


    const menuToggle =
        document.getElementById(
            "menuToggle"
        );


    const sidebarClose =
        document.getElementById(
            "sidebarClose"
        );


    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (
        !appShell ||
        !menuToggle
    ) {

        return;
    }


    function isMobile() {

        return (
            window.innerWidth <= 992
        );
    }


    menuToggle.addEventListener(
        "click",
        function () {

            if (
                isMobile()
            ) {

                appShell.classList.toggle(
                    "sidebar-open"
                );

            } else {

                appShell.classList.toggle(
                    "sidebar-collapsed"
                );
            }
        }
    );


    if (sidebarClose) {

        sidebarClose.addEventListener(
            "click",
            function () {

                appShell.classList.remove(
                    "sidebar-open"
                );
            }
        );
    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            function () {

                appShell.classList.remove(
                    "sidebar-open"
                );
            }
        );
    }


    window.addEventListener(
        "resize",
        function () {

            if (
                !isMobile()
            ) {

                appShell.classList.remove(
                    "sidebar-open"
                );
            }
        }
    );
}


/* ==========================================================================
   NAVIGATION ACTIVE STATE
   ========================================================================== */

function initNavActiveState() {

    const navItems =
        document.querySelectorAll(
            ".oc-sidebar .nav-item"
        );


    navItems.forEach(
        function (item) {

            const link =
                item.querySelector(
                    ".nav-link"
                );


            if (!link) {
                return;
            }


            link.addEventListener(
                "click",
                function () {

                    navItems.forEach(
                        function (i) {

                            i.classList.remove(
                                "active"
                            );
                        }
                    );


                    item.classList.add(
                        "active"
                    );


                    const appShell =
                        document.querySelector(
                            ".app-shell"
                        );


                    if (appShell) {

                        appShell.classList.remove(
                            "sidebar-open"
                        );
                    }
                }
            );
        }
    );
}


/* ==========================================================================
   DROPDOWNS
   ========================================================================== */

function initDropdowns() {

    const dropdowns =
        document.querySelectorAll(
            ".topbar-dropdown"
        );


    if (!dropdowns.length) {
        return;
    }


    dropdowns.forEach(
        function (dropdown) {

            const trigger =
                dropdown.querySelector(
                    ".icon-btn, .profile-trigger, button, [role='button']"
                );


            if (!trigger) {
                return;
            }


            trigger.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    event.stopPropagation();


                    const isOpen =
                        dropdown.classList.contains(
                            "open"
                        );


                    dropdowns.forEach(
                        function (item) {

                            item.classList.remove(
                                "open"
                            );
                        }
                    );


                    if (!isOpen) {

                        dropdown.classList.add(
                            "open"
                        );
                    }
                }
            );
        }
    );


    document.addEventListener(
        "click",
        function () {

            dropdowns.forEach(
                function (dropdown) {

                    dropdown.classList.remove(
                        "open"
                    );
                }
            );
        }
    );
}


/* ==========================================================================
   ONLINE / OFFLINE STATUS
   ========================================================================== */

function updateOnlineStatus(
    isAvailable
) {

    const toggle =
        document.getElementById(
            "onlineToggle"
        );


    const wrap =
        document.querySelector(
            ".status-toggle-wrap"
        );


    const label =
        document.getElementById(
            "statusLabel"
        );


    if (
        !toggle ||
        !wrap ||
        !label
    ) {

        return;
    }


    const available =
        Boolean(
            isAvailable
        );


    toggle.checked =
        available;


    if (available) {

        wrap.classList.remove(
            "offline"
        );

        label.textContent =
            "Online";

    } else {

        wrap.classList.add(
            "offline"
        );

        label.textContent =
            "Offline";
    }
}


/* ==========================================================================
   ONLINE / OFFLINE TOGGLE
   ========================================================================== */

function initOnlineToggle() {

    const toggle =
        document.getElementById(
            "onlineToggle"
        );


    if (!toggle) {
        return;
    }


    toggle.addEventListener(
        "change",
        async function () {

            const newAvailability =
                toggle.checked;


            updateOnlineStatus(
                newAvailability
            );


            try {

                const data =
                    await updateProviderAvailability(
                        newAvailability
                    );


                console.log(
                    "Availability updated:",
                    data
                );

            }
            catch (error) {

                console.error(
                    "Availability update failed:",
                    error
                );


                updateOnlineStatus(
                    !newAvailability
                );


                alert(
                    error.message ||
                    "Failed to update availability."
                );
            }
        }
    );
}


/* ==========================================================================
   UPDATE PROVIDER AVAILABILITY
   ========================================================================== */

async function updateProviderAvailability(
    available
) {

    const token =
        getAccessToken();


    if (!token) {

        throw new Error(
            "Your login session has expired. Please login again."
        );
    }


    const response =
        await fetch(
            `${API_BASE}/providers/availability/`,
            {
                method: "PATCH",

                headers: {
                    "Authorization":
                        `Bearer ${token}`,

                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    available:
                        available
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


    if (
        response.status === 401
    ) {

        throw new Error(
            "Your login session has expired. Please login again."
        );
    }


    if (!response.ok) {

        throw new Error(
            data.error ||
            data.detail ||
            `Availability update failed: ${response.status}`
        );
    }


    if (
        window.oneClickProvider
    ) {

        window.oneClickProvider.available =
            data.available;
    }


    return data;
}


/* ==========================================================================
   AVAILABILITY SWITCHES
   ========================================================================== */

function initAvailabilitySwitches() {

    const availableToday =
        document.getElementById(
            "availableToday"
        );


    const unavailable =
        document.getElementById(
            "unavailable"
        );


    if (
        !availableToday ||
        !unavailable
    ) {

        return;
    }


    availableToday.addEventListener(
        "change",
        function () {

            if (
                availableToday.checked
            ) {

                unavailable.checked =
                    false;
            }
        }
    );


    unavailable.addEventListener(
        "change",
        function () {

            if (
                unavailable.checked
            ) {

                availableToday.checked =
                    false;
            }
        }
    );
}


/* ==========================================================================
   PROGRESS BARS
   ========================================================================== */

function initProgressBars() {

    const bars =
        document.querySelectorAll(
            ".oc-progress-bar"
        );


    if (!bars.length) {
        return;
    }


    bars.forEach(
        function (bar) {

            const targetWidth =
                bar.getAttribute(
                    "data-progress"
                ) || "0";


            setTimeout(
                function () {

                    bar.style.width =
                        targetWidth + "%";

                },
                400
            );
        }
    );
}


/* ==========================================================================
   RADIAL PROGRESS
   ========================================================================== */

function initRadialProgress() {

    const radials =
        document.querySelectorAll(
            ".radial-progress"
        );


    if (!radials.length) {
        return;
    }


    const circumference =
        2 *
        Math.PI *
        52;


    radials.forEach(
        function (el) {

            const percent =
                parseFloat(
                    el.getAttribute(
                        "data-percent"
                    )
                ) || 0;


            const bar =
                el.querySelector(
                    ".radial-bar"
                );


            if (bar) {

                bar.style.strokeDasharray =
                    circumference;


                const offset =
                    circumference -
                    (
                        percent /
                        100
                    ) *
                    circumference;


                bar.style.strokeDashoffset =
                    offset;
            }
        }
    );
}


/* ==========================================================================
   EARNINGS CHART INITIALIZATION
   ========================================================================== */

function initEarningsChart() {

    const bars =
        document.querySelectorAll(
            "#earningsChart .bar"
        );


    if (!bars.length) {
        return;
    }


    bars.forEach(
        function (bar) {

            bar.style.height =
                "4%";

            bar.style.setProperty(
                "--val",
                "4%"
            );
        }
    );
}


/* ==========================================================================
   RIPPLE EFFECT
   ========================================================================== */

function initRippleButtons() {

    const buttons =
        document.querySelectorAll(
            ".ripple"
        );


    buttons.forEach(
        function (btn) {

            btn.addEventListener(
                "click",
                function (event) {

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


                    circle.classList.add(
                        "ripple-circle"
                    );


                    circle.style.width =
                        circle.style.height =
                            size + "px";


                    circle.style.left =
                        (
                            event.clientX -
                            rect.left -
                            size / 2
                        ) + "px";


                    circle.style.top =
                        (
                            event.clientY -
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


/* ==========================================================================
   JOB REQUEST ACTIONS
   ========================================================================== */

function initJobRequestActions() {

    const acceptButtons =
        document.querySelectorAll(
            ".accept-btn"
        );


    const rejectButtons =
        document.querySelectorAll(
            ".reject-btn"
        );


    acceptButtons.forEach(
        function (button) {

            if (
                button.dataset.listenerAttached === "true"
            ) {

                return;
            }


            button.dataset.listenerAttached =
                "true";


            button.addEventListener(
                "click",
                async function () {

                    const bookingId =
                        button.getAttribute(
                            "data-booking-id"
                        );


                    if (!bookingId) {

                        console.error(
                            "Booking ID missing."
                        );

                        return;
                    }


                    await updateBookingStatus(
                        bookingId,
                        "accepted",
                        button
                    );
                }
            );
        }
    );


    rejectButtons.forEach(
        function (button) {

            if (
                button.dataset.listenerAttached === "true"
            ) {

                return;
            }


            button.dataset.listenerAttached =
                "true";


            button.addEventListener(
                "click",
                async function () {

                    const bookingId =
                        button.getAttribute(
                            "data-booking-id"
                        );


                    if (!bookingId) {

                        console.error(
                            "Booking ID missing."
                        );

                        return;
                    }


                    await updateBookingStatus(
                        bookingId,
                        "rejected",
                        button
                    );
                }
            );
        }
    );
}


/* ==========================================================================
   UPDATE BOOKING STATUS
   ========================================================================== */

async function updateBookingStatus(
    bookingId,
    newStatus,
    button
) {

    const token =
        getAccessToken();


    if (!token) {

        alert(
            "Your login session has expired. Please login again."
        );

        return;
    }


    if (button) {

        button.disabled =
            true;
    }


    try {

        const response =
            await fetch(
                `${API_BASE}/bookings/provider/${bookingId}/`,
                {
                    method: "PATCH",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        status:
                            newStatus
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


        if (
            response.status === 401
        ) {

            throw new Error(
                "Your login session has expired. Please login again."
            );
        }


        if (!response.ok) {

            throw new Error(
                data.error ||
                data.detail ||
                `Booking update failed: ${response.status}`
            );
        }


        console.log(
            "Booking updated:",
            data
        );


        await loadProviderDashboard();

    }
    catch (error) {

        console.error(
            "Failed to update booking:",
            error
        );


        alert(
            error.message ||
            "Unable to update booking."
        );


        if (button) {

            button.disabled =
                false;
        }
    }
}


/* ==========================================================================
   SEARCH
   ========================================================================== */

function initSearchInteraction() {

    const searchInput =
        document.getElementById(
            "topSearch"
        );


    if (!searchInput) {
        return;
    }


    let debounceTimer;


    searchInput.addEventListener(
        "input",
        function () {

            clearTimeout(
                debounceTimer
            );


            const query =
                searchInput.value.trim();


            debounceTimer =
                setTimeout(
                    function () {

                        if (
                            query.length === 0
                        ) {

                            return;
                        }


                        console.log(
                            "Searching OneClick:",
                            query
                        );

                    },
                    300
                );
        }
    );


    searchInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                searchInput.blur();
            }
        }
    );
}


/* ==========================================================================
   BACK TO TOP
   ========================================================================== */

function initBackToTop() {

    const backToTopBtn =
        document.getElementById(
            "backToTop"
        );


    if (!backToTopBtn) {
        return;
    }


    window.addEventListener(
        "scroll",
        function () {

            if (
                window.scrollY > 400
            ) {

                backToTopBtn.classList.add(
                    "visible"
                );

            } else {

                backToTopBtn.classList.remove(
                    "visible"
                );
            }
        }
    );


    backToTopBtn.addEventListener(
        "click",
        function () {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }
    );
}


/* ==========================================================================
   GET TODAY'S DATE
   ========================================================================== */

function getTodayDateString() {

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


    return `${year}-${month}-${day}`;
}


/* ==========================================================================
   FORMAT DATE
   ========================================================================== */

function formatDisplayDate(
    dateString
) {

    if (!dateString) {

        return "Date not provided";
    }


    const date =
        new Date(
            `${dateString}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateString;
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


/* ==========================================================================
   FORMAT TIME
   ========================================================================== */

function formatDisplayTime(
    timeString
) {

    if (!timeString) {

        return "Time not provided";
    }


    const parts =
        timeString.split(":");


    if (
        parts.length < 2
    ) {

        return timeString;
    }


    let hours =
        Number(
            parts[0]
        );


    const minutes =
        parts[1];


    const period =
        hours >= 12
            ? "PM"
            : "AM";


    hours =
        hours % 12 ||
        12;


    return `${hours}:${minutes} ${period}`;
}


/* ==========================================================================
   FORMAT NUMBER
   ========================================================================== */

function formatNumber(
    value,
    decimals
) {

    if (
        decimals > 0
    ) {

        return Number(
            value
        ).toFixed(
            decimals
        );
    }


    return Math.round(
        Number(value) || 0
    ).toLocaleString(
        "en-IN"
    );
}


/* ==========================================================================
   GENERIC TEXT HELPER
   ========================================================================== */

function setText(
    selector,
    value
) {

    const element =
        document.querySelector(
            selector
        );


    if (!element) {
        return;
    }


    element.textContent =
        value ?? "";
}


/* ==========================================================================
   ERROR MESSAGE
   ========================================================================== */

function showDashboardError(
    message
) {

    console.warn(
        "Provider dashboard error:",
        message ||
        "Unknown error"
    );


    const name =
        document.querySelector(
            "#dashboardProviderName"
        );


    if (name) {

        name.textContent =
            "Provider";
    }


    const greeting =
        document.querySelector(
            "#dashboardGreetingName"
        );


    if (greeting) {

        greeting.textContent =
            "Provider";
    }
}


/* ==========================================================================
   HTML ESCAPE
   ========================================================================== */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
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


/* ==========================================================================
   ONECLICK — PROVIDER QUOTATION
   Send Quote
   ========================================================================== */

let currentQuotationRequestId = null;


/* ==========================================================================
   SETUP QUOTATION FORM
   ========================================================================== */

function setupQuotationForm() {

    const form =
        document.getElementById(
            "quotationForm"
        );


    if (!form) {

        console.warn(
            "quotationForm was not found."
        );

        return;
    }


    /*
     * Prevent duplicate submit listeners.
     */

    if (
        form.dataset.listenerAttached ===
        "true"
    ) {

        return;
    }


    form.dataset.listenerAttached =
        "true";


    form.addEventListener(
        "submit",
        submitProviderQuotation
    );


    console.log(
        "Quotation form initialized."
    );
}


/* ==========================================================================
   OPEN QUOTATION MODAL
   ========================================================================== */

function openQuotationModal(
    requestId
) {

    console.log(
        "Opening quotation modal for request:",
        requestId
    );


    currentQuotationRequestId =
        requestId;


    const requestInput =
        document.getElementById(
            "quotationRequestId"
        );


    const priceInput =
        document.getElementById(
            "quotationPrice"
        );


    const messageInput =
        document.getElementById(
            "quotationMessage"
        );


    const errorBox =
        document.getElementById(
            "quotationError"
        );


    const successBox =
        document.getElementById(
            "quotationSuccess"
        );


    if (requestInput) {

        requestInput.value =
            requestId;
    }


    if (priceInput) {

        priceInput.value =
            "";
    }


    if (messageInput) {

        messageInput.value =
            "";
    }


    if (errorBox) {

        errorBox.classList.add(
            "d-none"
        );

        errorBox.textContent =
            "";
    }


    if (successBox) {

        successBox.classList.add(
            "d-none"
        );

        successBox.textContent =
            "";
    }


    const modalElement =
        document.getElementById(
            "quotationModal"
        );


    if (!modalElement) {

        console.error(
            "quotationModal NOT FOUND."
        );

        return;
    }


    console.log(
        "Quotation modal element found."
    );


    if (
        typeof bootstrap ===
        "undefined"
    ) {

        console.error(
            "Bootstrap JavaScript is NOT loaded."
        );

        return;
    }


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );


    modal.show();


    console.log(
        "Quotation modal opened successfully."
    );
}


/* ==========================================================================
   SUBMIT PROVIDER QUOTATION
   ========================================================================== */

async function submitProviderQuotation(
    event
) {

    event.preventDefault();


    const requestInput =
        document.getElementById(
            "quotationRequestId"
        );


    const priceInput =
        document.getElementById(
            "quotationPrice"
        );


    const messageInput =
        document.getElementById(
            "quotationMessage"
        );


    const errorBox =
        document.getElementById(
            "quotationError"
        );


    const successBox =
        document.getElementById(
            "quotationSuccess"
        );


    const submitButton =
        document.getElementById(
            "submitQuotationBtn"
        );


    const requestId =
        currentQuotationRequestId ||
        (
            requestInput
                ? requestInput.value
                : ""
        );


    const price =
        priceInput
            ? priceInput.value
            : "";


    /*
     * Provider message.
     *
     * This is stored in the quotation.message
     * field by the Django backend.
     */

    const message =
        messageInput
            ? messageInput.value.trim()
            : "";


    console.log(
        "Submitting quotation:",
        {
            requestId:
                requestId,

            price:
                price,

            message:
                message
        }
    );


    if (errorBox) {

        errorBox.classList.add(
            "d-none"
        );

        errorBox.textContent =
            "";
    }


    if (successBox) {

        successBox.classList.add(
            "d-none"
        );

        successBox.textContent =
            "";
    }


    if (!requestId) {

        if (errorBox) {

            errorBox.textContent =
                "Service request ID is missing.";

            errorBox.classList.remove(
                "d-none"
            );
        }

        return;
    }


    if (
        !price ||
        Number(price) <= 0
    ) {

        if (errorBox) {

            errorBox.textContent =
                "Please enter a valid price.";

            errorBox.classList.remove(
                "d-none"
            );
        }

        return;
    }


    if (submitButton) {

        submitButton.disabled =
            true;


        submitButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin me-2"></i>
            Sending...
        `;
    }


    try {

        const token =
            getAccessToken();


        if (!token) {

            throw new Error(
                "Your login session has expired. Please log in again."
            );
        }


        const response =
            await fetch(
                `${API_BASE}/services/quotations/`,
                {
                    method: "POST",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            request:
                                Number(requestId),

                            price:
                                Number(price),

                            message:
                                message

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
            "Quotation response:",
            response.status,
            data
        );


        if (!response.ok) {

            let errorMessage =
                "Failed to send quotation.";


            if (data.detail) {

                errorMessage =
                    data.detail;

            }
            else {

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


            throw new Error(
                errorMessage
            );
        }


        if (successBox) {

            successBox.textContent =
                "Quotation sent successfully!";

            successBox.classList.remove(
                "d-none"
            );
        }


        /*
         * Clear current request after success.
         */

        currentQuotationRequestId =
            null;


        /*
         * Close modal after 1.2 seconds.
         */

        setTimeout(
            function () {

                const modalElement =
                    document.getElementById(
                        "quotationModal"
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


                if (successBox) {

                    successBox.classList.add(
                        "d-none"
                    );
                }

            },
            1200
        );


        /*
         * Reload provider requests.
         */

        setTimeout(
            async function () {

                try {

                    const requests =
                        await loadProviderServiceRequests();


                    window.oneClickServiceRequests =
                        requests;


                    renderJobRequests(
                        requests
                    );

                }
                catch (error) {

                    console.error(
                        "Failed to refresh service requests:",
                        error
                    );
                }

            },
            1300
        );

    }
    catch (error) {

        console.error(
            "Send quotation error:",
            error
        );


        if (errorBox) {

            errorBox.textContent =
                error.message ||
                "Something went wrong while sending the quotation.";

            errorBox.classList.remove(
                "d-none"
            );
        }

    }
    finally {

        if (submitButton) {

            submitButton.disabled =
                false;


            submitButton.innerHTML = `
                <i class="fa-solid fa-paper-plane me-2"></i>
                Send Quote
            `;
        }
    }
}


/* ==========================================================================
   PROVIDER FINAL OFFER
   ========================================================================== */


/* --------------------------------------------------------------------------
   OPEN FINAL OFFER MODAL
   -------------------------------------------------------------------------- */

function openFinalOfferModal(quotationId) {

    const quotationIdInput =
        document.getElementById(
            "finalOfferQuotationId"
        );

    const priceInput =
        document.getElementById(
            "finalOfferPrice"
        );

    const messageInput =
        document.getElementById(
            "finalOfferMessage"
        );

    const errorBox =
        document.getElementById(
            "finalOfferError"
        );

    const modalElement =
        document.getElementById(
            "finalOfferModal"
        );


    if (!quotationIdInput || !priceInput || !messageInput || !modalElement) {

        console.error(
            "Final offer modal elements not found."
        );

        return;
    }


    /*
     * Store quotation ID.
     */

    quotationIdInput.value =
        quotationId;


    /*
     * Clear previous values.
     */

    priceInput.value = "";

    messageInput.value = "";


    if (errorBox) {

        errorBox.textContent = "";

        errorBox.classList.add(
            "d-none"
        );
    }


    /*
     * Open Bootstrap modal.
     */

    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );

    modal.show();
}


/* --------------------------------------------------------------------------
   SUBMIT FINAL OFFER
   -------------------------------------------------------------------------- */

async function submitProviderFinalOffer() {

    const quotationId =
        document.getElementById(
            "finalOfferQuotationId"
        )?.value;


    const price =
        document.getElementById(
            "finalOfferPrice"
        )?.value;


    const message =
        document.getElementById(
            "finalOfferMessage"
        )?.value.trim();


    const errorBox =
        document.getElementById(
            "finalOfferError"
        );


    if (!quotationId) {

        console.error(
            "Quotation ID is missing."
        );

        return;
    }


    if (!price || Number(price) <= 0) {

        if (errorBox) {

            errorBox.textContent =
                "Please enter a valid final price.";

            errorBox.classList.remove(
                "d-none"
            );
        }

        return;
    }


    const token =
        getAccessToken();


    if (!token) {

        if (errorBox) {

            errorBox.textContent =
                "Your login session has expired. Please login again.";

            errorBox.classList.remove(
                "d-none"
            );
        }

        return;
    }


    const submitButton =
        document.getElementById(
            "submitFinalOfferBtn"
        );


    try {

        if (submitButton) {

            submitButton.disabled = true;

            submitButton.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin me-1"></i> Sending...';
        }


        console.log(
            "Sending final offer for quotation:",
            quotationId
        );


        const response =
            await fetch(
                `${API_BASE}/services/quotations/${quotationId}/final/`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify({
                            final_price:
                                Number(price),

                            final_message:
                                message
                        })
                }
            );


        console.log(
            "Final offer response:",
            response.status
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
            "Final offer data:",
            data
        );


        if (response.status === 401) {

            throw new Error(
                "Your login session has expired. Please login again."
            );
        }


        if (!response.ok) {

            throw new Error(
                data.detail ||
                data.error ||
                "Failed to send final offer."
            );
        }


        /*
         * Close modal.
         */

        const modalElement =
            document.getElementById(
                "finalOfferModal"
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


        /*
         * Reload quotations.
         */

        const quotations =
            await loadProviderQuotations();


        window.oneClickQuotations =
            quotations;


        renderProviderCounterOffers(
            quotations
        );


        console.log(
            "Final offer sent successfully."
        );

    }
    catch (error) {

        console.error(
            "Final offer error:",
            error
        );


        if (errorBox) {

            errorBox.textContent =
                error.message ||
                "Failed to send final offer.";

            errorBox.classList.remove(
                "d-none"
            );
        }

    }
    finally {

        if (submitButton) {

            submitButton.disabled = false;

            submitButton.innerHTML =
                '<i class="fa-solid fa-handshake me-1"></i> Send Final Offer';
        }
    }
}


/* --------------------------------------------------------------------------
   FINAL OFFER BUTTON + MODAL LISTENER
   -------------------------------------------------------------------------- */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /*
         * Counter-offer cards are rendered dynamically,
         * so use event delegation.
         */

        document.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        ".final-offer-btn"
                    );


                if (!button) {
                    return;
                }


                const quotationId =
                    button.dataset.quotationId;


                if (!quotationId) {

                    console.error(
                        "Final offer quotation ID not found."
                    );

                    return;
                }


                console.log(
                    "Opening final offer for quotation:",
                    quotationId
                );


                openFinalOfferModal(
                    quotationId
                );
            }
        );


        /*
         * Submit button.
         */

        const submitButton =
            document.getElementById(
                "submitFinalOfferBtn"
            );


        if (!submitButton) {

            console.error(
                "submitFinalOfferBtn not found."
            );

            return;
        }


        submitButton.addEventListener(
            "click",
            submitProviderFinalOffer
        );

    }
);


// =========================================================
// LOGOUT
// =========================================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", function (event) {

        event.preventDefault();

        // Remove JWT tokens
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        // Remove stored user/provider data if present
        localStorage.removeItem("user");
        localStorage.removeItem("provider");

        // Go to login page
        window.location.href = "login.html";

    });

}
