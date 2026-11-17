
/* =========================================================
   ONECLICK — PAYMENT PAGE
   Load real booking and invoice information
   ========================================================= */

const API_BASE = "http://127.0.0.1:8000/api";

let currentBooking = null;


/* =========================================================
   HELPERS
   ========================================================= */

function formatCurrency(amount) {

    return "Rs. " + Number(amount || 0).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}


function showPaymentMessage(message, type = "info") {

    const container =
        document.getElementById("paymentMessage");

    if (!container) return;

    container.innerHTML = `
        <div class="alert alert-${type}" role="alert">
            ${message}
        </div>
    `;

}


/* =========================================================
   LOAD BOOKING
   ========================================================= */

async function loadPaymentBooking() {

    const params = new URLSearchParams(
        window.location.search
    );

    const bookingId = params.get("booking_id");

    const token =
        localStorage.getItem("access_token");


    if (!bookingId) {

        showPaymentMessage(
            "Booking ID is missing. Please open payment from your booking details.",
            "danger"
        );

        return;

    }


    if (!token) {

        showPaymentMessage(
            "Please log in to continue.",
            "warning"
        );

        return;

    }


    try {

        const response = await fetch(
            `${API_BASE}/bookings/${bookingId}/`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );


        if (!response.ok) {

            throw new Error(
                `Booking request failed: ${response.status}`
            );

        }


        const booking = await response.json();

        currentBooking = booking;


        renderPaymentBooking(booking);


    } catch (error) {

        console.error(
            "PAYMENT BOOKING ERROR:",
            error
        );

        showPaymentMessage(
            "Unable to load booking information. Please try again.",
            "danger"
        );

    }

}


/* =========================================================
   DISPLAY BOOKING AND INVOICE
   ========================================================= */

function renderPaymentBooking(booking) {

    document.getElementById("bookingId").textContent =
        `#OC-${booking.id}`;

    document.getElementById("bookingStatus").textContent =
        booking.status.replaceAll("_", " ").toUpperCase();

    document.getElementById("summaryBookingStatus").textContent =
        booking.status.replaceAll("_", " ").toUpperCase();

    document.getElementById("serviceName").textContent =
        booking.service_name || "Service";

    document.getElementById("providerName").textContent =
        booking.provider_name || "Provider";


    document.getElementById("invoiceNumber").textContent =
        `INV-${String(booking.id).padStart(5, "0")}`;


    const total = Number(booking.total_price || 0);

document.getElementById("serviceAmount").textContent =
    formatCurrency(total);

document.getElementById("additionalCharges").textContent =
    formatCurrency(0);

    document.getElementById("totalAmount").textContent =
        formatCurrency(total);


    document.getElementById("paymentStatus").textContent =
        (booking.payment_status || "unpaid").toUpperCase();


    // Payment is only available after service completion.
    const paymentButton =
        document.getElementById("continuePaymentBtn");

    if (booking.status !== "completed") {

        paymentButton.disabled = true;

        showPaymentMessage(
            "Payment will be available after the provider completes the service.",
            "warning"
        );

        return;

    }


    // Do not allow payment again if already paid.
    if (booking.payment_status === "paid") {

        paymentButton.disabled = true;

        showPaymentMessage(
            "This booking has already been marked as paid.",
            "success"
        );

        return;

    }


    paymentButton.disabled = false;

    showPaymentMessage(
        "Your service is completed. Please select a payment method.",
        "success"
    );

}


/* =========================================================
   PAYMENT METHOD SELECTION
   ========================================================= */

function initializePaymentSelection() {

    const paymentOptions =
        document.querySelectorAll(
            'input[name="paymentMethod"]'
        );

    const paymentButton =
        document.getElementById("continuePaymentBtn");


    paymentOptions.forEach(option => {

        option.addEventListener("change", function() {

            paymentButton.disabled =
                !currentBooking ||
                currentBooking.status !== "completed" ||
                currentBooking.payment_status === "paid";

        });

    });


    paymentButton.addEventListener("click", async function() {

        const selectedMethod =
            document.querySelector(
                'input[name="paymentMethod"]:checked'
            );


        if (!selectedMethod) {

            showPaymentMessage(
                "Please select a payment method first.",
                "warning"
            );

            return;

        }


        if (!currentBooking) return;


       if (selectedMethod.value === "khalti") {

    paymentButton.disabled = true;
    showPaymentMessage("Connecting to Khalti sandbox...", "info");

    try {
        const token = localStorage.getItem("access_token");

        const response = await fetch(
            `${API_BASE}/bookings/payment/khalti/initiate/`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    booking_id: currentBooking.id
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Payment initiation failed.");
        }

        window.location.href = result.payment_url;

    } catch (error) {
        console.error("KHALTI ERROR:", error);
        showPaymentMessage(error.message, "danger");
        paymentButton.disabled = false;
    }


} else if (selectedMethod.value === "cash") {

    paymentButton.disabled = true;

    showPaymentMessage(
        "Saving your cash payment selection...",
        "info"
    );

    try {
        const token = localStorage.getItem("access_token");

        const response = await fetch(
            `${API_BASE}/bookings/payment/cash/select/`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    booking_id: currentBooking.id
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || "Unable to select cash payment."
            );
        }

        currentBooking.payment_method = "cash";

        showPaymentMessage(
            "Cash payment selected successfully. Please pay your provider after service completion confirmation. The provider will confirm receipt in the demo.",
            "success"
        );

        console.log("Cash payment selection:", result);

    } catch (error) {
        console.error("CASH PAYMENT ERROR:", error);

        showPaymentMessage(error.message, "danger");

    } finally {
        paymentButton.disabled = false;
    }

}


    });

}



/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", async function() {

    initializePaymentSelection();

    const params = new URLSearchParams(window.location.search);
    const paymentResult = params.get("payment");

    await loadPaymentBooking();

    if (paymentResult === "success") {

        if (
            currentBooking &&
            currentBooking.payment_status === "paid"
        ) {

            showPaymentMessage(
                "Payment verified successfully! Your invoice is now paid.",
                "success"
            );

        } else {

            showPaymentMessage(
                "We could not confirm the booking's paid status. Please refresh your booking details before making another payment.",
                "warning"
            );

        }

    } else if (paymentResult === "failed") {

        showPaymentMessage(
            "Payment was not completed. Please check your payment status before trying again.",
            "danger"
        );

    } else if (paymentResult === "pending") {

        showPaymentMessage(
            "Your payment is still being processed. Please check again shortly. Do not make another payment while this one is pending.",
            "warning"
        );

    } else if (paymentResult === "conflict") {

        showPaymentMessage(
            "Khalti reports a successful payment, but this booking was already paid using another method. Do not pay again. Please contact OneClick Support so the transactions can be reviewed.",
            "danger"
        );

    }

});
