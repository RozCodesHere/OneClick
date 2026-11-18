/* =========================================================
   ONECLICK — BOOKING PAGE
   Connects customer booking form with Django REST API
   ========================================================= */

const API_BASE = "https://oneclick-backend-6hk7.onrender.com/api";

let isExistingBooking = false;
let selectedProviderServicePrice = null;
let providerServices = [];

let selectedQuotation = null;
let quotationBookingMode = false;

/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("access_token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    setMinimumDate();
    setupBookingForm();
    setupProviderContactActions();
    loadBookingPage();
});

/* =========================================================
   GET PROVIDER ID
   ========================================================= */

function getProviderId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("provider_id");
}

/* =========================================================
   GET SERVICE ID
   ========================================================= */

function getServiceId() {
    const params = new URLSearchParams(window.location.search);
    const serviceId = params.get("service_id");

    if (!serviceId || !/^\d+$/.test(serviceId)) {
        return null;
    }

    return serviceId;
}

/* =========================================================
   AUTH HEADERS
   ========================================================= */

function getHeaders() {
    const token = localStorage.getItem("access_token");

    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    };
}

/* =========================================================
   LOAD BOOKING PAGE
   ========================================================= */

async function loadBookingPage() {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get("booking_id");
    const quotationId = params.get("quotation_id");

    // Existing booking: display saved details without resubmitting.
    if (bookingId && /^\d+$/.test(bookingId)) {
        isExistingBooking = true;
        await loadExistingBooking(bookingId);
        return;
    }

    // Accepted quotation: prepare a new booking.
    if (quotationId && /^\d+$/.test(quotationId)) {
        quotationBookingMode = true;
        await loadQuotationForBooking(quotationId);
        return;
    }

    // Existing direct-booking flow.
const providerId = getProviderId();

// Read the service request location passed from the dashboard.
const addressFromRequest = params.get("address");
const latitudeFromRequest = Number(params.get("latitude"));
const longitudeFromRequest = Number(params.get("longitude"));
const dateFromRequest = params.get("date");
const timeFromRequest = params.get("time");

const dateInput = document.getElementById("bookingDate");
const timeInput = document.getElementById("bookingTime");

if (dateInput && dateFromRequest) {
    dateInput.value = dateFromRequest;
}

if (timeInput && timeFromRequest) {
    timeInput.value = timeFromRequest.slice(0, 5);
}
const addressInput = document.getElementById("address");
const latitudeInput = document.getElementById("customerLatitude");
const longitudeInput = document.getElementById("customerLongitude");

// Prefill the address.
if (addressInput && addressFromRequest) {
    addressInput.value = addressFromRequest;
}

// Prefill coordinates only when they are valid locations in Nepal.
const validRequestLocation =
    params.has("latitude") &&
    params.has("longitude") &&
    Number.isFinite(latitudeFromRequest) &&
    Number.isFinite(longitudeFromRequest) &&
    latitudeFromRequest >= 26.347 &&
    latitudeFromRequest <= 30.447 &&
    longitudeFromRequest >= 80.058 &&
    longitudeFromRequest <= 88.201;

if (validRequestLocation) {
    if (latitudeInput) {
        latitudeInput.value = latitudeFromRequest;
    }

    if (longitudeInput) {
        longitudeInput.value = longitudeFromRequest;
    }
}

if (!providerId || !/^\d+$/.test(providerId)) {
    showError("Provider information is missing.");
    return;
}

await loadProvider(providerId);

    if (!providerId || !/^\d+$/.test(providerId)) {
        showError("Provider information is missing.");
        return;
    }

    await loadProvider(providerId);
}

/* =========================================================
   LOAD ACCEPTED QUOTATION
   ========================================================= */

async function loadQuotationForBooking(quotationId) {
    try {
        const response = await fetch(
            `${API_BASE}/services/quotations/`,
            {
                method: "GET",
                headers: getHeaders()
            }
        );

        // Read the response body only once.
        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.detail ||
                result.error ||
                "Unable to load quotations."
            );
        }

        // Support common API response formats.
        let quotations = null;

        if (Array.isArray(result)) {
            quotations = result;
        } else if (Array.isArray(result.results)) {
            quotations = result.results;
        } else if (Array.isArray(result.data)) {
            quotations = result.data;
        } else if (Array.isArray(result.quotations)) {
            quotations = result.quotations;
        } else if (result.data && Array.isArray(result.data.results)) {
            quotations = result.data.results;
        } else if (
            result.quotations &&
            Array.isArray(result.quotations.results)
        ) {
            quotations = result.quotations.results;
        }

        if (!quotations) {
            console.error("Actual quotations API response:", result);

            throw new Error(
                "Could not read quotations. Check the Console for the API response."
            );
        }

        const quotation = quotations.find(
            item => String(item.id) === String(quotationId)
        );

        if (!quotation) {
            throw new Error(
                "Quotation not found. Please return to your dashboard."
            );
        }

        if (String(quotation.status).toLowerCase() !== "accepted") {
            throw new Error(
                "Please accept this quotation before booking."
            );
        }

        selectedQuotation = quotation;

        const providerId = quotation.provider;
        const serviceId = quotation.request_service_id;

        if (!providerId || !serviceId) {
            console.error("Quotation is missing provider/service data:", quotation);

            throw new Error(
                "The quotation is missing provider or service information."
            );
        }

        // Load provider and the provider's available services.
        await loadProvider(String(providerId));

        const serviceSelect = document.getElementById("service");

        if (!serviceSelect || serviceSelect.disabled && !serviceSelect.value) {
            throw new Error("The service selector could not be loaded.");
        }

        // Select the service included in the quotation.
        serviceSelect.value = String(serviceId);

        if (serviceSelect.value !== String(serviceId)) {
            throw new Error(
                "The quoted service was not found among this provider's services."
            );
        }

        serviceSelect.disabled = true;
        updateSelectedService();

        // Show the agreed quotation price, not the normal service price.
      const quotationRow = document.getElementById("quotationPriceRow");
const finalQuotedPrice = document.getElementById("finalQuotedPrice");

if (quotationRow && finalQuotedPrice) {
    quotationRow.hidden = false;
    finalQuotedPrice.textContent =
        `Rs. ${Number(quotation.price).toFixed(2)}`;
}

        // Prefill the original service request.
        const dateInput = document.getElementById("bookingDate");

        if (dateInput && quotation.request_preferred_date) {
            dateInput.value = quotation.request_preferred_date;
        }

        const timeInput = document.getElementById("bookingTime");

        if (timeInput && quotation.request_preferred_time) {
            timeInput.value =
                quotation.request_preferred_time.slice(0, 5);
        }

        const addressInput = document.getElementById("address");

        if (addressInput) {
            addressInput.value = quotation.request_address || "";
        }

        // Restore the original service request coordinates.
const requestResponse = await fetch(
    `${API_BASE}/services/requests/`,
    {
        method: "GET",
        headers: getHeaders()
    }
);

const requestResult = await requestResponse.json();

if (!requestResponse.ok) {
    throw new Error("Unable to load the original service request location.");
}

let requests = [];

if (Array.isArray(requestResult)) {
    requests = requestResult;
} else if (Array.isArray(requestResult.results)) {
    requests = requestResult.results;
} else if (Array.isArray(requestResult.data)) {
    requests = requestResult.data;
}

const originalRequest = requests.find(
    item => String(item.id) === String(quotation.request)
);

if (!originalRequest) {
    throw new Error("Original service request not found.");
}

const latitudeInput = document.getElementById("customerLatitude");
const longitudeInput = document.getElementById("customerLongitude");

if (
    latitudeInput &&
    longitudeInput &&
    originalRequest.latitude != null &&
    originalRequest.longitude != null
) {
    latitudeInput.value = originalRequest.latitude;
    longitudeInput.value = originalRequest.longitude;
} else {
    throw new Error("The original service request has no saved map coordinates. Please select the location again.");
}


        const noteInput = document.getElementById("note");

        if (noteInput) {
            noteInput.value = quotation.request_description || "";
        }

        // This is a new booking; confirmation must remain available.
        isExistingBooking = false;

        const submitButton = document.getElementById("submitBooking");

        if (submitButton) {
            submitButton.hidden = false;
            submitButton.disabled = false;
            submitButton.innerHTML =
                '<i class="fa-solid fa-calendar-check"></i> Confirm Booking';
        }

        console.log("Accepted quotation loaded:", quotation);

    } catch (error) {
        console.error("Quotation booking error:", error);
        showError(error.message || "Unable to load quotation details.");
    }
}

/* =========================================================
   LOAD EXISTING BOOKING
   ========================================================= */

async function loadExistingBooking(bookingId) {
    try {
        const response = await fetch(
            `${API_BASE}/bookings/${bookingId}/`,
            {
                method: "GET",
                headers: getHeaders()
            }
        );

        const booking = await response.json();

        if (!response.ok) {
            throw new Error(
                booking.detail ||
                booking.error ||
                "Unable to load booking details."
            );
        }

        await loadProvider(String(booking.provider));

        const serviceSelect = document.getElementById("service");

        if (serviceSelect && booking.service != null) {
            serviceSelect.value = String(booking.service);
            serviceSelect.disabled = true;
        }

        const dateInput = document.getElementById("bookingDate");

        if (dateInput && booking.booking_date) {
            dateInput.value = booking.booking_date;
            dateInput.disabled = true;
        }

        const timeInput = document.getElementById("bookingTime");

        if (timeInput && booking.booking_time) {
            timeInput.value = booking.booking_time.slice(0, 5);
            timeInput.disabled = true;
        }

        const addressInput = document.getElementById("address");

        if (addressInput) {
            addressInput.value = booking.address || "";
            addressInput.readOnly = true;
        }

        const noteInput = document.getElementById("note");

        if (noteInput) {
            noteInput.value = booking.note || "";
            noteInput.readOnly = true;
        }

        const estimatedPrice = document.querySelector(
            "#pricePreview strong"
        );

        if (estimatedPrice) {
            estimatedPrice.textContent =
                `Rs. ${Number(booking.total_price || 0).toFixed(2)}`;
        }

        const submitButton = document.getElementById("submitBooking");

        if (submitButton) {
            submitButton.hidden = true;
        }

        const availabilityElement =
            document.getElementById("availabilityMessage");

        if (availabilityElement) {
            availabilityElement.hidden = true;
        }

        isExistingBooking = true;

        console.log("Saved booking loaded:", booking);

    } catch (error) {
        console.error("Saved booking error:", error);
        showError(error.message || "Unable to load saved booking.");
    }
}

/* =========================================================
   RENDER PROVIDER
   ========================================================= */

function renderProvider(provider) {
    const name = provider.full_name || "Provider";
    const category = provider.category_name || "Service Provider";
    const image = provider.profile_image ||
        "https://i.pravatar.cc/100?img=15";

    const providerImage = document.getElementById("providerImage");
    const providerName = document.getElementById("providerName");
    const providerCategory = document.getElementById("providerCategory");
    const providerStatus = document.getElementById("providerStatus");

    if (providerImage) {
        providerImage.src = image;
        providerImage.alt = `${name} profile photo`;
    }

    if (providerName) {
        providerName.textContent = name;
    }

    if (providerCategory) {
        providerCategory.textContent = category;
    }

    if (providerStatus) {
        providerStatus.innerHTML = provider.available
            ? '<i class="fa-solid fa-circle"></i> Available Now'
            : '<i class="fa-solid fa-circle"></i> Currently Unavailable';

        providerStatus.style.color =
            provider.available ? "#16a34a" : "#dc2626";
    }

    // Provider address
    const addressElement = document.getElementById("providerAddress");

    if (addressElement) {
        addressElement.textContent = [
            provider.address,
            provider.city,
            provider.district,
            provider.province,
            provider.country
        ].filter(Boolean).join(", ") || "Location not provided";
    }

    // Provider description
    const descriptionElement =
        document.getElementById("providerDescription");

    if (descriptionElement) {
        descriptionElement.textContent =
            provider.bio || "No provider description available.";
    }

        // Work gallery
    const gallery = document.getElementById("providerWorkGallery");

    if (gallery) {
        const photos = provider.work_photos || [];

        if (photos.length === 0) {
            gallery.innerHTML = `
                <p class="text-muted">
                    No work photos uploaded yet.
                </p>
            `;
        } else {
            gallery.innerHTML = "";

            photos.forEach(photo => {
                const card = document.createElement("div");
                card.className = "provider-work-photo-card";

                const img = document.createElement("img");
                img.src = photo.image;
                img.alt = photo.caption || "Provider work photo";
                img.loading = "lazy";

                const caption = document.createElement("p");
                caption.textContent = photo.caption || "";

                card.appendChild(img);
                card.appendChild(caption);
                gallery.appendChild(card);
            });
              }
    }
    // View full provider profile
const viewProfileBtn = document.getElementById("viewProviderProfileBtn");

if (viewProfileBtn) {
    viewProfileBtn.href = `provider-profile.html?id=${provider.id}`;
}
}

/* =========================================================
   LOAD PROVIDER
   ========================================================= */
async function loadProvider(providerId) {
    try {
        const response = await fetch(
            `${API_BASE}/providers/${providerId}/`,
            {
                method: "GET",
                headers: getHeaders()
            }
        );

        const provider = await response.json();

        if (!response.ok) {
            throw new Error(
                provider.detail ||
                provider.error ||
                "Unable to load provider details."
            );
        }

        renderProvider(provider);

        const services =
            provider.services ||
            provider.provider_services ||
            [];

        providerServices = services;
        renderServices(services);

        const loadingElement = document.getElementById("providerLoading");

        if (loadingElement) {
            loadingElement.hidden = true;
        }

        console.log("Provider loaded:", provider);
        console.log("Provider services:", services);

    } catch (error) {
        console.error("Load provider error:", error);
        showError(error.message || "Unable to load provider.");
    }
}


/* =========================================================
   RENDER PROVIDER SERVICES
   ========================================================= */

function renderServices(services) {
    const serviceSelect = document.getElementById("service");

    if (!serviceSelect) {
        return;
    }

    selectedProviderServicePrice = null;

    serviceSelect.innerHTML = `
        <option value="">Select a service</option>
    `;

    if (!Array.isArray(services) || services.length === 0) {
        serviceSelect.innerHTML = `
            <option value="">No service available</option>
        `;

        serviceSelect.disabled = true;
        updateSelectedService();
        console.warn("Provider has no active services.");
        return;
    }

   services.forEach(function (service) {
    const option = document.createElement("option");

   option.value = String(service.id);
option.textContent = service.name;

// Store the provider's actual listed price and pricing type.
option.dataset.price = service.price ?? "0.00";
option.dataset.priceType = service.price_type || "fixed";

option.dataset.description =
    "Professional service available on OneClick.";

    serviceSelect.appendChild(option);
});

    const serviceId = getServiceId();

    if (serviceId) {
        const matchingService = services.find(
            service => String(service.id) === String(serviceId)
        );

       if (matchingService) {
    serviceSelect.value = String(matchingService.id);
    selectedProviderServicePrice = matchingService.price;
    serviceSelect.disabled = false;
    updateSelectedService();

    console.log("Preselected provider service:", matchingService);
} else {
            console.warn(
                "Requested service does not belong to this provider."
            );

            serviceSelect.value = "";
            serviceSelect.disabled = false;
            updateSelectedService();
        }
    } else {
        serviceSelect.disabled = false;
        serviceSelect.value = "";
        updateSelectedService();
    }

    serviceSelect.onchange = function () {
        selectedProviderServicePrice = null;
        updateSelectedService();
    };
}


/* =========================================================
   UPDATE SELECTED SERVICE
   ========================================================= */

function updateSelectedService() {
    const select = document.getElementById("service");
    const description = document.getElementById("serviceDescription");

    const estimatedPrice = document.getElementById("estimatedPrice");
    const quotationRow = document.getElementById("quotationPriceRow");
    const finalQuotedPrice = document.getElementById("finalQuotedPrice");

    if (!select) {
        return;
    }

    const option = select.options[select.selectedIndex];

    // No service selected
    if (!option || !option.value) {
        selectedProviderServicePrice = null;

        if (description) {
            description.textContent = "Select a service to see details.";
        }

        if (estimatedPrice && !isExistingBooking) {
            estimatedPrice.textContent = "Rs. 0.00";
        }

        if (quotationRow) {
            quotationRow.hidden = true;
        }

        return;
    }

    // Get provider's listed service price
    const price = Number(option.dataset.price);

    selectedProviderServicePrice = Number.isFinite(price)
        ? price
        : 0;

    if (description) {
        description.textContent =
            option.dataset.description ||
            "Professional service available on OneClick.";
    }

   // Display negotiated or fixed service pricing.
if (estimatedPrice && !isExistingBooking) {

    const priceType = option.dataset.priceType || "fixed";

    if (priceType === "negotiable") {

        estimatedPrice.textContent =
            "Negotiable – Final price after inspection";

    } else {

        estimatedPrice.textContent =
            `Rs. ${selectedProviderServicePrice.toFixed(2)}`;
    }
}

    // Display final quotation price only for quotation bookings
    if (quotationRow && finalQuotedPrice) {
        quotationRow.hidden = !quotationBookingMode;

        if (quotationBookingMode && selectedQuotation) {
            finalQuotedPrice.textContent =
                `Rs. ${Number(selectedQuotation.price).toFixed(2)}`;
        }
    }

    console.log("Selected service:", option.value);
    console.log("Selected service price:", selectedProviderServicePrice);
}

/* =========================================================
   MINIMUM DATE
   ========================================================= */

function setMinimumDate() {
    const dateInput = document.getElementById("bookingDate");

    if (!dateInput) {
        return;
    }

    // Get today's date using the user's local timezone.
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const todayString = `${year}-${month}-${day}`;

    // Prevent selecting dates before today.
    dateInput.setAttribute("min", todayString);

    // Clear an already-selected past date.
    if (dateInput.value && dateInput.value < todayString) {
        dateInput.value = "";
    }
}

/* =========================================================
   BOOKING FORM
   ========================================================= */

function setupBookingForm() {
    const form = document.getElementById("bookingForm");

    if (!form) {
        return;
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        await submitBooking();
    });
}

/* =========================================================
   SUBMIT BOOKING
   ========================================================= */

async function submitBooking() {
    if (isExistingBooking) {
        return;
    }

    const providerId =
        quotationBookingMode && selectedQuotation
            ? selectedQuotation.provider
            : getProviderId();

    const service = document.getElementById("service");
    const bookingDate = document.getElementById("bookingDate");
    const bookingTime = document.getElementById("bookingTime");
    const address = document.getElementById("address");
    const note = document.getElementById("note");
    const submitButton = document.getElementById("submitBooking");

    if (!providerId) {
        showError("Provider information is missing.");
        return;
    }

    if (!service || !service.value) {
        showError("Please select a service.");
        return;
    }

    if (!bookingDate || !bookingDate.value) {
        showError("Please select a booking date.");
        return;
    }

    // Refresh the minimum date before validating.
setMinimumDate();

// Get today's local calendar date.
const today = new Date();

const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, "0");
const day = String(today.getDate()).padStart(2, "0");

const todayString = `${year}-${month}-${day}`;

// Reject past dates.
if (bookingDate.value < todayString) {
    showError("Past dates are not allowed. Please select today or a future date.");
    bookingDate.value = "";
    return;
}


    if (!bookingTime || !bookingTime.value) {
        showError("Please select a booking time.");
        return;
    }

    if (!address || !address.value.trim()) {
        showError("Please enter the service address.");
        return;
    }

    // Ensure the customer hasn't changed the quoted service.
    if (
        quotationBookingMode &&
        selectedQuotation &&
        String(service.value) !== String(selectedQuotation.request_service_id)
    ) {
        showError("The selected service does not match the accepted quotation.");
        return;
    }

    hideError();

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Creating Booking...
        `;
    }

    try {
        // Use the location selected by the customer on the map.
const selectedLatitude = document.getElementById("customerLatitude");
const selectedLongitude = document.getElementById("customerLongitude");

const latitude = selectedLatitude?.value
    ? Number(selectedLatitude.value)
    : null;

const longitude = selectedLongitude?.value
    ? Number(selectedLongitude.value)
    : null;

    // Make sure the selected coordinates are inside Nepal.
if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < 26.347 ||
    latitude > 30.447 ||
    longitude < 80.058 ||
    longitude > 88.201
) {
    showError("Please select your service location on the Nepal map.");

    if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = `
            <i class="fa-solid fa-calendar-check"></i>
            Confirm Booking
        `;
    }

    return;
}

    console.log("ADDRESS:", address.value);
console.log("LATITUDE SENT:", latitude);
console.log("LONGITUDE SENT:", longitude);

        const bookingData = {
            provider: Number(providerId),
            service: Number(service.value),
            booking_date: bookingDate.value,
            booking_time: bookingTime.value,
            address: address.value.trim(),
           latitude: latitude,
           longitude: longitude,
            note: note ? note.value.trim() : ""
        };

        /*
         * Include the accepted price for the frontend request.
         * The backend should verify/enforce the quotation price
         * instead of trusting a client-supplied price.
         */
        if (quotationBookingMode && selectedQuotation) {
    bookingData.quotation_id = Number(selectedQuotation.id);
}

        const response = await fetch(`${API_BASE}/bookings/`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(bookingData)
        });

        const data = await response.json();

        console.log("Booking response:", data);

        if (!response.ok) {
            console.error("Booking API error:", data);

            let message = "Unable to create booking.";

            if (data.detail) {
                message = data.detail;
            } else if (typeof data === "object" && data !== null) {
                const firstError = Object.values(data)[0];

                if (Array.isArray(firstError)) {
                    message = String(firstError[0]);
                } else if (firstError) {
                    message = String(firstError);
                }
            }

            throw new Error(message);
        }

        console.log("Booking created successfully:", data);

        window.location.href = "customer-dashboard.html";

    } catch (error) {
        console.error("Booking submission error:", error);

        showError(error.message || "Unable to create booking.");

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = `
                <i class="fa-solid fa-calendar-check"></i>
                Confirm Booking
            `;
        }
    }
}


/* =========================================================
   GET CUSTOMER LOCATION (OPTIONAL)
   ========================================================= */

function getCustomerLocation() {
    return new Promise((resolve) => {

        if (!navigator.geolocation) {
            resolve({ latitude: null, longitude: null });
            return;
        }

        navigator.geolocation.getCurrentPosition(

            // SUCCESS
            function (position) {

                console.log(
                    "RAW CUSTOMER GPS:",
                    position.coords.latitude,
                    position.coords.longitude
                );

                resolve({
                    latitude: Number(position.coords.latitude.toFixed(6)),
                    longitude: Number(position.coords.longitude.toFixed(6))
                });
            },

            // ERROR
            function (error) {

                console.warn(
                    "Customer location unavailable:",
                    error.message
                );

                resolve({
                    latitude: null,
                    longitude: null
                });
            },

            {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 60000
            }
        );
    });
}

/* =========================================================
   ERROR DISPLAY
   ========================================================= */

function showError(message) {
    const errorBox = document.getElementById("bookingError");

    if (!errorBox) {
        console.error(message);
        return;
    }

    errorBox.textContent = message;
    errorBox.classList.add("show");

    errorBox.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

/* =========================================================
   HIDE ERROR
   ========================================================= */

function hideError() {
    const errorBox = document.getElementById("bookingError");

    if (!errorBox) {
        return;
    }

    errorBox.textContent = "";
    errorBox.classList.remove("show");
}

/* =========================================================
   PROVIDER CONTACT ACTIONS
   ========================================================= */

function setupProviderContactActions() {
    const callButton = document.getElementById("callProviderBtn");
    const messageButton = document.getElementById("messageProviderBtn");

    /* =========================================================
       DUMMY CALL MODAL
       ========================================================= */

    function openDummyCallModal(providerName) {
        const existingModal = document.getElementById("dummyCallModal");

        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement("div");
        modal.id = "dummyCallModal";

        modal.innerHTML = `
            <div
                class="modal fade"
                id="dummyCallBootstrapModal"
                tabindex="-1"
                aria-hidden="true"
            >
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg">
                        <div class="modal-body text-center p-5">
                            <div class="mb-4">
                                <div
                                    style="
                                        width:80px;
                                        height:80px;
                                        margin:0 auto;
                                        border-radius:50%;
                                        background:#2563eb;
                                        color:white;
                                        display:flex;
                                        align-items:center;
                                        justify-content:center;
                                        font-size:30px;
                                    "
                                >
                                    <i class="fa-solid fa-phone"></i>
                                </div>
                            </div>

                            <h4 class="fw-bold mb-2">Calling</h4>

                            <h5
                                id="dummyCallProviderName"
                                class="mb-2"
                            >
                                ${escapeDummyCallText(providerName)}
                            </h5>

                            <p
                                id="dummyCallStatus"
                                class="text-muted mb-4"
                            >
                                Calling...
                            </p>

                            <button
                                type="button"
                                id="endDummyCallBtn"
                                class="btn btn-danger px-4"
                            >
                                <i class="fa-solid fa-phone-slash me-2"></i>
                                End Call
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const modalElement = document.getElementById(
            "dummyCallBootstrapModal"
        );

        if (!window.bootstrap || !bootstrap.Modal) {
            showError("Bootstrap modal is unavailable on this page.");
            modal.remove();
            return;
        }

        const callModal = new bootstrap.Modal(modalElement, {
            backdrop: "static",
            keyboard: false
        });

        callModal.show();

        const endCallButton = document.getElementById("endDummyCallBtn");

        if (endCallButton) {
            endCallButton.addEventListener("click", function () {
                callModal.hide();
            });
        }

        setTimeout(function () {
            const status = document.getElementById("dummyCallStatus");

            if (status && document.body.contains(status)) {
                status.textContent = "Connected • Call in progress";
            }
        }, 2000);

        modalElement.addEventListener("hidden.bs.modal", function () {
            modal.remove();
        });
    }

    /* =========================================================
       ESCAPE DUMMY CALL TEXT
       ========================================================= */

    function escapeDummyCallText(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* =========================================================
       CALL PROVIDER — DUMMY CALL SIMULATION
       ========================================================= */

    if (callButton) {
        callButton.addEventListener("click", function () {
            const providerNameElement =
                document.getElementById("providerName");

            const providerName = providerNameElement
                ? providerNameElement.textContent.trim()
                : "Service Provider";

            openDummyCallModal(providerName);
        });
    }

    /* =========================================================
       SEND MESSAGE
       ========================================================= */

    if (messageButton) {
        messageButton.addEventListener("click", function () {
            // Prefer the provider ID in quotation mode.
            const providerId =
                quotationBookingMode && selectedQuotation
                    ? selectedQuotation.provider
                    : getProviderId();

            if (!providerId) {
                showError("Provider information is missing.");
                return;
            }

            window.location.href =
                `chat.html?provider_id=${encodeURIComponent(providerId)}`;
        });
    }
}



/* =========================================================
   CUSTOMER SERVICE LOCATION MAP PICKER
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const button = document.getElementById("chooseLocationBtn");
    const mapContainer = document.getElementById("locationMap");
    const latitudeInput = document.getElementById("customerLatitude");
    const longitudeInput = document.getElementById("customerLongitude");
    const locationText = document.getElementById("selectedLocationText");

    if (!button || !mapContainer || !latitudeInput || !longitudeInput) {
        return;
    }

   let map = null;
let marker = null;
let isUpdatingAddressFromMap = false;

const addressInput = document.getElementById("address");

if (addressInput) {
    addressInput.addEventListener("input", function () {
        if (isUpdatingAddressFromMap) return;

        latitudeInput.value = "";
        longitudeInput.value = "";

        if (marker && map) {
            map.removeLayer(marker);
            marker = null;
        }

        if (locationText) {
            locationText.textContent =
                "Address changed. Please select its location on the map again.";
        }
    });
}

    button.addEventListener("click", function () {

        mapContainer.style.display = "block";

        if (!map) {

            // Initial Nepal view
           const nepalBounds = L.latLngBounds(
    [26.347, 80.058],
    [30.447, 88.201]
);

map = L.map("locationMap", {
    maxBounds: nepalBounds,
    maxBoundsViscosity: 1.0,
    minZoom: 6
}).setView([28.2, 84.0], 7);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "&copy; OpenStreetMap contributors",
                maxZoom: 19
            }).addTo(map);

            // Restore the location passed from the service request.
const savedLatitude = Number(latitudeInput.value);
const savedLongitude = Number(longitudeInput.value);

if (
    latitudeInput.value &&
    longitudeInput.value &&
    Number.isFinite(savedLatitude) &&
    Number.isFinite(savedLongitude)
) {
    const savedLocation = L.latLng(
        savedLatitude,
        savedLongitude
    );

    if (nepalBounds.contains(savedLocation)) {
        marker = L.marker(savedLocation).addTo(map);

        map.setView(savedLocation, 15);

        if (locationText) {
            locationText.textContent =
                "Service request location loaded.";
        }
    }
}


map.on("click", async function (event) {

    const latitude = Number(event.latlng.lat.toFixed(6));
    const longitude = Number(event.latlng.lng.toFixed(6));

    if (!nepalBounds.contains(event.latlng)) {
    alert("Please select a location inside Nepal.");
    return;
}

    if (marker) {
        marker.setLatLng(event.latlng);
    } else {
        marker = L.marker(event.latlng).addTo(map);
    }

    latitudeInput.value = latitude;
    longitudeInput.value = longitude;

    if (locationText) {
        locationText.textContent = "Finding address...";
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
        );

        if (!response.ok) {
            throw new Error("Address lookup failed");
        }

        const data = await response.json();
        const addressBox = document.getElementById("address");

       if (data.display_name && addressBox) {
    isUpdatingAddressFromMap = true;

    addressBox.value = data.display_name;

    isUpdatingAddressFromMap = false;

    if (locationText) {
        locationText.textContent = "Address selected successfully.";
    }
}

    } catch (error) {
        console.error("Reverse geocoding error:", error);

        if (locationText) {
            locationText.textContent = "Address lookup failed. Type it manually.";
        }
    }
});


        }

        button.innerHTML = `
            <i class="fa-solid fa-location-dot"></i>
            Select a point on the map
        `;

        setTimeout(function () {
            map.invalidateSize();
        }, 200);

    });

});
