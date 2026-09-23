/* =========================================================
   ONECLICK — PROVIDER PROFILE PAGE
   Dynamic provider data from Django REST API
   ========================================================= */

const API_BASE = "http://127.0.0.1:8000/api";

/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

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
   Logged-in provider uses /providers/dashboard/
   directly because the public provider endpoint only
   exposes verified providers.
   ========================================================= */

async function loadProviderProfile() {

    const providerId =
        getProviderId();

    try {

        /* =====================================================
           CASE 1 — PUBLIC PROVIDER PROFILE
           ===================================================== */

        if (providerId) {

            const response =
                await fetch(
                    `${API_BASE}/providers/${providerId}/`
                );

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

await loadProviderReviews(provider.id);

return;
        }

        /* =====================================================
           CASE 2 — LOGGED-IN PROVIDER
           ===================================================== */

        const token =
            localStorage.getItem("access_token");

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

        console.log(
            "LOGGED-IN PROVIDER PROFILE:",
            provider
        );

        /* =====================================================
           RENDER REAL PROVIDER
           ===================================================== */

        renderProviderProfile(provider);

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
   RENDER PROVIDER PROFILE
   ========================================================= */

function renderProviderProfile(provider) {

    const providerName =
        provider.full_name || "Provider";

    const category =
        provider.category_name || "Service Provider";

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

   const servicePrice =
    provider.service_price;

const price =
    servicePrice !== null &&
    servicePrice !== undefined
        ? servicePrice
        : (
            provider.hourly_rate ??
            "0.00"
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

    setText(
        "#providerCategory",
        category
    );

    setText(
        "#floatingCategory",
        category
    );

    setText(
    "#providerService",
    serviceName || category
);

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

    if (pricingValues.length >= 2) {

        pricingValues[1].textContent =
            `Rs. ${price}`;

    }

    setText(
        "#floatingPrice",
        `Rs. ${price}`
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

    if (provider.verified) {

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

    /* =====================================================
       AVAILABILITY
       ===================================================== */

    updateAvailability(
        provider.available
    );
cleanCompletedWorkGallery();
}

/* =========================================================
   COMPLETED WORK
   ========================================================= */

function cleanCompletedWorkGallery() {

    const gallery =
        document.querySelector(
            ".gallery-grid"
        );

    if (!gallery) {
        return;
    }

    gallery.innerHTML = `
        <div class="empty-gallery-state">

            <i class="fa-regular fa-images"></i>

            <h4>
                No completed work photos yet
            </h4>

            <p>
                This provider has not uploaded
                any work photos yet.
            </p>

        </div>
    `;

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
        container.querySelectorAll("i");

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
                group.querySelectorAll("i");

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

async function loadProviderReviews(providerId) {

    try {

        const response = await fetch(
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
                : (reviews.results || []);

        renderReviews(reviewList);

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

function renderReviews(reviews) {

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

function renderReview(review) {

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

function generateReviewStars(rating) {

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

function formatReviewDate(dateString) {

    if (!dateString) {

        return "—";

    }

    const date =
        new Date(dateString);

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
   RENDER SINGLE REVIEW
   ========================================================= */

function renderReview(
    review
) {

    const customerName =
        escapeHtml(
            review.customer_name ||
            "Customer"
        );

    const comment =
        escapeHtml(
            review.comment ||
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

    let html =
        "";

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
        new Date(dateString);

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

    const saveButton =
        document.querySelector(
            "#saveProviderBtn"
        );

    if (!saveButton) {
        return;
    }

    saveButton.addEventListener(
        "click",
        function () {

            const isSaved =
                saveButton.getAttribute(
                    "aria-pressed"
                ) === "true";

            const icon =
                saveButton.querySelector(
                    "i"
                );

            const text =
                saveButton.querySelector(
                    "span"
                );

            if (isSaved) {

                saveButton.setAttribute(
                    "aria-pressed",
                    "false"
                );

                if (icon) {

                    icon.classList.remove(
                        "fa-solid"
                    );

                    icon.classList.add(
                        "fa-regular"
                    );

                }

                if (text) {

                    text.textContent =
                        "Save";

                }

                showToast(
                    "Provider Removed",
                    "Provider removed from your saved list."
                );

            } else {

                saveButton.setAttribute(
                    "aria-pressed",
                    "true"
                );

                if (icon) {

                    icon.classList.remove(
                        "fa-regular"
                    );

                    icon.classList.add(
                        "fa-solid"
                    );

                }

                if (text) {

                    text.textContent =
                        "Saved";

                }

                showToast(
                    "Provider Saved",
                    "Provider has been saved successfully."
                );

            }

        }
    );

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

                        showToast(
                            "Message",
                            "Messaging feature will be connected next."
                        );

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

                showToast(
                    "Message",
                    "Messaging feature will be connected next."
                );

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

    document
        .querySelectorAll(
            ".gallery-item"
        )
        .forEach(
            function (item) {

                item.addEventListener(
                    "click",
                    function () {

                        const image =
                            item.querySelector(
                                "img"
                            );

                        if (!image) {
                            return;
                        }

                        lightboxImage.src =
                            image.src;

                        lightboxImage.alt =
                            image.alt;

                        lightbox.classList.add(
                            "active"
                        );

                        document.body.style.overflow =
                            "hidden";

                    }
                );

            }
        );

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