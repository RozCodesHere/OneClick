/* =========================================================
   ONECLICK — ADMIN DASHBOARD
   FINAL JAVASCRIPT
   REAL DATA MODE
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const API_BASE = "http://127.0.0.1:8000/api";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";


/* =========================================================
   GLOBAL DATA
========================================================= */

let currentAdmin = null;

let allUsers = [];
let allBookings = [];
let allProviders = [];
let allServices = [];
let allReviews = [];
let allSupportTickets = [];

let filteredBookings = [];

let sidebar = null;
let sidebarOverlay = null;


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("=================================");
    console.log("ONECLICK ADMIN DASHBOARD");
    console.log("REAL DATA MODE");
    console.log("=================================");

    initializeDashboard();

});


async function initializeDashboard() {

    try {

        setupUI();

        await loadCurrentAdmin();

      await Promise.all([
    loadUsers(),
    loadBookings(),
    loadProviders(),
    loadServices(),
    loadReviews(),
    loadSupportTickets()
]);

        calculateAndRenderStatistics();

        renderBookings();

        renderUsers();

        renderProviders();

        renderProviderApprovals();

        renderServices();

        renderReviews();

        renderPaymentSection();

        renderAnalytics();

        renderSystemStatus();

        renderNotifications();

        renderMessages();

        renderSupportTickets();

        renderPlatformActivity();

        renderAdminProfile();

        updateDashboardDate();

        updateBookingBadge();

        loadQuickNotes();

        console.log("=================================");
        console.log("ADMIN DASHBOARD READY");
        console.log("=================================");

    } catch (error) {

        console.error(
            "ADMIN DASHBOARD INITIALIZATION ERROR:",
            error
        );

        showGlobalError(
            "Unable to load the admin dashboard. Please check that the Django server is running."
        );

    }

}


/* =========================================================
   API REQUEST HELPER
========================================================= */

async function apiRequest(url, options = {}) {

    const token =
        localStorage.getItem(ACCESS_TOKEN_KEY);

    const requestOptions = {
        method: options.method || "GET",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    };


    if (token) {

        requestOptions.headers.Authorization =
            `Bearer ${token}`;

    }


    if (options.body !== undefined) {

        requestOptions.body =
            typeof options.body === "string"
                ? options.body
                : JSON.stringify(options.body);

    }


    const response =
        await fetch(
            `${API_BASE}${url}`,
            requestOptions
        );


    if (response.status === 401) {

        console.warn(
            "Authentication expired or unauthorized."
        );

        localStorage.removeItem(ACCESS_TOKEN_KEY);

        localStorage.removeItem(REFRESH_TOKEN_KEY);

        window.location.href = "login.html";

        throw new Error(
            "Unauthorized"
        );

    }


    let data = null;

    const contentType =
        response.headers.get("content-type") || "";


    if (contentType.includes("application/json")) {

        data = await response.json();

    } else {

        data = await response.text();

    }


    if (!response.ok) {

        let message =
            `API request failed (${response.status})`;

        if (data && typeof data === "object") {

            if (data.detail) {

                message = data.detail;

            } else {

                const firstKey =
                    Object.keys(data)[0];

                if (firstKey) {

                    const value =
                        data[firstKey];

                    message =
                        Array.isArray(value)
                            ? value.join(", ")
                            : String(value);

                }

            }

        }

        throw new Error(message);

    }


    return data;

}


/* =========================================================
   LOAD CURRENT ADMIN
========================================================= */

async function loadCurrentAdmin() {

    console.log("Loading current admin...");

    const data =
        await apiRequest("/users/me/");

    console.log("CURRENT ADMIN:", data);

    if (!data || data.role !== "admin") {

        alert(
            "Administrator access required."
        );

        window.location.href = "login.html";

        throw new Error(
            "Current user is not an administrator."
        );

    }

    currentAdmin = data;

}


/* =========================================================
   LOAD USERS
========================================================= */

async function loadUsers() {

    console.log("Loading users...");

    const data =
        await apiRequest("/users/admin/users/");


    allUsers =
        Array.isArray(data)
            ? data
            : Array.isArray(data.results)
                ? data.results
                : [];


    console.log(
        "REAL USERS:",
        allUsers
    );

}


/* =========================================================
   LOAD BOOKINGS
========================================================= */

async function loadBookings() {

    console.log("Loading bookings...");

    const data =
        await apiRequest("/users/admin/bookings/");


    allBookings =
        Array.isArray(data)
            ? data
            : Array.isArray(data.results)
                ? data.results
                : [];


    console.log(
        "REAL BOOKINGS:",
        allBookings
    );

}


/* =========================================================
   LOAD PROVIDERS
========================================================= */

async function loadProviders() {

    console.log("Loading providers...");

  const data =
    await apiRequest("/providers/admin/");


    allProviders =
        Array.isArray(data)
            ? data
            : Array.isArray(data.results)
                ? data.results
                : [];


    console.log(
        "REAL PROVIDERS:",
        allProviders
    );

}


/* =========================================================
   LOAD SERVICES
========================================================= */

async function loadServices() {

    console.log("Loading services...");

    const data =
        await apiRequest("/services/");


    allServices =
        Array.isArray(data)
            ? data
            : Array.isArray(data.results)
                ? data.results
                : [];


    console.log(
        "REAL SERVICES:",
        allServices
    );

}


/* =========================================================
   LOAD REVIEWS
========================================================= */

async function loadReviews() {

    console.log("Loading reviews...");

    const data =
        await apiRequest("/reviews/");


    allReviews =
        Array.isArray(data)
            ? data
            : Array.isArray(data.results)
                ? data.results
                : [];


    console.log(
        "REAL REVIEWS:",
        allReviews
    );

}

/* =========================================================
   LOAD SUPPORT TICKETS
========================================================= */

async function loadSupportTickets() {

    console.log("Loading support tickets...");

    const data =
        await apiRequest(
            "/support/admin/tickets/"
        );

    allSupportTickets =
        Array.isArray(data)
            ? data
            : Array.isArray(data.results)
                ? data.results
                : [];

    console.log(
        "REAL SUPPORT TICKETS:",
        allSupportTickets
    );

}

/* =========================================================
   RENDER SUPPORT TICKETS
========================================================= */

function renderSupportTickets() {

    const tableBody =
        document.getElementById(
            "supportTicketsTableBody"
        );

    if (!tableBody) {
        return;
    }


    /* ---------------------------------------------------------
       COUNTS
    --------------------------------------------------------- */

    const total =
        allSupportTickets.length;

    const open =
        allSupportTickets.filter(
            ticket => ticket.status === "open"
        ).length;

    const pending =
        allSupportTickets.filter(
            ticket => ticket.status === "pending"
        ).length;

    const resolved =
        allSupportTickets.filter(
            ticket => ticket.status === "resolved"
        ).length;


    const totalElement =
        document.getElementById(
            "supportTotalCount"
        );

    const openElement =
        document.getElementById(
            "supportOpenCount"
        );

    const pendingElement =
        document.getElementById(
            "supportPendingCount"
        );

    const resolvedElement =
        document.getElementById(
            "supportResolvedCount"
        );


    if (totalElement) {
        totalElement.textContent = total;
    }

    if (openElement) {
        openElement.textContent = open;
    }

    if (pendingElement) {
        pendingElement.textContent = pending;
    }

    if (resolvedElement) {
        resolvedElement.textContent = resolved;
    }


    /* ---------------------------------------------------------
       FILTER
    --------------------------------------------------------- */

    const filterElement =
        document.getElementById(
            "supportStatusFilter"
        );

    const selectedStatus =
        filterElement
            ? filterElement.value
            : "all";


    let tickets =
        allSupportTickets;


    if (selectedStatus !== "all") {

        tickets =
            allSupportTickets.filter(
                ticket =>
                    ticket.status === selectedStatus
            );

    }


    /* ---------------------------------------------------------
       EMPTY STATE
    --------------------------------------------------------- */

    if (tickets.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        No support tickets found.
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    /* ---------------------------------------------------------
       TABLE ROWS
    --------------------------------------------------------- */

    tableBody.innerHTML =
        tickets.map(
            ticket => {

                const ticketId =
                    `TCK-${ticket.id}`;

                const userName =
                    ticket.user_name ||
                    "Unknown User";

                const subject =
                    ticket.subject ||
                    "No subject";

                const category =
                    formatSupportCategory(
                        ticket.category
                    );

                const priority =
                    formatSupportPriority(
                        ticket.priority
                    );

                const status =
                    formatSupportStatus(
                        ticket.status
                    );

                const created =
                    formatSupportDate(
                        ticket.created_at
                    );


                return `
                    <tr>

                        <td>
                            <strong>
                                ${ticketId}
                            </strong>
                        </td>

                        <td>
                            ${userName}
                        </td>

                        <td>
                            ${subject}
                        </td>

                        <td>
                            ${category}
                        </td>

                        <td>
                            ${priority}
                        </td>

                        <td>
                            ${status}
                        </td>

                        <td>
                            ${created}
                        </td>

                        <td>

                            <button
                                type="button"
                                class="btn-secondary-custom support-view-btn"
                                data-ticket-id="${ticket.id}"
                            >
                                <i class="fa-solid fa-eye"></i>
                                View
                            </button>

                        </td>

                    </tr>
                `;

            }
        ).join("");


    /* ---------------------------------------------------------
       VIEW BUTTONS
    --------------------------------------------------------- */

    document
        .querySelectorAll(
            ".support-view-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        const ticketId =
                            Number(
                                this.dataset.ticketId
                            );

                        openSupportTicket(
                            ticketId
                        );

                    }
                );

            }
        );

}

// =========================================================
// OPEN SUPPORT TICKET MODAL
// =========================================================

function openSupportTicket(ticketId) {

    const ticket =
        allSupportTickets.find(
            function (item) {
                return Number(item.id) === Number(ticketId);
            }
        );

    if (!ticket) {

        showToast(
            "Support ticket not found.",
            "error"
        );

        return;
    }


    // -----------------------------------------------------
    // BASIC TICKET INFORMATION
    // -----------------------------------------------------

    document.getElementById(
        "supportModalTicketId"
    ).textContent =
        `TCK-${ticket.id}`;


    document.getElementById(
        "supportModalCreated"
    ).textContent =
        formatSupportDate(
            ticket.created_at
        );


    document.getElementById(
        "supportModalUserName"
    ).textContent =
        ticket.user_name ||
        "Unknown User";


    document.getElementById(
        "supportModalUserEmail"
    ).textContent =
        ticket.user_email ||
        "—";


    // -----------------------------------------------------
    // TICKET CONTENT
    // -----------------------------------------------------

    document.getElementById(
        "supportModalSubject"
    ).value =
        ticket.subject ||
        "";


    document.getElementById(
        "supportModalCategory"
    ).value =
        formatSupportCategory(
            ticket.category
        );


    document.getElementById(
        "supportModalMessage"
    ).value =
        ticket.message ||
        "";


    // -----------------------------------------------------
    // ADMIN CONTROLS
    // -----------------------------------------------------

    document.getElementById(
        "supportModalPriority"
    ).value =
        ticket.priority ||
        "medium";


    document.getElementById(
        "supportModalStatus"
    ).value =
        ticket.status ||
        "open";


    document.getElementById(
        "supportModalAdminResponse"
    ).value =
        ticket.admin_response ||
        "";


    // -----------------------------------------------------
    // STORE CURRENT TICKET ID
    // -----------------------------------------------------

    document.getElementById(
        "supportModalCurrentTicketId"
    ).value =
        ticket.id;


    // -----------------------------------------------------
    // OPEN BOOTSTRAP MODAL
    // -----------------------------------------------------

    const modalElement =
        document.getElementById(
            "supportTicketModal"
        );

    if (!modalElement) {

        console.error(
            "Support ticket modal not found."
        );

        return;
    }


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );


    modal.show();
}

// =========================================================
// UPDATE SUPPORT TICKET
// =========================================================

async function updateSupportTicket() {

    const ticketIdElement =
        document.getElementById(
            "supportModalCurrentTicketId"
        );

    const ticketId =
        ticketIdElement
            ? ticketIdElement.value
            : null;

    if (!ticketId) {

        showToast(
            "Support ticket ID not found.",
            "error"
        );

        return;
    }


    const priority =
        document.getElementById(
            "supportModalPriority"
        ).value;


    const status =
        document.getElementById(
            "supportModalStatus"
        ).value;


    const adminResponse =
        document.getElementById(
            "supportModalAdminResponse"
        ).value.trim();


    const saveButton =
        document.getElementById(
            "supportSaveButton"
        );


    try {

        if (saveButton) {

            saveButton.disabled = true;

            saveButton.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        }


        const updatedTicket =
            await apiRequest(
                `/support/admin/tickets/${ticketId}/`,
                {
                    method: "PATCH",

                    body: JSON.stringify({

                        status: status,

                        priority: priority,

                        admin_response: adminResponse

                    })
                }
            );


        // -------------------------------------------------
        // UPDATE LOCAL TICKET DATA
        // -------------------------------------------------

        const index =
            allSupportTickets.findIndex(
                function (ticket) {

                    return Number(ticket.id) ===
                        Number(ticketId);

                }
            );


        if (index !== -1) {

            allSupportTickets[index] =
                updatedTicket;

        }


        // -------------------------------------------------
        // REFRESH SUPPORT TABLE
        // -------------------------------------------------

        renderSupportTickets();


        // -------------------------------------------------
        // CLOSE MODAL
        // -------------------------------------------------

        const modalElement =
            document.getElementById(
                "supportTicketModal"
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


        showToast(
            "Support ticket updated successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "SUPPORT TICKET UPDATE ERROR:",
            error
        );


        showToast(
            error.message ||
            "Failed to update support ticket.",
            "error"
        );


    } finally {

        if (saveButton) {

            saveButton.disabled = false;

            saveButton.innerHTML =
                '<i class="fa-solid fa-floppy-disk"></i> Save Changes';

        }

    }

}
document.addEventListener(
    "DOMContentLoaded",
    function () {

        const saveButton =
            document.getElementById(
                "supportSaveButton"
            );

        if (saveButton) {

            saveButton.addEventListener(
                "click",
                updateSupportTicket
            );

        }

    }
);
/* =========================================================
   SUPPORT CATEGORY
========================================================= */

function formatSupportCategory(category) {

    const categories = {

        booking: "Booking Issues",

        payment: "Payment Problems",

        provider: "Provider Support",

        account: "Account Help",

        technical: "Technical Problems",

        safety: "Safety & Reporting",

        other: "Other"

    };

    return categories[category] || category || "Other";
}


/* =========================================================
   SUPPORT PRIORITY
========================================================= */

function formatSupportPriority(priority) {

    const label =
        priority
            ? priority.charAt(0).toUpperCase() +
              priority.slice(1)
            : "Medium";

    return `
        <span class="status-pill status-pill-neutral">
            ${label}
        </span>
    `;
}

/* =========================================================
   SUPPORT STATUS
========================================================= */

function formatSupportStatus(status) {

    const label =
        status
            ? status.charAt(0).toUpperCase() +
              status.slice(1)
            : "Open";

    return `
        <span class="status-pill status-pill-neutral">
            ${label}
        </span>
    `;
}

/* =========================================================
   SUPPORT DATE
========================================================= */

function formatSupportDate(dateString) {

    if (!dateString) {
        return "—";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "—";
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
   STATISTICS
========================================================= */

function calculateAndRenderStatistics() {

    const customers =
        allUsers.filter(
            user =>
                user.role === "customer"
        ).length;


    const providers =
        allUsers.filter(
            user =>
                user.role === "provider"
        ).length;


    const activeBookings =
        allBookings.filter(
            booking =>
                booking.status === "pending" ||
                booking.status === "accepted"
        ).length;


    const completedJobs =
        allBookings.filter(
            booking =>
                booking.status === "completed"
        ).length;


    const pendingBookings =
        allBookings.filter(
            booking =>
                booking.status === "pending"
        ).length;


    const totalBookingValue =
        allBookings.reduce(
            function (total, booking) {

                return (
                    total +
                    getNumericValue(
                        booking.total_price
                    )
                );

            },
            0
        );


    const currentMonth =
        new Date().getMonth();

    const currentYear =
        new Date().getFullYear();


    const monthlyBookingValue =
        allBookings
            .filter(function (booking) {

                const date =
                    parseDate(
                        booking.booking_date
                    );

                if (!date) {
                    return false;
                }

                return (
                    date.getMonth() === currentMonth &&
                    date.getFullYear() === currentYear
                );

            })
            .reduce(
                function (total, booking) {

                    return (
                        total +
                        getNumericValue(
                            booking.total_price
                        )
                    );

                },
                0
            );


    const rating =
        allReviews.length
            ? (
                allReviews.reduce(
                    function (total, review) {

                        return (
                            total +
                            getNumericValue(
                                review.rating
                            )
                        );

                    },
                    0
                ) / allReviews.length
            )
            : 0;


    const statistics = {

        customers,
        providers,
        activeBookings,
        completedJobs,
        pendingBookings,
        totalBookingValue,
        monthlyBookingValue,
        platformRating: rating

    };


    console.log(
        "ADMIN STATISTICS:",
        statistics
    );


    updateStatCards(
        statistics
    );

}


/* =========================================================
   UPDATE STAT CARDS
========================================================= */

function updateStatCards(statistics) {

    setStat(
        "customers",
        formatNumber(
            statistics.customers
        )
    );


    setStat(
        "providers",
        formatNumber(
            statistics.providers
        )
    );


    setStat(
        "activeBookings",
        formatNumber(
            statistics.activeBookings
        )
    );


    setStat(
        "completedJobs",
        formatNumber(
            statistics.completedJobs
        )
    );


    setStat(
        "pendingBookings",
        formatNumber(
            statistics.pendingBookings
        )
    );


    setStat(
        "totalBookingValue",
        formatCurrency(
            statistics.totalBookingValue
        )
    );


    setStat(
        "monthlyBookingValue",
        formatCurrency(
            statistics.monthlyBookingValue
        )
    );


    setStat(
        "platformRating",
        Number(
            statistics.platformRating
        ).toFixed(1)
    );


    document
        .querySelectorAll(
            ".stat-trend"
        )
        .forEach(
            function (element) {

                if (
                    element.dataset.trend
                ) {

                    element.textContent =
                        getTrendText(
                            element.dataset.trend
                        );

                }

            }
        );

}


function setStat(
    name,
    value
) {

    const element =
        document.querySelector(
            `[data-stat="${name}"]`
        );


    if (element) {

        element.textContent = value;

    }

}


function getTrendText(
    statName
) {

    switch (statName) {

        case "totalBookingValue":
            return "From booking records";

        case "monthlyBookingValue":
            return "Current month";

        case "platformRating":
            return "Based on reviews";

        default:
            return "Live data";

    }

}


/* =========================================================
   BOOKINGS
========================================================= */

function renderBookings() {

    const tbody =
        document.getElementById(
            "bookingsTableBody"
        );


    if (!tbody) {
        return;
    }


    const filter =
        document.getElementById(
            "bookingStatusFilter"
        );


    const selectedStatus =
        filter
            ? filter.value
            : "all";


    filteredBookings =
        selectedStatus === "all"
            ? [...allBookings]
            : allBookings.filter(
                booking =>
                    booking.status === selectedStatus
            );


    if (!filteredBookings.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        No bookings available.
                    </div>
                </td>
            </tr>
        `;

        return;

    }


    const sortedBookings =
        [...filteredBookings].sort(
            function (a, b) {

                const dateA =
                    parseDateTime(
                        a.booking_date,
                        a.booking_time
                    );

                const dateB =
                    parseDateTime(
                        b.booking_date,
                        b.booking_time
                    );


                return (
                    (dateB || 0) -
                    (dateA || 0)
                );

            }
        );


    tbody.innerHTML =
        sortedBookings
            .map(
                function (booking) {

                    return `
                        <tr>

                            <td>
                                <strong>
                                    #BK-${escapeHTML(
                                        String(booking.id ?? "—")
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${escapeHTML(
                                    getCustomerName(booking)
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    getProviderNameFromBooking(booking)
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    booking.service || "—"
                                )}
                            </td>

                            <td>
                                ${formatDate(
                                    booking.booking_date
                                )}
                            </td>

                            <td>
                                ${formatTime(
                                    booking.booking_time
                                )}
                            </td>

                            <td>
                                ${formatCurrency(
                                    booking.total_price
                                )}
                            </td>

                            <td>
                                ${getStatusBadge(
                                    booking.status
                                )}
                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   USERS
========================================================= */

function renderUsers() {

    const tbody =
        document.getElementById(
            "usersTableBody"
        );


    if (!tbody) {
        return;
    }


    if (!allUsers.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        No users available.
                    </div>
                </td>
            </tr>
        `;

        return;

    }


    const sortedUsers =
        [...allUsers].sort(
            function (a, b) {

                return (
                    Number(a.id || 0) -
                    Number(b.id || 0)
                );

            }
        );


    tbody.innerHTML =
        sortedUsers
            .map(
                function (user) {

                    const name =
                        getUserFullName(
                            user
                        );


                    const initials =
                        getInitials(
                            name !== "—"
                                ? name
                                : user.email
                        );


                    const role =
                        user.role || "unknown";


                    const active =
                        user.is_active !== false;


                    return `
                        <tr>

                            <td>

                                <div class="table-user">

                                    <div class="table-avatar">
                                        ${escapeHTML(
                                            initials
                                        )}
                                    </div>

                                    <div>
                                        <strong>
                                            ${escapeHTML(
                                                name
                                            )}
                                        </strong>

                                        <small>
                                            ID #${escapeHTML(
                                                String(
                                                    user.id ?? "—"
                                                )
                                            )}
                                        </small>
                                    </div>

                                </div>

                            </td>


                            <td>
                                ${escapeHTML(
                                    user.email || "—"
                                )}
                            </td>


                            <td>
                                ${getRoleBadge(
                                    role
                                )}
                            </td>


                            <td>
                                ${getUserStatusBadge(
                                    active
                                )}
                            </td>


                            <td>
                                —
                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   PROVIDERS
========================================================= */

function renderProviders() {

    updateBookingProviderReferences();

}


/* =========================================================
   PROVIDER APPROVALS
========================================================= */

function renderProviderApprovals() {

    const grid =
        document.getElementById(
            "providerApprovalGrid"
        );


    if (!grid) {
        return;
    }


    const unverifiedProviders =
        allProviders.filter(
            provider =>
                provider.verified !== true
        );


    if (!unverifiedProviders.length) {

        grid.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-circle-check"></i>
                All Providers Verified
            </div>
        `;

        return;

    }


    grid.innerHTML =
        unverifiedProviders
            .map(
                function (provider) {

                    const name =
                        provider.full_name ||
                        "Unnamed Provider";


                    const initials =
                        getInitials(name);


                    const image =
                        normalizeMediaUrl(
                            provider.profile_image
                        );


                    const category =
                        provider.category_name ||
                        "Service Provider";


                    return `
                        <article
                            class="provider-approval-card"
                        >

                            <div
                                class="provider-card-top"
                            >

                                <div
                                    class="provider-avatar"
                                >

                                    ${
                                        image
                                            ? `
                                                <img
                                                    src="${escapeAttribute(
                                                        image
                                                    )}"
                                                    alt="${escapeAttribute(
                                                        name
                                                    )}"
                                                    onerror="this.style.display='none'; this.parentElement.textContent='${escapeAttribute(
                                                        initials
                                                    )}';"
                                                >
                                            `
                                            : escapeHTML(
                                                initials
                                            )
                                    }

                                </div>


                                <div>

                                    <h3>
                                        ${escapeHTML(
                                            name
                                        )}
                                    </h3>

                                    <p>
                                        ${escapeHTML(
                                            category
                                        )}
                                    </p>

                                </div>

                            </div>


                            <div
                                class="provider-details"
                            >

                                <div
                                    class="provider-detail"
                                >
                                    <span>
                                        Experience
                                    </span>

                                    <strong>
                                        ${escapeHTML(
                                            provider.experience != null
                                                ? `${provider.experience} years`
                                                : "—"
                                        )}
                                    </strong>
                                </div>


                                <div
                                    class="provider-detail"
                                >
                                    <span>
                                        Hourly Rate
                                    </span>

                                    <strong>
                                        ${formatCurrency(
                                            provider.hourly_rate
                                        )}
                                    </strong>
                                </div>


                                <div
                                    class="provider-detail"
                                >
                                    <span>
                                        Rating
                                    </span>

                                    <strong>
                                        ${escapeHTML(
                                            String(
                                                provider.rating ?? 0
                                            )
                                        )}
                                        / 5
                                    </strong>
                                </div>


                                <div
                                    class="provider-detail"
                                >
                                    <span>
                                        Address
                                    </span>

                                    <strong>
                                        ${escapeHTML(
                                            provider.address || "—"
                                        )}
                                    </strong>
                                </div>

                            </div>


                            <div
                                class="provider-actions"
                            >

                                <button
                                    type="button"
                                    class="provider-approve-btn"
                                    data-verify-provider="${escapeAttribute(
                                        provider.id
                                    )}"
                                >
                                    <i class="fa-solid fa-check"></i>
                                    Approve
                                </button>

                                <button
                                    type="button"
                                    class="provider-reject-btn"
                                    data-reject-provider="${escapeAttribute(
                                        provider.id
                                    )}"
                                >
                                    <i class="fa-solid fa-xmark"></i>
                                    Reject
                                </button>

                            </div>

                        </article>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   PROVIDER VERIFICATION
========================================================= */

async function verifyProvider(
    providerId,
    verified
) {

    try {

        const button =
            document.querySelector(
                `[data-verify-provider="${providerId}"],
                 [data-reject-provider="${providerId}"]`
            );


        if (button) {

            button.disabled = true;

        }


        const response =
            await apiRequest(
                `/users/admin/providers/${providerId}/verify/`,
                {
                    method: "PATCH",
                    body: {
                        verified: verified
                    }
                }
            );


        console.log(
            "PROVIDER VERIFICATION RESPONSE:",
            response
        );


        const provider =
            allProviders.find(
                item =>
                    String(item.id) ===
                    String(providerId)
            );


        if (provider) {

            provider.verified =
                verified;

        }


        renderProviderApprovals();


        showToast(
            verified
                ? "Provider approved successfully."
                : "Provider verification removed."
        );


    } catch (error) {

        console.error(
            "Provider verification failed:",
            error
        );


        showToast(
            error.message ||
            "Unable to update provider verification.",
            "error"
        );

    }

}


/* =========================================================
   SERVICES
========================================================= */

function renderServices() {

    const grid =
        document.getElementById(
            "serviceGrid"
        );


    if (!grid) {
        return;
    }


    if (!allServices.length) {

        grid.innerHTML = `
            <div class="empty-state">
                No services available.
            </div>
        `;

        return;

    }


    grid.innerHTML =
        allServices
            .map(
                function (service) {

                    const icon =
                        getServiceIcon(
                            service.name
                        );


                    const categoryId =
                        service.category;


                    const providerCount =
                        allProviders.filter(
                            provider =>
                                String(
                                    provider.category
                                ) ===
                                String(
                                    categoryId
                                )
                        ).length;


                    return `
                        <article class="service-card">

                            <div class="service-icon">
                                <i class="${icon}"></i>
                            </div>

                            <h3>
                                ${escapeHTML(
                                    service.name || "Unnamed Service"
                                )}
                            </h3>

                            <div class="service-category">
                                ${escapeHTML(
                                    service.category_name ||
                                    "Uncategorized"
                                )}
                            </div>

                            <div class="service-price">
                                ${formatCurrency(
                                    service.base_price
                                )}
                            </div>

                            <div class="service-meta">
                                ${providerCount}
                                provider${
                                    providerCount === 1
                                        ? ""
                                        : "s"
                                }
                                in this category
                            </div>

                        </article>
                    `;

                }
            )
            .join("");


    grid.insertAdjacentHTML(
        "beforeend",
        `
            <article
                class="service-card service-card-add disabled"
                title="Service creation API is not configured."
            >

                <i class="fa-solid fa-plus"></i>

                <strong>
                    Add Service
                </strong>

                <small>
                    API not configured
                </small>

            </article>
        `
    );

}


/* =========================================================
   REVIEWS
========================================================= */

function renderReviews() {

    const container =
        document.getElementById(
            "reviewList"
        );


    if (!container) {
        return;
    }


    if (!allReviews.length) {

        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-regular fa-star"></i>
                No Reviews Yet
            </div>
        `;

        return;

    }


    container.innerHTML =
        allReviews
            .map(
                function (review) {

                    const customer =
                        review.customer_name ||
                        "Customer";


                    const provider =
                        getProviderName(
                            review.provider
                        );


                    const rating =
                        getNumericValue(
                            review.rating
                        );


                    const stars =
                        renderStars(
                            rating
                        );


                    return `
                        <article
                            class="review-card"
                        >

                            <div class="review-avatar">
                                ${escapeHTML(
                                    getInitials(
                                        customer
                                    )
                                )}
                            </div>


                            <div
                                class="review-content"
                            >

                                <div
                                    class="review-top"
                                >

                                    <strong>
                                        ${escapeHTML(
                                            customer
                                        )}
                                    </strong>

                                    <span
                                        class="review-date"
                                    >
                                        ${formatDateTime(
                                            review.created_at
                                        )}
                                    </span>

                                </div>


                                <div
                                    class="review-provider"
                                >
                                    Provider:
                                    ${escapeHTML(
                                        provider
                                    )}
                                </div>


                                <div
                                    class="review-stars"
                                >
                                    ${stars}
                                </div>


                                <div
                                    class="review-comment"
                                >
                                    ${escapeHTML(
                                        review.comment ||
                                        "No comment provided."
                                    )}
                                </div>

                            </div>

                        </article>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   PAYMENTS
========================================================= */

function renderPaymentSection() {

    const cards =
        document.getElementById(
            "paymentCardsGrid"
        );


    const transactions =
        document.getElementById(
            "paymentTransactions"
        );


    if (cards) {

        cards.innerHTML = `
            <div class="payment-summary-card">

                <span>
                    Payment Status
                </span>

                <strong>
                    Not Configured
                </strong>

            </div>


            <div class="payment-summary-card">

                <span>
                    Gateway
                </span>

                <strong>
                    Not Configured
                </strong>

            </div>


            <div class="payment-summary-card">

                <span>
                    Transactions
                </span>

                <strong>
                    —
                </strong>

            </div>


            <div class="payment-summary-card">

                <span>
                    Payment Revenue
                </span>

                <strong>
                    —
                </strong>

            </div>
        `;

    }


    if (transactions) {

        transactions.innerHTML = `
            <div class="not-configured-card">

                <i class="fa-solid fa-credit-card"></i>

                <h3>
                    Payment Integration Not Configured
                </h3>

                <p>
                    Online payment processing is postponed.
                    Booking values shown elsewhere are not confirmed payments.
                </p>

            </div>
        `;

    }

}


/* =========================================================
   ANALYTICS
========================================================= */

function renderAnalytics() {

    drawMonthlyBookingsChart();

    drawBookingValueChart();

    drawTopServicesChart();

    drawTopProvidersChart();

}


/* =========================================================
   MONTHLY BOOKINGS
========================================================= */

function drawMonthlyBookingsChart() {

    const canvas =
        document.getElementById(
            "monthlyBookingsChart"
        );


    if (!canvas) {
        return;
    }


    const labels =
        getLastSixMonths();


    const values =
        labels.map(
            function (month) {

                return allBookings.filter(
                    function (booking) {

                        const date =
                            parseDate(
                                booking.booking_date
                            );

                        if (!date) {
                            return false;
                        }


                        return (
                            date.getFullYear() ===
                            month.year &&
                            date.getMonth() ===
                            month.month
                        );

                    }
                ).length;

            }
        );


    drawLineChart(
        canvas,
        labels.map(
            item =>
                item.label
        ),
        values,
        "Bookings"
    );

}


/* =========================================================
   BOOKING VALUE CHART
========================================================= */

function drawBookingValueChart() {

    const canvas =
        document.getElementById(
            "revenueTrendChart"
        );


    if (!canvas) {
        return;
    }


    const labels =
        getLastSixMonths();


    const values =
        labels.map(
            function (month) {

                return allBookings
                    .filter(
                        function (booking) {

                            const date =
                                parseDate(
                                    booking.booking_date
                                );

                            if (!date) {
                                return false;
                            }


                            return (
                                date.getFullYear() ===
                                month.year &&
                                date.getMonth() ===
                                month.month
                            );

                        }
                    )
                    .reduce(
                        function (total, booking) {

                            return (
                                total +
                                getNumericValue(
                                    booking.total_price
                                )
                            );

                        },
                        0
                    );

            }
        );


    drawLineChart(
        canvas,
        labels.map(
            item =>
                item.label
        ),
        values,
        "Booking Value"
    );

}


/* =========================================================
   TOP SERVICES CHART
========================================================= */

function drawTopServicesChart() {

    const canvas =
        document.getElementById(
            "topServicesChart"
        );


    if (!canvas) {
        return;
    }


    const counts = {};


    allBookings.forEach(
        function (booking) {

            const name =
                booking.service ||
                "Unknown";


            counts[name] =
                (counts[name] || 0) + 1;

        }
    );


    const sorted =
        Object.entries(counts)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )
            .slice(0, 6);


    drawBarChart(
        canvas,
        sorted.map(
            item =>
                item[0]
        ),
        sorted.map(
            item =>
                item[1]
        )
    );

}


/* =========================================================
   TOP PROVIDERS CHART
========================================================= */

function drawTopProvidersChart() {

    const canvas =
        document.getElementById(
            "topProvidersChart"
        );


    if (!canvas) {
        return;
    }


    const counts = {};


    allBookings.forEach(
        function (booking) {

            const name =
                getProviderNameFromBooking(
                    booking
                );


            counts[name] =
                (counts[name] || 0) + 1;

        }
    );


    delete counts["—"];


    const sorted =
        Object.entries(counts)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )
            .slice(0, 6);


    drawBarChart(
        canvas,
        sorted.map(
            item =>
                item[0]
        ),
        sorted.map(
            item =>
                item[1]
        )
    );

}


/* =========================================================
   CANVAS LINE CHART
========================================================= */

function drawLineChart(
    canvas,
    labels,
    values,
    datasetName
) {

    const ctx =
        canvas.getContext("2d");


    const rect =
        canvas.getBoundingClientRect();


    const width =
        Math.max(
            rect.width,
            300
        );


    const height =
        Math.max(
            rect.height,
            220
        );


    const dpr =
        window.devicePixelRatio || 1;


    canvas.width =
        width * dpr;

    canvas.height =
        height * dpr;


    ctx.scale(
        dpr,
        dpr
    );


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    if (!values.length ||
        values.every(
            value =>
                Number(value) === 0
        )
    ) {

        drawChartEmptyState(
            ctx,
            width,
            height,
            "No booking data available."
        );

        return;

    }


    const padding = {

        top: 25,
        right: 20,
        bottom: 40,
        left: 50

    };


    const chartWidth =
        width -
        padding.left -
        padding.right;


    const chartHeight =
        height -
        padding.top -
        padding.bottom;


    const maxValue =
        Math.max(
            ...values,
            1
        );


    const points =
        values.map(
            function (value, index) {

                const x =
                    padding.left +
                    (
                        index /
                        Math.max(
                            labels.length - 1,
                            1
                        )
                    ) *
                    chartWidth;


                const y =
                    padding.top +
                    chartHeight -
                    (
                        Number(value) /
                        maxValue
                    ) *
                    chartHeight;


                return {
                    x,
                    y
                };

            }
        );


    ctx.strokeStyle =
        "#e4e7ee";

    ctx.lineWidth = 1;


    for (
        let i = 0;
        i <= 4;
        i++
    ) {

        const y =
            padding.top +
            (
                chartHeight *
                i /
                4
            );


        ctx.beginPath();

        ctx.moveTo(
            padding.left,
            y
        );

        ctx.lineTo(
            width -
            padding.right,
            y
        );

        ctx.stroke();

    }


    ctx.fillStyle =
        "#8b92a3";

    ctx.font =
        "9px Poppins, sans-serif";


    labels.forEach(
        function (label, index) {

            const point =
                points[index];


            ctx.textAlign =
                "center";


            ctx.fillText(
                label,
                point.x,
                height - 14
            );

        }
    );


    ctx.strokeStyle =
        "#6c5ce7";

    ctx.lineWidth = 3;

    ctx.lineJoin = "round";

    ctx.lineCap = "round";


    ctx.beginPath();


    points.forEach(
        function (point, index) {

            if (index === 0) {

                ctx.moveTo(
                    point.x,
                    point.y
                );

            } else {

                ctx.lineTo(
                    point.x,
                    point.y
                );

            }

        }
    );


    ctx.stroke();


    points.forEach(
        function (point) {

            ctx.beginPath();

            ctx.arc(
                point.x,
                point.y,
                4,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                "#ffffff";

            ctx.fill();

            ctx.strokeStyle =
                "#6c5ce7";

            ctx.lineWidth = 2;

            ctx.stroke();

        }
    );


    ctx.fillStyle =
        "#6b7280";

    ctx.textAlign =
        "left";

    ctx.fillText(
        datasetName,
        padding.left,
        13
    );

}


/* =========================================================
   CANVAS BAR CHART
========================================================= */

function drawBarChart(
    canvas,
    labels,
    values
) {

    const ctx =
        canvas.getContext("2d");


    const rect =
        canvas.getBoundingClientRect();


    const width =
        Math.max(
            rect.width,
            300
        );


    const height =
        Math.max(
            rect.height,
            220
        );


    const dpr =
        window.devicePixelRatio || 1;


    canvas.width =
        width * dpr;

    canvas.height =
        height * dpr;


    ctx.scale(
        dpr,
        dpr
    );


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    if (!values.length) {

        drawChartEmptyState(
            ctx,
            width,
            height,
            "No booking data available."
        );

        return;

    }


    const padding = {

        top: 20,
        right: 15,
        bottom: 50,
        left: 35

    };


    const chartWidth =
        width -
        padding.left -
        padding.right;


    const chartHeight =
        height -
        padding.top -
        padding.bottom;


    const maxValue =
        Math.max(
            ...values,
            1
        );


    const gap = 10;


    const barWidth =
        Math.max(
            (
                chartWidth -
                (
                    gap *
                    (values.length - 1)
                )
            ) /
            values.length,
            12
        );


    values.forEach(
        function (value, index) {

            const barHeight =
                (
                    Number(value) /
                    maxValue
                ) *
                chartHeight;


            const x =
                padding.left +
                index *
                (
                    barWidth +
                    gap
                );


            const y =
                padding.top +
                chartHeight -
                barHeight;


            ctx.fillStyle =
                "#6c5ce7";


            ctx.fillRect(
                x,
                y,
                barWidth,
                barHeight
            );


            ctx.fillStyle =
                "#6b7280";


            ctx.font =
                "8px Poppins, sans-serif";


            ctx.textAlign =
                "center";


            ctx.fillText(
                String(value),
                x +
                barWidth / 2,
                y - 5
            );


            let label =
                String(
                    labels[index]
                );


            if (label.length > 13) {

                label =
                    label.substring(
                        0,
                        12
                    ) +
                    "…";

            }


            ctx.save();

            ctx.translate(
                x +
                barWidth / 2,
                height - 12
            );

            ctx.rotate(
                -Math.PI / 6
            );


            ctx.fillText(
                label,
                0,
                0
            );


            ctx.restore();

        }
    );

}


/* =========================================================
   EMPTY CHART
========================================================= */

function drawChartEmptyState(
    ctx,
    width,
    height,
    message
) {

    ctx.fillStyle =
        "#9ca3af";

    ctx.font =
        "10px Poppins, sans-serif";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";


    ctx.fillText(
        message,
        width / 2,
        height / 2
    );

}


/* =========================================================
   SYSTEM STATUS
========================================================= */

function renderSystemStatus() {

    const container =
        document.getElementById(
            "systemStatusList"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="status-row">

            <span class="status-name">

                <span class="status-dot"></span>

                <span class="status-label">
                    Backend API
                </span>

            </span>

            <strong class="status-online">
                Online
            </strong>

        </div>


        <div class="status-row">

            <span class="status-name">

                <span class="status-dot"></span>

                <span class="status-label">
                    Users API
                </span>

            </span>

            <strong class="status-online">
                Online
            </strong>

        </div>


        <div class="status-row">

            <span class="status-name">

                <span class="status-dot status-dot-neutral"></span>

                <span class="status-label">
                    Payment Gateway
                </span>

            </span>

            <strong class="status-neutral">
                Not Configured
            </strong>

        </div>


        <div class="status-row">

            <span class="status-name">

                <span class="status-dot status-dot-neutral"></span>

                <span class="status-label">
                    Notification Service
                </span>

            </span>

            <strong class="status-neutral">
                Not Configured
            </strong>

        </div>

    `;

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function renderNotifications() {

    const topContainer =
        document.getElementById(
            "topNotificationsContent"
        );


    const miniContainer =
        document.getElementById(
            "miniNotificationList"
        );


    const badge =
        document.getElementById(
            "notificationBadge"
        );


    if (badge) {

        badge.textContent = "";

    }


    const message =
        `
            <div class="mini-notification">

                <strong>
                    Notification system is not configured yet.
                </strong>

                <small>
                    No notification records are available.
                </small>

            </div>
        `;


    if (miniContainer) {

        miniContainer.innerHTML =
            message;

    }


    if (topContainer) {

        topContainer.innerHTML =
            message;

    }

}


/* =========================================================
   MESSAGES
========================================================= */

function renderMessages() {

    const container =
        document.getElementById(
            "topMessagesContent"
        );


    const badge =
        document.getElementById(
            "messageBadge"
        );


    if (badge) {

        badge.textContent = "";

    }


    if (container) {

        container.innerHTML = `

            <div class="mini-notification">

                <strong>
                    Messaging Not Configured
                </strong>

                <small>
                    OneClick does not currently have
                    a messaging API.
                </small>

            </div>

        `;

    }

}


/* =========================================================
   PLATFORM ACTIVITY
========================================================= */

function renderPlatformActivity() {

    const container =
        document.getElementById(
            "platformActivity"
        );


    if (!container) {
        return;
    }


    const today =
        getTodayDateString();


    const bookingsToday =
        allBookings.filter(
            booking =>
                booking.booking_date ===
                today
        ).length;


    const activity = [

        {
            label:
                "New Signups Today",

            value:
                "—",

            unavailable:
                true
        },

        {
            label:
                "Bookings Today",

            value:
                bookingsToday,

            unavailable:
                false
        },

        {
            label:
                "Support Tickets Open",

            value:
                "—",

            unavailable:
                true
        }

    ];


    console.log(
        "PLATFORM ACTIVITY:",
        activity
    );


    container.innerHTML =
        activity
            .map(
                function (item) {

                    return `
                        <div class="activity-row">

                            <span>
                                ${escapeHTML(
                                    item.label
                                )}
                            </span>

                            <strong
                                class="${
                                    item.unavailable
                                        ? "activity-unavailable"
                                        : "activity-value"
                                }"
                            >
                                ${escapeHTML(
                                    String(
                                        item.value
                                    )
                                )}
                            </strong>

                        </div>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   ADMIN PROFILE
========================================================= */

function renderAdminProfile() {

    if (!currentAdmin) {
        return;
    }


    const name =
        getUserFullName(
            currentAdmin
        );


    const email =
        currentAdmin.email ||
        "—";


    const role =
        formatRole(
            currentAdmin.role
        );


    const initials =
        getInitials(
            name !== "—"
                ? name
                : email
        );


    document
        .querySelectorAll(
            ".admin-name"
        )
        .forEach(
            function (element) {

                element.textContent =
                    name !== "—"
                        ? name
                        : "Administrator";

            }
        );


    document
        .querySelectorAll(
            ".admin-role"
        )
        .forEach(
            function (element) {

                element.textContent =
                    role;

            }
        );


    const emailElement =
        document.getElementById(
            "profileAdminEmail"
        );


    if (emailElement) {

        emailElement.textContent =
            email;

    }


    const profileName =
        document.getElementById(
            "profileAdminName"
        );


    if (profileName) {

        profileName.textContent =
            name !== "—"
                ? name
                : "Administrator";

    }


    document
        .querySelectorAll(
            ".admin-avatar-initials"
        )
        .forEach(
            function (element) {

                element.textContent =
                    initials;

            }
        );


    const profileRole =
        document.getElementById(
            "profileAdminRole"
        );


    if (profileRole) {

        profileRole.textContent =
            role;

    }

}


/* =========================================================
   DASHBOARD DATE
========================================================= */

function updateDashboardDate() {

    const element =
        document.getElementById(
            "adminPageDate"
        );


    if (!element) {
        return;
    }


    const now =
        new Date();


    element.innerHTML = `

        <i class="fa-regular fa-calendar"></i>

        <span>
            ${escapeHTML(
                now.toLocaleDateString(
                    "en-US",
                    {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                    }
                )
            )}
        </span>

    `;


    console.log(
        "Dashboard date updated successfully:",
        now.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        )
    );

}


/* =========================================================
   BOOKING NAV BADGE
========================================================= */

function updateBookingBadge() {

    const badge =
        document.getElementById(
            "bookingNavBadge"
        );


    if (!badge) {
        return;
    }


    const pending =
        allBookings.filter(
            booking =>
                booking.status === "pending"
        ).length;


    badge.textContent =
        pending > 99
            ? "99+"
            : String(pending);


    if (pending === 0) {

        badge.style.display =
            "none";

    } else {

        badge.style.display =
            "flex";

    }

}


/* =========================================================
   QUICK NOTES
========================================================= */

function loadQuickNotes() {

    const textarea =
        document.getElementById(
            "quickNotes"
        );


    if (!textarea) {
        return;
    }


    textarea.value =
        localStorage.getItem(
            "oneclick_admin_notes"
        ) || "";

}


function saveQuickNotes() {

    const textarea =
        document.getElementById(
            "quickNotes"
        );


    if (!textarea) {
        return;
    }


    localStorage.setItem(
        "oneclick_admin_notes",
        textarea.value
    );


    showToast(
        "Admin note saved."
    );

}


/* =========================================================
   GLOBAL SEARCH
========================================================= */

function setupGlobalSearch() {

    const input =
        document.getElementById(
            "globalSearch"
        );


    const results =
        document.getElementById(
            "searchResults"
        );


    if (!input || !results) {
        return;
    }


    input.addEventListener(
        "input",
        function () {

            const query =
                input.value
                    .trim()
                    .toLowerCase();


            if (!query) {

                results.innerHTML = "";

                results.classList.remove(
                    "active"
                );

                return;

            }


            const matches = [];


            /* Users */

            allUsers.forEach(
                function (user) {

                    const text =
                        [
                            user.first_name,
                            user.last_name,
                            user.email,
                            user.role
                        ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    if (
                        text.includes(query)
                    ) {

                        matches.push({

                            type:
                                "User",

                            title:
                                getUserFullName(
                                    user
                                ),

                            subtitle:
                                user.email,

                            section:
                                "customers",

                            icon:
                                "fa-solid fa-user"

                        });

                    }

                }
            );


            /* Providers */

            allProviders.forEach(
                function (provider) {

                    const text =
                        [
                            provider.full_name,
                            provider.category_name,
                            provider.address
                        ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    if (
                        text.includes(query)
                    ) {

                        matches.push({

                            type:
                                "Provider",

                            title:
                                provider.full_name,

                            subtitle:
                                provider.category_name,

                            section:
                                "providers",

                            icon:
                                "fa-solid fa-user-tie"

                        });

                    }

                }
            );


            /* Services */

            allServices.forEach(
                function (service) {

                    const text =
                        [
                            service.name,
                            service.category_name
                        ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    if (
                        text.includes(query)
                    ) {

                        matches.push({

                            type:
                                "Service",

                            title:
                                service.name,

                            subtitle:
                                service.category_name,

                            section:
                                "services",

                            icon:
                                "fa-solid fa-screwdriver-wrench"

                        });

                    }

                }
            );


            /* Bookings */

            allBookings.forEach(
                function (booking) {

                    const text =
                        [
                            booking.id,
                            booking.service,
                            booking.status,
                            getCustomerName(
                                booking
                            ),
                            getProviderNameFromBooking(
                                booking
                            )
                        ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    if (
                        text.includes(query)
                    ) {

                        matches.push({

                            type:
                                "Booking",

                            title:
                                `Booking #${booking.id}`,

                            subtitle:
                                booking.service ||
                                booking.status,

                            section:
                                "bookings",

                            icon:
                                "fa-solid fa-calendar-check"

                        });

                    }

                }
            );


            const limitedMatches =
                matches.slice(
                    0,
                    10
                );


            if (!limitedMatches.length) {

                results.innerHTML = `
                    <div class="empty-state">
                        No matching records found.
                    </div>
                `;

                results.classList.add(
                    "active"
                );

                return;

            }


            results.innerHTML =
                limitedMatches
                    .map(
                        function (item) {

                            return `
                                <button
                                    type="button"
                                    class="search-result-item"
                                    data-search-section="${escapeAttribute(
                                        item.section
                                    )}"
                                >

                                    <span
                                        class="search-result-icon"
                                    >
                                        <i class="${escapeAttribute(
                                            item.icon
                                        )}"></i>
                                    </span>

                                    <span
                                        class="search-result-text"
                                    >

                                        <strong>
                                            ${escapeHTML(
                                                item.title
                                            )}
                                        </strong>

                                        <small>
                                            ${escapeHTML(
                                                item.type
                                            )}
                                            ·
                                            ${escapeHTML(
                                                item.subtitle ||
                                                ""
                                            )}
                                        </small>

                                    </span>

                                </button>
                            `;

                        }
                    )
                    .join("");


            results.classList.add(
                "active"
            );

        }
    );


    results.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    "[data-search-section]"
                );


            if (!button) {
                return;
            }


            const section =
                button.dataset.searchSection;


            navigateToSection(
                section
            );


            input.value = "";

            results.innerHTML = "";

            results.classList.remove(
                "active"
            );

        }
    );


    document.addEventListener(
        "click",
        function (event) {

            if (
                !event.target.closest(
                    ".global-search"
                )
            ) {

                results.classList.remove(
                    "active"
                );

            }

        }
    );

}


/* =========================================================
   SIDEBAR
========================================================= */

function setupSidebar() {

    sidebar =
        document.getElementById(
            "sidebar"
        );


    sidebarOverlay =
        document.getElementById(
            "sidebarOverlay"
        );


    const toggle =
        document.getElementById(
            "sidebarToggle"
        );


    const close =
        document.getElementById(
            "sidebarClose"
        );


    if (toggle) {

        toggle.addEventListener(
            "click",
            function () {

                openSidebar();

            }
        );

    }


    if (close) {

        close.addEventListener(
            "click",
            function () {

                closeSidebar();

            }
        );

    }


    if (sidebarOverlay) {

        sidebarOverlay.addEventListener(
            "click",
            function () {

                closeSidebar();

            }
        );

    }


    document
        .querySelectorAll(
            ".nav-link[data-section], .dropdown-link[data-section], [data-section]"
        )
        .forEach(
            function (element) {

                element.addEventListener(
                    "click",
                    function (event) {

                        const section =
                            element.dataset.section;


                        if (
                            section === "logout"
                        ) {

                            return;

                        }


                        if (
                            section === "help"
                        ) {

                            event.preventDefault();

                            showToast(
                                "Help documentation is not configured yet."
                            );

                            closeSidebar();

                            return;

                        }


                        if (
                            document.getElementById(
                                section
                            )
                        ) {

                            event.preventDefault();

                            navigateToSection(
                                section
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   NAVIGATION
========================================================= */

function navigateToSection(
    sectionId
) {

    const section =
        document.getElementById(
            sectionId
        );


    if (!section) {

        showToast(
            "This section is not available yet.",
            "error"
        );

        return;

    }


    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });


    document
        .querySelectorAll(
            ".nav-link"
        )
        .forEach(
            function (link) {

                link.classList.toggle(
                    "active",
                    link.dataset.section ===
                    sectionId
                );

            }
        );


    closeSidebar();

}


/* =========================================================
   SIDEBAR OPEN / CLOSE
========================================================= */

function openSidebar() {

    if (!sidebar) {
        return;
    }


    sidebar.classList.add(
        "open"
    );


    if (sidebarOverlay) {

        sidebarOverlay.classList.add(
            "active"
        );

    }

}


function closeSidebar() {

    if (!sidebar) {
        return;
    }


    sidebar.classList.remove(
        "open"
    );


    if (sidebarOverlay) {

        sidebarOverlay.classList.remove(
            "active"
        );

    }

}


/* =========================================================
   DROPDOWNS
========================================================= */

function setupDropdowns() {

    const dropdowns =
        document.querySelectorAll(
            ".topbar-dropdown"
        );


    dropdowns.forEach(
        function (dropdown) {

            const button =
                dropdown.querySelector(
                    ".dropdown-toggle-btn"
                );


            if (!button) {
                return;
            }


            button.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();


                    dropdowns
                        .forEach(
                            function (other) {

                                if (
                                    other !==
                                    dropdown
                                ) {

                                    other.classList.remove(
                                        "open"
                                    );

                                }

                            }
                        );


                    dropdown.classList.toggle(
                        "open"
                    );

                }
            );

        }
    );


    document.addEventListener(
        "click",
        function () {

            dropdowns
                .forEach(
                    function (dropdown) {

                        dropdown.classList.remove(
                            "open"
                        );

                    }
                );

        }
    );

}


/* =========================================================
   THEME
========================================================= */

function setupTheme() {

    const button =
        document.getElementById(
            "themeToggle"
        );


    const settingsButton =
        document.getElementById(
            "settingsThemeBtn"
        );


    const savedTheme =
        localStorage.getItem(
            "oneclick_admin_theme"
        );


    if (
        savedTheme === "dark"
    ) {

        document.body.classList.add(
            "dark-mode"
        );

    }


    updateThemeIcon();


    if (button) {

        button.addEventListener(
            "click",
            toggleTheme
        );

    }


    if (settingsButton) {

        settingsButton.addEventListener(
            "click",
            toggleTheme
        );

    }

}


function toggleTheme() {

    document.body.classList.toggle(
        "dark-mode"
    );


    const isDark =
        document.body.classList.contains(
            "dark-mode"
        );


    localStorage.setItem(
        "oneclick_admin_theme",
        isDark
            ? "dark"
            : "light"
    );


    updateThemeIcon();

}


function updateThemeIcon() {

    const button =
        document.getElementById(
            "themeToggle"
        );


    if (!button) {
        return;
    }


    const icon =
        button.querySelector(
            "i"
        );


    if (!icon) {
        return;
    }


    const isDark =
        document.body.classList.contains(
            "dark-mode"
        );


    icon.className =
        isDark
            ? "fa-solid fa-sun"
            : "fa-solid fa-moon";

}


/* =========================================================
   BOOKING FILTER
========================================================= */

function setupBookingFilter() {

    const filter =
        document.getElementById(
            "bookingStatusFilter"
        );


    if (!filter) {
        return;
    }


    filter.addEventListener(
        "change",
        function () {

            renderBookings();

        }
    );

}


/* =========================================================
   QUICK ACTIONS
========================================================= */

function setupQuickActions() {

    const quickAdd =
        document.getElementById(
            "quickAddBtn"
        );


    const addProvider =
        document.getElementById(
            "quickAddProvider"
        );


    const addService =
        document.getElementById(
            "quickAddService"
        );


    const announcement =
        document.getElementById(
            "quickAnnouncement"
        );


    const exportReports =
        document.getElementById(
            "quickExportReports"
        );


    const manageUsers =
        document.getElementById(
            "quickManageUsers"
        );


    const addServiceButton =
        document.getElementById(
            "addServiceBtn"
        );


    const viewAllUsers =
        document.getElementById(
            "viewAllUsersBtn"
        );


    if (quickAdd) {

        quickAdd.addEventListener(
            "click",
            function () {

                navigateToSection(
                    "providers"
                );

            }
        );

    }


    if (addProvider) {

        addProvider.addEventListener(
            "click",
            function () {

                navigateToSection(
                    "providers"
                );

            }
        );

    }


    if (addService) {

        addService.addEventListener(
            "click",
            function () {

                navigateToSection(
                    "services"
                );

            }
        );

    }


    if (manageUsers) {

        manageUsers.addEventListener(
            "click",
            function () {

                navigateToSection(
                    "customers"
                );

            }
        );

    }


    if (viewAllUsers) {

        viewAllUsers.addEventListener(
            "click",
            function () {

                navigateToSection(
                    "customers"
                );

            }
        );

    }


    if (addServiceButton) {

        addServiceButton.addEventListener(
            "click",
            function () {

                showToast(
                    "Service creation API is not configured yet."
                );

            }
        );

    }


    if (announcement) {

        announcement.addEventListener(
            "click",
            function () {

                showToast(
                    "Announcement backend is not configured yet."
                );

            }
        );

    }


    if (exportReports) {

        exportReports.addEventListener(
            "click",
            function () {

                exportBookingsToCSV();

            }
        );

    }

}


/* =========================================================
   EXPORT BOOKINGS
========================================================= */

function setupExportButton() {

    const button =
        document.getElementById(
            "exportBookingsBtn"
        );


    if (button) {

        button.addEventListener(
            "click",
            exportBookingsToCSV
        );

    }

}


function exportBookingsToCSV() {

    if (!allBookings.length) {

        showToast(
            "There are no booking records to export."
        );

        return;

    }


    const rows = [

        [
            "Booking ID",
            "Customer",
            "Provider",
            "Service",
            "Date",
            "Time",
            "Address",
            "Status",
            "Total Price"
        ]

    ];


    allBookings.forEach(
        function (booking) {

            rows.push([

                booking.id ?? "",

                getCustomerName(
                    booking
                ),

                getProviderNameFromBooking(
                    booking
                ),

                booking.service || "",

                booking.booking_date || "",

                booking.booking_time || "",

                booking.address || "",

                booking.status || "",

                booking.total_price || ""

            ]);

        }
    );


    const csv =
        rows
            .map(
                function (row) {

                    return row
                        .map(
                            function (value) {

                                return `"${String(
                                    value
                                )
                                    .replace(
                                        /"/g,
                                        '""'
                                    )}"`;

                            }
                        )
                        .join(",");

                }
            )
            .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href = url;

    link.download =
        `oneclick-bookings-${getTodayDateString()}.csv`;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );


    showToast(
        "Booking report exported successfully."
    );

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    const sidebarLogout =
        document.querySelector(
            '.nav-link[data-section="logout"]'
        );


    const profileLogout =
        document.getElementById(
            "profileLogout"
        );


    function logout() {

        localStorage.removeItem(
            ACCESS_TOKEN_KEY
        );

        localStorage.removeItem(
            REFRESH_TOKEN_KEY
        );


        window.location.href =
            "login.html";

    }


    if (sidebarLogout) {

        sidebarLogout.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                logout();

            }
        );

    }


    if (profileLogout) {

        profileLogout.addEventListener(
            "click",
            logout
        );

    }

}


/* =========================================================
   BACK TO TOP
========================================================= */

function setupBackToTop() {

    const button =
        document.getElementById(
            "backToTop"
        );


    if (!button) {
        return;
    }


    window.addEventListener(
        "scroll",
        function () {

            if (
                window.scrollY >
                450
            ) {

                button.classList.add(
                    "visible"
                );

            } else {

                button.classList.remove(
                    "visible"
                );

            }

        }
    );


    button.addEventListener(
        "click",
        function () {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );

}


/* =========================================================
   PROVIDER BUTTON EVENTS
========================================================= */

function setupProviderActions() {

    document.addEventListener(
        "click",
        function (event) {

            const approve =
                event.target.closest(
                    "[data-verify-provider]"
                );


            if (approve) {

                const providerId =
                    approve.dataset.verifyProvider;


                verifyProvider(
                    providerId,
                    true
                );

                return;

            }


            const reject =
                event.target.closest(
                    "[data-reject-provider]"
                );


            if (reject) {

                const providerId =
                    reject.dataset.rejectProvider;


                verifyProvider(
                    providerId,
                    false
                );

            }

        }
    );

}


/* =========================================================
   QUICK NOTES EVENT
========================================================= */

function setupNotes() {

    const button =
        document.getElementById(
            "saveNotesBtn"
        );


    if (button) {

        button.addEventListener(
            "click",
            saveQuickNotes
        );

    }

}


/* =========================================================
   UI SETUP
========================================================= */

function setupUI() {

    setupSidebar();

    setupDropdowns();

    setupTheme();

    setupGlobalSearch();

    setupBookingFilter();

    setupQuickActions();

    setupExportButton();

    setupLogout();

    setupBackToTop();

    setupProviderActions();

    setupNotes();

}


/* =========================================================
   HELPERS — USERS
========================================================= */

function getUserFullName(
    user
) {

    if (!user) {
        return "—";
    }


    const fullName =
        [
            user.first_name,
            user.last_name
        ]
        .filter(
            Boolean
        )
        .join(" ")
        .trim();


    return (
        fullName ||
        user.email ||
        "—"
    );

}


/* =========================================================
   HELPERS — BOOKINGS
========================================================= */

function getCustomerName(
    booking
) {

    if (!booking) {
        return "—";
    }


    if (
        booking.customer &&
        typeof booking.customer ===
        "object"
    ) {

        return (
            booking.customer.name ||
            booking.customer.email ||
            "—"
        );

    }


    return (
        booking.customer_name ||
        booking.customer_email ||
        "—"
    );

}


function getProviderNameFromBooking(
    booking
) {

    if (!booking) {
        return "—";
    }


    if (
        booking.provider &&
        typeof booking.provider ===
        "object"
    ) {

        return (
            booking.provider.name ||
            booking.provider.full_name ||
            "—"
        );

    }


    return (
        booking.provider_name ||
        "—"
    );

}


function updateBookingProviderReferences() {

    /*
     * Kept intentionally small.
     * Provider names in bookings are read directly
     * from the admin booking serializer.
     */

}


/* =========================================================
   HELPERS — PROVIDERS
========================================================= */

function getProviderName(
    provider
) {

    if (
        provider &&
        typeof provider ===
        "object"
    ) {

        return (
            provider.full_name ||
            provider.name ||
            provider.email ||
            "—"
        );

    }


    const found =
        allProviders.find(
            item =>
                String(item.id) ===
                String(provider)
        );


    if (found) {

        return (
            found.full_name ||
            "—"
        );

    }


    return (
        provider != null
            ? String(provider)
            : "—"
    );

}


/* =========================================================
   HELPERS — STATUS
========================================================= */

function getStatusBadge(
    status
) {

    const normalized =
        String(
            status || "unknown"
        ).toLowerCase();


    let className =
        "status-pill";


    switch (normalized) {

        case "pending":
            className +=
                " status-pending";
            break;

        case "accepted":
            className +=
                " status-accepted";
            break;

        case "completed":
            className +=
                " status-completed";
            break;

        case "cancelled":
            className +=
                " status-cancelled";
            break;

        case "rejected":
            className +=
                " status-rejected";
            break;

        default:
            className +=
                " status-pill-neutral";

    }


    return `
        <span class="${className}">
            ${escapeHTML(
                formatStatus(
                    normalized
                )
            )}
        </span>
    `;

}


function getUserStatusBadge(
    active
) {

    return `
        <span class="status-pill ${
            active
                ? "status-active"
                : "status-inactive"
        }">
            ${active
                ? "Active"
                : "Inactive"}
        </span>
    `;

}


/* =========================================================
   HELPERS — ROLE
========================================================= */

function getRoleBadge(
    role
) {

    const normalized =
        String(
            role || "unknown"
        ).toLowerCase();


    let className =
        "role-badge";


    if (
        normalized ===
        "customer"
    ) {

        className +=
            " role-customer";

    } else if (
        normalized ===
        "provider"
    ) {

        className +=
            " role-provider";

    } else if (
        normalized ===
        "admin"
    ) {

        className +=
            " role-admin";

    } else {

        className +=
            " status-pill-neutral";

    }


    return `
        <span class="${className}">
            ${escapeHTML(
                formatRole(
                    normalized
                )
            )}
        </span>
    `;

}


function formatRole(
    role
) {

    if (!role) {
        return "Unknown";
    }


    return String(role)
        .charAt(0)
        .toUpperCase() +
        String(role)
            .slice(1)
            .toLowerCase();

}


/* =========================================================
   HELPERS — STATUS TEXT
========================================================= */

function formatStatus(
    status
) {

    if (!status) {
        return "Unknown";
    }


    return String(status)
        .replace(
            /_/g,
            " "
        )
        .replace(
            /\b\w/g,
            character =>
                character.toUpperCase()
        );

}


/* =========================================================
   HELPERS — CURRENCY
========================================================= */

function formatCurrency(
    value
) {

    const number =
        getNumericValue(
            value
        );


    return (
        "Rs. " +
        number.toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        )
    );

}


function getNumericValue(
    value
) {

    const number =
        Number(
            value
        );


    return Number.isFinite(
        number
    )
        ? number
        : 0;

}


/* =========================================================
   HELPERS — NUMBERS
========================================================= */

function formatNumber(
    value
) {

    return Number(
        value || 0
    ).toLocaleString(
        "en-IN"
    );

}


/* =========================================================
   HELPERS — DATES
========================================================= */

function parseDate(
    value
) {

    if (!value) {
        return null;
    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return date;

}


function parseDateTime(
    dateValue,
    timeValue
) {

    if (!dateValue) {
        return null;
    }


    const combined =
        timeValue
            ? `${dateValue}T${timeValue}`
            : dateValue;


    const date =
        new Date(
            combined
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return date;

}


function formatDate(
    value
) {

    const date =
        parseDate(
            value
        );


    if (!date) {
        return "—";
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


function formatTime(
    value
) {

    if (!value) {
        return "—";
    }


    const parts =
        String(value)
            .split(":");


    if (
        parts.length <
        2
    ) {

        return String(value);

    }


    let hour =
        Number(
            parts[0]
        );


    const minute =
        parts[1];


    const suffix =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12 ||
        12;


    return `
        ${hour}:${minute}
        ${suffix}
    `;

}


function formatDateTime(
    value
) {

    const date =
        parseDate(
            value
        );


    if (!date) {
        return "—";
    }


    return date.toLocaleString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


function getTodayDateString() {

    const date =
        new Date();


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        `${year}-${month}-${day}`
    );

}


/* =========================================================
   HELPERS — MONTHS
========================================================= */

function getLastSixMonths() {

    const months = [];

    const now =
        new Date();


    for (
        let i = 5;
        i >= 0;
        i--
    ) {

        const date =
            new Date(
                now.getFullYear(),
                now.getMonth() - i,
                1
            );


        months.push({

            year:
                date.getFullYear(),

            month:
                date.getMonth(),

            label:
                date.toLocaleDateString(
                    "en-US",
                    {
                        month: "short"
                    }
                )

        });

    }


    return months;

}


/* =========================================================
   HELPERS — STARS
========================================================= */

function renderStars(
    rating
) {

    const numericRating =
        Math.max(
            0,
            Math.min(
                5,
                Number(
                    rating
                ) || 0
            )
        );


    let output = "";


    for (
        let i = 1;
        i <= 5;
        i++
    ) {

        if (
            numericRating >= i
        ) {

            output +=
                '<i class="fa-solid fa-star"></i>';

        } else if (
            numericRating >=
            i - 0.5
        ) {

            output +=
                '<i class="fa-solid fa-star-half-stroke"></i>';

        } else {

            output +=
                '<i class="fa-regular fa-star"></i>';

        }

    }


    return output;

}


/* =========================================================
   HELPERS — SERVICE ICONS
========================================================= */

function getServiceIcon(
    serviceName
) {

    const name =
        String(
            serviceName || ""
        ).toLowerCase();


    if (
        name.includes(
            "car"
        )
    ) {

        return "fa-solid fa-car";

    }


    if (
        name.includes(
            "clean"
        )
    ) {

        return "fa-solid fa-broom";

    }


    if (
        name.includes(
            "electric"
        )
    ) {

        return "fa-solid fa-bolt";

    }


    if (
        name.includes(
            "plumb"
        )
    ) {

        return "fa-solid fa-faucet";

    }


    if (
        name.includes(
            "repair"
        )
    ) {

        return "fa-solid fa-screwdriver-wrench";

    }


    return "fa-solid fa-wrench";

}


/* =========================================================
   HELPERS — INITIALS
========================================================= */

function getInitials(
    value
) {

    if (!value) {
        return "A";
    }


    const words =
        String(value)
            .trim()
            .split(
                /\s+/
            )
            .filter(Boolean);


    if (!words.length) {
        return "A";
    }


    if (words.length === 1) {

        return words[0]
            .substring(
                0,
                2
            )
            .toUpperCase();

    }


    return (
        words[0][0] +
        words[1][0]
    ).toUpperCase();

}


/* =========================================================
   HELPERS — MEDIA
========================================================= */

function normalizeMediaUrl(
    value
) {

    if (!value) {
        return "";
    }


    if (
        value.startsWith(
            "http://"
        ) ||
        value.startsWith(
            "https://"
        )
    ) {

        return value;

    }


    if (
        value.startsWith(
            "/"
        )
    ) {

        return (
            "http://127.0.0.1:8000" +
            value
        );

    }


    return (
        "http://127.0.0.1:8000/media/" +
        value
    );

}


/* =========================================================
   HELPERS — HTML SAFETY
========================================================= */

function escapeHTML(
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


function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    const existing =
        document.querySelector(
            ".oneclick-toast"
        );


    if (existing) {

        existing.remove();

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        "oneclick-toast";


    toast.style.position =
        "fixed";

    toast.style.right =
        "20px";

    toast.style.bottom =
        "20px";

    toast.style.zIndex =
        "9999";

    toast.style.padding =
        "12px 16px";

    toast.style.borderRadius =
        "10px";

    toast.style.background =
        type === "error"
            ? "#e74c3c"
            : "#27ae60";

    toast.style.color =
        "#ffffff";

    toast.style.fontFamily =
        "Poppins, sans-serif";

    toast.style.fontSize =
        "11px";

    toast.style.fontWeight =
        "600";

    toast.style.boxShadow =
        "0 10px 30px rgba(0,0,0,.18)";


    toast.textContent =
        message;


    document.body.appendChild(
        toast
    );


    setTimeout(
        function () {

            toast.remove();

        },
        3000
    );

}


/* =========================================================
   GLOBAL ERROR
========================================================= */

function showGlobalError(
    message
) {

    const main =
        document.querySelector(
            ".page-content"
        );


    if (!main) {
        return;
    }


    const error =
        document.createElement(
            "div"
        );


    error.className =
        "not-configured-card";


    error.style.marginBottom =
        "20px";


    error.innerHTML = `

        <i class="fa-solid fa-triangle-exclamation"></i>

        <h3>
            Dashboard Loading Error
        </h3>

        <p>
            ${escapeHTML(
                message
            )}
        </p>

    `;


    main.prepend(
        error
    );

}


/* =========================================================
   WINDOW RESIZE — REDRAW CHARTS
========================================================= */

let chartResizeTimer = null;


window.addEventListener(
    "resize",
    function () {

        clearTimeout(
            chartResizeTimer
        );


        chartResizeTimer =
            setTimeout(
                function () {

                    renderAnalytics();

                },
                200
            );

    }
);


/* =========================================================
   KEYBOARD ESCAPE
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
            "Escape"
        ) {

            closeSidebar();


            document
                .querySelectorAll(
                    ".topbar-dropdown.open"
                )
                .forEach(
                    function (dropdown) {

                        dropdown.classList.remove(
                            "open"
                        );

                    }
                );


            const results =
                document.getElementById(
                    "searchResults"
                );


            if (results) {

                results.classList.remove(
                    "active"
                );

            }

        }

    }
);