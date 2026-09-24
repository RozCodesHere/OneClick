/* =========================================================
   ONECLICK — BOOKING PAGE
   Connects customer booking form with Django REST API
   ========================================================= */

const API_BASE = "http://127.0.0.1:8000/api";

let selectedProviderServicePrice = null;

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
    loadBookingPage();
    setupBookingForm();
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

function applyProviderServicePrice() {

    if (
        selectedProviderServicePrice === null ||
        selectedProviderServicePrice === undefined
    ) {
        return;
    }

    const serviceSelect =
        document.getElementById("service");

    if (!serviceSelect) {
        return;
    }

    const selectedServiceId =
        getServiceId();

    if (!selectedServiceId) {
        return;
    }

    const option =
        Array.from(serviceSelect.options).find(
            function (option) {

                return (
                    String(option.value) ===
                    String(selectedServiceId)
                );
            }
        );

    if (!option) {
        return;
    }

    const serviceName =
        option.textContent.split(" — ")[0];

    option.textContent =
        `${serviceName} — Rs. ${Number(
            selectedProviderServicePrice
        ).toFixed(2)}`;

    option.dataset.price =
        selectedProviderServicePrice;

    serviceSelect.value =
        selectedServiceId;

  
}
/* =========================================================
   AUTH HEADERS
   ========================================================= */

function getHeaders() {
    const token = localStorage.getItem("access_token");

    return {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };
}

/* =========================================================
   LOAD BOOKING PAGE
   ========================================================= */

async function loadBookingPage() {
    const providerId = getProviderId();

    if (!providerId) {
        showError("Provider information is missing.");
        return;
    }

    await Promise.all([
        loadProvider(providerId),
        loadServices()
    ]);
}

/* =========================================================
   LOAD PROVIDER
   ========================================================= */

async function loadProvider(providerId) {
    try {
      const serviceId = getServiceId();

let providerUrl =
    `${API_BASE}/providers/${providerId}/`;

if (serviceId) {
    providerUrl += `?service_id=${serviceId}`;
}

const response = await fetch(providerUrl);

        if (!response.ok) {
            throw new Error(
                `Provider API returned ${response.status}`
            );
        }

        const provider = await response.json();

        console.log("Booking provider:", provider);

        selectedProviderServicePrice =
    provider.service_price;

    applyProviderServicePrice();

        renderProvider(provider);
    } catch (error) {
        console.error("Provider loading error:", error);
        showError("Unable to load provider information.");
    }
}

/* =========================================================
   RENDER PROVIDER
   ========================================================= */

function renderProvider(provider) {
    const name = provider.full_name || "Provider";
    const category = provider.category_name || "Service Provider";
    const image =
        provider.profile_image ||
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
        if (provider.available) {
            providerStatus.innerHTML = `
                <i class="fa-solid fa-circle"></i>
                Available Now
            `;
            providerStatus.style.color = "#16a34a";
        } else {
            providerStatus.innerHTML = `
                <i class="fa-solid fa-circle"></i>
                Currently Unavailable
            `;
            providerStatus.style.color = "#dc2626";
        }
    }
}

/* =========================================================
   LOAD SERVICES
   ========================================================= */

async function loadServices() {

    const serviceSelect =
        document.getElementById("service");

    if (!serviceSelect) {
        return;
    }

    const providerId = getProviderId();
    const serviceId = getServiceId();

    if (!providerId) {
        console.error("Provider ID is missing.");
        return;
    }

    try {

        /*
         * ---------------------------------------------------------
         * LOAD THE PROVIDER
         * ---------------------------------------------------------
         *
         * We use the provider endpoint because it already supports
         * service_id and returns the provider-specific service price.
         *
         * Example:
         * /providers/5/?service_id=2
         */

        let providerUrl =
            `${API_BASE}/providers/${providerId}/`;

        if (serviceId) {
            providerUrl += `?service_id=${serviceId}`;
        }

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
            "Booking provider service:",
            provider
        );


        /*
         * ---------------------------------------------------------
         * CLEAR CURRENT OPTIONS
         * ---------------------------------------------------------
         */

        serviceSelect.innerHTML = `
            <option value="">
                Select a service
            </option>
        `;


        /*
         * ---------------------------------------------------------
         * PROVIDER SERVICE
         * ---------------------------------------------------------
         */

        if (
            !provider.service_name ||
            !provider.service_price
        ) {

            serviceSelect.innerHTML = `
                <option value="">
                    No service available
                </option>
            `;

            serviceSelect.disabled = true;

            console.warn(
                "Provider does not have a service for this booking."
            );

            return;
        }


        /*
         * ---------------------------------------------------------
         * CREATE ONLY THE PROVIDER'S SERVICE OPTION
         * ---------------------------------------------------------
         */

        const option =
            document.createElement("option");

        option.value =
            serviceId;

        option.textContent =
            `${provider.service_name} — Rs. ${Number(
                provider.service_price
            ).toFixed(2)}`;

        option.dataset.price =
            provider.service_price;

        option.dataset.description =
            provider.service_description ||
            "Professional service available on OneClick.";


        serviceSelect.appendChild(option);


        /*
         * ---------------------------------------------------------
         * SELECT SERVICE AUTOMATICALLY
         * ---------------------------------------------------------
         */

        if (serviceId) {

            serviceSelect.value =
                serviceId;

            selectedProviderServicePrice =
                provider.service_price;

            updateSelectedService();

            serviceSelect.disabled = true;

            console.log(
                "Selected provider service:",
                provider.service_name
            );

            console.log(
                "Provider service price:",
                provider.service_price
            );
        }


    } catch (error) {

        console.error(
            "Provider service loading error:",
            error
        );

        serviceSelect.innerHTML = `
            <option value="">
                Unable to load service
            </option>
        `;
    }
}


/* =========================================================
   UPDATE SELECTED SERVICE
   ========================================================= */

function updateSelectedService() {
    const select = document.getElementById("service");
    const description = document.getElementById("serviceDescription");
    const pricePreview = document.querySelector(
        "#pricePreview strong"
    );

    if (!select) {
        return;
    }

    const option = select.options[select.selectedIndex];

    if (!option || !option.value) {
        if (description) {
            description.textContent =
                "Select a service to see details.";
        }

        if (pricePreview) {
            pricePreview.textContent = "Rs. 0.00";
        }

        return;
    }

   const price =
    selectedProviderServicePrice !== null &&
    selectedProviderServicePrice !== undefined
        ? selectedProviderServicePrice
        : (option.dataset.price || "0.00");

        if (
    selectedProviderServicePrice !== null &&
    selectedProviderServicePrice !== undefined
) {
    option.textContent =
        `${option.textContent.split(" — ")[0]} — Rs. ${selectedProviderServicePrice}`;
}

    const serviceDescription =
        option.dataset.description ||
        "Professional service available on OneClick.";

    if (description) {
        description.textContent = serviceDescription;
    }

    if (pricePreview) {
        pricePreview.textContent = `Rs. ${price}`;
    }
}

/* =========================================================
   MINIMUM DATE
   ========================================================= */

function setMinimumDate() {
    const dateInput = document.getElementById("bookingDate");

    if (!dateInput) {
        return;
    }

    const today = new Date();

    const year = today.getFullYear();

    const month = String(
        today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        today.getDate()
    ).padStart(2, "0");

    dateInput.min = `${year}-${month}-${day}`;
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

function getCurrentLocation() {
    return new Promise(function (resolve, reject) {

        if (!navigator.geolocation) {
            reject(
                new Error(
                    "Geolocation is not supported by this browser."
                )
            );
            return;
        }

        navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}


/* =========================================================
   SUBMIT BOOKING
   ========================================================= */

async function submitBooking() {
    const providerId = getProviderId();

    const service = document.getElementById("service");
    const bookingDate = document.getElementById("bookingDate");
    const bookingTime = document.getElementById("bookingTime");
    const address = document.getElementById("address");
    const note = document.getElementById("note");
    const submitButton = document.getElementById("submitBooking");

    let latitude = null;
    let longitude = null;

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

    if (!bookingTime || !bookingTime.value) {
        showError("Please select a booking time.");
        return;
    }

    if (!address || !address.value.trim()) {
        showError("Please enter the service address.");
        return;
    }

   hideError();

try {
    const position = await getCurrentLocation();

   latitude = Number(position.coords.latitude.toFixed(6));
longitude = Number(position.coords.longitude.toFixed(6));

} catch (error) {

    console.error(
        "Location error:",
        error
    );

    showError(
        "Please allow location access to create a booking."
    );

    return;
}
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

    console.log("Booking payload:", bookingData);

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Creating Booking...
        `;
    }

    try {
        const response = await fetch(
            `${API_BASE}/bookings/`,
            {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(bookingData)
            }
        );

        const data = await response.json();

        console.log("Booking response:", data);

        if (!response.ok) {
            console.error("Booking API error:", data);

            let message = "Unable to create booking.";

            if (data.detail) {
                message = data.detail;
            } else if (typeof data === "object") {
                const firstError = Object.values(data)[0];

                if (Array.isArray(firstError)) {
                    message = firstError[0];
                } else if (firstError) {
                    message = String(firstError);
                }
            }

            throw new Error(message);
        }

        console.log(
            "Booking created successfully:",
            data
        );

        window.location.href =
            "customer-dashboard.html";
    } catch (error) {
        console.error(
            "Booking submission error:",
            error
        );

        showError(
            error.message ||
            "Unable to create booking."
        );

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
   ERROR DISPLAY
   ========================================================= */

function showError(message) {
    const errorBox = document.getElementById(
        "bookingError"
    );

    if (!errorBox) {
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
    const errorBox = document.getElementById(
        "bookingError"
    );

    if (!errorBox) {
        return;
    }

    errorBox.textContent = "";
    errorBox.classList.remove("show");
}

