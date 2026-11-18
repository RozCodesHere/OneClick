/* ==========================================================
   OneClick — Messages / Chat Page
   Customer ↔ Provider
   ========================================================== */

const API_BASE = "https://oneclick-backend-6hk7.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {

    /* ======================================================
       STATE
       ====================================================== */

    let conversations = [];
    let activeConversationId = null;
    let activeProviderId = null;
    let activeCustomerId = null;
    let activeConversation = null;
    let currentMessages = [];
    let currentUser = null;

    const providerCache = {};


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
       AUTH
       ====================================================== */

    function getToken() {
        return localStorage.getItem("access_token");
    }

    if (!getToken()) {
        window.location.href = "login.html";
        return;
    }


    function getHeaders() {
        return {
            "Authorization": `Bearer ${getToken()}`,
            "Content-Type": "application/json"
        };
    }


    /* ======================================================
       CURRENT USER
       ====================================================== */

    async function loadCurrentUser() {

        try {

            const response = await fetch(
                `${API_BASE}/users/me/`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );

            if (response.status === 401) {
                logoutAndRedirect();
                return null;
            }

            if (!response.ok) {
                throw new Error(
                    `User API returned ${response.status}`
                );
            }

            currentUser = await response.json();

            /*
             * Expose useful variables globally.
             * You do NOT need to use the console.
             */
            window.oneClickCurrentUser = currentUser;

            return currentUser;

        } catch (error) {

            console.error(
                "Current user loading error:",
                error
            );

            return null;
        }
    }


    function getCurrentUserId() {

        if (currentUser && currentUser.id) {
            return Number(currentUser.id);
        }

        return null;
    }


    function isProviderUser() {

        return String(
            currentUser?.role || ""
        ).toLowerCase() === "provider";

    }


    /* ======================================================
       ID HELPER
       ====================================================== */

    function getId(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return null;
        }

        if (typeof value === "object") {
            return Number(value.id) || null;
        }

        return Number(value) || null;
    }


    /* ======================================================
       PROVIDER ID FROM URL
       ====================================================== */

    function getProviderIdFromURL() {

        const params =
            new URLSearchParams(
                window.location.search
            );

        const value =
            params.get("provider_id");

        if (
            !value ||
            !/^\d+$/.test(value)
        ) {
            return null;
        }

        return Number(value);
    }


    /* ======================================================
       LOAD PROVIDER
       ====================================================== */

    async function loadProvider(providerId) {

        providerId = Number(providerId);

        if (!providerId) {
            return null;
        }

        if (providerCache[providerId]) {
            return providerCache[providerId];
        }

        try {

            const response =
                await fetch(
                    `${API_BASE}/providers/${providerId}/`
                );

            if (!response.ok) {
                throw new Error(
                    `Provider API returned ${response.status}`
                );
            }

            const provider =
                await response.json();

            providerCache[providerId] =
                provider;

            return provider;

        } catch (error) {

            console.error(
                "Provider loading error:",
                error
            );

            return null;
        }
    }


    /* ======================================================
       LOAD MESSAGES
       ====================================================== */

    async function loadMessages() {

        try {

            const response =
                await fetch(
                    `${API_BASE}/services/messages/`,
                    {
                        method: "GET",
                        headers: getHeaders()
                    }
                );

            if (response.status === 401) {
                logoutAndRedirect();
                return false;
            }

            if (!response.ok) {
                throw new Error(
                    `Message API returned ${response.status}`
                );
            }

            const data =
                await response.json();

            let messages =
                Array.isArray(data.results)
                    ? data.results
                    : Array.isArray(data)
                        ? data
                        : [];

            let nextPage = data.next;

            while (nextPage) {

                const nextResponse =
                    await fetch(
                        nextPage,
                        {
                            headers: getHeaders()
                        }
                    );

                if (!nextResponse.ok) {
                    break;
                }

                const nextData =
                    await nextResponse.json();

                if (
                    Array.isArray(
                        nextData.results
                    )
                ) {
                    messages =
                        messages.concat(
                            nextData.results
                        );
                }

                nextPage =
                    nextData.next;
            }

            currentMessages =
                messages;

            window.oneClickMessages =
                currentMessages;

            await buildConversations(
                currentMessages
            );

            return true;

        } catch (error) {

            console.error(
                "Message loading error:",
                error
            );

            showConversationError(
                "Unable to load your messages."
            );

            return false;
        }
    }


    /* ======================================================
       BUILD CONVERSATIONS
       ====================================================== */

    async function buildConversations(messages) {

        conversations = [];

        const userId =
            getCurrentUserId();

        if (!userId) {
            return;
        }

        const providerUser =
            isProviderUser();

        const grouped = {};


        messages.forEach(message => {

            const senderId =
                getId(message.sender);

            const receiverId =
                getId(message.receiver);

            const providerId =
                getId(message.provider);

            const customerId =
                getId(message.customer);


            /* =================================================
               CUSTOMER
               ================================================= */

            if (!providerUser) {

                if (!providerId) {
                    return;
                }

                /*
                 * Only messages belonging to this customer.
                 */
                if (
                    senderId !== userId &&
                    receiverId !== userId
                ) {
                    return;
                }

                const key =
                    `provider-${providerId}`;

                let otherUserId;

                let otherUserName;

                if (senderId === userId) {

                    otherUserId =
                        receiverId;

                    otherUserName =
                        message.receiver_name ||
                        "Service Provider";

                } else {

                    otherUserId =
                        senderId;

                    otherUserName =
                        message.sender_name ||
                        "Service Provider";
                }


                if (!grouped[key]) {

                    grouped[key] = {

                        id: key,

                        providerId:
                            providerId,

                        customerId:
                            userId,

                        otherUserId:
                            otherUserId,

                        otherUserName:
                            otherUserName,

                        providerName:
                            otherUserName,

                        providerImage:
                            null,

                        providerCategory:
                            "Service Provider",

                        providerAvailable:
                            null,

                        messages: []

                    };
                }


                grouped[key].messages.push(
                    message
                );


                if (
                    otherUserName &&
                    otherUserName !==
                        "Service Provider"
                ) {

                    grouped[key].otherUserName =
                        otherUserName;
                }

            }


            /* =================================================
               PROVIDER
               ================================================= */

            else {

                /*
                 * Find the customer.
                 */
                let otherUserId =
                    customerId;

                if (!otherUserId) {

                    if (
                        senderId === userId
                    ) {
                        otherUserId =
                            receiverId;
                    } else {
                        otherUserId =
                            senderId;
                    }
                }


                if (!otherUserId) {
                    return;
                }


                /*
                 * Ignore messages unrelated
                 * to the logged-in provider.
                 */
                const belongsToProvider =
                    senderId === userId ||
                    receiverId === userId;

                if (!belongsToProvider) {
                    return;
                }


                /*
                 * IMPORTANT:
                 *
                 * The provider profile ID can be
                 * different from the user ID.
                 *
                 * For the existing conversation
                 * it is already returned as 5.
                 */

                const actualProviderId =
                    providerId;


                if (!actualProviderId) {
                    return;
                }


                const key =
                    `customer-${otherUserId}`;


                let otherUserName;

                if (
                    senderId === userId
                ) {

                    otherUserName =
                        message.receiver_name ||
                        "Customer";

                } else {

                    otherUserName =
                        message.sender_name ||
                        "Customer";
                }


                if (!grouped[key]) {

                    grouped[key] = {

                        id: key,

                        providerId:
                            actualProviderId,

                        customerId:
                            otherUserId,

                        otherUserId:
                            otherUserId,

                        otherUserName:
                            otherUserName,

                        providerName:
                            "Customer",

                        providerImage:
                            null,

                        providerCategory:
                            "Customer",

                        providerAvailable:
                            null,

                        messages: []

                    };
                }


                grouped[key].messages.push(
                    message
                );


                if (
                    otherUserName &&
                    otherUserName !==
                        "Customer"
                ) {

                    grouped[key].otherUserName =
                        otherUserName;
                }

            }

        });


        conversations =
            Object.values(grouped);


        /* ==================================================
           LOAD PROVIDER DETAILS FOR CUSTOMER
           ================================================== */

        if (!providerUser) {

            for (
                const conversation
                of conversations
            ) {

                const provider =
                    await loadProvider(
                        conversation.providerId
                    );

                if (!provider) {
                    continue;
                }

                conversation.provider =
                    provider;

                conversation.providerName =
                    provider.full_name ||
                    conversation.otherUserName;

                conversation.otherUserName =
                    provider.full_name ||
                    conversation.otherUserName;

                conversation.providerImage =
                    provider.profile_image ||
                    null;

                conversation.providerCategory =
                    provider.category_name ||
                    "Service Provider";

                conversation.providerAvailable =
                    provider.available;
            }
        }


        /* ==================================================
           SORT MESSAGES
           ================================================== */

        conversations.forEach(
            conversation => {

                conversation.messages.sort(
                    (a, b) =>
                        new Date(a.created_at) -
                        new Date(b.created_at)
                );

            }
        );


        /* ==================================================
           SORT CONVERSATIONS
           ================================================== */

        conversations.sort(
            (a, b) => {

                const aLast =
                    a.messages[
                        a.messages.length - 1
                    ];

                const bLast =
                    b.messages[
                        b.messages.length - 1
                    ];

                return (
                    new Date(
                        bLast?.created_at || 0
                    ) -
                    new Date(
                        aLast?.created_at || 0
                    )
                );
            }
        );


        window.oneClickConversations =
            conversations;

        renderConversationList(
            conversations
        );
    }


    /* ======================================================
       RENDER CONVERSATIONS
       ====================================================== */

    function renderConversationList(list) {

        if (!conversationListEl) {
            return;
        }

        if (!list.length) {
            showNoConversations();
            return;
        }

        conversationListEl.innerHTML = "";

        list.forEach(conversation => {

            const messages =
                conversation.messages || [];

            if (!messages.length) {
                return;
            }

            const latest =
                messages[
                    messages.length - 1
                ];

            const item =
                document.createElement("button");

            item.type = "button";

            item.className =
                "conversation-item";

            if (
                conversation.id ===
                activeConversationId
            ) {
                item.classList.add("active");
            }

            const name =
                conversation.otherUserName ||
                "User";

            let preview =
                latest.content || "";

            if (!preview) {

                if (latest.image) {
                    preview = "Shared image";
                } else if (latest.file) {
                    preview = "Shared attachment";
                } else {
                    preview = "No message";
                }
            }

            const avatar =
                conversation.providerImage
                    ? `
                        <img
                            src="${escapeHtml(
                                conversation.providerImage
                            )}"
                            alt="${escapeHtml(name)}"
                            class="conversation-avatar-image"
                        >
                    `
                    : `
                        <div class="conversation-avatar-placeholder">
                            <i class="fa-solid fa-user"></i>
                        </div>
                    `;


            item.innerHTML = `

                <div class="conversation-avatar">
                    ${avatar}
                </div>

                <div class="conversation-content">

                    <div class="conversation-top">

                        <strong>
                            ${escapeHtml(name)}
                        </strong>

                        <small>
                            ${formatMessageTime(
                                latest.created_at
                            )}
                        </small>

                    </div>

                    <p>
                        ${formatPreview(preview)}
                    </p>

                </div>
            `;


            item.addEventListener(
                "click",
                () => openConversation(
                    conversation.id
                )
            );


            conversationListEl.appendChild(
                item
            );

        });
    }


    /* ======================================================
       OPEN CONVERSATION
       ====================================================== */

    async function openConversation(
        conversationId
    ) {

        const conversation =
            conversations.find(
                item =>
                    item.id ===
                    conversationId
            );

        if (!conversation) {
            return;
        }

        activeConversationId =
            conversation.id;

        activeProviderId =
            Number(
                conversation.providerId
            ) || null;

        activeCustomerId =
            Number(
                conversation.customerId
            ) || null;

        activeConversation =
            conversation;


        const providerUser =
            isProviderUser();


        let name =
            conversation.otherUserName ||
            "User";

        let image = null;

        let status =
            providerUser
                ? "Customer"
                : (
                    conversation.providerCategory ||
                    "Service Provider"
                );

        let available = null;


        /* CUSTOMER */

        if (!providerUser) {

            const provider =
                conversation.provider ||
                await loadProvider(
                    conversation.providerId
                );

            if (provider) {

                conversation.provider =
                    provider;

                name =
                    provider.full_name ||
                    name;

                image =
                    provider.profile_image ||
                    null;

                status =
                    provider.category_name ||
                    "Service Provider";

                available =
                    provider.available;
            }
        }


        /* PROVIDER */

        else {

            name =
                conversation.otherUserName ||
                "Customer";

            image = null;

            status = "Customer";
        }


        showActiveChat();


        if (chatNameEl) {
            chatNameEl.textContent = name;
        }

        if (chatStatusTextEl) {
            chatStatusTextEl.textContent =
                status;
        }


        if (chatStatusDotEl) {

            if (providerUser) {

                chatStatusDotEl.style.display =
                    "none";

            } else {

                if (available === true) {

                    chatStatusDotEl.style.display =
                        "inline-block";

                    chatStatusDotEl.style.color =
                        "#16a34a";

                } else if (available === false) {

                    chatStatusDotEl.style.display =
                        "inline-block";

                    chatStatusDotEl.style.color =
                        "#dc2626";

                } else {

                    chatStatusDotEl.style.display =
                        "none";
                }
            }
        }


        if (chatAvatarEl) {

            chatAvatarEl.src =
                image ||
                "https://i.pravatar.cc/100?img=15";

            chatAvatarEl.alt =
                `${name} profile photo`;
        }


        renderMessages(
            conversation.messages || []
        );

        scrollMessagesToBottom();

        setupMobileChatView();

        renderConversationList(
            conversations
        );
    }


    /* ======================================================
       ACTIVE / EMPTY
       ====================================================== */

    function showActiveChat() {

        if (chatEmptyStateEl) {
            chatEmptyStateEl.classList.add(
                "d-none"
            );
        }

        if (chatActiveEl) {
            chatActiveEl.classList.remove(
                "d-none"
            );
        }
    }


    function showEmptyChat() {

        activeConversationId = null;
        activeProviderId = null;
        activeCustomerId = null;
        activeConversation = null;

        if (chatActiveEl) {
            chatActiveEl.classList.add(
                "d-none"
            );
        }

        if (chatEmptyStateEl) {
            chatEmptyStateEl.classList.remove(
                "d-none"
            );
        }
    }


    function showNoConversations() {

        if (!conversationListEl) {
            return;
        }

        const providerUser =
            isProviderUser();

        conversationListEl.innerHTML = `

            <div class="text-center text-muted py-5 px-3">

                <div class="mb-3">

                    <i
                        class="fa-regular fa-comments"
                        style="
                            font-size: 2.2rem;
                            opacity: 0.5;
                        "
                    ></i>

                </div>

                <h6 class="mb-2">
                    No conversations yet
                </h6>

                <p
                    class="mb-0"
                    style="font-size: 0.85rem;"
                >
                    ${
                        providerUser
                            ? "Customer conversations will appear here."
                            : "Your conversations with service providers will appear here."
                    }
                </p>

            </div>
        `;
    }


    /* ======================================================
       RENDER MESSAGES
       ====================================================== */

    function renderMessages(messages) {

        if (!chatMessagesEl) {
            return;
        }

        chatMessagesEl.innerHTML = "";

        const userId =
            getCurrentUserId();


        if (!messages.length) {

            chatMessagesEl.innerHTML = `

                <div class="text-center text-muted py-5">

                    <i
                        class="fa-regular fa-comments mb-3"
                        style="
                            font-size: 2rem;
                            opacity: 0.5;
                        "
                    ></i>

                    <p class="mb-1">
                        No messages yet.
                    </p>

                    <small>
                        Start the conversation.
                    </small>

                </div>
            `;

            return;
        }


        messages.forEach(message => {

            const senderId =
                getId(message.sender);

            const mine =
                senderId === userId;


            const wrapper =
                document.createElement("div");

            wrapper.className =
                mine
                    ? "message-row message-sent"
                    : "message-row message-received";


            const senderName =
                mine
                    ? "You"
                    : (
                        message.sender_name ||
                        activeConversation?.otherUserName ||
                        "User"
                    );


            let imageHtml = "";

            if (message.image) {

                const imageUrl =
                    String(message.image)
                        .startsWith("http")
                        ? message.image
                        : `https://oneclick-backend-6hk7.onrender.com${message.image}`;

                imageHtml = `

                    <div class="message-image-wrapper">

                        <img
                            src="${escapeHtml(imageUrl)}"
                            alt="Shared image"
                            class="message-shared-image"
                            loading="lazy"
                        >

                    </div>
                `;
            }


            let fileHtml = "";

            if (message.file) {

                const fileUrl =
                    String(message.file)
                        .startsWith("http")
                        ? message.file
                        : `https://oneclick-backend-6hk7.onrender.com${message.file}`;

                fileHtml = `

                    <div class="message-file">

                        <a
                            href="${escapeHtml(fileUrl)}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Open attachment
                        </a>

                    </div>
                `;
            }


            const textHtml =
                message.content
                    ? `
                        <div class="message-text">
                            ${formatMessageContent(
                                message.content
                            )}
                        </div>
                    `
                    : "";


            wrapper.innerHTML = `

                <div class="message-bubble">

                    <div class="message-sender">
                        ${escapeHtml(senderName)}
                    </div>

                    <div class="message-content">

                        ${imageHtml}

                        ${fileHtml}

                        ${textHtml}

                    </div>

                    <div class="message-time">
                        ${formatMessageTime(
                            message.created_at
                        )}
                    </div>

                </div>
            `;


            chatMessagesEl.appendChild(
                wrapper
            );

        });
    }


    /* ======================================================
       SEND MESSAGE
       ====================================================== */

    async function sendMessage() {

        if (!messageInputEl) {
            return;
        }

        const text =
            messageInputEl.value.trim();

        if (!text) {
            return;
        }

        if (!activeProviderId) {

            alert(
                "Please select a conversation first."
            );

            return;
        }


        const providerUser =
            isProviderUser();


        if (
            providerUser &&
            !activeCustomerId
        ) {

            alert(
                "Customer information is missing."
            );

            return;
        }


        if (sendMessageBtn) {
            sendMessageBtn.disabled = true;
        }


        try {

            let payload;


            /*
             * CUSTOMER
             */

            if (!providerUser) {

                payload = {

                    provider:
                        Number(
                            activeProviderId
                        ),

                    content:
                        text
                };

            }


            /*
             * PROVIDER
             */

            else {

                payload = {

                    provider:
                        Number(
                            activeProviderId
                        ),

                    receiver:
                        Number(
                            activeCustomerId
                        ),

                    content:
                        text
                };
            }


            console.log(
                "Sending message:",
                payload
            );


            const response =
                await fetch(
                    `${API_BASE}/services/messages/`,
                    {
                        method: "POST",

                        headers:
                            getHeaders(),

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            const data =
                await response.json();


            if (response.status === 401) {

                logoutAndRedirect();

                return;
            }


            if (!response.ok) {

                throw new Error(
                    getApiErrorMessage(
                        data,
                        "Unable to send message."
                    )
                );
            }


            messageInputEl.value = "";


            const oldConversationId =
                activeConversationId;


            const loaded =
                await loadMessages();


            if (!loaded) {
                return;
            }


            /*
             * IMPORTANT:
             *
             * Re-open the same conversation.
             */
            if (oldConversationId) {

                await openConversation(
                    oldConversationId
                );

            }

        } catch (error) {

            console.error(
                "Send message error:",
                error
            );

            alert(
                error.message ||
                "Unable to send message."
            );

        } finally {

            if (sendMessageBtn) {
                sendMessageBtn.disabled =
                    false;
            }
        }
    }


    /* ======================================================
       EMOJI
       ====================================================== */

    function setupEmojiPicker() {

        const emojiBtn =
            document.querySelector(
                '.composer-icon-btn[title="Emoji"]'
            );

        if (!emojiBtn || !messageInputEl) {
            return;
        }


        let picker =
            document.getElementById(
                "emojiPicker"
            );


        if (!picker) {

            picker =
                document.createElement("div");

            picker.id = "emojiPicker";

            picker.className =
                "emoji-picker d-none";

            picker.innerHTML = `

                <div class="emoji-picker-header">
                    <strong>Choose Emoji</strong>
                </div>

                <div class="emoji-grid">

                    😀 😃 😄 😁 😆 😅 😂 🤣
                    😊 😇 🙂 🙃 😉 😌 😍 🥰
                    😘 😎 🤩 🤔 😐 😮 😢 😭
                    😡 🤬 👍 👎 👏 🙏 💪 ❤️
                    💔 🔥 ✨ ⭐ 🎉 ✅ ❌ 💯
                    🚗 🏠 🔧 ⚡ 📞 📍 ⏰

                </div>
            `;

            const composer =
                document.querySelector(
                    ".chat-composer"
                );

            if (composer) {
                composer.style.position =
                    "relative";

                composer.appendChild(
                    picker
                );
            }
        }


        emojiBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                picker.classList.toggle(
                    "d-none"
                );
            }
        );


        picker.addEventListener(
            "click",
            event => {

                const emoji =
                    event.target.textContent.trim();

                if (
                    emoji &&
                    emoji.length <= 2
                ) {

                    messageInputEl.value +=
                        emoji;

                    messageInputEl.focus();

                    picker.classList.add(
                        "d-none"
                    );
                }
            }
        );
    }


    /* ======================================================
       ATTACHMENT
       ====================================================== */

    function setupAttachmentButton() {

        const button =
            document.querySelector(
                '.composer-icon-btn[title="Attachment"]'
            );

        if (!button) {
            return;
        }


        const input =
            document.createElement("input");

        input.type = "file";
        input.style.display = "none";

        document.body.appendChild(input);


        button.addEventListener(
            "click",
            () => input.click()
        );


        input.addEventListener(
            "change",
            () => {

                const file =
                    input.files[0];

                if (file) {
                    sendMessageWithAttachment(
                        file,
                        "file"
                    );
                }
            }
        );
    }


    /* ======================================================
       IMAGE
       ====================================================== */

    function setupImageButton() {

        const button =
            document.querySelector(
                '.composer-icon-btn[title="Image"]'
            );

        if (!button) {
            return;
        }


        const input =
            document.createElement("input");

        input.type = "file";

        input.accept =
            "image/*";

        input.style.display =
            "none";

        document.body.appendChild(input);


        button.addEventListener(
            "click",
            () => input.click()
        );


        input.addEventListener(
            "change",
            () => {

                const file =
                    input.files[0];

                if (file) {
                    sendMessageWithAttachment(
                        file,
                        "image"
                    );
                }
            }
        );
    }


    /* ======================================================
       SEND ATTACHMENT
       ====================================================== */

    async function sendMessageWithAttachment(
        file,
        type
    ) {

        if (!activeProviderId) {

            alert(
                "Please select a conversation first."
            );

            return;
        }


        const providerUser =
            isProviderUser();


        if (
            providerUser &&
            !activeCustomerId
        ) {

            alert(
                "Customer information is missing."
            );

            return;
        }


        const formData =
            new FormData();


        formData.append(
            "provider",
            Number(
                activeProviderId
            )
        );


        if (providerUser) {

            formData.append(
                "receiver",
                Number(
                    activeCustomerId
                )
            );
        }


        const text =
            messageInputEl?.value.trim();


        if (text) {

            formData.append(
                "content",
                text
            );
        }


        if (type === "image") {

            formData.append(
                "image",
                file
            );

        } else {

            formData.append(
                "file",
                file
            );
        }


        try {

            const response =
                await fetch(
                    `${API_BASE}/services/messages/`,
                    {
                        method: "POST",

                        headers: {
                            "Authorization":
                                `Bearer ${getToken()}`
                        },

                        body:
                            formData
                    }
                );


            const data =
                await response.json();


            if (response.status === 401) {

                logoutAndRedirect();

                return;
            }


            if (!response.ok) {

                throw new Error(
                    getApiErrorMessage(
                        data,
                        "Unable to upload attachment."
                    )
                );
            }


            if (messageInputEl) {
                messageInputEl.value = "";
            }


            const oldConversationId =
                activeConversationId;


            const loaded =
                await loadMessages();


            if (
                loaded &&
                oldConversationId
            ) {

                await openConversation(
                    oldConversationId
                );
            }

        } catch (error) {

            console.error(
                "Attachment error:",
                error
            );

            alert(
                error.message ||
                "Unable to upload attachment."
            );
        }
    }


    /* ======================================================
       FORMAT CONTENT
       ====================================================== */

    function formatMessageContent(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }


        const escaped =
            escapeHtml(value);


        const urlRegex =
            /https?:\/\/[^\s]+/gi;


        return escaped.replace(
            urlRegex,
            url => {

                let cleanUrl = url;
                let ending = "";


                while (
                    /[.,!?;:)\]}]$/.test(
                        cleanUrl
                    )
                ) {

                    ending =
                        cleanUrl.slice(-1) +
                        ending;

                    cleanUrl =
                        cleanUrl.slice(0, -1);
                }


                if (
                    isImageUrl(cleanUrl)
                ) {

                    return `

                        <div class="message-image-wrapper">

                            <a
                                href="${cleanUrl}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >

                                <img
                                    src="${cleanUrl}"
                                    alt="Shared image"
                                    class="message-shared-image"
                                    loading="lazy"
                                >

                            </a>

                        </div>

                    ` + ending;
                }


                return `

                    <a
                        href="${cleanUrl}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="message-link"
                    >
                        ${cleanUrl}
                    </a>

                ` + ending;
            }
        );
    }


    function formatPreview(value) {

        if (!value) {
            return "No message";
        }

        return escapeHtml(
            value.replace(
                /https?:\/\/[^\s]+/gi,
                "[link]"
            )
        );
    }


    function isImageUrl(url) {

        try {

            const parsed =
                new URL(url);

            const path =
                parsed.pathname.toLowerCase();

            return (
                path.endsWith(".jpg") ||
                path.endsWith(".jpeg") ||
                path.endsWith(".png") ||
                path.endsWith(".gif") ||
                path.endsWith(".webp") ||
                path.endsWith(".bmp") ||
                path.endsWith(".svg")
            );

        } catch {

            return false;
        }
    }


    /* ======================================================
       SEARCH
       ====================================================== */

    function setupSearch() {

        function search(query) {

            const value =
                query.trim().toLowerCase();


            if (!value) {

                renderConversationList(
                    conversations
                );

                return;
            }


            const filtered =
                conversations.filter(
                    conversation => {

                        const name =
                            (
                                conversation.otherUserName ||
                                ""
                            ).toLowerCase();

                        const category =
                            (
                                conversation.providerCategory ||
                                ""
                            ).toLowerCase();

                        const last =
                            conversation.messages[
                                conversation.messages.length - 1
                            ];

                        const content =
                            (
                                last?.content ||
                                ""
                            ).toLowerCase();


                        return (
                            name.includes(value) ||
                            category.includes(value) ||
                            content.includes(value)
                        );
                    }
                );


            renderConversationList(
                filtered
            );
        }


        if (convoSearchEl) {

            convoSearchEl.addEventListener(
                "input",
                () => search(
                    convoSearchEl.value
                )
            );
        }


        if (headerSearch) {

            headerSearch.addEventListener(
                "input",
                () => {

                    if (convoSearchEl) {
                        convoSearchEl.value =
                            headerSearch.value;
                    }

                    search(
                        headerSearch.value
                    );
                }
            );
        }
    }


    /* ======================================================
       TIME
       ====================================================== */

    function formatMessageTime(value) {

        if (!value) {
            return "";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "";
        }

        return date.toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    }


    /* ======================================================
       MOBILE
       ====================================================== */

    function setupMobileChatView() {

        conversationPanelEl?.classList.add(
            "hide-mobile"
        );

        chatWindowEl?.classList.add(
            "show-mobile"
        );
    }


    function setupMobileBack() {

        if (!chatBackBtn) {
            return;
        }

        chatBackBtn.addEventListener(
            "click",
            () => {

                conversationPanelEl?.classList.remove(
                    "hide-mobile"
                );

                chatWindowEl?.classList.remove(
                    "show-mobile"
                );
            }
        );
    }


    /* ======================================================
       INFO
       ====================================================== */

    function setupInfoPanelToggle() {

        infoToggleBtn?.addEventListener(
            "click",
            () => {

                infoPanelEl?.classList.toggle(
                    "open"
                );
            }
        );


        infoCloseBtn?.addEventListener(
            "click",
            () => {

                infoPanelEl?.classList.remove(
                    "open"
                );
            }
        );
    }


    /* ======================================================
       QUICK ACTIONS
       ====================================================== */

    function setupQuickActions() {

        document
            .getElementById("viewBookingBtn")
            ?.addEventListener(
                "click",
                () => {
                    window.location.href =
                        "booking.html";
                }
            );


        document
            .getElementById("leaveReviewBtn")
            ?.addEventListener(
                "click",
                () => {
                    window.location.href =
                        "review.html";
                }
            );


        document
            .getElementById("reportIssueBtn")
            ?.addEventListener(
                "click",
                () => {
                    window.location.href =
                        "report-issue.html";
                }
            );
    }


    /* ======================================================
       LOGOUT
       ====================================================== */

    function setupLogout() {

        document
            .querySelectorAll(
                ".btn-logout, .js-logout"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        logoutAndRedirect();
                    }
                );
            });
    }


    function logoutAndRedirect() {

        localStorage.removeItem(
            "access_token"
        );

        localStorage.removeItem(
            "refresh_token"
        );

        localStorage.removeItem(
            "oneClickCustomer"
        );

        localStorage.removeItem(
            "oneClickProvider"
        );

        window.location.href =
            "login.html";
    }


    /* ======================================================
       ERROR
       ====================================================== */

    function getApiErrorMessage(
        data,
        fallback
    ) {

        if (data?.detail) {
            return data.detail;
        }

        if (data?.error) {
            return data.error;
        }

        if (
            data &&
            typeof data === "object"
        ) {

            const first =
                Object.values(data)[0];

            if (Array.isArray(first)) {
                return String(first[0]);
            }

            if (first) {
                return String(first);
            }
        }

        return fallback;
    }


    function showConversationError(
        message
    ) {

        if (!conversationListEl) {
            return;
        }

        conversationListEl.innerHTML = `

            <div
                class="text-center text-danger py-5 px-3"
            >

                <i
                    class="fa-solid fa-triangle-exclamation mb-3"
                    style="font-size: 1.8rem;"
                ></i>

                <h6>
                    Unable to load messages
                </h6>

                <p
                    class="mb-0"
                    style="font-size: 0.85rem;"
                >
                    ${escapeHtml(message)}
                </p>

            </div>
        `;
    }


    /* ======================================================
       SCROLL
       ====================================================== */

    function scrollMessagesToBottom() {

        if (!chatMessagesEl) {
            return;
        }

        chatMessagesEl.scrollTop =
            chatMessagesEl.scrollHeight;
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
       BUTTONS
       ====================================================== */

    const sendBtn =
        sendMessageBtn;


    if (sendBtn) {

        sendBtn.addEventListener(
            "click",
            sendMessage
        );
    }


    if (messageInputEl) {

        messageInputEl.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    sendMessage();
                }
            }
        );
    }


    /* ======================================================
       INITIAL SETUP
       ====================================================== */

    setupSearch();
    setupMobileBack();
    setupInfoPanelToggle();
    setupQuickActions();
    setupLogout();
    setupEmojiPicker();
    setupAttachmentButton();
    setupImageButton();


    /* ======================================================
       INITIALIZE
       ====================================================== */

    async function initializeChat() {

        const user =
            await loadCurrentUser();

        if (!user) {
            return;
        }


        const loaded =
            await loadMessages();

        if (!loaded) {
            return;
        }


        /*
         * CUSTOMER:
         *
         * chat.html?provider_id=5
         */

        const providerId =
            getProviderIdFromURL();


        if (
            providerId &&
            !isProviderUser()
        ) {

            let conversation =
                conversations.find(
                    item =>
                        Number(
                            item.providerId
                        ) ===
                        providerId
                );


            if (conversation) {

                await openConversation(
                    conversation.id
                );

            } else {

                const provider =
                    await loadProvider(
                        providerId
                    );


                if (provider) {

                    conversation = {

                        id:
                            `provider-${providerId}`,

                        providerId:
                            providerId,

                        customerId:
                            getCurrentUserId(),

                        otherUserId:
                            provider.id,

                        otherUserName:
                            provider.full_name ||
                            "Service Provider",

                        providerName:
                            provider.full_name ||
                            "Service Provider",

                        providerImage:
                            provider.profile_image ||
                            null,

                        providerCategory:
                            provider.category_name ||
                            "Service Provider",

                        providerAvailable:
                            provider.available,

                        provider:
                            provider,

                        messages: []
                    };


                    conversations.unshift(
                        conversation
                    );


                    window.oneClickConversations =
                        conversations;


                    await openConversation(
                        conversation.id
                    );
                }
            }
        }
    }


    initializeChat();

});
