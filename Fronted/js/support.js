/* =========================================================
   OneClick · Help & Support Page
   Dummy frontend-only interactivity
========================================================= */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------
     Toast helper
  --------------------------------------------------------- */
  const toast = document.getElementById('successToast');
  const toastMessage = document.getElementById('toastMessage');
  let toastTimer = null;

  function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }


  /* ---------------------------------------------------------
     Button ripple effect
  --------------------------------------------------------- */
  document.querySelectorAll('.oc-ripple').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const circle = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      circle.classList.add('oc-ripple-circle');
      circle.style.width = circle.style.height = `${size}px`;
      circle.style.left = `${e.clientX - rect.left - size / 2}px`;
      circle.style.top = `${e.clientY - rect.top - size / 2}px`;
      this.appendChild(circle);
      setTimeout(() => circle.remove(), 650);
    });
  });


  /* ---------------------------------------------------------
     FAQ search filtering (+ popular search chips)
  --------------------------------------------------------- */
  const faqSearchInput = document.getElementById('faqSearchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');
  const faqItems = document.querySelectorAll('#faqAccordion .accordion-item');
  const faqNoResults = document.getElementById('faqNoResults');
  const faqResultCount = document.getElementById('faqResultCount');
  const popularChips = document.querySelectorAll('.oc-popular-chip');

  function filterFaq(term) {
    const query = term.trim().toLowerCase();
    let visibleCount = 0;

    faqItems.forEach(item => {
      const question = item.querySelector('.accordion-button').textContent.toLowerCase();
      const body = item.querySelector('.accordion-body').textContent.toLowerCase();
      const category = (item.getAttribute('data-faq-cat') || '').toLowerCase();
      const matches = !query || question.includes(query) || body.includes(query) || category.includes(query);

      item.classList.toggle('oc-faq-hidden', !matches);
      if (matches) {
        visibleCount++;
        item.classList.add('oc-faq-match');
      }
    });

    faqNoResults.classList.toggle('d-none', visibleCount !== 0);
    searchClearBtn.classList.toggle('d-none', query.length === 0);

    if (query) {
      faqResultCount.textContent = `${visibleCount} result${visibleCount === 1 ? '' : 's'} for "${term.trim()}"`;
    } else {
      faqResultCount.textContent = '';
    }
  }

  faqSearchInput.addEventListener('input', () => filterFaq(faqSearchInput.value));

  searchClearBtn.addEventListener('click', () => {
    faqSearchInput.value = '';
    filterFaq('');
    faqSearchInput.focus();
  });

  popularChips.forEach(chip => {
    chip.addEventListener('click', () => {
      popularChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const term = chip.getAttribute('data-term');
      faqSearchInput.value = chip.textContent.trim();
      filterFaq(term);
      document.getElementById('faq').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Quick help cards scroll + pre-filter FAQ by category
  document.querySelectorAll('[data-scroll-filter]').forEach(card => {
    card.addEventListener('click', (e) => {
      const filterKey = card.getAttribute('data-scroll-filter');
      const targetHref = card.getAttribute('href');
      if (targetHref === '#faq') {
        e.preventDefault();
        faqSearchInput.value = '';
        filterFaqByCategory(filterKey);
        document.getElementById('faq').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  function filterFaqByCategory(cat) {
    let visibleCount = 0;
    faqItems.forEach(item => {
      const matches = cat === 'all' || item.getAttribute('data-faq-cat') === cat;
      item.classList.toggle('oc-faq-hidden', !matches);
      if (matches) visibleCount++;
    });
    faqNoResults.classList.toggle('d-none', visibleCount !== 0);
    faqResultCount.textContent = `Showing ${visibleCount} FAQ${visibleCount === 1 ? '' : 's'} in this category`;
  }


  /* ---------------------------------------------------------
     Support form validation + character counter
  --------------------------------------------------------- */
  const supportForm = document.getElementById('supportForm');
  const ticketMessage = document.getElementById('ticketMessage');
  const charCounter = document.getElementById('charCounter');
  const messageFeedback = document.getElementById('messageFeedback');
  const submitTicketBtn = document.getElementById('submitTicketBtn');
  const MAX_CHARS = 500;
  const MIN_CHARS = 20;

  ticketMessage.addEventListener('input', () => {
    const len = ticketMessage.value.length;
    charCounter.textContent = `${len} / ${MAX_CHARS}`;
    charCounter.style.color = len >= MAX_CHARS ? 'var(--oc-danger)' : '';
  });

  const attachBtn = document.getElementById('attachBtn');
  const attachInput = document.getElementById('attachInput');
  const attachLabel = document.getElementById('attachLabel');

  attachBtn.addEventListener('click', () => attachInput.click());
  attachInput.addEventListener('change', () => {
    if (attachInput.files.length) {
      attachLabel.textContent = attachInput.files[0].name;
      attachBtn.classList.add('oc-has-file');
    } else {
      attachLabel.textContent = 'Attach a file (optional)';
      attachBtn.classList.remove('oc-has-file');
    }
  });

  supportForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const name = document.getElementById('ticketName');
    const email = document.getElementById('ticketEmail');
    const subject = document.getElementById('ticketSubject');
    const category = document.getElementById('ticketCategory');

    // Name
    if (!name.value.trim()) { name.classList.add('is-invalid'); valid = false; }
    else { name.classList.remove('is-invalid'); name.classList.add('is-valid'); }

    // Email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.value.trim())) { email.classList.add('is-invalid'); valid = false; }
    else { email.classList.remove('is-invalid'); email.classList.add('is-valid'); }

    // Subject
    if (!subject.value.trim()) { subject.classList.add('is-invalid'); valid = false; }
    else { subject.classList.remove('is-invalid'); subject.classList.add('is-valid'); }

    // Category
    if (!category.value) { category.classList.add('is-invalid'); valid = false; }
    else { category.classList.remove('is-invalid'); category.classList.add('is-valid'); }

    // Message
    if (ticketMessage.value.trim().length < MIN_CHARS) {
      ticketMessage.classList.add('is-invalid');
      messageFeedback.textContent = `Please describe your issue in at least ${MIN_CHARS} characters.`;
      valid = false;
    } else {
      ticketMessage.classList.remove('is-invalid');
      ticketMessage.classList.add('is-valid');
      messageFeedback.textContent = '';
    }

    if (!valid) {
      showToast('Please fix the highlighted fields.');
      return;
    }

    runSubmitAnimation();
  });

  function runSubmitAnimation() {
    const label = submitTicketBtn.querySelector('.btn-label');
    const spinner = submitTicketBtn.querySelector('.btn-spinner');
    const check = submitTicketBtn.querySelector('.btn-check');

    submitTicketBtn.disabled = true;
    label.classList.add('d-none');
    spinner.classList.remove('d-none');
    check.classList.add('d-none');

    setTimeout(() => {
      spinner.classList.add('d-none');
      check.classList.remove('d-none');

      setTimeout(() => {
        check.classList.add('d-none');
        label.classList.remove('d-none');
        submitTicketBtn.disabled = false;

        showToast('Ticket submitted! Our team will respond shortly.');
        supportForm.reset();
        supportForm.querySelectorAll('.is-valid, .is-invalid').forEach(el => el.classList.remove('is-valid', 'is-invalid'));
        charCounter.textContent = `0 / ${MAX_CHARS}`;
        attachLabel.textContent = 'Attach a file (optional)';
        attachBtn.classList.remove('oc-has-file');
      }, 900);
    }, 1100);
  }


  /* ---------------------------------------------------------
     Ticket history filtering
  --------------------------------------------------------- */
  const filterChips = document.querySelectorAll('.oc-filter-chip');
  const ticketRows = document.querySelectorAll('.oc-ticket-row');
  const ticketNoResults = document.getElementById('ticketNoResults');

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const filter = chip.getAttribute('data-filter');
      let visible = 0;

      ticketRows.forEach(row => {
        const matches = filter === 'all' || row.getAttribute('data-status') === filter;
        row.classList.toggle('oc-ticket-hidden', !matches);
        if (matches) visible++;
      });

      ticketNoResults.classList.toggle('d-none', visible !== 0);
    });
  });

  // Ticket "View Details" -> modal
  const ticketModalEl = document.getElementById('ticketModal');
  const ticketModal = new bootstrap.Modal(ticketModalEl);
  const ticketModalTitle = document.getElementById('ticketModalTitle');
  const ticketModalBody = document.getElementById('ticketModalBody');

  document.querySelectorAll('.oc-view-details').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.oc-ticket-row');
      const id = row.querySelector('.oc-ticket-id').textContent;
      const subject = row.querySelector('strong').textContent;
      const category = row.querySelector('.oc-ticket-meta span:nth-child(1)').textContent.trim();
      const date = row.querySelector('.oc-ticket-meta span:nth-child(2)').textContent.trim();
      const priority = row.querySelector('.oc-priority').textContent;
      const status = row.querySelector('.oc-status').textContent.trim();

      ticketModalTitle.textContent = `${id} — Ticket Details`;
      ticketModalBody.innerHTML = `
        <div class="oc-ticket-detail-row"><span>Subject</span><span>${subject}</span></div>
        <div class="oc-ticket-detail-row"><span>Category</span><span>${category}</span></div>
        <div class="oc-ticket-detail-row"><span>Date Submitted</span><span>${date}</span></div>
        <div class="oc-ticket-detail-row"><span>Priority</span><span>${priority}</span></div>
        <div class="oc-ticket-detail-row"><span>Status</span><span>${status}</span></div>
      `;
      ticketModal.show();
    });
  });


  /* ---------------------------------------------------------
     Live chat popup (dummy)
  --------------------------------------------------------- */
  const chatPopup = document.getElementById('chatPopup');
  const startChatBtn = document.getElementById('startChatBtn');
  const closeChatBtn = document.getElementById('closeChatBtn');
  const chatBody = document.getElementById('chatBody');
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');

  const dummyReplies = [
    "Thanks for the details — let me check that for you.",
    "Got it. Could you share your booking ID so I can look into it?",
    "I understand the frustration — we'll get this sorted quickly.",
    "That's a known issue, a fix is on the way. I'll email you once it's resolved.",
    "You can also find this in Settings if that's easier for you."
  ];

  startChatBtn.addEventListener('click', () => {
    chatPopup.classList.add('show');
    chatInput.focus();
  });

  closeChatBtn.addEventListener('click', () => {
    chatPopup.classList.remove('show');
  });

  function appendMessage(text, sender) {
    const msg = document.createElement('div');
    msg.classList.add('oc-chat-msg', sender === 'user' ? 'oc-chat-msg-user' : 'oc-chat-msg-agent');
    msg.textContent = text;
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function showTyping() {
    const typing = document.createElement('div');
    typing.classList.add('oc-chat-typing');
    typing.id = 'chatTypingIndicator';
    typing.innerHTML = '<span></span><span></span><span></span>';
    chatBody.appendChild(typing);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function removeTyping() {
    const typing = document.getElementById('chatTypingIndicator');
    if (typing) typing.remove();
  }

  function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    appendMessage(text, 'user');
    chatInput.value = '';

    showTyping();
    setTimeout(() => {
      removeTyping();
      const reply = dummyReplies[Math.floor(Math.random() * dummyReplies.length)];
      appendMessage(reply, 'agent');
    }, 1100 + Math.random() * 700);
  }

  chatSendBtn.addEventListener('click', sendChatMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendChatMessage();
  });


  /* ---------------------------------------------------------
     Emergency: Report Fraud (dummy)
  --------------------------------------------------------- */
  document.getElementById('reportFraudBtn').addEventListener('click', () => {
    showToast('Fraud report submitted. Our safety team will contact you shortly.');
  });

});