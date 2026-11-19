
const API_BASE =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000/api"
        : "https://oneclick-backend-6hk7.onrender.com/api";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

let allCustomers = [];
let allBookings = [];
let bookingsLoaded = false;

/* =========================================================
   ADMIN THEME
========================================================= */

function setupAdminTheme() {

    const savedTheme = localStorage.getItem(
        "oneclick_admin_theme"
    );

    document.body.classList.toggle(
        "dark-mode",
        savedTheme === "dark"
    );
}

document.addEventListener("DOMContentLoaded", async function () {

    setupAdminTheme();

    try {
        await loadCurrentAdmin();
        await loadCustomers();

        document
            .getElementById("customerSearch")
            .addEventListener("input", renderCustomers);

        document
            .getElementById("closeCustomerModal")
            .addEventListener("click", closeCustomerModal);

        document
            .getElementById("customerModalCloseBottom")
            .addEventListener("click", closeCustomerModal);

        document
            .getElementById("customerModal")
            .addEventListener("click", function (event) {
                if (event.target.id === "customerModal") {
                    closeCustomerModal();
                }
            });

        document.addEventListener("keydown", function (event) {
            if (
                event.key === "Escape" &&
                document.getElementById("customerModal").classList.contains("show")
            ) {
                closeCustomerModal();
            }
        });

        renderCustomers();

    } catch (error) {
        console.error("ADMIN CUSTOMERS ERROR:", error);

        document.getElementById("customerTableBody").innerHTML = `
            <tr>
                <td colspan="7" class="customer-empty">
                    Unable to load customers.
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;
    }
});


async function apiRequest(url) {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);

    const response = await fetch(`${API_BASE}${url}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...(token ? {
                Authorization: `Bearer ${token}`
            } : {})
        }
    });

    if (response.status === 401) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);

        window.location.href = "login.html";
        throw new Error("Authentication expired.");
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.detail ||
            data.error ||
            "API request failed."
        );
    }

    return data;
}


async function loadCurrentAdmin() {
    const admin = await apiRequest("/users/me/");

    if (!admin || admin.role !== "admin") {
        alert("Administrator access required.");
        window.location.href = "login.html";
        throw new Error("Not an administrator.");
    }
}


async function loadCustomers() {
    const data = await apiRequest("/users/admin/users/");

    allCustomers = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
            ? data.results
            : [];

    console.log("CUSTOMERS LOADED:", allCustomers.length);

    updateCustomerSummary();
}


async function loadBookings() {
    if (bookingsLoaded) return;

    const data = await apiRequest("/users/admin/bookings/");

    allBookings = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
            ? data.results
            : [];

    bookingsLoaded = true;

    console.log("ADMIN BOOKINGS LOADED:", allBookings.length);
}


function updateCustomerSummary() {
    const total = allCustomers.length;

    const active = allCustomers.filter(
        customer => customer.is_active === true
    ).length;

    document.getElementById("totalCustomers").textContent = total;
    document.getElementById("activeCustomers").textContent = active;
    document.getElementById("inactiveCustomers").textContent = total - active;
}


function renderCustomers() {
    const tbody = document.getElementById("customerTableBody");

    const search = document
        .getElementById("customerSearch")
        .value
        .trim()
        .toLowerCase();

    const filteredCustomers = allCustomers.filter(customer => {
        const name = `${customer.first_name || ""} ${customer.last_name || ""}`
            .toLowerCase();

        const email = (customer.email || "").toLowerCase();
        const phone = (customer.phone || "").toLowerCase();

        return (
            name.includes(search) ||
            email.includes(search) ||
            phone.includes(search)
        );
    });

    document.getElementById("customerCount").textContent =
        `Showing ${filteredCustomers.length} of ${allCustomers.length} customers`;

    if (!filteredCustomers.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="customer-empty">
                    No customers found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredCustomers.map(customer => {
        const name =
            `${customer.first_name || ""} ${customer.last_name || ""}`.trim()
            || "Unnamed Customer";

        const joinedDate = formatDate(customer.date_joined);

        return `
            <tr>
                <td>#${customer.id}</td>

                <td>
                    <span class="customer-name">
                        ${escapeHTML(name)}
                    </span>
                </td>

                <td>
                    <span class="customer-email">
                        ${escapeHTML(customer.email || "Not provided")}
                    </span>
                </td>

                <td>
                    <span class="customer-phone">
                        ${escapeHTML(customer.phone || "Not provided")}
                    </span>
                </td>

                <td>${escapeHTML(joinedDate)}</td>

                <td>
                    <span class="customer-status ${customer.is_active ? "active" : "inactive"}">
                        ${customer.is_active ? "Active" : "Inactive"}
                    </span>
                </td>

                <td>
                    <button
                        type="button"
                        class="customer-view-btn"
                        onclick="viewCustomer(${Number(customer.id)})"
                    >
                        <i class="fa-solid fa-eye"></i>
                        View Details
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}


/* =========================================================
   CUSTOMER PROFILE MODAL
========================================================= */

async function viewCustomer(customerId) {
    const customer = allCustomers.find(
        item => Number(item.id) === Number(customerId)
    );

    if (!customer) return;

    const modal = document.getElementById("customerModal");
    const content = document.getElementById("customerModalContent");

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("customer-modal-open");

    content.innerHTML = `
        <div class="customer-modal-loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>Loading customer profile...</p>
        </div>
    `;

    try {
        await loadBookings();

        const customerBookings = allBookings.filter(booking =>
            Number(booking.customer?.id) === Number(customerId)
        );

        renderCustomerProfile(customer, customerBookings);

    } catch (error) {
        console.error("CUSTOMER PROFILE ERROR:", error);

        content.innerHTML = `
            <div class="customer-modal-error">
                <i class="fa-solid fa-circle-exclamation"></i>
                <h3>Unable to load booking history</h3>
                <p>${escapeHTML(error.message)}</p>
                <button type="button" onclick="viewCustomer(${Number(customerId)})">
                    Try Again
                </button>
            </div>
        `;
    }
}


function renderCustomerProfile(customer, bookings) {
    const content = document.getElementById("customerModalContent");

    const fullName =
        `${customer.first_name || ""} ${customer.last_name || ""}`.trim()
        || "Unnamed Customer";

    const initials = fullName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0].toUpperCase())
        .join("");

    const completed = bookings.filter(
        booking => String(booking.status).toLowerCase() === "completed"
    ).length;

    const pending = bookings.filter(
        booking => String(booking.status).toLowerCase() === "pending"
    ).length;

    const profileImage = getProfileImageUrl(customer.profile_picture);

    content.innerHTML = `
        <section class="customer-profile-header">

            <div class="customer-profile-avatar">
                ${
                    profileImage
                        ? `<img src="${escapeHTML(profileImage)}"
                               alt="${escapeHTML(fullName)}"
                               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                           <span style="display:none;">${escapeHTML(initials)}</span>`
                        : `<span>${escapeHTML(initials || "C")}</span>`
                }
            </div>

            <div class="customer-profile-heading">
                <span class="customer-profile-label">CUSTOMER PROFILE</span>
                <h2>${escapeHTML(fullName)}</h2>
                <p>
                    <i class="fa-regular fa-envelope"></i>
                    ${escapeHTML(customer.email || "No email provided")}
                </p>
                <span class="customer-status ${customer.is_active ? "active" : "inactive"}">
                    ${customer.is_active ? "Active Account" : "Inactive Account"}
                </span>
            </div>

            <div class="customer-profile-id">
                Customer ID
                <strong>#${Number(customer.id)}</strong>
            </div>

        </section>

        <section class="customer-profile-stats">

            <div class="customer-profile-stat">
                <span>Total Bookings</span>
                <strong>${bookings.length}</strong>
            </div>

            <div class="customer-profile-stat">
                <span>Completed</span>
                <strong>${completed}</strong>
            </div>

            <div class="customer-profile-stat">
                <span>Pending</span>
                <strong>${pending}</strong>
            </div>

        </section>

        <section class="customer-detail-section">

            <div class="customer-detail-section-heading">
                <i class="fa-solid fa-user"></i>
                <h3>Personal Information</h3>
            </div>

            <div class="customer-detail-grid">

                ${detailItem("First Name", customer.first_name)}
                ${detailItem("Last Name", customer.last_name)}
                ${detailItem("Email Address", customer.email)}
                ${detailItem("Phone Number", customer.phone)}
                ${detailItem("Country", customer.country)}
                ${detailItem("Province", customer.province)}
                ${detailItem("District", customer.district)}
                ${detailItem("City", customer.city)}
                ${detailItem("Joined Date", formatDate(customer.date_joined))}
                ${detailItem("Preferred Payment", customer.preferred_payment_method)}

            </div>

        </section>

        <section class="customer-detail-section">

            <div class="customer-detail-section-heading">
                <i class="fa-solid fa-calendar-check"></i>
                <h3>Booking History</h3>
                <span class="customer-booking-count">${bookings.length} bookings</span>
            </div>

            ${
                bookings.length
                    ? renderCustomerBookings(bookings)
                    : `
                        <div class="customer-no-bookings">
                            <i class="fa-regular fa-calendar-xmark"></i>
                            <strong>No booking history</strong>
                            <p>This customer has not made any bookings yet.</p>
                        </div>
                    `
            }

        </section>
    `;
}


function detailItem(label, value) {
    return `
        <div class="customer-detail-item">
            <span>${escapeHTML(label)}</span>
            <strong>${escapeHTML(value || "Not provided")}</strong>
        </div>
    `;
}


function renderCustomerBookings(bookings) {
    return `
        <div class="customer-booking-table-wrapper">
            <table class="customer-booking-table">
                <thead>
                    <tr>
                        <th>Booking</th>
                        <th>Service</th>
                        <th>Provider</th>
                        <th>Date & Time</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Payment</th>
                    </tr>
                </thead>

                <tbody>
                    ${bookings.map(booking => `
                        <tr>
                            <td>#${Number(booking.id)}</td>

                            <td>
                                <strong>${escapeHTML(booking.service?.name || "Not available")}</strong>
                                <small>${escapeHTML(booking.service?.category || "")}</small>
                            </td>

                            <td>
                                ${escapeHTML(booking.provider?.name || "Not available")}
                            </td>

                            <td>
                                ${escapeHTML(formatDate(booking.booking_date))}
                                <small>${escapeHTML(formatTime(booking.booking_time))}</small>
                            </td>

                            <td>
                                Rs. ${formatMoney(booking.total_price)}
                            </td>

                            <td>
                                <span class="booking-status ${statusClass(booking.status)}">
                                    ${escapeHTML(formatStatus(booking.status))}
                                </span>
                            </td>

                            <td>
                                <span class="booking-payment-status">
                                    ${escapeHTML(formatStatus(booking.payment_status))}
                                </span>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}


function closeCustomerModal() {
    const modal = document.getElementById("customerModal");

    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("customer-modal-open");
}


function getProfileImageUrl(imagePath) {
    if (!imagePath) return "";

    const value = String(imagePath);

    if (/^https?:\/\//i.test(value)) {
        return value;
    }

    const apiOrigin = new URL(API_BASE).origin;

    return `${apiOrigin}${value.startsWith("/") ? "" : "/"}${value}`;
}


function formatDate(value) {
    if (!value) return "Not available";

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
    if (!value) return "";

    const parts = String(value).split(":");

    if (parts.length < 2) return String(value);

    const date = new Date();
    date.setHours(Number(parts[0]), Number(parts[1]), 0, 0);

    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
    });
}


function formatMoney(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) return "0.00";

    return amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


function formatStatus(value) {
    if (!value) return "Not available";

    return String(value)
        .replace(/_/g, " ")
        .replace(/\b\w/g, character => character.toUpperCase());
}


function statusClass(value) {
    const status = String(value || "").toLowerCase();

    if (status === "completed") return "completed";
    if (status === "pending") return "pending";
    if (status === "cancelled") return "cancelled";
    if (status === "accepted" || status === "in_progress" || status === "on_the_way") {
        return "in-progress";
    }

    return "default";
}


function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[character];
    });
}
