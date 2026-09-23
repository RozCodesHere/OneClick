/* =========================================================
   ONECLICK - SAVED PROVIDERS
   ========================================================= */

const API_BASE = "http://127.0.0.1:8000/api";
const SAVED_PROVIDERS_API = `${API_BASE}/providers/saved-providers`;

const savedProvidersGrid = document.getElementById("savedProvidersGrid");
const emptyState = document.getElementById("emptyState");
const errorState = document.getElementById("errorState");
const errorMessage = document.getElementById("errorMessage");
const retryButton = document.getElementById("retryButton");
const savedProviderCount = document.getElementById("savedProviderCount");
const profileName = document.getElementById("profileName");
const customerAvatar = document.getElementById("customerAvatar");
const logoutButton = document.getElementById("logoutButton");
const logoutDropdown = document.getElementById("logoutDropdown");

/* =========================================================
   TOKEN
   ========================================================= */

function getToken() {
    return localStorage.getItem("access_token");
}

/* =========================================================
   AUTH CHECK
   ========================================================= */

function checkAuthentication() {
    const token = getToken();

    if (!token) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}

/* =========================================================
   API REQUEST
   ========================================================= */

async function apiRequest(url, options = {}) {
    const token = getToken();

    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...(options.headers || {})
        }
    });

    if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");

        window.location.href = "login.html";

        throw new Error("Your session has expired.");
    }

    return response;
}

/* =========================================================
   LOAD CUSTOMER PROFILE
   ========================================================= */

async function loadCustomerProfile() {
    try {
        const response = await apiRequest(`${API_BASE}/users/me/`);

        if (!response.ok) {
            throw new Error("Unable to load customer profile.");
        }

        const user = await response.json();

        const firstName = user.first_name || "";
        const lastName = user.last_name || "";

        const fullName =
            user.full_name ||
            user.name ||
            `${firstName} ${lastName}`.trim() ||
            user.email ||
            "Customer";

        if (profileName) {
            profileName.textContent = fullName;
        }

        if (customerAvatar) {
            customerAvatar.textContent = fullName.charAt(0).toUpperCase();
        }
    } catch (error) {
        console.error("Profile loading error:", error);

        if (profileName) {
            profileName.textContent = "Customer";
        }

        if (customerAvatar) {
            customerAvatar.textContent = "C";
        }
    }
}

/* =========================================================
   LOAD SAVED PROVIDERS
   ========================================================= */

async function loadSavedProviders() {
    showLoading();

    try {
        const response = await apiRequest(SAVED_PROVIDERS_API);

        if (!response.ok) {
            let message = "Unable to load saved providers.";

            try {
                const errorData = await response.json();

                if (errorData.error) {
                    message = errorData.error;
                } else if (errorData.detail) {
                    message = errorData.detail;
                }
            } catch (error) {
                // Ignore JSON parsing error
            }

            throw new Error(message);
        }

        const data = await response.json();

        const savedProviders =
            Array.isArray(data)
                ? data
                : data.results || [];

        console.log("Saved providers:", savedProviders);

        renderSavedProviders(savedProviders);
    } catch (error) {
        console.error("Saved providers error:", error);

        showError(
            error.message ||
            "Unable to load saved providers."
        );
    }
}

/* =========================================================
   RENDER SAVED PROVIDERS
   ========================================================= */

function renderSavedProviders(savedProviders) {
    savedProvidersGrid.innerHTML = "";

    const count = savedProviders.length;

    updateCount(count);

    if (count === 0) {
        showEmpty();
        return;
    }

    hideAllStates();

    savedProviders.forEach(function (savedProvider, index) {
        const provider = savedProvider.provider;

        if (!provider) {
            console.warn(
                "Saved provider has no provider data:",
                savedProvider
            );
            return;
        }

        const card = createProviderCard(
            savedProvider,
            provider,
            index
        );

        savedProvidersGrid.appendChild(card);
    });
}

/* =========================================================
   CREATE PROVIDER CARD
   ========================================================= */

function createProviderCard(savedProvider, provider, index) {
    const col = document.createElement("div");

    col.className = "col-12 col-md-6 col-xl-4";

    col.setAttribute("data-aos", "fade-up");
    col.setAttribute("data-aos-delay", `${index * 80}`);

    const providerId = provider.id;

    const providerName =
        provider.full_name ||
        "Service Provider";

    const category =
        provider.category_name ||
        "Service Provider";

    const experience =
        provider.experience !== undefined &&
        provider.experience !== null
            ? `${provider.experience} year${provider.experience == 1 ? "" : "s"} experience`
            : "Experienced provider";

    const address =
        provider.address ||
        "Location not available";

    const hourlyRate =
        provider.hourly_rate !== undefined &&
        provider.hourly_rate !== null
            ? `NPR ${provider.hourly_rate}/hr`
            : "Rate not available";

    const bio =
        provider.bio ||
        "Professional service provider available through OneClick.";

    const verified = provider.verified === true;
    const available = provider.available !== false;

    let imageHTML = "";

    if (provider.profile_image) {
        imageHTML = `
            <img
                src="${escapeHTML(provider.profile_image)}"
                alt="${escapeHTML(providerName)}"
                class="provider-image"
                onerror="
                    this.style.display='none';
                    this.nextElementSibling.style.display='flex';
                "
            >

            <div
                class="provider-avatar-fallback"
                style="display:none;"
            >
                ${escapeHTML(
                    providerName.charAt(0).toUpperCase()
                )}
            </div>
        `;
    } else {
        imageHTML = `
            <div class="provider-avatar-fallback">
                ${escapeHTML(
                    providerName.charAt(0).toUpperCase()
                )}
            </div>
        `;
    }

    col.innerHTML = `
        <article class="saved-provider-card">

            <div class="provider-card-top">
                <div class="provider-image-wrapper">
                    ${imageHTML}
                </div>

                <div class="provider-status">
                    ${
                        available
                            ? `
                                <span class="status-available">
                                    <span class="status-dot"></span>
                                    Available
                                </span>
                            `
                            : `
                                <span class="status-unavailable">
                                    Unavailable
                                </span>
                            `
                    }
                </div>
            </div>

            <div class="provider-card-body">

                <div class="provider-heading">
                    <div>
                        <h3>${escapeHTML(providerName)}</h3>

                        <p class="provider-category">
                            ${escapeHTML(category)}
                        </p>
                    </div>

                    ${
                        verified
                            ? `
                                <span
                                    class="verified-badge"
                                    title="Verified Provider"
                                >
                                    <i class="fa-solid fa-circle-check"></i>
                                </span>
                            `
                            : ""
                    }
                </div>

                <div class="provider-info">

                    <div class="provider-info-item">
                        <i class="fa-solid fa-location-dot"></i>

                        <span>
                            ${escapeHTML(address)}
                        </span>
                    </div>

                    <div class="provider-info-item">
                        <i class="fa-solid fa-briefcase"></i>

                        <span>
                            ${escapeHTML(experience)}
                        </span>
                    </div>

                    <div class="provider-info-item">
                        <i class="fa-solid fa-money-bill-wave"></i>

                        <span>
                            ${escapeHTML(hourlyRate)}
                        </span>
                    </div>

                </div>

                <p class="provider-bio">
                    ${escapeHTML(
                        truncateText(bio, 110)
                    )}
                </p>

                <div class="provider-card-actions">

                    <a
                        href="provider-profile.html?id=${encodeURIComponent(providerId)}"
                        class="btn btn-view-provider"
                    >
                        <i class="fa-regular fa-user"></i>
                        View Profile
                    </a>

                    <button
                        type="button"
                        class="btn btn-remove-provider"
                        data-provider-id="${escapeHTML(providerId)}"
                        title="Remove from saved providers"
                    >
                        <i class="fa-regular fa-heart"></i>

                        <span>
                            Remove
                        </span>
                    </button>

                </div>

            </div>
        </article>
    `;

    const removeButton =
        col.querySelector(".btn-remove-provider");

    if (removeButton) {
        removeButton.addEventListener(
            "click",
            function () {
                removeSavedProvider(
                    providerId,
                    col,
                    removeButton
                );
            }
        );
    }

    return col;
}

/* =========================================================
   REMOVE SAVED PROVIDER
   ========================================================= */

async function removeSavedProvider(
    providerId,
    cardElement,
    button
) {
    if (!providerId) {
        console.error("Provider ID missing.");
        return;
    }

    const originalHTML = button.innerHTML;

    button.disabled = true;

    button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Removing...
    `;

    try {
        const response = await apiRequest(
            `${SAVED_PROVIDERS_API}/${encodeURIComponent(providerId)}/`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            let message = "Unable to remove provider.";

            try {
                const errorData = await response.json();

                if (errorData.error) {
                    message = errorData.error;
                } else if (errorData.detail) {
                    message = errorData.detail;
                }
            } catch (error) {
                // Ignore
            }

            throw new Error(message);
        }

        cardElement.remove();

        const remainingCards =
            savedProvidersGrid.querySelectorAll(
                ".saved-provider-card"
            );

        updateCount(remainingCards.length);

        if (remainingCards.length === 0) {
            showEmpty();
        }
    } catch (error) {
        console.error(
            "Remove provider error:",
            error
        );

        alert(
            error.message ||
            "Unable to remove this provider."
        );

        button.disabled = false;
        button.innerHTML = originalHTML;
    }
}

/* =========================================================
   COUNT
   ========================================================= */

function updateCount(count) {
    if (count === 1) {
        savedProviderCount.textContent =
            "1 saved provider";
    } else {
        savedProviderCount.textContent =
            `${count} saved providers`;
    }
}

/* =========================================================
   LOADING
   ========================================================= */

function showLoading() {
    hideAllStates();

    savedProvidersGrid.innerHTML = `
        <div class="col-12">
            <div class="saved-loading">
                <div
                    class="spinner-border"
                    role="status"
                >
                    <span class="visually-hidden">
                        Loading...
                    </span>
                </div>

                <p>
                    Loading saved providers...
                </p>
            </div>
        </div>
    `;
}

/* =========================================================
   EMPTY
   ========================================================= */

function showEmpty() {
    savedProvidersGrid.innerHTML = "";

    emptyState.classList.remove("d-none");
    errorState.classList.add("d-none");
}

/* =========================================================
   ERROR
   ========================================================= */

function showError(message) {
    savedProvidersGrid.innerHTML = "";

    emptyState.classList.add("d-none");
    errorState.classList.remove("d-none");

    errorMessage.textContent = message;
}

/* =========================================================
   HIDE STATES
   ========================================================= */

function hideAllStates() {
    emptyState.classList.add("d-none");
    errorState.classList.add("d-none");
}

/* =========================================================
   RETRY
   ========================================================= */

if (retryButton) {
    retryButton.addEventListener(
        "click",
        loadSavedProviders
    );
}

/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    window.location.href = "login.html";
}

if (logoutButton) {
    logoutButton.addEventListener(
        "click",
        function (event) {
            event.preventDefault();
            logout();
        }
    );
}

if (logoutDropdown) {
    logoutDropdown.addEventListener(
        "click",
        function (event) {
            event.preventDefault();
            logout();
        }
    );
}

/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================================
   TRUNCATE
   ========================================================= */

function truncateText(text, maxLength) {
    if (!text) {
        return "";
    }

    text = String(text);

    if (text.length <= maxLength) {
        return text;
    }

    return (
        text.substring(0, maxLength).trim() +
        "..."
    );
}

/* =========================================================
   AOS
   ========================================================= */

if (typeof AOS !== "undefined") {
    AOS.init({
        duration: 600,
        once: true,
        offset: 50
    });
}

/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {
        if (!checkAuthentication()) {
            return;
        }

        loadCustomerProfile();
        loadSavedProviders();
    }
);

