/* ==========================================================
   ONECLICK — BOOKING HISTORY
   Real Django REST API Integration
   ========================================================== */

const API_BASE = "http://127.0.0.1:8000/api";

let bookings = [];
let currentUser = null;

let currentPage = 1;
const itemsPerPage = 6;


/* ==========================================================
   PAGE INITIALIZATION
   ========================================================== */

document.addEventListener("DOMContentLoaded", function () {
    console.log("=================================");
    console.log("ONECLICK BOOKING HISTORY");
    console.log("=================================");

    initializePage();
});


async function initializePage() {
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
        console.warn("No access token found.");
        window.location.href = "login.html";
        return;
    }

    try {
        await loadCurrentUser();
        await loadBookings();

        setupFilters();
        setupPagination();
        setupSidebar();
        setupTooltips();
        setupRippleEffect();
        setupBookingActions();

    } catch (error) {
        console.error(
            "Booking history initialization failed:",
            error
        );

        showError(
            "Unable to load your bookings. Please refresh the page."
        );
    }
}


/* ==========================================================
   API HELPER
   ========================================================== */

async function apiRequest(endpoint, options = {}) {

    const token =
        localStorage.getItem("access_token");

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization =
            `Bearer ${token}`;
    }

    const response =
        await fetch(
            `${API_BASE}${endpoint}`,
            {
                ...options,
                headers
            }
        );

    if (response.status === 401) {

        console.warn(
            "Access token expired or invalid."
        );

        localStorage.removeItem(
            "access_token"
        );

        localStorage.removeItem(
            "refresh_token"
        );

        window.location.href =
            "login.html";

        throw new Error(
            "Authentication expired."
        );
    }

    return response;
}


/* ==========================================================
   LOAD CURRENT USER
   ========================================================== */

async function loadCurrentUser() {

    const response =
        await apiRequest("/users/me/");

    if (!response.ok) {
        throw new Error(
            "Unable to load current user."
        );
    }

    currentUser =
        await response.json();

    console.log(
        "CURRENT USER:",
        currentUser
    );
}


/* ==========================================================
   LOAD BOOKINGS
   ========================================================== */

async function loadBookings() {

    const response =
        await apiRequest("/bookings/");

    console.log(
        "Bookings API status:",
        response.status
    );

    if (!response.ok) {

        let errorMessage =
            "Unable to load bookings.";

        try {

            const errorData =
                await response.json();

            errorMessage =
                errorData.detail ||
                errorData.error ||
                errorMessage;

        } catch (error) {

            console.warn(
                "Could not read booking API error."
            );
        }

        throw new Error(
            errorMessage
        );
    }

    const data =
        await response.json();

    /*
     * Supports:
     *
     * [
     *   {...}
     * ]
     *
     * and:
     *
     * {
     *   results: [...]
     * }
     */

    if (Array.isArray(data)) {

        bookings = data;

    } else if (
        data &&
        Array.isArray(data.results)
    ) {

        bookings =
            data.results;

    } else {

        bookings = [];
    }


    console.log(
        "REAL BOOKINGS:",
        bookings
    );


    /*
     * Newest bookings first.
     */

    bookings.sort(
        function (a, b) {

            const dateA =
                new Date(
                    a.created_at || 0
                );

            const dateB =
                new Date(
                    b.created_at || 0
                );

            return dateB - dateA;
        }
    );


    updateSummaryCards();
    applyFilters();
}


/* ==========================================================
   STATUS META
   ========================================================== */

const statusMeta = {

    pending: {
        label: "Pending",
        cls: "status-pending"
    },

    accepted: {
        label: "Accepted",
        cls: "status-accepted"
    },

    

    completed: {
        label: "Completed",
        cls: "status-completed"
    },

    cancelled: {
        label: "Cancelled",
        cls: "status-cancelled"
    },

    canceled: {
        label: "Cancelled",
        cls: "status-cancelled"
    },

    rejected: {
        label: "Rejected",
        cls: "status-cancelled"
    }
};


function normalizeStatus(status) {

    return String(
        status || "pending"
    )
        .trim()
        .toLowerCase()
        .replace(
            /\s+/g,
            "_"
        );
}


function getStatusMeta(status) {

    const normalized =
        normalizeStatus(status);

    return (
        statusMeta[normalized] ||
        statusMeta[
            normalized.replace(
                /_/g,
                "-"
            )
        ] ||
        statusMeta.pending
    );
}


/* ==========================================================
   FORMAT CURRENCY
   ========================================================== */

function formatCurrency(amount) {

    const number =
        Number(amount || 0);

    return (
        "Rs. " +
        number.toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )
    );
}


/* ==========================================================
   FORMAT DATE
   ========================================================== */

function formatDate(dateString) {

    if (!dateString) {
        return "Not specified";
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


/* ==========================================================
   FORMAT TIME
   ========================================================== */

function formatTime(timeString) {

    if (!timeString) {
        return "Not specified";
    }

    const parts =
        String(timeString).split(":");

    if (parts.length < 2) {
        return timeString;
    }

    let hours =
        parseInt(
            parts[0],
            10
        );

    const minutes =
        parts[1];

    if (Number.isNaN(hours)) {
        return timeString;
    }

    const period =
        hours >= 12
            ? "PM"
            : "AM";

    hours =
        hours % 12 || 12;

    return `${hours}:${minutes} ${period}`;
}


/* ==========================================================
   PROVIDER IMAGE
   ========================================================== */

function getProviderImage(booking) {

    let image =
        booking.provider_image ||
        booking.provider_profile_image ||
        booking.provider?.image ||
        booking.provider?.profile_image;


    if (!image) {

        return avatarFor(
            booking.provider_name ||
            booking.provider?.full_name ||
            "Provider"
        );
    }


    if (
        String(image).startsWith("/")
    ) {

        image =
            `http://127.0.0.1:8000${image}`;
    }


    return image;
}


/* ==========================================================
   FALLBACK AVATAR
   ========================================================== */

function avatarFor(name) {

    return (
        "https://ui-avatars.com/api/" +
        `?name=${encodeURIComponent(name)}` +
        "&background=2563EB" +
        "&color=fff" +
        "&size=128"
    );
}


/* ==========================================================
   SAFE HTML
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
   SUMMARY STATISTICS
   ========================================================== */

function updateSummaryCards() {

    const upcomingCount =
        bookings.filter(
            function (booking) {

                const status =
                    normalizeStatus(
                        booking.status
                    );

               return (
    status === "pending" ||
    status === "accepted"
);
            }
        ).length;


    const completedCount =
        bookings.filter(
            function (booking) {

                return (
                    normalizeStatus(
                        booking.status
                    ) === "completed"
                );
            }
        ).length;


    const cancelledCount =
        bookings.filter(
            function (booking) {

                const status =
                    normalizeStatus(
                        booking.status
                    );

                return (
                    status === "cancelled" ||
                    status === "canceled" ||
                    status === "rejected"
                );
            }
        ).length;


    const totalSpent =
        bookings
            .filter(
                function (booking) {

                    return (
                        normalizeStatus(
                            booking.status
                        ) === "completed"
                    );
                }
            )
            .reduce(
                function (
                    total,
                    booking
                ) {

                    return (
                        total +
                        Number(
                            booking.total_price ||
                            0
                        )
                    );
                },
                0
            );


    /*
     * Your HTML currently uses
     * .summary-value for these cards.
     */

    const counters =
        document.querySelectorAll(
            ".summary-value"
        );


    if (counters[0]) {
        counters[0].textContent =
            upcomingCount;
    }

    if (counters[1]) {
        counters[1].textContent =
            completedCount;
    }

    if (counters[2]) {
        counters[2].textContent =
            cancelledCount;
    }

    if (counters[3]) {
        counters[3].textContent =
            formatCurrency(
                totalSpent
            );
    }
}


/* ==========================================================
   BUILD ACTIONS
   ========================================================== */

function buildActions(booking) {

    const status =
        normalizeStatus(
            booking.status
        );

    const actions = [];


    /*
     * View Details
     */

    actions.push({
        label: "View Details",
        icon: "fa-solid fa-eye",
        cls: "btn-solid-outline",
        action: "view"
    });


    /*
     * Pending
     */

    if (
        status === "pending"
    ) {

        actions.push({
            label: "Cancel Booking",
            icon: "fa-solid fa-xmark",
            cls: "btn-solid-danger",
            action: "cancel"
        });
    }


    

    if (
        status === "completed"
    ) {

        actions.push({
            label: "Book Again",
            icon: "fa-solid fa-rotate",
            cls: "btn-solid-primary",
            action: "rebook"
        });


        actions.push({
            label: "Leave Review",
            icon: "fa-solid fa-star",
            cls: "btn-solid-accent",
            action: "review"
        });

actions.push({
    label: "Report Issue",
    icon: "fa-solid fa-flag",
    cls: "btn-solid-danger",
    action: "report"
});
       
    }


    /*
     * Cancelled / Rejected
     */

    if (
        status === "cancelled" ||
        status === "canceled" ||
        status === "rejected"
    ) {

        actions.push({
            label: "Rebook",
            icon: "fa-solid fa-rotate",
            cls: "btn-solid-primary",
            action: "rebook"
        });
    }


    return actions;
}


/* ==========================================================
   RENDER BOOKING CARD
   ========================================================== */

function renderCard(
    booking,
    index
) {

    const status =
        normalizeStatus(
            booking.status
        );

    const meta =
        getStatusMeta(status);


    const providerName =
        booking.provider_name ||
        booking.provider?.full_name ||
        booking.provider?.name ||
        "Provider";


    const serviceName =
        booking.service_name ||
        booking.service?.name ||
        "Service";


    const category =
        booking.service_category ||
        booking.service?.category ||
        "Service";


    const address =
        booking.address ||
        "Address not provided";


    const actions =
        buildActions(booking);


    const actionsHtml =
        actions
            .map(
                function (action) {

                    return `
                        <button
                            type="button"
                            class="btn btn-ripple ${action.cls}"
                            data-action="${action.action}"
                            data-id="${escapeHtml(booking.id)}"
                        >
                            <i class="${action.icon}"></i>
                            ${action.label}
                        </button>
                    `;
                }
            )
            .join("");


    const bookingId =
        `#OC-${String(
            booking.id
        ).padStart(
            5,
            "0"
        )}`;


    return `
        <article
            class="booking-card"
            style="animation-delay:${index * 0.06}s"
            data-status="${escapeHtml(status)}"
            data-id="${escapeHtml(booking.id)}"
            data-provider="${escapeHtml(providerName.toLowerCase())}"
            data-category="${escapeHtml(category.toLowerCase())}"
            data-location="${escapeHtml(address.toLowerCase())}"
        >

            <div class="booking-card-top">

                <img
                    src="${escapeHtml(getProviderImage(booking))}"
                    alt="${escapeHtml(providerName)}"
                    class="booking-avatar"
                    onerror="this.onerror=null;this.src='${avatarFor(providerName)}';"
                >

                <div>

                    <h4 class="booking-provider-name">
                        ${escapeHtml(providerName)}
                    </h4>

                    <p class="booking-provider-profession">
                        ${escapeHtml(category)}
                    </p>

                    <span class="booking-id-tag">
                        ${bookingId}
                    </span>

                </div>

                <span class="status-badge ${meta.cls}">
                    ${meta.label}
                </span>

            </div>


            <div class="booking-card-body">

                <div class="booking-meta-item">

                    <span class="meta-label">
                        <i class="fa-solid fa-tag"></i>
                        Service
                    </span>

                    <span class="meta-value">
                        ${escapeHtml(serviceName)}
                    </span>

                </div>


                <div class="booking-meta-item">

                    <span class="meta-label">
                        <i class="fa-solid fa-location-dot"></i>
                        Location
                    </span>

                    <span class="meta-value">
                        ${escapeHtml(address)}
                    </span>

                </div>


                <div class="booking-meta-item">

                    <span class="meta-label">
                        <i class="fa-regular fa-calendar"></i>
                        Date
                    </span>

                    <span class="meta-value">
                        ${formatDate(
                            booking.booking_date
                        )}
                    </span>

                </div>


                <div class="booking-meta-item">

                    <span class="meta-label">
                        <i class="fa-regular fa-clock"></i>
                        Time
                    </span>

                    <span class="meta-value">
                        ${formatTime(
                            booking.booking_time
                        )}
                    </span>

                </div>

            </div>


            <div class="booking-card-footer">

                <div class="booking-amount">

                    ${formatCurrency(
                        booking.total_price
                    )}

                    <span>
                        Total booking amount
                    </span>

                </div>


                <div class="booking-actions">
                    ${actionsHtml}
                </div>

            </div>

        </article>
    `;
}


/* ==========================================================
   PAGINATION
   ========================================================== */

function getPaginatedBookings(list) {

    const start =
        (
            currentPage - 1
        ) *
        itemsPerPage;


    const end =
        start +
        itemsPerPage;


    return list.slice(
        start,
        end
    );
}


function updatePagination(
    totalPages
) {

    const pagination =
        document.getElementById(
            "bookingPagination"
        );


    if (!pagination) {
        return;
    }


    const paginationList =
        pagination.querySelector("ul") ||
        pagination;


    if (totalPages <= 1) {

        pagination.classList.add(
            "d-none"
        );

        return;
    }


    pagination.classList.remove(
        "d-none"
    );


    let html = `
        <li
            class="page-item ${currentPage === 1 ? "disabled" : ""}"
        >
            <a
                href="#"
                class="page-link"
                data-page-action="prev"
                aria-label="Previous"
            >
                <i class="fa-solid fa-chevron-left"></i>
            </a>
        </li>
    `;


    for (
        let page = 1;
        page <= totalPages;
        page++
    ) {

        html += `
            <li
                class="page-item ${page === currentPage ? "active" : ""}"
            >
                <a
                    href="#"
                    class="page-link"
                    data-page="${page}"
                >
                    ${page}
                </a>
            </li>
        `;
    }


    html += `
        <li
            class="page-item ${currentPage >= totalPages ? "disabled" : ""}"
        >
            <a
                href="#"
                class="page-link"
                data-page-action="next"
                aria-label="Next"
            >
                <i class="fa-solid fa-chevron-right"></i>
            </a>
        </li>
    `;


    paginationList.innerHTML =
        html;
}


/* ==========================================================
   RENDER BOOKINGS
   ========================================================== */

function renderBookings(list) {

    const bookingGrid =
        document.getElementById(
            "bookingGrid"
        );


    const emptyState =
        document.getElementById(
            "emptyState"
        );


    const paginationNav =
        document.getElementById(
            "bookingPagination"
        );


    if (!bookingGrid) {
        return;
    }


    /*
     * No bookings.
     */

    if (
        list.length === 0
    ) {

        bookingGrid.innerHTML =
            "";

        bookingGrid.classList.add(
            "d-none"
        );


        if (emptyState) {

            emptyState.classList.remove(
                "d-none"
            );
        }


        if (paginationNav) {

            paginationNav.classList.add(
                "d-none"
            );
        }


        return;
    }


    /*
     * Bookings exist.
     */

    bookingGrid.classList.remove(
        "d-none"
    );


    if (emptyState) {

        emptyState.classList.add(
            "d-none"
        );
    }


    const totalPages =
        Math.ceil(
            list.length /
            itemsPerPage
        );


    if (
        currentPage >
        totalPages
    ) {

        currentPage =
            totalPages;
    }


    const pageBookings =
        getPaginatedBookings(
            list
        );


    bookingGrid.innerHTML =
        pageBookings
            .map(
                function (
                    booking,
                    index
                ) {

                    return renderCard(
                        booking,
                        index
                    );
                }
            )
            .join("");


    updatePagination(
        totalPages
    );
}


/* ==========================================================
   FILTER BOOKINGS
   ========================================================== */

function getFilteredBookings() {

    const searchInput =
        document.getElementById(
            "searchInput"
        );


    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    const dateFilter =
        document.getElementById(
            "dateFilter"
        );


    const query =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "all";


    const selectedDate =
        dateFilter
            ? dateFilter.value
            : "all";


    let filtered =
        bookings.filter(
            function (booking) {

                const provider =
                    String(
                        booking.provider_name ||
                        booking.provider?.full_name ||
                        booking.provider?.name ||
                        ""
                    ).toLowerCase();


                const service =
                    String(
                        booking.service_name ||
                        booking.service?.name ||
                        ""
                    ).toLowerCase();


                const category =
                    String(
                        booking.service_category ||
                        booking.service?.category ||
                        ""
                    ).toLowerCase();


                const address =
                    String(
                        booking.address ||
                        ""
                    ).toLowerCase();


                const id =
                    String(
                        booking.id ||
                        ""
                    ).toLowerCase();


                const formattedId =
                    `oc-${String(
                        booking.id || ""
                    ).padStart(
                        5,
                        "0"
                    )}`.toLowerCase();


                const matchesSearch =
                    !query ||
                    id.includes(query) ||
                    formattedId.includes(query) ||
                    provider.includes(query) ||
                    service.includes(query) ||
                    category.includes(query) ||
                    address.includes(query);


                const bookingStatus =
                    normalizeStatus(
                        booking.status
                    );


                let matchesStatus =
                    true;


                if (
                    selectedStatus ===
                    "upcoming"
                ) {

                    matchesStatus =
                        bookingStatus === "pending" ||
                        bookingStatus === "accepted" ||
                        bookingStatus === "ontheway" ||
                        bookingStatus === "on_the_way" ||
                        bookingStatus === "on-the-way";

                } else if (
                    selectedStatus !== "all"
                ) {

                    matchesStatus =
                        bookingStatus ===
                        normalizeStatus(
                            selectedStatus
                        );
                }


                return (
                    matchesSearch &&
                    matchesStatus
                );
            }
        );


    /*
     * Date filter.
     */

    const today =
        new Date();


    if (
        selectedDate ===
        "week"
    ) {

        const sevenDaysAgo =
            new Date(today);


        sevenDaysAgo.setDate(
            today.getDate() - 7
        );


        filtered =
            filtered.filter(
                function (booking) {

                    if (
                        !booking.booking_date
                    ) {
                        return false;
                    }


                    const date =
                        new Date(
                            `${booking.booking_date}T00:00:00`
                        );


                    return (
                        date >=
                        sevenDaysAgo
                    );
                }
            );
    }


    if (
        selectedDate ===
        "month"
    ) {

        const currentMonth =
            today.getMonth();


        const currentYear =
            today.getFullYear();


        filtered =
            filtered.filter(
                function (booking) {

                    if (
                        !booking.booking_date
                    ) {
                        return false;
                    }


                    const date =
                        new Date(
                            `${booking.booking_date}T00:00:00`
                        );


                    return (
                        date.getMonth() ===
                            currentMonth &&
                        date.getFullYear() ===
                            currentYear
                    );
                }
            );
    }


    /*
     * Sort newest first.
     */

    filtered.sort(
        function (a, b) {

            const dateA =
                new Date(
                    `${a.booking_date || "1970-01-01"}T${a.booking_time || "00:00:00"}`
                );


            const dateB =
                new Date(
                    `${b.booking_date || "1970-01-01"}T${b.booking_time || "00:00:00"}`
                );


            if (
                selectedDate ===
                "oldest"
            ) {

                return dateA - dateB;
            }


            return dateB - dateA;
        }
    );


    return filtered;
}


/* ==========================================================
   APPLY FILTERS
   ========================================================== */

function applyFilters() {

    currentPage = 1;

    const filtered =
        getFilteredBookings();

    renderBookings(
        filtered
    );
}


/* ==========================================================
   FILTER EVENTS
   ========================================================== */

function setupFilters() {

    const searchInput =
        document.getElementById(
            "searchInput"
        );


    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    const dateFilter =
        document.getElementById(
            "dateFilter"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            applyFilters
        );
    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            applyFilters
        );
    }


    if (dateFilter) {

        dateFilter.addEventListener(
            "change",
            applyFilters
        );
    }
}


/* ==========================================================
   PAGINATION EVENTS
   ========================================================== */

function setupPagination() {

    const pagination =
        document.getElementById(
            "bookingPagination"
        );


    if (!pagination) {
        return;
    }


    pagination.addEventListener(
        "click",
        function (event) {

            const pageLink =
                event.target.closest(
                    ".page-link"
                );


            if (!pageLink) {
                return;
            }


            event.preventDefault();


            const action =
                pageLink.dataset.pageAction;


            if (
                action ===
                "prev"
            ) {

                if (
                    currentPage >
                    1
                ) {

                    currentPage--;

                    rerenderCurrentFilters();

                    scrollToBookings();
                }

                return;
            }


            if (
                action ===
                "next"
            ) {

                const filtered =
                    getFilteredBookings();


                const totalPages =
                    Math.ceil(
                        filtered.length /
                        itemsPerPage
                    );


                if (
                    currentPage <
                    totalPages
                ) {

                    currentPage++;

                    rerenderCurrentFilters();

                    scrollToBookings();
                }

                return;
            }


            const page =
                parseInt(
                    pageLink.dataset.page,
                    10
                );


            if (
                !Number.isNaN(page)
            ) {

                currentPage =
                    page;

                rerenderCurrentFilters();

                scrollToBookings();
            }
        }
    );
}


/* ==========================================================
   RERENDER
   ========================================================== */

function rerenderCurrentFilters() {

    const filtered =
        getFilteredBookings();

    renderBookings(
        filtered
    );
}


/* ==========================================================
   SCROLL TO BOOKINGS
   ========================================================== */

function scrollToBookings() {

    const bookingGrid =
        document.getElementById(
            "bookingGrid"
        );


    if (!bookingGrid) {
        return;
    }


    bookingGrid.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


/* ==========================================================
   BOOKING ACTIONS
   ========================================================== */

function setupBookingActions() {

    const bookingGrid =
        document.getElementById(
            "bookingGrid"
        );


    if (!bookingGrid) {
        return;
    }


    bookingGrid.addEventListener(
        "click",
        async function (event) {

            const button =
                event.target.closest(
                    "[data-action]"
                );


            if (!button) {
                return;
            }


            const action =
                button.dataset.action;


            const id =
                button.dataset.id;


            const booking =
                bookings.find(
                    function (item) {

                        return (
                            String(
                                item.id
                            ) ===
                            String(id)
                        );
                    }
                );


            if (!booking) {

                console.warn(
                    "Booking not found:",
                    id
                );

                return;
            }


            switch (action) {

                case "view":

                    openBookingDetails(
                        booking
                    );

                    break;


                case "cancel":

                    await cancelBooking(
                        booking
                    );

                    break;


                case "rebook":

                    rebookService(
                        booking
                    );

                    break;


                case "review":

                    window.location.href =
                        `review.html?booking=${encodeURIComponent(booking.id)}`;

                    break;


               case "report":

    window.location.href =
        `report-issue.html?booking=${encodeURIComponent(booking.id)}`;

    break;
            }
        }
    );
}


/* ==========================================================
   OPEN BOOKING DETAILS
   ========================================================== */

function openBookingDetails(
    booking
) {

    if (
        !booking ||
        !booking.id
    ) {

        alert(
            "Booking ID is unavailable."
        );

        return;
    }


    const bookingId =
        encodeURIComponent(
            booking.id
        );


    /*
     * IMPORTANT:
     * The booking ID is explicitly added
     * to the URL.
     */

    window.location.href =
        `booking-details.html?id=${bookingId}`;
}


/* ==========================================================
   CANCEL BOOKING
   ========================================================== */

async function cancelBooking(
    booking
) {

    const status =
        normalizeStatus(
            booking.status
        );


    if (
        status !== "pending" &&
        status !== "accepted"
    ) {

        alert(
            "This booking cannot be cancelled."
        );

        return;
    }


    const providerName =
        booking.provider_name ||
        booking.provider?.full_name ||
        "this provider";


    const confirmed =
        confirm(
            `Cancel booking #OC-${String(
                booking.id
            ).padStart(
                5,
                "0"
            )} with ${providerName}?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await apiRequest(
                `/bookings/${booking.id}/`,
                {
                    method: "PATCH",

                    body:
                        JSON.stringify({
                            status:
                                "cancelled"
                        })
                }
            );


        let data = {};


        try {

            data =
                await response.json();

        } catch (error) {

            console.warn(
                "No JSON response received."
            );
        }


        if (!response.ok) {

            console.error(
                "Cancel booking error:",
                data
            );


            alert(
                data.error ||
                data.detail ||
                "Unable to cancel booking."
            );


            return;
        }


        console.log(
            "BOOKING CANCELLED:",
            data
        );


        /*
         * Update local booking.
         */

        const index =
            bookings.findIndex(
                function (item) {

                    return (
                        String(
                            item.id
                        ) ===
                        String(
                            booking.id
                        )
                    );
                }
            );


        if (
            index !== -1
        ) {

            bookings[index] =
                (
                    data &&
                    typeof data === "object" &&
                    Object.keys(data).length
                )
                    ? data
                    : {
                        ...bookings[index],
                        status:
                            "cancelled"
                    };
        }


        updateSummaryCards();

        applyFilters();


        alert(
            "Booking cancelled successfully."
        );

    } catch (error) {

        console.error(
            "Cancel booking failed:",
            error
        );


        alert(
            "Something went wrong while cancelling the booking."
        );
    }
}


/* ==========================================================
   REBOOK
   ========================================================== */

function rebookService(
    booking
) {

    const params =
        new URLSearchParams();


   

    if (
        booking.service
    ) {

        params.set(
            "service-id",
            booking.service
        );
    }


    if (
        booking.provider
    ) {

        params.set(
            "provider-id",
            booking.provider
        );
    }


    const query =
        params.toString();


    window.location.href =
        query
            ? `booking.html?${query}`
            : "booking.html";
}


/* ==========================================================
   MOBILE SIDEBAR
   ========================================================== */

function setupSidebar() {

    const sidebar =
        document.getElementById(
            "oneclickSidebar"
        );


    const backdrop =
        document.getElementById(
            "sidebarBackdrop"
        );


    const toggleButton =
        document.getElementById(
            "sidebarToggleBtn"
        );


    if (
        !sidebar ||
        !backdrop ||
        !toggleButton
    ) {

        return;
    }


    function toggleSidebar(
        show
    ) {

        sidebar.classList.toggle(
            "show",
            show
        );


        backdrop.classList.toggle(
            "show",
            show
        );
    }


    toggleButton.addEventListener(
        "click",
        function () {

            toggleSidebar(
                true
            );
        }
    );


    backdrop.addEventListener(
        "click",
        function () {

            toggleSidebar(
                false
            );
        }
    );
}


/* ==========================================================
   BOOTSTRAP TOOLTIPS
   ========================================================== */

function setupTooltips() {

    if (
        typeof bootstrap ===
            "undefined" ||
        !bootstrap.Tooltip
    ) {

        return;
    }


    const tooltipElements =
        document.querySelectorAll(
            '[data-bs-toggle="tooltip"]'
        );


    tooltipElements.forEach(
        function (element) {

            new bootstrap.Tooltip(
                element
            );
        }
    );
}


/* ==========================================================
   RIPPLE EFFECT
   ========================================================== */

function setupRippleEffect() {

    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    ".btn-ripple"
                );


            if (!button) {
                return;
            }


            const rect =
                button.getBoundingClientRect();


            const ripple =
                document.createElement(
                    "span"
                );


            const size =
                Math.max(
                    rect.width,
                    rect.height
                );


            ripple.className =
                "ripple-effect";


            ripple.style.width =
                `${size}px`;


            ripple.style.height =
                `${size}px`;


            ripple.style.left =
                `${event.clientX -
                    rect.left -
                    size / 2}px`;


            ripple.style.top =
                `${event.clientY -
                    rect.top -
                    size / 2}px`;


            button.appendChild(
                ripple
            );


            setTimeout(
                function () {

                    ripple.remove();

                },
                600
            );
        }
    );
}


/* ==========================================================
   ERROR DISPLAY
   ========================================================== */

function showError(
    message
) {

    const bookingGrid =
        document.getElementById(
            "bookingGrid"
        );


    const emptyState =
        document.getElementById(
            "emptyState"
        );


    if (!bookingGrid) {
        return;
    }


    bookingGrid.classList.remove(
        "d-none"
    );


    if (emptyState) {

        emptyState.classList.add(
            "d-none"
        );
    }


    bookingGrid.innerHTML = `
        <div
            class="alert alert-danger"
            role="alert"
        >
            <i class="fa-solid fa-circle-exclamation me-2"></i>
            ${escapeHtml(message)}
        </div>
    `;
}


/* ==========================================================
   LOGOUT
   ========================================================== */

function logout() {

    localStorage.removeItem(
        "access_token"
    );


    localStorage.removeItem(
        "refresh_token"
    );


    window.location.href =
        "login.html";
}


/* ==========================================================
   LOGOUT CLICK
   ========================================================== */

document.addEventListener(
    "click",
    function (event) {

        const logoutLink =
            event.target.closest(
                ".logout-link"
            );


        if (!logoutLink) {
            return;
        }


        event.preventDefault();

        logout();
    }
);


/* ==========================================================
   END OF FILE
   ========================================================== */