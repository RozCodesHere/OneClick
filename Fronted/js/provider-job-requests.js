
// ============================================================
// OneClick - Provider Job Requests
// ============================================================

const API_BASE = "http://127.0.0.1:8000/api";

let currentProvider = null;
let jobRequests = [];
let serviceRequests = [];
let counterOffers = [];

// ============================================================
// AUTH
// ============================================================

function getToken() {
    return localStorage.getItem("access_token");
}


function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
    };
}


// ============================================================
// REFRESH ACCESS TOKEN
// ============================================================

async function refreshAccessToken() {

    const refreshToken =
        localStorage.getItem("refresh_token");

    if (!refreshToken) {
        return false;
    }

    try {

        const response = await fetch(
            `${API_BASE}/users/token/refresh/`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    refresh: refreshToken
                })
            }
        );

        if (!response.ok) {
            return false;
        }

        const responseText = await response.text();

console.log("QUOTATION RESPONSE STATUS:", response.status);
console.log("QUOTATION RESPONSE:", responseText);

let data;

try {
    data = JSON.parse(responseText);
} catch {
    throw new Error("Backend returned HTML instead of JSON. Check the quotation API URL and Django response.");
}

        if (!data.access) {
            return false;
        }

        localStorage.setItem(
            "access_token",
            data.access
        );

        return true;

    } catch (error) {

        console.error(
            "Token refresh error:",
            error
        );

        return false;
    }
}


// ============================================================
// HANDLE UNAUTHORIZED RESPONSE
// ============================================================

async function handleUnauthorized(response) {

    if (response.status !== 401) {
        return response;
    }

    const refreshed =
        await refreshAccessToken();

    if (!refreshed) {

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        window.location.href = "login.html";

        return null;
    }

    return response;
}


// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        const token = getToken();

        if (!token) {

            window.location.href =
                "login.html";

            return;
        }

        await loadProvider();

await loadJobRequests();

await loadProviderCounterOffers();

    }
);


// ============================================================
// LOAD PROVIDER
// ============================================================

async function loadProvider() {

    try {

        let response = await fetch(
            `${API_BASE}/users/me/`,
            {
                headers: authHeaders()
            }
        );


        // Access token expired
        if (response.status === 401) {

            const refreshed =
                await refreshAccessToken();

            if (!refreshed) {

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


            // Try again with new token
            response = await fetch(
                `${API_BASE}/users/me/`,
                {
                    headers: authHeaders()
                }
            );

        }


        if (!response.ok) {

            throw new Error(
                "Failed to load provider."
            );

        }


        const user =
            await response.json();


        currentProvider =
            user;


        const providerName =
            document.getElementById(
                "providerName"
            );


        if (providerName) {

            providerName.textContent =
                user.full_name ||
                user.name ||
                user.email ||
                "Provider";

        }


    } catch (error) {

        console.error(
            "Provider loading error:",
            error
        );

    }

}


// ============================================================
// LOAD JOB REQUESTS
// ============================================================


async function loadJobRequests() {
    const grid = document.getElementById("jobRequestsGrid");

    try {
        // Load existing bookings — preserve the current flow.
        let bookingResponse = await fetch(
            `${API_BASE}/bookings/provider/`,
            { headers: authHeaders() }
        );

        if (bookingResponse.status === 401) {
            const refreshed = await refreshAccessToken();

            if (!refreshed) {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                window.location.href = "login.html";
                return;
            }

            bookingResponse = await fetch(
                `${API_BASE}/bookings/provider/`,
                { headers: authHeaders() }
            );
        }

        if (!bookingResponse.ok) {
            throw new Error(`Failed to load bookings (${bookingResponse.status})`);
        }

        const bookings = await bookingResponse.json();

        jobRequests = (Array.isArray(bookings) ? bookings : bookings.results || [])
            .filter(booking => booking.status === "pending");

        // NEW: Load customer service requests separately.
console.log("Loading new service requests...");

let serviceResponse = await fetch(
    `${API_BASE}/services/requests/provider/`,
    { headers: authHeaders() }
);

        if (serviceResponse.status === 401) {
            const refreshed = await refreshAccessToken();

            if (!refreshed) {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                window.location.href = "login.html";
                return;
            }

            serviceResponse = await fetch(
                `${API_BASE}/services/requests/provider/`,
                { headers: authHeaders() }
            );
        }

        if (!serviceResponse.ok) {
            throw new Error(
                `Failed to load service requests (${serviceResponse.status})`
            );
        }

        const serviceData = await serviceResponse.json();

        serviceRequests = (
            Array.isArray(serviceData) ? serviceData : serviceData.results || []
        ).filter(request =>
            request.status === "pending" ||
            request.status === "quoted"
        );

        console.log("Provider bookings:", jobRequests);
        console.log("Provider customer service requests:", serviceRequests);

        updateRequestCount();
        renderJobRequests();

    } catch (error) {
        console.error("Job requests error:", error);

        if (grid) {
            grid.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        Failed to load job requests.
                        <br>
                        <small>${escapeHtml(error.message)}</small>
                    </div>
                </div>`;
        }
    }
}



// ============================================================
// LOAD CUSTOMER COUNTER OFFERS
// ============================================================

async function loadProviderCounterOffers() {
    const container = document.getElementById(
        "providerCounterOffersContainer"
    );

    const badge = document.getElementById(
        "counterOfferBadge"
    );

    if (!container || !badge) return;

    try {
        let response = await fetch(
            `${API_BASE}/services/quotations/`,
            { headers: authHeaders() }
        );

        if (response.status === 401) {
            const refreshed = await refreshAccessToken();

            if (!refreshed) {
                window.location.href = "login.html";
                return;
            }

            response = await fetch(
                `${API_BASE}/services/quotations/`,
                { headers: authHeaders() }
            );
        }

        if (!response.ok) {
            throw new Error(
                `Quotation API failed: ${response.status}`
            );
        }

        const data = await response.json();

        const quotations = Array.isArray(data)
            ? data
            : data.results || [];

        counterOffers = quotations.filter(quotation =>
            quotation.status === "countered" &&
            quotation.counter_price !== null &&
            quotation.counter_price !== ""
        );

        badge.textContent = counterOffers.length;

        console.log(
            "Job Requests counter offers:",
            counterOffers
        );

        if (counterOffers.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <h5>No counter offers</h5>
                    <p>Customer counter offers will appear here.</p>
                </div>
            `;
            return;
        }

      container.innerHTML = counterOffers.map(quotation => `
    <div class="counter-offer-card request-card p-3 mb-3">

        <span class="badge bg-warning text-dark">
            Counter Offer
        </span>

        <small class="text-muted">
            Quotation #${quotation.id}
        </small>

        <h5 class="mt-3">
            ${escapeHtml(quotation.service_name || "Service")}
        </h5>

        <p>
            Customer:
            ${escapeHtml(quotation.request_customer || "Customer")}
        </p>

        <p>
            Your original price:
            Rs. ${Number(quotation.price).toLocaleString("en-IN")}
        </p>

        <p>
            Customer counter offer:
            <strong class="text-warning">
                Rs. ${Number(quotation.counter_price).toLocaleString("en-IN")}
            </strong>
        </p>

        <div class="p-3 bg-light rounded mb-3">
            <small class="text-muted d-block">
                Customer message
            </small>

            ${escapeHtml(quotation.counter_message || "No message provided.")}
        </div>

       <div class="d-flex gap-2 mt-3">

    <button
        type="button"
        class="btn btn-success accept-counter-btn"
        data-quotation-id="${quotation.id}"
    >
        <i class="fa-solid fa-check me-1"></i>
        Accept Rs. ${Number(quotation.counter_price).toLocaleString("en-IN")}
    </button>

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
`).join("");

    } catch (error) {
        console.error(
            "Counter offers loading error:",
            error
        );
    }
}


// ============================================================
// UPDATE REQUEST COUNT
// ============================================================

function updateRequestCount() {
    const requestCount = document.getElementById("requestCount");
    const requestBadge = document.getElementById("jobRequestBadge");

    // Count both bookings and new service requests.
    const totalRequests = jobRequests.length + serviceRequests.length;

    if (requestCount) {
        requestCount.textContent = totalRequests;
    }

    if (requestBadge) {
        requestBadge.textContent = totalRequests;
        requestBadge.style.display =
            totalRequests > 0 ? "inline-block" : "none";
    }
}
// ============================================================
// RENDER JOB REQUESTS
// ============================================================


function renderJobRequests() {
    const grid = document.getElementById("jobRequestsGrid");

    if (!grid) return;

    const bookingCards = jobRequests
        .map(booking => createRequestCard(booking))
        .join("");

    const serviceCards = serviceRequests
        .map(request => createServiceRequestCard(request))
        .join("");

    if (!bookingCards && !serviceCards) {
        grid.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <i class="fas fa-clipboard-check"></i>
                    <h5>No Pending Job Requests</h5>
                    <p>New customer bookings and service requests will appear here.</p>
                </div>
            </div>`;
        return;
    }

    grid.innerHTML = bookingCards + serviceCards;
}

// ============================================================
// CREATE REQUEST CARD
// ============================================================


function createRequestCard(booking) {
    const customerName =
        booking.customer_name ||
        booking.customer?.full_name ||
        booking.customer?.name ||
        booking.customer?.email ||
        "Customer";

    const serviceName =
        booking.service_name ||
        booking.service?.name ||
        (typeof booking.service === "string" ? booking.service : "") ||
        "Service";

    const bookingDate =
        booking.booking_date || booking.date || "Not specified";

    const bookingTime =
        booking.booking_time || booking.time || "Not specified";

    const address =
        booking.address || "Address not provided";
        console.log("Booking ID:", booking.id);
console.log("Service address:", booking.address);
console.log("Latitude:", booking.latitude);
console.log("Longitude:", booking.longitude);
        const latitude = booking.latitude;
const longitude = booking.longitude;

const hasCoordinates =
    latitude !== null &&
    latitude !== undefined &&
    longitude !== null &&
    longitude !== undefined &&
    latitude !== "" &&
    longitude !== "" &&
    Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude)) &&
    Number(latitude) >= -90 &&
    Number(latitude) <= 90 &&
    Number(longitude) >= -180 &&
    Number(longitude) <= 180;

    const note =
        booking.note || booking.description || "";

    const price =
        booking.total_price ?? booking.price ?? 0;

    const bookingId = Number(booking.id) || 0;

    const customerImage =
        booking.customer_image || booking.customer?.profile_image || "";

    const status = booking.status || "pending";

    const statusLabel = status
        .replace(/_/g, " ")
        .replace(/\b\w/g, char => char.toUpperCase());

    const avatar = customerImage
        ? `<img
                src="${escapeHtml(customerImage)}"
                alt="${escapeHtml(customerName)}"
                class="customer-avatar-image"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
           >
           <span class="request-avatar-fallback" style="display:none">
                <i class="fas fa-user"></i>
           </span>`
        : `<span class="request-avatar-fallback">
                <i class="fas fa-user"></i>
           </span>`;

    return `
        <div class="col-12 col-md-6 col-xl-4">
            <article class="request-card request-card-modern">

                <div class="request-card-top">
                    <div class="customer-info">
                        <div class="customer-avatar">
                            ${avatar}
                        </div>

                        <div class="customer-heading">
                            <h5 class="customer-name">
                                ${escapeHtml(customerName)}
                            </h5>
                            <span class="request-date">
                                Request #${bookingId}
                            </span>
                        </div>
                    </div>

                    <span class="request-status status-${escapeHtml(status)}">
                        <span class="status-dot"></span>
                        ${escapeHtml(statusLabel)}
                    </span>
                </div>

                <div class="request-card-body">
                    <div class="request-service-block">
                        <span class="request-section-label">SERVICE REQUEST</span>
                        <h4 class="request-service">
                            <i class="fas fa-tools"></i>
                            ${escapeHtml(serviceName)}
                        </h4>
                    </div>

                    <div class="request-info-grid">
                        <div class="request-info-item">
                            <span class="request-info-icon">
                                <i class="fas fa-calendar-alt"></i>
                            </span>
                            <div>
                                <span class="request-info-label">Preferred date</span>
                                <strong>${escapeHtml(bookingDate)}</strong>
                            </div>
                        </div>

                        <div class="request-info-item">
                            <span class="request-info-icon">
                                <i class="fas fa-clock"></i>
                            </span>
                            <div>
                                <span class="request-info-label">Preferred time</span>
                                <strong>${escapeHtml(bookingTime)}</strong>
                            </div>
                        </div>

                       
<div class="request-info-item request-info-location">
    <span class="request-info-icon">
        <i class="fas fa-map-marker-alt"></i>
    </span>

    <div>
        <span class="request-info-label">Service location</span>
        <strong>${escapeHtml(address)}</strong>
    </div>
</div>

<div class="request-map-section">
    ${
        hasCoordinates
            ? `
                <iframe
                    class="request-location-map"
                    title="Customer-selected service location"
                    src="https://www.openstreetmap.org/export/embed.html?bbox=${Number(longitude) - 0.005}%2C${Number(latitude) - 0.003}%2C${Number(longitude) + 0.005}%2C${Number(latitude) + 0.003}&layer=mapnik&marker=${Number(latitude)}%2C${Number(longitude)}"
                    loading="lazy"
                    referrerpolicy="no-referrer"
                ></iframe>

                <a
                    class="request-map-directions"
                    href="https://www.openstreetmap.org/?mlat=${Number(latitude)}&mlon=${Number(longitude)}#map=17/${Number(latitude)}/${Number(longitude)}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <i class="fas fa-directions me-1"></i>
                    View location & directions
                </a>
            `
            : `
                <div class="request-map-unavailable">
                    <i class="fas fa-map-marked-alt"></i>
                    <span>Map coordinates aren't available for this booking.</span>
                </div>
            `
    }
</div>

                    </div>

                    ${
                        note
                            ? `
                                <div class="request-description">
                                    <span class="request-info-label">
                                        <i class="fas fa-align-left me-1"></i>
                                        Customer's description
                                    </span>
                                    <p>${escapeHtml(note)}</p>
                                </div>
                            `
                            : ""
                    }

                    <div class="request-price-row">
                        <div>
                            <span class="request-info-label">Listed price</span>
                            <strong class="request-price">
                                Rs. ${escapeHtml(Number(price).toLocaleString("en-IN"))}
                            </strong>
                        </div>
                        <span class="request-price-note">
                            <i class="fas fa-info-circle me-1"></i>
                            Confirm before starting
                        </span>
                    </div>
                </div>

                <div class="request-actions request-actions-modern">
                    <button
                        type="button"
                        class="btn btn-success"
                        onclick="acceptJob(${bookingId})"
                        ${bookingId ? "" : "disabled"}
                    >
                        <i class="fas fa-check me-2"></i>
                        Accept
                    </button>

                    <button
                        type="button"
                        class="btn btn-outline-danger"
                        onclick="rejectJob(${bookingId})"
                        ${bookingId ? "" : "disabled"}
                    >
                        <i class="fas fa-times me-2"></i>
                        Reject
                    </button>
                </div>

            </article>
        </div>
    `;
}


function createServiceRequestCard(request) {
    const customerName =
        request.customer_name || "Customer";

    const serviceName =
        request.service_name ||
        (typeof request.service === "string" ? request.service : "Service");

    const address =
        request.address || "Address not provided";

    const description =
        request.description || "No description provided.";

    const latitude = Number(request.latitude);
    const longitude = Number(request.longitude);

    const hasCoordinates =
        request.latitude !== null &&
        request.latitude !== undefined &&
        request.latitude !== "" &&
        request.longitude !== null &&
        request.longitude !== undefined &&
        request.longitude !== "" &&
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= -90 && latitude <= 90 &&
        longitude >= -180 && longitude <= 180;

    const requestId = Number(request.id);

    return `
        <div class="col-12 col-md-6 col-xl-4">
            <article class="request-card request-card-modern">
                <div class="request-card-top">
                    <div class="customer-heading">
                        <h5 class="customer-name">
                            ${escapeHtml(customerName)}
                        </h5>
                        <span class="request-date">
                            Service Request #${requestId}
                        </span>
                    </div>

                    <span class="request-status status-${escapeHtml(request.status)}">
                        <span class="status-dot"></span>
                        ${escapeHtml(request.status)}
                    </span>
                </div>

                <div class="request-card-body">
                    <div class="request-service-block">
                        <span class="request-section-label">CUSTOMER SERVICE REQUEST</span>
                        <h4 class="request-service">
                            <i class="fas fa-tools"></i>
                            ${escapeHtml(serviceName)}
                        </h4>
                    </div>

                    <div class="request-info-item request-info-location">
                        <span class="request-info-icon">
                            <i class="fas fa-map-marker-alt"></i>
                        </span>
                        <div>
                            <span class="request-info-label">Service location</span>
                            <strong>${escapeHtml(address)}</strong>
                        </div>
                    </div>

                    ${
                        hasCoordinates
                            ? `
                                <div class="request-map-section">
                                    <iframe
                                        class="request-location-map"
                                        title="Customer service location"
                                        src="https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.005}%2C${latitude - 0.003}%2C${longitude + 0.005}%2C${latitude + 0.003}&layer=mapnik&marker=${latitude}%2C${longitude}"
                                        loading="lazy"
                                    ></iframe>
                                    <a
                                        class="request-map-directions"
                                        href="https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <i class="fas fa-directions me-1"></i>
                                        View location & directions
                                    </a>
                                </div>`
                            : ""
                    }

                    <div class="request-description">
                        <span class="request-info-label">Customer description</span>
                        <p>${escapeHtml(description)}</p>
                    </div>
                </div>

                <div class="request-actions request-actions-modern">
                    <button
                        type="button"
                        class="btn btn-primary"
                        onclick="openQuotationModal(${requestId})"
                        ${requestId ? "" : "disabled"}
                    >
                        <i class="fas fa-file-invoice-dollar me-2"></i>
                        Send Quotation
                    </button>
                </div>
            </article>
        </div>`;
}


// ============================================================
// ACCEPT JOB
// ============================================================

async function acceptJob(bookingId) {

    const confirmed =
        confirm(
            "Are you sure you want to accept this job?"
        );


    if (!confirmed) {
        return;
    }


    try {

        let response = await fetch(
            `${API_BASE}/bookings/provider/${bookingId}/`,
            {
                method: "PATCH",

                headers: authHeaders(),

                body: JSON.stringify({
                    status: "accepted"
                })
            }
        );


        // ====================================================
        // TOKEN EXPIRED
        // ====================================================

        if (response.status === 401) {

            const refreshed =
                await refreshAccessToken();


            if (!refreshed) {

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


            // Retry PATCH with new access token

            response = await fetch(
                `${API_BASE}/bookings/provider/${bookingId}/`,
                {
                    method: "PATCH",

                    headers: authHeaders(),

                    body: JSON.stringify({
                        status: "accepted"
                    })
                }
            );

        }


        // ====================================================
        // READ RESPONSE SAFELY
        // ====================================================

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        let data = null;


        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data =
                await response.json();

        } else {

            const text =
                await response.text();

            console.error(
                "Unexpected server response:",
                text
            );

            throw new Error(
                `Server returned ${response.status} instead of JSON.`
            );

        }


        if (!response.ok) {

            throw new Error(
                data?.error ||
                "Failed to accept booking."
            );

        }


        alert(
            "Job accepted successfully."
        );


        // Reload pending requests.
        // Accepted job should disappear from here.

        await loadJobRequests();


    } catch (error) {

        console.error(
            "Accept job error:",
            error
        );


        alert(
            error.message ||
            "Failed to accept the job."
        );

    }

}


// ============================================================
// REJECT JOB
// ============================================================

async function rejectJob(bookingId) {

    const confirmed =
        confirm(
            "Are you sure you want to reject this job?"
        );


    if (!confirmed) {
        return;
    }


    try {

        let response = await fetch(
            `${API_BASE}/bookings/provider/${bookingId}/`,
            {
                method: "PATCH",

                headers: authHeaders(),

                body: JSON.stringify({
                    status: "rejected"
                })
            }
        );


        // ====================================================
        // TOKEN EXPIRED
        // ====================================================

        if (response.status === 401) {

            const refreshed =
                await refreshAccessToken();


            if (!refreshed) {

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


            // Retry PATCH with new access token

            response = await fetch(
                `${API_BASE}/bookings/provider/${bookingId}/`,
                {
                    method: "PATCH",

                    headers: authHeaders(),

                    body: JSON.stringify({
                        status: "rejected"
                    })
                }
            );

        }


        // ====================================================
        // READ RESPONSE SAFELY
        // ====================================================

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        let data = null;


        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data =
                await response.json();

        } else {

            const text =
                await response.text();

            console.error(
                "Unexpected server response:",
                text
            );

            throw new Error(
                `Server returned ${response.status} instead of JSON.`
            );

        }


        if (!response.ok) {

            throw new Error(
                data?.error ||
                "Failed to reject booking."
            );

        }


        alert(
            "Job rejected."
        );


        // Reload pending requests

        await loadJobRequests();


    } catch (error) {

        console.error(
            "Reject job error:",
            error
        );


        alert(
            error.message ||
            "Failed to reject the job."
        );

    }

}


// ============================================================
// HTML ESCAPE
// ============================================================

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


function openQuotationModal(requestId) {
    document.getElementById("quotationRequestId").value = requestId;

    document.getElementById("quotationPrice").value = "";
    document.getElementById("quotationMessage").value = "";

    bootstrap.Modal
        .getOrCreateInstance(document.getElementById("quotationModal"))
        .show();
}

document.getElementById("quotationForm")?.addEventListener("submit", async function (event) {
    event.preventDefault();

    const requestId = Number(
        document.getElementById("quotationRequestId").value
    );

    const price = Number(
        document.getElementById("quotationPrice").value
    );

    const message = document.getElementById("quotationMessage").value.trim();

    if (!requestId || !Number.isFinite(price) || price <= 0) {
        alert("Please enter a valid quotation price.");
        return;
    }

    const submitButton = this.querySelector('[type="submit"]');
    submitButton.disabled = true;

    try {
        let response = await fetch(`${API_BASE}/services/quotations/`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
                request: requestId,
                price: price,
                message: message
            })
        });

        if (response.status === 401) {
            const refreshed = await refreshAccessToken();

            if (!refreshed) {
                throw new Error("Your session expired. Please log in again.");
            }

            response = await fetch(`${API_BASE}/services/quotations/`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({
                    request: requestId,
                    price: price,
                    message: message
                })
            });
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail ||
                data.error ||
                JSON.stringify(data)
            );
        }

        alert("Quotation sent successfully.");

        bootstrap.Modal
            .getOrCreateInstance(document.getElementById("quotationModal"))
            .hide();

        await loadJobRequests();

    } catch (error) {
        console.error("Quotation submission error:", error);
        alert(error.message || "Failed to send quotation.");
    } finally {
        submitButton.disabled = false;
    }
});



function openFinalOfferModal(quotationId) {
    const quotationIdInput = document.getElementById("finalOfferQuotationId");
    const priceInput = document.getElementById("finalOfferPrice");
    const messageInput = document.getElementById("finalOfferMessage");
    const errorBox = document.getElementById("finalOfferError");
    const modalElement = document.getElementById("finalOfferModal");

    if (!quotationIdInput || !priceInput || !messageInput || !modalElement) {
        console.error("Final offer modal elements not found.");
        return;
    }

    quotationIdInput.value = quotationId;
    priceInput.value = "";
    messageInput.value = "";

    if (errorBox) {
        errorBox.textContent = "";
        errorBox.classList.add("d-none");
    }

    bootstrap.Modal.getOrCreateInstance(modalElement).show();
}

async function submitProviderFinalOffer() {
    const quotationId = document.getElementById("finalOfferQuotationId")?.value;
    const price = document.getElementById("finalOfferPrice")?.value;
    const message = document.getElementById("finalOfferMessage")?.value;
    const errorBox = document.getElementById("finalOfferError");
    const submitBtn = document.getElementById("submitFinalOfferBtn");

    if (!quotationId || !price || Number(price) <= 0) {
        if (errorBox) {
            errorBox.textContent = "Please enter a valid final price.";
            errorBox.classList.remove("d-none");
        }
        return;
    }

    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Sending...";
        }

        let response = await fetch(
            `${API_BASE}/services/quotations/${quotationId}/final/`,
            {
                method: "PUT",
                headers: authHeaders(),
                body: JSON.stringify({
                    final_price: Number(price),
                    final_message: message
                })
            }
        );

        if (response.status === 401) {
            const refreshed = await refreshAccessToken();

            if (!refreshed) {
                throw new Error("Session expired. Please login again.");
            }

            response = await fetch(
                `${API_BASE}/services/quotations/${quotationId}/final/`,
                {
                    method: "PUT",
                    headers: authHeaders(),
                    body: JSON.stringify({
                        final_price: Number(price),
                        final_message: message
                    })
                }
            );
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || data.detail || "Could not send final offer.");
        }

        bootstrap.Modal.getInstance(
            document.getElementById("finalOfferModal")
        )?.hide();

        alert("Final offer sent successfully!");
        await loadProviderCounterOffers();

    } catch (error) {
        if (errorBox) {
            errorBox.textContent = error.message;
            errorBox.classList.remove("d-none");
        } else {
            alert(error.message);
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Send Final Offer";
        }
    }
}


// ============================================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// ============================================================

window.acceptJob =
    acceptJob;


window.rejectJob =
    rejectJob;


window.loadJobRequests =
    loadJobRequests;


    // Open Final Offer modal when provider clicks the button
document.addEventListener("click", async function (event) {

    // SEND FINAL OFFER
    const finalButton = event.target.closest(".final-offer-btn");

    if (finalButton) {
        const quotationId = finalButton.dataset.quotationId;

        if (quotationId) {
            openFinalOfferModal(quotationId);
        }

        return;
    }

    // ACCEPT CUSTOMER COUNTER-OFFER
    const acceptButton = event.target.closest(".accept-counter-btn");

    if (acceptButton) {
        const quotationId = acceptButton.dataset.quotationId;

        if (!quotationId) return;

        const confirmed = confirm(
            "Accept the customer's counter-offer?"
        );

        if (!confirmed) return;

        try {
            acceptButton.disabled = true;
            acceptButton.textContent = "Accepting...";

            let response = await fetch(
                `${API_BASE}/services/quotations/${quotationId}/provider-accept/`,
                {
                    method: "PUT",
                    headers: authHeaders()
                }
            );

            if (response.status === 401) {
                const refreshed = await refreshAccessToken();

                if (!refreshed) {
                    throw new Error("Session expired. Please login again.");
                }

                response = await fetch(
                    `${API_BASE}/services/quotations/${quotationId}/provider-accept/`,
                    {
                        method: "PUT",
                        headers: authHeaders()
                    }
                );
            }

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.detail || data.error || "Could not accept offer."
                );
            }

            alert("Customer counter-offer accepted!");
            await loadProviderCounterOffers();

        } catch (error) {
            alert(error.message);
            acceptButton.disabled = false;
            acceptButton.textContent = "Accept Counter Offer";
        }
    }
});
// Submit the Final Offer
document.addEventListener("DOMContentLoaded", function () {
    const submitButton = document.getElementById("submitFinalOfferBtn");

    if (submitButton) {
        submitButton.addEventListener("click", submitProviderFinalOffer);
    }
});
