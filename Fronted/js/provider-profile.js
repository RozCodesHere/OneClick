/* =========================================================
   ONECLICK — PROVIDER PROFILE PAGE
   Dynamic provider data from Django REST API
   ========================================================= */

const API_BASE = "http://127.0.0.1:8000/api";

/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    loadLoggedInUser();

    loadProviderProfile();

    initAnimatedCounters();
    initSaveProvider();
    initActionButtons();
    initGalleryLightbox();
    initLoadMoreReviews();
   
    initMobileActionBar();
    initRippleButtons();
    initScrollAnimations();

});

/* =========================================================
   GET PROVIDER ID FROM URL
   Example:
   provider-profile.html?id=1
   ========================================================= */

function getProviderId() {

    const params =
        new URLSearchParams(window.location.search);

    return params.get("id");

}

/* =========================================================
   GET SERVICE ID FROM URL
   Example:
   provider-profile.html?id=1&service_id=2
   ========================================================= */

function getServiceId() {

    const params =
        new URLSearchParams(window.location.search);

    const serviceId =
        params.get("service_id");

    if (!serviceId || !/^\d+$/.test(serviceId)) {
        return null;
    }

    return serviceId;

}

/* =========================================================
   BOOKING URL
   ========================================================= */

function getBookingUrl(providerId) {

    const serviceId =
        getServiceId();

    if (serviceId) {

        return `booking.html?provider_id=${providerId}&service_id=${serviceId}`;

    }

    return `booking.html?provider_id=${providerId}`;

}

/* =========================================================
   SAFE TEXT HELPER
   ========================================================= */

function setText(selector, value) {

    const element =
        document.querySelector(selector);

    if (element) {

        element.textContent =
            value ?? "";

    }

}

/* =========================================================
   LOAD PROVIDER PROFILE
   =========================================================
   
   CASE 1:
   Public provider profile
   provider-profile.html?id=1

   CASE 2:
   Logged-in provider profile
   provider-profile.html

   IMPORTANT:
   Public provider requests include service_id when
   available so Django can return ProviderService.price.
   ========================================================= */

async function loadProviderProfile() {

    const providerId =
        getProviderId();

    try {

        /* =====================================================
           CASE 1 — PUBLIC PROVIDER PROFILE
           ===================================================== */

        if (providerId) {

            const serviceId =
                getServiceId();

            let providerUrl =
                `${API_BASE}/providers/${providerId}/`;

            /*
             * If the profile was opened from a specific service,
             * send that service ID to Django.
             *
             * Example:
             * /api/providers/7/?service_id=4
             */

            if (serviceId) {

                providerUrl +=
                    `?service_id=${serviceId}`;

            }

            console.log(
                "Loading provider profile:",
                providerUrl
            );

            const response =
                await fetch(providerUrl);

            if (!response.ok) {

                throw new Error(
                    `Provider API returned ${response.status}`
                );

            }

            const provider =
                await response.json();

            console.log(
                "PUBLIC PROVIDER PROFILE:",
                provider
            );

            renderProviderProfile(provider);

            await loadProviderReviews(
                provider.id
            );

            return;

        }

        /* =====================================================
           CASE 2 — LOGGED-IN PROVIDER
           ===================================================== */

        const token =
            localStorage.getItem(
                "access_token"
            );

        if (!token) {

            console.error(
                "Access token not found."
            );

            showToast(
                "Login Required",
                "Please log in to view your provider profile."
            );

            return;

        }

        const dashboardResponse =
            await fetch(
                `${API_BASE}/providers/dashboard/`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        if (!dashboardResponse.ok) {

            throw new Error(
                `Provider dashboard API returned ${dashboardResponse.status}`
            );

        }

        const dashboardData =
            await dashboardResponse.json();

        console.log(
            "Provider dashboard data:",
            dashboardData
        );

        const provider =
            dashboardData.provider;

        if (!provider) {

            throw new Error(
                "Provider information was not found in dashboard response."
            );

        }
                // Use the combined application + KYC verification status.
        provider.is_verified =
            dashboardData.verification?.is_verified === true;

        console.log(
            "LOGGED-IN PROVIDER PROFILE:",
            provider
        );

        renderProviderProfile(
            provider
        );

        /*
         * Load reviews for the logged-in provider as well.
         */

        if (provider.id) {

            await loadProviderReviews(
                provider.id
            );

        }

    } catch (error) {

        console.error(
            "Error loading provider profile:",
            error
        );

        showToast(
            "Error",
            "Unable to load provider profile."
        );

    }

}

/* =========================================================
   LOAD LOGGED-IN USER FOR NAVBAR
   ========================================================= */

async function loadLoggedInUser() {

    const token =
        localStorage.getItem("access_token");

    if (!token) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API_BASE}/users/me/`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        if (!response.ok) {

            console.error(
                "Unable to load logged-in user:",
                response.status
            );

            return;

        }

        const user =
            await response.json();

        console.log(
            "LOGGED-IN USER:",
            user
        );

        const firstName =
    String(
        user.first_name ||
        ""
    ).trim();

const fullName =
    `${user.first_name || ""} ${user.last_name || ""}`.trim();

const userName =
    fullName ||
    user.full_name ||
    user.name ||
    user.username ||
    user.email ||
    "User";

        setText(
            "#navUserName",
            userName
        );

        const homeLink =
    document.querySelector(
        '.oc-nav-links a[href="index.html"]'
    );

if (homeLink && user.role) {

    if (user.role === "customer") {

        homeLink.href =
            "customer-dashboard.html";

    } else if (user.role === "provider") {

        homeLink.href =
            "provider-dashboard.html";

    } else if (user.role === "admin") {

        homeLink.href =
            "admin-dashboard.html";

    }

}

    const avatar =
    document.querySelector(
        "#navUserAvatar"
    );

if (avatar) {

    if (user.profile_picture) {

        const imageUrl =
            user.profile_picture.startsWith("http")
                ? user.profile_picture
                : `http://127.0.0.1:8000${user.profile_picture}`;

        avatar.src =
            imageUrl;

        avatar.alt =
            userName;

    } else {

        const firstLetter =
            userName
                .charAt(0)
                .toUpperCase() ||
            "U";

        avatar.src =
            `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg"
                     width="60"
                     height="60">

                    <rect
                        width="100%"
                        height="100%"
                        fill="#e9ecef"
                    />

                    <text
                        x="50%"
                        y="50%"
                        dominant-baseline="middle"
                        text-anchor="middle"
                        font-size="28"
                        font-family="Arial"
                        fill="#333"
                    >
                        ${firstLetter}
                    </text>

                </svg>
            `)}`;

        avatar.alt =
            `${userName} profile picture`;

    }

}

    } catch (error) {

        console.error(
            "Error loading logged-in user:",
            error
        );

    }

}

/* =========================================================
   RENDER PROVIDER PROFILE
   ========================================================= */

function renderProviderProfile(provider) {

    const providerName =
        provider.full_name ||
        "Provider";

    const category =
        provider.category_name ||
        "Service Provider";

    const serviceName =
        provider.service_name ||
        null;

    const experience =
        provider.experience ?? 0;

    const address =
        provider.address ||
        "Location not available";

    const bio =
        provider.bio ||
        "No description available.";

    /*
     * IMPORTANT:
     *
     * service_price comes from ProviderService.
     *
     * We intentionally DO NOT use hourly_rate as a fallback.
     *
     * hourly_rate is not necessarily the price of the
     * selected service.
     */

    const servicePrice =
        provider.service_price;

    const price =
        servicePrice !== null &&
        servicePrice !== undefined
            ? servicePrice
            : null;

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

            const reviews = provider.reviews || [];

    renderProviderReviews(reviews);


    /* =====================================================
       PROVIDER STATISTICS
       ===================================================== */

    const stats = document.querySelectorAll(".mini-stat-value");

    const statValues = [
        provider.completed_jobs ?? 0,
        provider.happy_customers ?? 0,
        provider.repeat_customers ?? 0,
        provider.average_response_time || "—"
    ];

    stats.forEach((element, index) => {
        element.textContent = statValues[index] ?? "—";
    });
    /* =====================================================
       BASIC PROFILE INFORMATION
       ===================================================== */

    setText(
        "#providerName",
        providerName
    );

    setText(
        "#floatingProviderName",
        providerName
    );

 setText("#providerCategory", category);
setText("#floatingService", serviceName || category);
setText("#providerService", serviceName || category);

   
    setText(
        "#providerExperience",
        `${experience}+`
    );

    setText(
        "#providerAddress",
        address
    );

    setText(
        "#floatingLocation",
        address
    );
    setText(
    "#providerEmail",
    provider.email || "Email not available"
);

    setText(
        "#breadcrumbCategory",
        category
    );

    setText(
        "#breadcrumbProvider",
        providerName
    );

    setText(
        ".about-text",
        bio
    );

    /* =====================================================
       PRICING
       ===================================================== */

    const pricingValues =
        document.querySelectorAll(
            ".pricing-value"
        );

    /*
     * pricingValues[1] is the Starting Price field
     */

    if (pricingValues.length >= 2) {

        pricingValues[1].textContent =
            price !== null
                ? `Rs. ${price}`
                : "Not provided";

    }

    setText(
        "#floatingPrice",
        price !== null
            ? `Rs. ${price}`
            : "Not provided"
    );

    /* =====================================================
       RATING
       ===================================================== */

    const formattedRating =
        rating.toFixed(1);

    setText(
        "#providerRating",
        formattedRating
    );

    setText(
        "#floatingRating",
        formattedRating
    );

    setText(
        "#reviewsScore",
        formattedRating
    );

    /* =====================================================
       REVIEWS COUNT
       ===================================================== */

    const reviewText =
        reviewCount === 1
            ? "review"
            : "reviews";

    setText(
        "#providerReviews",
        `(${reviewCount} ${reviewText})`
    );

    setText(
        "#floatingReviews",
        `(${reviewCount} ${reviewText})`
    );

    setText(
        "#reviewsSummaryText",
        `Based on ${reviewCount} ${reviewText}`
    );

    /* =====================================================
       RATING STARS
       ===================================================== */

    updateRatingStars(
        rating,
        "#providerRatingStars"
    );

    updateAllRatingStars(
        rating
    );

    /* =====================================================
       PROFILE IMAGE
       ===================================================== */

    if (provider.profile_image) {

        const profilePhoto =
            document.querySelector(
                "#profilePhoto"
            );

        const floatingAvatar =
            document.querySelector(
                "#floatingAvatar"
            );

        if (profilePhoto) {

            profilePhoto.src =
                provider.profile_image;

            profilePhoto.alt =
                `${providerName} profile photo`;

        }

        if (floatingAvatar) {

            floatingAvatar.src =
                provider.profile_image;

            floatingAvatar.alt =
                `${providerName} profile photo`;

        }

    }

    /* =====================================================
       VERIFICATION BADGE
       ===================================================== */

    const verifyBadge =
        document.querySelector(
            "#verifyBadge"
        );

    const floatingVerifyBadge =
        document.querySelector(
            "#floatingVerifyBadge"
        );

    if (provider.is_verified === true) {

        if (verifyBadge) {

            verifyBadge.style.display =
                "inline-flex";

        }

        if (floatingVerifyBadge) {

            floatingVerifyBadge.style.display =
                "inline-block";

        }

    } else {

        if (verifyBadge) {

            verifyBadge.style.display =
                "none";

        }

        if (floatingVerifyBadge) {

            floatingVerifyBadge.style.display =
                "none";

        }

    }

    const verificationNote =
    document.querySelector("#verificationNote");

if (verificationNote) {
    verificationNote.style.display =
        provider.is_verified === true ? "flex" : "none";
}



    /* =====================================================
       AVAILABILITY
       ===================================================== */

    updateAvailability(
        provider.available
    );

    /* =====================================================
       COMPLETED WORK
       ===================================================== */

    renderCompletedWorkGallery(provider.work_photos || []);

}

/* =========================================================
   COMPLETED WORK
   ========================================================= */

function renderCompletedWorkGallery(photos) {

    const gallery = document.querySelector(".gallery-grid");

    if (!gallery) return;

    if (!photos.length) {
        gallery.innerHTML = `
            <div class="empty-gallery-state">
                <i class="fa-regular fa-images"></i>
                <h4>No work photos yet</h4>
                <p>This provider has not uploaded any work photos.</p>
            </div>
        `;
        return;
    }

    gallery.innerHTML = photos.map(photo => {

        const imageUrl = photo.image.startsWith("http")
            ? photo.image
            : `http://127.0.0.1:8000${photo.image}`;

        return `
            <div class="gallery-item">
                <img src="${escapeHtml(imageUrl)}"
                     alt="${escapeHtml(photo.caption || "Provider work")}"
                     loading="lazy">
            </div>
        `;

    }).join("");

}


    
/* =========================================================
   UPDATE AVAILABILITY
   ========================================================= */

function updateAvailability(isAvailable) {

    const statusIndicator =
        document.querySelector(
            "#statusIndicator"
        );

    const statusPill =
        document.querySelector(
            "#statusPill"
        );

    if (isAvailable) {

        if (statusIndicator) {

            statusIndicator.classList.remove(
                "status-offline"
            );

            statusIndicator.classList.add(
                "status-online"
            );

            statusIndicator.title =
                "Available now";

        }

        if (statusPill) {

            statusPill.classList.remove(
                "status-pill-offline"
            );

            statusPill.classList.add(
                "status-pill-online"
            );

            statusPill.innerHTML = `
                <i class="fa-solid fa-circle"></i>
                Available Now
            `;

        }

    } else {

        if (statusIndicator) {

            statusIndicator.classList.remove(
                "status-online"
            );

            statusIndicator.classList.add(
                "status-offline"
            );

            statusIndicator.title =
                "Currently unavailable";

        }

        if (statusPill) {

            statusPill.classList.remove(
                "status-pill-online"
            );

            statusPill.classList.add(
                "status-pill-offline"
            );

            statusPill.innerHTML = `
                <i class="fa-solid fa-circle"></i>
                Currently Unavailable
            `;

        }

    }

}

/* =========================================================
   RATING STAR SYSTEM
   ========================================================= */

function updateRatingStars(
    rating,
    selector
) {

    const container =
        document.querySelector(
            selector
        );

    if (!container) {
        return;
    }

    const stars =
        container.querySelectorAll(
            "i"
        );

    stars.forEach(
        function (star, index) {

            const starNumber =
                index + 1;

            star.classList.remove(
                "fa-solid",
                "fa-regular",
                "fa-star-half-stroke"
            );

            if (rating >= starNumber) {

                star.classList.add(
                    "fa-solid",
                    "fa-star"
                );

            } else if (
                rating >= starNumber - 0.5
            ) {

                star.classList.add(
                    "fa-solid",
                    "fa-star-half-stroke"
                );

            } else {

                star.classList.add(
                    "fa-regular",
                    "fa-star"
                );

            }

        }
    );

}

/* =========================================================
   UPDATE ALL RATING STAR GROUPS
   ========================================================= */

function updateAllRatingStars(
    rating
) {

    const starGroups =
        document.querySelectorAll(
            ".meta-stars"
        );

    starGroups.forEach(
        function (group) {

            const stars =
                group.querySelectorAll(
                    "i"
                );

            stars.forEach(
                function (star, index) {

                    const starNumber =
                        index + 1;

                    star.classList.remove(
                        "fa-solid",
                        "fa-regular",
                        "fa-star-half-stroke"
                    );

                    if (
                        rating >= starNumber
                    ) {

                        star.classList.add(
                            "fa-solid",
                            "fa-star"
                        );

                    } else if (
                        rating >=
                        starNumber - 0.5
                    ) {

                        star.classList.add(
                            "fa-solid",
                            "fa-star-half-stroke"
                        );

                    } else {

                        star.classList.add(
                            "fa-regular",
                            "fa-star"
                        );

                    }

                }
            );

        }
    );

}

/* =========================================================
   LOAD PROVIDER REVIEWS
   ========================================================= */

async function loadProviderReviews(
    providerId
) {

    try {

        const response =
            await fetch(
                `${API_BASE}/reviews/?provider=${providerId}`
            );

        if (!response.ok) {

            throw new Error(
                `Reviews API returned ${response.status}`
            );

        }

        const reviews =
            await response.json();

        console.log(
            "REAL PROVIDER REVIEWS:",
            reviews
        );

        /*
         * Django may return either:
         *
         * [
         *     {...},
         *     {...}
         * ]
         *
         * or:
         *
         * {
         *     results: [...]
         * }
         */

        const reviewList =
            Array.isArray(reviews)
                ? reviews
                : (
                    reviews.results ||
                    []
                );

        renderReviews(
            reviewList
        );

    } catch (error) {

        console.error(
            "Error loading provider reviews:",
            error
        );

        renderReviews([]);

    }

}

/* =========================================================
   RENDER REVIEWS
   ========================================================= */

function renderReviews(
    reviews
) {

    const container =
        document.querySelector(
            "#reviewsContainer"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!reviews.length) {

        container.innerHTML = `
            <div class="review-item">

                <div class="review-body">

                    <div class="review-top">

                        <h5>
                            No reviews yet
                        </h5>

                    </div>

                    <p class="review-text">
                        This provider has not received
                        any customer reviews yet.
                    </p>

                </div>

            </div>
        `;

        const loadMore =
            document.querySelector(
                "#loadMoreReviews"
            );

        if (loadMore) {

            loadMore.style.display =
                "none";

        }

        return;

    }

    reviews.forEach(
        function (review) {

            container.insertAdjacentHTML(
                "beforeend",
                renderReview(review)
            );

        }
    );

    const loadMore =
        document.querySelector(
            "#loadMoreReviews"
        );

    if (loadMore) {

        loadMore.style.display =
            "none";

    }

}

/* =========================================================
   RENDER SINGLE REVIEW
   ========================================================= */

function renderReview(
    review
) {

    const customerName =
        escapeHtml(
            review.customer_name ||
            review.customer?.full_name ||
            review.customer?.name ||
            "Customer"
        );

    const comment =
        escapeHtml(
            review.comment ||
            review.review ||
            "No comment provided."
        );

    const rating =
        Number(
            review.rating || 0
        );

    const date =
        formatReviewDate(
            review.created_at
        );

    const stars =
        generateReviewStars(
            rating
        );

    return `
        <div class="review-item">

            <div class="review-body">

                <div class="review-top">

                    <h5>
                        ${customerName}
                    </h5>

                    <div class="review-stars">
                        ${stars}
                    </div>

                </div>

                <p class="review-text">
                    ${comment}
                </p>

                <span class="review-date">
                    ${date}
                </span>

            </div>

        </div>
    `;

}

/* =========================================================
   GENERATE REVIEW STARS
   ========================================================= */

function generateReviewStars(
    rating
) {

    let html = "";

    for (
        let i = 1;
        i <= 5;
        i++
    ) {

        if (rating >= i) {

            html +=
                `<i class="fa-solid fa-star"></i>`;

        } else if (
            rating >= i - 0.5
        ) {

            html +=
                `<i class="fa-solid fa-star-half-stroke"></i>`;

        } else {

            html +=
                `<i class="fa-regular fa-star"></i>`;

        }

    }

    return html;

}

/* =========================================================
   FORMAT REVIEW DATE
   ========================================================= */

function formatReviewDate(
    dateString
) {

    if (!dateString) {

        return "—";

    }

    const date =
        new Date(
            dateString
        );

    if (isNaN(date.getTime())) {

        return "—";

    }

    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );

}

/* =========================================================
   HTML ESCAPE
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

/* =========================================================
   ANIMATED COUNTERS
   ========================================================= */

function initAnimatedCounters() {

    const counters =
        document.querySelectorAll(
            ".mini-stat-value"
        );

    counters.forEach(
        function (counter) {

            counter.textContent =
                "—";

        }
    );

}

/* =========================================================
   SAVE PROVIDER
   ========================================================= */

function initSaveProvider() {

    const saveButton = document.querySelector("#saveProviderBtn");

    if (!saveButton) return;

    const providerId = getProviderId();
    const token = localStorage.getItem("access_token");

    if (!providerId || !token) {
        saveButton.style.display = "none";
        return;
    }

    async function checkSavedStatus() {

        try {
            const response = await fetch(
                `${API_BASE}/providers/saved-providers/`,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) return;

            const savedProviders = await response.json();

            const isSaved = savedProviders.some(item =>
                String(item.provider?.id || item.provider) === String(providerId)
            );

            updateSaveButton(isSaved);

        } catch (error) {
            console.error("Saved provider check failed:", error);
        }
    }

    function updateSaveButton(isSaved) {

        saveButton.setAttribute("aria-pressed", String(isSaved));

        const icon = saveButton.querySelector("i");
        const text = saveButton.querySelector("span");

        if (icon) {
            icon.classList.toggle("fa-solid", isSaved);
            icon.classList.toggle("fa-regular", !isSaved);
        }

        if (text) {
            text.textContent = isSaved ? "Saved" : "Save";
        }
    }

    saveButton.addEventListener("click", async function () {

        const isSaved = saveButton.getAttribute("aria-pressed") === "true";

        try {

            const response = await fetch(
                isSaved
                    ? `${API_BASE}/providers/saved-providers/${providerId}/`
                    : `${API_BASE}/providers/saved-providers/`,
                {
                    method: isSaved ? "DELETE" : "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    ...(isSaved ? {} : {
                        body: JSON.stringify({ provider: providerId })
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Request failed");
            }

            updateSaveButton(!isSaved);

            showToast(
                isSaved ? "Provider Removed" : "Provider Saved",
                data.message
            );

        } catch (error) {
            console.error("Save provider error:", error);
            showToast("Error", error.message);
        }
    });

    checkSavedStatus();
}
/* =========================================================
   ACTION BUTTONS
   ========================================================= */

function initActionButtons() {

    document
        .querySelectorAll(
            ".btn-book-now"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const providerId =
                            getProviderId();

                        if (!providerId) {

                            showToast(
                                "Error",
                                "Provider information is missing."
                            );

                            return;

                        }

                        window.location.href =
                            getBookingUrl(
                                providerId
                            );

                    }
                );

            }
        );

  document
    .querySelectorAll(
        ".btn-message"
    )
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const providerId =
                        getProviderId();

                    if (!providerId) {

                        showToast(
                            "Error",
                            "Provider information is missing."
                        );

                        return;
                    }

                    window.location.href =
                        `chat.html?provider_id=${encodeURIComponent(providerId)}`;

                }
            );

        }
    );

    document
        .querySelectorAll(
            ".btn-call"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        showToast(
                            "Call Provider",
                            "Calling feature will be connected next."
                        );

                    }
                );

            }
        );

}

/* =========================================================
   LOAD MORE REVIEWS
   ========================================================= */

function initLoadMoreReviews() {

    const button =
        document.querySelector(
            "#loadMoreReviews"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        function () {

            showToast(
                "Reviews",
                "All available reviews are already displayed."
            );

        }
    );

}

/* =========================================================
   MOBILE ACTION BAR
   ========================================================= */

function initMobileActionBar() {

    const mobileBookNow =
        document.querySelector(
            "#mobileBookNow"
        );

    const mobileMessage =
        document.querySelector(
            "#mobileMessage"
        );

    const mobileCall =
        document.querySelector(
            "#mobileCall"
        );

    if (mobileBookNow) {

        mobileBookNow.addEventListener(
            "click",
            function () {

                const providerId =
                    getProviderId();

                if (!providerId) {

                    showToast(
                        "Error",
                        "Provider information is missing."
                    );

                    return;

                }

                window.location.href =
                    getBookingUrl(
                        providerId
                    );

            }
        );

    }

   if (mobileMessage) {

    mobileMessage.addEventListener(
        "click",
        function () {

            const providerId =
                getProviderId();

            if (!providerId) {

                showToast(
                    "Error",
                    "Provider information is missing."
                );

                return;
            }

            window.location.href =
                `chat.html?provider_id=${encodeURIComponent(providerId)}`;

        }
    );

}

    if (mobileCall) {

        mobileCall.addEventListener(
            "click",
            function () {

                showToast(
                    "Call Provider",
                    "Calling feature will be connected next."
                );

            }
        );

    }

}

/* =========================================================
   TOAST
   ========================================================= */

function showToast(
    title,
    message
) {

    const toast =
        document.querySelector(
            "#actionToast"
        );

    const toastTitle =
        document.querySelector(
            "#toastTitle"
        );

    const toastText =
        document.querySelector(
            "#toastText"
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
        window.oneClickToastTimer
    );

    window.oneClickToastTimer =
        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}

/* =========================================================
   TOAST CLOSE
   ========================================================= */

document.addEventListener(
    "click",
    function (event) {

        if (
            event.target.closest(
                "#toastClose"
            )
        ) {

            const toast =
                document.querySelector(
                    "#actionToast"
                );

            if (toast) {

                toast.classList.remove(
                    "show"
                );

            }

        }

    }
);

/* =========================================================
   GALLERY LIGHTBOX
   ========================================================= */

function initGalleryLightbox() {

    const lightbox =
        document.querySelector(
            "#lightbox"
        );

    const lightboxImage =
        document.querySelector(
            "#lightboxImage"
        );

    const lightboxClose =
        document.querySelector(
            "#lightboxClose"
        );

    if (
        !lightbox ||
        !lightboxImage
    ) {

        return;

    }

   document.querySelector(".gallery-grid").addEventListener("click", function (event) {

    const item = event.target.closest(".gallery-item");
    if (!item) return;

    const image = item.querySelector("img");
    if (!image) return;

    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;

    lightbox.classList.add("active");
    document.body.style.overflow = "hidden";

});

    function closeLightbox() {

        lightbox.classList.remove(
            "active"
        );

        document.body.style.overflow =
            "";

    }

    if (lightboxClose) {

        lightboxClose.addEventListener(
            "click",
            closeLightbox
        );

    }

    lightbox.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                lightbox
            ) {

                closeLightbox();

            }

        }
    );

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Escape"
            ) {

                closeLightbox();

            }

        }
    );

}

/* =========================================================
   RIPPLE EFFECT
   ========================================================= */

function initRippleButtons() {

    document
        .querySelectorAll(
            ".ripple"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function (event) {

                        const ripple =
                            document.createElement(
                                "span"
                            );

                        const rect =
                            button.getBoundingClientRect();

                        const size =
                            Math.max(
                                rect.width,
                                rect.height
                            );

                        ripple.style.width =
                            `${size}px`;

                        ripple.style.height =
                            `${size}px`;

                        ripple.style.left =
                            `${event.clientX - rect.left - size / 2}px`;

                        ripple.style.top =
                            `${event.clientY - rect.top - size / 2}px`;

                        ripple.classList.add(
                            "ripple-effect"
                        );

                        button.appendChild(
                            ripple
                        );

                        setTimeout(
                            function () {

                                ripple.remove();

                            },
                            600
                        );

                    }
                );

            }
        );

}

/* =========================================================
   SCROLL ANIMATIONS
   ========================================================= */

function initScrollAnimations() {

    const elements =
        document.querySelectorAll(
            ".fade-up"
        );

    if (
        !(
            "IntersectionObserver"
            in window
        )
    ) {

        elements.forEach(
            function (element) {

                element.classList.add(
                    "visible"
                );

            }
        );

        return;

    }

    const observer =
        new IntersectionObserver(
            function (entries) {

                entries.forEach(
                    function (entry) {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target.classList.add(
                                "visible"
                            );

                            observer.unobserve(
                                entry.target
                            );

                        }

                    }
                );

            },
            {
                threshold: 0.1
            }
        );

    elements.forEach(
        function (element) {

            observer.observe(
                element
            );

        }
    );

}



/* =========================================================
   RENDER PROVIDER REVIEWS
   ========================================================= */

function renderProviderReviews(reviews) {

    const container = document.getElementById("reviewsContainer");

    if (!container) return;

    if (!reviews || reviews.length === 0) {
        container.innerHTML = `
            <p class="text-center py-4">
                No customer reviews are available yet.
            </p>
        `;
        return;
    }

    container.innerHTML = reviews.map(review => {

        const stars = Array.from({ length: 5 }, (_, i) =>
            `<i class="fa-${i < review.rating ? "solid" : "regular"} fa-star"></i>`
        ).join("");

        const date = new Date(review.created_at).toLocaleDateString();

        return `
            <div class="review-item">
                <div class="review-body">
                    <div class="review-top">
                        <h5>${review.customer_name || "Customer"}</h5>
                        <div class="review-stars">${stars}</div>
                    </div>

                    <p class="review-text">
                        ${review.comment || "No comment provided."}
                    </p>

                    <span class="review-date">${date}</span>
                </div>
            </div>
        `;

    }).join("");
}
