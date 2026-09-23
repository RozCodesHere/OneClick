/* ==========================================================
   OneClick — Notifications Page JS

   Current state:
   - No notification API is connected yet.
   - No fake notification data.
   - Empty state is shown safely.
   - Navigation works.
   ========================================================== */


document.addEventListener("DOMContentLoaded", function () {

    /* ======================================================
       AUTHENTICATION
       ====================================================== */

    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
        window.location.href = "login.html";
        return;
    }


    /* ======================================================
       ELEMENTS
       ====================================================== */

    const listEl =
        document.getElementById("notificationList");

    const emptyStateEl =
        document.getElementById("emptyState");

    const markAllReadBtn =
        document.getElementById("markAllReadBtn");

    const navUnreadBadge =
        document.getElementById("navUnreadBadge");

    const summaryTotal =
        document.getElementById("summaryTotal");

    const summaryUnread =
        document.getElementById("summaryUnread");

    const summaryBooking =
        document.getElementById("summaryBooking");

    const summaryPayment =
        document.getElementById("summaryPayment");

    const backToDashboardBtn =
        document.getElementById("backToDashboardBtn");

    const viewBookingHistoryBtn =
        document.getElementById(
            "viewBookingHistoryBtn"
        );

    const bookingsNavLink =
        document.getElementById("bookingsNavLink");

    const profileNavLink =
        document.getElementById("profileNavLink");


    /* ======================================================
       REAL NOTIFICATIONS ONLY

       Keep this empty until the notification backend/API
       is implemented.

       DO NOT put fake bookings, payments or messages here.
       ====================================================== */

    const NOTIFICATIONS = [];


    let currentFilter = "all";


    /* ======================================================
       RENDER NOTIFICATIONS
       ====================================================== */

    function renderNotifications() {

        if (!listEl || !emptyStateEl) {
            return;
        }


        let filteredNotifications = NOTIFICATIONS;


        /* ---------- Apply Filter ---------- */

        if (currentFilter === "unread") {

            filteredNotifications =
                NOTIFICATIONS.filter(function (notification) {
                    return notification.unread === true;
                });

        } else if (currentFilter !== "all") {

            filteredNotifications =
                NOTIFICATIONS.filter(function (notification) {
                    return notification.type === currentFilter;
                });

        }


        /* ---------- Clear List ---------- */

        listEl.innerHTML = "";


        /* ---------- Empty State ---------- */

        if (filteredNotifications.length === 0) {

            listEl.classList.add("d-none");

            emptyStateEl.classList.remove("d-none");

        } else {

            listEl.classList.remove("d-none");

            emptyStateEl.classList.add("d-none");


            filteredNotifications.forEach(
                function (notification, index) {

                    listEl.appendChild(
                        buildNotificationCard(
                            notification,
                            index
                        )
                    );

                }
            );

        }


        updateSummary();

        updateNavBadge();
    }


    /* ======================================================
       BUILD NOTIFICATION CARD
       ====================================================== */

    function buildNotificationCard(
        notification,
        index
    ) {

        const card =
            document.createElement("div");


        card.className =
            "notification-card " +
            (
                notification.unread
                    ? "unread"
                    : "read"
            );


        card.style.animationDelay =
            (index * 0.05) + "s";


        card.dataset.id =
            notification.id || "";


        const type =
            notification.type || "system";


        const iconClass =
            getNotificationIcon(type);


        card.innerHTML = `
            <div class="notif-icon type-${escapeHtml(type)}">

                <i class="${iconClass}"></i>

            </div>


            <div class="notif-body">

                <div class="notif-top-row">

                    <span class="notif-title">

                        ${escapeHtml(
                            notification.title
                        )}

                        ${
                            notification.unread
                                ? '<span class="unread-dot"></span>'
                                : ""
                        }

                    </span>

                </div>


                <p class="notif-desc">

                    ${escapeHtml(
                        notification.description
                    )}

                </p>


                <div class="notif-meta">

                    <span class="notif-time">

                        <i
                            class="fa-regular fa-clock me-1"
                        ></i>

                        ${escapeHtml(
                            notification.time
                        )}

                    </span>


                    ${
                        notification.status
                            ? `
                                <span
                                    class="notif-status ${
                                        escapeHtml(
                                            notification.status.cls || "info"
                                        )
                                    }"
                                >
                                    ${escapeHtml(
                                        notification.status.label || ""
                                    )}
                                </span>
                            `
                            : ""
                    }

                </div>

            </div>


            <div class="notif-actions">

                <button
                    type="button"
                    class="notif-action-btn view"
                    data-action="view"
                >
                    <i class="fa-regular fa-eye me-1"></i>
                    View
                </button>


                <button
                    type="button"
                    class="notif-action-btn delete"
                    data-action="delete"
                >
                    <i class="fa-regular fa-trash-can me-1"></i>
                    Delete
                </button>

            </div>
        `;


        /* ==================================================
           MARK AS READ WHEN CARD IS CLICKED
           ================================================== */

        card.addEventListener(
            "click",
            function (event) {

                if (
                    !event.target.closest(
                        ".notif-action-btn"
                    )
                ) {

                    markAsRead(
                        notification.id
                    );

                }

            }
        );


        /* ==================================================
           VIEW BUTTON
           ================================================== */

        const viewButton =
            card.querySelector(
                '[data-action="view"]'
            );


        if (viewButton) {

            viewButton.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

                    markAsRead(
                        notification.id
                    );

                }
            );

        }


        /* ==================================================
           DELETE BUTTON
           ================================================== */

        const deleteButton =
            card.querySelector(
                '[data-action="delete"]'
            );


        if (deleteButton) {

            deleteButton.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

                    deleteNotification(
                        notification.id
                    );

                }
            );

        }


        return card;
    }


    /* ======================================================
       GET NOTIFICATION ICON
       ====================================================== */

    function getNotificationIcon(type) {

        switch (type) {

            case "booking":
                return "fa-solid fa-calendar-check";

            case "payment":
                return "fa-solid fa-credit-card";

            case "message":
                return "fa-solid fa-message";

            case "alert":
                return "fa-solid fa-triangle-exclamation";

            case "offer":
                return "fa-solid fa-tag";

            case "system":
            default:
                return "fa-solid fa-bell";
        }

    }


    /* ======================================================
       MARK ONE NOTIFICATION AS READ
       ====================================================== */

    function markAsRead(id) {

        const notification =
            NOTIFICATIONS.find(
                function (item) {
                    return item.id === id;
                }
            );


        if (
            notification &&
            notification.unread
        ) {

            notification.unread = false;

            renderNotifications();

        }

    }


    /* ======================================================
       DELETE NOTIFICATION
       ====================================================== */

    function deleteNotification(id) {

        const index =
            NOTIFICATIONS.findIndex(
                function (item) {
                    return item.id === id;
                }
            );


        if (index !== -1) {

            NOTIFICATIONS.splice(index, 1);

            renderNotifications();

        }

    }


    /* ======================================================
       MARK ALL READ
       ====================================================== */

    function markAllAsRead() {

        NOTIFICATIONS.forEach(
            function (notification) {

                notification.unread = false;

            }
        );


        renderNotifications();

    }


    /* ======================================================
       SUMMARY
       ====================================================== */

    function updateSummary() {

        const total =
            NOTIFICATIONS.length;


        const unread =
            NOTIFICATIONS.filter(
                function (notification) {
                    return notification.unread === true;
                }
            ).length;


        const booking =
            NOTIFICATIONS.filter(
                function (notification) {
                    return notification.type === "booking";
                }
            ).length;


        const payment =
            NOTIFICATIONS.filter(
                function (notification) {
                    return notification.type === "payment";
                }
            ).length;


        if (summaryTotal) {
            summaryTotal.textContent = total;
        }


        if (summaryUnread) {
            summaryUnread.textContent = unread;
        }


        if (summaryBooking) {
            summaryBooking.textContent = booking;
        }


        if (summaryPayment) {
            summaryPayment.textContent = payment;
        }

    }


    /* ======================================================
       NAVBAR UNREAD BADGE
       ====================================================== */

    function updateNavBadge() {

        if (!navUnreadBadge) {
            return;
        }


        const unread =
            NOTIFICATIONS.filter(
                function (notification) {
                    return notification.unread === true;
                }
            ).length;


        if (unread > 0) {

            navUnreadBadge.textContent = unread;

            navUnreadBadge.classList.remove("d-none");

        } else {

            navUnreadBadge.textContent = "0";

            navUnreadBadge.classList.add("d-none");

        }

    }


    /* ======================================================
       FILTER TABS
       ====================================================== */

    function setupFilterTabs() {

        const tabs =
            document.querySelectorAll(
                ".filter-tab"
            );


        tabs.forEach(
            function (tab) {

                tab.addEventListener(
                    "click",
                    function () {

                        tabs.forEach(
                            function (item) {

                                item.classList.remove(
                                    "active"
                                );

                            }
                        );


                        tab.classList.add("active");


                        currentFilter =
                            tab.dataset.filter ||
                            "all";


                        renderNotifications();

                    }
                );

            }
        );

    }


    /* ======================================================
       LOGOUT
       ====================================================== */

    function setupLogout() {

        const logoutButtons =
            document.querySelectorAll(
                ".btn-logout, .js-logout"
            );


        logoutButtons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();


                        localStorage.removeItem(
                            "access_token"
                        );

                        localStorage.removeItem(
                            "refresh_token"
                        );

                        localStorage.removeItem(
                            "oneClickCustomer"
                        );


                        window.location.href =
                            "login.html";

                    }
                );

            }
        );

    }


    /* ======================================================
       DASHBOARD NAVIGATION
       ====================================================== */

    function setupDashboardNavigation() {

        if (backToDashboardBtn) {

            backToDashboardBtn.addEventListener(
                "click",
                function () {

                    window.location.href =
                        "customer-dashboard.html";

                }
            );

        }

    }


    /* ======================================================
       BOOKING NAVIGATION
       
       IMPORTANT:
       The current customer dashboard does not yet contain
       an actual #bookings section.

       Therefore we safely send the user to the dashboard
       instead of using a dead #bookings anchor.
       ====================================================== */

    function setupBookingNavigation() {

        if (bookingsNavLink) {

            bookingsNavLink.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    window.location.href =
                        "customer-dashboard.html";

                }
            );

        }


        if (viewBookingHistoryBtn) {

            viewBookingHistoryBtn.addEventListener(
                "click",
                function () {

                    window.location.href =
                        "customer-dashboard.html";

                }
            );

        }

    }


    /* ======================================================
       PROFILE NAVIGATION

       The current dashboard has a profile DROPDOWN in the
       navbar, but not a separate #profile page/section.

       Therefore we safely return to the dashboard.
       ====================================================== */

    function setupProfileNavigation() {

        if (profileNavLink) {

            profileNavLink.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    window.location.href =
                        "customer-dashboard.html";

                }
            );

        }

    }


    /* ======================================================
       SAFE HTML
       ====================================================== */

    function escapeHtml(value) {

        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }


    /* ======================================================
       BUTTON EVENTS
       ====================================================== */

    if (markAllReadBtn) {

        markAllReadBtn.addEventListener(
            "click",
            function () {

                markAllAsRead();

            }
        );

    }


    /* ======================================================
       INITIALIZE
       ====================================================== */

    setupFilterTabs();

    setupLogout();

    setupDashboardNavigation();

    setupBookingNavigation();

    setupProfileNavigation();

    renderNotifications();

});