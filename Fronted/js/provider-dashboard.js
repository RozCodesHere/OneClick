/* ==========================================================================
   ONECLICK — PROVIDER DASHBOARD
   Connected to Django R`EST API
   ========================================================================== */

const API_BASE = (
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
)
    ? "http://127.0.0.1:8000/api"
    : "https://oneclick-backend-6hk7.onrender.com/api";

/* ==========================================================================
   PROVIDER LIVE GPS TRACKING
   ========================================================================== */

let providerLocationWatchId = null;
let activeTrackingBookingId = null;
let providerCustomerMap = null;
let providerCustomerMarker = null;
let providerLiveMarker = null;
let providerRouteLine = null;
let providerRouteRequestInProgress = false;
let lastProviderRoutePosition = null;


function startProviderLocationTracking(bookingId) {

    if (!navigator.geolocation) {
        alert("GPS is not supported by this browser.");
        return;
    }

    // Prevent duplicate GPS watchers.
    if (providerLocationWatchId !== null) {
        navigator.geolocation.clearWatch(
            providerLocationWatchId
        );
    }

    activeTrackingBookingId = bookingId;

    const token = getAccessToken();

    if (!token) {
        alert("Please login again.");
        return;
    }

    providerLocationWatchId =
        navigator.geolocation.watchPosition(
            async function (position) {

                const latitude =
                    position.coords.latitude;

                const longitude =
                    position.coords.longitude;
                // Update the live motorcycle marker on the map.
updateProviderLiveMap(latitude, longitude);
                try {
                    const response = await fetch(
                        `${API_BASE}/bookings/provider/${bookingId}/location/`,
                        {
                            method: "PATCH",
                            headers: {
                                "Authorization": `Bearer ${token}`,
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                provider_latitude: latitude,
                                provider_longitude: longitude
                            })
                        }
                    );

                    if (!response.ok) {
                        console.error(
                            "GPS update failed:",
                            await response.text()
                        );
                    }

                } catch (error) {
                    console.error(
                        "GPS update error:",
                        error
                    );
                }
            },

            function (error) {
                console.error("GPS error:", error.message);
                alert(
                    "Unable to access your location. Please enable location permission."
                );
            },

            {
                enableHighAccuracy: true,
                maximumAge: 3000,
                timeout: 15000
            }
        );

    console.log(
        "Live GPS tracking started for booking:",
        bookingId
    );
}


function stopProviderLocationTracking() {

    if (providerLocationWatchId !== null) {
        navigator.geolocation.clearWatch(
            providerLocationWatchId
        );
    }

    providerLocationWatchId = null;
    activeTrackingBookingId = null;

    console.log("Live GPS tracking stopped.");
}


/* ==========================================================================
   PAGE INITIALIZATION
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
    const greetingText = document.getElementById("dashboardGreetingText");

if (greetingText) {
    const hour = new Date().getHours();

    if (hour < 12) {
        greetingText.textContent = "Good morning,";
    } else if (hour < 17) {
        greetingText.textContent = "Good afternoon,";
    } else {
        greetingText.textContent = "Good evening,";
    }
}
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
    loadProviderNotificationDropdown();

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

/* =========================================================
   PROVIDER LIVE MOTORCYCLE + ROAD ROUTE
   ========================================================= */

async function updateProviderLiveMap(latitude, longitude) {

    if (!providerCustomerMap || !providerCustomerMarker) {
        return;
    }

    const providerPosition = [latitude, longitude];

    const motorcycleIcon = L.divIcon({
        className: "provider-live-icon",
        html: '<i class="fa-solid fa-motorcycle"></i>',
        iconSize: [42, 42],
        iconAnchor: [21, 21]
    });

    if (!providerLiveMarker) {

        providerLiveMarker = L.marker(
            providerPosition,
            { icon: motorcycleIcon }
        )
        .addTo(providerCustomerMap)
        .bindPopup("Your Live Location");

    } else {

        providerLiveMarker.setLatLng(providerPosition);
    }

    // Avoid unnecessary route requests.
    if (providerRouteRequestInProgress) return;

    const customerPosition =
        providerCustomerMarker.getLatLng();

    const currentPosition =
        L.latLng(latitude, longitude);

    if (lastProviderRoutePosition) {

        const previousPosition = L.latLng(
            lastProviderRoutePosition[0],
            lastProviderRoutePosition[1]
        );

        if (previousPosition.distanceTo(currentPosition) < 50) {
            return;
        }
    }

    providerRouteRequestInProgress = true;

    try {

        const url =
            `https://router.project-osrm.org/route/v1/driving/` +
            `${longitude},${latitude};` +
            `${customerPosition.lng},${customerPosition.lat}` +
            `?overview=full&geometries=geojson`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.code !== "Ok" || !data.routes.length) {
            return;
        }

        const coordinates =
            data.routes[0].geometry.coordinates.map(
                point => [point[1], point[0]]
            );

        if (providerRouteLine) {

            providerRouteLine.setLatLngs(coordinates);

        } else {

            providerRouteLine = L.polyline(
                coordinates,
                {
                    color: "#2563eb",
                    weight: 5,
                    opacity: 0.8
                }
            ).addTo(providerCustomerMap);
        }

        lastProviderRoutePosition = providerPosition;

        providerCustomerMap.fitBounds(
            L.latLngBounds([
                providerCustomerMarker.getLatLng(),
                providerLiveMarker.getLatLng()
            ]),
            { padding: [40, 40], maxZoom: 15 }
        );

    } catch (error) {

        console.error("Provider map route error:", error);

    } finally {

        providerRouteRequestInProgress = false;
    }
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
console.log("SAVED AVAILABILITY:", provider.availability_status);
console.log("PROVIDER AVAILABLE:", provider.available);
console.log("FULL PROVIDER DATA:", provider);

        if (!provider) {

            throw new Error(
                "Provider data was not returned by the server."
            );
        }


        window.oneClickProvider =
            provider;
            // Load saved provider service location
window.oneClickProvider =
    provider;
            updateOnlineStatus(provider.availability_status);

            // Restore saved availability from the database
const savedAvailability =
    provider.availability_status ||
    (provider.available ? "available" : "unavailable");

updateOnlineStatus(savedAvailability);

// Restore the three availability switches
const availabilitySwitches = [
    { id: "availableToday", status: "available" },
    { id: "unavailable", status: "unavailable" },
    { id: "vacationMode", status: "vacation" }
];

availabilitySwitches.forEach(function (item) {
    const element = document.getElementById(item.id);

    if (element) {
        element.checked = item.status === savedAvailability;
    }
});

localStorage.setItem(
    "providerAvailability",
    savedAvailability
);


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
// Load provider payment transaction history
await loadProviderPaymentTransactions();
           

/* ---------------------------------------------------------
   LOAD CUSTOMER MESSAGES
   --------------------------------------------------------- */

const messages =
    await loadProviderMessages();

window.oneClickMessages =
    messages;

renderProviderMessages(
    messages
);
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
// Initialize the customer map before starting provider GPS.
const activeTrackingBooking = bookings.find(
    booking =>
        booking.status === "on_the_way" ||
        booking.status === "in_progress"
);

if (activeTrackingBooking) {
    startProviderLocationTracking(
        activeTrackingBooking.id
    );
}
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
console.table(
    data.results.map(request => ({
        id: request.id,
        service: request.service_name || request.service,
        provider: request.provider,
        status: request.status,
        address: request.address
    }))
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

async function loadProviderMessages() {
    try {

        let response = await fetch(
            `${API_BASE}/services/messages/`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to load provider messages: ${response.status}`
            );
        }

        let data = await response.json();

        let messages =
            Array.isArray(data)
                ? data
                : Array.isArray(data.results)
                    ? data.results
                    : [];

        /*
         * Load all remaining DRF pages.
         */
        let nextPage =
            data.next;

        while (nextPage) {

            const nextResponse =
    await fetch(
        nextPage,
                    {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
                            "Content-Type": "application/json"
                        }
                    }
                );

            if (!nextResponse.ok) {
                throw new Error(
                    `Failed to load provider messages: ${nextResponse.status}`
                );
            }

            const nextData =
                await nextResponse.json();

            if (Array.isArray(nextData.results)) {
                messages =
                    messages.concat(
                        nextData.results
                    );
            }

            nextPage =
                nextData.next;
        }

        console.log(
            "Provider messages:",
            messages
        );

        return messages;

    } catch (error) {

        console.error(
            "Error loading provider messages:",
            error
        );

        return [];
    }
}





/* =========================================================
   PROVIDER PAYMENT TRANSACTION HISTORY
========================================================= */

async function loadProviderPaymentTransactions() {

    const container = document.getElementById(
        "providerPaymentHistoryContainer"
    );

    if (!container) return;

    const token = getAccessToken();

    if (!token) {
        container.innerHTML = `
            <div class="alert alert-warning">
                Please login again to view payment history.
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="text-center text-muted py-4">
            <i class="fa-solid fa-spinner fa-spin me-2"></i>
            Loading payment history...
        </div>
    `;

    try {

        const response = await fetch(
            `${API_BASE}/bookings/payment/transactions/`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
            throw new Error("Your login session has expired. Please login again.");
        }

        if (!response.ok) {
            throw new Error(
                data.error ||
                data.detail ||
                `Payment history request failed: ${response.status}`
            );
        }

        const transactions = Array.isArray(data)
            ? data
            : Array.isArray(data.results)
                ? data.results
                : [];

        console.log("Provider payment transactions:", transactions);

        renderProviderPaymentTransactions(transactions);

    } catch (error) {

        console.error("Provider payment history error:", error);

        container.innerHTML = `
            <div class="alert alert-danger">
                ${escapePaymentText(error.message)}
            </div>
        `;
    }
}


/* =========================================================
   RENDER PROVIDER PAYMENT TRANSACTIONS
========================================================= */

function renderProviderPaymentTransactions(transactions) {

    const container = document.getElementById(
        "providerPaymentHistoryContainer"
    );

    if (!container) return;

    if (!transactions.length) {

        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fa-solid fa-receipt fa-2x mb-3"></i>
                <h6>No payment transactions yet</h6>
                <p class="mb-0">
                    Your booking payment records will appear here.
                </p>
            </div>
        `;

        return;
    }

    const rows = transactions.map(transaction => {

        const status = String(transaction.status || "pending").toLowerCase();

        const statusClasses = {
            completed: "bg-success",
            pending: "bg-warning text-dark",
            failed: "bg-danger",
            conflict: "bg-secondary"
        };

        const statusClass =
            statusClasses[status] || "bg-secondary";

        const amount = Number(transaction.amount || 0);

        const createdDate = transaction.created_at
            ? new Date(transaction.created_at).toLocaleString()
            : "—";

        const transactionId =
            transaction.transaction_id || "—";

        return `
            <tr>

                <td>
                    #${escapePaymentText(transaction.booking_id)}
                </td>

                <td>
                    ${escapePaymentText(transaction.customer_name || "Customer")}
                </td>

                <td class="fw-semibold">
                    Rs. ${amount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}
                </td>

                <td>
                    ${escapePaymentText(
                        String(transaction.method || "—").toUpperCase()
                    )}
                </td>

                <td>
                    <span class="badge ${statusClass}">
                        ${escapePaymentText(status.toUpperCase())}
                    </span>
                </td>

                <td>
                    ${escapePaymentText(transactionId)}
                </td>

                <td>
                    ${escapePaymentText(createdDate)}
                </td>

            </tr>
        `;

    }).join("");

    container.innerHTML = `
        <table class="table table-hover align-middle">

            <thead>
                <tr>
                    <th>Booking</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Transaction ID</th>
                    <th>Date</th>
                </tr>
            </thead>

            <tbody>
                ${rows}
            </tbody>

        </table>
    `;
}


/* =========================================================
   SAFE PAYMENT HISTORY TEXT
========================================================= */

function escapePaymentText(value) {

    return String(value ?? "").replace(/[&<>"']/g, character => {

        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];

    });
}


/* =========================================================
   REFRESH PAYMENT HISTORY BUTTON
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const refreshButton = document.getElementById(
        "refreshProviderPaymentsBtn"
    );

    if (refreshButton) {
        refreshButton.addEventListener("click", function () {
            loadProviderPaymentTransactions();
        });
    }

});





function renderProviderMessages(messages) {

    const container =
        document.getElementById("providerMessagesList");

    const countBadge =
        document.getElementById("customerMessageBadge");

    if (!container) {
        console.error(
            "Provider messages container not found."
        );
        return;
    }

    /*
     * Only show messages that belong to
     * the currently logged-in provider.
     *
     * Provider ID is obtained from the dashboard
     * data already loaded by the dashboard.
     */

   const providerId =
    window.oneClickProvider?.id;

    const providerMessages =
        providerId
            ? messages.filter(
                message =>
                    Number(message.provider) ===
                    Number(providerId)
            )
            : messages;

    if (countBadge) {
        countBadge.textContent =
            providerMessages.length;
    }

    if (!providerMessages.length) {

        container.innerHTML = `
            <div class="request-empty-state">

                <span class="item-icon bg-primary-soft">

                    <i class="fa-regular fa-comments"></i>

                </span>

                <div>

                    <h5>
                        No customer messages
                    </h5>

                    <p>
                        Messages from your customers
                        will appear here.
                    </p>

                </div>

            </div>
        `;

        return;
    }


    /*
     * Group messages by customer.
     */

    const conversations = {};

    providerMessages.forEach(message => {

        const customerId =
            message.sender === providerId
                ? message.receiver
                : message.sender;

        if (!conversations[customerId]) {
            conversations[customerId] = [];
        }

        conversations[customerId].push(message);

    });


    container.innerHTML = Object.values(conversations)
        .map(conversation => {

            conversation.sort(
                (a, b) =>
                    new Date(a.created_at) -
                    new Date(b.created_at)
            );

            const latest =
                conversation[conversation.length - 1];

            const customerName =
                latest.sender === providerId
                    ? latest.receiver_name || "Customer"
                    : latest.sender_name || "Customer";

            return `
                <div
                    class="border rounded p-3 mb-3"
                    data-customer-id="${latest.sender === providerId
                        ? latest.receiver
                        : latest.sender}"
                >

                    <div
                        class="d-flex justify-content-between
                               align-items-center mb-2"
                    >

                        <strong>
                            ${customerName}
                        </strong>

                        <small class="text-muted">
                            ${new Date(
                                latest.created_at
                            ).toLocaleString()}
                        </small>

                    </div>


                    <div class="mb-3">

                        ${conversation.map(message => {

                            const isProvider =
                                Number(message.sender) ===
                                Number(providerId);

                            return `
                                <div
                                    class="mb-2
                                    ${isProvider
                                        ? "text-end"
                                        : "text-start"}"
                                >

                                  <div
   <div
    class="d-inline-block
    p-2 rounded
    ${isProvider
        ? "bg-primary text-white"
        : "bg-light"}"
>

    ${message.content || ""}

    ${
        message.image
            ? `
                <div class="message-image-wrapper mt-2">
                    <img
                        src="${
                            message.image.startsWith("http")
                                ? message.image
                                : `${API_BASE.replace("/api", "")}${message.image}`
                        }"
                        alt="Shared image"
                        class="message-shared-image"
                        loading="lazy"
                    >
                </div>
              `
            : ""
    }

</div>

    ${
        message.image
            ? `
                <div class="message-image-wrapper mt-2">
                    <img
                        src="${
                            message.image.startsWith("http")
                                ? message.image
                                : `${API_BASE.replace("/api", "")}${message.image}`
                        }"
                        alt="Shared image"
                        class="message-shared-image"
                        loading="lazy"
                    >
                </div>
              `
            : ""
    }

</div>

                                </div>
                            `;

                        }).join("")}

                    </div>


                    <div class="input-group">

                        <input
                            type="text"
                            class="form-control"
                            placeholder="Type your reply..."
                            id="providerReply-${latest.sender === providerId
                                ? latest.receiver
                                : latest.sender}"
                        >

                        <button
                            class="btn btn-primary"
                            type="button"
                            onclick="sendProviderMessage(
                                ${latest.sender === providerId
                                    ? latest.receiver
                                    : latest.sender},
                                ${latest.provider}
                            )"
                        >

                            <i class="fa-solid fa-paper-plane"></i>

                            Send

                        </button>

                    </div>

                </div>
            `;

        })
        .join("");
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
            Customer: ${escapeHtml(quotation.request_customer || "Customer")}
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
    provider.verification_status === "approved";


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
    bookings.filter(function (booking) {
        return booking.status === "completed";
    });


    const currentDate =
        new Date();


    const currentYear =
        currentDate.getFullYear();


    const currentMonth =
        currentDate.getMonth() + 1;


    const monthlyEarnings =
        completedBookings.reduce(
            function (total, booking) {

              if (
    booking.payment_status !== "paid" ||
    !booking.booking_date
) {
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
    booking.status === "in_progress" ||
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
booking.status === "on_the_way" ||
booking.status === "in_progress" ||
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

function updateProviderCustomerMap(booking) {

    const mapElement = document.getElementById(
        "providerCustomerMap"
    );

    const addressElement = document.getElementById(
        "providerMapAddress"
    );

    if (!mapElement || !window.L) {
        console.error("Map container or Leaflet not found.");
        return;
    }

    const lat = Number(booking.latitude);
    const lng = Number(booking.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        addressElement.textContent = "Customer coordinates unavailable.";
        return;
    }

    if (!providerCustomerMap) {

        providerCustomerMap = L.map(mapElement).setView(
            [lat, lng],
            16
        );

        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution: "&copy; OpenStreetMap contributors"
            }
        ).addTo(providerCustomerMap);

    } else {

        providerCustomerMap.setView([lat, lng], 16);
    }

    if (providerCustomerMarker) {
        providerCustomerMarker.remove();
    }

    providerCustomerMarker = L.marker([lat, lng])
        .addTo(providerCustomerMap)
        .bindPopup("Customer Location")
        .openPopup();

    addressElement.textContent = booking.address || "Customer location";

setTimeout(function () {
    providerCustomerMap.invalidateSize(true);
}, 600);
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


    const currentJob =
    bookings
        .filter(function (booking) {
            return (
                booking.status === "accepted" ||
                booking.status === "on_the_way" ||
                booking.status === "in_progress" ||
                (
                    booking.status === "completed" &&
                    booking.payment_method === "cash" &&
                    booking.payment_status !== "paid"
                )
            );
        })
        .sort(function (a, b) {
            return String(a.booking_date || "").localeCompare(
                String(b.booking_date || "")
            ) || String(a.booking_time || "").localeCompare(
                String(b.booking_time || "")
            );
        })[0];

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

        const startJobBtn =
    document.getElementById("startJobBtn");

const completeJobBtn =
    document.getElementById("completeJobBtn");

    const confirmCashPaymentBtn =
    document.getElementById("confirmCashPaymentBtn");

const startServiceBtn =
    document.getElementById("startServiceBtn");


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

        if (startJobBtn) {
    startJobBtn.style.display = "none";
}

if (completeJobBtn) {
    completeJobBtn.style.display = "none";
}

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
let progressLabel = "Accepted";

if (currentJob.status === "on_the_way") {
    progress = 65;
    progressLabel = "On the Way";
}

if (currentJob.status === "in_progress") {
    progress = 75;
    progressLabel = "In Progress";
}

if (currentJob.status === "completed") {
    progress = 100;
    progressLabel = "Completed";
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


    
panel.dataset.bookingId = currentJob.id;
panel.dataset.priceType =
    currentJob.price_type || "fixed";

panel.dataset.priceApprovalStatus =
    currentJob.price_approval_status || "not_required";
console.log("CURRENT JOB MAP DATA:", currentJob);
updateProviderCustomerMap(currentJob);

// Show Start Job only after provider accepts the booking.
if (startJobBtn) {
    startJobBtn.style.display =
        currentJob.status === "accepted"
            ? "inline-flex"
            : "none";
}

// Handle Start Service and negotiated pricing.
if (startServiceBtn) {

    startServiceBtn.disabled = false;

    if (currentJob.status !== "on_the_way") {

        startServiceBtn.style.display = "none";

    } else {

        startServiceBtn.style.display = "inline-flex";

        // Fixed-price bookings work exactly as before.
        if (currentJob.price_type !== "negotiable") {

            startServiceBtn.innerHTML =
                '<i class="fa-solid fa-play"></i> Start Service';

        } else {

            const approvalStatus =
                currentJob.price_approval_status;

            if (approvalStatus === "approved") {

                startServiceBtn.innerHTML =
                    '<i class="fa-solid fa-play"></i> Start Service';

            } else if (approvalStatus === "pending") {

                startServiceBtn.disabled = true;

                startServiceBtn.innerHTML =
                    '<i class="fa-solid fa-clock"></i> Waiting for Customer Approval';

            } else if (approvalStatus === "rejected") {

                startServiceBtn.innerHTML =
                    '<i class="fa-solid fa-rotate"></i> Revise Price';

            } else {

                startServiceBtn.innerHTML =
                    '<i class="fa-solid fa-handshake"></i> Submit Agreed Price';
            }
        }
    }
}



// Show Complete Job only after provider starts the job.
if (completeJobBtn) {
    completeJobBtn.style.display =
        currentJob.status === "in_progress"
            ? "inline-flex"
            : "none";
}


// Show cash confirmation only for completed,
// unpaid bookings where the customer selected cash.
if (confirmCashPaymentBtn) {
    confirmCashPaymentBtn.style.display =
        currentJob.status === "completed" &&
        currentJob.payment_method === "cash" &&
        currentJob.payment_status !== "paid"
            ? "inline-flex"
            : "none";
}


if (
    confirmCashPaymentBtn &&
    confirmCashPaymentBtn.dataset.listenerAttached !== "true"
) {
    confirmCashPaymentBtn.dataset.listenerAttached = "true";

    confirmCashPaymentBtn.addEventListener("click", async function () {

        const panel = document.querySelector(".current-job-panel");
        const bookingId = panel?.dataset.bookingId;

        if (!bookingId) {
            alert("Booking ID not found.");
            return;
        }

        const confirmed = confirm(
            "Confirm that you received the cash payment? (Demo only)"
        );

        if (!confirmed) return;

        confirmCashPaymentBtn.disabled = true;
        confirmCashPaymentBtn.textContent = " Confirming...";

        try {
            const token = localStorage.getItem("access_token");

            const response = await fetch(
                `${API_BASE}/bookings/payment/cash/confirm/`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        booking_id: bookingId
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Cash confirmation failed.");
            }

            currentJob.payment_status = "paid";

            confirmCashPaymentBtn.style.display = "none";

            alert("Demo cash payment confirmed successfully!");

            console.log("Cash payment:", result);

        } catch (error) {
            console.error("Cash confirmation error:", error);
            alert(error.message);
            confirmCashPaymentBtn.disabled = false;
            confirmCashPaymentBtn.innerHTML =
                '<i class="fa-solid fa-money-bill-wave"></i> Confirm Cash Received';
        }
    });
}
// End renderCurrentJob() here.
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
    // VIEW UPCOMING JOB DETAILS

if (
    detailsButton &&
    detailsButton.dataset.listenerAttached !== "true"
) {

    detailsButton.dataset.listenerAttached = "true";

    detailsButton.addEventListener("click", function () {

        const bookingId =
            detailsButton.dataset.bookingId;

        if (!bookingId) {
            alert("Booking ID is unavailable.");
            return;
        }

        window.location.href =
            `booking-details.html?id=${encodeURIComponent(bookingId)}`;

    });
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
    bookings.filter(function (booking) {
        return (
           booking.status === "accepted" ||
booking.status === "on_the_way" ||
booking.status === "in_progress"
        );
    }).length;


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
    booking.status !== "completed" ||
    booking.payment_status !== "paid"
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
    booking.status !== "completed" ||
    booking.payment_status !== "paid"
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
    booking.payment_status !== "paid" ||
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
   ONLINE / OFFLINE TOGGLE
   ========================================================================== */

function initOnlineToggle() {
    const toggle = document.getElementById("onlineToggle");

    if (!toggle) {
        return;
    }

    toggle.addEventListener("change", async function () {
        const newAvailability = toggle.checked
            ? "available"
            : "unavailable";

        try {
            const data = await updateProviderAvailability(newAvailability);

            localStorage.setItem(
                "providerAvailability",
                data.availability
            );

            const switches = [
                { id: "availableToday", status: "available" },
                { id: "unavailable", status: "unavailable" },
                { id: "vacationMode", status: "vacation" }
            ];

            switches.forEach(function (item) {
                const element = document.getElementById(item.id);

                if (element) {
                    element.checked = item.status === data.availability;
                }
            });

            console.log("Availability updated:", data.availability);

        } catch (error) {
            console.error("Availability update failed:", error);

            toggle.checked = !toggle.checked;

            alert(error.message || "Failed to update availability.");
        }
    });
}


/* ==========================================================================
   UPDATE PROVIDER AVAILABILITY
   ========================================================================== */

async function updateProviderAvailability(availability) {
    const token = getAccessToken();

    if (!token) {
        throw new Error(
            "Your login session has expired. Please login again."
        );
    }

    const response = await fetch(
        `${API_BASE}/providers/availability/`,
        {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                availability: availability
            })
        }
    );

    const data = await response.json().catch(function () {
        return {};
    });

    if (response.status === 401) {
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

    if (window.oneClickProvider) {
        window.oneClickProvider.available = data.available;
        window.oneClickProvider.availability_status = data.availability;
    }

    // Update top dashboard status after backend confirms success.
    updateOnlineStatus(data.availability);

    return data;
}


/* ==========================================================================
   UPDATE ONLINE / OFFLINE INDICATOR
   ========================================================================== */

function updateOnlineStatus(availability) {

    const toggle = document.getElementById("onlineToggle");
    const wrap = document.querySelector(".status-toggle-wrap");
    const label = document.getElementById("statusLabel");
    const dot = document.getElementById("statusDot");

    if (!toggle || !label) {
        return;
    }

    // Support both Boolean and string values.
    const isOnline =
        availability === true ||
        availability === "available";

    toggle.checked = isOnline;

    label.textContent = isOnline ? "Online" : "Offline";

    if (wrap) {
        wrap.classList.toggle("offline", !isOnline);
    }

    if (dot) {
        dot.style.backgroundColor = isOnline ? "#22c55e" : "#ef4444";
    }
}

/* ==========================================================================
   AVAILABILITY SWITCHES
   ========================================================================== */

function initAvailabilitySwitches() {
    const availableToday = document.getElementById("availableToday");
    const unavailable = document.getElementById("unavailable");
    const vacationMode = document.getElementById("vacationMode");

    if (!availableToday || !unavailable || !vacationMode) {
        return;
    }

    const switches = [
        { element: availableToday, status: "available" },
        { element: unavailable, status: "unavailable" },
        { element: vacationMode, status: "vacation" }
    ];

    // Restore the last saved status after refreshing.
    const savedStatus = localStorage.getItem("providerAvailability") || "available";

    switches.forEach(function (item) {
        item.element.checked = item.status === savedStatus;
    });

    updateOnlineStatus(savedStatus);

    switches.forEach(function (item) {
        item.element.addEventListener("change", async function () {
            if (!item.element.checked) {
                return;
            }

            switches.forEach(function (other) {
                other.element.checked = other === item;
            });

            try {
                await updateProviderAvailability(item.status);

                localStorage.setItem("providerAvailability", item.status);

                console.log("Availability updated:", item.status);
            } catch (error) {
                alert(error.message || "Failed to update availability.");
            }
        });
    });
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

async function updateBookingStatus(bookingId, newStatus, button) {
    const token = getAccessToken();

    if (!token) {
        alert("Your login session has expired. Please login again.");
        return false;
    }

    const originalHTML = button?.innerHTML || "";

    if (button) {
        button.disabled = true;

        button.innerHTML =
            newStatus === "on_the_way"
                ? '<i class="fa-solid fa-spinner fa-spin"></i> Starting Job...'
                : newStatus === "in_progress"
                    ? '<i class="fa-solid fa-spinner fa-spin"></i> Starting Service...'
                    : newStatus === "completed"
                        ? '<i class="fa-solid fa-spinner fa-spin"></i> Completing...'
                        : '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';
    }

    try {
        const response = await fetch(
            `${API_BASE}/bookings/provider/${bookingId}/`,
            {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: newStatus
                })
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.detail ||
                data.error ||
                `Booking update failed: ${response.status}`
            );
        }

      

        // Stop GPS tracking when the job is completed.
        if (newStatus === "completed") {
            stopProviderLocationTracking();
        }

        await loadProviderDashboard();

if (newStatus === "on_the_way") {

    const navigationScreen = document.getElementById(
        "providerNavigationScreen"
    );

    if (navigationScreen) {
        navigationScreen.style.display = "block";
    }

    // Get the latest booking data after dashboard reload.
    const currentJobPanel = document.querySelector(
        ".current-job-panel"
    );

    const currentBookingId = Number(
        currentJobPanel?.dataset.bookingId
    );

    setTimeout(() => {

        // Reinitialize/refresh the map after it becomes visible.
        if (currentBookingId === Number(bookingId)) {
            // The customer marker should already exist from renderCurrentJob().
            if (providerCustomerMap) {
                providerCustomerMap.invalidateSize(true);
            }
        }

        

    }, 700);
}


return true;

    } catch (error) {
        console.error("Booking update failed:", error);

        alert(error.message || "Unable to update booking.");

        if (button) {
            button.disabled = false;
            button.innerHTML = originalHTML;
        }

        return false;
    }
}


/* ==========================================================================
   CURRENT JOB BUTTON LISTENERS
========================================================================== */

// The script is loaded at the bottom of the HTML,
// so attach listeners directly instead of waiting for DOMContentLoaded.

(function initCurrentJobButtons() {

    const startJobBtn =
        document.getElementById("startJobBtn");

    const startServiceBtn =
        document.getElementById("startServiceBtn");

    const completeJobBtn =
        document.getElementById("completeJobBtn");



        
    /* ---------------- START JOB ---------------- */

    if (startJobBtn &&
        startJobBtn.dataset.listenerAttached !== "true") {

        startJobBtn.dataset.listenerAttached = "true";

        startJobBtn.addEventListener("click", async function () {

            const panel =
                document.querySelector(".current-job-panel");

            const bookingId =
                panel?.dataset.bookingId;

            if (!bookingId) {
                alert("Booking ID not found.");
                return;
            }

            const confirmed = confirm(
                "Are you ready to start this service?"
            );

            if (!confirmed) {
                return;
            }

            startJobBtn.disabled = true;

            startJobBtn.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Starting...';

            const success = await updateBookingStatus(
                bookingId,
               "on_the_way",
                startJobBtn
            );

            if (success) {
                console.log("Job started:", bookingId);
            }

        });
    }

   
/* ---------------- START SERVICE ---------------- */

if (
    startServiceBtn &&
    startServiceBtn.dataset.listenerAttached !== "true"
) {

    startServiceBtn.dataset.listenerAttached = "true";

    startServiceBtn.addEventListener("click", async function () {

        const panel = document.querySelector(".current-job-panel");

        const bookingId = panel?.dataset.bookingId;

        if (!bookingId) {
            alert("Booking ID not found.");
            return;
        }

        const priceType = panel.dataset.priceType || "fixed";
        const approvalStatus =
            panel.dataset.priceApprovalStatus || "not_required";

        // Negotiable booking: wait for the customer's decision.
        if (
            priceType === "negotiable" &&
            approvalStatus === "pending"
        ) {
            alert("Waiting for the customer to approve the proposed price.");
            return;
        }

        // Negotiable booking: customer rejected or no proposal exists.
        if (
            priceType === "negotiable" &&
            approvalStatus !== "approved"
        ) {

            const modalElement = document.getElementById(
                "negotiatedPriceModal"
            );

            if (!modalElement || typeof bootstrap === "undefined") {
                alert("Negotiated price form could not be opened.");
                return;
            }

            document.getElementById(
                "negotiatedPriceBookingId"
            ).value = bookingId;

            document.getElementById(
                "negotiatedPriceAmount"
            ).value = "";

            document.getElementById(
                "negotiatedWorkDescription"
            ).value = "";

            document.getElementById(
                "negotiatedPriceError"
            ).classList.add("d-none");

            document.getElementById(
                "negotiatedPriceSuccess"
            ).classList.add("d-none");

            bootstrap.Modal.getOrCreateInstance(
                modalElement
            ).show();

            return;
        }

        // Fixed-price or customer-approved booking.
        const confirmed = confirm(
            "Have you reached the customer and are you ready to start the service?"
        );

        if (!confirmed) {
            return;
        }

        startServiceBtn.disabled = true;

        startServiceBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Starting Service...';

        const success = await updateBookingStatus(
            bookingId,
            "in_progress",
            startServiceBtn
        );

        if (success) {

            console.log("Service started:", bookingId);

            const navigationScreen = document.getElementById(
                "providerNavigationScreen"
            );

            if (navigationScreen) {
                navigationScreen.style.display = "none";
            }

            stopProviderLocationTracking();
        }

    });
}

    
    /* ---------------- COMPLETE JOB ---------------- */

    if (completeJobBtn &&
        completeJobBtn.dataset.listenerAttached !== "true") {

        completeJobBtn.dataset.listenerAttached = "true";

        completeJobBtn.addEventListener("click", async function () {

            const panel =
                document.querySelector(".current-job-panel");

            const bookingId =
                panel?.dataset.bookingId;

            if (!bookingId) {
                alert("Booking ID not found.");
                return;
            }

            const confirmed = confirm(
                "Are you sure this service has been completed?"
            );

            if (!confirmed) {
                return;
            }

            completeJobBtn.disabled = true;

            completeJobBtn.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Completing...';

            const success = await updateBookingStatus(
                bookingId,
                "completed",
                completeJobBtn
            );

            if (success) {
                console.log("Job completed:", bookingId);
            }

        });
    }

})();


/* ==========================================================================
   SUBMIT NEGOTIATED PRICE
   ========================================================================== */

(function initNegotiatedPriceSubmission() {

    const submitBtn = document.getElementById(
        "submitNegotiatedPriceBtn"
    );

    if (
        !submitBtn ||
        submitBtn.dataset.listenerAttached === "true"
    ) {
        return;
    }

    submitBtn.dataset.listenerAttached = "true";

    submitBtn.addEventListener("click", async function () {

        const bookingId = document.getElementById(
            "negotiatedPriceBookingId"
        ).value;

        const priceInput = document.getElementById(
            "negotiatedPriceAmount"
        );

        const descriptionInput = document.getElementById(
            "negotiatedWorkDescription"
        );

        const errorBox = document.getElementById(
            "negotiatedPriceError"
        );

        const successBox = document.getElementById(
            "negotiatedPriceSuccess"
        );

        const price = priceInput.value.trim();
        const description = descriptionInput.value.trim();

        errorBox.classList.add("d-none");
        successBox.classList.add("d-none");

        if (!bookingId) {
            errorBox.textContent = "Booking ID is missing.";
            errorBox.classList.remove("d-none");
            return;
        }

        if (!price || Number(price) <= 0 || !Number.isFinite(Number(price))) {
            errorBox.textContent = "Enter a valid price greater than zero.";
            errorBox.classList.remove("d-none");
            return;
        }

        if (!description) {
            errorBox.textContent = "Please describe the agreed work.";
            errorBox.classList.remove("d-none");
            return;
        }

        const token = getAccessToken();

        if (!token) {
            errorBox.textContent = "Your session expired. Please log in again.";
            errorBox.classList.remove("d-none");
            return;
        }

        submitBtn.disabled = true;

        submitBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';

        try {

            const response = await fetch(
                `${API_BASE}/bookings/${bookingId}/negotiated-price/`,
                {
                    method: "PATCH",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        negotiated_price: price,
                        negotiated_work_description: description
                    })
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    result.error ||
                    result.detail ||
                    "Unable to submit the negotiated price."
                );
            }

            successBox.textContent =
                "Price submitted. Waiting for customer approval.";

            successBox.classList.remove("d-none");

            // Close modal and refresh booking information.
            const modalElement = document.getElementById(
                "negotiatedPriceModal"
            );

            const modalInstance =
                bootstrap.Modal.getOrCreateInstance(modalElement);

            modalInstance.hide();

            await loadProviderDashboard();

            console.log("Negotiated price submitted:", result);

        } catch (error) {

            console.error("Negotiated price submission failed:", error);

            errorBox.textContent = error.message;
            errorBox.classList.remove("d-none");

        } finally {

            submitBtn.disabled = false;

            submitBtn.innerHTML =
                '<i class="fa-solid fa-paper-plane me-1"></i> Submit Price';
        }

    });

})();



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

        // New document click listener ends here

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

    if (!acceptButton) return;

    const quotationId = acceptButton.dataset.quotationId;

    if (!quotationId) return;

    if (!confirm("Accept the customer's counter-offer?")) return;

    const token = localStorage.getItem("access_token");

    if (!token) {
        alert("Please login again.");
        return;
    }

    try {
        acceptButton.disabled = true;
        acceptButton.textContent = "Accepting...";

        const response = await fetch(
            `${API_BASE}/services/quotations/${quotationId}/provider-accept/`,
            {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.detail || data.error || "Could not accept counter-offer."
            );
        }

        alert("Customer counter-offer accepted!");

        const quotations = await loadProviderQuotations();
        window.oneClickQuotations = quotations;
        renderProviderCounterOffers(quotations);

    } catch (error) {
        alert(error.message);
        acceptButton.disabled = false;
        acceptButton.textContent = "Accept Counter Offer";
    }
});


/*
 * Submit button.
 */

const submitButton =
    document.getElementById("submitFinalOfferBtn");

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

/* =========================================================
   SEND PROVIDER MESSAGE
========================================================= */

async function sendProviderMessage(customerId, providerId) {

    const input =
        document.getElementById(
            `providerReply-${customerId}`
        );

    if (!input) {

        console.error(
            "Provider reply input not found."
        );

        return;
    }

    const message =
        input.value.trim();

    if (!message) {
        return;
    }

    const token =
        localStorage.getItem("access_token");

    if (!token) {

        console.error(
            "No access token found."
        );

        return;
    }

    try {

        console.log(
            "Sending provider message...",
            {
                customerId,
                providerId,
                message
            }
        );

        const response =
            await fetch(
                `${API_BASE}/services/messages/`,
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

    provider:
        Number(providerId),

    receiver:
        Number(customerId),

    content:
        message

})
                }
            );


        const data =
            await response.json();


        console.log(
            "Provider message response:",
            response.status,
            data
        );


        if (!response.ok) {

            throw new Error(
                data.detail ||
                data.error ||
                `Failed to send message: ${response.status}`
            );
        }


        /*
         * Clear input after successful send.
         */

        input.value = "";


        /*
         * Reload messages.
         */

        const messages =
            await loadProviderMessages();


        window.oneClickMessages =
            messages;


        renderProviderMessages(
            messages
        );


        console.log(
            "Provider message sent successfully."
        );

    }
    catch (error) {

        console.error(
            "Error sending provider message:",
            error
        );

        alert(
            error.message ||
            "Failed to send message."
        );
    }
}



/* =========================================================
   PROVIDER WORK PHOTO UPLOAD
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const uploadBtn = document.getElementById("uploadWorkPhotoBtn");
    const submitBtn = document.getElementById("submitWorkPhotoBtn");

    const modalElement = document.getElementById("workPhotoModal");

    if (!uploadBtn || !submitBtn || !modalElement) return;

    const modal = new bootstrap.Modal(modalElement);

    uploadBtn.addEventListener("click", function () {
        modal.show();
    });

    submitBtn.addEventListener("click", async function () {

        const imageInput = document.getElementById("workPhotoInput");
        const captionInput = document.getElementById("workPhotoCaption");
        const message = document.getElementById("workPhotoMessage");

        const token = getAccessToken();

        if (!imageInput.files.length) {
            message.textContent = "Please select an image.";
            return;
        }

        const formData = new FormData();
        formData.append("image", imageInput.files[0]);
        formData.append("caption", captionInput.value);

        submitBtn.disabled = true;
        message.textContent = "Uploading...";

        try {
            const response = await fetch(
                `${API_BASE}/providers/work-photos/upload/`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    },
                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Upload failed.");
            }

            message.textContent = "Photo uploaded successfully!";
            imageInput.value = "";
            captionInput.value = "";

        } catch (error) {
            message.textContent = error.message;
        } finally {
            submitBtn.disabled = false;
        }
    });

});


/* =========================================================
   LOAD AND DELETE PROVIDER WORK PHOTOS
========================================================= */

document.addEventListener("DOMContentLoaded", async function () {

    const container = document.getElementById("myWorkPhotosContainer");

    if (!container) return;

    async function loadWorkPhotos() {
        container.innerHTML = '<p>Loading photos...</p>';

        try {
            const response = await fetch(
                `${API_BASE}/providers/dashboard/`,
                {
                    headers: {
                        "Authorization": `Bearer ${getAccessToken()}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Could not load photos.");
            }

            const photos = data.provider.work_photos || [];

            if (!photos.length) {
                container.innerHTML = "<p>No work photos uploaded yet.</p>";
                return;
            }

            container.innerHTML = "";

            photos.forEach(photo => {
                const card = document.createElement("div");
                card.className = "provider-work-photo-card";

                const img = document.createElement("img");
                img.src = photo.image;
                img.alt = photo.caption || "Work photo";

                const caption = document.createElement("p");
                caption.textContent = photo.caption || "";

                const deleteBtn = document.createElement("button");
                deleteBtn.type = "button";
                deleteBtn.className = "btn btn-danger btn-sm m-2";
                deleteBtn.textContent = "Delete";

                deleteBtn.addEventListener("click", async function () {
                    if (!confirm("Delete this work photo?")) return;

                    deleteBtn.disabled = true;

                    try {
                        const deleteResponse = await fetch(
                            `${API_BASE}/providers/work-photos/${photo.id}/delete/`,
                            {
                                method: "DELETE",
                                headers: {
                                    "Authorization": `Bearer ${getAccessToken()}`
                                }
                            }
                        );

                        const result = await deleteResponse.json();

                        if (!deleteResponse.ok) {
                            throw new Error(result.error || "Delete failed.");
                        }

                        card.remove();

                        if (!container.querySelector(".provider-work-photo-card")) {
                            container.innerHTML = "<p>No work photos uploaded yet.</p>";
                        }

                    } catch (error) {
                        alert(error.message);
                        deleteBtn.disabled = false;
                    }
                });

                card.append(img, caption, deleteBtn);
                container.appendChild(card);
            });

        } catch (error) {
            container.textContent = error.message;
        }
    }

    loadWorkPhotos();

});




/* =========================================================
   PROVIDER NOTIFICATION DROPDOWN
   ========================================================= */

async function loadProviderNotificationDropdown() {

    const dropdownList = document.getElementById(
        "providerNotificationList"
    );

    const badge = document.getElementById(
        "providerUnreadBadge"
    );

    if (!dropdownList) return;

    const token = getAccessToken();

    if (!token) return;

    try {

        const response = await fetch(
            `${API_BASE}/notifications/`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                `Notification API error: ${response.status}`
            );
        }

        const data = await response.json();

        const notifications = Array.isArray(data)
            ? data
            : (data.results || []);

        const unreadCount = notifications.filter(
            item => !item.is_read
        ).length;

        // Update unread badge
        if (badge) {

            badge.textContent = unreadCount;

            badge.classList.toggle(
                "d-none",
                unreadCount === 0
            );
        }

        // Show latest five notifications
        const latestNotifications = notifications.slice(0, 5);

        dropdownList.innerHTML = "";

        if (latestNotifications.length === 0) {

            dropdownList.innerHTML = `
                <div class="dropdown-item notification-empty">
                    <span class="item-icon bg-primary-soft">
                        <i class="fa-regular fa-bell"></i>
                    </span>
                    <span>
                        <strong>No notifications</strong>
                        <small>You don't have any notifications yet.</small>
                    </span>
                </div>
            `;

            return;
        }

        latestNotifications.forEach(function (item) {

            const notificationItem = document.createElement("div");

            notificationItem.className =
                "dropdown-item notification-empty";

            const icon = document.createElement("span");
            icon.className = "item-icon bg-primary-soft";

            const iconElement = document.createElement("i");
            iconElement.className = "fa-regular fa-bell";

            icon.appendChild(iconElement);

            const content = document.createElement("span");

            const title = document.createElement("strong");
            title.textContent = item.title || "Notification";

            if (!item.is_read) {
                title.style.fontWeight = "700";
            }

            const message = document.createElement("small");
            message.textContent = item.message || "";

            content.appendChild(title);
            content.appendChild(message);

            notificationItem.appendChild(icon);
            notificationItem.appendChild(content);

            dropdownList.appendChild(notificationItem);

        });

    } catch (error) {

        console.error(
            "Provider notification loading error:",
            error
        );

    }
}



/* =========================================================
   ONECLICK — PROVIDER KYC VERIFICATION
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    loadProviderKYCStatus();

    const kycForm = document.getElementById("providerKycForm");

    if (kycForm) {
        kycForm.addEventListener("submit", submitProviderKYC);
    }

});


/* =========================================================
   LOAD KYC STATUS
========================================================= */

async function loadProviderKYCStatus() {

    const section = document.getElementById("providerKycSection");
    const content = document.getElementById("providerKycContent");
    const form = document.getElementById("providerKycForm");

    if (!section || !content || !form) return;

    section.style.display = "block";

    const token = getAccessToken();

    if (!token) {
        content.textContent = "Please login again to check verification status.";
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE}/providers/kyc/status/`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();
        // Also check the provider's final verification status.
const dashboardResponse = await fetch(
    `${API_BASE}/providers/dashboard/`,
    {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    }
);

const dashboardData = await dashboardResponse.json();

if (!dashboardResponse.ok) {
    throw new Error(
        dashboardData.error || "Unable to load provider verification."
    );
}

const verification = dashboardData.verification;

console.log("KYC DEBUG:", {
    kycStatus: data.kyc_status,
    applicationStatus: verification.application_status,
    isVerified: verification.is_verified
});
        if (!response.ok) {
            throw new Error(
                data.error || data.detail || "Unable to load KYC status."
            );
        }

       
        form.style.display = "none";

        const kycStatus = data.kyc_status;
        const applicationStatus = verification.application_status;

        if (verification.is_verified === true) {

            section.style.display = "none";
            return;

        } else if (kycStatus === "pending") {

            content.innerHTML = `
                <p class="text-warning fw-semibold">
                    <i class="fa-solid fa-clock"></i>
                    Verification Pending
                </p>
                <p class="text-muted small">
                    Your documents are submitted and awaiting administrator review.
                </p>
            `;

        } else if (kycStatus === "approved") {

            content.innerHTML = `
                <p class="text-success fw-semibold">
                    <i class="fa-solid fa-check-circle"></i>
                    Documents Approved
                </p>
                <p class="text-muted small">
                    ${
                        applicationStatus === "pending"
                            ? "Your KYC is approved. Your provider application is awaiting administrator approval."
                            : "Your identity documents have been approved."
                    }
                </p>
            `;

        } else if (kycStatus === "rejected") {

            content.innerHTML = `
                <p class="text-danger fw-semibold">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    Verification Rejected
                </p>
                <p class="small">
                    <strong>Reason:</strong>
                    ${escapePaymentText(data.rejection_reason || "Please resubmit your documents.")}
                </p>
                <p class="text-muted small">
                    Please upload all three documents again.
                </p>
            `;

            form.style.display = "block";

            document.getElementById("providerKycSubmitBtn").innerHTML =
                '<i class="fa-solid fa-rotate"></i> Resubmit Documents';

        } else {

            content.innerHTML = `
                <p class="text-muted small">
                    Identity verification has not been submitted yet.
                    Please upload all three required documents.
                </p>
            `;

            form.style.display = "block";
        }


    } catch (error) {

        console.error("Provider KYC status error:", error);

        content.textContent = error.message;

    }

}


/* =========================================================
   SUBMIT KYC DOCUMENTS
========================================================= */

async function submitProviderKYC(event) {

    event.preventDefault();

    const form = document.getElementById("providerKycForm");
    const button = document.getElementById("providerKycSubmitBtn");

    const front = document.getElementById("kycCitizenshipFront").files[0];
    const back = document.getElementById("kycCitizenshipBack").files[0];
    const selfie = document.getElementById("kycVerificationSelfie").files[0];

    if (!front || !back || !selfie) {
        alert("Please select all three required documents.");
        return;
    }

    const files = [front, back, selfie];

    for (const file of files) {

        if (file.size > 5 * 1024 * 1024) {
            alert("Each image must be smaller than 5 MB.");
            return;
        }

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            alert("Please select valid JPG, PNG or WEBP images.");
            return;
        }

    }

    const token = getAccessToken();

    if (!token) {
        alert("Your session has expired. Please login again.");
        return;
    }

    const formData = new FormData();

    formData.append("citizenship_front", front);
    formData.append("citizenship_back", back);
    formData.append("verification_selfie", selfie);

    button.disabled = true;
    button.textContent = "Uploading documents...";

    try {

        const response = await fetch(
            `${API_BASE}/providers/kyc/upload/`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || data.detail || "Document upload failed."
            );
        }

        alert("Your documents have been submitted successfully.");

        form.reset();

        await loadProviderKYCStatus();

    } catch (error) {

        console.error("Provider KYC upload error:", error);

        alert(error.message);

    } finally {

        button.disabled = false;

        button.innerHTML =
            '<i class="fa-solid fa-cloud-arrow-up"></i> Submit for Verification';

    }

}
