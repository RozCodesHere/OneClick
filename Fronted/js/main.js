
/* =========================================================
   ONECLICK — MAIN JAVASCRIPT
   Homepage + shared navigation
========================================================= */

const API_BASE_URL =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000/api"
        : "https://oneclick-backend-6hk7.onrender.com/api";


document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // AOS
    // =====================================================

    if (window.AOS) {
        AOS.init({
            duration: 700,
            easing: "ease-out-cubic",
            once: true,
            offset: 60
        });
    }


    // =====================================================
    // CURRENT YEAR
    // =====================================================

    const yearElement = document.getElementById("year");

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }


    // =====================================================
    // NAVBAR
    // =====================================================

    const navbar = document.getElementById("mainNavbar");

    if (navbar) {

        function handleNavbarScroll() {

            if (window.scrollY > 40) {
                navbar.classList.add("oc-scrolled");
            } else {
                navbar.classList.remove("oc-scrolled");
            }

        }

        handleNavbarScroll();

        window.addEventListener("scroll", handleNavbarScroll);
    }


    // =====================================================
    // MOBILE NAVBAR
    // =====================================================

    const navMenu = document.getElementById("navMenu");

    const navLinks = navMenu
        ? navMenu.querySelectorAll(".nav-link, .oc-nav-actions .btn")
        : [];

    navLinks.forEach(function (link) {

        link.addEventListener("click", function () {

            if (
                navMenu &&
                navMenu.classList.contains("show") &&
                window.bootstrap
            ) {

                const bsCollapse =
                    bootstrap.Collapse.getOrCreateInstance(navMenu);

                bsCollapse.hide();
            }

        });

    });


    // =====================================================
    // HOMEPAGE CATEGORIES
    // =====================================================

    loadHomepageCategories();


    // =====================================================
    // HOMEPAGE STATS
    // =====================================================

    loadHomepageStats();


    // =====================================================
    // FEATURED PROVIDERS
    // =====================================================

    loadFeaturedProviders();


    // =====================================================
    // HOMEPAGE SEARCH
    // =====================================================

    setupHomepageSearch();


    // =====================================================
    // BACK TO TOP
    // =====================================================

    setupBackToTop();

});


// =========================================================
// LOAD HOMEPAGE CATEGORIES
// =========================================================

async function loadHomepageCategories() {

    const container =
        document.getElementById("homepageCategories");

    if (!container) {
        return;
    }

    try {

        const response =
            await fetch(`${API_BASE_URL}/services/categories/`);

        if (!response.ok) {
            throw new Error(
                `Failed to load categories: ${response.status}`
            );
        }

        const data = await response.json();

        const categories =
            Array.isArray(data)
                ? data
                : Array.isArray(data.results)
                    ? data.results
                    : [];

        const activeCategories = categories.filter(function (category) {
            return category.is_active !== false;
        });

        if (activeCategories.length === 0) {

            container.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-muted">
                        No service categories are available yet.
                    </p>
                </div>
            `;

            return;
        }

        container.innerHTML = "";

        activeCategories.forEach(function (category) {

            const column = document.createElement("div");

            column.className = "col-6 col-md-4 col-lg-3";


            // =================================================
            // CATEGORY IMAGE MAPPING
            // Match image to category name
            // =================================================

            const categoryName =
                String(category.name || "").toLowerCase().trim();

            let categoryImage = "";

            if (categoryName.includes("clean")) {

                categoryImage =
    "assests/images/SERVICE/cleaning(2).jpg";

            } else if (
                categoryName.includes("electric")
            ) {

                categoryImage =
                    "assests/images/SERVICE/electrical.jpg";

            } else if (
                categoryName.includes("home repair") ||
                categoryName.includes("home maintenance")
            ) {

                categoryImage =
    "assests/images/HOME/plumber.jpg";

            } else if (
                categoryName.includes("vehicle") ||
                categoryName.includes("car") ||
                categoryName.includes("bike") ||
                categoryName.includes("automotive")
            ) {

                categoryImage =
                    "assests/images/SERVICE/vechile.jpg";

            } else if (categoryName.includes("repair")) {

                categoryImage =
                    "assest-images-service/home-repair.jpg";

            }


            // =================================================
            // CATEGORY CARD
            // =================================================

            column.innerHTML = `
                <a
                    href="services.html?category=${encodeURIComponent(category.id)}"
                    class="text-decoration-none">

                    <div class="oc-cat-card h-100">

                        ${
                            categoryImage
                                ? `
                                    <img
                                        src="${categoryImage}"
                                        alt="${escapeHtml(category.name)}"
                                        class="oc-cat-image"
                                        loading="lazy"
                                        onerror="
                                            this.style.display='none';
                                            this.nextElementSibling.style.display='flex';
                                        "
                                    >

                                    <div
                                        class="oc-cat-icon oc-cat-fallback"
                                        style="display:none;">
                                        ${escapeHtml(category.icon || "🛠️")}
                                    </div>
                                `
                                : `
                                    <div class="oc-cat-icon">
                                        ${escapeHtml(category.icon || "🛠️")}
                                    </div>
                                `
                        }

                        <div class="oc-cat-content">

                            <h5>
                                ${escapeHtml(category.name)}
                            </h5>

                            <span>
                                View Services
                                <i class="fa-solid fa-arrow-right ms-1"></i>
                            </span>

                        </div>

                    </div>

                </a>
            `;

            container.appendChild(column);

        });

      

    } catch (error) {

        console.error("Homepage category error:", error);

        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="py-4">
                    <i class="fa-solid fa-triangle-exclamation fa-2x mb-3"></i>
                    <p class="text-muted mb-0">
                        Unable to load service categories.
                    </p>
                </div>
            </div>
        `;

    }

}


// =========================================================
// HOMEPAGE STATS
// =========================================================

async function loadHomepageStats() {

    try {

        const response = await fetch(`${API_BASE_URL}/stats/`);

        if (!response.ok) {
            throw new Error(
                `Failed to load homepage statistics: ${response.status}`
            );
        }

        const data = await response.json();

        setStat("statProviders", data.verified_providers);
        setStat("statCustomers", data.customers);
        setStat("statCategories", data.service_categories);
        setStat("statBookings", data.bookings);

        setupCounterAnimation();

    } catch (error) {

        console.error("Homepage statistics error:", error);

    }

}


// =========================================================
// FEATURED PROVIDERS
// =========================================================

async function loadFeaturedProviders() {

    const container = document.getElementById("featuredProviders");

    if (!container) {
        return;
    }

    try {

        const response = await fetch(`${API_BASE_URL}/providers/`);

        if (!response.ok) {
            throw new Error(
                `Failed to load providers: ${response.status}`
            );
        }

        const data = await response.json();

        const providers =
            Array.isArray(data)
                ? data
                : Array.isArray(data.results)
                    ? data.results
                    : [];

        const featured = providers
            .filter(function (provider) {
                return (
                    provider.verification_status === "approved" &&
                    provider.available === true
                );
            })
            .slice(0, 4);

        if (featured.length === 0) {

            container.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-muted">
                        Available service providers will appear here.
                    </p>
                </div>
            `;

            return;
        }

        container.innerHTML = "";

        featured.forEach(function (provider) {

            const column = document.createElement("div");

            column.className = "col-12 col-sm-6 col-lg-3";

            const name = provider.full_name || "Service Provider";

            const category = provider.category_name || "General Service";

            const experience = provider.experience || 0;

            const rating = Number(provider.rating ?? 0);

            const reviewCount = provider.review_count || 0;

            const hourlyRate = provider.hourly_rate
                ? `Rs. ${Number(provider.hourly_rate).toLocaleString()}/hr`
                : "Contact for pricing";

            const image = provider.profile_image
                ? `
                    <img
                        src="${escapeHtml(provider.profile_image)}"
                        alt="${escapeHtml(name)}"
                        class="oc-provider-img">
                  `
                : `
                    <div class="oc-provider-img oc-provider-img-placeholder">
                        <i class="fa-solid fa-user"></i>
                    </div>
                  `;

            column.innerHTML = `
                <div class="oc-provider-card h-100">

                    ${image}

                    <div class="oc-provider-info">

                        <h5>${escapeHtml(name)}</h5>

                        <span class="oc-provider-category">
                            ${escapeHtml(category)}
                        </span>

                        <div class="oc-provider-rating">
                            <i class="fa-solid fa-star"></i>
                            ${rating.toFixed(1)}
                            <small>(${reviewCount})</small>
                        </div>

                        <div class="oc-provider-meta">

                            <span>
                                <i class="fa-solid fa-briefcase"></i>
                                ${experience}+ yrs
                            </span>

                            <span>
                                <i class="fa-solid fa-tag"></i>
                                ${escapeHtml(hourlyRate)}
                            </span>

                        </div>

                        <a
                            href="provider-profile.html?id=${encodeURIComponent(provider.id)}"
                            class="btn oc-btn-primary btn-sm w-100 mt-3">
                            View Profile
                        </a>

                    </div>

                </div>
            `;

            container.appendChild(column);

        });

        if (window.AOS) {
            AOS.refresh();
        }

    } catch (error) {

        console.error("Featured providers error:", error);

        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="py-4">
                    <i class="fa-solid fa-triangle-exclamation fa-2x mb-3"></i>
                    <p class="text-muted mb-0">
                        Unable to load service providers.
                    </p>
                </div>
            </div>
        `;

    }

}


// =========================================================
// SET STAT
// =========================================================

function setStat(elementId, value) {

    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    const number = Number(value);

    element.textContent = Number.isFinite(number) ? number : 0;

}


// =========================================================
// COUNTER ANIMATION
// =========================================================

function setupCounterAnimation() {

    const counters = document.querySelectorAll(".oc-stat-num");

    if (!counters.length) {
        return;
    }

    if (!("IntersectionObserver" in window)) {
        return;
    }

    const observer = new IntersectionObserver(
        function (entries) {

            entries.forEach(function (entry) {

                if (!entry.isIntersecting) {
                    return;
                }

                animateCounter(entry.target);

                observer.unobserve(entry.target);

            });

        },
        {
            threshold: 0.5
        }
    );

    counters.forEach(function (counter) {
        observer.observe(counter);
    });

}


// =========================================================
// ANIMATE COUNTER
// =========================================================

function animateCounter(element) {

    const target =
        parseInt(element.textContent, 10) || 0;

    const duration = 1200;

    const startTime = performance.now();

    function update(currentTime) {

        const progress = Math.min(
            (currentTime - startTime) / duration,
            1
        );

        const eased = 1 - Math.pow(1 - progress, 3);

        const current = Math.floor(target * eased);

        element.textContent = current.toLocaleString();

        if (progress < 1) {

            requestAnimationFrame(update);

        } else {

            element.textContent = target.toLocaleString();

        }

    }

    requestAnimationFrame(update);

}


// =========================================================
// HOMEPAGE SEARCH
// =========================================================

function setupHomepageSearch() {

    const searchInput =
        document.getElementById("landingServiceSearch");

    const searchButton =
        document.getElementById("landingSearchButton");

    if (!searchInput) {
        return;
    }

    function performSearch() {

        const searchValue = searchInput.value.trim();

        if (!searchValue) {

            window.location.href = "services.html";

            return;

        }

        window.location.href =
            "services.html?search=" +
            encodeURIComponent(searchValue);

    }

    searchInput.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            performSearch();

        }

    });

    if (searchButton) {
        searchButton.addEventListener("click", performSearch);
    }

}


// =========================================================
// BACK TO TOP
// =========================================================

function setupBackToTop() {

    const backToTop = document.getElementById("backToTop");

    if (!backToTop) {
        return;
    }

    window.addEventListener("scroll", function () {

        if (window.scrollY > 500) {

            backToTop.classList.add("oc-visible");

        } else {

            backToTop.classList.remove("oc-visible");

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
// ESCAPE HTML
// =========================================================

function escapeHtml(value) {

    const div = document.createElement("div");

    div.textContent = value == null ? "" : String(value);

    return div.innerHTML;

}
