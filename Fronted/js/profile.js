/* =========================================================
   ONECLICK — CUSTOMER PROFILE
   Dynamic Django REST API Integration
   ========================================================= */

const API_BASE = "http://127.0.0.1:8000/api";

/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    console.log("=================================");
    console.log("ONECLICK CUSTOMER PROFILE");
    console.log("=================================");

    const accessToken =
        localStorage.getItem("access_token");

    if (!accessToken) {
        console.warn("No access token found.");
        window.location.href = "login.html";
        return;
    }

    loadProfile();
    setupProfileForm();
    setupLogout();
});

/* =========================================================
   API REQUEST HELPER
   ========================================================= */

async function apiRequest(endpoint, options = {}) {
    const token =
        localStorage.getItem("access_token");

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization =
            `Bearer ${token}`;
    }

    const response = await fetch(
        `${API_BASE}${endpoint}`,
        {
            ...options,
            headers
        }
    );

    if (response.status === 401) {
        console.warn(
            "Authentication expired."
        );

        localStorage.removeItem(
            "access_token"
        );

        localStorage.removeItem(
            "refresh_token"
        );

        localStorage.removeItem("user");

        window.location.href =
            "login.html";

        return null;
    }

    return response;
}

/* =========================================================
   LOAD CUSTOMER PROFILE
   ========================================================= */

async function loadProfile() {
    console.log(
        "Loading customer profile..."
    );

    try {
        const response =
            await apiRequest(
                "/users/me/"
            );

        if (!response) {
            return;
        }

        console.log(
            "Profile API status:",
            response.status
        );

        if (!response.ok) {
            const errorData =
                await response.json()
                    .catch(() => ({}));

            console.error(
                "Profile error:",
                errorData
            );

            showAlert(
                "Unable to load your profile.",
                "danger"
            );

            return;
        }

        const user =
            await response.json();

        console.log(
            "CURRENT USER:",
            user
        );

        window.currentUser =
            user;

        localStorage.setItem(
            "user",
            JSON.stringify(user)
        );

        renderProfile(user);
    } catch (error) {
        console.error(
            "Profile loading error:",
            error
        );

        showAlert(
            "Unable to connect to the server.",
            "danger"
        );
    }
}

/* =========================================================
   RENDER PROFILE
   ========================================================= */

function renderProfile(user) {
    const firstName =
        user.first_name || "";

    const lastName =
        user.last_name || "";

    const fullName =
        `${firstName} ${lastName}`
            .trim();

    const profileName =
        document.getElementById(
            "profileName"
        );

    const profileRole =
        document.getElementById(
            "profileRole"
        );

    const firstNameInput =
        document.getElementById(
            "firstName"
        );

    const lastNameInput =
        document.getElementById(
            "lastName"
        );

    const emailInput =
        document.getElementById(
            "email"
        );

    const roleInput =
        document.getElementById(
            "role"
        );

    const accountId =
        document.getElementById(
            "accountId"
        );

    const accountRole =
        document.getElementById(
            "accountRole"
        );

    const statusElement =
        document.getElementById(
            "accountStatus"
        );

    /* -----------------------------------------------------
       PROFILE HEADER
       ----------------------------------------------------- */

    if (profileName) {
        profileName.textContent =
            fullName || "Customer";
    }

    if (profileRole) {
        profileRole.textContent =
            formatRole(user.role);
    }

    /* -----------------------------------------------------
       FORM
       ----------------------------------------------------- */

    if (firstNameInput) {
        firstNameInput.value =
            firstName;
    }

    if (lastNameInput) {
        lastNameInput.value =
            lastName;
    }

    if (emailInput) {
        emailInput.value =
            user.email || "";
    }

    if (roleInput) {
        roleInput.value =
            formatRole(user.role);
    }

    /* -----------------------------------------------------
       ACCOUNT INFORMATION
       ----------------------------------------------------- */

    if (accountId) {
        accountId.textContent =
            user.id ?? "—";
    }

    if (accountRole) {
        accountRole.textContent =
            formatRole(user.role);
    }

    /* -----------------------------------------------------
       ACCOUNT STATUS
       ----------------------------------------------------- */

    if (statusElement) {
        if (user.is_active === false) {
            statusElement.textContent =
                "Inactive";

            statusElement.className =
                "text-danger";
        } else {
            statusElement.textContent =
                "Active";

            statusElement.className =
                "text-success";
        }
    }
}

/* =========================================================
   FORMAT ROLE
   ========================================================= */

function formatRole(role) {
    if (!role) {
        return "Customer";
    }

    return (
        role.charAt(0).toUpperCase() +
        role.slice(1).toLowerCase()
    );
}

/* =========================================================
   PROFILE FORM
   ========================================================= */

function setupProfileForm() {
    const form =
        document.getElementById(
            "profileForm"
        );

    const resetButton =
        document.getElementById(
            "resetBtn"
        );

    if (!form) {
        return;
    }

    /* -----------------------------------------------------
       SAVE
       ----------------------------------------------------- */

    form.addEventListener(
        "submit",
        async function (event) {
            event.preventDefault();

            await updateProfile();
        }
    );

    /* -----------------------------------------------------
       RESET
       ----------------------------------------------------- */

    if (resetButton) {
        resetButton.addEventListener(
            "click",
            function () {
                if (window.currentUser) {
                    renderProfile(
                        window.currentUser
                    );
                }
            }
        );
    }
}

/* =========================================================
   UPDATE PROFILE
   ========================================================= */

async function updateProfile() {
    const firstNameInput =
        document.getElementById(
            "firstName"
        );

    const lastNameInput =
        document.getElementById(
            "lastName"
        );

    const saveButton =
        document.getElementById(
            "saveBtn"
        );

    if (!firstNameInput) {
        return;
    }

    const firstName =
        firstNameInput.value.trim();

    const lastName =
        lastNameInput
            ? lastNameInput.value.trim()
            : "";

    /* -----------------------------------------------------
       VALIDATION
       ----------------------------------------------------- */

    if (firstName.length === 0) {
        showAlert(
            "First name is required.",
            "warning"
        );

        return;
    }

    if (firstName.length < 2) {
        showAlert(
            "First name must contain at least 2 characters.",
            "warning"
        );

        return;
    }

    if (saveButton) {
        saveButton.disabled =
            true;

        saveButton.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-2"
            ></span>
            Saving...
        `;
    }

    try {
        const response =
            await apiRequest(
                "/users/me/",
                {
                    method: "PATCH",

                    body:
                        JSON.stringify({
                            first_name:
                                firstName,

                            last_name:
                                lastName
                        })
                }
            );

        if (!response) {
            return;
        }

        const data =
            await response.json()
                .catch(() => ({}));

        console.log(
            "Update response:",
            response.status,
            data
        );

        /* -------------------------------------------------
           SUCCESS
           ------------------------------------------------- */

        if (response.ok) {
            window.currentUser =
                data;

            localStorage.setItem(
                "user",
                JSON.stringify(data)
            );

            renderProfile(data);

            showAlert(
                "Profile updated successfully!",
                "success"
            );
        } else {
            console.error(
                "Profile update failed:",
                data
            );

            let message =
                "Unable to update profile.";

            if (data.detail) {
                message =
                    data.detail;
            } else if (
                data.first_name
            ) {
                message =
                    Array.isArray(
                        data.first_name
                    )
                        ? data.first_name[0]
                        : data.first_name;
            } else if (
                data.last_name
            ) {
                message =
                    Array.isArray(
                        data.last_name
                    )
                        ? data.last_name[0]
                        : data.last_name;
            }

            showAlert(
                message,
                "danger"
            );
        }
    } catch (error) {
        console.error(
            "Update profile error:",
            error
        );

        showAlert(
            "Unable to connect to the server.",
            "danger"
        );
    } finally {
        if (saveButton) {
            saveButton.disabled =
                false;

            saveButton.innerHTML = `
                <i class="fa-solid fa-floppy-disk"></i>
                Save Changes
            `;
        }
    }
}

/* =========================================================
   ALERT
   ========================================================= */

function showAlert(message, type) {
    const alert =
        document.getElementById(
            "profileAlert"
        );

    if (!alert) {
        return;
    }

    alert.className =
        `alert alert-${type}`;

    alert.textContent =
        message;

    alert.classList.remove(
        "d-none"
    );

    if (type === "success") {
        setTimeout(
            function () {
                alert.classList.add(
                    "d-none"
                );
            },
            4000
        );
    }
}

/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogout() {
    [
        "logoutBtn",
        "logoutBottomBtn"
    ].forEach(function (id) {
        const button =
            document.getElementById(id);

        if (!button) {
            return;
        }

        button.addEventListener(
            "click",
            function () {
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
    });
}

