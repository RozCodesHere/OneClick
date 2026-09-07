/* ==========================================================================
   ONECLICK — PROVIDER DASHBOARD
   Connected to Django REST API

   APIs:

   GET   /api/providers/{id}/
   GET   /api/bookings/provider/
   PATCH /api/bookings/provider/{booking_id}/

   JWT:
   localStorage["access_token"]
   ========================================================================== */

const API_BASE = "http://127.0.0.1:8000/api";


/* ==========================================================================
   PAGE INITIALIZATION
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {

    /*
     * Load real provider + booking data.
     */
    loadProviderDashboard();

    /*
     * Existing UI functionality.
     */
    initSidebarToggle();
    initDropdowns();
    initOnlineToggle();
    initAvailabilitySwitches();
    initAnimatedCounters();
    initProgressBars();
    initRadialProgress();
    initEarningsChart();
    initRippleButtons();
    initJobRequestActions();
    initSearchInteraction();
    initBackToTop();
    initNavActiveState();
});


/* ==========================================================================
   GET PROVIDER ID
   ========================================================================== */

function getProviderId() {

    const params =
        new URLSearchParams(window.location.search);

    /*
     * Temporary provider ID.
     *
     * Example:
     * provider-dashboard.html?id=1
     *
     * Later we will completely replace this
     * with the logged-in provider's JWT.
     */

    return params.get("id") || "1";
}


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

    const providerId =
        getProviderId();

    console.log(
        "Loading provider:",
        providerId
    );


    try {

        /* --------------------------------------------------------------
           LOAD PROVIDER PROFILE
        -------------------------------------------------------------- */

        const providerResponse =
            await fetch(
                `${API_BASE}/providers/${providerId}/`
            );


        if (!providerResponse.ok) {

            throw new Error(
                `Provider API failed: ${providerResponse.status}`
            );
        }


        const provider =
            await providerResponse.json();


        console.log(
            "Provider dashboard data:",
            provider
        );


        renderProviderDashboard(
            provider
        );


        /* --------------------------------------------------------------
           LOAD PROVIDER BOOKINGS
        -------------------------------------------------------------- */

        const bookings =
            await loadProviderBookings();


        console.log(
            "Provider bookings:",
            bookings
        );


        /*
         * Store bookings globally so other
         * dashboard functions can use them.
         */

        window.oneClickBookings =
            bookings;


        /* --------------------------------------------------------------
           RENDER REAL DASHBOARD DATA
        -------------------------------------------------------------- */

        renderDashboardStatistics(
            bookings
        );

        renderJobRequests(
            bookings
        );

        renderTodaySchedule(
            bookings
        );

        renderCurrentJob(
            bookings
        );


    } catch (error) {

        console.error(
            "Failed to load provider dashboard:",
            error
        );

        showDashboardError();
    }
}


/* ==========================================================================
   LOAD PROVIDER BOOKINGS
   ========================================================================== */

async function loadProviderBookings() {

    const token =
        getAccessToken();


    /*
     * Booking API requires authentication.
     */

    if (!token) {

        console.error(
            "No access token found."
        );

        console.warn(
            "Please login again."
        );

        return [];
    }


    try {

        const response =
            await fetch(
                `${API_BASE}/bookings/provider/`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                `Booking API failed: ${response.status}`
            );
        }


        const bookings =
            await response.json();


        return bookings;


    } catch (error) {

        console.error(
            "Failed to load provider bookings:",
            error
        );

        return [];
    }
}


/* ==========================================================================
   RENDER PROVIDER INFORMATION
   ========================================================================== */

function renderProviderDashboard(provider) {

    /*
     * ---------------------------------------------------------
     * PROVIDER NAME
     * ---------------------------------------------------------
     */

    const fullName =
        provider.full_name || "Provider";


    setText(
        "#dashboardProviderName",
        fullName
    );


    /*
     * Greeting
     */

    const firstName =
        fullName.split(" ")[0];


    setText(
        "#dashboardGreetingName",
        firstName
    );


    /*
     * ---------------------------------------------------------
     * CATEGORY + VERIFICATION
     * ---------------------------------------------------------
     */

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


    /*
     * ---------------------------------------------------------
     * PROFILE IMAGE
     * ---------------------------------------------------------
     */

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
    }


    /*
     * ---------------------------------------------------------
     * ONLINE / OFFLINE STATE
     * ---------------------------------------------------------
     */

    updateOnlineStatus(
        provider.available
    );


    /*
     * ---------------------------------------------------------
     * RATING
     * ---------------------------------------------------------
     */

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
        "Provider reviews:",
        reviewCount
    );


    /*
     * ---------------------------------------------------------
     * STORE PROVIDER DATA
     * ---------------------------------------------------------
     */

    window.oneClickProvider =
        provider;
}


/* ==========================================================================
   DASHBOARD STATISTICS
   ========================================================================== */

function renderDashboardStatistics(bookings) {

    /*
     * ---------------------------------------------------------
     * COUNT PENDING REQUESTS
     * ---------------------------------------------------------
     */

    const pendingBookings =
        bookings.filter(
            function (booking) {

                return booking.status === "pending";
            }
        );


    /*
     * ---------------------------------------------------------
     * TODAY
     * ---------------------------------------------------------
     */

    const today =
        getTodayDateString();


    const todayBookings =
        bookings.filter(
            function (booking) {

                return (
                    booking.booking_date === today
                );
            }
        );


    /*
     * Accepted jobs scheduled today.
     */

    const todayJobs =
        todayBookings.filter(
            function (booking) {

                return (
                    booking.status === "accepted"
                );
            }
        );


    /*
     * ---------------------------------------------------------
     * COMPLETED JOBS
     * ---------------------------------------------------------
     */

    const completedBookings =
        bookings.filter(
            function (booking) {

                return (
                    booking.status === "completed"
                );
            }
        );


    /*
     * ---------------------------------------------------------
     * MONTHLY EARNINGS
     * ---------------------------------------------------------
     */

    const currentDate =
        new Date();


    const currentYear =
        currentDate.getFullYear();


    const currentMonth =
        currentDate.getMonth() + 1;


    const monthlyCompleted =
        completedBookings.filter(
            function (booking) {

                if (!booking.booking_date) {
                    return false;
                }


                const parts =
                    booking.booking_date.split("-");


                if (parts.length !== 3) {
                    return false;
                }


                const year =
                    Number(parts[0]);


                const month =
                    Number(parts[1]);


                return (
                    year === currentYear &&
                    month === currentMonth
                );
            }
        );


    const monthlyEarnings =
        monthlyCompleted.reduce(
            function (total, booking) {

                return (
                    total +
                    Number(
                        booking.total_price || 0
                    )
                );
            },
            0
        );


    /*
     * ---------------------------------------------------------
     * AVERAGE RATING
     * ---------------------------------------------------------
     */

    const provider =
        window.oneClickProvider || {};


    const rating =
        Number(
            provider.rating ?? 0
        );


    /*
     * ---------------------------------------------------------
     * UPDATE STAT CARDS
     * ---------------------------------------------------------
     *
     * HTML order:
     *
     * 1. Pending Requests
     * 2. Today's Jobs
     * 3. Completed Jobs
     * 4. Monthly Earnings
     * 5. Average Rating
     * 6. Response Rate
     */

    const statValues =
        document.querySelectorAll(
            ".stat-value"
        );


    if (statValues.length >= 6) {

        updateStat(
            statValues[0],
            pendingBookings.length,
            "",
            ""
        );


        updateStat(
            statValues[1],
            todayJobs.length,
            "",
            ""
        );


        updateStat(
            statValues[2],
            completedBookings.length,
            "",
            ""
        );


        updateStat(
            statValues[3],
            monthlyEarnings,
            "Rs. ",
            ""
        );


        updateStat(
            statValues[4],
            rating,
            "",
            "",
            1
        );
    }


    /*
     * ---------------------------------------------------------
     * UPDATE PENDING REQUEST BADGE
     * ---------------------------------------------------------
     */

    const requestNav =
        document.querySelector(
            '#job-requests'
        );


    if (requestNav) {

        const badge =
            requestNav.querySelector(
                ".nav-badge"
            );


        if (badge) {

            badge.textContent =
                pendingBookings.length;
        }
    }


    console.log(
        "Dashboard statistics:",
        {
            pending:
                pendingBookings.length,

            todayJobs:
                todayJobs.length,

            completed:
                completedBookings.length,

            monthlyEarnings:
                monthlyEarnings,

            rating:
                rating
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


    /*
     * Update data attributes too.
     */

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


    /*
     * Immediately show real value.
     */

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

function renderJobRequests(bookings) {

    const container =
        document.querySelector(
            ".job-requests-grid"
        );


    if (!container) {
        return;
    }


    /*
     * Only pending bookings are requests.
     */

    const requests =
        bookings.filter(
            function (booking) {

                return (
                    booking.status === "pending"
                );
            }
        );


    /*
     * No requests.
     */

    if (requests.length === 0) {

        container.innerHTML = `
            <div class="request-card">
                <div class="request-top">
                    <div>
                        <strong>No pending requests</strong>
                        <div class="text-muted mt-1">
                            New customer requests will appear here.
                        </div>
                    </div>
                </div>
            </div>
        `;

        return;
    }


    /*
     * Create request cards.
     */

    container.innerHTML =
        requests.map(
            function (booking) {

                return createRequestCard(
                    booking
                );
            }
        ).join("");


    /*
     * IMPORTANT:
     *
     * The cards were created dynamically,
     * so the old event listeners do not exist.
     *
     * Initialize them again.
     */

    initJobRequestActions();
}


/* ==========================================================================
   CREATE REQUEST CARD
   ========================================================================== */

function createRequestCard(booking) {

    const customer =
        booking.customer_email ||
        "Customer";


    const service =
        booking.service_name ||
        "Service";


    const price =
        Number(
            booking.total_price || 0
        );


    const address =
        booking.address ||
        "Address not provided";


    const date =
        formatDisplayDate(
            booking.booking_date
        );


    const time =
        formatDisplayTime(
            booking.booking_time
        );


    const avatarLetter =
        customer.charAt(0).toUpperCase();


    return `
        <div
            class="request-card"
            data-booking-id="${booking.id}"
        >

            <div class="request-top">

                <div class="req-avatar">
                    ${escapeHtml(avatarLetter)}
                </div>

                <div class="req-customer">

                    <strong>
                        ${escapeHtml(customer)}
                    </strong>

                    <span>
                        ${escapeHtml(service)}
                    </span>

                </div>

                <div class="req-price">
                    Rs. ${formatNumber(price, 0)}
                </div>

            </div>


            <div class="req-details">

                <div>
                    <i class="fa-solid fa-location-dot"></i>
                    ${escapeHtml(address)}
                </div>

                <div>
                    <i class="fa-regular fa-calendar"></i>
                    ${escapeHtml(date)}
                </div>

                <div>
                    <i class="fa-regular fa-clock"></i>
                    ${escapeHtml(time)}
                </div>

            </div>


            ${
                booking.note
                    ? `
                        <div class="mt-2 small text-muted">
                            <i class="fa-regular fa-note-sticky"></i>
                            ${escapeHtml(booking.note)}
                        </div>
                    `
                    : ""
            }


            <div class="req-actions">

                <button
                    type="button"
                    class="btn-oc-success btn-sm ripple accept-btn"
                    data-booking-id="${booking.id}"
                >
                    <i class="fa-solid fa-check"></i>
                    Accept
                </button>

                <button
                    type="button"
                    class="btn-oc-danger-outline btn-sm ripple reject-btn"
                    data-booking-id="${booking.id}"
                >
                    <i class="fa-solid fa-xmark"></i>
                    Reject
                </button>

            </div>

        </div>
    `;
}


/* ==========================================================================
   RENDER TODAY'S SCHEDULE
   ========================================================================== */

function renderTodaySchedule(bookings) {

    const timeline =
        document.querySelector(
            ".timeline"
        );


    if (!timeline) {
        return;
    }


    const today =
        getTodayDateString();


    /*
     * Accepted and completed bookings
     * scheduled for today.
     */

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

                    return (
                        String(a.booking_time)
                            .localeCompare(
                                String(b.booking_time)
                            )
                    );
                }
            );


    if (todayBookings.length === 0) {

        timeline.innerHTML = `
            <div class="timeline-item">

                <div class="timeline-card">

                    <strong>
                        No jobs scheduled for today
                    </strong>

                    <p class="mb-0 text-muted">
                        Your accepted jobs will appear here.
                    </p>

                </div>

            </div>
        `;

        return;
    }


    timeline.innerHTML =
        todayBookings.map(
            function (booking) {

                return createTimelineItem(
                    booking
                );
            }
        ).join("");
}


/* ==========================================================================
   CREATE TIMELINE ITEM
   ========================================================================== */

function createTimelineItem(booking) {

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


    if (booking.status === "completed") {

        statusClass =
            "status-completed";

        statusText =
            "Completed";

    } else if (
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

                <div class="d-flex justify-content-between align-items-start">

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

                    <span class="status-pill ${statusClass}">
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
        return;
    }


    const today =
        getTodayDateString();


    /*
     * Find accepted job for today.
     */

    const currentJob =
        bookings
            .filter(
                function (booking) {

                    return (
                        booking.booking_date === today &&
                        booking.status === "accepted"
                    );
                }
            )
            .sort(
                function (a, b) {

                    return (
                        String(a.booking_time)
                            .localeCompare(
                                String(b.booking_time)
                            )
                    );
                }
            )[0];


    /*
     * If there is no current job,
     * keep the dashboard clean.
     */

    if (!currentJob) {

        const customer =
            panel.querySelector(
                ".current-job-customer"
            );


        const service =
            panel.querySelector(
                ".current-job-service"
            );


        if (customer) {
            customer.textContent =
                "No active job";
        }


        if (service) {
            service.textContent =
                "No accepted job scheduled for today.";
        }


        return;
    }


    /*
     * Try to update existing HTML elements.
     */

    const customerElement =
        panel.querySelector(
            ".current-job-customer"
        );


    const serviceElement =
        panel.querySelector(
            ".current-job-service"
        );


    if (customerElement) {

        customerElement.textContent =
            currentJob.customer_email ||
            "Customer";
    }


    if (serviceElement) {

        serviceElement.textContent =
            currentJob.service_name ||
            "Service";
    }


    /*
     * Add booking ID to panel so
     * Complete Job can use it later.
     */

    panel.dataset.bookingId =
        currentJob.id;
}


/* ==========================================================================
   SIDEBAR TOGGLE
   ========================================================================== */

function initSidebarToggle() {

    const appShell =
        document.querySelector(".app-shell");

    const menuToggle =
        document.getElementById("menuToggle");

    const sidebarClose =
        document.getElementById("sidebarClose");

    const overlay =
        document.getElementById("sidebarOverlay");


    if (!appShell || !menuToggle) {
        return;
    }


    function isMobile() {

        return window.innerWidth <= 992;
    }


    menuToggle.addEventListener(
        "click",
        function () {

            if (isMobile()) {

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

            if (!isMobile()) {

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


            if (!link) return;


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


    dropdowns.forEach(
        function (dropdown) {

            const trigger =
                dropdown.querySelector(
                    ".icon-btn, .profile-trigger"
                );


            if (!trigger) return;


            trigger.addEventListener(
                "click",
                function (e) {

                    e.stopPropagation();


                    const isOpen =
                        dropdown.classList.contains(
                            "open"
                        );


                    dropdowns.forEach(
                        function (d) {

                            d.classList.remove(
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
                function (d) {

                    d.classList.remove(
                        "open"
                    );
                }
            );
        }
    );
}


/* ==========================================================================
   ONLINE / OFFLINE TOGGLE
   ========================================================================== */

function initOnlineToggle() {

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


    if (!toggle || !wrap || !label) {
        return;
    }


    toggle.addEventListener(
        "change",
        async function () {

            if (toggle.checked) {

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


            /*
             * Backend update is not done yet.
             *
             * We will connect this to the Provider
             * PATCH endpoint after confirming how
             * ProviderProfile is updated.
             */

            console.log(
                "Availability changed:",
                toggle.checked
            );
        }
    );
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


    if (!availableToday || !unavailable) {
        return;
    }


    availableToday.addEventListener(
        "change",
        function () {

            if (availableToday.checked) {

                unavailable.checked =
                    false;
            }
        }
    );


    unavailable.addEventListener(
        "change",
        function () {

            if (unavailable.checked) {

                availableToday.checked =
                    false;
            }
        }
    );
}


/* ==========================================================================
   ANIMATED COUNTERS
   ========================================================================== */

function initAnimatedCounters() {

    const counters =
        document.querySelectorAll(
            ".stat-value[data-count]"
        );


    if (!counters.length) {
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

                            animateCounter(
                                entry.target
                            );

                            observer.unobserve(
                                entry.target
                            );
                        }
                    }
                );

            },
            {
                threshold: 0.4
            }
        );


    counters.forEach(
        function (counter) {

            observer.observe(counter);
        }
    );
}


function animateCounter(el) {

    const target =
        parseFloat(
            el.getAttribute(
                "data-count"
            )
        );


    const prefix =
        el.getAttribute(
            "data-prefix"
        ) || "";


    const suffix =
        el.getAttribute(
            "data-suffix"
        ) || "";


    const decimals =
        parseInt(
            el.getAttribute(
                "data-decimal"
            ) || "0",
            10
        );


    const duration =
        1400;


    const start =
        performance.now();


    function tick(now) {

        const progress =
            Math.min(
                (now - start) / duration,
                1
            );


        const eased =
            1 -
            Math.pow(
                1 - progress,
                3
            );


        const current =
            target * eased;


        el.textContent =
            prefix +
            formatNumber(
                current,
                decimals
            ) +
            suffix;


        if (progress < 1) {

            requestAnimationFrame(
                tick
            );

        } else {

            el.textContent =
                prefix +
                formatNumber(
                    target,
                    decimals
                ) +
                suffix;
        }
    }


    requestAnimationFrame(
        tick
    );
}


function formatNumber(
    value,
    decimals
) {

    if (decimals > 0) {

        return Number(value).toFixed(
            decimals
        );
    }


    return Math.round(
        value
    ).toLocaleString(
        "en-IN"
    );
}


/* ==========================================================================
   PROGRESS BAR
   ========================================================================== */

function initProgressBars() {

    const bar =
        document.querySelector(
            ".oc-progress-bar"
        );


    if (!bar) return;


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


/* ==========================================================================
   RADIAL PROGRESS
   ========================================================================== */

function initRadialProgress() {

    const radials =
        document.querySelectorAll(
            ".radial-progress"
        );


    if (!radials.length) return;


    const circumference =
        2 * Math.PI * 52;


    const observer =
        new IntersectionObserver(
            function (entries) {

                entries.forEach(
                    function (entry) {

                        if (
                            !entry.isIntersecting
                        ) {
                            return;
                        }


                        const el =
                            entry.target;


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

                            const offset =
                                circumference -
                                (
                                    percent / 100
                                ) *
                                circumference;


                            requestAnimationFrame(
                                function () {

                                    bar.style.strokeDashoffset =
                                        offset;
                                }
                            );
                        }


                        observer.unobserve(
                            el
                        );
                    }
                );

            },
            {
                threshold: 0.4
            }
        );


    radials.forEach(
        function (el) {

            observer.observe(el);
        }
    );
}


/* ==========================================================================
   EARNINGS CHART
   ========================================================================== */

function initEarningsChart() {

    const bars =
        document.querySelectorAll(
            ".mini-bar-chart .bar"
        );


    if (!bars.length) return;


    const observer =
        new IntersectionObserver(
            function (entries) {

                entries.forEach(
                    function (entry) {

                        if (
                            !entry.isIntersecting
                        ) {
                            return;
                        }


                        const el =
                            entry.target;


                        const val =
                            getComputedStyle(
                                el
                            )
                            .getPropertyValue(
                                "--val"
                            )
                            .trim();


                        requestAnimationFrame(
                            function () {

                                el.style.height =
                                    val;
                            }
                        );


                        observer.unobserve(
                            el
                        );
                    }
                );

            },
            {
                threshold: 0.3
            }
        );


    bars.forEach(
        function (bar) {

            observer.observe(bar);
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


                    circle.classList.add(
                        "ripple-circle"
                    );


                    circle.style.width =
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
        function (btn) {

            btn.addEventListener(
                "click",
                async function () {

                    const bookingId =
                        btn.getAttribute(
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
                        btn
                    );
                }
            );
        }
    );


    rejectButtons.forEach(
        function (btn) {

            btn.addEventListener(
                "click",
                async function () {

                    const bookingId =
                        btn.getAttribute(
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
                        btn
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


    /*
     * Prevent multiple clicks.
     */

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
                        status: newStatus
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                `Booking update failed: ${response.status}`
            );
        }


        console.log(
            "Booking updated:",
            data
        );


        /*
         * Reload the dashboard so all statistics,
         * requests and schedules become accurate.
         */

        await loadProviderDashboard();


    } catch (error) {

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


    if (!searchInput) return;


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
        function (e) {

            if (e.key === "Enter") {

                e.preventDefault();

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


    if (!backToTopBtn) return;


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


    if (Number.isNaN(date.getTime())) {
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


    if (parts.length < 2) {
        return timeString;
    }


    let hours =
        Number(parts[0]);


    const minutes =
        parts[1];


    const period =
        hours >= 12
            ? "PM"
            : "AM";


    hours =
        hours % 12 || 12;


    return `${hours}:${minutes} ${period}`;
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


    if (!element) return;


    element.textContent =
        value ?? "";
}


/* ==========================================================================
   ERROR MESSAGE
   ========================================================================== */

function showDashboardError() {

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


    console.warn(
        "Provider dashboard could not load backend data."
    );
}


/* ==========================================================================
   HTML ESCAPE
   ========================================================================== */

function escapeHtml(value) {

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