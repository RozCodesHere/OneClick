/* =========================================================
   ONECLICK — BOOKING DETAILS
   Dynamic Booking Details from Django REST API
   ========================================================= */

const API_BASE = "http://127.0.0.1:8000/api";

let currentBookingAddress = "";
let googleMapsReady = false;

/* =========================================================
   GOOGLE MAPS INITIALIZATION
   ========================================================= */

window.initializeBookingMap = function(address) {
    if (address !== undefined) {
        currentBookingAddress = String(address || "");
    }

    const mapContainer = document.querySelector("#bookingMap");
    const openMapsButton = document.querySelector("#openGoogleMapsBtn");

    if (!mapContainer) {
        console.error("Booking map container not found.");
        return;
    }

    const bookingAddress = currentBookingAddress.trim();

    if (!bookingAddress) {
        mapContainer.innerHTML = `
            <div class="map-loading">
                <i class="fa-solid fa-circle-info"></i>
                <span>Location is not available.</span>
            </div>
        `;

        if (openMapsButton) {
            openMapsButton.classList.add("disabled");
            openMapsButton.removeAttribute("href");
        }

        return;
    }

    setupGoogleMapsButton(bookingAddress);

    if (!googleMapsReady || typeof google === "undefined" || !google.maps) {
        mapContainer.innerHTML = `
            <div class="map-loading">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Loading map...</span>
            </div>
        `;
        return;
    }

    renderGoogleMap(bookingAddress);
};

/* =========================================================
   GOOGLE MAPS CALLBACK
   ========================================================= */

window.initBookingMap = function() {
    googleMapsReady = true;

    console.log("Google Maps API loaded.");

    if (currentBookingAddress) {
        window.initializeBookingMap(currentBookingAddress);
    }
};

/* =========================================================
   GOOGLE MAPS BUTTON
   ========================================================= */

function setupGoogleMapsButton(address) {
    const button = document.querySelector("#openGoogleMapsBtn");

    if (!button || !address) {
        return;
    }

    const mapAddress = `${address}, Kathmandu, Nepal`;

    const mapsUrl =
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapAddress)}`;

    button.href = mapsUrl;
    button.target = "_blank";
    button.rel = "noopener noreferrer";
    button.classList.remove("disabled");

    button.onclick = function(event) {
        if (button.href && button.href !== "#") {
            return;
        }

        event.preventDefault();
        window.open(mapsUrl, "_blank", "noopener,noreferrer");
    };

    console.log("Google Maps URL:", mapsUrl);
}

/* =========================================================
   RENDER GOOGLE MAP
   ========================================================= */

function renderGoogleMap(address) {
    const mapContainer = document.querySelector("#bookingMap");

    if (!mapContainer) {
        return;
    }

    const mapAddress = `${address}, Kathmandu, Nepal`;

    setupGoogleMapsButton(address);

    const geocoder = new google.maps.Geocoder();

    geocoder.geocode(
        {
            address: mapAddress
        },
        function(results, status) {
            if (
                status !== "OK" ||
                !results ||
                !results.length
            ) {
                console.warn(
                    "Google Maps could not find address:",
                    status,
                    mapAddress
                );

                mapContainer.innerHTML = `
                    <div class="map-loading">
                        <i class="fa-solid fa-location-dot"></i>
                        <span>Map location could not be found.</span>
                    </div>
                `;

                return;
            }

            const location = results[0].geometry.location;

            const map = new google.maps.Map(
                mapContainer,
                {
                    center: location,
                    zoom: 15,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true
                }
            );

            new google.maps.Marker({
                map: map,
                position: location,
                title: mapAddress
            });

            console.log(
                "Google Map loaded:",
                mapAddress
            );
        }
    );
}

/* =========================================================
   PAGE LOAD
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {
        console.log("=================================");
        console.log("ONECLICK BOOKING DETAILS");
        console.log("=================================");

        const accessToken =
            localStorage.getItem("access_token");

        if (!accessToken) {
            console.log("No access token found.");
            window.location.href = "login.html";
            return;
        }

        const urlParams =
            new URLSearchParams(window.location.search);

        const bookingId =
            urlParams.get("id");

        if (!bookingId) {
            console.error(
                "Booking ID is missing from URL."
            );

            alert("Booking ID is missing.");

            window.location.href =
                "customer-dashboard.html";

            return;
        }

        console.log(
            "Loading booking:",
            bookingId
        );

        loadBooking(bookingId);
        setupLogout();
        setupInvoiceButtons();
    }
);

/* =========================================================
   LOAD BOOKING
   ========================================================= */

async function loadBooking(bookingId) {
    const token =
        localStorage.getItem("access_token");

    try {
        const response =
            await fetch(
                `${API_BASE}/bookings/${bookingId}/`,
                {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

        console.log(
            "Booking API status:",
            response.status
        );

        if (response.status === 401) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");

            window.location.href =
                "login.html";

            return;
        }

        if (response.status === 404) {
            alert("Booking not found.");

            window.location.href =
                "customer-dashboard.html";

            return;
        }

        if (!response.ok) {
            throw new Error(
                `Booking request failed: ${response.status}`
            );
        }

        const booking =
            await response.json();

        console.log(
            "REAL BOOKING:",
            booking
        );

        renderBooking(booking);

        currentBookingAddress =
            booking.address || "";

        setupGoogleMapsButton(
            currentBookingAddress
        );

        if (
            typeof window.initializeBookingMap ===
            "function"
        ) {
            window.initializeBookingMap(
                currentBookingAddress
            );
        }

        if (booking.provider) {
            loadProvider(
                booking.provider
            );
        }

        setupCancelBooking(
            booking
        );
    }
    catch (error) {
        console.error(
            "BOOKING LOAD ERROR:",
            error
        );

        alert(
            "Unable to load booking details."
        );
    }
}

/* =========================================================
   RENDER BOOKING
   ========================================================= */

function renderBooking(booking) {
    const formattedBookingId =
        formatBookingId(booking.id);

    /* PAGE HEADER */

    const pageSubtitle =
        document.querySelector(
            ".page-subtitle .fw-600"
        );

    if (pageSubtitle) {
        pageSubtitle.textContent =
            formattedBookingId;
    }

    updateStatus(
        booking.status
    );

    /* BOOKING INFORMATION */

    const bookingInfoValues =
        document.querySelectorAll(
            ".info-block .info-value"
        );

    if (bookingInfoValues[0]) {
        bookingInfoValues[0].textContent =
            formattedBookingId;
    }

    if (bookingInfoValues[1]) {
        bookingInfoValues[1].textContent =
            formatDate(
                booking.booking_date
            );
    }

    if (bookingInfoValues[2]) {
        bookingInfoValues[2].textContent =
            formatTime(
                booking.booking_time
            );
    }

    if (bookingInfoValues[3]) {
        bookingInfoValues[3].innerHTML =
            getStatusHTML(
                booking.status
            );
    }

    /* SERVICE DETAILS */

    const serviceCard =
        document.querySelectorAll(
            ".glass-card"
        )[1];

    if (serviceCard) {
        const serviceValues =
            serviceCard.querySelectorAll(
                ".info-block .info-value"
            );

        if (serviceValues[0]) {
            serviceValues[0].textContent =
                booking.provider_name ||
                "—";
        }

        if (serviceValues[1]) {
            serviceValues[1].textContent =
                booking.service_category ||
                "—";
        }

        if (serviceValues[2]) {
            serviceValues[2].textContent =
                booking.note ||
                "No additional note provided.";
        }

        if (serviceValues[3]) {
            serviceValues[3].textContent =
                "Not specified";
        }

        const chargeRows =
            serviceCard.querySelectorAll(
                ".charge-row"
            );

        if (chargeRows[0]) {
            const value =
                chargeRows[0].querySelector(
                    "span:last-child"
                );

            if (value) {
                value.textContent =
                    "—";
            }
        }

        if (chargeRows[1]) {
            const value =
                chargeRows[1].querySelector(
                    "span:last-child"
                );

            if (value) {
                value.textContent =
                    formatCurrency(
                        booking.service_price
                    );
            }
        }

        if (chargeRows[2]) {
            const value =
                chargeRows[2].querySelector(
                    "span:last-child"
                );

            if (value) {
                value.textContent =
                    "—";
            }
        }

        if (chargeRows[3]) {
            const value =
                chargeRows[3].querySelector(
                    "span:last-child"
                );

            if (value) {
                value.textContent =
                    formatCurrency(
                        booking.total_price
                    );
            }
        }
    }

    /* LOCATION */

    const cards =
        document.querySelectorAll(
            ".glass-card"
        );

    cards.forEach(
        function(card) {
            const title =
                card.querySelector(
                    ".card-title-custom"
                );

            if (!title) {
                return;
            }

            if (
                title.textContent
                    .toLowerCase()
                    .includes("location")
            ) {
                const values =
                    card.querySelectorAll(
                        ".info-block .info-value"
                    );

                if (values[0]) {
                    values[0].textContent =
                        booking.address ||
                        "—";
                }

                if (values[1]) {
                    values[1].textContent =
                        "Not available";
                }
            }
        }
    );

    renderInvoice(
        booking
    );

    renderReviewSection(
        booking
    );

    renderTimeline(
        booking
    );
}

/* =========================================================
   PROVIDER
   ========================================================= */

async function loadProvider(providerId) {
    const token =
        localStorage.getItem(
            "access_token"
        );

    try {
        const response =
            await fetch(
                `${API_BASE}/providers/${providerId}/`,
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

        console.log(
            "Provider API status:",
            response.status
        );

        if (!response.ok) {
            console.warn(
                "Provider could not be loaded."
            );

            return;
        }

        const provider =
            await response.json();

        console.log(
            "REAL PROVIDER:",
            provider
        );

        renderProvider(
            provider
        );
    }
    catch (error) {
        console.error(
            "PROVIDER LOAD ERROR:",
            error
        );
    }
}

/* =========================================================
   RENDER PROVIDER
   ========================================================= */

function renderProvider(provider) {
    const providerAvatar =
        document.querySelector(
            ".provider-avatar"
        );

    if (
        providerAvatar &&
        provider.profile_image
    ) {
        const imageUrl =
            resolveMediaUrl(
                provider.profile_image
            );

        providerAvatar.innerHTML =
            `
            <img
                src="${imageUrl}"
                alt="${escapeHTML(
                    provider.full_name ||
                    "Provider"
                )}"
                style="
                    width:100%;
                    height:100%;
                    object-fit:cover;
                    border-radius:50%;
                "
            >
            `;
    }

    const providerCard =
        providerAvatar
            ? providerAvatar.closest(
                ".glass-card"
            )
            : null;

    if (!providerCard) {
        return;
    }

    const heading =
        providerCard.querySelector(
            "h5.mb-1"
        );

    if (heading) {
        heading.innerHTML =
            escapeHTML(
                provider.full_name ||
                "Provider"
            );

        if (provider.verified) {
            heading.innerHTML +=
                `
                <i
                    class="fa-solid fa-circle-check verified-icon"
                    title="Verified Provider">
                </i>
                `;
        }
    }

    const category =
        providerCard.querySelector(
            "h5.mb-1 + p"
        );

    if (category) {
        category.textContent =
            provider.category_name ||
            "Service Provider";
    }

    const rating =
        Number(
            provider.rating || 0
        );

    renderRatingStars(
        providerCard,
        rating
    );

    const statNumbers =
        providerCard.querySelectorAll(
            ".stat-number"
        );

    if (statNumbers[0]) {
        statNumbers[0].textContent =
            provider.completed_jobs !== undefined
                ? provider.completed_jobs
                : "—";
    }

    if (statNumbers[1]) {
        statNumbers[1].textContent =
            provider.experience !== undefined
                ? `${provider.experience} yrs`
                : "—";
    }
}

/* =========================================================
   PROVIDER RATING STARS
   ========================================================= */

function renderRatingStars(
    providerCard,
    rating
) {
    const ratingContainer =
        providerCard.querySelector(
            ".rating-stars"
        );

    if (!ratingContainer) {
        return;
    }

    ratingContainer.innerHTML = "";

    for (
        let i = 1;
        i <= 5;
        i++
    ) {
        const star =
            document.createElement(
                "i"
            );

        if (rating >= i) {
            star.className =
                "fa-solid fa-star";
        }
        else if (
            rating >= i - 0.5
        ) {
            star.className =
                "fa-solid fa-star-half-stroke";
        }
        else {
            star.className =
                "fa-regular fa-star";
        }

        ratingContainer.appendChild(
            star
        );
    }

    const value =
        document.createElement(
            "span"
        );

    value.className =
        "rating-value";

    value.textContent =
        rating.toFixed(1);

    ratingContainer.appendChild(
        value
    );
}

/* =========================================================
   STATUS
   ========================================================= */

function updateStatus(status) {
    const badge =
        document.querySelector(
            ".status-badge"
        );

    if (!badge) {
        return;
    }

    badge.className =
        "status-badge";

    badge.classList.add(
        `status-${status}`
    );

    let icon =
        "fa-circle-info";

    if (status === "pending") {
        icon =
            "fa-clock";
    }
    else if (
        status === "accepted" ||
        status === "completed"
    ) {
        icon =
            "fa-circle-check";
    }
    else if (
        status === "cancelled" ||
        status === "rejected"
    ) {
        icon =
            "fa-circle-xmark";
    }

    badge.innerHTML =
        `
        <i class="fa-solid ${icon}"></i>
        ${capitalize(status)}
        `;
}

/* =========================================================
   STATUS HTML
   ========================================================= */

function getStatusHTML(status) {
    let icon =
        "fa-circle-info";

    if (status === "pending") {
        icon =
            "fa-clock";
    }
    else if (
        status === "accepted" ||
        status === "completed"
    ) {
        icon =
            "fa-circle-check";
    }
    else if (
        status === "cancelled" ||
        status === "rejected"
    ) {
        icon =
            "fa-circle-xmark";
    }

    return `
        <i class="fa-solid ${icon} me-1"></i>
        ${capitalize(status)}
    `;
}

/* =========================================================
   TIMELINE
   ========================================================= */

function renderTimeline(booking) {
    const timelineItems =
        document.querySelectorAll(
            ".timeline-item"
        );

    if (!timelineItems.length) {
        return;
    }

    timelineItems.forEach(
        function(item) {
            item.classList.remove(
                "done",
                "active",
                "cancelled"
            );

            item.style.opacity =
                "1";
        }
    );

    const status =
        booking.status;

    if (timelineItems[0]) {
        timelineItems[0].classList.add(
            "done"
        );

        const small =
            timelineItems[0].querySelector(
                "small"
            );

        if (small) {
            small.textContent =
                formatCreatedAt(
                    booking.created_at
                );
        }
    }

    if (status === "pending") {
        if (timelineItems[1]) {
            timelineItems[1].classList.add(
                "active"
            );

            const small =
                timelineItems[1].querySelector(
                    "small"
                );

            if (small) {
                small.textContent =
                    "Waiting for provider";
            }
        }

        hideFutureTimelineItems(
            timelineItems,
            2
        );

        return;
    }

    if (status === "accepted") {
        if (timelineItems[1]) {
            timelineItems[1].classList.add(
                "done"
            );

            const small =
                timelineItems[1].querySelector(
                    "small"
                );

            if (small) {
                small.textContent =
                    "Provider accepted";
            }
        }

        if (timelineItems[2]) {
            timelineItems[2].classList.add(
                "active"
            );
        }

        hideFutureTimelineItems(
            timelineItems,
            3
        );

        return;
    }

    if (status === "completed") {
        timelineItems.forEach(
            function(item) {
                item.classList.add(
                    "done"
                );
            }
        );

        return;
    }

    if (
        status === "cancelled" ||
        status === "rejected"
    ) {
        if (timelineItems[1]) {
            timelineItems[1].classList.add(
                "cancelled"
            );

            const title =
                timelineItems[1].querySelector(
                    "h6"
                );

            if (title) {
                title.textContent =
                    status === "cancelled"
                        ? "Booking Cancelled"
                        : "Booking Rejected";
            }

            const small =
                timelineItems[1].querySelector(
                    "small"
                );

            if (small) {
                small.textContent =
                    capitalize(status);
            }
        }

        hideFutureTimelineItems(
            timelineItems,
            2
        );
    }
}

/* =========================================================
   HIDE FUTURE TIMELINE
   ========================================================= */

function hideFutureTimelineItems(
    items,
    startIndex
) {
    for (
        let i = startIndex;
        i < items.length;
        i++
    ) {
        items[i].style.opacity =
            "0.4";
    }
}

/* =========================================================
   INVOICE
   ========================================================= */

function renderInvoice(booking) {
    const invoiceCard =
        findCardByTitle(
            "Invoice Summary"
        );

    if (!invoiceCard) {
        return;
    }

    const invoiceId =
        invoiceCard.querySelector(
            ".invoice-id"
        );

    if (invoiceId) {
        invoiceId.textContent =
            `Invoice #INV-${String(
                booking.id
            ).padStart(5, "0")}`;
    }

    const chargeRows =
        invoiceCard.querySelectorAll(
            ".charge-row"
        );

    if (chargeRows[0]) {
        setChargeValue(
            chargeRows[0],
            "—"
        );
    }

    if (chargeRows[1]) {
        setChargeValue(
            chargeRows[1],
            formatCurrency(
                booking.service_price
            )
        );
    }

    if (chargeRows[2]) {
        setChargeValue(
            chargeRows[2],
            "—"
        );
    }

    if (chargeRows[3]) {
        setChargeValue(
            chargeRows[3],
            "—"
        );
    }

    if (chargeRows[4]) {
        setChargeValue(
            chargeRows[4],
            formatCurrency(
                booking.total_price
            )
        );
    }
}

/* =========================================================
   SET CHARGE VALUE
   ========================================================= */

function setChargeValue(
    row,
    value
) {
    const spans =
        row.querySelectorAll(
            "span"
        );

    if (spans.length >= 2) {
        spans[1].textContent =
            value;
    }
}

/* =========================================================
   REVIEW SECTION
   ========================================================= */

function renderReviewSection(booking) {
    const existingReview =
        document.querySelector(
            "#existingReview"
        );

    const reviewForm =
        document.querySelector(
            "#reviewForm"
        );

    const notCompletedNotice =
        document.querySelector(
            "#notCompletedNotice"
        );

    if (booking.status !== "completed") {
        if (reviewForm) {
            reviewForm.classList.add(
                "d-none"
            );
        }

        if (existingReview) {
            existingReview.classList.add(
                "d-none"
            );
        }

        if (notCompletedNotice) {
            notCompletedNotice.classList.remove(
                "d-none"
            );

            notCompletedNotice.innerHTML =
                `
                <p class="text-muted mb-0">
                    <i class="fa-solid fa-circle-info me-1"></i>
                    You can review after service completion.
                </p>
                `;
        }

        return;
    }

    if (notCompletedNotice) {
        notCompletedNotice.classList.add(
            "d-none"
        );
    }

    if (reviewForm) {
        reviewForm.classList.add(
            "d-none"
        );
    }

    if (existingReview) {
        existingReview.classList.add(
            "d-none"
        );
    }

    loadReviewForBooking(
        booking
    );
}

/* =========================================================
   LOAD REVIEW
   ========================================================= */

async function loadReviewForBooking(
    booking
) {
    const token =
        localStorage.getItem(
            "access_token"
        );

    if (!token) {
        return;
    }

    try {
        const meResponse =
            await fetch(
                `${API_BASE}/users/me/`,
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

        if (meResponse.status === 401) {
            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "refresh_token"
            );

            window.location.href =
                "login.html";

            return;
        }

        if (!meResponse.ok) {
            throw new Error(
                "Unable to load current user."
            );
        }

        const currentUser =
            await meResponse.json();

        console.log(
            "CURRENT USER:",
            currentUser
        );

        const response =
            await fetch(
                `${API_BASE}/reviews/?provider=${booking.provider}`,
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

        console.log(
            "Review GET status:",
            response.status
        );

        if (!response.ok) {
            throw new Error(
                `Review request failed: ${response.status}`
            );
        }

        const reviews =
            await response.json();

        console.log(
            "PROVIDER REVIEWS:",
            reviews
        );

        const existingCustomerReview =
            reviews.find(
                function(review) {
                    return (
                        review.customer_name ===
                        currentUser.email
                    );
                }
            );

        if (existingCustomerReview) {
            console.log(
                "Existing review found:",
                existingCustomerReview
            );

            renderExistingReview(
                existingCustomerReview
            );

            return;
        }

        showReviewForm(
            booking
        );
    }
    catch (error) {
        console.error(
            "LOAD REVIEW ERROR:",
            error
        );

        showReviewForm(
            booking
        );
    }
}

/* =========================================================
   SHOW REVIEW FORM
   ========================================================= */

function showReviewForm(
    booking
) {
    if (booking.status !== "completed") {
        return;
    }

    const existingReview =
        document.querySelector(
            "#existingReview"
        );

    const reviewForm =
        document.querySelector(
            "#reviewForm"
        );

    if (existingReview) {
        existingReview.classList.add(
            "d-none"
        );
    }

    if (reviewForm) {
        reviewForm.classList.remove(
            "d-none"
        );
    }

    setupReviewForm(
        booking
    );
}

/* =========================================================
   RENDER EXISTING REVIEW
   ========================================================= */

function renderExistingReview(
    review
) {
    const existingReview =
        document.querySelector(
            "#existingReview"
        );

    const reviewForm =
        document.querySelector(
            "#reviewForm"
        );

    if (!existingReview) {
        console.warn(
            "Existing review container not found."
        );

        return;
    }

    if (reviewForm) {
        reviewForm.classList.add(
            "d-none"
        );
    }

    existingReview.classList.remove(
        "d-none"
    );

    const rating =
        Number(
            review.rating || 0
        );

    const starsHTML =
        getReviewStarsHTML(
            rating
        );

    existingReview.innerHTML =
        `
        <div class="mb-2">
            <strong>Your Rating</strong>
        </div>

        <div class="mb-3" style="font-size:1.2rem;">
            ${starsHTML}

            <span class="ms-2 fw-semibold">
                ${rating.toFixed(1)}
            </span>
        </div>

        ${
            review.comment
                ? `
                    <div class="mb-2">
                        <strong>Your Review</strong>
                    </div>

                    <p class="text-muted mb-2">
                        ${escapeHTML(
                            review.comment
                        )}
                    </p>
                `
                : `
                    <p class="text-muted mb-2">
                        You did not leave a written comment.
                    </p>
                `
        }

        <small class="text-muted">
            Reviewed on
            ${formatReviewDate(
                review.created_at
            )}
        </small>
        `;

    console.log(
        "Existing review rendered."
    );
}

/* =========================================================
   REVIEW STAR HTML
   ========================================================= */

function getReviewStarsHTML(
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
        }
        else {
            html +=
                `<i class="fa-regular fa-star"></i>`;
        }
    }

    return html;
}

/* =========================================================
   REVIEW FORM
   ========================================================= */

function setupReviewForm(
    booking
) {
    if (booking.status !== "completed") {
        return;
    }

    const reviewForm =
        document.querySelector(
            "#reviewForm"
        );

    const starInput =
        document.querySelector(
            "#starInput"
        );

    const reviewText =
        document.querySelector(
            "#reviewText"
        );

    const submitButton =
        document.querySelector(
            "#submitReviewBtn"
        );

    if (!reviewForm) {
        console.warn(
            "Review form not found."
        );

        return;
    }

    if (!submitButton) {
        console.warn(
            "Submit review button not found."
        );

        return;
    }

    if (
        submitButton.dataset.reviewInitialized ===
        "true"
    ) {
        return;
    }

    submitButton.dataset.reviewInitialized =
        "true";

    let stars = [];

    if (starInput) {
        stars =
            Array.from(
                starInput.querySelectorAll(
                    "[data-value]"
                )
            );

        if (!stars.length) {
            stars =
                Array.from(
                    starInput.querySelectorAll(
                        "[data-rating]"
                    )
                );
        }

        if (!stars.length) {
            stars =
                Array.from(
                    starInput.querySelectorAll(
                        "input[type='radio']"
                    )
                );
        }

        if (!stars.length) {
            stars =
                Array.from(
                    starInput.querySelectorAll(
                        "button, i"
                    )
                );
        }
    }

    let selectedRating = 5;

    stars.forEach(
        function(star, index) {
            star.style.cursor =
                "pointer";

            star.addEventListener(
                "click",
                function() {
                    let rating;

                    if (
                        star.dataset &&
                        star.dataset.value
                    ) {
                        rating =
                            Number(
                                star.dataset.value
                            );
                    }
                    else if (
                        star.dataset &&
                        star.dataset.rating
                    ) {
                        rating =
                            Number(
                                star.dataset.rating
                            );
                    }
                    else if (
                        star.value
                    ) {
                        rating =
                            Number(
                                star.value
                            );
                    }
                    else {
                        rating =
                            index + 1;
                    }

                    if (
                        rating >= 1 &&
                        rating <= 5
                    ) {
                        selectedRating =
                            rating;

                        updateSelectedStars(
                            stars,
                            selectedRating
                        );
                    }
                }
            );
        }
    );

    updateSelectedStars(
        stars,
        selectedRating
    );

    submitButton.addEventListener(
        "click",
        async function() {
            const token =
                localStorage.getItem(
                    "access_token"
                );

            if (!token) {
                window.location.href =
                    "login.html";

                return;
            }

            const comment =
                reviewText
                    ? reviewText.value.trim()
                    : "";

            if (
                selectedRating < 1 ||
                selectedRating > 5
            ) {
                alert(
                    "Please select a rating from 1 to 5 stars."
                );

                return;
            }

            submitButton.disabled =
                true;

            submitButton.innerHTML =
                `
                <i class="fa-solid fa-spinner fa-spin me-1"></i>
                Submitting...
                `;

            try {
                const response =
                    await fetch(
                        `${API_BASE}/reviews/`,
                        {
                            method: "POST",
                            headers: {
                                "Authorization":
                                    `Bearer ${token}`,
                                "Content-Type":
                                    "application/json"
                            },
                            body:
                                JSON.stringify({
                                    provider:
                                        booking.provider,
                                    rating:
                                        selectedRating,
                                    comment:
                                        comment
                                })
                        }
                    );

                const data =
                    await response.json();

                console.log(
                    "REVIEW RESPONSE:",
                    response.status,
                    data
                );

                if (
                    response.status === 401
                ) {
                    localStorage.removeItem(
                        "access_token"
                    );

                    localStorage.removeItem(
                        "refresh_token"
                    );

                    window.location.href =
                        "login.html";

                    return;
                }

                if (!response.ok) {
                    const errorMessage =
                        getReviewErrorMessage(
                            data
                        );

                    alert(
                        errorMessage
                    );

                    return;
                }

                console.log(
                    "Review submitted:",
                    data
                );

                alert(
                    "Review submitted successfully!"
                );

                renderExistingReview(
                    data
                );

                if (reviewText) {
                    reviewText.value =
                        "";
                }
            }
            catch (error) {
                console.error(
                    "REVIEW ERROR:",
                    error
                );

                alert(
                    "Something went wrong while submitting your review."
                );
            }
            finally {
                submitButton.disabled =
                    false;

                submitButton.innerHTML =
                    `
                    <i class="fa-solid fa-paper-plane me-1"></i>
                    Submit Review
                    `;
            }
        }
    );
}

/* =========================================================
   REVIEW ERROR MESSAGE
   ========================================================= */

function getReviewErrorMessage(
    data
) {
    if (!data) {
        return "Unable to submit review.";
    }

    if (data.error) {
        return data.error;
    }

    if (data.detail) {
        return data.detail;
    }

    if (data.rating) {
        return Array.isArray(
            data.rating
        )
            ? data.rating[0]
            : data.rating;
    }

    if (data.provider) {
        return Array.isArray(
            data.provider
        )
            ? data.provider[0]
            : data.provider;
    }

    if (data.non_field_errors) {
        return Array.isArray(
            data.non_field_errors
        )
            ? data.non_field_errors[0]
            : data.non_field_errors;
    }

    return "Unable to submit review.";
}

/* =========================================================
   UPDATE REVIEW STARS
   ========================================================= */

function updateSelectedStars(
    stars,
    rating
) {
    stars.forEach(
        function(star, index) {
            const starRating =
                star.dataset && star.dataset.value
                    ? Number(star.dataset.value)
                    : star.dataset && star.dataset.rating
                        ? Number(star.dataset.rating)
                        : star.value
                            ? Number(star.value)
                            : index + 1;

            if (
                star.tagName === "I" ||
                star.tagName === "BUTTON"
            ) {
                if (
                    starRating <= rating
                ) {
                    star.classList.remove(
                        "fa-regular"
                    );

                    star.classList.add(
                        "fa-solid"
                    );
                }
                else {
                    star.classList.remove(
                        "fa-solid"
                    );

                    star.classList.add(
                        "fa-regular"
                    );
                }
            }

            if (
                star.type === "radio"
            ) {
                star.checked =
                    starRating === rating;
            }
        }
    );
}

/* =========================================================
   REVIEW DATE
   ========================================================= */

function formatReviewDate(
    value
) {
    if (!value) {
        return "Unknown date";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Unknown date";
    }

    return date.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );
}

/* =========================================================
   CANCEL BOOKING
   ========================================================= */

function setupCancelBooking(
    booking
) {
    if (
        booking.status !== "pending" &&
        booking.status !== "accepted"
    ) {
        return;
    }

    const bottomActions =
        document.querySelector(
            ".bottom-actions"
        );

    if (!bottomActions) {
        return;
    }

    if (
        document.querySelector(
            "#cancelBookingBtn"
        )
    ) {
        return;
    }

    const button =
        document.createElement(
            "button"
        );

    button.type =
        "button";

    button.id =
        "cancelBookingBtn";

    button.className =
        "btn btn-outline-danger px-4";

    button.innerHTML =
        `
        <i class="fa-solid fa-xmark me-1"></i>
        Cancel Booking
        `;

    button.addEventListener(
        "click",
        function() {
            cancelBooking(
                booking.id
            );
        }
    );

    bottomActions.appendChild(
        button
    );
}

/* =========================================================
   CANCEL BOOKING API
   ========================================================= */

async function cancelBooking(
    bookingId
) {
    const confirmed =
        confirm(
            "Are you sure you want to cancel this booking?"
        );

    if (!confirmed) {
        return;
    }

    const token =
        localStorage.getItem(
            "access_token"
        );

    try {
        const response =
            await fetch(
                `${API_BASE}/bookings/${bookingId}/`,
                {
                    method: "PATCH",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`,
                        "Content-Type":
                            "application/json"
                    },
                    body:
                        JSON.stringify({
                            status:
                                "cancelled"
                        })
                }
            );

        const data =
            await response.json();

        console.log(
            "Cancel response:",
            data
        );

        if (response.status === 401) {
            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "refresh_token"
            );

            window.location.href =
                "login.html";

            return;
        }

        if (!response.ok) {
            alert(
                data.error ||
                data.detail ||
                "Unable to cancel booking."
            );

            return;
        }

        alert(
            "Booking cancelled successfully."
        );

        window.location.reload();
    }
    catch (error) {
        console.error(
            "CANCEL ERROR:",
            error
        );

        alert(
            "Something went wrong while cancelling the booking."
        );
    }
}

/* =========================================================
   INVOICE BUTTONS
   ========================================================= */

function setupInvoiceButtons() {
    const downloadButton =
        document.querySelector(
            "#downloadInvoiceBtn"
        );

    if (downloadButton) {
        downloadButton.addEventListener(
            "click",
            function() {
                alert(
                    "Invoice download will be connected after the invoice system is implemented."
                );
            }
        );
    }

    const printButton =
        document.querySelector(
            "#printInvoiceBtn"
        );

    if (printButton) {
        printButton.addEventListener(
            "click",
            function() {
                window.print();
            }
        );
    }
}

/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogout() {
    const logoutButton =
        document.querySelector(
            ".btn-logout"
        );

    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener(
        "click",
        function(event) {
            event.preventDefault();

            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "refresh_token"
            );

            window.location.href =
                "login.html";
        }
    );
}

/* =========================================================
   FIND CARD BY TITLE
   ========================================================= */

function findCardByTitle(
    titleText
) {
    const cards =
        document.querySelectorAll(
            ".glass-card"
        );

    for (
        const card of cards
    ) {
        const title =
            card.querySelector(
                ".card-title-custom"
            );

        if (
            title &&
            title.textContent
                .toLowerCase()
                .includes(
                    titleText.toLowerCase()
                )
        ) {
            return card;
        }
    }

    return null;
}

/* =========================================================
   FORMAT BOOKING ID
   ========================================================= */

function formatBookingId(
    id
) {
    return `#OC-${String(
        id
    ).padStart(5, "0")}`;
}

/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDate(
    dateString
) {
    if (!dateString) {
        return "—";
    }

    const date =
        new Date(
            `${dateString}T00:00:00`
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return dateString;
    }

    return date.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );
}

/* =========================================================
   FORMAT TIME
   ========================================================= */

function formatTime(
    timeString
) {
    if (!timeString) {
        return "—";
    }

    const parts =
        timeString.split(":");

    if (
        parts.length < 2
    ) {
        return timeString;
    }

    let hours =
        Number(parts[0]);

    const minutes =
        parts[1];

    const period =
        hours >= 12
            ? "PM"
            : "AM";

    hours =
        hours % 12 || 12;

    return `${hours}:${minutes} ${period}`;
}

/* =========================================================
   FORMAT CURRENCY
   ========================================================= */

function formatCurrency(
    value
) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    const number =
        Number(value);

    if (
        Number.isNaN(number)
    ) {
        return "—";
    }

    return `Rs. ${number.toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    )}`;
}

/* =========================================================
   FORMAT CREATED AT
   ========================================================= */

function formatCreatedAt(
    value
) {
    if (!value) {
        return "Booking requested";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Booking requested";
    }

    return date.toLocaleString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );
}

/* =========================================================
   RESOLVE MEDIA URL
   ========================================================= */

function resolveMediaUrl(
    url
) {
    if (!url) {
        return "";
    }

    if (
        url.startsWith("http://") ||
        url.startsWith("https://")
    ) {
        return url;
    }

    return `http://127.0.0.1:8000${url.replace(/^\/+/, "/")}`;
}

/* =========================================================
   CAPITALIZE
   ========================================================= */

function capitalize(
    value
) {
    if (!value) {
        return "Unknown";
    }

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );
}

/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(
    value
) {
    return String(
        value || ""
    )
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