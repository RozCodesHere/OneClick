
const API_BASE = "http://127.0.0.1:8000/api";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

let allServices = [];
let allProviders = [];


document.addEventListener("DOMContentLoaded", async function () {

    try {

        await loadCurrentAdmin();

        await Promise.all([
            loadServices(),
            loadProviders()
        ]);

        renderServices();

    } catch (error) {

        console.error("ADMIN SERVICES ERROR:", error);

        const grid = document.getElementById("serviceGrid");

        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    Unable to load services.
                    ${escapeHTML(error.message)}
                </div>
            `;
        }

    }

});


async function apiRequest(url) {

    const token = localStorage.getItem(ACCESS_TOKEN_KEY);

    const response = await fetch(
    url.startsWith("http") ? url : `${API_BASE}${url}`,
    {
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
        throw new Error(data.detail || "API request failed.");
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


async function loadServices() {

    allServices = [];

    let nextUrl = "/services/";

    while (nextUrl) {

        const data = await apiRequest(nextUrl);

        // Support both paginated and non-paginated responses.
        const services = Array.isArray(data)
            ? data
            : Array.isArray(data.results)
                ? data.results
                : [];

        allServices.push(...services);

        // Continue until Django has no more pages.
        nextUrl = Array.isArray(data)
            ? null
            : data.next || null;

    }

    console.log("ALL SERVICES LOADED:", allServices.length);

}

async function loadProviders() {

    const data = await apiRequest("/providers/admin/");

    allProviders = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
            ? data.results
            : [];

}



function renderServices() {

    const grid = document.getElementById("serviceGrid");

    if (!grid) return;

    if (!allServices.length) {
        grid.innerHTML = `
            <div class="empty-state">
                No services available.
            </div>
        `;
        return;
    }

    grid.innerHTML = allServices.map(function (service) {

        const matchingProviders = allProviders.filter(provider => {

    if (!Array.isArray(provider.services)) {
        return false;
    }

    return provider.services.some(
        enrolledService =>
            String(enrolledService.id) === String(service.id)
    );

});

        return `
            <article class="service-card">

                <div class="service-icon">
                    <i class="${getServiceIcon(service.name)}"></i>
                </div>

                <h3>
                    ${escapeHTML(service.name || "Unnamed Service")}
                </h3>

                <div class="service-category">
                    ${escapeHTML(service.category_name || "Uncategorized")}
                </div>

                <div class="service-price">
                    ${formatCurrency(service.base_price)}
                </div>

                <div class="service-meta">
                    ${matchingProviders.length}
                    provider${matchingProviders.length === 1 ? "" : "s"}
enrolled in this service
                </div>

                <div class="service-provider-list">

                    ${
                        matchingProviders.length
                        ? matchingProviders.map(function (provider) {

                            const name = provider.full_name || "Unnamed Provider";

                            const image = provider.profile_image
                                ? normalizeMediaUrl(provider.profile_image)
                                : "";

                            const initials = name
                                .split(" ")
                                .filter(Boolean)
                                .map(part => part[0])
                                .join("")
                                .substring(0, 2)
                                .toUpperCase();

                            return `
                                <div class="service-provider-item">

                                    <div class="service-provider-avatar">

                                        ${
                                            image
                                            ? `
                                                <img
                                                    src="${escapeAttribute(image)}"
                                                    alt="${escapeAttribute(name)}"
                                                    onerror="this.style.display='none'; this.parentElement.textContent='${escapeAttribute(initials)}';"
                                                >
                                            `
                                            : escapeHTML(initials)
                                        }

                                    </div>

                                    <div class="service-provider-info">

                                        <strong>
                                            ${escapeHTML(name)}
                                        </strong>

                                        <small>
    ${escapeHTML(getVerificationLabel(provider.verification_status))}
</small>

                                    </div>

                                   <a
    href="admin-provider-details.html?id=${encodeURIComponent(provider.id)}"
    class="service-provider-view"
    target="_blank"
    rel="noopener noreferrer"
>
    View Details
</a>

                                </div>
                            `;

                        }).join("")
                        : `
                            <div class="service-no-providers">
                                No providers enrolled in this service.
                            </div>
                        `
                    }

                </div>

            </article>
        `;

    }).join("");

}





function getServiceIcon(name = "") {

    const value = name.toLowerCase();

    if (value.includes("clean")) return "fa-solid fa-broom";
    if (value.includes("electric")) return "fa-solid fa-bolt";
    if (value.includes("plumb")) return "fa-solid fa-faucet";
    if (value.includes("car") || value.includes("vehicle")) return "fa-solid fa-car";
    if (value.includes("bike") || value.includes("motorcycle")) return "fa-solid fa-motorcycle";
    if (value.includes("paint")) return "fa-solid fa-paint-roller";
    if (value.includes("repair")) return "fa-solid fa-screwdriver-wrench";

    return "fa-solid fa-house";

}

function getVerificationLabel(status) {

    const labels = {
        approved: "Verified Provider",
        pending: "Pending Verification",
        rejected: "Rejected"
    };

    return labels[status] || "Unknown Status";

}


function formatCurrency(value) {

    return "Rs. " + Number(value || 0).toLocaleString("en-IN");

}


function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, function (character) {

        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[character];

    });

}

function normalizeMediaUrl(url) {

    if (!url) return "";

    // Keep absolute URLs unchanged.
    if (/^https?:\/\//i.test(url)) {
        return url;
    }

    // Convert relative media paths to the backend URL.
    const cleanPath = String(url).replace(/^\/+/, "");

    return `http://127.0.0.1:8000/${cleanPath}`;
}
function escapeAttribute(value) {

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