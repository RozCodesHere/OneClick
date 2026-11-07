const API_BASE = "http://127.0.0.1:8000/api";

document.addEventListener("DOMContentLoaded", () => {
    initializePage();
});


// ===============================
// AUTH
// ===============================

function getAccessToken() {
    return localStorage.getItem("access_token");
}


// ===============================
// INITIALIZE
// ===============================

async function initializePage() {

    const token = getAccessToken();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    setupSidebar();
    setupLogout();
    setActiveNav();

    await loadProviderInfo();
    await loadCompletedJobs();
}


// ===============================
// PROVIDER INFO
// ===============================

async function loadProviderInfo() {

    const token = getAccessToken();

    try {

        const response = await fetch(
            `${API_BASE}/providers/dashboard/`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load provider information");
        }

        const data = await response.json();

        const provider = data.provider || data;

        const providerNameElement =
            document.getElementById("providerName");

        if (providerNameElement) {

            providerNameElement.textContent =
                provider.full_name ||
                provider.name ||
                "Provider";
        }

        window.oneClickProvider = provider;

    } catch (error) {

        console.error(
            "Provider info error:",
            error
        );
    }
}


// ===============================
// LOAD COMPLETED JOBS
// ===============================

async function loadCompletedJobs() {

    const container =
        document.getElementById("completedJobsContainer");

    if (!container) return;

    const token = getAccessToken();

    try {

        const response = await fetch(
            `${API_BASE}/bookings/provider/`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load completed jobs");
        }

        const data = await response.json();

        const bookings = Array.isArray(data)
            ? data
            : (data.results || []);

        renderCompletedJobs(bookings);

    } catch (error) {

        console.error(
            "Completed jobs error:",
            error
        );

        container.innerHTML = `
            <div class="empty-state">

                <i class="fas fa-exclamation-circle"></i>

                <h4>Unable to load completed jobs</h4>

                <p>
                    Please refresh the page and try again.
                </p>

            </div>
        `;
    }
}


// ===============================
// RENDER COMPLETED JOBS
// ===============================

function renderCompletedJobs(bookings) {

    const container =
        document.getElementById("completedJobsContainer");

    const countElement =
        document.getElementById("completedCount");

    if (!container) return;

    const completedJobs = bookings.filter(booking => {

        const status =
            String(
                booking.status || ""
            ).toLowerCase();

        return status === "completed";
    });


    if (countElement) {
        countElement.textContent =
            completedJobs.length;
    }


    // Newest completed jobs first
    completedJobs.sort((a, b) => {

        const dateA =
            a.booking_date ||
            a.bookingDate ||
            a.date ||
            "";

        const dateB =
            b.booking_date ||
            b.bookingDate ||
            b.date ||
            "";

        return String(dateB)
            .localeCompare(String(dateA));
    });


    if (completedJobs.length === 0) {

        container.innerHTML = `
            <div class="empty-state">

                <i class="fas fa-check-circle"></i>

                <h4>No completed jobs yet</h4>

                <p>
                    Your completed service jobs will appear here.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML =
        completedJobs
            .map(createCompletedJobCard)
            .join("");
}


// ===============================
// COMPLETED JOB CARD
// ===============================

function createCompletedJobCard(booking) {

    const serviceName =
        booking.service_name ||
        booking.service ||
        "Service";

    const customerName =
        booking.customer_name ||
        booking.customer ||
        "Customer";

    const bookingDate =
        booking.booking_date ||
        booking.bookingDate ||
        booking.date ||
        "";

    const bookingTime =
        booking.booking_time ||
        booking.bookingTime ||
        "Time not specified";

    const address =
        booking.address ||
        "Address not provided";

    const totalPrice =
        booking.total_price ??
        booking.totalPrice ??
        booking.price ??
        booking.service_price ??
        null;


    const priceDisplay =
        totalPrice !== null &&
        totalPrice !== undefined &&
        totalPrice !== ""
            ? `Rs. ${escapeHtml(String(totalPrice))}`
            : "Price not available";


    return `
        <div class="completed-job-item">

            <div class="completed-job-icon">

                <i class="fas fa-check"></i>

            </div>


            <div class="completed-job-details">

                <div class="completed-job-header">

                    <div>

                        <h5>
                            ${escapeHtml(String(serviceName))}
                        </h5>

                        <span class="completed-status">
                            <i class="fas fa-check-circle"></i>
                            Completed
                        </span>

                    </div>

                    <strong class="job-price">
                        ${priceDisplay}
                    </strong>

                </div>


                <div class="job-info-grid">

                    <div>
                        <i class="fas fa-user"></i>

                        <span>
                            ${escapeHtml(String(customerName))}
                        </span>
                    </div>


                    <div>
                        <i class="fas fa-calendar"></i>

                        <span>
                            ${formatDisplayDate(bookingDate)}
                        </span>
                    </div>


                    <div>
                        <i class="far fa-clock"></i>

                        <span>
                            ${escapeHtml(String(bookingTime))}
                        </span>
                    </div>


                    <div>
                        <i class="fas fa-map-marker-alt"></i>

                        <span>
                            ${escapeHtml(String(address))}
                        </span>
                    </div>

                </div>

            </div>

        </div>
    `;
}


// ===============================
// SIDEBAR
// ===============================

function setupSidebar() {

    const toggle =
        document.getElementById("sidebarToggle");

    const sidebar =
        document.querySelector(".sidebar");

    if (!toggle || !sidebar) return;

    toggle.addEventListener("click", () => {

        sidebar.classList.toggle("active");

    });
}


// ===============================
// ACTIVE NAV
// ===============================

function setActiveNav() {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop();

    document
        .querySelectorAll(".nav-link")
        .forEach(link => {

            const href =
                link.getAttribute("href");

            if (!href) return;

            const linkPage =
                href
                    .split("/")
                    .pop()
                    .split("#")[0];

            link.classList.remove("active");

            if (linkPage === currentPage) {
                link.classList.add("active");
            }

        });
}


// ===============================
// LOGOUT
// ===============================

function setupLogout() {

    const logoutLink =
        document.getElementById("logoutBtn");

    if (!logoutLink) return;

    logoutLink.addEventListener(
        "click",
        event => {

            event.preventDefault();

            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");

            window.location.href =
                "login.html";
        }
    );
}


// ===============================
// DATE
// ===============================

function formatDisplayDate(dateValue) {

    if (!dateValue) {
        return "Date not available";
    }

    const normalized =
        String(dateValue).substring(0, 10);

    const date =
        new Date(`${normalized}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return String(dateValue);
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


// ===============================
// HTML SAFETY
// ===============================

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
