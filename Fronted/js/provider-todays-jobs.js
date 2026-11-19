// ============================================================
// OneClick - Provider Today's Jobs
// ============================================================

const API_BASE =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000/api"
        : "https://oneclick-backend-6hk7.onrender.com/api";


// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    initializePage();
});


// ============================================================
// AUTH
// ============================================================

function getAccessToken() {
    return localStorage.getItem("access_token");
}


// ============================================================
// REFRESH ACCESS TOKEN
// ============================================================

async function refreshAccessToken() {

    const refreshToken =
        localStorage.getItem("refresh_token");

    if (!refreshToken) {
        return false;
    }

    try {

        const response =
            await fetch(
                `${API_BASE}/users/token/refresh/`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        refresh: refreshToken
                    })
                }
            );

        if (!response.ok) {
            return false;
        }

        const data =
            await response.json();

        if (!data.access) {
            return false;
        }

        localStorage.setItem(
            "access_token",
            data.access
        );

        return true;

    } catch (error) {

        console.error(
            "Token refresh error:",
            error
        );

        return false;
    }
}


// ============================================================
// AUTHENTICATED FETCH
// ============================================================

async function authenticatedFetch(
    url,
    options = {}
) {

    const token =
        getAccessToken();

    const headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
    };

    let response =
        await fetch(
            url,
            {
                ...options,
                headers: headers
            }
        );


    // Access token expired
    if (response.status === 401) {

        const refreshed =
            await refreshAccessToken();

        if (!refreshed) {

            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "refresh_token"
            );

            window.location.href =
                "login.html";

            return null;
        }


        // Get new token
        const newToken =
            getAccessToken();

        response =
            await fetch(
                url,
                {
                    ...options,

                    headers: {
                        ...(options.headers || {}),
                        Authorization:
                            `Bearer ${newToken}`
                    }
                }
            );
    }

    return response;
}


// ============================================================
// INITIALIZE PAGE
// ============================================================

async function initializePage() {

    const token =
        getAccessToken();

    if (!token) {

        window.location.href =
            "login.html";

        return;
    }


    setupSidebar();

    setupLogout();

    setActiveNav();


    const todayDateElement =
        document.getElementById(
            "todayDate"
        );


    if (todayDateElement) {

        todayDateElement.textContent =
            formatDisplayDate(
                getTodayDateString()
            );
    }


    await loadProviderInfo();

    await loadTodaysJobs();
}


// ============================================================
// PROVIDER INFO
// ============================================================

async function loadProviderInfo() {

    try {

        const response =
            await authenticatedFetch(
                `${API_BASE}/providers/dashboard/`
            );


        if (!response) {
            return;
        }


        if (!response.ok) {

            throw new Error(
                "Failed to load provider information"
            );
        }


        const data =
            await response.json();


        const provider =
            data.provider ||
            data;


        const providerNameElement =
            document.getElementById(
                "providerName"
            );


        if (providerNameElement) {

            providerNameElement.textContent =
                provider.full_name ||
                provider.name ||
                "Provider";
        }


        window.oneClickProvider =
            provider;


    } catch (error) {

        console.error(
            "Provider info error:",
            error
        );
    }
}


// ============================================================
// LOAD PROVIDER BOOKINGS
// ============================================================

async function loadTodaysJobs() {

    const container =
        document.getElementById(
            "todayScheduleTimeline"
        );


    if (!container) {
        return;
    }


    try {

        const response =
            await authenticatedFetch(
                `${API_BASE}/bookings/provider/`
            );


        if (!response) {
            return;
        }


        if (!response.ok) {

            throw new Error(
                `Failed to load provider bookings (${response.status})`
            );
        }


        const data =
            await response.json();


        const bookings =
            Array.isArray(data)
                ? data
                : (data.results || []);


        console.log(
            "Provider booking details:",
            bookings.map(booking => ({
                id: booking.id,
                status: booking.status,
                booking_date: booking.booking_date,
                booking_time: booking.booking_time
            }))
        );


        renderTodaysJobs(
            bookings
        );


    } catch (error) {

        console.error(
            "Today's jobs error:",
            error
        );


        container.innerHTML = `

            <div class="empty-state">

                <i
                    class="fas fa-exclamation-circle"
                ></i>

                <h5>
                    Unable to load today's jobs
                </h5>

                <p>
                    Please refresh the page and try again.
                </p>

            </div>

        `;
    }
}


// ============================================================
// RENDER MY JOBS
// ============================================================

function renderTodaysJobs(bookings) {

    const container = document.getElementById(
        "todayScheduleTimeline"
    );

    if (!container) return;

    const today = getTodayDateString();

    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);

    const tomorrow = [
        tomorrowDate.getFullYear(),
        String(tomorrowDate.getMonth() + 1).padStart(2, "0"),
        String(tomorrowDate.getDate()).padStart(2, "0")
    ].join("-");

    const groups = {
        overdue: [],
        today: [],
        tomorrow: [],
        upcoming: []
    };

    bookings.forEach(booking => {

        const status = String(
            booking.status || ""
        ).toLowerCase();

        // My Jobs only shows accepted and in-progress jobs.
        if (
    status !== "accepted" &&
    status !== "on_the_way" &&
    status !== "in_progress"
) {
    return;
}

        const bookingDate = String(
            booking.booking_date ||
            booking.bookingDate ||
            booking.date ||
            ""
        ).substring(0, 10);

        if (!bookingDate) return;

        if (bookingDate < today) {
            groups.overdue.push(booking);
        } else if (bookingDate === today) {
            groups.today.push(booking);
        } else if (bookingDate === tomorrow) {
            groups.tomorrow.push(booking);
        } else {
            groups.upcoming.push(booking);
        }
    });

    // Sort every group by scheduled date and time.
    Object.values(groups).forEach(group => {
        group.sort((a, b) => {

            const dateA = String(
                a.booking_date || a.bookingDate || a.date || ""
            );

            const dateB = String(
                b.booking_date || b.bookingDate || b.date || ""
            );

            if (dateA !== dateB) {
                return dateA.localeCompare(dateB);
            }

            return String(
                a.booking_time || a.bookingTime || ""
            ).localeCompare(
                String(b.booking_time || b.bookingTime || "")
            );
        });
    });

    const sections = [
        {
            key: "overdue",
            title: "Past Due Jobs",
            icon: "fa-exclamation-circle"
        },
        {
            key: "today",
            title: "Today",
            icon: "fa-calendar-day"
        },
        {
            key: "tomorrow",
            title: "Tomorrow",
            icon: "fa-calendar-check"
        },
        {
            key: "upcoming",
            title: "Upcoming",
            icon: "fa-calendar-alt"
        }
    ];

    const hasJobs = Object.values(groups).some(
        group => group.length > 0
    );

    if (!hasJobs) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-check"></i>
                <h5>No active jobs</h5>
                <p>
                    Your accepted and in-progress jobs
                    will appear here.
                </p>
            </div>
        `;
        return;
    }

    container.innerHTML = sections
        .filter(section => groups[section.key].length > 0)
        .map(section => `
            <section class="my-jobs-section mb-4">

                <h4 class="mb-3">
                    <i class="fas ${section.icon} me-2"></i>
                    ${section.title}
                    <span class="text-muted">
                        (${groups[section.key].length})
                    </span>
                </h4>

                ${groups[section.key]
                    .map(createTodayJobItem)
                    .join("")}

            </section>
        `)
        .join("");

    setupMyJobButtons();
}


// ============================================================
// JOB CARD
// ============================================================

function createTodayJobItem(booking) {

    const customerName =
        booking.customer_name ||
        booking.customer ||
        "Customer";

    const serviceName =
        booking.service_name ||
        booking.service ||
        "Service";

    const bookingDate = String(
        booking.booking_date ||
        booking.bookingDate ||
        booking.date ||
        ""
    ).substring(0, 10);

    const bookingTime =
        booking.booking_time ||
        booking.bookingTime ||
        "";

    const address =
        booking.address ||
        "Address not provided";

    const status = String(
        booking.status || "accepted"
    ).toLowerCase();

    const scheduledDateTime = new Date(
        `${bookingDate}T${bookingTime}`
    );

    const startAllowed =
        status === "accepted" &&
        !Number.isNaN(scheduledDateTime.getTime()) &&
        new Date() >= scheduledDateTime;

    let actionButton = "";

if (status === "accepted" && startAllowed) {

    actionButton = `
        <button
            type="button"
            class="btn btn-success btn-sm mt-2 my-job-action"
            data-action="start"
            data-booking-id="${escapeHtml(booking.id)}"
        >
            <i class="fas fa-play"></i>
            Start Job
        </button>
    `;

} else if (status === "accepted") {

    actionButton = `
        <p class="text-muted small mt-2 mb-0">
            <i class="far fa-clock"></i>
            Available at scheduled time
        </p>
    `;

} else if (status === "on_the_way") {

    actionButton = `
        <button
            type="button"
            class="btn btn-primary btn-sm mt-2 my-job-action"
            data-action="service"
            data-booking-id="${escapeHtml(booking.id)}"
        >
            <i class="fas fa-tools"></i>
            Start Service
        </button>
    `;

} else if (status === "in_progress") {

   
        actionButton = `
            <button
                type="button"
                class="btn btn-primary btn-sm mt-2 my-job-action"
                data-action="complete"
                data-booking-id="${escapeHtml(booking.id)}"
            >
                <i class="fas fa-check"></i>
                Job Completed
            </button>
        `;
    }

    return `
        <div class="today-job-item">

            <div class="job-time">
                <i class="far fa-clock"></i>

                <span>
                    ${escapeHtml(formatJobDate(bookingDate))}
                </span>

                <strong>
                    ${escapeHtml(
                        bookingTime
                            ? String(bookingTime).slice(0, 5)
                            : "Time not specified"
                    )}
                </strong>
            </div>

            <div class="job-details">

                <h5>
                    ${escapeHtml(String(serviceName))}
                </h5>

                <p>
                    <i class="fas fa-user"></i>
                    ${escapeHtml(String(customerName))}
                </p>

                <p>
                    <i class="fas fa-map-marker-alt"></i>
                    ${escapeHtml(String(address))}
                </p>

            </div>

            <div class="job-status">

                <span class="status-badge ${escapeHtml(status)}">
                    ${escapeHtml(capitalize(status.replace("_", " ")))}
                </span>

                ${actionButton}

            </div>

        </div>
    `;
}


// ============================================================
// MY JOB BUTTON EVENTS
// ============================================================
function setupMyJobButtons() {
    document.querySelectorAll(".my-job-action")
        .forEach(button => {
            button.addEventListener("click", async function () {
                const bookingId = button.dataset.bookingId;
                const action = button.dataset.action;

                if (!bookingId || !action) return;

                if (action === "start") {
                    const confirmed = confirm(
                        "Are you ready to travel to the customer?"
                    );

                    if (!confirmed) return;

                    await updateMyJobStatus(
                        bookingId,
                        "on_the_way",
                        button
                    );

                } else if (action === "service") {
                    const confirmed = confirm(
                        "Have you arrived? Start the service now?"
                    );

                    if (!confirmed) return;

                    await updateMyJobStatus(
                        bookingId,
                        "in_progress",
                        button
                    );

                } else if (action === "complete") {
                    const confirmed = confirm(
                        "Are you sure this service has been completed?"
                    );

                    if (!confirmed) return;

                    await updateMyJobStatus(
                        bookingId,
                        "completed",
                        button
                    );
                }
            });
        });
}



// ============================================================
// UPDATE JOB STATUS
// ============================================================

async function updateMyJobStatus(
    bookingId,
    newStatus,
    button
) {

    const originalHTML = button.innerHTML;

    button.disabled = true;

    button.innerHTML =
        newStatus === "on_the_way"
            ? '<i class="fas fa-spinner fa-spin"></i> Starting Journey...'
            : newStatus === "in_progress"
                ? '<i class="fas fa-spinner fa-spin"></i> Starting Service...'
                : '<i class="fas fa-spinner fa-spin"></i> Completing...';

    try {

        const response = await authenticatedFetch(
            `${API_BASE}/bookings/provider/${bookingId}/`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: newStatus
                })
            }
        );

        if (!response) return;

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.detail ||
                data.error ||
                "Unable to update booking."
            );
        }

        // Start or resume GPS tracking during both stages.
        if (
            newStatus === "on_the_way" ||
            newStatus === "in_progress"
        ) {
            startMyJobLocationTracking(bookingId);
        }

        // Stop GPS only after job completion.
        if (newStatus === "completed") {
            stopMyJobLocationTracking(bookingId);
        }

        alert(
            newStatus === "on_the_way"
                ? "Journey started! Your location is now being shared."
                : newStatus === "in_progress"
                    ? "Service started successfully."
                    : "Job completed successfully."
        );

        await loadTodaysJobs();

    } catch (error) {

        console.error("My Jobs status update error:", error);

        alert(error.message || "Something went wrong.");

        button.disabled = false;
        button.innerHTML = originalHTML;
    }
}


// ============================================================
// MY JOBS LIVE GPS TRACKING
// ============================================================

let myJobsLocationWatchId = null;
let myJobsTrackingBookingId = null;


function startMyJobLocationTracking(bookingId) {

    if (!navigator.geolocation) {
        alert("GPS is not supported by this browser.");
        return;
    }

    if (myJobsLocationWatchId !== null) {
        navigator.geolocation.clearWatch(
            myJobsLocationWatchId
        );
    }

    const token = getAccessToken();

    if (!token) {
        alert("Please login again.");
        return;
    }

    myJobsTrackingBookingId = bookingId;

    myJobsLocationWatchId =
        navigator.geolocation.watchPosition(

            async function (position) {

                // Ignore updates if another job has become active.
                if (
                    String(myJobsTrackingBookingId) !==
                    String(bookingId)
                ) {
                    return;
                }

                try {

                    const response = await authenticatedFetch(
                        `${API_BASE}/bookings/provider/${bookingId}/location/`,
                        {
                            method: "PATCH",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                provider_latitude:
                                    position.coords.latitude,
                                provider_longitude:
                                    position.coords.longitude
                            })
                        }
                    );

                    if (response && !response.ok) {
                        console.error(
                            "Provider GPS update failed:",
                            await response.text()
                        );
                    }

                } catch (error) {
                    console.error(
                        "Provider GPS update error:",
                        error
                    );
                }
            },

            function (error) {
                console.error("GPS error:", error.message);

                alert(
                    "Unable to access your location. Please enable location permission."
                );
            },

            {
                enableHighAccuracy: true,
                maximumAge: 3000,
                timeout: 15000
            }
        );

    console.log(
        "My Jobs GPS tracking started:",
        bookingId
    );
}


function stopMyJobLocationTracking(bookingId) {

    if (
        String(myJobsTrackingBookingId) !==
        String(bookingId)
    ) {
        return;
    }

    if (myJobsLocationWatchId !== null) {
        navigator.geolocation.clearWatch(
            myJobsLocationWatchId
        );
    }

    myJobsLocationWatchId = null;
    myJobsTrackingBookingId = null;

    console.log("My Jobs GPS tracking stopped.");
}

// ============================================================
// SIDEBAR
// ============================================================

function setupSidebar() {

    const toggle =
        document.getElementById(
            "sidebarToggle"
        );


    const sidebar =
        document.querySelector(
            ".sidebar"
        );


    if (!toggle || !sidebar) {
        return;
    }


    toggle.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "active"
            );

        }
    );

}


// ============================================================
// ACTIVE NAV
// ============================================================

function setActiveNav() {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop();


    document
        .querySelectorAll(
            ".nav-link"
        )
        .forEach(
            link => {

                const href =
                    link.getAttribute(
                        "href"
                    );


                if (!href) {
                    return;
                }


                const linkPage =
                    href
                        .split("/")
                        .pop()
                        .split("#")[0];


                link.classList.remove(
                    "active"
                );


                if (
                    linkPage ===
                    currentPage
                ) {

                    link.classList.add(
                        "active"
                    );

                }

            }
        );

}


// ============================================================
// LOGOUT
// ============================================================

function setupLogout() {

    const logoutLink =
        document.getElementById(
            "logoutBtn"
        );


    if (!logoutLink) {
        return;
    }


    logoutLink.addEventListener(
        "click",
        event => {

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


// ============================================================
// DATE HELPERS
// ============================================================

function getTodayDateString() {

    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


// ============================================================
// FORMAT PAGE DATE
// ============================================================

function formatDisplayDate(dateValue) {

    if (!dateValue) {
        return "Today";
    }


    const date =
        new Date(
            `${dateValue}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateValue;

    }


    return date.toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    );

}


// ============================================================
// FORMAT JOB DATE
// ============================================================

function formatJobDate(dateValue) {

    if (!dateValue) {
        return "Date not specified";
    }


    const normalizedDate =
        String(
            dateValue
        ).substring(
            0,
            10
        );


    const date =
        new Date(
            `${normalizedDate}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return normalizedDate;

    }


    return date.toLocaleDateString(
        "en-US",
        {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );

}


// ============================================================
// HELPERS
// ============================================================

function capitalize(value) {

    if (!value) {
        return "";
    }


    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}


function escapeHtml(value) {

    return String(value)

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
