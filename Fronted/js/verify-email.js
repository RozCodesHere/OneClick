
const API_BASE =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000/api"
        : "https://oneclick-backend-6hk7.onrender.com/api";

const verifyForm = document.getElementById("verifyEmailForm");
const emailInput = document.getElementById("verifyEmail");
const otpInput = document.getElementById("verificationCode");
const message = document.getElementById("verifyMessage");
const verifyButton = document.getElementById("verifyButton");

// Load the email used during registration
const pendingEmail = sessionStorage.getItem("pending_verification_email");
const pendingRole =
    sessionStorage.getItem("pending_verification_role") || "customer";

if (!pendingEmail) {
    emailInput.readOnly = false;
    emailInput.value = "";
}else {
    emailInput.value = pendingEmail;
}

// Verify email OTP
verifyForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = emailInput.value.trim();
    const otp = otpInput.value.trim();

    message.className = "mb-3";
    message.textContent = "";

    verifyButton.disabled = true;
    verifyButton.textContent = "Verifying...";

    try {

        const response = await fetch(
            `${API_BASE}/users/verify-email/`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    otp: otp
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Verification failed. Please try again."
            );
        }

        message.className = "alert alert-success mb-3";
        message.textContent =
            "Email verified successfully! Redirecting to login...";

        sessionStorage.removeItem("pending_verification_email");
sessionStorage.removeItem("pending_verification_role");
  if (pendingRole === "provider" && window.opener) {
    window.opener.postMessage(
        {
            type: "ONECLICK_EMAIL_VERIFIED",
            email: email
        },
        window.location.origin
    );

    window.close();
    return;
}      


        setTimeout(function () {
            window.location.href =
    "login.html?role=" + pendingRole;
        }, 2000);

    } catch (error) {

        message.className = "alert alert-danger mb-3";
        message.textContent = error.message;

        verifyButton.disabled = false;
        verifyButton.textContent = "Verify Email";
    }

});


// RESEND VERIFICATION CODE

const resendButton = document.getElementById("resendCodeButton");

resendButton.addEventListener("click", async function () {

    const email = emailInput.value.trim();

    if (!email) {
        message.className = "alert alert-danger mb-3";
        message.textContent = "Please enter your email address.";
        return;
    }

    resendButton.disabled = true;
    resendButton.textContent = "Sending...";

    try {

        const response = await fetch(
            `${API_BASE}/users/resend-verification/`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email: email })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unable to resend code.");
        }

        message.className = "alert alert-success mb-3";
        message.textContent = data.message;

    } catch (error) {

        message.className = "alert alert-danger mb-3";
        message.textContent = error.message;

    } finally {

        resendButton.disabled = false;
        resendButton.textContent = "Resend Verification Code";

    }

});
