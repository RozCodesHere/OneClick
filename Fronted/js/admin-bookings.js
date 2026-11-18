
/* =========================================================
   ONECLICK — ADMIN BOOKING MANAGEMENT
   REAL DATA MODE
   ========================================================= */


/* =========================================================
   CONFIGURATION
   ========================================================= */

const API_BASE = "https://oneclick-backend-6hk7.onrender.com/api";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";


/* =========================================================
   GLOBAL DATA
   ========================================================= */

let currentAdmin = null;
let allBookings = [];
let activeStatus = "all";
let selectedBooking = null;


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", async function () {

    setupBookingEvents();

    try {

        await loadCurrentAdmin();
        await loadBookings();

        renderBookingSummary();
        renderBookings();

        console.log("ONECLICK ADMIN BOOKINGS READY");

    } catch (error) {

        console.error("ADMIN BOOKINGS ERROR:", error);

        const tableBody = document.getElementById("bookingTableBody");

        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="booking-empty">
                        Unable to load bookings.
                        ${escapeHTML(error.message)}
                    </td>
                </tr>
            `;
        }

        const count = document.getElementById("bookingCount");

        if (count) {
            count.textContent = "Booking loading failed.";
        }
    }

});


/* =========================================================
   API REQUEST HELPER
   ========================================================= */

async function apiRequest(url, options = {}) {

    const token = localStorage.getItem(ACCESS_TOKEN_KEY);

    const response = await fetch(
        url.startsWith("http") ? url : `${API_BASE}${url}`,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",

                ...(token ? {
                    Authorization: `Bearer ${token}`
                } : {}),

                ...(options.headers || {})
            }
        }
    );

    if (response.status === 401) {

        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);

        window.location.href = "login.html";

        throw new Error("Authentication expired.");
    }

    let data = {};

    const responseText = await response.text();

    if (responseText) {

        try {
            data = JSON.parse(responseText);
        } catch {
            data = { detail: responseText };
        }

    }

    if (!response.ok) {

        throw new Error(
            data.detail ||
            data.error ||
            `Request failed with status ${response.status}.`
        );

    }

    return data;
}


/* =========================================================
   ADMIN AUTHENTICATION
   ========================================================= */

async function loadCurrentAdmin() {

    const admin = await apiRequest("/users/me/");

    if (!admin || admin.role !== "admin") {

        alert("Admin access required.");

        window.location.href = "login.html";

        throw new Error("Unauthorized access.");
    }

    currentAdmin = admin;

}


/* =========================================================
   LOAD BOOKINGS
   ========================================================= */

async function loadBookings() {

    console.log("Loading admin bookings...");

    const data = await apiRequest("/users/admin/bookings/");

    if (Array.isArray(data)) {

        allBookings = data;

    } else if (Array.isArray(data.results)) {

        allBookings = data.results;

    } else {

        throw new Error("Unexpected booking API response.");

    }

    console.log("ADMIN BOOKINGS:", allBookings);

}


/* =========================================================
   EVENT SETUP
   ========================================================= */

function setupBookingEvents() {

    const searchInput = document.getElementById("bookingSearch");

    if (searchInput) {
        searchInput.addEventListener("input", renderBookings);
    }

    document.querySelectorAll(".booking-filter").forEach(button => {

        button.addEventListener("click", function () {

            document.querySelectorAll(".booking-filter").forEach(item => {
                item.classList.remove("active");
            });

            this.classList.add("active");

            activeStatus = this.dataset.status || "all";

            renderBookings();

        });

    });

    const tableBody = document.getElementById("bookingTableBody");

    if (tableBody) {
        tableBody.addEventListener("click", handleBookingTableClick);
    }

    const exportButton = document.getElementById("exportBookingsBtn");

    if (exportButton) {
        exportButton.addEventListener("click", exportBookingsToCSV);
    }

    const closeButton = document.getElementById("closeBookingModal");

    const closeBottom = document.getElementById("bookingModalCloseBottom");

    const modal = document.getElementById("bookingModal");

    if (closeButton) {
        closeButton.addEventListener("click", closeBookingModal);
    }

    if (closeBottom) {
        closeBottom.addEventListener("click", closeBookingModal);
    }

    if (modal) {

        modal.addEventListener("click", function (event) {

            if (event.target === modal) {
                closeBookingModal();
            }

        });

    }

    document.addEventListener("keydown", function (event) {

        if (
            event.key === "Escape" &&
            modal &&
            modal.classList.contains("show")
        ) {
            closeBookingModal();
        }

    });

}


/* =========================================================
   BOOKING SUMMARY
   ========================================================= */

function renderBookingSummary() {

    const total = allBookings.length;

    const pending = allBookings.filter(booking =>
        booking.status === "pending"
    ).length;

    const active = allBookings.filter(booking =>
        ["accepted", "on_the_way", "in_progress"].includes(booking.status)
    ).length;

    const completed = allBookings.filter(booking =>
        booking.status === "completed"
    ).length;

    const cancelled = allBookings.filter(booking =>
        ["cancelled", "rejected"].includes(booking.status)
    ).length;

    setText("totalBookings", total);
    setText("pendingBookings", pending);
    setText("activeBookings", active);
    setText("completedBookings", completed);
    setText("cancelledBookings", cancelled);

}


/* =========================================================
   FILTER AND SEARCH
   ========================================================= */

function getFilteredBookings() {

    const searchInput = document.getElementById("bookingSearch");

    const searchTerm = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    return allBookings.filter(booking => {

        const matchesStatus =
            activeStatus === "all" ||
            booking.status === activeStatus;

        const searchableText = [

            booking.id,

            booking.customer?.name,
            booking.customer?.email,

            booking.provider?.name,
            booking.provider?.email,

            booking.service?.name,
            booking.service?.category,

            booking.address

        ].join(" ").toLowerCase();

        const matchesSearch =
            !searchTerm || searchableText.includes(searchTerm);

        return matchesStatus && matchesSearch;

    });

}


/* =========================================================
   RENDER BOOKINGS TABLE
   ========================================================= */

function renderBookings() {

    const tableBody = document.getElementById("bookingTableBody");

    if (!tableBody) return;

    const filteredBookings = getFilteredBookings();

    filteredBookings.sort((a, b) => {

        const dateA = new Date(a.created_at || a.booking_date || 0);
        const dateB = new Date(b.created_at || b.booking_date || 0);

        return dateB - dateA;

    });

    if (filteredBookings.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="booking-empty">
                    <i class="fa-solid fa-calendar-xmark"></i>
                    <br>
                    No bookings found.
                </td>
            </tr>
        `;

        updateBookingCount(0);

        return;
    }

    tableBody.innerHTML = filteredBookings.map(booking => {

        const customerName =
            booking.customer?.name || "Unknown Customer";

        const providerName =
            booking.provider?.name || "Unknown Provider";

        const serviceName =
            booking.service?.name || "Unknown Service";

        return `
            <tr>

                <td>
                    <span class="booking-primary">
                        #${escapeHTML(booking.id)}
                    </span>
                </td>

                <td>
                    <div class="booking-primary">
                        ${escapeHTML(customerName)}
                    </div>
                    <div class="booking-muted">
                        ${escapeHTML(booking.customer?.email || "")}
                    </div>
                </td>

                <td>
                    <div class="booking-primary">
                        ${escapeHTML(providerName)}
                    </div>
                    <div class="booking-muted">
                        ${escapeHTML(booking.provider?.email || "")}
                    </div>
                </td>

                <td>
                    ${escapeHTML(serviceName)}
                </td>

                <td>
                    ${escapeHTML(formatDate(booking.booking_date))}
                </td>

                <td>
                    ${escapeHTML(formatTime(booking.booking_time))}
                </td>

                <td>
                    Rs. ${escapeHTML(formatMoney(booking.total_price))}
                </td>

                <td>
                    <span class="booking-status ${getStatusClass(booking.status)}">
                        ${escapeHTML(formatStatus(booking.status))}
                    </span>
                </td>

                <td>
                    <span class="booking-payment-status ${getStatusClass(booking.payment_status)}">
                        ${escapeHTML(formatStatus(booking.payment_status))}
                    </span>
                </td>

                <td>
                    <button
                        type="button"
                        class="booking-view-btn"
                        data-booking-id="${escapeHTML(booking.id)}"
                    >
                        <i class="fa-solid fa-eye"></i>
                        View
                    </button>
                </td>

            </tr>
        `;

    }).join("");

    updateBookingCount(filteredBookings.length);

}


/* =========================================================
   BOOKING COUNT
   ========================================================= */

function updateBookingCount(count) {

    const element = document.getElementById("bookingCount");

    if (element) {

        element.textContent =
            `Showing ${count} of ${allBookings.length} bookings`;

    }

}


/* =========================================================
   TABLE ACTIONS
   ========================================================= */

function handleBookingTableClick(event) {

    const button = event.target.closest("[data-booking-id]");

    if (!button) return;

    const bookingId = button.dataset.bookingId;

    const booking = allBookings.find(item =>
        String(item.id) === String(bookingId)
    );

    if (!booking) return;

    openBookingModal(booking);

}


/* =========================================================
   BOOKING DETAILS MODAL
   ========================================================= */

function openBookingModal(booking) {

    selectedBooking = booking;

    const modal = document.getElementById("bookingModal");
    const content = document.getElementById("bookingModalContent");
    const title = document.getElementById("bookingModalTitle");

    if (!modal || !content) return;

    if (title) {

        title.innerHTML = `
            <i class="fa-solid fa-calendar-check"></i>
            Booking #${escapeHTML(booking.id)}
        `;

    }

    content.innerHTML = `

        <section class="booking-detail-section">

            <h4>
                <i class="fa-solid fa-circle-info"></i>
                Booking Information
            </h4>

            <div class="booking-detail-grid">

                ${detailItem("Booking ID", `#${booking.id}`)}

                ${detailItem("Service", booking.service?.name)}

                ${detailItem("Category", booking.service?.category)}

                ${detailItem("Booking Date", formatDate(booking.booking_date))}

                ${detailItem("Booking Time", formatTime(booking.booking_time))}

                ${detailItem("Total Price", `Rs. ${formatMoney(booking.total_price)}`)}

                ${detailItem("Booking Status", formatStatus(booking.status))}

                ${detailItem("Payment Status", formatStatus(booking.payment_status))}

            </div>

        </section>


        <section class="booking-detail-section">

            <h4>
                <i class="fa-solid fa-users"></i>
                Customer and Provider
            </h4>

            <div class="booking-detail-grid">

                ${detailItem("Customer Name", booking.customer?.name)}

                ${detailItem("Customer Email", booking.customer?.email)}

                ${detailItem("Provider Name", booking.provider?.name)}

                ${detailItem("Provider Email", booking.provider?.email)}

            </div>

        </section>


        <section class="booking-detail-section">

            <h4>
                <i class="fa-solid fa-location-dot"></i>
                Service Location
            </h4>

                        <div class="booking-detail-grid">

                ${detailItem("Address", booking.address)}

                ${detailItem("Customer Note", booking.note)}

            </div>

            <div class="admin-booking-map-wrapper">

                <div id="adminBookingMap" class="admin-booking-map"></div>

                <div
                    id="adminBookingMapMessage"
                    class="admin-booking-map-message"
                    style="display: none;"
                ></div>

                <div id="adminBookingMapLegend" class="admin-booking-map-legend">

                    <span>
                        <i class="admin-map-dot customer"></i>
                        Customer Location
                    </span>

                    <span>
                        <i class="admin-map-dot provider"></i>
                        Provider Location
                    </span>

                </div>

                <p
                    id="adminBookingMapNote"
                    style="display: none; margin-top: 10px; font-size: 12px; color: #64748b;"
                ></p>

            </div>

        </section>


        <section class="booking-detail-section">

            <h4>
                <i class="fa-solid fa-clock"></i>
                Booking Timeline
            </h4>

            <div class="booking-detail-grid">

                ${detailItem("Created At", formatDateTime(booking.created_at))}

                ${detailItem("Accepted At", formatDateTime(booking.accepted_at))}

                ${detailItem("Provider On The Way", formatDateTime(booking.provider_on_way_at))}

                ${detailItem("Service Started", formatDateTime(booking.started_at))}

                ${detailItem("Completed At", formatDateTime(booking.completed_at))}

            </div>

        </section>

    `;

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    renderAdminBookingLocationMap(booking);
}


/* =========================================================
   ADMIN BOOKING LOCATION MAP
   ========================================================= */

function renderAdminBookingLocationMap(booking) {

    const mapElement = document.getElementById("adminBookingMap");
    const messageElement = document.getElementById("adminBookingMapMessage");
    const noteElement = document.getElementById("adminBookingMapNote");
    const legendElement = document.getElementById("adminBookingMapLegend");

    if (!mapElement || !messageElement) return;

    // Remove the previous booking map, if one exists.
    if (window.adminBookingLocationMap) {
        window.adminBookingLocationMap.remove();
        window.adminBookingLocationMap = null;
    }

    const isValidCoordinate = (latitude, longitude) => {

    if (
        latitude === null ||
        latitude === undefined ||
        longitude === null ||
        longitude === undefined ||
        latitude === "" ||
        longitude === ""
    ) {
        return false;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    return (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
    );
};

    const customerValid = isValidCoordinate(
    booking.latitude,
    booking.longitude
);

const providerValid = isValidCoordinate(
    booking.provider_latitude,
    booking.provider_longitude
);

    const customerLocation = customerValid
        ? [Number(booking.latitude), Number(booking.longitude)]
        : null;

    const providerLocation = providerValid
        ? [
            Number(booking.provider_latitude),
            Number(booking.provider_longitude)
        ]
        : null;

    // Leaflet may not have loaded.
    if (typeof L === "undefined") {

        mapElement.style.display = "none";
        messageElement.style.display = "block";
        messageElement.textContent =
            "Map could not load. Please check your internet connection.";

        if (legendElement) legendElement.style.display = "none";

        return;
    }

    // No valid coordinates available.
    if (!customerValid && !providerValid) {

        mapElement.style.display = "none";
        messageElement.style.display = "block";
        messageElement.textContent =
            "Location coordinates are not available for this booking.";

        if (legendElement) legendElement.style.display = "none";

        return;
    }

    mapElement.style.display = "block";
    messageElement.style.display = "none";

    const map = L.map(mapElement);

    window.adminBookingLocationMap = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const locations = [];

    // Customer marker.
    if (customerLocation) {

        L.marker(customerLocation)
            .addTo(map)
            .bindPopup("Customer Service Location");

        locations.push(customerLocation);
    }

    // Provider marker.
    if (providerLocation) {

        L.marker(providerLocation)
            .addTo(map)
            .bindPopup("Provider Last Recorded Location");

        locations.push(providerLocation);
    }

    // Automatically frame all available markers.
    if (locations.length === 1) {

        map.setView(locations[0], 15);

    } else {

        map.fitBounds(locations, {
            padding: [35, 35],
            maxZoom: 15
        });

    }

    // Show only the markers that actually exist.
    if (legendElement) {

        legendElement.style.display = "flex";

        legendElement.innerHTML = `
            ${customerValid ? `
                <span>
                    <i class="admin-map-dot customer"></i>
                    Customer Location
                </span>
            ` : ""}

            ${providerValid ? `
                <span>
                    <i class="admin-map-dot provider"></i>
                    Provider Location
                </span>
            ` : ""}
        `;
    }

    // Explain missing or rejected coordinates.
    if (noteElement) {

        let notes = [];

        if (!customerValid) {
            notes.push("Customer coordinates are unavailable or outside Nepal.");
        }

        if (!providerValid) {
            notes.push("Provider location is unavailable or outside Nepal.");
        }

        if (notes.length > 0) {

            noteElement.textContent = notes.join(" ");
            noteElement.style.display = "block";

        } else {

            noteElement.style.display = "none";

        }
    }

    // Fix Leaflet sizing after the modal becomes visible.
    setTimeout(() => {

        if (window.adminBookingLocationMap === map) {
            map.invalidateSize();
        }

    }, 200);

}



function detailItem(label, value) {

    const displayValue =
        value === null || value === undefined || value === ""
            ? "—"
            : String(value);

    return `
        <div class="booking-detail-item">

            <span>${escapeHTML(label)}</span>

            <strong>${escapeHTML(displayValue)}</strong>

        </div>
    `;

}


function closeBookingModal() {

    const modal = document.getElementById("bookingModal");

    if (!modal) return;

    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");

    selectedBooking = null;

}


/* =========================================================
   EXPORT BOOKINGS TO CSV
   ========================================================= */

function exportBookingsToCSV() {

    const bookings = getFilteredBookings();

    if (bookings.length === 0) {

        alert("There are no bookings to export.");

        return;
    }

    const headers = [

        "Booking ID",
        "Customer",
        "Customer Email",
        "Provider",
        "Provider Email",
        "Service",
        "Category",
        "Booking Date",
        "Booking Time",
        "Address",
        "Note",
        "Total Price",
        "Booking Status",
        "Payment Status",
        "Created At"

    ];

    const rows = bookings.map(booking => [

        booking.id,
        booking.customer?.name,
        booking.customer?.email,
        booking.provider?.name,
        booking.provider?.email,
        booking.service?.name,
        booking.service?.category,
        booking.booking_date,
        booking.booking_time,
        booking.address,
        booking.note,
        booking.total_price,
        booking.status,
        booking.payment_status,
        booking.created_at

    ]);

    const csvContent = [

        headers.map(csvEscape).join(","),

        ...rows.map(row =>
            row.map(csvEscape).join(",")
        )

    ].join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download =
        `oneclick-bookings-${new Date().toISOString().slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

}


function csvEscape(value) {

    const text = value === null || value === undefined
        ? ""
        : String(value);

    return `"${text.replace(/"/g, '""')}"`;

}


/* =========================================================
   FORMATTING HELPERS
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, character => {

        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];

    });

}


function setText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}


function formatStatus(status) {

    if (!status) return "Unknown";

    return String(status)
        .replace(/_/g, " ")
        .replace(/\b\w/g, character => character.toUpperCase());

}


function getStatusClass(status) {

    return String(status || "unknown")
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "");

}


function formatDate(value) {

    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}


function formatTime(value) {

    if (!value) return "—";

    return String(value).slice(0, 5);

}


function formatDateTime(value) {

    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

}


function formatMoney(value) {

    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return "0.00";
    }

    return amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

}
