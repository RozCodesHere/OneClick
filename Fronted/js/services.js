// =========================================================
// ONECLICK — SERVICES PAGE JAVASCRIPT
// Connected to Django REST API
// =========================================================


// =========================================================
// CONFIG
// =========================================================

const API_BASE_URL = "http://127.0.0.1:8000/api";


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

const searchInput =
    document.getElementById("serviceSearchInput");
const urlParams =
    new URLSearchParams(window.location.search);

const initialSearch =
    urlParams.get("search");
const filterContainer =
    document.querySelector(".services-filters");

const emptyState =
    document.getElementById("emptyState");

const servicesGrid =
    document.getElementById("servicesGrid");


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
// LOAD CATEGORIES FROM DJANGO
// =========================================================

async function loadCategories() {

    if (!filterContainer) {
        return;
    }

    try {

        const response =
            await fetch(`${API_BASE_URL}/services/categories/`);

        if (!response.ok) {
            throw new Error(
                `Failed to load categories. Status: ${response.status}`
            );
        }

        const data =
            await response.json();

        if (Array.isArray(data)) {

            categories = data;

        } else if (Array.isArray(data.results)) {

            categories = data.results;

        } else {

            categories = [];

        }


        renderCategoryFilters();


    } catch (error) {

        console.error(
            "Error loading categories:",
            error
        );

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


    // All services button

    const allButton =
        document.createElement("button");

    allButton.type = "button";

    allButton.className =
        "filter-btn active";

    allButton.dataset.categoryId =
        "all";

    allButton.textContent =
        "All Services";

    filterContainer.appendChild(allButton);


    // Database categories

    categories.forEach(function (category) {

        if (category.is_active === false) {
            return;
        }


        const button =
            document.createElement("button");

        button.type = "button";

        button.className =
            "filter-btn";

        button.dataset.categoryId =
            String(category.id);


        button.textContent =
            category.icon
                ? `${category.icon} ${category.name}`
                : category.name;


        filterContainer.appendChild(button);

    });


   attachCategoryFilterEvents();


// Select category from URL if provided
if (currentCategory !== "all") {

    const selectedButton =
        document.querySelector(
            `.services-filters .filter-btn[data-category-id="${currentCategory}"]`
        );

    if (selectedButton) {

        document
            .querySelectorAll(".services-filters .filter-btn")
            .forEach(function (button) {

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

    const filterButtons =
        document.querySelectorAll(
            ".services-filters .filter-btn"
        );


    filterButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                filterButtons.forEach(function (btn) {
                    btn.classList.remove("active");
                });


                this.classList.add("active");


                currentCategory =
                    this.dataset.categoryId || "all";


                renderServices();

            }
        );

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

                <h5>
                    Loading services...
                </h5>

                <p class="text-muted mb-0">
                    Please wait while we load available services.
                </p>

            </div>
        </div>
    `;


    try {

        const response =
            await fetch(`${API_BASE_URL}/services/`);


        if (!response.ok) {

            throw new Error(
                `Failed to load services. Status: ${response.status}`
            );

        }


        const data =
            await response.json();


        // Django REST Framework pagination

        if (Array.isArray(data)) {

            services = data;

        } else if (Array.isArray(data.results)) {

            services = data.results;

        } else {

            services = [];

        }


        renderServices();


    } catch (error) {

        console.error(
            "Error loading services:",
            error
        );


        servicesGrid.innerHTML = `
            <div class="col-12 text-center">

                <div class="py-5">

                    <i class="fa-solid fa-triangle-exclamation fa-2x mb-3"></i>

                    <h5>
                        Unable to load services
                    </h5>

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

    const category =
        getServiceCategory(service);

    const name =
        (service.name || "")
            .toLowerCase();


    if (
        category.includes("electrical") ||
        name.includes("electric")
    ) {
        return "fa-bolt";
    }


    if (
        category.includes("home repair") ||
        name.includes("plumb")
    ) {
        return "fa-faucet";
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
        name.includes("vehicle")
    ) {
        return "fa-car";
    }


    return "fa-screwdriver-wrench";

}


// =========================================================
// FORMAT PRICE
// =========================================================

function formatPrice(price) {

    const number =
        Number(price);


    if (Number.isNaN(number)) {
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


    const searchValue =
        searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";


    let visibleCount = 0;


    services.forEach(function (service) {

        const serviceName =
            (service.name || "")
                .toLowerCase()
                .trim();


        const categoryName =
            getServiceCategory(service);


        const serviceCategoryId =
            String(
                service.category ||
                service.category_id ||
                service.category?.id ||
                ""
            );


        // -----------------------------------------
        // CATEGORY MATCH
        // -----------------------------------------

        const categoryMatch =
            currentCategory === "all" ||
            serviceCategoryId === currentCategory;


        // -----------------------------------------
        // SEARCH MATCH
        // -----------------------------------------

        const searchMatch =
            searchValue === "" ||
            serviceName.includes(searchValue) ||
            categoryName.includes(searchValue) ||
            (service.description || "")
                .toLowerCase()
                .includes(searchValue);


        if (
            !categoryMatch ||
            !searchMatch
        ) {
            return;
        }


        visibleCount++;


        const serviceId =
            service.id;


        const serviceNameDisplay =
            service.name ||
            "Service";


        const description =
            service.description ||
            "Professional service available through OneClick.";


        const price =
            formatPrice(service.base_price);


        const icon =
            getServiceIcon(service);


        // -----------------------------------------
        // CARD
        // -----------------------------------------

        const card =
            document.createElement("div");


        card.className =
            "col-lg-4 col-md-6 service-card-col";


        card.dataset.serviceId =
            serviceId;


        card.dataset.name =
            serviceNameDisplay;


        card.innerHTML = `
            <div class="service-card h-100">

                <div class="service-icon">
                    <i class="fa-solid ${icon}"></i>
                </div>

                <span class="small text-muted">
                    ${escapeHtml(
                        service.category_name || "Service"
                    )}
                </span>

                <h4 class="service-title">
                    ${escapeHtml(serviceNameDisplay)}
                </h4>

                <p class="service-description">
                    ${escapeHtml(description)}
                </p>

                <div class="service-price">
                    Starting from
                    <strong>${price}</strong>
                </div>

                <a
                    href="providers.html?service_id=${encodeURIComponent(serviceId)}"
                    class="btn btn-primary service-book-btn">

                    Book Now

                    <i class="fa-solid fa-arrow-right ms-2"></i>

                </a>

            </div>
        `;


        servicesGrid.appendChild(card);

    });


    // =====================================================
    // EMPTY STATE
    // =====================================================

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

    const div =
        document.createElement("div");

    div.textContent =
        value;

    return div.innerHTML;

}


// =========================================================
// SEARCH
// =========================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            renderServices();

        }
    );

}


// =========================================================
// BACK TO TOP
// =========================================================

const backToTop =
    document.getElementById("backToTop");


if (backToTop) {

    window.addEventListener(
        "scroll",
        function () {

            if (window.scrollY > 400) {

                backToTop.classList.add("show");

            } else {

                backToTop.classList.remove("show");

            }

        }
    );


    backToTop.addEventListener(
        "click",
        function () {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );

}


// =========================================================
// CLOSE MOBILE NAVBAR
// =========================================================

const navLinks =
    document.querySelectorAll(
        ".oc-nav-links .nav-link"
    );


navLinks.forEach(function (link) {

    link.addEventListener(
        "click",
        function () {

            const navMenu =
                document.getElementById("navMenu");


            if (!navMenu) {
                return;
            }


            const bsCollapse =
                bootstrap.Collapse.getInstance(navMenu);


            if (bsCollapse) {
                bsCollapse.hide();
            }

        }
    );

});


// =========================================================
// INITIAL LOAD
// =========================================================

async function initializeServicesPage() {

    await loadCategories();

    await loadServices();

}


initializeServicesPage();