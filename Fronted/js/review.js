const API_BASE = "http://127.0.0.1:8000/api";

document.addEventListener("DOMContentLoaded", () => {

    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
        window.location.href = "login.html";
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get("booking");

    const reviewForm = document.getElementById("reviewForm");
    const starButtons = document.querySelectorAll(".star-btn");
    const ratingInput = document.getElementById("rating");
    const ratingText = document.getElementById("ratingText");
    const reviewText = document.getElementById("reviewText");
    const characterCount = document.getElementById("characterCount");
    const reviewMessage = document.getElementById("reviewMessage");
    const providerName = document.getElementById("reviewProviderName");
    const serviceName = document.getElementById("reviewServiceName");

    const submitButton = reviewForm.querySelector(
        'button[type="submit"]'
    );

    let selectedRating = 0;
    let validBooking = false;

    function showMessage(message, type) {
        reviewMessage.textContent = message;
        reviewMessage.className = `review-message show ${type}`;
    }

    // LOAD BOOKING DETAILS
    async function loadBooking() {

        if (!bookingId) {
            showMessage("Booking information is missing.", "error");
            submitButton.disabled = true;
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE}/bookings/${bookingId}/`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Unable to load booking.");
            }

            const booking = await response.json();

            providerName.textContent =
                booking.provider_name || "Service Provider";

            serviceName.textContent =
                booking.service_name || "OneClick Service";

            if (booking.status !== "completed") {
                showMessage(
                    "You can only review completed bookings.",
                    "error"
                );

                submitButton.disabled = true;
                return;
            }

            validBooking = true;

        } catch (error) {
            console.error("BOOKING ERROR:", error);

            showMessage(
                "Unable to load booking details.",
                "error"
            );

            submitButton.disabled = true;
        }
    }

    loadBooking();

    // STAR RATING
    starButtons.forEach(button => {

        button.addEventListener("click", () => {

            selectedRating = Number(button.dataset.rating);
            ratingInput.value = selectedRating;

            starButtons.forEach(star => {
                star.classList.toggle(
                    "selected",
                    Number(star.dataset.rating) <= selectedRating
                );
            });

            const labels = {
                1: "Poor",
                2: "Fair",
                3: "Good",
                4: "Very Good",
                5: "Excellent"
            };

            ratingText.textContent = labels[selectedRating];
        });

    });

    // CHARACTER COUNT
    reviewText.addEventListener("input", () => {
        characterCount.textContent = reviewText.value.length;
    });

    // SUBMIT REVIEW
    reviewForm.addEventListener("submit", async event => {

        event.preventDefault();

        if (!validBooking) {
            showMessage("This booking cannot be reviewed.", "error");
            return;
        }

        const comment = reviewText.value.trim();

        if (selectedRating < 1 || selectedRating > 5) {
            showMessage("Please select a star rating.", "error");
            return;
        }

        if (!comment) {
            showMessage("Please write your review.", "error");
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";

        try {

            const response = await fetch(`${API_BASE}/reviews/`, {
                method: "POST",

                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    booking: Number(bookingId),
                    rating: selectedRating,
                    comment: comment
                })
            });

            const data = await response.json();

            if (!response.ok) {
                showMessage(
                    data.error || "Unable to submit review.",
                    "error"
                );
                return;
            }

            showMessage(
                "Review submitted successfully!",
                "success"
            );

            reviewForm.reset();
            selectedRating = 0;
            ratingInput.value = "";
            ratingText.textContent = "Select a rating";
            characterCount.textContent = "0";

            starButtons.forEach(star => {
                star.classList.remove("selected");
            });

            validBooking = false;
            submitButton.disabled = true;

        } catch (error) {

            console.error("REVIEW ERROR:", error);

            showMessage(
                "Something went wrong. Please try again.",
                "error"
            );

        } finally {

            if (validBooking) {
                submitButton.disabled = false;
            }

            submitButton.innerHTML =
                '<i class="fa-solid fa-paper-plane"></i> Submit Review';
        }

    });

    // LOGOUT
    const logoutButton = document.querySelector(".btn-logout");

    if (logoutButton) {
        logoutButton.addEventListener("click", event => {
            event.preventDefault();

            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("user");

            window.location.href = "login.html";
        });
    }

});
