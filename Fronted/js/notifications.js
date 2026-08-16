/* ==========================================================
   OneClick — Notifications Page JS
   Dummy data driven. No backend calls — ready for Django
   REST API integration later (replace NOTIFICATIONS array
   with a fetch to /api/notifications/ and re-render).
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------------------------
     DUMMY DATA — 12 notifications covering all types
  ---------------------------------------------------------- */
  let NOTIFICATIONS = [
    {
      id: 1,
      type: 'booking',
      icon: 'fa-calendar-check',
      title: 'Booking Confirmed',
      description: 'Your booking for Electrician service on Aug 18 has been confirmed.',
      time: '5 min ago',
      status: { label: 'Confirmed', cls: 'success' },
      unread: true
    },
    {
      id: 2,
      type: 'booking',
      icon: 'fa-thumbs-up',
      title: 'Provider Accepted Your Request',
      description: 'Rojit Pokharel has accepted your service request and will arrive on time.',
      time: '20 min ago',
      status: { label: 'Accepted', cls: 'success' },
      unread: true
    },
    {
      id: 3,
      type: 'booking',
      icon: 'fa-van-shuttle',
      title: 'Provider Is On The Way',
      description: 'Your provider has started the journey to your location. Estimated arrival: 15 mins.',
      time: '35 min ago',
      status: { label: 'In Progress', cls: 'info' },
      unread: true
    },
    {
      id: 4,
      type: 'booking',
      icon: 'fa-flag-checkered',
      title: 'Booking Completed',
      description: 'Your plumbing service has been marked as completed. Please rate your experience.',
      time: '1 hour ago',
      status: { label: 'Completed', cls: 'success' },
      unread: false
    },
    {
      id: 5,
      type: 'payment',
      icon: 'fa-credit-card',
      title: 'Payment Successful',
      description: 'Rs. 1,764.50 was successfully paid for booking #OC-20458.',
      time: '2 hours ago',
      status: { label: 'Paid', cls: 'success' },
      unread: true
    },
    {
      id: 6,
      type: 'payment',
      icon: 'fa-clock',
      title: 'Payment Pending',
      description: 'Payment for booking #OC-20461 is pending. Please complete it to confirm your slot.',
      time: '3 hours ago',
      status: { label: 'Pending', cls: 'pending' },
      unread: true
    },
    {
      id: 7,
      type: 'message',
      icon: 'fa-comment-dots',
      title: 'New Message Received',
      description: 'You received a new message from your service provider regarding your appointment.',
      time: '4 hours ago',
      status: { label: 'New', cls: 'info' },
      unread: true
    },
    {
      id: 8,
      type: 'alert',
      icon: 'fa-circle-xmark',
      title: 'Booking Cancelled',
      description: 'Your booking for AC repair on Aug 15 was cancelled by the provider.',
      time: 'Yesterday',
      status: { label: 'Cancelled', cls: 'danger' },
      unread: false
    },
    {
      id: 9,
      type: 'system',
      icon: 'fa-calendar-days',
      title: 'Provider Updated Availability',
      description: 'Rojit Electricals updated their available time slots for this week.',
      time: 'Yesterday',
      status: { label: 'Update', cls: 'info' },
      unread: false
    },
    {
      id: 10,
      type: 'system',
      icon: 'fa-bullhorn',
      title: 'Admin Announcement',
      description: 'OneClick will undergo scheduled maintenance on Aug 20, 1:00 AM - 3:00 AM.',
      time: '2 days ago',
      status: { label: 'Notice', cls: 'info' },
      unread: true
    },
    {
      id: 11,
      type: 'offer',
      icon: 'fa-tags',
      title: 'Discount Available',
      description: 'Get 20% off on your next home cleaning booking. Offer valid till Aug 25.',
      time: '2 days ago',
      status: { label: 'Offer', cls: 'pending' },
      unread: true
    },
    {
      id: 12,
      type: 'booking',
      icon: 'fa-bell',
      title: 'Reminder: Upcoming Booking',
      description: 'You have a Plumbing service scheduled tomorrow at 11:00 AM. Be ready!',
      time: '3 days ago',
      status: { label: 'Reminder', cls: 'info' },
      unread: false
    }
  ];

  let currentFilter = 'all';

  const listEl = document.getElementById('notificationList');
  const emptyStateEl = document.getElementById('emptyState');

  /* ----------------------------------------------------------
     ICON TYPE CLASS MAP — controls the colored icon badge
  ---------------------------------------------------------- */
  const typeIconClass = {
    booking: 'type-booking',
    payment: 'type-payment',
    system: 'type-system',
    alert: 'type-alert',
    offer: 'type-offer',
    message: 'type-message'
  };

  /* ----------------------------------------------------------
     RENDER NOTIFICATIONS based on current filter
  ---------------------------------------------------------- */
  function renderNotifications() {
    const filtered = NOTIFICATIONS.filter((n) => {
      if (currentFilter === 'all') return true;
      if (currentFilter === 'unread') return n.unread;
      return n.type === currentFilter;
    });

    listEl.innerHTML = '';

    if (filtered.length === 0) {
      listEl.classList.add('d-none');
      emptyStateEl.classList.remove('d-none');
    } else {
      listEl.classList.remove('d-none');
      emptyStateEl.classList.add('d-none');

      filtered.forEach((n, index) => {
        listEl.appendChild(buildNotificationCard(n, index));
      });
    }

    updateSummary();
    updateNavBadge();
  }

  /* ----------------------------------------------------------
     BUILD a single notification card element
  ---------------------------------------------------------- */
  function buildNotificationCard(n, index) {
    const card = document.createElement('div');
    card.className = `notification-card ${n.unread ? 'unread' : 'read'}`;
    card.style.animationDelay = `${index * 0.05}s`;
    card.dataset.id = n.id;

    const iconClass = typeIconClass[n.type] || 'type-booking';

    card.innerHTML = `
      <div class="notif-icon ${iconClass}">
        <i class="fa-solid ${n.icon}"></i>
      </div>
      <div class="notif-body">
        <div class="notif-top-row">
          <span class="notif-title">
            ${n.title}
            ${n.unread ? '<span class="unread-dot"></span>' : ''}
          </span>
        </div>
        <p class="notif-desc">${n.description}</p>
        <div class="notif-meta">
          <span class="notif-time"><i class="fa-regular fa-clock me-1"></i>${n.time}</span>
          <span class="notif-status ${n.status.cls}">${n.status.label}</span>
        </div>
      </div>
      <div class="notif-actions">
        <button class="notif-action-btn view" data-action="view">
          <i class="fa-regular fa-eye me-1"></i>View
        </button>
        <button class="notif-action-btn delete" data-action="delete">
          <i class="fa-regular fa-trash-can me-1"></i>Delete
        </button>
      </div>
    `;

    // Click on card body -> mark as read + ripple
    card.addEventListener('click', (e) => {
      createRipple(e, card);
      if (!e.target.closest('.notif-action-btn')) {
        markAsRead(n.id);
      }
    });

    // View Details
    card.querySelector('[data-action="view"]').addEventListener('click', (e) => {
      e.stopPropagation();
      markAsRead(n.id);
      alert(`Viewing details for: "${n.title}"`);
    });

    // Delete
    card.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteNotification(n.id);
    });

    return card;
  }

  /* ----------------------------------------------------------
     RIPPLE EFFECT on notification click
  ---------------------------------------------------------- */
  function createRipple(event, card) {
    const rect = card.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);

    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;

    card.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  /* ----------------------------------------------------------
     MARK ONE AS READ
  ---------------------------------------------------------- */
  function markAsRead(id) {
    const notif = NOTIFICATIONS.find((n) => n.id === id);
    if (notif && notif.unread) {
      notif.unread = false;
      renderNotifications();
    }
  }

  /* ----------------------------------------------------------
     MARK ALL AS READ
  ---------------------------------------------------------- */
  function markAllAsRead() {
    NOTIFICATIONS.forEach((n) => (n.unread = false));
    renderNotifications();
  }

  /* ----------------------------------------------------------
     DELETE NOTIFICATION
  ---------------------------------------------------------- */
  function deleteNotification(id) {
    NOTIFICATIONS = NOTIFICATIONS.filter((n) => n.id !== id);
    renderNotifications();
  }

  /* ----------------------------------------------------------
     UPDATE SUMMARY CARD COUNTS
  ---------------------------------------------------------- */
  function updateSummary() {
    const total = NOTIFICATIONS.length;
    const unread = NOTIFICATIONS.filter((n) => n.unread).length;
    const booking = NOTIFICATIONS.filter((n) => n.type === 'booking').length;
    const payment = NOTIFICATIONS.filter((n) => n.type === 'payment').length;

    document.getElementById('summaryTotal').textContent = total;
    document.getElementById('summaryUnread').textContent = unread;
    document.getElementById('summaryBooking').textContent = booking;
    document.getElementById('summaryPayment').textContent = payment;
  }

  /* ----------------------------------------------------------
     UPDATE NAVBAR UNREAD BADGE
  ---------------------------------------------------------- */
  function updateNavBadge() {
    const unread = NOTIFICATIONS.filter((n) => n.unread).length;
    const badge = document.getElementById('navUnreadBadge');
    if (!badge) return;

    if (unread > 0) {
      badge.textContent = unread;
      badge.classList.remove('d-none');
    } else {
      badge.classList.add('d-none');
    }
  }

  /* ----------------------------------------------------------
     FILTER TABS
  ---------------------------------------------------------- */
  function setupFilterTabs() {
    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
        renderNotifications();
      });
    });
  }

  /* ----------------------------------------------------------
     MARK ALL AS READ BUTTON
  ---------------------------------------------------------- */
  function setupMarkAllRead() {
    const btn = document.getElementById('markAllReadBtn');
    if (btn) {
      btn.addEventListener('click', markAllAsRead);
    }
  }

  /* ----------------------------------------------------------
     INIT
  ---------------------------------------------------------- */
  setupFilterTabs();
  setupMarkAllRead();
  renderNotifications();

});