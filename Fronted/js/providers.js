/* =========================================================
ONECLICK — PROVIDERS PAGE
Dynamic provider discovery from Django REST API
Service-aware provider filtering
========================================================= */

const API_BASE = "http://127.0.0.1:8000/api";

const PROVIDERS_API = `${API_BASE}/providers/`;

const SAVED_PROVIDERS_API =
    `${API_BASE}/providers/saved-providers/`;

const SERVICES_API =
    `${API_BASE}/services/`;


/* =========================================================
GLOBAL VARIABLES
========================================================= */

let allProviders = [];

let savedProviderIds =
    new Set();

let selectedServiceId = null;

let selectedService = null;


/* =========================================================
PAGE INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initProviderPage();

    }
);


/* =========================================================
INITIALIZE PROVIDER PAGE
========================================================= */

async function initProviderPage() {

    initFilterEvents();

    initRetryButton();

    initToastClose();

    readSelectedService();

    await loadSelectedService();

    await loadProviders();

    await loadSavedProviders();

}


/* =========================================================
READ SELECTED SERVICE FROM URL
========================================================= */

function readSelectedService() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const serviceId =
        params.get("service_id");

    if (!serviceId) {

        selectedServiceId = null;

        return;

    }

    const numericServiceId =
        Number(serviceId);

    if (
        !Number.isInteger(numericServiceId) ||
        numericServiceId <= 0
    ) {

        selectedServiceId = null;

        return;

    }

    selectedServiceId =
        numericServiceId;

}


/* =========================================================
LOAD SELECTED SERVICE
========================================================= */

async function loadSelectedService() {

    if (!selectedServiceId) {

        selectedService = null;

        return;

    }

    try {

        const response =
            await fetch(
                `${SERVICES_API}${selectedServiceId}/`
            );

        if (!response.ok) {

            throw new Error(
                `Service API returned ${response.status}`
            );

        }

        selectedService =
            await response.json();

        console.log(
            "Selected service:",
            selectedService
        );

        updateSelectedServiceUI();

    } catch (error) {

        console.error(
            "Error loading selected service:",
            error
        );

        selectedService = null;

    }

}


/* =========================================================
UPDATE SELECTED SERVICE UI
========================================================= */

function updateSelectedServiceUI() {

    if (!selectedService) {

        return;

    }

    const title =
        document.querySelector(
            "#selectedServiceTitle"
        );

    const serviceName =
        document.querySelector(
            "#selectedServiceName"
        );

    const serviceDescription =
        document.querySelector(
            "#selectedServiceDescription"
        );

    if (title) {

        title.textContent =
            `Providers for ${
                selectedService.name || "Service"
            }`;

    }

    if (serviceName) {

        serviceName.textContent =
            selectedService.name || "";

    }

    if (serviceDescription) {

        serviceDescription.textContent =
            selectedService.description || "";

    }

}


/* =========================================================
GET LOGIN TOKEN
========================================================= */

function getToken() {

    return localStorage.getItem(
        "access_token"
    );

}


/* =========================================================
LOAD PROVIDERS FROM DJANGO
========================================================= */

async function loadProviders() {

    showLoading();

    try {

        /*
         * Start with the normal providers API.
         */

        const providerUrl =
            new URL(
                PROVIDERS_API
            );


        /*
         * If a service was selected,
         * send service_id to Django.
         *
         * Example:
         *
         * /api/providers/?service_id=2
         */

        if (selectedServiceId) {

            providerUrl.searchParams.set(
                "service_id",
                selectedServiceId
            );

        }


        const response =
            await fetch(
                providerUrl.toString()
            );


        if (!response.ok) {

            throw new Error(
                `Providers API returned ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "Providers API data:",
            data
        );


        /*
         * DRF can return either:
         *
         * [
         *     {...},
         *     {...}
         * ]
         *
         * OR:
         *
         * {
         *     count: 10,
         *     results: [...]
         * }
         */

        const providerResults =
            Array.isArray(data)
                ? data
                : data.results || [];


        /*
         * Only verified providers are displayed.
         *
         * Service filtering itself is already
         * handled by Django.
         */

        allProviders =
            providerResults.filter(
                function (provider) {

                    return provider.verified === true;

                }
            );


        console.log(
            "Verified providers:",
            allProviders
        );


        /*
         * Create category dropdown.
         */

        populateCategoryFilter(
            allProviders
        );


        /*
         * Display providers.
         */

        renderProviders(
            getFilteredProviders()
        );


    } catch (error) {

        console.error(
            "Error loading providers:",
            error
        );

        showError(
            "Unable to connect to the provider server. Make sure your Django backend is running."
        );

    }

}


/* =========================================================
LOAD SAVED PROVIDERS
========================================================= */

async function loadSavedProviders() {

    const token =
        getToken();


    /*
     * User is not logged in.
     */

    if (!token) {

        savedProviderIds =
            new Set();

        return;

    }


    try {

        const response =
            await fetch(
                SAVED_PROVIDERS_API,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


        /*
         * Provider users or other roles may
         * receive 403.
         *
         * That should not break the page.
         */

        if (!response.ok) {

            console.log(
                "Saved providers are not available for this user."
            );

            return;

        }


        const data =
            await response.json();


        if (!Array.isArray(data)) {

            return;

        }


        savedProviderIds =
            new Set(
                data
                    .map(
                        function (item) {

                            return Number(
                                item.provider?.id
                            );

                        }
                    )
                    .filter(
                        function (id) {

                            return !isNaN(id);

                        }
                    )
            );


        /*
         * Refresh cards so saved hearts appear.
         */

        renderProviders(
            getFilteredProviders()
        );


    } catch (error) {

        console.error(
            "Error loading saved providers:",
            error
        );

    }

}


/* =========================================================
POPULATE CATEGORY DROPDOWN
========================================================= */

function populateCategoryFilter(
    providers
) {

    const select =
        document.querySelector(
            "#providerCategorySelect"
        );

    if (!select) {

        return;

    }


    select.innerHTML = `
        <option value="">
            All Categories
        </option>
    `;


    const categories =
        new Map();


    providers.forEach(
        function (provider) {

            const categoryId =
                provider.category;

            const categoryName =
                provider.category_name;


            if (
                categoryId &&
                categoryName
            ) {

                categories.set(
                    String(categoryId),
                    categoryName
                );

            }

        }
    );


    const sortedCategories =
        Array.from(
            categories.entries()
        ).sort(
            function (a, b) {

                return a[1].localeCompare(
                    b[1]
                );

            }
        );


    sortedCategories.forEach(
        function (category) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                category[0];

            option.textContent =
                category[1];

            select.appendChild(
                option
            );

        }
    );

}


/* =========================================================
FILTER EVENT LISTENERS
========================================================= */

function initFilterEvents() {

    const searchInput =
        document.querySelector(
            "#providerSearchInput"
        );

    const cityInput =
        document.querySelector(
            "#providerCityInput"
        );

    const categorySelect =
        document.querySelector(
            "#providerCategorySelect"
        );

    const applyButton =
        document.querySelector(
            "#applyProviderFilters"
        );

    const clearButton =
        document.querySelector(
            "#clearProviderFilters"
        );

    const emptyClearButton =
        document.querySelector(
            "#emptyClearFilters"
        );


    /*
     * SEARCH BUTTON
     */

    if (applyButton) {

        applyButton.addEventListener(
            "click",
            function () {

                applyProviderFilters();

            }
        );

    }


    /*
     * SEARCH INPUT ENTER
     */

    if (searchInput) {

        searchInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter"
                ) {

                    applyProviderFilters();

                }

            }
        );

    }


    /*
     * CITY INPUT ENTER
     */

    if (cityInput) {

        cityInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter"
                ) {

                    applyProviderFilters();

                }

            }
        );

    }


    /*
     * CATEGORY
     */

    if (categorySelect) {

        categorySelect.addEventListener(
            "change",
            function () {

                applyProviderFilters();

            }
        );

    }


    /*
     * CLEAR
     */

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            function () {

                clearProviderFilters();

            }
        );

    }


    /*
     * EMPTY STATE CLEAR
     */

    if (emptyClearButton) {

        emptyClearButton.addEventListener(
            "click",
            function () {

                clearProviderFilters();

            }
        );

    }

}


/* =========================================================
APPLY FILTERS
========================================================= */

function applyProviderFilters() {

    const filteredProviders =
        getFilteredProviders();

    renderProviders(
        filteredProviders
    );

}


/* =========================================================
GET FILTERED PROVIDERS
========================================================= */

function getFilteredProviders() {

    const searchInput =
        document.querySelector(
            "#providerSearchInput"
        );

    const cityInput =
        document.querySelector(
            "#providerCityInput"
        );

    const categorySelect =
        document.querySelector(
            "#providerCategorySelect"
        );


    /*
     * SEARCH
     */

    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    /*
     * CITY
     */

    const city =
        cityInput
            ? cityInput.value
                .trim()
                .toLowerCase()
            : "";


    /*
     * CATEGORY
     */

    const category =
        categorySelect
            ? categorySelect.value
            : "";


    /*
     * IMPORTANT:
     *
     * Service filtering is NOT performed here.
     *
     * Django already received:
     *
     * /api/providers/?service_id=2
     *
     * and returned only providers who offer
     * that service.
     *
     * Therefore Django is the source of truth.
     */


    return allProviders.filter(
        function (provider) {


            /*
             * -----------------------------------------------
             * SEARCH MATCH
             * -----------------------------------------------
             */

            const name =
                String(
                    provider.full_name || ""
                ).toLowerCase();


            const categoryName =
                String(
                    provider.category_name || ""
                ).toLowerCase();


            const bio =
                String(
                    provider.bio || ""
                ).toLowerCase();


            const address =
                String(
                    provider.address || ""
                ).toLowerCase();


            const serviceName =
                String(
                    provider.service_name || ""
                ).toLowerCase();


            const matchesSearch =
                !search ||
                name.includes(search) ||
                categoryName.includes(search) ||
                serviceName.includes(search) ||
                bio.includes(search) ||
                address.includes(search);


            /*
             * -----------------------------------------------
             * LOCATION MATCH
             * -----------------------------------------------
             */

            const matchesCity =
                !city ||
                address.includes(city);


            /*
             * -----------------------------------------------
             * CATEGORY MATCH
             * -----------------------------------------------
             */

            const matchesCategory =
                !category ||
                String(
                    provider.category
                ) === String(category);


            /*
             * -----------------------------------------------
             * FINAL RESULT
             * -----------------------------------------------
             */

            return (
                matchesSearch &&
                matchesCity &&
                matchesCategory
            );

        }
    );

}


/* =========================================================
CLEAR FILTERS
========================================================= */

function clearProviderFilters() {

    const searchInput =
        document.querySelector(
            "#providerSearchInput"
        );

    const cityInput =
        document.querySelector(
            "#providerCityInput"
        );

    const categorySelect =
        document.querySelector(
            "#providerCategorySelect"
        );


    if (searchInput) {

        searchInput.value =
            "";

    }


    if (cityInput) {

        cityInput.value =
            "";

    }


    /*
     * Keep selected service.
     */

    if (categorySelect) {

        categorySelect.value =
            "";

    }


    renderProviders(
        getFilteredProviders()
    );

}


/* =========================================================
RENDER PROVIDERS
========================================================= */

function renderProviders(
    providers
) {

    const grid =
        document.querySelector(
            "#providersGrid"
        );

    if (!grid) {

        return;

    }


    hideLoading();

    hideError();


    updateProviderCount(
        providers.length
    );


    /*
     * NO PROVIDERS
     */

    if (!providers.length) {

        grid.innerHTML = "";

        showEmpty();

        return;

    }


    hideEmpty();


    /*
     * CREATE CARDS
     */

    grid.innerHTML =
        providers
            .map(
                function (provider) {

                    return renderProviderCard(
                        provider
                    );

                }
            )
            .join("");


    initSaveButtons();

}


/* =========================================================
RENDER SINGLE PROVIDER CARD
========================================================= */

function renderProviderCard(
    provider
) {

    /*
     * BASIC DATA
     */

    const providerId =
        Number(
            provider.id
        );


    const providerName =
        escapeHtml(
            provider.full_name ||
            "Provider"
        );


    const category =
        escapeHtml(
            provider.category_name ||
            "Service Provider"
        );


    const bio =
        escapeHtml(
            provider.bio ||
            "No description available."
        );


    const experience =
        Number(
            provider.experience || 0
        );


    const address =
        escapeHtml(
            provider.address ||
            "Location not available"
        );


    const rating =
        Number(
            provider.rating ??
            provider.average_rating ??
            0
        );


    const reviewCount =
        Number(
            provider.review_count ??
            provider.total_reviews ??
            0
        );


    /*
     * SERVICE DATA
     *
     * These values come directly from
     * ProviderSerializer.
     */

    const serviceName =
        provider.service_name
            ? escapeHtml(
                provider.service_name
            )
            : (
                selectedService?.name
                    ? escapeHtml(
                        selectedService.name
                    )
                    : null
            );


    const servicePrice =
        provider.service_price ??
        null;


    /*
     * FALLBACK PRICE
     *
     * If the page is not opened for a
     * specific service, use provider's
     * general hourly rate.
     */

    const price =
        servicePrice !== null
            ? servicePrice
            : (
                provider.hourly_rate ??
                "0.00"
            );


    const verified =
        provider.verified === true;


    const available =
        provider.available === true;


    const isSaved =
        savedProviderIds.has(
            providerId
        );


    /*
     * =====================================================
     * PROFILE IMAGE
     * =====================================================
     */

    let imageHTML;


    if (
        provider.profile_image
    ) {

        imageHTML = `
            <img
                src="${escapeHtml(
                    provider.profile_image
                )}"
                alt="${providerName} profile photo"
                loading="lazy"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            >

            <div
                class="provider-image-placeholder"
                style="display: none;"
            >
                <i class="fa-solid fa-user"></i>
            </div>
        `;

    } else {

        imageHTML = `
            <div
                class="provider-image-placeholder"
            >
                <i class="fa-solid fa-user"></i>
            </div>
        `;

    }


    /*
     * =====================================================
     * VERIFIED BADGE
     * =====================================================
     */

    const verifiedHTML =
        verified
            ? `
                <span
                    class="provider-verified-badge"
                >
                    <i
                        class="fa-solid fa-circle-check"
                    ></i>

                    Verified
                </span>
            `
            : "";


    /*
     * =====================================================
     * AVAILABILITY
     * =====================================================
     */

    const availabilityHTML =
        available
            ? `
                <span
                    class="provider-availability-badge"
                >
                    <i
                        class="fa-solid fa-circle"
                    ></i>

                    Available Now
                </span>
            `
            : `
                <span
                    class="provider-availability-badge unavailable"
                >
                    <i
                        class="fa-solid fa-circle"
                    ></i>

                    Unavailable
                </span>
            `;


    /*
     * =====================================================
     * RATING STARS
     * =====================================================
     */

    const stars =
        generateStars(
            rating
        );


    /*
     * =====================================================
     * REVIEW TEXT
     * =====================================================
     */

    const reviewText =
        reviewCount === 1
            ? "review"
            : "reviews";


    /*
     * =====================================================
     * SAVE STATE
     * =====================================================
     */

    const saveClass =
        isSaved
            ? "save-provider-btn saved"
            : "save-provider-btn";


    const saveIcon =
        isSaved
            ? "fa-solid"
            : "fa-regular";


    const saveLabel =
        isSaved
            ? "Remove from saved providers"
            : "Save provider";


    /*
     * =====================================================
     * PROFILE URL
     * =====================================================
     */

    const profileUrl =
        selectedServiceId
            ? `provider-profile.html?id=${providerId}&service_id=${selectedServiceId}`
            : `provider-profile.html?id=${providerId}`;


    /*
     * =====================================================
     * PRICE LABEL
     * =====================================================
     */

    const priceLabel =
        serviceName
            ? "Service Price"
            : "Starting from";


    /*
     * =====================================================
     * PROVIDER CARD
     * =====================================================
     */

    return `
        <article
            class="provider-discovery-card"
            data-provider-id="${providerId}"
        >

            <!-- =========================================
                 IMAGE
                 ========================================= -->

            <div
                class="provider-card-image"
            >

                ${imageHTML}

                ${verifiedHTML}

                ${availabilityHTML}

            </div>


            <!-- =========================================
                 CARD BODY
                 ========================================= -->

            <div
                class="provider-card-body"
            >

                <!-- =====================================
                     NAME + SAVE
                     ===================================== -->

                <div
                    class="provider-card-top"
                >

                    <div
                        class="provider-card-name-wrap"
                    >

                        <h3
                            class="provider-card-name"
                        >
                            ${providerName}
                        </h3>

                        <div
                            class="provider-card-category"
                        >
                            ${category}
                        </div>

                    </div>


                    <button
                        type="button"
                        class="${saveClass}"
                        data-provider-id="${providerId}"
                        aria-pressed="${isSaved}"
                        aria-label="${saveLabel}"
                        title="${saveLabel}"
                    >

                        <i
                            class="${saveIcon} fa-heart"
                        ></i>

                    </button>

                </div>


                <!-- =====================================
                     SELECTED SERVICE
                     ===================================== -->

                ${
                    serviceName
                        ? `
                            <div
                                class="provider-card-service"
                            >

                                <i
                                    class="fa-solid fa-screwdriver-wrench"
                                ></i>

                                <span>
                                    ${serviceName}
                                </span>

                            </div>
                        `
                        : ""
                }


                <!-- =====================================
                     RATING
                     ===================================== -->

                <div
                    class="provider-card-rating"
                >

                    <span
                        class="provider-stars"
                    >
                        ${stars}
                    </span>

                    <span
                        class="provider-rating-number"
                    >
                        ${rating.toFixed(1)}
                    </span>

                    <span
                        class="provider-review-count"
                    >
                        (${reviewCount} ${reviewText})
                    </span>

                </div>


                <!-- =====================================
                     BIO
                     ===================================== -->

                <p
                    class="provider-card-bio"
                >
                    ${bio}
                </p>


                <!-- =====================================
                     META
                     ===================================== -->

                <div
                    class="provider-card-meta"
                >

                    <div
                        class="provider-meta-item"
                        title="${address}"
                    >

                        <i
                            class="fa-solid fa-location-dot"
                        ></i>

                        <span>
                            ${address}
                        </span>

                    </div>


                    <div
                        class="provider-meta-item"
                    >

                        <i
                            class="fa-solid fa-briefcase"
                        ></i>

                        <span>
                            ${experience}+ Years
                        </span>

                    </div>

                </div>


                <!-- =====================================
                     CARD FOOTER
                     ===================================== -->

                <div
                    class="provider-card-footer"
                >

                    <!-- PRICE -->

                    <div
                        class="provider-price"
                    >

                        <span
                            class="provider-price-label"
                        >
                            ${priceLabel}
                        </span>

                        <span
                            class="provider-price-value"
                        >

                            Rs.
                            ${escapeHtml(
                                String(price)
                            )}

                            <small>
                                ${
                                    serviceName
                                        ? "/service"
                                        : "/hour"
                                }
                            </small>

                        </span>

                    </div>


                    <!-- VIEW PROFILE -->

                    <a
                        href="${profileUrl}"
                        class="view-provider-btn"
                    >

                        View Profile

                        <i
                            class="fa-solid fa-arrow-right"
                        ></i>

                    </a>

                </div>

            </div>

        </article>
    `;

}


/* =========================================================
GENERATE RATING STARS
========================================================= */

function generateStars(
    rating
) {

    let html = "";

    for (
        let i = 1;
        i <= 5;
        i++
    ) {

        if (
            rating >= i
        ) {

            html += `
                <i
                    class="fa-solid fa-star"
                ></i>
            `;

        }

        else if (
            rating >= i - 0.5
        ) {

            html += `
                <i
                    class="fa-solid fa-star-half-stroke"
                ></i>
            `;

        }

        else {

            html += `
                <i
                    class="fa-regular fa-star"
                ></i>
            `;

        }

    }

    return html;

}


/* =========================================================
INITIALIZE SAVE BUTTONS
========================================================= */

function initSaveButtons() {

    const buttons =
        document.querySelectorAll(
            ".save-provider-btn"
        );


    buttons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    toggleSaveProvider(
                        button
                    );

                }
            );

        }
    );

}


/* =========================================================
SAVE / REMOVE PROVIDER
========================================================= */

async function toggleSaveProvider(
    button
) {

    const token =
        getToken();


    if (!token) {

        showProviderToast(
            "Login Required",
            "Please login to save providers."
        );

        return;

    }


    const providerId =
        Number(
            button.dataset.providerId
        );


    const isSaved =
        button.getAttribute(
            "aria-pressed"
        ) === "true";


    button.disabled =
        true;


    try {

        /*
         * REMOVE PROVIDER
         */

        if (isSaved) {

            const response =
                await fetch(
                    `${SAVED_PROVIDERS_API}${providerId}/`,
                    {
                        method: "DELETE",

                        headers: {
                            "Authorization":
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"
                        }
                    }
                );


            if (!response.ok) {

                let errorMessage =
                    `Delete returned ${response.status}`;


                try {

                    const errorData =
                        await response.json();


                    if (
                        errorData.error
                    ) {

                        errorMessage =
                            errorData.error;

                    }

                } catch (error) {

                    /*
                     * No JSON response.
                     */

                }


                throw new Error(
                    errorMessage
                );

            }


            savedProviderIds.delete(
                providerId
            );


            updateSaveButton(
                button,
                false
            );


            showProviderToast(
                "Provider Removed",
                "Provider removed from your saved list."
            );

        }


        /*
         * SAVE PROVIDER
         */

        else {

            const response =
                await fetch(
                    SAVED_PROVIDERS_API,
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
                                providerId
                        })
                    }
                );


            if (!response.ok) {

                let errorMessage =
                    `Save returned ${response.status}`;


                try {

                    const errorData =
                        await response.json();


                    if (
                        errorData.error
                    ) {

                        errorMessage =
                            errorData.error;

                    }

                } catch (error) {

                    /*
                     * No JSON response.
                     */

                }


                throw new Error(
                    errorMessage
                );

            }


            savedProviderIds.add(
                providerId
            );


            updateSaveButton(
                button,
                true
            );


            showProviderToast(
                "Provider Saved",
                "Provider has been added to your saved list."
            );

        }


    } catch (error) {

        console.error(
            "Save provider error:",
            error
        );


        showProviderToast(
            "Unable to Update",
            error.message ||
            "Something went wrong. Please try again."
        );


    } finally {

        button.disabled =
            false;

    }

}


/* =========================================================
UPDATE SAVE BUTTON
========================================================= */

function updateSaveButton(
    button,
    isSaved
) {

    if (!button) {

        return;

    }


    const icon =
        button.querySelector(
            "i"
        );


    button.setAttribute(
        "aria-pressed",
        isSaved
            ? "true"
            : "false"
    );


    if (isSaved) {

        button.classList.add(
            "saved"
        );

        button.setAttribute(
            "aria-label",
            "Remove from saved providers"
        );

        button.setAttribute(
            "title",
            "Remove from saved providers"
        );


        if (icon) {

            icon.classList.remove(
                "fa-regular"
            );

            icon.classList.add(
                "fa-solid"
            );

        }

    }

    else {

        button.classList.remove(
            "saved"
        );

        button.setAttribute(
            "aria-label",
            "Save provider"
        );

        button.setAttribute(
            "title",
            "Save provider"
        );


        if (icon) {

            icon.classList.remove(
                "fa-solid"
            );

            icon.classList.add(
                "fa-regular"
            );

        }

    }

}


/* =========================================================
UPDATE PROVIDER COUNT
========================================================= */

function updateProviderCount(
    count
) {

    const element =
        document.querySelector(
            "#providerCount"
        );


    if (!element) {

        return;

    }


    if (count === 1) {

        element.textContent =
            "1 Provider";

    }

    else {

        element.textContent =
            `${count} Providers`;

    }

}


/* =========================================================
SHOW LOADING
========================================================= */

function showLoading() {

    const loading =
        document.querySelector(
            "#providersLoading"
        );

    const grid =
        document.querySelector(
            "#providersGrid"
        );

    const empty =
        document.querySelector(
            "#providersEmpty"
        );

    const error =
        document.querySelector(
            "#providersError"
        );


    if (loading) {

        loading.style.display =
            "block";

    }


    if (grid) {

        grid.style.display =
            "none";

    }


    if (empty) {

        empty.style.display =
            "none";

    }


    if (error) {

        error.style.display =
            "none";

    }

}


/* =========================================================
HIDE LOADING
========================================================= */

function hideLoading() {

    const loading =
        document.querySelector(
            "#providersLoading"
        );

    const grid =
        document.querySelector(
            "#providersGrid"
        );


    if (loading) {

        loading.style.display =
            "none";

    }


    if (grid) {

        grid.style.display =
            "grid";

    }

}


/* =========================================================
SHOW EMPTY STATE
========================================================= */

function showEmpty() {

    const empty =
        document.querySelector(
            "#providersEmpty"
        );


    if (empty) {

        empty.style.display =
            "block";

    }

}


/* =========================================================
HIDE EMPTY STATE
========================================================= */

function hideEmpty() {

    const empty =
        document.querySelector(
            "#providersEmpty"
        );


    if (empty) {

        empty.style.display =
            "none";

    }

}


/* =========================================================
SHOW ERROR
========================================================= */

function showError(
    message
) {

    hideLoading();


    const grid =
        document.querySelector(
            "#providersGrid"
        );

    const error =
        document.querySelector(
            "#providersError"
        );

    const errorText =
        document.querySelector(
            "#providersErrorText"
        );


    if (grid) {

        grid.style.display =
            "none";

    }


    if (error) {

        error.style.display =
            "block";

    }


    if (errorText) {

        errorText.textContent =
            message;

    }

}


/* =========================================================
HIDE ERROR
========================================================= */

function hideError() {

    const error =
        document.querySelector(
            "#providersError"
        );


    if (error) {

        error.style.display =
            "none";

    }

}


/* =========================================================
RETRY BUTTON
========================================================= */

function initRetryButton() {

    const button =
        document.querySelector(
            "#retryProviders"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        async function () {

            await loadSelectedService();

            await loadProviders();

            await loadSavedProviders();

        }
    );

}


/* =========================================================
PROVIDER TOAST
========================================================= */

function showProviderToast(
    title,
    message
) {

    const toast =
        document.querySelector(
            "#providerToast"
        );

    const toastTitle =
        document.querySelector(
            "#providerToastTitle"
        );

    const toastText =
        document.querySelector(
            "#providerToastText"
        );


    if (!toast) {

        return;

    }


    if (toastTitle) {

        toastTitle.textContent =
            title;

    }


    if (toastText) {

        toastText.textContent =
            message;

    }


    toast.classList.add(
        "show"
    );


    clearTimeout(
        window.providerToastTimer
    );


    window.providerToastTimer =
        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            3500
        );

}


/* =========================================================
TOAST CLOSE BUTTON
========================================================= */

function initToastClose() {

    const button =
        document.querySelector(
            "#providerToastClose"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        function () {

            const toast =
                document.querySelector(
                    "#providerToast"
                );


            if (toast) {

                toast.classList.remove(
                    "show"
                );

            }

        }
    );

}


/* =========================================================
ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

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