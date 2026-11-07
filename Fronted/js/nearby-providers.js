
/* =========================================================
   ONECLICK — NEARBY PROVIDERS
   Uses Django REST API + Leaflet + OpenStreetMap
   ========================================================= */

const API_BASE = "http://127.0.0.1:8000/api";

let nearbyMap;
let providerMarkers;
let customerMarker;
let searchCircle;
let customerCoordinates = null;
let lastSearchUrl = null;

/* =========================================================
   INITIALIZE PAGE
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    initializeNearbyMap();
    loadNearbyServices();
    setupNearbyEvents();
});

/* =========================================================
   MAP INITIALIZATION
   ========================================================= */

function initializeNearbyMap() {
    const mapElement = document.getElementById("nearbyMap");

    if (!mapElement || typeof L === "undefined") {
        showError("The map library could not load. Check your internet connection.");
        return;
    }

    // General Nepal view until the customer shares their location.
    nearbyMap = L.map("nearbyMap").setView([28.3949, 84.1240], 7);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(nearbyMap);

    providerMarkers = L.layerGroup().addTo(nearbyMap);
}

/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function setupNearbyEvents() {
    document.getElementById("findNearbyBtn")
        ?.addEventListener("click", findNearbyProviders);

    document.getElementById("retryNearbyBtn")
        ?.addEventListener("click", findNearbyProviders);

    document.getElementById("nearbyService")
        ?.addEventListener("change", function () {
            if (customerCoordinates) {
                searchNearbyProviders();
            }
        });

    document.getElementById("nearbyRadius")
        ?.addEventListener("change", function () {
            if (customerCoordinates) {
                searchNearbyProviders();
            }
        });
}

/* =========================================================
   LOAD SERVICES INTO SELECT
   ========================================================= */

async function loadNearbyServices() {
    const select = document.getElementById("nearbyService");

    if (!select) return;

    try {
        const response = await fetch(`${API_BASE}/services/`);

        if (!response.ok) {
            throw new Error(`Services API returned ${response.status}`);
        }

        const data = await response.json();

        // Supports both normal arrays and paginated DRF responses.
        const services = Array.isArray(data)
            ? data
            : (Array.isArray(data.results) ? data.results : []);

        services.forEach(function (service) {
            if (service.is_active === false) return;

            const option = document.createElement("option");
            option.value = service.id;
            option.textContent = service.name;
            select.appendChild(option);
        });

    } catch (error) {
        console.error("Unable to load services:", error);
        showStatus(
            "Services could not be loaded. You can still try searching all nearby providers.",
            "error"
        );
    }
}

/* =========================================================
   REQUEST CUSTOMER LOCATION
   ========================================================= */

function findNearbyProviders() {
    if (!localStorage.getItem("access_token")) {
        showStatus(
            "Please log in as a customer before searching for nearby providers.",
            "error"
        );
        return;
    }

    if (!navigator.geolocation) {
        showStatus(
            "Your browser does not support location access.",
            "error"
        );
        return;
    }

    setLoading(true);
    hideError();

    showStatus(
        "Waiting for location permission. Please allow location access in your browser.",
        ""
    );

    navigator.geolocation.getCurrentPosition(
        function (position) {
            customerCoordinates = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };

            searchNearbyProviders();
        },
        function (error) {
            setLoading(false);

            let message = "Unable to get your location.";

            if (error.code === error.PERMISSION_DENIED) {
                message = "Location permission was denied. Allow location access in your browser and try again.";
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                message = "Your current location is unavailable. Check your device location settings.";
            } else if (error.code === error.TIMEOUT) {
                message = "Getting your location took too long. Please try again.";
            }

            showStatus(message, "error");
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000
        }
    );
}

/* =========================================================
   SEARCH NEARBY PROVIDERS
   ========================================================= */

async function searchNearbyProviders() {
    if (!customerCoordinates) {
        showStatus("Select Use My Location before searching.", "error");
        return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
        showStatus("Your login session is missing. Please log in again.", "error");
        return;
    }

    const radius = Number(
        document.getElementById("nearbyRadius").value || 10
    );

    const serviceId =
        document.getElementById("nearbyService").value;

    const params = new URLSearchParams({
        latitude: customerCoordinates.latitude,
        longitude: customerCoordinates.longitude,
        radius: radius
    });

    if (serviceId) {
        params.set("service_id", serviceId);
    }

    lastSearchUrl = `${API_BASE}/providers/nearby/?${params.toString()}`;

    setLoading(true);
    hideError();
    hideEmpty();

    showStatus("Searching for available providers near your location...", "");

    try {
        const response = await fetch(lastSearchUrl, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json().catch(function () {
            return {};
        });

        if (response.status === 401) {
            showStatus(
                "Your login session has expired. Please log in again.",
                "error"
            );
            showError("Please log in again, then return to this page.");
            return;
        }

        if (!response.ok) {
            throw new Error(
                data.error ||
                data.detail ||
                `Nearby providers API returned ${response.status}`
            );
        }

        const providers = Array.isArray(data)
            ? data
            : (Array.isArray(data.results) ? data.results : []);

        renderCustomerLocation(radius);
        renderNearbyProviders(providers, serviceId);

        if (providers.length) {
            showStatus(
                `Found ${providers.length} eligible provider(s) within ${radius} km.`,
                "success"
            );
        } else {
            showStatus(
                `No eligible providers with saved coordinates were found within ${radius} km. Try a larger radius or another service.`,
                ""
            );
        }

    } catch (error) {
        console.error("Nearby provider search failed:", error);
        showError(error.message || "Unable to load nearby providers.");
        showStatus("The nearby provider search failed.", "error");
    } finally {
        setLoading(false);
    }
}

/* =========================================================
   CUSTOMER MARKER AND SEARCH RADIUS
   ========================================================= */

function renderCustomerLocation(radius) {
    if (!nearbyMap || !customerCoordinates) return;

    const lat = customerCoordinates.latitude;
    const lng = customerCoordinates.longitude;

    if (customerMarker) {
        nearbyMap.removeLayer(customerMarker);
    }

    if (searchCircle) {
        nearbyMap.removeLayer(searchCircle);
    }

    customerMarker = L.marker([lat, lng])
        .addTo(nearbyMap)
        .bindPopup("<strong>Your shared location</strong>");

    searchCircle = L.circle([lat, lng], {
        radius: radius * 1000,
        color: "#1769e0",
        fillColor: "#1769e0",
        fillOpacity: 0.07,
        weight: 2
    }).addTo(nearbyMap);

    nearbyMap.setView([lat, lng], radius <= 5 ? 13 : radius <= 10 ? 12 : 10);
}

/* =========================================================
   RENDER PROVIDER MARKERS AND CARDS
   ========================================================= */

function renderNearbyProviders(providers, serviceId) {
    const grid = document.getElementById("nearbyProviderGrid");
    const count = document.getElementById("nearbyCount");

    if (!grid || !providerMarkers) return;

    grid.innerHTML = "";
    providerMarkers.clearLayers();

    const validProviders = providers.filter(function (provider) {
        return Number.isFinite(Number(provider.latitude)) &&
            Number.isFinite(Number(provider.longitude));
    });

    count.textContent =
        `${validProviders.length} provider${validProviders.length === 1 ? "" : "s"}`;

    if (!validProviders.length) {
        showEmpty(true);
        return;
    }

    showEmpty(false);

    const bounds = [];

    validProviders.forEach(function (provider) {
        const lat = Number(provider.latitude);
        const lng = Number(provider.longitude);
        const name = provider.full_name || "Service Provider";
        const distance = Number(provider.distance_km);
        const safeDistance = Number.isFinite(distance)
            ? `${distance.toFixed(2)} km away`
            : "Distance unavailable";

        const service = getSelectedProviderService(provider, serviceId);
        const category = service
            ? (service.category_name || provider.category_name || "Service")
            : (provider.category_name || "Service Provider");

        const marker = L.marker([lat, lng]).addTo(providerMarkers);

        marker.bindPopup(`
            <strong>${escapeHtml(name)}</strong><br>
            ${escapeHtml(category)}<br>
            ${escapeHtml(safeDistance)}<br>
            <a href="${getProviderProfileUrl(provider.id, serviceId)}">
                View profile
            </a>
        `);

        bounds.push([lat, lng]);

        grid.insertAdjacentHTML(
            "beforeend",
            createNearbyProviderCard(provider, serviceId, service)
        );
    });

    if (customerCoordinates) {
        bounds.push([
            customerCoordinates.latitude,
            customerCoordinates.longitude
        ]);
    }

    if (bounds.length > 1) {
        nearbyMap.fitBounds(bounds, {
            padding: [35, 35],
            maxZoom: 14
        });
    }
}

/* =========================================================
   GET SELECTED SERVICE DETAILS FROM PROVIDER DATA
   ========================================================= */

function getSelectedProviderService(provider, serviceId) {
    if (!serviceId || !Array.isArray(provider.services)) {
        return null;
    }

    return provider.services.find(function (service) {
        return String(service.id) === String(serviceId);
    }) || null;
}

/* =========================================================
   PROVIDER CARD
   ========================================================= */

function createNearbyProviderCard(provider, serviceId, service) {
    const name = provider.full_name || "Service Provider";
    const category = service
        ? (service.category_name || provider.category_name || "Service")
        : (provider.category_name || "Service Provider");

    const rating = Number(provider.rating || 0);
    const reviewCount = Number(provider.review_count || 0);
    const distance = Number(provider.distance_km);

    const distanceText = Number.isFinite(distance)
        ? `${distance.toFixed(2)} km away`
        : "Distance unavailable";

    const price = service
        ? service.price
        : provider.hourly_rate;

    const priceText = price !== null && price !== undefined && price !== ""
        ? `Rs. ${escapeHtml(String(price))}`
        : "Price not provided";

    const image = provider.profile_image;
    const avatar = image
        ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" loading="lazy">`
        : `<i class="fa-solid fa-user"></i>`;

    const profileUrl = getProviderProfileUrl(provider.id, serviceId);

    return `
        <article class="provider-card">
            <div class="provider-card-top">
                <div class="provider-avatar">${avatar}</div>

                <div class="provider-title">
                    <h3>${escapeHtml(name)}</h3>
                    <p class="provider-category">${escapeHtml(category)}</p>
                    <span class="verified-label">
                        <i class="fa-solid fa-circle-check"></i>
                        Verified provider
                    </span>
                </div>
            </div>

            <div class="provider-card-body">
                <div class="provider-detail">
                    <i class="fa-solid fa-location-dot"></i>
                    <span>${escapeHtml(distanceText)}</span>
                </div>

                <div class="provider-detail">
                    <i class="fa-solid fa-star"></i>
                    <span>${Number.isFinite(rating) ? rating.toFixed(1) : "0.0"}
                    (${reviewCount} review${reviewCount === 1 ? "" : "s"})</span>
                </div>

                <div class="provider-detail">
                    <i class="fa-solid fa-money-bill"></i>
                    <span>${priceText}</span>
                </div>

                <div class="provider-detail">
                    <i class="fa-solid fa-location-crosshairs"></i>
                    <span>${escapeHtml(provider.address || "Address not provided")}</span>
                </div>

                <div class="provider-card-actions">
                    <a class="profile-link" href="${profileUrl}">
                        View Profile
                    </a>
                </div>
            </div>
        </article>
    `;
}

/* =========================================================
   EXISTING PROVIDER PROFILE URL
   ========================================================= */

function getProviderProfileUrl(providerId, serviceId) {
    const params = new URLSearchParams({
        id: String(providerId)
    });

    if (serviceId) {
        params.set("service_id", String(serviceId));
    }

    return `provider-profile.html?${params.toString()}`;
}

/* =========================================================
   UI STATES
   ========================================================= */

function setLoading(isLoading) {
    const loading = document.getElementById("nearbyLoading");
    const button = document.getElementById("findNearbyBtn");

    if (loading) loading.hidden = !isLoading;

    if (button) {
        button.disabled = isLoading;
        button.innerHTML = isLoading
            ? '<span class="spinner-border spinner-border-sm"></span> Searching...'
            : '<i class="fa-solid fa-location-crosshairs"></i> Use My Location';
    }
}

function showStatus(message, type) {
    const status = document.getElementById("nearbyStatus");

    if (!status) return;

    status.textContent = message;
    status.className = "status-message";

    if (type === "error") {
        status.classList.add("status-error");
    } else if (type === "success") {
        status.classList.add("status-success");
    }
}

function showError(message) {
    const error = document.getElementById("nearbyError");
    const text = document.getElementById("nearbyErrorText");

    if (text) text.textContent = message;
    if (error) error.hidden = false;
}

function hideError() {
    const error = document.getElementById("nearbyError");
    if (error) error.hidden = true;
}

function showEmpty(isEmpty) {
    const empty = document.getElementById("nearbyEmpty");
    if (empty) empty.hidden = !isEmpty;
}

function hideEmpty() {
    showEmpty(false);
}

/* =========================================================
   SAFE HTML TEXT
   ========================================================= */

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
