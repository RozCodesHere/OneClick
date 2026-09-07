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

    const params = new URLSearchParams(window.location.search);

    return params.get("id");

}


/* =========================================================
   SAFE TEXT HELPER
   ========================================================= */

function setText(selector, value) {

    const element = document.querySelector(selector);

    if (element) {
        element.textContent = value ?? "";
    }

}


/* =========================================================
   LOAD PROVIDER PROFILE
   ========================================================= */

async function loadProviderProfile() {

    const providerId = getProviderId();

    if (!providerId) {

        console.error("Provider ID not found in URL.");

        showToast(
            "Error",
            "Provider ID is missing from the URL."
        );

        return;
    }


    try {

        const response = await fetch(
            `${API_BASE}/providers/${providerId}/`
        );


        if (!response.ok) {

            throw new Error(
                `Provider API returned ${response.status}`
            );

        }


        const provider = await response.json();


        console.log(
            "Provider profile data:",
            provider
        );


        renderProviderProfile(provider);

        loadProviderReviews(provider.id);


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

    /* -----------------------------------------------------
       BASIC DATA
       ----------------------------------------------------- */

    const providerName =
        provider.full_name || "Provider";

    const category =
        provider.category_name || "Service Provider";

    const experience =
        provider.experience ?? 0;

    const address =
        provider.address || "Location not available";

    const bio =
        provider.bio ||
        "No description available.";

    const price =
        provider.hourly_rate ?? "0.00";

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


    /* -----------------------------------------------------
       NAME
       ----------------------------------------------------- */

    setText(
        "#providerName",
        providerName
    );

    setText(
        "#floatingProviderName",
        providerName
    );


    /* -----------------------------------------------------
       CATEGORY
       ----------------------------------------------------- */

    setText(
        "#providerCategory",
        category
    );

    setText(
        "#floatingCategory",
        category
    );


    /* -----------------------------------------------------
       EXPERIENCE
       ----------------------------------------------------- */

    setText(
        "#providerExperience",
        `${experience}+`
    );


    /* -----------------------------------------------------
       ADDRESS
       ----------------------------------------------------- */

    setText(
        "#providerAddress",
        address
    );

    setText(
        "#floatingLocation",
        address
    );


    /* -----------------------------------------------------
       BREADCRUMB
       ----------------------------------------------------- */

    setText(
        "#breadcrumbCategory",
        category
    );

    setText(
        "#breadcrumbProvider",
        providerName
    );


    /* -----------------------------------------------------
       ABOUT
       ----------------------------------------------------- */

    setText(
        ".about-text",
        bio
    );


    /* -----------------------------------------------------
       PRICING
       ----------------------------------------------------- */

    const pricingValues =
        document.querySelectorAll(
            ".pricing-value"
        );


    /*
       Your HTML currently has:

       1. Service Charge
       2. Starting Price
       3. Emergency Charge

       We only have hourly_rate from the API,
       so we update Starting Price.
    */

    if (pricingValues.length >= 2) {

        pricingValues[1].textContent =
            `Rs. ${price}`;

    }


    setText(
        "#floatingPrice",
        `Rs. ${price}`
    );


    /* -----------------------------------------------------
       RATING
       ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       REVIEW COUNT
       ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       RATING STARS
       ----------------------------------------------------- */

    updateRatingStars(
        rating,
        "#providerRatingStars"
    );

    updateAllRatingStars(
        rating
    );


    /* -----------------------------------------------------
       PROFILE IMAGE
       ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       VERIFIED STATUS
       ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       AVAILABILITY
       ----------------------------------------------------- */

    updateAvailability(
        provider.available
    );

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

        /* Indicator */

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


        /* Status pill */

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

        /* Indicator */

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


        /* Status pill */

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
        document.querySelector(selector);

    if (!container) {
        return;
    }


    const stars =
        container.querySelectorAll("i");


    stars.forEach(function (star, index) {

        const starNumber = index + 1;

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

    });

}


/* =========================================================
   UPDATE ALL RATING STAR GROUPS
   ========================================================= */

function updateAllRatingStars(rating) {

    const starGroups =
        document.querySelectorAll(
            ".meta-stars"
        );


    starGroups.forEach(function (group) {

        const stars =
            group.querySelectorAll("i");


        stars.forEach(function (star, index) {

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

        });

    });

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


        const data =
            await response.json();


        console.log(
            "Provider reviews:",
            data
        );


        /*
           DRF can return either:

           [
               {...},
               {...}
           ]

           OR:

           {
               count: 1,
               results: [...]
           }
        */

        const reviews =
            Array.isArray(data)
                ? data
                : data.results || [];


        renderReviews(
            reviews
        );


    } catch (error) {

        console.error(
            "Error loading reviews:",
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


    /* -----------------------------------------------------
       NO REVIEWS
       ----------------------------------------------------- */

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
            loadMore.style.display = "none";
        }


        return;

    }


    /* -----------------------------------------------------
       RENDER REAL REVIEWS
       ----------------------------------------------------- */

    reviews.forEach(function (review) {

        container.insertAdjacentHTML(
            "beforeend",
            renderReview(review)
        );

    });


    const loadMore =
        document.querySelector(
            "#loadMoreReviews"
        );

    if (loadMore) {

        /*
           For now we already receive all reviews,
           so Load More is hidden.
        */

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

            <img
                src="https://i.pravatar.cc/50?img=32"
                alt="Customer"
                class="review-avatar"
            >

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


    for (let i = 1; i <= 5; i++) {

        if (rating >= i) {

            html += `
                <i class="fa-solid fa-star"></i>
            `;

        } else if (
            rating >= i - 0.5
        ) {

            html += `
                <i class="fa-solid fa-star-half-stroke"></i>
            `;

        } else {

            html += `
                <i class="fa-regular fa-star"></i>
            `;

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
   HTML ESCAPE
   Prevents unsafe HTML from API data
   ========================================================= */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   ANIMATED COUNTERS
   ========================================================= */

function initAnimatedCounters() {

    const counters =
        document.querySelectorAll(
            ".mini-stat-value"
        );


    counters.forEach(function (counter) {

        /*
           These values are not available
           from the current API yet.

           Keep them as —
        */

        counter.textContent = "—";

    });

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
                    text.textContent = "Save";
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
                    text.textContent = "Saved";
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
        .querySelectorAll(".btn-book-now")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    showToast(
                        "Booking",
                        "Booking feature will be connected next."
                    );

                }
            );

        });


    document
        .querySelectorAll(".btn-message")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    showToast(
                        "Message",
                        "Messaging feature will be connected next."
                    );

                }
            );

        });


    document
        .querySelectorAll(".btn-call")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    showToast(
                        "Call Provider",
                        "Calling feature will be connected next."
                    );

                }
            );

        });

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

                showToast(
                    "Booking",
                    "Booking feature will be connected next."
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

function showToast(title, message) {

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
        toastTitle.textContent = title;
    }


    if (toastText) {
        toastText.textContent = message;
    }


    toast.classList.add(
        "show"
    );


    clearTimeout(
        window.oneClickToastTimer
    );


    window.oneClickToastTimer =
        setTimeout(function () {

            toast.classList.remove(
                "show"
            );

        }, 3000);

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
        .forEach(function (item) {

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
                event.key === "Escape"
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
        .forEach(function (button) {

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

        });

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
        !("IntersectionObserver" in window)
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