const API_BASE = "https://oneclick-backend-6hk7.onrender.com/api/users";

const requestForm = document.getElementById("reactivateRequestForm");
const verifyForm = document.getElementById("reactivateVerifyForm");
const alertBox = document.getElementById("reactivateAlert");

function showMessage(message, type = "danger") {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
}

requestForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("reactivateEmail").value.trim();

    try {
        const response = await fetch(`${API_BASE}/reactivate/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.error || "Unable to send verification code.");
            return;
        }

        showMessage("If your account is eligible, an OTP has been sent to your email.", "success");
        verifyForm.classList.remove("d-none");

    } catch (error) {
        showMessage("Unable to connect to the server.");
    }
});

verifyForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("reactivateEmail").value.trim();
    const otp = document.getElementById("reactivateOTP").value.trim();

    try {
        const response = await fetch(`${API_BASE}/verify-reactivation/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.error || "Verification failed.");
            return;
        }

        showMessage("Account reactivated successfully! Redirecting to login...", "success");

        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);

    } catch (error) {
        showMessage("Unable to connect to the server.");
    }
});
