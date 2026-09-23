document.addEventListener("DOMContentLoaded", function () {

    const token = localStorage.getItem("access_token");

    // User must be logged in
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const reportForm = document.getElementById("reportForm");
    const issueType = document.getElementById("issueType");
    const bookingReference = document.getElementById("bookingReference");
    const issueDescription = document.getElementById("issueDescription");
    const characterCount = document.getElementById("characterCount");
    const reportMessage = document.getElementById("reportMessage");
    const submitReport = document.getElementById("submitReport");
    const logoutBtn = document.getElementById("logoutBtn");


    // ================= CHARACTER COUNT =================

    if (issueDescription && characterCount) {

        issueDescription.addEventListener("input", function () {

            const length = this.value.length;

            characterCount.textContent = `${length} / 500`;

        });

    }


    // ================= SHOW MESSAGE =================

    function showMessage(message, type) {

        if (!reportMessage) return;

        reportMessage.textContent = message;

        reportMessage.classList.remove(
            "d-none",
            "success",
            "error"
        );

        reportMessage.classList.add(type);

    }


    // ================= FORM SUBMIT =================

    if (reportForm) {

        reportForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const selectedIssue = issueType
                ? issueType.value.trim()
                : "";

            const reference = bookingReference
                ? bookingReference.value.trim()
                : "";

            const description = issueDescription
                ? issueDescription.value.trim()
                : "";


            // Validation
            if (!selectedIssue) {

                showMessage(
                    "Please select the type of issue.",
                    "error"
                );

                issueType.focus();

                return;
            }


            if (!description) {

                showMessage(
                    "Please describe the issue before submitting.",
                    "error"
                );

                issueDescription.focus();

                return;
            }


            if (description.length < 10) {

                showMessage(
                    "Please provide a little more detail about the issue.",
                    "error"
                );

                issueDescription.focus();

                return;
            }


            // Frontend-only for now.
            // No fake API submission.
            console.log("Issue Report:", {
                issueType: selectedIssue,
                bookingReference: reference,
                description: description
            });


            showMessage(
                "Your report has been recorded on this page. Issue submission will be connected to the backend when the support API is available.",
                "success"
            );


            // Prevent accidental duplicate submission
            if (submitReport) {

                submitReport.disabled = true;

                submitReport.innerHTML =
                    '<i class="fa-solid fa-check me-2"></i>Report Submitted';

            }

        });

    }


    // ================= LOGOUT =================

    if (logoutBtn) {

        logoutBtn.addEventListener("click", function (event) {

            event.preventDefault();

            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");

            window.location.href = "login.html";

        });

    }

});