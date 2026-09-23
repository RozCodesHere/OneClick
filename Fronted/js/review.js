``/* ==========================================================
   OneClick — Review Page JS
   Connected to Django REST review API
   ========================================================== */

const API_BASE = "http://127.0.0.1:8000/api";

document.addEventListener("DOMContentLoaded", () => {
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
        window.location.href = "login.html";
        return;
    }

    /* ======================================================
       ELEMENTS
       ====================================================== */

    const reviewForm =
        document.getElementById("reviewForm");

    const starButtons =
        document.querySelectorAll(".star-btn");

    const ratingInput =
        document.getElementById("rating");

    const ratingText =
        document.getElementById("ratingText");

    const reviewText =
        document.getElementById("reviewText");

    const characterCount =
        document.getElementById("characterCount");

    const reviewMessage =
        document.getElementById("reviewMessage");

    const submitButton =
        reviewForm
            ? reviewForm.querySelector(
                'button[type="submit"]'
            )
            : null;

    let selectedRating = 0;

    /* ======================================================
       GET PROVIDER ID
       ====================================================== */

    function getProviderId() {
        const params =
            new URLSearchParams(
                window.location.search
            );

        return (
            params.get("provider_id") ||
            params.get("provider")
        );
    }

    /* ======================================================
       STAR RATING
       ====================================================== */

    starButtons.forEach((button) => {
        button.addEventListener("click", () => {
            selectedRating =
                Number(button.dataset.rating);

            if (ratingInput) {
                ratingInput.value =
                    selectedRating;
            }

            starButtons.forEach((star) => {
                const starRating =
                    Number(
                        star.dataset.rating
                    );

                if (
                    starRating <=
                    selectedRating
                ) {
                    star.classList.add(
                        "selected"
                    );
                } else {
                    star.classList.remove(
                        "selected"
                    );
                }
            });

            const ratingLabels = {
                1: "Poor",
                2: "Fair",
                3: "Good",
                4: "Very Good",
                5: "Excellent"
            };

            if (ratingText) {
                ratingText.textContent =
                    ratingLabels[
                        selectedRating
                    ];
            }
        });
    });

    /* ======================================================
       CHARACTER COUNT
       ====================================================== */

    if (reviewText && characterCount) {
        reviewText.addEventListener(
            "input",
            () => {
                characterCount.textContent =
                    reviewText.value.length;
            }
        );
    }

    /* ======================================================
       MESSAGE
       ====================================================== */

    function showMessage(message, type) {
        if (!reviewMessage) {
            return;
        }

        reviewMessage.textContent =
            message;

        reviewMessage.className =
            `review-message show ${type}`;
    }

    /* ======================================================
       REVIEW ERROR
       ====================================================== */

    function getReviewErrorMessage(data) {
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
            return Array.isArray(data.rating)
                ? data.rating[0]
                : data.rating;
        }

        if (data.provider) {
            return Array.isArray(data.provider)
                ? data.provider[0]
                : data.provider;
        }

        if (data.comment) {
            return Array.isArray(data.comment)
                ? data.comment[0]
                : data.comment;
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

    /* ======================================================
       SUBMIT REVIEW
       ====================================================== */

    if (reviewForm) {
        reviewForm.addEventListener(
            "submit",
            async (event) => {
                event.preventDefault();

                const providerId =
                    getProviderId();

                const review =
                    reviewText
                        ? reviewText.value.trim()
                        : "";

                if (!providerId) {
                    showMessage(
                        "Provider information is missing.",
                        "error"
                    );

                    return;
                }

                if (
                    selectedRating < 1 ||
                    selectedRating > 5
                ) {
                    showMessage(
                        "Please select a rating from 1 to 5 stars.",
                        "error"
                    );

                    return;
                }

                if (!review) {
                    showMessage(
                        "Please write a review.",
                        "error"
                    );

                    return;
                }

                if (submitButton) {
                    submitButton.disabled =
                        true;

                    submitButton.innerHTML = `
                        <i class="fa-solid fa-spinner fa-spin me-1"></i>
                        Submitting...
                    `;
                }

                try {
                    const response =
                        await fetch(
                            `${API_BASE}/reviews/`,
                            {
                                method: "POST",

                                headers: {
                                    "Authorization":
                                        `Bearer ${accessToken}`,

                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({
                                        provider:
                                            Number(
                                                providerId
                                            ),

                                        rating:
                                            selectedRating,

                                        comment:
                                            review
                                    })
                            }
                        );

                    let data = null;

                    try {
                        data =
                            await response.json();
                    } catch (error) {
                        data = null;
                    }

                    console.log(
                        "REVIEW RESPONSE:",
                        response.status,
                        data
                    );

                    /* --------------------------------------
                       UNAUTHORIZED
                       -------------------------------------- */

                    if (
                        response.status === 401
                    ) {
                        localStorage.removeItem(
                            "access_token"
                        );

                        localStorage.removeItem(
                            "refresh_token"
                        );

                        localStorage.removeItem(
                            "user"
                        );

                        window.location.href =
                            "login.html";

                        return;
                    }

                    /* --------------------------------------
                       BACKEND ERROR
                       -------------------------------------- */

                    if (!response.ok) {
                        showMessage(
                            getReviewErrorMessage(
                                data
                            ),
                            "error"
                        );

                        return;
                    }

                    /* --------------------------------------
                       SUCCESS
                       -------------------------------------- */

                    console.log(
                        "Review submitted:",
                        data
                    );

                    showMessage(
                        "Review submitted successfully!",
                        "success"
                    );

                    if (reviewText) {
                        reviewText.value =
                            "";

                        if (characterCount) {
                            characterCount.textContent =
                                "0";
                        }
                    }

                    selectedRating = 0;

                    if (ratingInput) {
                        ratingInput.value =
                            "0";
                    }

                    starButtons.forEach(
                        (star) => {
                            star.classList.remove(
                                "selected"
                            );
                        }
                    );

                    if (ratingText) {
                        ratingText.textContent =
                            "Select a rating";
                    }
                } catch (error) {
                    console.error(
                        "REVIEW ERROR:",
                        error
                    );

                    showMessage(
                        "Something went wrong while submitting your review.",
                        "error"
                    );
                } finally {
                    if (submitButton) {
                        submitButton.disabled =
                            false;

                        submitButton.innerHTML = `
                            <i class="fa-solid fa-paper-plane me-1"></i>
                            Submit Review
                        `;
                    }
                }
            }
        );
    }

    /* ======================================================
       LOGOUT
       ====================================================== */

    const logoutButton =
        document.querySelector(".btn-logout");

    if (logoutButton) {
        logoutButton.addEventListener(
            "click",
            (event) => {
                event.preventDefault();

                localStorage.removeItem(
                    "access_token"
                );

                localStorage.removeItem(
                    "refresh_token"
                );

                localStorage.removeItem(
                    "user"
                );

                window.location.href =
                    "login.html";
            }
        );
    }
});

