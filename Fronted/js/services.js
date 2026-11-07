
 // =========================================================
// ONECLICK — SERVICES PAGE JAVASCRIPT
// Django REST API + Individual Service Images
// =========================================================


// =========================================================
// CONFIG
// =========================================================

const API_BASE_URL = "http://127.0.0.1:8000/api";


// =========================================================
// SERVICE IMAGE LOCATIONS
// ADD YOUR PHOTO PATHS HERE
// =========================================================
//
// Example:
// "bathroom cleaning": "assest-images-service/bathroom-cleaning.jpg"
//
// Paths are relative to services.html.
// Use the actual filenames of your photos.
// Service names are matched without case sensitivity.
// =========================================================

const SERVICE_IMAGES = {

    // -------------------------
    // CLEANING SERVICES
    // -------------------------

    "bathroom cleaning": "assests/images/CLEANING/bathroom-cleaning.jpg",
    "deep home cleaning": "assests/images/CLEANING/deep-home-cleaning.jpg",
    "home cleaning": "",
    "kitchen cleaning": "assests/images/CLEANING/kitchen-cleaning.jpg",
    "sofa cleaning": "",
    "carpet cleaning": "",
    "office cleaning": "",
    "window cleaning": "",
    "toilet cleaning": "",
    "move-in cleaning": "",
    "move-out cleaning": "",

    // -------------------------
    // ELECTRICAL REPAIR SERVICES
    // -------------------------

    "electrical repair": "",
    "appliance electrical repair": "assests/images/ELECTRIC/appliance-repair.jpg",
    "electrician": "assests/images/ELECTRIC/electric.jpg",
    "fan repair": "",
    "light installation": "",
    "switch repair": "",
    "socket repair": "",
    "wiring repair": "",
    "inverter repair": "",
    "water heater repair": "",
    "electrical installation": "",

    // -------------------------
    // HOME REPAIR SERVICES
    // -------------------------

    "plumbing": "assests/images/HOME/plumber.jpg",
    "plumbing repair": "",
    "tap repair": "",
    "pipe repair": "",
    "water leakage repair": "",
    "door repair": "",
    "window repair": "",
    "furniture repair": "",
    "wall painting": "",
    "tile repair": "",
    "roof repair": "",
    "carpentry": "assests/images/HOME/carpenter.jpg",

    // -------------------------
    // VEHICLE REPAIR SERVICES
    // -------------------------

    "vehicle repair": "assests/images/VECHILE/mechanicc.jpg",
    "car repair": "",
    "bike repair": "",
    "motorcycle repair": "",
    "car wash": "assests/images/VECHILE/washing.jpg",
    "vehicle electrical repair": "assests/images/VECHILE/wiring.jpg",
    "bike servicing": "",
    "vehicle servicing": "",
    "battery replacement": "",
    "tyre repair": "",
    "puncture repair": "",
    "oil change": "",
    "engine repair": ""

};


// =========================================================
// CATEGORY FALLBACK IMAGES
// Used when an individual service has no image.
// Add your category photo paths here.
// =========================================================

const CATEGORY_IMAGES = {

    "cleaning": "",
    "electrical repair": "",
    "home repair": "",
    "vehicle repair": ""

};


// =========================================================
// AOS
// =========================================================

if (window.AOS) {
    AOS.init({
        duration: 700,
        once: true,
        offset: 70
    });
}


// =========================================================
// CURRENT YEAR
// =========================================================

const yearElement = document.getElementById("year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}


// =========================================================
// NAVBAR SCROLL
// =========================================================

const navbar = document.getElementById("mainNavbar");

if (navbar) {
    window.addEventListener("scroll", function () {
        if (window.scrollY > 50) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    });
}


// =========================================================
// ELEMENTS
// =========================================================

const searchInput = document.getElementById("serviceSearchInput");
const urlParams = new URLSearchParams(window.location.search);
const initialSearch = urlParams.get("search");
const filterContainer = document.querySelector(".services-filters");
const emptyState = document.getElementById("emptyState");
const servicesGrid = document.getElementById("servicesGrid");


// =========================================================
// DATA
// =========================================================

let services = [];
let categories = [];
let currentCategory = "all";

if (searchInput && initialSearch) {
    searchInput.value = initialSearch;
}

const initialCategory = urlParams.get("category");

if (initialCategory) {
    currentCategory = initialCategory;
}


// =========================================================
// NORMALIZE TEXT FOR MATCHING
// =========================================================

function normalizeText(value) {
    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
}


// =========================================================
// GET SERVICE IMAGE
// =========================================================

function getServiceImage(service) {

    const serviceName = normalizeText(service.name);
    const categoryName = getServiceCategory(service);

    // 1. Exact individual service image
    if (SERVICE_IMAGES[serviceName]) {
        return SERVICE_IMAGES[serviceName];
    }

    // 2. Partial service-name match
    // Useful for names like "Professional Bathroom Cleaning"

    const matchingService = Object.keys(SERVICE_IMAGES).find(function (name) {
        return name &&
            SERVICE_IMAGES[name] &&
            serviceName.includes(name);
    });

    if (matchingService) {
        return SERVICE_IMAGES[matchingService];
    }

    // 3. Category fallback image
    const categoryKey = Object.keys(CATEGORY_IMAGES).find(function (name) {
        return categoryName.includes(name);
    });

    if (categoryKey && CATEGORY_IMAGES[categoryKey]) {
        return CATEGORY_IMAGES[categoryKey];
    }

    // 4. No image configured
    return "";
}


// =========================================================
// LOAD CATEGORIES FROM DJANGO
// =========================================================

async function loadCategories() {

    if (!filterContainer) {
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/services/categories/`
        );

        if (!response.ok) {
            throw new Error(
                `Failed to load categories. Status: ${response.status}`
            );
        }

        const data = await response.json();

        if (Array.isArray(data)) {
            categories = data;
        } else if (Array.isArray(data.results)) {
            categories = data.results;
        } else {
            categories = [];
        }

        renderCategoryFilters();

    } catch (error) {

        console.error("Error loading categories:", error);

        filterContainer.innerHTML = `
            <button
                type="button"
                class="filter-btn active"
                data-category-id="all">
                All Services
            </button>
        `;
    }
}


// =========================================================
// RENDER CATEGORY FILTERS
// =========================================================

function renderCategoryFilters() {

    if (!filterContainer) {
        return;
    }

    filterContainer.innerHTML = "";

    const allButton = document.createElement("button");

    allButton.type = "button";
    allButton.className = "filter-btn active";
    allButton.dataset.categoryId = "all";
    allButton.textContent = "All Services";

    filterContainer.appendChild(allButton);

    categories.forEach(function (category) {

        if (category.is_active === false) {
            return;
        }

        const button = document.createElement("button");

        button.type = "button";
        button.className = "filter-btn";
        button.dataset.categoryId = String(category.id);

        button.textContent = category.icon
            ? `${category.icon} ${category.name}`
            : category.name;

        filterContainer.appendChild(button);
    });

    attachCategoryFilterEvents();

    // Select category from URL if provided
    if (currentCategory !== "all") {

        const selectedButton = document.querySelector(
            `.services-filters .filter-btn[data-category-id="${currentCategory}"]`
        );

        if (selectedButton) {

            document.querySelectorAll(
                ".services-filters .filter-btn"
            ).forEach(function (button) {
                button.classList.remove("active");
            });

            selectedButton.classList.add("active");
        }
    }
}


// =========================================================
// CATEGORY FILTER EVENTS
// =========================================================

function attachCategoryFilterEvents() {

    const filterButtons = document.querySelectorAll(
        ".services-filters .filter-btn"
    );

    filterButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            filterButtons.forEach(function (btn) {
                btn.classList.remove("active");
            });

            this.classList.add("active");

            currentCategory = this.dataset.categoryId || "all";

            renderServices();
        });
    });
}


// =========================================================
// LOAD SERVICES FROM DJANGO
// =========================================================

async function loadServices() {

    if (!servicesGrid) {
        return;
    }

    servicesGrid.innerHTML = `
        <div class="col-12 text-center">
            <div class="py-5">
                <i class="fa-solid fa-spinner fa-spin fa-2x mb-3"></i>
                <h5>Loading services...</h5>
                <p class="text-muted mb-0">
                    Please wait while we load available services.
                </p>
            </div>
        </div>
    `;

    try {

        const response = await fetch(`${API_BASE_URL}/services/`);

        if (!response.ok) {
            throw new Error(
                `Failed to load services. Status: ${response.status}`
            );
        }

        const data = await response.json();

        // Django REST Framework pagination
        if (Array.isArray(data)) {

            services = data;

        } else if (Array.isArray(data.results)) {

            services = data.results;

            // Load remaining service pages
            let nextUrl = data.next;

            while (nextUrl) {

                const nextResponse = await fetch(nextUrl);

                if (!nextResponse.ok) {
                    console.error("Unable to load the next service page.");
                    break;
                }

                const nextData = await nextResponse.json();

                if (Array.isArray(nextData.results)) {
                    services = services.concat(nextData.results);
                }

                nextUrl = nextData.next;
            }

        } else {

            services = [];
        }

        renderServices();

    } catch (error) {

        console.error("Error loading services:", error);

        servicesGrid.innerHTML = `
            <div class="col-12 text-center">
                <div class="py-5">
                    <i class="fa-solid fa-triangle-exclamation fa-2x mb-3"></i>
                    <h5>Unable to load services</h5>
                    <p class="text-muted mb-3">
                        Please make sure the Django backend is running.
                    </p>
                    <button
                        type="button"
                        class="btn btn-primary"
                        onclick="loadServices()">
                        Try Again
                    </button>
                </div>
            </div>
        `;
    }
}


// =========================================================
// SERVICE CATEGORY NAME
// =========================================================

function getServiceCategory(service) {

    return (
        service.category_name ||
        service.category?.name ||
        ""
    )
        .toLowerCase()
        .trim();
}


// =========================================================
// SERVICE ICON
// =========================================================

function getServiceIcon(service) {

    const category = getServiceCategory(service);
    const name = normalizeText(service.name);

    if (
        category.includes("electrical") ||
        name.includes("electric") ||
        name.includes("wiring")
    ) {
        return "fa-bolt";
    }

    if (
        category.includes("home repair") ||
        name.includes("plumb") ||
        name.includes("pipe") ||
        name.includes("tap") ||
        name.includes("carpentry")
    ) {
        return "fa-screwdriver-wrench";
    }

    if (
        category.includes("clean") ||
        name.includes("clean")
    ) {
        return "fa-broom";
    }

    if (
        category.includes("vehicle") ||
        name.includes("car") ||
        name.includes("bike") ||
        name.includes("vehicle") ||
        name.includes("tyre") ||
        name.includes("puncture")
    ) {
        return "fa-car";
    }

    return "fa-screwdriver-wrench";
}


// =========================================================
// FORMAT PRICE
// =========================================================

function formatPrice(price) {

    const number = Number(price);

    if (price === null || price === undefined || price === "" ||
        Number.isNaN(number)) {
        return "Price on request";
    }

    return `Rs. ${number.toLocaleString("en-IN")}`;
}


// =========================================================
// RENDER SERVICES
// =========================================================

function renderServices() {

    if (!servicesGrid) {
        return;
    }

    servicesGrid.innerHTML = "";

    const searchValue = searchInput
        ? normalizeText(searchInput.value)
        : "";

    let visibleCount = 0;

    services.forEach(function (service) {

        const serviceName = normalizeText(service.name);
        const categoryName = getServiceCategory(service);

        const serviceCategoryId = String(
            service.category ||
            service.category_id ||
            service.category?.id ||
            ""
        );

        // CATEGORY MATCH
        const categoryMatch =
            currentCategory === "all" ||
            serviceCategoryId === currentCategory;

        // SEARCH MATCH
        const searchMatch =
            searchValue === "" ||
            serviceName.includes(searchValue) ||
            categoryName.includes(searchValue) ||
            normalizeText(service.description).includes(searchValue);

        if (!categoryMatch || !searchMatch) {
            return;
        }

        visibleCount++;

        const serviceId = service.id;
        const serviceNameDisplay = service.name || "Service";

        const description =
            service.description ||
            "Professional service available through OneClick.";

        const price = formatPrice(service.base_price);
        const icon = getServiceIcon(service);
        const image = getServiceImage(service);

        const card = document.createElement("div");

        card.className = "col-lg-4 col-md-6 service-card-col";
        card.dataset.serviceId = serviceId;
        card.dataset.name = serviceNameDisplay;

        // Keep the original booking URL and service details.
        card.innerHTML = `
            <div class="service-card h-100">

                <div class="service-image-container">
                    ${
                        image
                            ? `
                                <img
                                    class="service-image"
                                    src="${escapeHtml(image)}"
                                    alt="${escapeHtml(serviceNameDisplay)}"
                                    loading="lazy"
                                >
                            `
                            : `
                                <div class="service-image-placeholder">
                                    <i class="fa-solid ${icon}"></i>
                                </div>
                            `
                    }
                </div>

                <span class="small text-muted">
                    ${escapeHtml(service.category_name || service.category?.name || "Service")}
                </span>

                <h4 class="service-title">
                    ${escapeHtml(serviceNameDisplay)}
                </h4>

                <p class="service-description">
                    ${escapeHtml(description)}
                </p>

                <div class="service-price">
                    Starting from
                    <strong>${escapeHtml(price)}</strong>
                </div>

                <a
                    href="providers.html?service_id=${encodeURIComponent(serviceId)}"
                    class="btn btn-primary service-book-btn">
                    Book Now
                    <i class="fa-solid fa-arrow-right ms-2"></i>
                </a>

            </div>
        `;

        // If a photo path is wrong, show the icon instead of a broken image.
        const serviceImageElement = card.querySelector(".service-image");

        if (serviceImageElement) {

            serviceImageElement.addEventListener("error", function () {

                const placeholder = document.createElement("div");

                placeholder.className = "service-image-placeholder";
                placeholder.innerHTML = `<i class="fa-solid ${icon}"></i>`;

                this.replaceWith(placeholder);
            });
        }

        servicesGrid.appendChild(card);
    });


    // EMPTY STATE
    if (emptyState) {

        if (visibleCount === 0) {
            emptyState.classList.remove("d-none");
        } else {
            emptyState.classList.add("d-none");
        }
    }

    // Refresh AOS
    if (window.AOS) {
        AOS.refresh();
    }
}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHtml(value) {

    const div = document.createElement("div");

    div.textContent = String(value ?? "");

    return div.innerHTML;
}


// =========================================================
// SEARCH
// =========================================================

if (searchInput) {

    searchInput.addEventListener("input", function () {
        renderServices();
    });
}


// =========================================================
// BACK TO TOP
// =========================================================

const backToTop = document.getElementById("backToTop");

if (backToTop) {

    window.addEventListener("scroll", function () {

        if (window.scrollY > 400) {
            backToTop.classList.add("show");
        } else {
            backToTop.classList.remove("show");
        }
    });

    backToTop.addEventListener("click", function () {

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}


// =========================================================
// CLOSE MOBILE NAVBAR
// =========================================================

const navLinks = document.querySelectorAll(
    ".oc-nav-links .nav-link"
);

navLinks.forEach(function (link) {

    link.addEventListener("click", function () {

        const navMenu = document.getElementById("navMenu");

        if (!navMenu || !window.bootstrap) {
            return;
        }

        const bsCollapse = bootstrap.Collapse.getInstance(navMenu);

        if (bsCollapse) {
            bsCollapse.hide();
        }
    });
});


// =========================================================
// INITIAL LOAD
// =========================================================

async function initializeServicesPage() {

    await loadCategories();
    await loadServices();
}

initializeServicesPage();
