
const API_BASE = "http://127.0.0.1:8000/api";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

let allProviders = [];
let activeStatus = "all";
let selectedProvider = null;

let currentKYCSubmission = null;
let kycObjectUrls = [];

/* =========================================================
   ADMIN THEME
========================================================= */

function setupAdminTheme() {
    const savedTheme = localStorage.getItem("oneclick_admin_theme");

    document.body.classList.toggle(
        "dark-mode",
        savedTheme === "dark"
    );
}


// =========================================================
// PAGE INITIALIZATION
// =========================================================

document.addEventListener("DOMContentLoaded", async function () {
    setupAdminTheme();
    const closeButton = document.getElementById("closeProviderModal");
    const closeBottom = document.getElementById("providerModalCloseBottom");
    const modal = document.getElementById("providerModal");

    closeButton.addEventListener("click", closeProviderModal);
    closeBottom.addEventListener("click", closeProviderModal);

    modal.addEventListener("click", function (event) {
        if (event.target === modal) {
            closeProviderModal();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (
            event.key === "Escape" &&
            modal.classList.contains("show")
        ) {
            closeProviderModal();
        }
    });

    document
        .getElementById("providerSearch")
        .addEventListener("input", renderProviders);

    document.querySelectorAll(".provider-filter").forEach(button => {
        button.addEventListener("click", function () {

            document.querySelectorAll(".provider-filter").forEach(item => {
                item.classList.remove("active");
            });

            this.classList.add("active");

            activeStatus = this.dataset.status;

            renderProviders();
        });
    });

    document
        .getElementById("providerTableBody")
        .addEventListener("click", handleProviderTableClick);

    // Add verification action container without
    // changing the existing Close button.
    const footer = document.querySelector(".provider-modal-footer");

    const verificationActions = document.createElement("div");
    verificationActions.id = "providerVerificationActions";

    footer.insertBefore(
        verificationActions,
        document.getElementById("providerModalCloseBottom")
    );

    try {

        await loadCurrentAdmin();
        await loadProviders();

    } catch (error) {

        console.error("ADMIN PROVIDERS ERROR:", error);

        document.getElementById("providerTableBody").innerHTML = `
            <tr>
                <td colspan="9" class="provider-empty">
                    Unable to load providers.
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;

        document.getElementById("providerCount").textContent =
            "Provider loading failed.";
    }
});


// =========================================================
// API REQUEST HELPER
// =========================================================

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
            data = {};
        }
    }

    if (!response.ok) {
        throw new Error(
            data.detail ||
            data.error ||
            data.message ||
            "API request failed."
        );
    }

    return data;
}


// =========================================================
// ADMIN AUTHENTICATION
// =========================================================

async function loadCurrentAdmin() {

    const admin = await apiRequest("/users/me/");

    if (!admin || admin.role !== "admin") {

        alert("Admin access required.");

        window.location.href = "index.html";

        throw new Error("Unauthorized access.");
    }

    return admin;
}


// =========================================================
// LOAD ALL PROVIDERS
// =========================================================

async function loadProviders() {

    let url = "/providers/admin/";

    const providers = [];

    // Supports both paginated and non-paginated responses.
    while (url) {

        const data = await apiRequest(url);

        if (Array.isArray(data)) {

            providers.push(...data);
            url = null;

        } else {

            providers.push(...(data.results || []));

            url = data.next || null;
        }
    }

    allProviders = providers;

    updateProviderSummary();
    renderProviders();

    console.log("ADMIN PROVIDERS LOADED:", allProviders);
}


// =========================================================
// SUMMARY COUNTS
// =========================================================

function updateProviderSummary() {

    const total = allProviders.length;

    const pending = allProviders.filter(
        provider => provider.verification_status === "pending"
    ).length;

    const approved = allProviders.filter(
        provider => provider.verification_status === "approved"
    ).length;

    const rejected = allProviders.filter(
        provider => provider.verification_status === "rejected"
    ).length;

    document.getElementById("totalProviders").textContent = total;
    document.getElementById("pendingProviders").textContent = pending;
    document.getElementById("approvedProviders").textContent = approved;
    document.getElementById("rejectedProviders").textContent = rejected;
}


// =========================================================
// RENDER PROVIDER TABLE
// =========================================================

function renderProviders() {

    const tbody = document.getElementById("providerTableBody");

    const search = document
        .getElementById("providerSearch")
        .value
        .trim()
        .toLowerCase();

    const filteredProviders = allProviders.filter(provider => {

        const services = (provider.services || [])
            .map(service => service.name)
            .join(" ");

        const searchableText = [
            provider.full_name,
            provider.email,
            provider.phone,
            provider.category_name,
            services,
            provider.city,
            provider.district,
            provider.province
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(search);

        const matchesStatus =
            activeStatus === "all" ||
            provider.verification_status === activeStatus;

        return matchesSearch && matchesStatus;
    });

    document.getElementById("providerCount").textContent =
        `Showing ${filteredProviders.length} of ${allProviders.length} providers`;

    if (!filteredProviders.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="provider-empty">
                    <i class="fa-solid fa-users-slash mb-2"></i>
                    <div>No providers found.</div>
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = filteredProviders.map(provider => {

        const services = (provider.services || [])
            .map(service => escapeHTML(service.name))
            .join(", ");

        const location = [
            provider.city,
            provider.district,
            provider.province
        ].filter(Boolean).map(escapeHTML).join(", ");

        const status = provider.verification_status || "pending";

        return `
            <tr>

                <td>#${provider.id}</td>

                <td>
                    <div class="provider-name">
                        ${escapeHTML(provider.full_name || "Unnamed Provider")}
                    </div>
                    <small class="provider-muted">
                        ${escapeHTML(provider.category_name || "No category")}
                    </small>
                </td>

                <td>
                    ${escapeHTML(provider.email || "N/A")}
                </td>

                <td>
                    ${escapeHTML(provider.phone || "N/A")}
                </td>

                <td>
                    ${services || "No services"}
                </td>

                <td>
                    ${location || "Not provided"}
                </td>

                <td>
                    ${Number(provider.experience) || 0} years
                </td>

                <td>
                    <span class="provider-status ${escapeHTML(status)}">
                        ${escapeHTML(status)}
                    </span>
                </td>

                <td>
                    <button
                        type="button"
                        class="provider-view-btn"
                        data-action="view"
                        data-id="${provider.id}"
                    >
                        <i class="fa-solid fa-eye"></i>
                        View
                    </button>
                </td>

            </tr>
        `;

    }).join("");
}


// =========================================================
// TABLE CLICK HANDLER
// =========================================================

function handleProviderTableClick(event) {

    const button = event.target.closest("[data-action='view']");

    if (!button) return;

    const providerId = Number(button.dataset.id);

    const provider = allProviders.find(
        item => item.id === providerId
    );

    if (provider) {
        openProviderModal(provider);
    }
}


// =========================================================
// OPEN PROVIDER PROFILE MODAL
// =========================================================

function openProviderModal(provider) {

    selectedProvider = provider;

    const modal = document.getElementById("providerModal");
    const content = document.getElementById("providerModalContent");

    const fullName = provider.full_name || "Unnamed Provider";

    const initials = fullName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(name => name[0])
        .join("")
        .toUpperCase();

    const profileImage = provider.profile_image
        ? `
            <img
                src="${escapeHTML(provider.profile_image)}"
                alt="${escapeHTML(fullName)}"
            >
        `
        : `
            <span>${escapeHTML(initials || "P")}</span>
        `;

    const location = [
        provider.address,
        provider.city,
        provider.district,
        provider.province,
        provider.country
    ].filter(Boolean).map(escapeHTML).join(", ");

    const services = provider.services || [];

    const serviceHTML = services.length
        ? services.map(service => `
            <div class="provider-detail-item">
                <span>Service</span>
                <strong>${escapeHTML(service.name)}</strong>
                <small>Price: Rs. ${escapeHTML(service.price ?? "N/A")}</small>
            </div>
        `).join("")
        : `<p class="provider-muted">No services enrolled.</p>`;

    const workPhotos = provider.work_photos || [];

    const photoHTML = workPhotos.length
        ? workPhotos.map(photo => `
            <div class="provider-photo-card">
                <img
                    src="${escapeHTML(photo.image)}"
                    alt="${escapeHTML(photo.caption || "Provider work photo")}"
                >
                <p>${escapeHTML(photo.caption || "Work sample")}</p>
            </div>
        `).join("")
        : `<p class="provider-muted">No work photos uploaded.</p>`;

    content.innerHTML = `

        <div class="provider-profile-header">

            <div class="provider-profile-avatar">
                ${profileImage}
            </div>

            <div class="provider-profile-heading">

                <span class="provider-profile-label">
                    PROVIDER PROFILE
                </span>

                <h2>${escapeHTML(fullName)}</h2>

                <p>
                    ${escapeHTML(provider.category_name || "No category")}
                </p>

                <span class="provider-status ${escapeHTML(provider.verification_status)}">
                    ${escapeHTML(provider.verification_status)}
                </span>

            </div>

            <div class="provider-profile-id">
                Provider ID
                <strong>#${provider.id}</strong>
            </div>

        </div>


        <section class="provider-detail-section">

            <h3>
                <i class="fa-solid fa-chart-simple"></i>
                Provider Statistics
            </h3>

            <div class="provider-profile-stats">

                <div class="provider-profile-stat">
                    <span>Experience</span>
                    <strong>${Number(provider.experience) || 0} years</strong>
                </div>

                <div class="provider-profile-stat">
                    <span>Completed Jobs</span>
                    <strong>${Number(provider.completed_jobs) || 0}</strong>
                </div>

                <div class="provider-profile-stat">
                    <span>Rating</span>
                    <strong>${Number(provider.rating || 0).toFixed(1)} / 5</strong>
                </div>

            </div>

        </section>


        <section class="provider-detail-section">

            <h3>
                <i class="fa-solid fa-address-card"></i>
                Personal Information
            </h3>

            <div class="provider-detail-grid">

                ${detailItem("Email", provider.email)}
                ${detailItem("Phone", provider.phone)}
                ${detailItem("Address", location)}
                ${detailItem("Hourly Rate", `Rs. ${provider.hourly_rate ?? "N/A"}`)}
                ${detailItem("Availability", provider.availability_status)}
                ${detailItem("Average Response Time", provider.average_response_time)}
                ${detailItem("Happy Customers", provider.happy_customers)}
                ${detailItem("Repeat Customers", provider.repeat_customers)}

            </div>

        </section>


        <section class="provider-detail-section">

            <h3>
                <i class="fa-solid fa-user-pen"></i>
                About Provider
            </h3>

            <div class="provider-bio">
                ${provider.bio
                    ? escapeHTML(provider.bio)
                    : "No provider biography provided."}
            </div>

        </section>


        <section class="provider-detail-section">

            <h3>
                <i class="fa-solid fa-list-check"></i>
                Enrolled Services (${services.length})
            </h3>

            <div class="provider-detail-grid">
                ${serviceHTML}
            </div>

        </section>


        <section class="provider-detail-section">

            <h3>
                <i class="fa-solid fa-images"></i>
                Work Photos (${workPhotos.length})
            </h3>

            <div class="provider-work-gallery">
                ${photoHTML}
            </div>

        </section>

    `;

    renderVerificationActions(provider);

loadProviderKYC(provider);

modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";
}


// =========================================================
// DETAIL ITEM HELPER
// =========================================================

function detailItem(label, value) {

    return `
        <div class="provider-detail-item">
            <span>${escapeHTML(label)}</span>
            <strong>${escapeHTML(
                value === null || value === undefined || value === ""
                    ? "Not provided"
                    : String(value)
            )}</strong>
        </div>
    `;
}




// =========================================================
// ADMIN PROVIDER KYC REVIEW
// =========================================================

function clearKYCDocumentURLs() {
    kycObjectUrls.forEach(url => URL.revokeObjectURL(url));
    kycObjectUrls = [];
}

async function loadProviderKYC(provider) {

    const content = document.getElementById("providerModalContent");

    clearKYCDocumentURLs();
    currentKYCSubmission = null;

    const section = document.createElement("section");
    section.className = "provider-detail-section";
    section.id = "providerKYCSection";
    section.style.gridColumn = "1 / -1";

    section.innerHTML = `
        <h3>
            <i class="fa-solid fa-id-card"></i>
            Identity Verification (KYC)
        </h3>

        <p class="provider-muted">Loading KYC submission...</p>
    `;

    content.appendChild(section);

    try {

        const data = await apiRequest("/providers/admin/kyc/");

        // Ignore results if another provider's modal was opened.
        if (
            !selectedProvider ||
            selectedProvider.id !== provider.id
        ) return;

        const submissions = data.results || [];

        const kyc = submissions.find(
            item => Number(item.provider_id) === Number(provider.id)
        );

        if (!kyc) {
            section.innerHTML = `
                <h3>
                    <i class="fa-solid fa-id-card"></i>
                    Identity Verification (KYC)
                </h3>
                <p class="provider-muted">
                    This provider has not submitted KYC documents.
                </p>
            `;
            return;
        }

        currentKYCSubmission = kyc;

        section.innerHTML = `
            <h3>
                <i class="fa-solid fa-id-card"></i>
                Identity Verification (KYC)
            </h3>

            <div class="provider-detail-grid">
                <div class="provider-detail-item">
                    <span>KYC Status</span>
                    <strong>${escapeHTML(kyc.kyc_status)}</strong>
                </div>

                <div class="provider-detail-item">
                    <span>Submitted At</span>
                    <strong>${escapeHTML(
                        kyc.submitted_at
                            ? new Date(kyc.submitted_at).toLocaleString()
                            : "Not available"
                    )}</strong>
                </div>

                <div class="provider-detail-item">
                    <span>Reviewed At</span>
                    <strong>${escapeHTML(
                        kyc.reviewed_at
                            ? new Date(kyc.reviewed_at).toLocaleString()
                            : "Not reviewed"
                    )}</strong>
                </div>

                <div class="provider-detail-item">
                    <span>Reviewed By</span>
                    <strong>${escapeHTML(kyc.reviewed_by || "Not reviewed")}</strong>
                </div>
            </div>

            ${
                kyc.rejection_reason
                    ? `<p class="text-danger mt-3">
                        <strong>Rejection reason:</strong>
                        ${escapeHTML(kyc.rejection_reason)}
                    </p>`
                    : ""
            }

            <div class="provider-kyc-documents mt-4">
                <h4>Submitted Documents</h4>

                <div class="provider-work-gallery">
                    <div class="provider-photo-card">
                        <p><strong>Citizenship Front</strong></p>
                        <div id="kycFrontPreview">Loading...</div>
                    </div>

                    <div class="provider-photo-card">
                        <p><strong>Citizenship Back</strong></p>
                        <div id="kycBackPreview">Loading...</div>
                    </div>

                    <div class="provider-photo-card">
                        <p><strong>Verification Selfie</strong></p>
                        <div id="kycSelfiePreview">Loading...</div>
                    </div>
                </div>
            </div>

            ${
                kyc.kyc_status === "pending"
                    ? `
                        <div class="mt-4 d-flex gap-2 flex-wrap">
                            <button
                                type="button"
                                class="btn btn-success"
                                onclick="reviewProviderKYC('approved')"
                            >
                                <i class="fa-solid fa-check"></i>
                                Approve KYC
                            </button>

                            <button
                                type="button"
                                class="btn btn-danger"
                                onclick="reviewProviderKYC('rejected')"
                            >
                                <i class="fa-solid fa-xmark"></i>
                                Reject KYC
                            </button>
                        </div>
                    `
                    : ""
            }
        `;

        await Promise.all([
            loadKYCDocument(kyc.provider_id, "citizenship_front", "kycFrontPreview"),
            loadKYCDocument(kyc.provider_id, "citizenship_back", "kycBackPreview"),
            loadKYCDocument(kyc.provider_id, "verification_selfie", "kycSelfiePreview")
        ]);

    } catch (error) {

        console.error("PROVIDER KYC LOAD ERROR:", error);

        section.innerHTML = `
            <h3>Identity Verification (KYC)</h3>
            <p class="text-danger">
                Unable to load KYC information:
                ${escapeHTML(error.message)}
            </p>
        `;
    }
}


// Fetch private documents using the admin JWT.
async function loadKYCDocument(providerId, documentType, targetId) {

    const token = localStorage.getItem(ACCESS_TOKEN_KEY);

    const response = await fetch(
        `${API_BASE}/providers/kyc/documents/${providerId}/${documentType}/`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    if (response.status === 401) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        window.location.href = "login.html";
        throw new Error("Authentication expired.");
    }

    if (!response.ok) {
        throw new Error(`Unable to load ${documentType}.`);
    }

    const blob = await response.blob();

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif"
    ];

    if (!allowedTypes.includes(blob.type)) {
        throw new Error("Unsupported document image format.");
    }

    const objectURL = URL.createObjectURL(blob);
    kycObjectUrls.push(objectURL);

    const target = document.getElementById(targetId);

    if (!target) return;

    const image = document.createElement("img");

    image.src = objectURL;
    image.alt = documentType;
    image.style.width = "100%";
    image.style.maxHeight = "260px";
    image.style.objectFit = "contain";
    image.style.borderRadius = "10px";
    image.style.background = "#f1f5f9";

    target.innerHTML = "";
    target.appendChild(image);
}


// Approve or reject KYC separately from provider application approval.
async function reviewProviderKYC(newStatus) {

    if (!currentKYCSubmission || !selectedProvider) return;

    const kycId = currentKYCSubmission.kyc_id;

    let rejectionReason = "";

    if (newStatus === "rejected") {

        rejectionReason = prompt(
            "Enter the reason for rejecting this KYC submission:"
        );

        if (rejectionReason === null) return;

        rejectionReason = rejectionReason.trim();

        if (!rejectionReason) {
            alert("A rejection reason is required.");
            return;
        }
    }

    const action = newStatus === "approved" ? "approve" : "reject";

    if (!confirm(`Are you sure you want to ${action} this KYC submission?`)) {
        return;
    }

    const buttons = document.querySelectorAll(
        "#providerKYCSection button"
    );

    buttons.forEach(button => button.disabled = true);

    try {

        const payload = {
            status: newStatus
        };

        if (newStatus === "rejected") {
            payload.rejection_reason = rejectionReason;
        }

        const response = await apiRequest(
            `/providers/admin/kyc/${kycId}/`,
            {
                method: "PATCH",
                body: JSON.stringify(payload)
            }
        );

        alert(response.message || `KYC ${newStatus} successfully.`);

        await loadProviderKYC(selectedProvider);

    } catch (error) {

        console.error("KYC REVIEW ERROR:", error);

        alert(`Unable to update KYC: ${error.message}`);

        buttons.forEach(button => button.disabled = false);
    }
}



// =========================================================
// VERIFICATION ACTION BUTTONS
// =========================================================

function renderVerificationActions(provider) {

    const container = document.getElementById(
        "providerVerificationActions"
    );

    if (provider.verification_status === "pending") {

        container.innerHTML = `
            <button
                type="button"
                class="btn btn-success"
                onclick="updateProviderVerification('approved')"
            >
                <i class="fa-solid fa-check"></i>
                Approve Provider
            </button>

            <button
                type="button"
                class="btn btn-danger"
                onclick="updateProviderVerification('rejected')"
            >
                <i class="fa-solid fa-xmark"></i>
                Reject Provider
            </button>
        `;

    } else if (provider.verification_status === "approved") {

        container.innerHTML = `
            <button
                type="button"
                class="btn btn-danger"
                onclick="updateProviderVerification('rejected')"
            >
                Reject Provider
            </button>
        `;

    } else {

        container.innerHTML = `
            <button
                type="button"
                class="btn btn-success"
                onclick="updateProviderVerification('approved')"
            >
                Approve Provider
            </button>
        `;
    }
}


// =========================================================
// UPDATE PROVIDER VERIFICATION
// =========================================================

async function updateProviderVerification(newStatus) {

    if (!selectedProvider) return;

    const action = newStatus === "approved"
        ? "approve"
        : "reject";

    const confirmed = confirm(
        `Are you sure you want to ${action} ${selectedProvider.full_name}?`
    );

    if (!confirmed) return;

    const buttons = document.querySelectorAll(
        "#providerVerificationActions button"
    );

    buttons.forEach(button => button.disabled = true);

    try {

        const response = await apiRequest(
            `/users/admin/providers/${selectedProvider.id}/verify/`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    verification_status: newStatus
                })
            }
        );

        console.log("PROVIDER VERIFICATION RESPONSE:", response);

        selectedProvider.verification_status = newStatus;

        // Update the provider in the main list.
        const index = allProviders.findIndex(
            provider => provider.id === selectedProvider.id
        );

        if (index !== -1) {
            allProviders[index].verification_status = newStatus;
        }

        updateProviderSummary();
        renderProviders();

        openProviderModal(selectedProvider);

        alert(
            `Provider ${newStatus} successfully.`
        );

    } catch (error) {

        console.error("PROVIDER VERIFICATION ERROR:", error);

        alert(
            `Unable to update provider status: ${error.message}`
        );

        buttons.forEach(button => button.disabled = false);
    }
}


// =========================================================
// CLOSE MODAL
// =========================================================

function closeProviderModal() {

    clearKYCDocumentURLs();

    const modal = document.getElementById("providerModal");

    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";

    selectedProvider = null;
}


// =========================================================
// HTML ESCAPING
// =========================================================

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
