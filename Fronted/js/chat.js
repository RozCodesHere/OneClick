/* ==========================================================
   OneClick — Messages / Chat Page JS

   Real-data ready version.
   No dummy conversations or fake replies.

   Messaging backend is not connected yet, so the page
   displays an honest empty state until real conversations
   are available.
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ======================================================
       STATE
       ====================================================== */

    let activeConvoId = null;

    /* ======================================================
       ELEMENTS
       ====================================================== */

    const conversationListEl =
        document.getElementById("conversationList");

    const convoSearchEl =
        document.getElementById("convoSearch");

    const chatEmptyStateEl =
        document.getElementById("chatEmptyState");

    const chatActiveEl =
        document.getElementById("chatActive");

    const chatMessagesEl =
        document.getElementById("chatMessages");

    const chatNameEl =
        document.getElementById("chatName");

    const chatStatusTextEl =
        document.getElementById("chatStatusText");

    const chatStatusDotEl =
        document.getElementById("chatStatusDot");

    const chatAvatarEl =
        document.getElementById("chatAvatar");

    const messageInputEl =
        document.getElementById("messageInput");

    const sendMessageBtn =
        document.getElementById("sendMessageBtn");

    const conversationPanelEl =
        document.getElementById("conversationPanel");

    const chatWindowEl =
        document.getElementById("chatWindow");

    const chatBackBtn =
        document.getElementById("chatBackBtn");

    const infoPanelEl =
        document.getElementById("infoPanel");

    const infoToggleBtn =
        document.getElementById("infoToggleBtn");

    const infoCloseBtn =
        document.getElementById("infoCloseBtn");

    const headerSearch =
        document.getElementById("headerSearch");


    /* ======================================================
       CHECK LOGIN
       ====================================================== */

    const accessToken =
        localStorage.getItem("access_token");

    if (!accessToken) {
        window.location.href = "login.html";
        return;
    }


    /* ======================================================
       EMPTY CONVERSATION STATE
       ====================================================== */

    function showNoConversations() {

        if (!conversationListEl) return;

        conversationListEl.innerHTML = `
            <div class="text-center text-muted py-5 px-3">

                <div class="mb-3">
                    <i
                        class="fa-regular fa-comments"
                        style="font-size: 2.2rem; opacity: 0.5;"
                    ></i>
                </div>

                <h6 class="mb-2">
                    No conversations yet
                </h6>

                <p class="mb-0" style="font-size: 0.85rem;">
                    Your conversations with service providers
                    will appear here.
                </p>

            </div>
        `;
    }


    /* ======================================================
       HIDE ACTIVE CHAT
       ====================================================== */

    function showEmptyChat() {

        if (chatActiveEl) {
            chatActiveEl.classList.add("d-none");
        }

        if (chatEmptyStateEl) {
            chatEmptyStateEl.classList.remove("d-none");
        }

        activeConvoId = null;
    }


    /* ======================================================
       CONVERSATION SEARCH
       ====================================================== */

    function setupSearch() {

        if (convoSearchEl) {

            convoSearchEl.addEventListener("input", () => {

                /*
                 * There are currently no real conversations
                 * to filter.
                 *
                 * When the messaging API is connected,
                 * this will filter the real conversation list.
                 */

                const query =
                    convoSearchEl.value.trim();

                if (query === "") {
                    showNoConversations();
                    return;
                }

                conversationListEl.innerHTML = `
                    <div class="text-center text-muted py-5 px-3">

                        <div class="mb-3">
                            <i
                                class="fa-solid fa-magnifying-glass"
                                style="font-size: 1.6rem; opacity: 0.5;"
                            ></i>
                        </div>

                        <h6 class="mb-2">
                            No conversations found
                        </h6>

                        <p class="mb-0" style="font-size: 0.85rem;">
                            No conversation matches
                            "${escapeHtml(query)}".
                        </p>

                    </div>
                `;
            });
        }


        /*
         * Header search mirrors conversation search.
         */

        if (headerSearch) {

            headerSearch.addEventListener("input", () => {

                if (convoSearchEl) {
                    convoSearchEl.value =
                        headerSearch.value;
                }

                if (headerSearch.value.trim() === "") {
                    showNoConversations();
                    return;
                }

                if (conversationListEl) {

                    const query =
                        headerSearch.value.trim();

                    conversationListEl.innerHTML = `
                        <div class="text-center text-muted py-5 px-3">

                            <div class="mb-3">
                                <i
                                    class="fa-solid fa-magnifying-glass"
                                    style="font-size: 1.6rem; opacity: 0.5;"
                                ></i>
                            </div>

                            <h6 class="mb-2">
                                No conversations found
                            </h6>

                            <p class="mb-0" style="font-size: 0.85rem;">
                                No conversation matches
                                "${escapeHtml(query)}".
                            </p>

                        </div>
                    `;
                }
            });
        }
    }


    /* ======================================================
       SEND MESSAGE

       Backend is not connected yet.
       Do NOT fake-send messages.
       ====================================================== */

    function sendMessage() {

        if (!messageInputEl) return;

        const text =
            messageInputEl.value.trim();

        if (!text) return;

        if (activeConvoId === null) {

            alert(
                "Please select a conversation first."
            );

            return;
        }

        /*
         * Real message sending will be connected here
         * when the backend messaging endpoint exists.
         */

        console.log(
            "Message sending is not connected yet:",
            text
        );
    }


    /* ======================================================
       COMPOSER
       ====================================================== */

    function setupComposer() {

        if (sendMessageBtn) {
            sendMessageBtn.addEventListener(
                "click",
                sendMessage
            );
        }

        if (messageInputEl) {

            messageInputEl.addEventListener(
                "keydown",
                (event) => {

                    if (event.key === "Enter") {

                        event.preventDefault();

                        sendMessage();
                    }
                }
            );
        }
    }


    /* ======================================================
       MOBILE BACK BUTTON
       ====================================================== */

    function setupMobileBack() {

        if (!chatBackBtn) return;

        chatBackBtn.addEventListener(
            "click",
            () => {

                if (conversationPanelEl) {
                    conversationPanelEl.classList.remove(
                        "hide-mobile"
                    );
                }

                if (chatWindowEl) {
                    chatWindowEl.classList.remove(
                        "show-mobile"
                    );
                }

            }
        );
    }


    /* ======================================================
       INFO PANEL
       ====================================================== */

    function setupInfoPanelToggle() {

        if (infoToggleBtn && infoPanelEl) {

            infoToggleBtn.addEventListener(
                "click",
                () => {

                    infoPanelEl.classList.toggle(
                        "open"
                    );

                }
            );
        }


        if (infoCloseBtn && infoPanelEl) {

            infoCloseBtn.addEventListener(
                "click",
                () => {

                    infoPanelEl.classList.remove(
                        "open"
                    );

                }
            );
        }
    }


    /* ======================================================
       QUICK ACTIONS
       ====================================================== */

    function setupQuickActions() {

        const viewBookingBtn =
            document.getElementById("viewBookingBtn");

        const makePaymentBtn =
            document.getElementById("makePaymentBtn");

        const leaveReviewBtn =
            document.getElementById("leaveReviewBtn");

        const reportIssueBtn =
            document.getElementById("reportIssueBtn");


        if (viewBookingBtn) {

            viewBookingBtn.addEventListener(
                "click",
                () => {
                    window.location.href = "booking.html";
                }
            );

        }


        if (makePaymentBtn) {

            makePaymentBtn.addEventListener(
                "click",
                () => {
                    window.location.href = "payment.html";
                }
            );

        }


        if (leaveReviewBtn) {

            leaveReviewBtn.addEventListener(
                "click",
                () => {
                    window.location.href = "review.html";
                }
            );

        }


        if (reportIssueBtn) {

            reportIssueBtn.addEventListener(
                "click",
                () => {
                    window.location.href = "report-issue.html";
                }
            );

        }

    }


    /* ======================================================
       LOGOUT
       ====================================================== */

    function setupLogout() {

        const logoutButtons =
            document.querySelectorAll(
                ".btn-logout, .js-logout"
            );

        logoutButtons.forEach((button) => {

            button.addEventListener(
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
                        "oneClickCustomer"
                    );

                    window.location.href =
                        "login.html";
                }
            );

        });
    }


    /* ======================================================
       ESCAPE HTML
       ====================================================== */

    function escapeHtml(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* ======================================================
       INITIALIZE
       ====================================================== */

    showNoConversations();

    showEmptyChat();

    setupSearch();

    setupComposer();

    setupMobileBack();

    setupInfoPanelToggle();

    setupQuickActions();

    setupLogout();

});