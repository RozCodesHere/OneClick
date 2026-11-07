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

    loadMyServiceRequests();

    loadRecommendedProviders(false);

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

        /* ---------- Avatar ---------- */

const avatar =
    document.getElementById(
        "customerAvatar"
    );

if (avatar) {

    if (user.profile_picture) {

        const imageUrl =
            user.profile_picture.startsWith("http")
                ? user.profile_picture
                : `http://127.0.0.1:8000${user.profile_picture}`;

        avatar.innerHTML = "";

        const img =
            document.createElement("img");

        img.src = imageUrl;
        img.alt = fullName || "User";

        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        img.style.borderRadius = "50%";

        avatar.appendChild(img);

    } else {

        avatar.textContent =
            firstName
                .charAt(0)
                .toUpperCase();

    }

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

       let services = [];

if (Array.isArray(data)) {

    services = data;

} else if (Array.isArray(data.results)) {

    services = data.results;

    // Load remaining service pages
    let nextUrl = data.next;

    while (nextUrl) {

        const nextResponse =
            await fetch(nextUrl);

        if (!nextResponse.ok) {
            break;
        }

        const nextData =
            await nextResponse.json();

        if (Array.isArray(nextData.results)) {

            services =
                services.concat(
                    nextData.results
                );

        }

        nextUrl =
            nextData.next;

    }

}

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
    <div class="oc-booking-state">
        <i class="fa-regular fa-calendar-xmark"></i>
        <strong>No bookings found</strong>
        <span>Your recent bookings will appear here.</span>
    </div>
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
    [...bookings].sort(compareBookings);

        const visibleBookings = sortedBookings.slice(0, 3);

tableBody.innerHTML =
    visibleBookings.map(createBookingRow).join("");

if (sortedBookings.length > 3) {
    tableBody.innerHTML += `
        <button
            type="button"
            class="btn btn-outline-primary btn-sm mt-3"
            id="seeMoreBookingsBtn"
        >
            See More
            <i class="fa-solid fa-chevron-down ms-1"></i>
        </button>
    `;
}
let bookingsExpanded = false;

function renderBookings() {
    const visibleBookings = bookingsExpanded
        ? sortedBookings
        : sortedBookings.slice(0, 3);

    tableBody.innerHTML =
        visibleBookings.map(createBookingRow).join("");

    if (sortedBookings.length > 3) {
        tableBody.innerHTML += `
            <button
                type="button"
                class="btn btn-outline-primary btn-sm mt-3"
                id="seeMoreBookingsBtn"
            >
                ${bookingsExpanded ? "See Less" : "See More"}
                <i class="fa-solid fa-chevron-${bookingsExpanded ? "up" : "down"} ms-1"></i>
            </button>
        `;
    }

    refreshAOS();
}

renderBookings();

tableBody.addEventListener("click", function (event) {
    if (event.target.closest("#seeMoreBookingsBtn")) {
        bookingsExpanded = !bookingsExpanded;
        renderBookings();
    }
});

        refreshAOS();

    }

    catch (error) {

        console.error(
            "Error loading bookings:",
            error
        );

        tableBody.innerHTML = `
    <div class="oc-booking-state">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <strong>Unable to load bookings</strong>
        <span>Please check your API connection.</span>
    </div>
`;

    }

}


/* =========================================================
   LOAD MY SERVICE REQUESTS
   ========================================================= */

async function loadMyServiceRequests() {
    const container = document.getElementById(
        "myServiceRequestsBody"
    );

    if (!container) return;

    container.innerHTML = `
        <div class="text-center py-4">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span class="ms-2">Loading service requests...</span>
        </div>
    `;

    try {
        const response = await fetch(
            `${API_BASE}/services/requests/`,
            {
                method: "GET",
                headers: getHeaders()
            }
        );

        if (!response.ok) {
            throw new Error(
                `Service requests API error: ${response.status}`
            );
        }

        const responseData = await response.json();

        const requests = Array.isArray(responseData)
            ? responseData
            : Array.isArray(responseData.results)
                ? responseData.results
                : [];

        if (requests.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fa-regular fa-clipboard fa-2x mb-2"></i>
                    <strong class="d-block">No service requests yet</strong>
                    <span>Requests you submit will appear here.</span>
                </div>
            `;
            return;
        }

        const allRequestCardsHTML = requests.map(request => {
            const service = request.service;
            
            const serviceId =
    service && typeof service === "object"
        ? service.id
        : service || request.service_id;
            const serviceName =
                request.service_name ||
                (service && typeof service === "object"
                    ? service.name || service.title
                    : null) ||
                (typeof service === "number"
                    ? `Service #${service}`
                    : service) ||
                "Service request";

            const status = String(
                request.status || "pending"
            ).replace(/_/g, " ");

            const description = request.description || "";
            const address = request.address || "";

            const escapeHTML = value =>
                String(value).replace(/[&<>"']/g, char => ({
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;"
                }[char]));


return `
<article class="oc-request-card" data-request-id="${escapeHTML(request.id)}">
        <div class="oc-request-icon">
            <i class="fa-solid fa-screwdriver-wrench"></i>
        </div>

        <div class="oc-request-details">
            <h3>${escapeHTML(serviceName)}</h3>

            <p class="oc-request-description">
                ${escapeHTML(description || "No description provided.")}
            </p>

            ${address ? `
                <p class="oc-request-address">
                    <i class="fa-solid fa-location-dot"></i>
                    ${escapeHTML(address)}
                </p>
            ` : ""}
        </div>

        <aside class="oc-request-status pending">
            <span class="oc-request-status-label">Request status</span>
            <strong>
                <i class="fa-solid fa-clock"></i>
                ${escapeHTML(status)}
            </strong>
        </aside>

<button
    type="button"
    class="btn btn-outline-primary btn-sm mt-2"
    onclick="viewServiceRequestDetails(${Number(request.id)})"
>
    View Details
    <i class="fa-solid fa-arrow-right ms-1"></i>
</button>


</article>
`;


        });

       let requestsExpanded = false;

function renderRequests() {
    const visibleRequests = requestsExpanded
        ? allRequestCardsHTML
        : allRequestCardsHTML.slice(0, 3);

    container.innerHTML = visibleRequests.join("");

    if (allRequestCardsHTML.length > 3) {
        container.innerHTML += `
            <button
                type="button"
                class="btn btn-outline-primary btn-sm mt-3"
                id="seeMoreRequestsBtn"
            >
                ${requestsExpanded ? "See Less" : "See More"}
                <i class="fa-solid fa-chevron-${requestsExpanded ? "up" : "down"} ms-1"></i>
            </button>
        `;
    }

    refreshAOS();
}

renderRequests();

container.onclick = function (event) {
    if (event.target.closest("#seeMoreRequestsBtn")) {
        requestsExpanded = !requestsExpanded;
        renderRequests();
    }
};

    } catch (error) {
        console.error("Error loading service requests:", error);

        container.innerHTML = `
            <div class="alert alert-warning mb-0">
                Unable to load service requests.
                Please refresh the page and try again.
            </div>
        `;
    }
}

async function cancelServiceRequest(requestId) {
    const confirmed = window.confirm(
        "Are you sure you want to cancel this service request?"
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE}/services/requests/${requestId}/cancel/`,
            {
                method: "PATCH",
                headers: getHeaders()
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.detail || `Cancellation failed (${response.status}).`
            );
        }

        alert("Your service request has been cancelled.");

        await loadMyServiceRequests();

    } catch (error) {
        console.error("Error cancelling service request:", error);

        alert(
            error.message ||
            "Unable to cancel this request. Please try again."
        );
    }
}

window.deleteServiceRequest = async function (requestId) {
    const confirmed = window.confirm(
        "Are you sure you want to permanently delete this cancelled service request?"
    );

    if (!confirmed) return;

    try {
        const response = await fetch(
            `${API_BASE}/services/requests/${requestId}/`,
            {
                method: "DELETE",
                headers: getHeaders()
            }
        );

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));

            throw new Error(
                data.detail || `Delete failed (${response.status}).`
            );
        }

        alert("Cancelled service request deleted successfully.");

        await loadMyServiceRequests();

    } catch (error) {
        console.error("Error deleting service request:", error);

        alert(
            error.message ||
            "Unable to delete this request. Please try again."
        );
    }
};





/* =========================================================
   VIEW SERVICE REQUEST DETAILS & NEARBY PROVIDERS
   ========================================================= */


async function viewServiceRequestDetails(requestId) {
    const modalElement = document.getElementById(
        "serviceRequestDetailsModal"
    );

    const contentElement = document.getElementById(
        "serviceRequestDetailsContent"
    );

    if (!modalElement || !contentElement) {
        console.error("Service request details modal was not found.");
        return;
    }

    contentElement.innerHTML = `
        <div class="text-center py-5">
            <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
            <p class="mt-3">Loading request details...</p>
        </div>
    `;

    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();

    try {
        const response = await fetch(
            `${API_BASE}/services/requests/`,
            {
                method: "GET",
                headers: getHeaders()
            }
        );

        if (!response.ok) {
            throw new Error(
                `Service requests API error: ${response.status}`
            );
        }

        const responseData = await response.json();

        const requests = Array.isArray(responseData)
            ? responseData
            : Array.isArray(responseData.results)
                ? responseData.results
                : [];

        const request = requests.find(
            item => Number(item.id) === Number(requestId)
        );

        if (!request) {
            throw new Error("Service request not found.");
        }

        const escapeHTML = value =>
            String(value ?? "").replace(/[&<>"']/g, char => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[char]));

        const service = request.service;
        const serviceId =
    service && typeof service === "object"
        ? service.id
        : request.service_id ??
          (typeof service === "number" ? service : null);
        const serviceName =
            request.service_name ||
            (service && typeof service === "object"
                ? service.name || service.title
                : null) ||
            (typeof service === "number"
                ? `Service #${service}`
                : service) ||
            "Service request";

        contentElement.innerHTML = `
            <section class="mb-4">
                <h6 class="fw-bold">Your Request</h6>

                <p class="mb-2">
                    <strong>Service:</strong>
                    ${escapeHTML(serviceName)}
                </p>

               <p class="mb-2">
    <strong>Description:</strong>
    ${escapeHTML(request.description || "No description provided.")}
</p>

<p class="mb-2">
    <strong>Address:</strong>
    ${escapeHTML(request.address || "No address provided.")}
</p>

<p class="mb-2">
    <strong>Preferred Date:</strong>
    ${escapeHTML(request.preferred_date || "Not specified")}
</p>

<p class="mb-2">
    <strong>Preferred Time:</strong>
    ${escapeHTML(request.preferred_time || "Not specified")}
</p>

<p class="mb-2">
    <strong>Status:</strong>
    ${escapeHTML(request.status || "Pending")}
</p>

<p class="mb-0">
    <strong>Request ID:</strong>
    #${escapeHTML(request.id)}
</p>
            </section>

            <hr>

            <section>
                <h6 class="fw-bold mb-3">
                    <i class="fa-solid fa-location-dot me-2"></i>
                    Nearby Providers
                </h6>

                <div class="mb-3">
    <label for="requestProviderRadius" class="form-label">
        Search radius
    </label>

    <select id="requestProviderRadius" class="form-select">
        <option value="3">Within 3 km</option>
        <option value="5" selected>Within 5 km</option>
        <option value="20">Within 20 km</option>
        <option value="100">Within 100 km</option>
    </select>
</div>

<div id="requestNearbyProviders">
    <p class="text-muted mb-0">
        Preparing nearby provider search...
    </p>
</div>
            </section>
        `;

        const latitude = Number(request.latitude);
        const longitude = Number(request.longitude);

        if (
            request.latitude == null ||
            request.longitude == null ||
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
        ) {
            document.getElementById("requestNearbyProviders").innerHTML = `
                <div class="alert alert-warning mb-0">
                    This request does not have valid map coordinates.
                </div>
            `;
            return;
        }

        console.log("Selected request location:", {
            requestId: request.id,
            latitude,
            longitude
        });

       // Show providers inside this request's modal only.
const nearbyContainer = contentElement.querySelector(
    "#requestNearbyProviders"
);

console.log("Nearby container found:", Boolean(nearbyContainer));

await loadRequestNearbyProviders(
    latitude,
    longitude,
    nearbyContainer,
    serviceId,
   {
    address: request.address || "",
    latitude: latitude,
    longitude: longitude,
    date: request.preferred_date || "",
    time: request.preferred_time || ""
}
);
const radiusInput = document.getElementById("requestProviderRadius");

if (radiusInput) {
    radiusInput.onchange = () => {
       loadRequestNearbyProviders(
    latitude,
    longitude,
    nearbyContainer,
    serviceId,
    {
        address: request.address || "",
        latitude: latitude,
        longitude: longitude
    }
);
    };
}
    } catch (error) {
        console.error("Failed to load request details:", error);

        contentElement.innerHTML = `
            <div class="alert alert-danger mb-0">
                Unable to load request details.
                Please close this window and try again.
            </div>
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
   CREATE BOOKING CARD
   ========================================================= */

function createBookingRow(booking) {

    const bookingId =
        booking.id ?? "N/A";

    const serviceName =
        booking.service_name || "Service";

    const providerName =
        booking.provider_name || "Provider";

    const address =
        booking.address || "Address not provided";

    

    const price =
        formatBookingPrice(booking.total_price);

    const status =
        booking.status || "pending";

    const initials =
        getInitials(providerName);

    const statusInfo =
        getStatusInfo(status);

    const normalizedStatus =
        String(status).trim().toLowerCase();

    let cancelButton = "";
    let deleteButton = "";
    let trackButton = "";

// Show tracking only while the provider is on the way.
if (normalizedStatus === "in_progress") {
    trackButton = `
        <button
            type="button"
            class="oc-row-action oc-track-provider"
            data-booking-id="${escapeHtml(bookingId)}"
        >
            <i class="fa-solid fa-location-crosshairs"></i>
            <span>Track Provider</span>
        </button>
    `;
}

    // Cancel is available for pending or accepted bookings.
    if (
        normalizedStatus === "pending" ||
        normalizedStatus === "accepted"
    ) {
        cancelButton = `
            <button
                type="button"
                class="oc-row-action oc-cancel-booking"
                title="Cancel booking"
                aria-label="Cancel booking ${escapeHtml(bookingId)}"
                data-booking-id="${escapeHtml(bookingId)}"
            >
                <i class="fa-solid fa-xmark"></i>
                <span>Cancel</span>
            </button>
        `;
    }

    // Delete is available only for cancelled or rejected bookings.
    if (
        normalizedStatus === "cancelled" ||
        normalizedStatus === "rejected"
    ) {
        deleteButton = `
            <button
                type="button"
                class="oc-row-action oc-delete-booking"
                title="Delete booking"
                aria-label="Delete booking ${escapeHtml(bookingId)}"
                data-booking-id="${escapeHtml(bookingId)}"
            >
                <i class="fa-solid fa-trash"></i>
                <span>Delete</span>
            </button>
        `;
    }

    return `
        <article
            class="oc-booking-card"
            data-aos="fade-up"
            data-booking-id="${escapeHtml(bookingId)}"
        >

            <div class="oc-booking-card-top">

                <div class="oc-booking-card-service">

                    <span class="oc-booking-id">
                        #${escapeHtml(bookingId)}
                    </span>

                    <h3 class="oc-booking-service">
                        ${escapeHtml(serviceName)}
                    </h3>

                </div>

                <span class="oc-badge ${statusInfo.className}">
                    <i class="${statusInfo.icon}"></i>
                    ${escapeHtml(statusInfo.text)}
                </span>

            </div>

            <div class="oc-booking-card-provider">

                <span class="oc-table-avatar">
                    ${escapeHtml(initials)}
                </span>

                <div>
                    <strong>
                        ${escapeHtml(providerName)}
                    </strong>

                    <small>Service Provider</small>
                </div>

            </div>

            <div class="oc-booking-card-details">

                <div class="oc-booking-detail">

                    <i class="fa-solid fa-location-dot"></i>

                    <div>
                        <small>Location</small>

                        <span
                            class="oc-booking-address"
                            title="${escapeHtml(address)}"
                        >
                            ${escapeHtml(address)}
                        </span>
                    </div>

                </div>

                <div class="oc-booking-detail">

                    <i class="fa-regular fa-calendar"></i>

                    <div>
                        <small>Booking Date</small>

                        <strong>
    ${escapeHtml(booking.booking_date || booking.bookingDate || booking.date || "Not set")}
</strong>

<span>
    ${escapeHtml(booking.booking_time || booking.bookingTime || booking.time || "Not set")}
</span>
                    </div>

                </div>

            </div>

            <div class="oc-booking-card-footer">

                <div class="oc-booking-card-price">
                    <small>Total Price</small>

                    <strong class="oc-booking-price">
                        ${escapeHtml(price)}
                    </strong>
                </div>

               <div class="oc-booking-card-actions">

    ${trackButton}

                    <button
                        type="button"
                        class="oc-row-action"
                        title="View booking"
                        aria-label="View booking ${escapeHtml(bookingId)}"
                        data-booking-id="${escapeHtml(bookingId)}"
                    >
                        <span>View Details</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>

                </div>

            </div>

        </article>
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
             * DELETE BOOKING
             * -------------------------------------------------
             */

            if (
                bookingButton.classList.contains(
                    "oc-delete-booking"
                )
            ) {

                event.preventDefault();

                deleteCustomerBooking(bookingId);

                return;
            }

/*
 * -------------------------------------------------
 * TRACK PROVIDER
 * -------------------------------------------------
 */

if (
    bookingButton.classList.contains(
        "oc-track-provider"
    )
) {

    event.preventDefault();

    window.location.href =
        `booking-details.html?id=${encodeURIComponent(bookingId)}&track=true`;

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
   DELETE CUSTOMER BOOKING
   ========================================================= */

async function deleteCustomerBooking(bookingId) {

    const confirmed = window.confirm(
        "Permanently delete this cancelled or rejected booking?"
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE}/bookings/${bookingId}/`,
            {
                method: "DELETE",
                headers: {
                    "Authorization":
                        "Bearer " +
                        localStorage.getItem("access_token")
                }
            }
        );

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));

            alert(
                data.error ||
                data.detail ||
                "Unable to delete the booking."
            );

            return;
        }

        alert("Booking deleted successfully.");

        await loadRecentBookings();

    } catch (error) {
        console.error("Booking deletion error:", error);

        alert("Unable to delete the booking. Please try again.");
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
   LOAD RECOMMENDED PROVIDERS — LOCATION MATCHING
========================================================= */

async function loadRecommendedProviders(
    searchNearby = false,
    requestLatitude = null,
    requestLongitude = null
) {
    const grid = document.getElementById("providersGrid");
    if (!grid) return;

    // Load providers matching the customer's saved location.
    async function loadLocationProviders(message) {

        let customer = window.oneClickCustomer;

        // Fetch customer information if it is not already available.
        if (
            !customer ||
            !customer.country ||
            !customer.province ||
            !customer.district ||
            !customer.city
        ) {
            const userResponse = await fetch(
                `${API_BASE}/users/me/`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );

            if (
                userResponse.status === 401 ||
                userResponse.status === 403
            ) {
                logoutUser();
                return;
            }

            if (!userResponse.ok) {
                throw new Error("Unable to load customer location.");
            }

            customer = await userResponse.json();
            window.oneClickCustomer = customer;
        }

        const location = {
            country: customer.country?.trim(),
            province: customer.province?.trim(),
            district: customer.district?.trim(),
            city: customer.city?.trim()
        };

        // Require a complete location for exact matching.
       if (
    !location.country ||
    !location.province ||
    !location.district
) {
            grid.innerHTML = `
                <div class="col-12">
                    <div class="oc-loading-state">
                        <i class="fa-solid fa-location-dot"></i>
                        <p>Please save your complete service location
                        to see providers available in your area.</p>
                    </div>
                </div>
            `;
            return;
        }

        const params = new URLSearchParams({
    country: location.country,
    province: location.province,
    district: location.district
});

// Only filter by city when the customer has selected one.
if (location.city) {
    params.set("city", location.city);
}

        const response = await fetch(
            `${API_BASE}/providers/?${params.toString()}`,
            {
                method: "GET",
                headers: getHeaders()
            }
        );

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            logoutUser();
            return;
        }

        if (!response.ok) {
            throw new Error(
                `Location providers API error: ${response.status}`
            );
        }

        const data = await response.json();

        const providers = Array.isArray(data.results)
            ? data.results
            : Array.isArray(data)
                ? data
                : [];

        window.oneClickProviders = providers;

        console.log("Customer location:", location);
        console.log("Location-matched providers:", providers);

        if (providers.length === 0) {
            renderProviderResults(
                [],
                `No providers are currently available in ${location.city}, ${location.district}.`
            );
            return;
        }

        renderProviderResults(
            providers,
            message ||
            `Verified providers available in ${location.city}, ${location.district}`
        );
    }


    // Normal dashboard: show providers matching the customer's location.
    if (!searchNearby) {
        try {
            await loadLocationProviders(
                "Verified providers in your selected service area"
            );
        } catch (error) {
            console.error(
                "Location provider search failed:",
                error
            );

            grid.innerHTML = `
                <div class="col-12">
                    <div class="oc-loading-state">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        Unable to load providers. Please try again.
                    </div>
                </div>
            `;
        }

        return;
    }


    // Nearby search: preserve your existing GPS feature.
    try {

        grid.innerHTML = `
            <div class="col-12">
                <div class="oc-loading-state">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Finding nearby providers...
                </div>
            </div>
        `;

        let latitude =
            requestLatitude ?? window.customerLatitude;

        let longitude =
            requestLongitude ?? window.customerLongitude;

        if (latitude == null || longitude == null) {

            if (!navigator.geolocation) {
                await loadLocationProviders();
                return;
            }

            const position = await new Promise(
                (resolve, reject) => {

                    navigator.geolocation.getCurrentPosition(
                        resolve,
                        reject,
                        {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 60000
                        }
                    );

                }
            );

            latitude = position.coords.latitude;
            longitude = position.coords.longitude;

            window.customerLatitude = latitude;
            window.customerLongitude = longitude;
        }

        const radiusInput =
            document.getElementById("requestProviderRadius");

        const allowedRadii = [3, 5, 20, 100];

        const selectedRadius = radiusInput
            ? Number(radiusInput.value)
            : 5;

        const radius = allowedRadii.includes(selectedRadius)
            ? selectedRadius
            : 5;

        const params = new URLSearchParams({
            latitude: Number(latitude).toFixed(6),
            longitude: Number(longitude).toFixed(6),
            radius: String(radius)
        });

        const response = await fetch(
            `${API_BASE}/providers/nearby/?${params.toString()}`,
            {
                method: "GET",
                headers: getHeaders()
            }
        );

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            logoutUser();
            return;
        }

        if (!response.ok) {
            throw new Error(
                `Nearby providers API error: ${response.status}`
            );
        }

        const data = await response.json();

        const providers = Array.isArray(data.results)
            ? data.results
            : Array.isArray(data)
                ? data
                : [];

        window.oneClickProviders = providers;

        if (providers.length === 0) {
            renderProviderResults(
                [],
                `No available providers found within ${radius} km.`
            );
            return;
        }

        renderProviderResults(
            providers,
            `Verified providers within ${radius} km, nearest first`
        );

    } catch (error) {

        console.error(
            "Nearby provider search failed:",
            error
        );

        // IMPORTANT: Never fall back to all providers.
        // Fall back to the customer's saved service area.
        try {

            await loadLocationProviders(
                "Showing providers in your selected service area."
            );

        } catch (fallbackError) {

            console.error(
                "Location fallback failed:",
                fallbackError
            );

            grid.innerHTML = `
                <div class="col-12">
                    <div class="oc-loading-state">
                        Unable to load providers. Please try again.
                    </div>
                </div>
            `;
        }
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
   LOAD PROVIDERS INSIDE SERVICE REQUEST MODAL
   ========================================================= */

async function loadRequestNearbyProviders(
    latitude,
    longitude,
    container,
    serviceId,
    requestLocation = null
) {
    if (!container) {
        console.error("Nearby providers container was not passed.");
        return;
    }



    container.innerHTML = `
        <div class="text-center py-4">
            <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
            <p class="mt-3 mb-0">Finding nearby providers...</p>
        </div>
    `;

    try {
        const radiusInput = document.getElementById("requestProviderRadius");
        const allowedRadii = [3, 5, 20, 100];

        const selectedRadius = radiusInput
            ? Number(radiusInput.value)
            : 5;

        const radius = allowedRadii.includes(selectedRadius)
            ? selectedRadius
            : 5;

        const params = new URLSearchParams({
    latitude: Number(latitude).toFixed(6),
    longitude: Number(longitude).toFixed(6),
    radius: String(radius)
});

if (serviceId) {
    params.set("service_id", String(serviceId));
}

        const response = await fetch(
            `${API_BASE}/providers/nearby/?${params.toString()}`,
            {
                method: "GET",
                headers: getHeaders()
            }
        );

        if (response.status === 401 || response.status === 403) {
            logoutUser();
            return;
        }

        if (!response.ok) {
            throw new Error(
                `Nearby providers API error: ${response.status}`
            );
        }

        const data = await response.json();

        const providers = Array.isArray(data.results)
            ? data.results
            : Array.isArray(data)
                ? data
                : [];

        console.log("Providers near selected request:", providers);
       console.table(
    providers.map(provider => ({
        id: provider.id,
        name: provider.full_name,
        category: provider.category_name,
        service_id: provider.service_id,
        service: provider.service
    }))
);
console.table(
    providers.map(provider => ({
        id: provider.id,
        name: provider.full_name,
        category: provider.category_name,
        service_id: provider.service_id,
        service: provider.service
    }))
);console.log(
    "Modal container found:",
    document.getElementById("requestNearbyProviders")
);

console.log(
    "Provider card HTML test:",
    providers.length ? createProviderCard(providers[0]) : "No providers returned"
);
        if (providers.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info mb-0">
                    No available providers found within ${radius} km.
                    Try increasing the search radius.
                </div>
            `;
            return;
        }

       container.innerHTML = `
    <p class="text-muted small mb-3">
        ${providers.length} provider(s) found within ${radius} km,
        nearest first.
    </p>

    <div class="row g-3">
        ${providers.map(provider =>
            createProviderCard(provider, requestLocation)
        ).join("")}
    </div>
`;

console.log("Rendered provider cards:", container.querySelectorAll(".oc-provider-card").length);

console.log("Nearby container display:", getComputedStyle(container).display);
console.log("Nearby container visibility:", getComputedStyle(container).visibility);
console.log("Nearby container height:", container.offsetHeight);
console.log("Provider card visibility:", getComputedStyle(container.querySelector(".oc-provider-card")).display);
console.log("Nearby container parent:", container.parentElement);
console.log("Nearby container parent height:", container.parentElement?.offsetHeight);
console.log("Nearby container bounding box:", container.getBoundingClientRect());
console.log("Provider card height:", container.querySelector(".oc-provider-card")?.offsetHeight);
container.querySelectorAll("[data-aos]").forEach(card => {
    card.removeAttribute("data-aos");
    card.style.opacity = "1";
    card.style.transform = "none";
});

        
        

    } catch (error) {
        console.error(
            "Failed to load nearby providers in modal:",
            error
        );

        console.log("Modal container:", container);
console.log("Provider card HTML:", providers.map(provider => createProviderCard(provider)));

        container.innerHTML = `
            <div class="alert alert-danger mb-0">
                Unable to load nearby providers right now.
                Please try again.
            </div>
        `;
    }
}


/* =========================================================
   PROVIDER CARD
   ========================================================= */

function createProviderCard(
    provider,
    requestLocation = null
) {

    const providerId =
        provider.id;

        const providerServices =
    Array.isArray(provider.services)
        ? provider.services
        : [];

const selectedService =
    providerServices.length > 0
        ? providerServices[0]
        : null;

const serviceId =
    selectedService?.id || "";

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
    data-service-id="${escapeHtml(serviceId)}"
    data-request-address="${escapeHtml(requestLocation?.address || "")}"
    data-request-latitude="${escapeHtml(requestLocation?.latitude ?? "")}"
    data-request-longitude="${escapeHtml(requestLocation?.longitude ?? "")}"
    data-request-date="${escapeHtml(requestLocation?.date || "")}"
data-request-time="${escapeHtml(requestLocation?.time || "")}"
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
    providerId,
    serviceId = null
) {

    if (!providerId) {

        console.error(
            "Provider ID is missing."
        );

        return;

    }

    if (serviceId) {

        window.location.href =
            `provider-profile.html?id=${encodeURIComponent(providerId)}&service_id=${encodeURIComponent(serviceId)}`;

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

const serviceId =
    providerButton.dataset.serviceId;

if (!providerId || !serviceId) {
    console.error("Provider ID or Service ID is missing.", {
        providerId,
        serviceId
    });
    return;
}

const params = new URLSearchParams({
    provider_id: providerId,
    service_id: serviceId
});

const requestAddress =
    providerButton.dataset.requestAddress;

const requestLatitude =
    providerButton.dataset.requestLatitude;

const requestLongitude =
    providerButton.dataset.requestLongitude;

    const requestDate =
    providerButton.dataset.requestDate;

const requestTime =
    providerButton.dataset.requestTime;

if (requestDate) {
    params.set("date", requestDate);
}

if (requestTime) {
    params.set("time", requestTime);
}

if (
    requestAddress &&
    requestLatitude &&
    requestLongitude
) {
    params.set("address", requestAddress);
    params.set("latitude", requestLatitude);
    params.set("longitude", requestLongitude);
}

window.location.href =
    `booking.html?${params.toString()}`;
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

    let quotationsExpanded = false;
    const allQuotationCards = quotations.map(
    createCustomerQuotationCard
);

function renderQuotations() {
    const visibleQuotations = quotationsExpanded
        ? allQuotationCards
        : allQuotationCards.slice(0, 3);

    grid.innerHTML = visibleQuotations.join("");

    if (allQuotationCards.length > 3) {
        grid.innerHTML += `
            <div class="col-12 text-center mt-3">
                <button
                    type="button"
                    class="btn btn-outline-primary btn-sm"
                    id="seeMoreQuotationsBtn"
                >
                    ${quotationsExpanded ? "See Less" : "See More"}
                    <i class="fa-solid fa-chevron-${quotationsExpanded ? "up" : "down"} ms-1"></i>
                </button>
            </div>
        `;
    }

    refreshAOS();
}

renderQuotations();

grid.onclick = function (event) {
    if (event.target.closest("#seeMoreQuotationsBtn")) {
        quotationsExpanded = !quotationsExpanded;
        renderQuotations();
    }
};

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
/*
 * Accepted:
 * Provider accepted the customer's counter-offer.
 * Customer can now proceed to booking.
 */

else if (status === "accepted") {

    actionButtons = `

        <div class="mt-3">

            <div class="alert alert-success mb-2">

                <i class="fa-solid fa-check-circle me-1"></i>

                Your offer has been accepted by the provider.

            </div>

            <button
                type="button"
                class="btn btn-success w-100"
                onclick="window.location.href='booking.html?quotation_id=${encodeURIComponent(quotationId)}'"
            >

                <i class="fa-solid fa-calendar-check me-1"></i>

                Proceed to Booking

            </button>

        </div>

    `;

}

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

function acceptCustomerQuotation(quotationId) {
    
      const token = localStorage.getItem("access_token");
      

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    if (!quotationId) {
        alert("Quotation information is missing.");
        return;
    }

    const confirmed = confirm(
        "Accept this quotation and create your booking?"
    );

    if (!confirmed) {
        return;
    }

    console.log("Accepting quotation ID:", quotationId);
confirmCustomerQuotationBooking(quotationId);
}

/* =========================================================
   CONFIRM QUOTATION BOOKING
   ========================================================= */



async function confirmCustomerQuotationBooking(quotationId) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE}/services/quotations/${quotationId}/accept/`,
            {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
            alert("Your login session has expired. Please log in again.");
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error(
                data.detail || data.error || "Unable to accept quotation."
            );
        }

        // Open the booking form using the quotation ID.
        // The booking will be created only after confirmation.
        window.location.href =
            `booking.html?quotation_id=${encodeURIComponent(quotationId)}`;

    } catch (error) {
        console.error("Accept quotation error:", error);
        alert(error.message || "Something went wrong while accepting the quotation.");
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

       let services = [];

if (Array.isArray(data)) {

    services = data;

} else if (Array.isArray(data.results)) {

    services = data.results;

    // Load remaining service pages
    let nextUrl = data.next;

    while (nextUrl) {

        const nextResponse =
            await fetch(nextUrl);

        if (!nextResponse.ok) {
            break;
        }

        const nextData =
            await nextResponse.json();

        if (Array.isArray(nextData.results)) {

            services =
                services.concat(
                    nextData.results
                );

        }

        nextUrl =
            nextData.next;

    }

}

console.log(
    "Service request services:",
    services
);

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

        const preferredDate =
    document.getElementById(
        "requestDate"
    ).value;

const preferredTime =
    document.getElementById(
        "requestTime"
    ).value;

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
    "preferred_date",
    preferredDate
);

formData.append(
    "preferred_time",
    preferredTime
);


        formData.append(
            "address",
            address
        );

       // Add customer coordinates when available
const latitudeInput = document.getElementById("requestLatitude");
const longitudeInput = document.getElementById("requestLongitude");

const latitudeValue = latitudeInput?.value?.trim();
const longitudeValue = longitudeInput?.value?.trim();

const latitude = latitudeValue
    ? Number(latitudeValue)
    : window.customerLatitude;

const longitude = longitudeValue
    ? Number(longitudeValue)
    : window.customerLongitude;

    console.log("=== SERVICE REQUEST LOCATION DEBUG ===");
console.log("Address:", address);
console.log("Latitude input:", latitudeValue);
console.log("Longitude input:", longitudeValue);
console.log("Final latitude:", latitude);
console.log("Final longitude:", longitude);

if (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
) {
    formData.append("latitude", latitude.toFixed(6));
    formData.append("longitude", longitude.toFixed(6));
} else {
    console.warn(
        "Service request has no valid coordinates. Address:",
        address
    );
}


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
console.log("Saved request latitude:", data.latitude);
console.log("Saved request longitude:", data.longitude);
console.log("Saved request address:", data.address);

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

// Refresh the customer's service requests
if (typeof loadMyServiceRequests === "function") {
    loadMyServiceRequests();
}

// Find providers near the submitted service location
if (
    data.latitude != null &&
    data.longitude != null &&
    typeof loadRecommendedProviders === "function"
) {
    loadRecommendedProviders(
        true,
        Number(data.latitude),
        Number(data.longitude)
    );
}

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


document.getElementById("useMyLocationBtn")?.addEventListener("click", function () {
    const status = document.getElementById("customerLocationStatus");

    if (!navigator.geolocation) {
        status.textContent = "Location is not supported by this browser.";
        return;
    }

    status.textContent = "Getting your location...";

    navigator.geolocation.getCurrentPosition(
        
async function (position) {
    window.customerLatitude = position.coords.latitude;
    window.customerLongitude = position.coords.longitude;
    console.log("GPS latitude:", window.customerLatitude);
console.log("GPS longitude:", window.customerLongitude);

    status.textContent = "Coordinates captured. Finding address...";

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${window.customerLatitude}&lon=${window.customerLongitude}`
        );

        if (!response.ok) {
            throw new Error("Address lookup failed");
        }

        const data = await response.json();

        const addressInput = document.getElementById("requestAddress");

        if (data.display_name && addressInput) {
            addressInput.value = data.display_name;
            status.textContent = "Location and address filled successfully!";
        } else {
            status.textContent = "Coordinates saved, but no readable address was found. Please type your address.";
        }
    } catch (error) {
        status.textContent = "Coordinates saved, but address lookup failed. Please enter your address manually.";
    }
}
,
        function (error) {
            if (error.code === error.PERMISSION_DENIED) {
                status.textContent = "Location permission denied. Please allow location access.";
            } else {
                status.textContent = "Could not get your location. Please try again.";
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
});


/* =========================================
   SERVICE REQUEST — MANUAL MAP LOCATION
========================================= */

let requestLocationMap = null;
let requestLocationMarker = null;


document.getElementById("chooseOnMapBtn")?.addEventListener("click", function () {
    const mapSection = document.getElementById("requestLocationMapSection");
    const status = document.getElementById("customerLocationStatus");

    // Toggle the map open and closed.
    if (mapSection && !mapSection.classList.contains("d-none")) {
        mapSection.classList.add("d-none");
        status.textContent = "";
        return;
    }

    mapSection?.classList.remove("d-none");

    if (!window.L) {
        status.textContent = "Map library did not load. Please refresh and try again.";
        return;
    }

    if (!requestLocationMap) {
       let latitude = Number(window.customerLatitude);
let longitude = Number(window.customerLongitude);

// Use Nepal's approximate center if GPS is unavailable.
if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    (latitude === 0 && longitude === 0)
) {
    latitude = 28.3949;
    longitude = 84.1240;
}
        requestLocationMap = L.map("requestLocationMap").setView(
            [latitude, longitude],
            14
        );

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(requestLocationMap);

        requestLocationMarker = L.marker(
            [latitude, longitude],
            { draggable: true }
        ).addTo(requestLocationMap);

        requestLocationMap.on("click", function (event) {
            requestLocationMarker.setLatLng(event.latlng);
        });

        requestLocationMarker.on("dragend", function () {
            status.textContent = "Pin moved. Confirm your location when ready.";
        });
    }

    setTimeout(() => requestLocationMap.invalidateSize(), 150);

    status.textContent = "Move the map pin to the exact service location.";
});


document.getElementById("confirmMapLocationBtn")?.addEventListener("click", async function () {
    const status = document.getElementById("customerLocationStatus");
    const addressInput = document.getElementById("requestAddress");
    const latitudeInput = document.getElementById("requestLatitude");
    const longitudeInput = document.getElementById("requestLongitude");

    if (!requestLocationMarker) {
        status.textContent = "Choose a location on the map first.";
        return;
    }

    const position = requestLocationMarker.getLatLng();

    window.customerLatitude = position.lat;
    window.customerLongitude = position.lng;

    if (latitudeInput) latitudeInput.value = position.lat;
    if (longitudeInput) longitudeInput.value = position.lng;

    status.textContent = "Location selected. Looking up the address...";

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.lat}&lon=${position.lng}`
        );

        if (!response.ok) throw new Error("Address lookup failed");

        const data = await response.json();

        if (data.display_name && addressInput) {
            addressInput.value = data.display_name;
            status.textContent = "Map location and address confirmed!";
        } else {
            status.textContent = "Coordinates selected. Please enter the address manually.";
        }
    } catch (error) {
        status.textContent = "Coordinates selected, but address lookup failed. Please enter the address manually.";
    }
});


/* =========================================================
   CUSTOMER SERVICE LOCATION — LOAD AND SAVE
========================================================= */

async function loadCustomerServiceLocation() {

    const token = localStorage.getItem("access_token");

    if (!token) {
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE}/users/me/`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error("Unable to load customer location.");
        }

        const user = await response.json();

        document.getElementById("customerCountry").value =
            user.country || "Nepal";

        document.getElementById("customerProvince").value =
            user.province || "";

        document.getElementById("customerDistrict").value =
            user.district || "";

        document.getElementById("customerCity").value =
            user.city || "";

    } catch (error) {

        console.error("Load customer location error:", error);

    }
}


/* =========================================================
   SAVE CUSTOMER SERVICE LOCATION
========================================================= */

function setupCustomerServiceLocationForm() {

    const form = document.getElementById("customerLocationForm");

    if (!form) {
        return;
    }

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const token = localStorage.getItem("access_token");

        const message = document.getElementById(
            "customerLocationMessage"
        );

        const button = document.getElementById(
            "saveCustomerLocationBtn"
        );

        if (!token) {
            message.textContent = "Please log in to save your location.";
            message.className = "mt-3 text-danger";
            return;
        }

        const locationData = {
            country: document.getElementById("customerCountry").value.trim(),
            province: document.getElementById("customerProvince").value.trim(),
            district: document.getElementById("customerDistrict").value.trim(),
            city: document.getElementById("customerCity").value.trim()
        };

        if (
    !locationData.country ||
    !locationData.province ||
    !locationData.district
) {
            message.textContent = "Please complete all location fields.";
            message.className = "mt-3 text-danger";
            return;
        }

        button.disabled = true;
        button.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin me-2"></i>Saving...';

        message.textContent = "";

        try {

            const response = await fetch(
                `${API_BASE}/users/me/`,
                {
                    method: "PATCH",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(locationData)
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.error ||
                    "Unable to save your location."
                );
            }

            message.textContent =
                "Your service location has been saved successfully!";

            message.className = "mt-3 text-success";

            console.log("Customer location saved:", locationData);

        } catch (error) {

            console.error("Save customer location error:", error);

            message.textContent =
                error.message || "Something went wrong.";

            message.className = "mt-3 text-danger";

        } finally {

            button.disabled = false;

            button.innerHTML =
                '<i class="fa-solid fa-location-crosshairs me-2"></i>Save My Location';

        }

    });

}
/* =========================================================
   REQUEST SERVICE — MINIMUM DATE
========================================================= */

function setRequestMinimumDate() {

    const dateInput = document.getElementById("requestDate");

    if (!dateInput) return;

    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const todayString = `${year}-${month}-${day}`;

    dateInput.min = todayString;

    if (dateInput.value && dateInput.value < todayString) {
        dateInput.value = "";
    }
}
document.addEventListener("DOMContentLoaded", function () {
    setRequestMinimumDate();
});
