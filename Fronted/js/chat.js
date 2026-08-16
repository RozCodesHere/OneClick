/* ==========================================================
   OneClick — Messages / Chat Page JS
   Dummy frontend only. No backend calls — ready to be wired
   to a real API / WebSocket layer later (see comments below).
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------------------------
     DUMMY DATA — 8 conversations
  ---------------------------------------------------------- */
  const CONVERSATIONS = [
    {
      id: 1,
      name: 'Bikash Shrestha',
      role: 'provider',
      roleLabel: 'Electrician',
      avatar: 'https://i.pravatar.cc/100?img=12',
      online: true,
      unread: 3,
      lastMessage: 'The repair is completed.',
      lastTime: '2:41 PM',
      messages: [
        { text: 'Hello, I saw your booking request for electrical repair.', dir: 'in', time: '9:02 AM', status: 'seen' },
        { text: 'Hello!', dir: 'out', time: '9:03 AM', status: 'seen' },
        { text: 'Yes, my switchboard has been sparking a bit.', dir: 'out', time: '9:04 AM', status: 'seen' },
        { text: 'Understood, that sounds like a loose connection. I can come by today.', dir: 'in', time: '9:06 AM', status: 'seen' },
        { text: 'That would be great, thank you.', dir: 'out', time: '9:07 AM', status: 'seen' },
        { text: 'I am on my way.', dir: 'in', time: '10:10 AM', status: 'seen' },
        { text: "I'll arrive in 15 minutes.", dir: 'in', time: '10:11 AM', status: 'seen' },
        { text: 'Can you share your exact location?', dir: 'in', time: '10:12 AM', status: 'seen' },
        { text: 'Sure, sending it now.', dir: 'out', time: '10:13 AM', status: 'seen' },
        { text: 'Location.png', dir: 'out', time: '10:13 AM', status: 'seen', isFile: true, fileIcon: 'fa-file-image' },
        { text: 'Got it, thanks. On my way!', dir: 'in', time: '10:14 AM', status: 'seen' },
        { text: 'Just parked outside your gate.', dir: 'in', time: '10:27 AM', status: 'seen' },
        { text: 'Coming to open the gate.', dir: 'out', time: '10:28 AM', status: 'seen' },
        { text: 'I have started checking the switchboard now.', dir: 'in', time: '10:35 AM', status: 'seen' },
        { text: 'Take your time.', dir: 'out', time: '10:36 AM', status: 'seen' },
        { text: 'Found the issue — a burnt wire connector. Replacing it now.', dir: 'in', time: '11:10 AM', status: 'seen' },
        { text: 'Oh okay, is it going to take long?', dir: 'out', time: '11:12 AM', status: 'seen' },
        { text: 'About 20 more minutes.', dir: 'in', time: '11:13 AM', status: 'seen' },
        { text: 'The repair is completed.', dir: 'in', time: '2:40 PM', status: 'delivered' },
        { text: 'Thank you.', dir: 'out', time: '2:41 PM', status: 'delivered' }
      ]
    },
    {
      id: 2,
      name: 'Aashika Rai',
      role: 'customer',
      roleLabel: 'Customer',
      avatar: 'https://i.pravatar.cc/100?img=47',
      online: true,
      unread: 1,
      lastMessage: 'Can you come tomorrow morning instead?',
      lastTime: '1:15 PM',
      messages: [
        { text: 'Hi, I would like to book a cleaning service.', dir: 'in', time: '12:50 PM', status: 'seen' },
        { text: 'Hello Aashika! Sure, what day works for you?', dir: 'out', time: '12:52 PM', status: 'seen' },
        { text: 'I was thinking today evening.', dir: 'in', time: '12:53 PM', status: 'seen' },
        { text: 'Can you come tomorrow morning instead?', dir: 'in', time: '1:15 PM', status: 'delivered' }
      ]
    },
    {
      id: 3,
      name: 'Prakash Lama',
      role: 'provider',
      roleLabel: 'Plumber',
      avatar: 'https://i.pravatar.cc/100?img=33',
      online: false,
      unread: 0,
      lastMessage: 'Sounds good, see you then.',
      lastTime: 'Yesterday',
      messages: [
        { text: 'The leak under the sink needs a new pipe fitting.', dir: 'in', time: 'Yesterday, 4:20 PM', status: 'seen' },
        { text: 'Alright, how much would that cost?', dir: 'out', time: 'Yesterday, 4:22 PM', status: 'seen' },
        { text: 'Around Rs. 600 including labor.', dir: 'in', time: 'Yesterday, 4:23 PM', status: 'seen' },
        { text: 'Okay, please go ahead.', dir: 'out', time: 'Yesterday, 4:25 PM', status: 'seen' },
        { text: 'Sounds good, see you then.', dir: 'in', time: 'Yesterday, 4:26 PM', status: 'seen' }
      ]
    },
    {
      id: 4,
      name: 'Sita Gurung',
      role: 'provider',
      roleLabel: 'Cleaner',
      avatar: 'https://i.pravatar.cc/100?img=45',
      online: true,
      unread: 5,
      lastMessage: 'I have finished the living room, moving to the kitchen next.',
      lastTime: '11:58 AM',
      messages: [
        { text: 'Good morning, starting the cleaning now.', dir: 'in', time: '9:00 AM', status: 'seen' },
        { text: 'Good morning, thank you!', dir: 'out', time: '9:01 AM', status: 'seen' },
        { text: 'Do you want me to also clean the balcony?', dir: 'in', time: '9:30 AM', status: 'seen' },
        { text: 'Yes please, that would be great.', dir: 'out', time: '9:31 AM', status: 'seen' },
        { text: 'I have finished the living room, moving to the kitchen next.', dir: 'in', time: '11:58 AM', status: 'delivered' }
      ]
    },
    {
      id: 5,
      name: 'Manish Karki',
      role: 'customer',
      roleLabel: 'Customer',
      avatar: 'https://i.pravatar.cc/100?img=15',
      online: false,
      unread: 0,
      lastMessage: 'Thank you for the quick service!',
      lastTime: 'Mon',
      messages: [
        { text: 'The AC is working perfectly now, thank you!', dir: 'in', time: 'Mon, 3:10 PM', status: 'seen' },
        { text: 'Glad to hear that! Let us know if you need anything else.', dir: 'out', time: 'Mon, 3:12 PM', status: 'seen' },
        { text: 'Thank you for the quick service!', dir: 'in', time: 'Mon, 3:13 PM', status: 'seen' }
      ]
    },
    {
      id: 6,
      name: 'Nisha Thapa',
      role: 'customer',
      roleLabel: 'Customer',
      avatar: 'https://i.pravatar.cc/100?img=25',
      online: false,
      unread: 0,
      lastMessage: 'Is the painter available this weekend?',
      lastTime: 'Sun',
      messages: [
        { text: 'Hi, is the painter available this weekend?', dir: 'in', time: 'Sun, 10:00 AM', status: 'seen' },
        { text: 'Let me check the schedule and get back to you.', dir: 'out', time: 'Sun, 10:05 AM', status: 'seen' }
      ]
    },
    {
      id: 7,
      name: 'Suman Adhikari',
      role: 'provider',
      roleLabel: 'Carpenter',
      avatar: 'https://i.pravatar.cc/100?img=51',
      online: true,
      unread: 2,
      lastMessage: 'I will bring the new hinges tomorrow.',
      lastTime: '8:05 AM',
      messages: [
        { text: 'The cabinet door hinge is broken, can it be fixed?', dir: 'out', time: '7:55 AM', status: 'seen' },
        { text: 'Yes, that is a quick fix. I will bring the new hinges tomorrow.', dir: 'in', time: '8:05 AM', status: 'delivered' }
      ]
    },
    {
      id: 8,
      name: 'Kabita Shrestha',
      role: 'customer',
      roleLabel: 'Customer',
      avatar: 'https://i.pravatar.cc/100?img=38',
      online: false,
      unread: 0,
      lastMessage: 'Great, I will book again next month.',
      lastTime: 'Aug 10',
      messages: [
        { text: 'The gardener did a wonderful job today.', dir: 'in', time: 'Aug 10, 5:40 PM', status: 'seen' },
        { text: "That's great to hear!", dir: 'out', time: 'Aug 10, 5:41 PM', status: 'seen' },
        { text: 'Great, I will book again next month.', dir: 'in', time: 'Aug 10, 5:42 PM', status: 'seen' }
      ]
    }
  ];

  let activeConvoId = null;
  let typingTimeout = null;

  const conversationListEl = document.getElementById('conversationList');
  const convoSearchEl = document.getElementById('convoSearch');
  const chatEmptyStateEl = document.getElementById('chatEmptyState');
  const chatActiveEl = document.getElementById('chatActive');
  const chatMessagesEl = document.getElementById('chatMessages');
  const chatNameEl = document.getElementById('chatName');
  const chatStatusTextEl = document.getElementById('chatStatusText');
  const chatStatusDotEl = document.getElementById('chatStatusDot');
  const chatAvatarEl = document.getElementById('chatAvatar');
  const messageInputEl = document.getElementById('messageInput');
  const sendMessageBtn = document.getElementById('sendMessageBtn');
  const typingIndicatorEl = document.getElementById('typingIndicator');
  const conversationPanelEl = document.getElementById('conversationPanel');
  const chatWindowEl = document.getElementById('chatWindow');
  const chatBackBtn = document.getElementById('chatBackBtn');
  const infoPanelEl = document.getElementById('infoPanel');
  const infoToggleBtn = document.getElementById('infoToggleBtn');
  const infoCloseBtn = document.getElementById('infoCloseBtn');

  /* ----------------------------------------------------------
     RENDER CONVERSATION LIST (with optional search filter)
  ---------------------------------------------------------- */
  function renderConversationList(filterText = '') {
    conversationListEl.innerHTML = '';

    const query = filterText.trim().toLowerCase();
    const filtered = CONVERSATIONS.filter((c) =>
      c.name.toLowerCase().includes(query) || c.roleLabel.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
      conversationListEl.innerHTML = `
        <div class="text-center text-muted py-5">
          <i class="fa-solid fa-magnifying-glass mb-2" style="font-size:1.4rem;"></i>
          <p class="mb-0" style="font-size:0.85rem;">No conversations found.</p>
        </div>`;
      return;
    }

    filtered.forEach((convo, index) => {
      const item = document.createElement('div');
      item.className = `convo-item ${convo.unread > 0 ? 'unread' : ''} ${convo.id === activeConvoId ? 'active' : ''}`;
      item.style.animationDelay = `${index * 0.04}s`;
      item.dataset.id = convo.id;

      item.innerHTML = `
        <div class="convo-avatar-wrap">
          <img src="${convo.avatar}" alt="${convo.name}" class="convo-avatar">
          <span class="convo-status-dot ${convo.online ? 'online' : ''}"></span>
        </div>
        <div class="convo-details">
          <span class="convo-role ${convo.role}">${convo.roleLabel}</span>
          <div class="convo-top-row">
            <span class="convo-name">${convo.name}</span>
            <span class="convo-time">${convo.lastTime}</span>
          </div>
          <div class="convo-bottom-row">
            <span class="convo-last-msg">${convo.lastMessage}</span>
            ${convo.unread > 0 ? `<span class="unread-badge">${convo.unread}</span>` : ''}
          </div>
        </div>
        <button class="convo-delete-btn" title="Delete conversation" data-action="delete">
          <i class="fa-solid fa-trash"></i>
        </button>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="delete"]')) return;
        openConversation(convo.id);
      });

      item.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteConversation(convo.id);
      });

      conversationListEl.appendChild(item);
    });
  }

  /* ----------------------------------------------------------
     OPEN / SWITCH CONVERSATION
  ---------------------------------------------------------- */
  function openConversation(id) {
    const convo = CONVERSATIONS.find((c) => c.id === id);
    if (!convo) return;

    activeConvoId = id;
    convo.unread = 0; // remove unread badge on open

    chatEmptyStateEl.classList.add('d-none');
    chatActiveEl.classList.remove('d-none');

    chatNameEl.textContent = convo.name;
    chatAvatarEl.src = convo.avatar;
    chatStatusDotEl.classList.toggle('online', convo.online);
    chatStatusTextEl.textContent = convo.online ? 'Online' : 'Offline';

    renderMessages(convo);
    renderConversationList(convoSearchEl.value);

    // Mobile: show chat window, hide conversation list
    if (window.innerWidth <= 767.98) {
      conversationPanelEl.classList.add('hide-mobile');
      chatWindowEl.classList.add('show-mobile');
    }
  }

  /* ----------------------------------------------------------
     RENDER MESSAGES for the active conversation
  ---------------------------------------------------------- */
  function renderMessages(convo) {
    chatMessagesEl.innerHTML = '';

    const divider = document.createElement('div');
    divider.className = 'msg-date-divider';
    divider.innerHTML = '<span>Today</span>';
    chatMessagesEl.appendChild(divider);

    convo.messages.forEach((msg) => {
      chatMessagesEl.appendChild(buildMessageBubble(msg));
    });

    scrollToBottom();
  }

  /* ----------------------------------------------------------
     BUILD a single message bubble element
  ---------------------------------------------------------- */
  function buildMessageBubble(msg, isNew = false) {
    const row = document.createElement('div');
    row.className = `message-row ${msg.dir === 'out' ? 'outgoing' : 'incoming'} ${isNew ? 'new' : ''}`;

    let ticksHtml = '';
    if (msg.dir === 'out') {
      if (msg.status === 'seen') {
        ticksHtml = '<i class="fa-solid fa-check-double msg-ticks seen"></i>';
      } else if (msg.status === 'delivered') {
        ticksHtml = '<i class="fa-solid fa-check-double msg-ticks delivered"></i>';
      } else {
        ticksHtml = '<i class="fa-solid fa-check msg-ticks delivered"></i>';
      }
    }

    const bubbleContent = msg.isFile
      ? `<i class="fa-solid ${msg.fileIcon || 'fa-file'} me-2"></i>${msg.text}`
      : msg.text;

    row.innerHTML = `
      <div class="message-bubble">
        ${bubbleContent}
        <div class="message-meta">
          <span>${msg.time}</span>
          ${ticksHtml}
        </div>
      </div>
    `;

    return row;
  }

  /* ----------------------------------------------------------
     SEND NEW MESSAGE
  ---------------------------------------------------------- */
  function sendMessage() {
    const text = messageInputEl.value.trim();
    if (!text || activeConvoId === null) return;

    const convo = CONVERSATIONS.find((c) => c.id === activeConvoId);
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg = { text, dir: 'out', time, status: 'sent' };
    convo.messages.push(newMsg);
    convo.lastMessage = text;
    convo.lastTime = time;

    chatMessagesEl.appendChild(buildMessageBubble(newMsg, true));
    scrollToBottom();

    messageInputEl.value = '';
    renderConversationList(convoSearchEl.value);

    // Simulate delivered -> seen progression
    setTimeout(() => {
      newMsg.status = 'delivered';
      refreshLastBubbleTicks();
    }, 600);

    // Simulate a typing reply from the other side
    simulateTypingReply(convo);
  }

  function refreshLastBubbleTicks() {
    if (activeConvoId === null) return;
    const convo = CONVERSATIONS.find((c) => c.id === activeConvoId);
    renderMessages(convo);
  }

  /* ----------------------------------------------------------
     SIMULATE TYPING INDICATOR + AUTO REPLY (dummy demo only)
  ---------------------------------------------------------- */
  function simulateTypingReply(convo) {
    clearTimeout(typingTimeout);
    typingIndicatorEl.classList.remove('d-none');
    scrollToBottom();

    const replies = [
      'Okay, got it.',
      'Sure, sounds good!',
      'Thank you for letting me know.',
      'Alright, I will check and confirm.',
      'Noted, thanks!'
    ];

    typingTimeout = setTimeout(() => {
      typingIndicatorEl.classList.add('d-none');

      if (convo.id !== activeConvoId) return;

      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const reply = replies[Math.floor(Math.random() * replies.length)];
      const replyMsg = { text: reply, dir: 'in', time, status: 'delivered' };

      convo.messages.push(replyMsg);
      convo.lastMessage = reply;
      convo.lastTime = time;

      chatMessagesEl.appendChild(buildMessageBubble(replyMsg, true));
      scrollToBottom();
      renderConversationList(convoSearchEl.value);
    }, 1600);
  }

  /* ----------------------------------------------------------
     SCROLL CHAT TO BOTTOM
  ---------------------------------------------------------- */
  function scrollToBottom() {
    requestAnimationFrame(() => {
      chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    });
  }

  /* ----------------------------------------------------------
     DELETE CONVERSATION
  ---------------------------------------------------------- */
  function deleteConversation(id) {
    const index = CONVERSATIONS.findIndex((c) => c.id === id);
    if (index === -1) return;

    CONVERSATIONS.splice(index, 1);

    if (activeConvoId === id) {
      activeConvoId = null;
      chatActiveEl.classList.add('d-none');
      chatEmptyStateEl.classList.remove('d-none');
    }

    renderConversationList(convoSearchEl.value);
  }

  /* ----------------------------------------------------------
     SEARCH CONVERSATIONS
  ---------------------------------------------------------- */
  function setupSearch() {
    convoSearchEl.addEventListener('input', () => {
      renderConversationList(convoSearchEl.value);
    });

    const headerSearch = document.getElementById('headerSearch');
    if (headerSearch) {
      headerSearch.addEventListener('input', () => {
        convoSearchEl.value = headerSearch.value;
        renderConversationList(headerSearch.value);
      });
    }
  }

  /* ----------------------------------------------------------
     COMPOSER EVENTS
  ---------------------------------------------------------- */
  function setupComposer() {
    sendMessageBtn.addEventListener('click', sendMessage);
    messageInputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  /* ----------------------------------------------------------
     MOBILE BACK BUTTON — return to conversation list
  ---------------------------------------------------------- */
  function setupMobileBack() {
    chatBackBtn.addEventListener('click', () => {
      conversationPanelEl.classList.remove('hide-mobile');
      chatWindowEl.classList.remove('show-mobile');
    });
  }

  /* ----------------------------------------------------------
     INFO PANEL TOGGLE (tablet/mobile)
  ---------------------------------------------------------- */
  function setupInfoPanelToggle() {
    infoToggleBtn.addEventListener('click', () => {
      infoPanelEl.classList.toggle('open');
    });
    infoCloseBtn.addEventListener('click', () => {
      infoPanelEl.classList.remove('open');
    });
  }

  /* ----------------------------------------------------------
     INIT
  ---------------------------------------------------------- */
  renderConversationList();
  setupSearch();
  setupComposer();
  setupMobileBack();
  setupInfoPanelToggle();

  // Auto-open the first conversation on desktop for a populated demo view
  if (window.innerWidth > 767.98 && CONVERSATIONS.length > 0) {
    openConversation(CONVERSATIONS[0].id);
  }

});