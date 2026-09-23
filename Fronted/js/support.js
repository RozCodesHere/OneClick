/* =========================================================
OneClick · Help & Support Page
Real API-connected support system
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

/* =========================================================
   API CONFIGURATION
   ========================================================= */

const API_BASE_URL = "http://127.0.0.1:8000/api";
const SUPPORT_API_URL = `${API_BASE_URL}/support/tickets/`;

const accessToken = localStorage.getItem("access_token");


/* =========================================================
   TOAST HELPER
   ========================================================= */

const toast = document.getElementById("successToast");
const toastMessage = document.getElementById("toastMessage");

let toastTimer = null;

function showToast(message) {

    if (!toast || !toastMessage) {
        alert(message);
        return;
    }

    toastMessage.textContent = message;

    toast.classList.remove("show");

    void toast.offsetWidth;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3200);
}


/* =========================================================
   AUTHENTICATION CHECK
   ========================================================= */

if (!accessToken) {

    showToast("Please log in to use support.");

    setTimeout(() => {
        window.location.href = "login.html";
    }, 1000);

    return;
}


/* =========================================================
   BUTTON RIPPLE EFFECT
   ========================================================= */

document.querySelectorAll(".oc-ripple").forEach((btn) => {

    btn.addEventListener("click", function (e) {

        const rect = this.getBoundingClientRect();

        const circle = document.createElement("span");

        const size = Math.max(
            rect.width,
            rect.height
        );

        circle.classList.add("oc-ripple-circle");

        circle.style.width = `${size}px`;
        circle.style.height = `${size}px`;

        circle.style.left =
            `${e.clientX - rect.left - size / 2}px`;

        circle.style.top =
            `${e.clientY - rect.top - size / 2}px`;

        this.appendChild(circle);

        setTimeout(() => {
            circle.remove();
        }, 650);

    });

});


/* =========================================================
   FAQ SEARCH
   ========================================================= */

const faqSearchInput =
    document.getElementById("faqSearchInput");

const searchClearBtn =
    document.getElementById("searchClearBtn");

const faqItems =
    document.querySelectorAll(
        "#faqAccordion .accordion-item"
    );

const faqNoResults =
    document.getElementById("faqNoResults");

const faqResultCount =
    document.getElementById("faqResultCount");

const popularChips =
    document.querySelectorAll(".oc-popular-chip");


function filterFaq(term) {

    const query =
        term.trim().toLowerCase();

    let visibleCount = 0;

    faqItems.forEach((item) => {

        const question =
            item.querySelector(
                ".accordion-button"
            ).textContent.toLowerCase();

        const body =
            item.querySelector(
                ".accordion-body"
            ).textContent.toLowerCase();

        const category =
            (
                item.getAttribute(
                    "data-faq-cat"
                ) || ""
            ).toLowerCase();

        const matches =
            !query ||
            question.includes(query) ||
            body.includes(query) ||
            category.includes(query);

        item.classList.toggle(
            "oc-faq-hidden",
            !matches
        );

        if (matches) {
            visibleCount++;
        }

    });


    faqNoResults.classList.toggle(
        "d-none",
        visibleCount !== 0
    );


    searchClearBtn.classList.toggle(
        "d-none",
        query.length === 0
    );


    if (query) {

        faqResultCount.textContent =
            `${visibleCount} result${visibleCount === 1 ? "" : "s"} for "${term.trim()}"`;

    } else {

        faqResultCount.textContent = "";

    }

}


faqSearchInput.addEventListener(
    "input",
    () => {
        filterFaq(
            faqSearchInput.value
        );
    }
);


searchClearBtn.addEventListener(
    "click",
    () => {

        faqSearchInput.value = "";

        filterFaq("");

        faqSearchInput.focus();

    }
);


popularChips.forEach((chip) => {

    chip.addEventListener(
        "click",
        () => {

            popularChips.forEach(
                (c) => c.classList.remove("active")
            );

            chip.classList.add("active");

            const term =
                chip.getAttribute("data-term");

            faqSearchInput.value =
                chip.textContent.trim();

            filterFaq(term);

            document
                .getElementById("faq")
                .scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

        }
    );

});


/* =========================================================
   QUICK HELP CARD → FAQ CATEGORY
   ========================================================= */

document
    .querySelectorAll("[data-scroll-filter]")
    .forEach((card) => {

        card.addEventListener(
            "click",
            (e) => {

                const filterKey =
                    card.getAttribute(
                        "data-scroll-filter"
                    );

                const targetHref =
                    card.getAttribute("href");

                if (targetHref === "#faq") {

                    e.preventDefault();

                    faqSearchInput.value = "";

                    filterFaqByCategory(
                        filterKey
                    );

                    document
                        .getElementById("faq")
                        .scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });

                }

            }
        );

    });


function filterFaqByCategory(cat) {

    let visibleCount = 0;

    faqItems.forEach((item) => {

        const matches =
            cat === "all" ||
            item.getAttribute(
                "data-faq-cat"
            ) === cat;

        item.classList.toggle(
            "oc-faq-hidden",
            !matches
        );

        if (matches) {
            visibleCount++;
        }

    });


    faqNoResults.classList.toggle(
        "d-none",
        visibleCount !== 0
    );


    faqResultCount.textContent =
        `Showing ${visibleCount} FAQ${visibleCount === 1 ? "" : "s"} in this category`;

}


/* =========================================================
   USER INFORMATION
   ========================================================= */

const ticketName =
    document.getElementById("ticketName");

const ticketEmail =
    document.getElementById("ticketEmail");


async function loadCurrentUser() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/users/me/`,
            {
                method: "GET",
                headers: {
                    "Authorization":
                        `Bearer ${accessToken}`
                }
            }
        );


        if (response.status === 401) {

            localStorage.removeItem(
                "access_token"
            );

            window.location.href =
                "login.html";

            return null;
        }


        if (!response.ok) {
            throw new Error(
                "Failed to load user information."
            );
        }


        const user =
            await response.json();


        const fullName =
            `${user.first_name || ""} ${user.last_name || ""}`
                .trim();


        ticketName.value =
            fullName || user.email || "";


        ticketEmail.value =
            user.email || "";


        /*
         * The logged-in user's identity comes
         * from JWT/backend. These fields are
         * informational and should not be used
         * to identify another user.
         */

        ticketName.readOnly = true;
        ticketEmail.readOnly = true;


        return user;

    } catch (error) {

        console.error(
            "Failed to load current user:",
            error
        );

        showToast(
            "Unable to load your account information."
        );

        return null;
    }

}


loadCurrentUser();


/* =========================================================
   SUPPORT FORM
   ========================================================= */

const supportForm =
    document.getElementById("supportForm");

const ticketMessage =
    document.getElementById("ticketMessage");

const charCounter =
    document.getElementById("charCounter");

const messageFeedback =
    document.getElementById("messageFeedback");

const submitTicketBtn =
    document.getElementById("submitTicketBtn");

const attachBtn =
    document.getElementById("attachBtn");

const attachInput =
    document.getElementById("attachInput");

const attachLabel =
    document.getElementById("attachLabel");


const MAX_CHARS = 500;
const MIN_CHARS = 20;


/* =========================================================
   CHARACTER COUNTER
   ========================================================= */

ticketMessage.addEventListener(
    "input",
    () => {

        const len =
            ticketMessage.value.length;

        charCounter.textContent =
            `${len} / ${MAX_CHARS}`;

        charCounter.style.color =
            len >= MAX_CHARS
                ? "var(--oc-danger)"
                : "";

    }
);


/* =========================================================
   FILE ATTACHMENT
   ========================================================= */

attachBtn.addEventListener(
    "click",
    () => {
        attachInput.click();
    }
);


attachInput.addEventListener(
    "change",
    () => {

        if (attachInput.files.length) {

            attachLabel.textContent =
                attachInput.files[0].name;

            attachBtn.classList.add(
                "oc-has-file"
            );

        } else {

            attachLabel.textContent =
                "Attach a file (optional)";

            attachBtn.classList.remove(
                "oc-has-file"
            );

        }

    }
);


/* =========================================================
   CATEGORY MAPPING
   ========================================================= */

const categoryMap = {

    "Booking Issues": "booking",

    "Payment Problems": "payment",

    "Provider Support": "provider",

    "Account Help": "account",

    "Technical Problems": "technical",

    "Safety & Reporting": "safety",

    "Other": "other"

};


/* =========================================================
   FORM SUBMISSION
   ========================================================= */

supportForm.addEventListener(
    "submit",
    async (e) => {

        e.preventDefault();


        let valid = true;


        const subject =
            document.getElementById(
                "ticketSubject"
            );

        const category =
            document.getElementById(
                "ticketCategory"
            );


        /* ---------- Name ---------- */

        if (!ticketName.value.trim()) {

            ticketName.classList.add(
                "is-invalid"
            );

            valid = false;

        } else {

            ticketName.classList.remove(
                "is-invalid"
            );

            ticketName.classList.add(
                "is-valid"
            );

        }


        /* ---------- Email ---------- */

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (
            !emailPattern.test(
                ticketEmail.value.trim()
            )
        ) {

            ticketEmail.classList.add(
                "is-invalid"
            );

            valid = false;

        } else {

            ticketEmail.classList.remove(
                "is-invalid"
            );

            ticketEmail.classList.add(
                "is-valid"
            );

        }


        /* ---------- Subject ---------- */

        if (!subject.value.trim()) {

            subject.classList.add(
                "is-invalid"
            );

            valid = false;

        } else {

            subject.classList.remove(
                "is-invalid"
            );

            subject.classList.add(
                "is-valid"
            );

        }


        /* ---------- Category ---------- */

        if (!category.value) {

            category.classList.add(
                "is-invalid"
            );

            valid = false;

        } else {

            category.classList.remove(
                "is-invalid"
            );

            category.classList.add(
                "is-valid"
            );

        }


        /* ---------- Message ---------- */

        if (
            ticketMessage.value.trim().length <
            MIN_CHARS
        ) {

            ticketMessage.classList.add(
                "is-invalid"
            );

            messageFeedback.textContent =
                `Please describe your issue in at least ${MIN_CHARS} characters.`;

            valid = false;

        } else {

            ticketMessage.classList.remove(
                "is-invalid"
            );

            ticketMessage.classList.add(
                "is-valid"
            );

            messageFeedback.textContent = "";

        }


        if (!valid) {

            showToast(
                "Please fix the highlighted fields."
            );

            return;
        }


        await submitSupportTicket();

    }
);


/* =========================================================
   SUBMIT REAL SUPPORT TICKET
   ========================================================= */

async function submitSupportTicket() {

    const label =
        submitTicketBtn.querySelector(
            ".btn-label"
        );

    const spinner =
        submitTicketBtn.querySelector(
            ".btn-spinner"
        );

    const check =
        submitTicketBtn.querySelector(
            ".btn-check"
        );


    const subject =
        document.getElementById(
            "ticketSubject"
        );

    const category =
        document.getElementById(
            "ticketCategory"
        );


    const backendCategory =
        categoryMap[category.value];


    if (!backendCategory) {

        showToast(
            "Please select a valid support category."
        );

        return;
    }


    const formData =
        new FormData();


    formData.append(
        "subject",
        subject.value.trim()
    );


    formData.append(
        "category",
        backendCategory
    );


    formData.append(
        "message",
        ticketMessage.value.trim()
    );


    if (attachInput.files.length > 0) {

        formData.append(
            "attachment",
            attachInput.files[0]
        );

    }


    submitTicketBtn.disabled = true;

    label.classList.add("d-none");

    spinner.classList.remove("d-none");

    check.classList.add("d-none");


    try {

        const response =
            await fetch(
                SUPPORT_API_URL,
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            `Bearer ${accessToken}`
                    },

                    body: formData
                }
            );


        const data =
            await response.json();


        if (response.status === 401) {

            localStorage.removeItem(
                "access_token"
            );

            showToast(
                "Your session has expired. Please log in again."
            );

            setTimeout(() => {
                window.location.href =
                    "login.html";
            }, 1000);

            return;
        }


        if (!response.ok) {

            console.error(
                "Support ticket error:",
                data
            );

            throw new Error(
                getApiErrorMessage(data)
            );

        }


        /* ---------- Success ---------- */

        spinner.classList.add("d-none");

        check.classList.remove("d-none");


        showToast(
            `Ticket #TCK-${data.id} submitted successfully.`
        );


        setTimeout(() => {

            check.classList.add("d-none");

            label.classList.remove("d-none");

            submitTicketBtn.disabled = false;


            supportForm.reset();


            supportForm
                .querySelectorAll(
                    ".is-valid, .is-invalid"
                )
                .forEach((el) => {

                    el.classList.remove(
                        "is-valid",
                        "is-invalid"
                    );

                });


            charCounter.textContent =
                "0 / 500";


            messageFeedback.textContent =
                "";


            attachLabel.textContent =
                "Attach a file (optional)";


            attachBtn.classList.remove(
                "oc-has-file"
            );


            /*
             * Re-load logged-in user because
             * form.reset() also clears the
             * read-only name/email fields.
             */

            loadCurrentUser();


            /*
             * Immediately reload real ticket
             * history from PostgreSQL.
             */

            loadTickets();


            document
                .getElementById("tickets")
                .scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });


        }, 900);


    } catch (error) {

        console.error(
            "Support submission failed:",
            error
        );


        spinner.classList.add("d-none");

        label.classList.remove("d-none");

        submitTicketBtn.disabled = false;


        showToast(
            error.message ||
            "Unable to submit support ticket."
        );

    }

}


/* =========================================================
   API ERROR MESSAGE
   ========================================================= */

function getApiErrorMessage(data) {

    if (!data) {
        return "Unable to submit support ticket.";
    }


    if (typeof data.detail === "string") {
        return data.detail;
    }


    const firstError =
        Object.values(data)[0];


    if (Array.isArray(firstError)) {

        return firstError[0];

    }


    if (typeof firstError === "string") {

        return firstError;

    }


    return "Unable to submit support ticket.";

}


/* =========================================================
   TICKET HISTORY
   ========================================================= */

const filterChips =
    document.querySelectorAll(
        ".oc-filter-chip"
    );

const ticketList =
    document.getElementById(
        "ticketList"
    );

const ticketNoResults =
    document.getElementById(
        "ticketNoResults"
    );


let tickets = [];


/* =========================================================
   LOAD REAL TICKETS
   ========================================================= */

async function loadTickets() {

    try {

        const response =
            await fetch(
                SUPPORT_API_URL,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${accessToken}`
                    }
                }
            );


        const data =
            await response.json();


        if (response.status === 401) {

            localStorage.removeItem(
                "access_token"
            );

            window.location.href =
                "login.html";

            return;
        }


        if (!response.ok) {

            throw new Error(
                getApiErrorMessage(data)
            );

        }


        /*
         * DRF pagination returns:
         *
         * {
         *   count: 1,
         *   results: [...]
         * }
         */

        tickets =
            Array.isArray(data)
                ? data
                : (data.results || []);


        renderTickets(
            getActiveTicketFilter()
        );


    } catch (error) {

        console.error(
            "Failed to load support tickets:",
            error
        );


        ticketList.innerHTML = `
            <div class="text-center py-4">
                <i class="fa-solid fa-circle-exclamation mb-2"></i>
                <p class="mb-0">
                    Unable to load your support tickets.
                </p>
            </div>
        `;

    }

}


/* =========================================================
   GET ACTIVE FILTER
   ========================================================= */

function getActiveTicketFilter() {

    const active =
        document.querySelector(
            ".oc-filter-chip.active"
        );


    return active
        ? active.getAttribute("data-filter")
        : "all";

}


/* =========================================================
   CATEGORY DISPLAY NAME
   ========================================================= */

function getCategoryLabel(category) {

    const labels = {

        booking: "Booking Issues",

        payment: "Payment Problems",

        provider: "Provider Support",

        account: "Account Help",

        technical: "Technical Problems",

        safety: "Safety & Reporting",

        other: "Other"

    };


    return labels[category] || category;

}


/* =========================================================
   STATUS DISPLAY
   ========================================================= */

function getStatusInfo(status) {

    if (status === "resolved") {

        return {
            className: "oc-status-resolved",
            icon: "fa-circle-check",
            label: "Resolved"
        };

    }


    if (status === "pending") {

        return {
            className: "oc-status-pending",
            icon: "fa-clock",
            label: "Pending"
        };

    }


    return {
        className: "oc-status-open",
        icon: "fa-circle-dot",
        label: "Open"
    };

}


/* =========================================================
   PRIORITY DISPLAY
   ========================================================= */

function getPriorityClass(priority) {

    if (priority === "high") {
        return "oc-priority-high";
    }

    if (priority === "low") {
        return "oc-priority-low";
    }

    return "oc-priority-medium";

}


function getPriorityLabel(priority) {

    if (priority === "high") {
        return "High";
    }

    if (priority === "low") {
        return "Low";
    }

    return "Medium";

}


/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatTicketDate(dateString) {

    if (!dateString) {
        return "Unknown date";
    }


    const date =
        new Date(dateString);


    if (Number.isNaN(date.getTime())) {
        return "Unknown date";
    }


    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "2-digit",
            year: "numeric"
        }
    );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

    if (value === null ||
        value === undefined) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   RENDER REAL TICKETS
   ========================================================= */

function renderTickets(filter) {

    const filteredTickets =
        filter === "all"
            ? tickets
            : tickets.filter(
                ticket =>
                    ticket.status === filter
            );


    ticketList.innerHTML = "";


    if (filteredTickets.length === 0) {

        ticketNoResults.classList.remove(
            "d-none"
        );

        return;

    }


    ticketNoResults.classList.add(
        "d-none"
    );


    filteredTickets.forEach(
        (ticket) => {

            const status =
                getStatusInfo(
                    ticket.status
                );


            const priorityClass =
                getPriorityClass(
                    ticket.priority
                );


            const priorityLabel =
                getPriorityLabel(
                    ticket.priority
                );


            const categoryLabel =
                getCategoryLabel(
                    ticket.category
                );


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "oc-ticket-row";


            row.setAttribute(
                "data-status",
                ticket.status
            );


            row.innerHTML = `
                <div class="oc-ticket-main">

                    <span class="oc-ticket-id">
                        #TCK-${escapeHtml(ticket.id)}
                    </span>

                    <strong>
                        ${escapeHtml(ticket.subject)}
                    </strong>

                    <div class="oc-ticket-meta">

                        <span>
                            <i class="fa-solid fa-tag"></i>
                            ${escapeHtml(categoryLabel)}
                        </span>

                        <span>
                            <i class="fa-regular fa-calendar"></i>
                            ${escapeHtml(
                                formatTicketDate(
                                    ticket.created_at
                                )
                            )}
                        </span>

                    </div>

                </div>

                <div class="oc-ticket-side">

                    <span class="oc-priority ${priorityClass}">
                        ${escapeHtml(priorityLabel)}
                    </span>

                    <span class="oc-status ${status.className}">
                        <i class="fa-solid ${status.icon}"></i>
                        ${escapeHtml(status.label)}
                    </span>

                    <button
                        type="button"
                        class="btn oc-btn-ghost btn-sm oc-view-details"
                        data-ticket-id="${escapeHtml(ticket.id)}"
                    >
                        View Details
                    </button>

                </div>
            `;


            ticketList.appendChild(row);

        }
    );


    /*
     * Attach modal buttons after rendering.
     */

    ticketList
        .querySelectorAll(
            ".oc-view-details"
        )
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    const ticketId =
                        Number(
                            button.getAttribute(
                                "data-ticket-id"
                            )
                        );


                    const ticket =
                        tickets.find(
                            item =>
                                item.id ===
                                ticketId
                        );


                    if (ticket) {

                        showTicketDetails(
                            ticket
                        );

                    }

                }
            );

        });

}


/* =========================================================
   TICKET FILTER BUTTONS
   ========================================================= */

filterChips.forEach((chip) => {

    chip.addEventListener(
        "click",
        () => {

            filterChips.forEach(
                (c) =>
                    c.classList.remove(
                        "active"
                    )
            );


            chip.classList.add(
                "active"
            );


            const filter =
                chip.getAttribute(
                    "data-filter"
                );


            renderTickets(filter);

        }
    );

});


/* =========================================================
   TICKET DETAILS MODAL
   ========================================================= */

const ticketModalEl =
    document.getElementById(
        "ticketModal"
    );


const ticketModal =
    new bootstrap.Modal(
        ticketModalEl
    );


const ticketModalTitle =
    document.getElementById(
        "ticketModalTitle"
    );


const ticketModalBody =
    document.getElementById(
        "ticketModalBody"
    );


function showTicketDetails(ticket) {

    const status =
        getStatusInfo(
            ticket.status
        );


    const priority =
        getPriorityLabel(
            ticket.priority
        );


    const category =
        getCategoryLabel(
            ticket.category
        );


    const responseText =
        ticket.admin_response &&
        ticket.admin_response.trim()
            ? ticket.admin_response
            : "No response from support yet.";


    ticketModalTitle.textContent =
        `#TCK-${ticket.id} — Ticket Details`;


    ticketModalBody.innerHTML = `

        <div class="oc-ticket-detail-row">
            <span>Subject</span>
            <span>
                ${escapeHtml(ticket.subject)}
            </span>
        </div>

        <div class="oc-ticket-detail-row">
            <span>Category</span>
            <span>
                ${escapeHtml(category)}
            </span>
        </div>

        <div class="oc-ticket-detail-row">
            <span>Date Submitted</span>
            <span>
                ${escapeHtml(
                    formatTicketDate(
                        ticket.created_at
                    )
                )}
            </span>
        </div>

        <div class="oc-ticket-detail-row">
            <span>Priority</span>
            <span>
                ${escapeHtml(priority)}
            </span>
        </div>

        <div class="oc-ticket-detail-row">
            <span>Status</span>
            <span>
                ${escapeHtml(status.label)}
            </span>
        </div>

        <div class="mt-3">
            <strong>Message</strong>

            <div class="mt-2 p-3 border rounded">
                ${escapeHtml(ticket.message)}
            </div>
        </div>

        <div class="mt-3">
            <strong>Admin Response</strong>

            <div class="mt-2 p-3 border rounded">
                ${escapeHtml(responseText)}
            </div>
        </div>

    `;


    ticketModal.show();

}


/* =========================================================
   LOAD TICKETS WHEN PAGE OPENS
   ========================================================= */

loadTickets();


/* =========================================================
   LIVE CHAT
   =========================================================

   OneClick currently has no real chat backend.
   Therefore we do NOT generate fake automated
   responses.

   Instead, Start Live Chat takes the user to
   the real support ticket form.
   ========================================================= */

const chatPopup =
    document.getElementById(
        "chatPopup"
    );


const startChatBtn =
    document.getElementById(
        "startChatBtn"
    );


const closeChatBtn =
    document.getElementById(
        "closeChatBtn"
    );


if (startChatBtn) {

    startChatBtn.addEventListener(
        "click",
        () => {

            document
                .getElementById("contact")
                .scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });


            showToast(
                "Please send your message through Contact Support."
            );

        }
    );

}


if (closeChatBtn) {

    closeChatBtn.addEventListener(
        "click",
        () => {

            if (chatPopup) {
                chatPopup.classList.remove(
                    "show"
                );
            }

        }
    );

}


/* =========================================================
   REPORT FRAUD
   ========================================================= */

const reportFraudBtn =
    document.getElementById(
        "reportFraudBtn"
    );


if (reportFraudBtn) {

    reportFraudBtn.addEventListener(
        "click",
        () => {

            /*
             * We don't pretend that a separate
             * fraud API exists.
             *
             * Instead, move the user to the
             * real support form and select
             * Safety & Reporting.
             */

            const category =
                document.getElementById(
                    "ticketCategory"
                );


            category.value =
                "Safety & Reporting";


            document
                .getElementById("contact")
                .scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });


            document
                .getElementById("ticketSubject")
                .focus();


            showToast(
                "Please describe the safety or fraud issue and submit a support ticket."
            );

        }
    );

}


/* =========================================================
   NAVIGATION LOGOUT
   ========================================================= */

const logoutLink =
    document.querySelector(
        ".oc-logout-link"
    );


if (logoutLink) {

    logoutLink.addEventListener(
        "click",
        (e) => {

            e.preventDefault();

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


});
