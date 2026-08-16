/* ==========================================================
   OneClick — Booking History Page Logic
   All data below is dummy/static. No backend, no real APIs.
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Dummy Bookings Data ---------- */
  const bookings = [
    {
      id: 'BK-20841', provider: 'Rajesh Karki', profession: 'Electrician',
      category: 'Electrical Repair', location: 'Baneshwor, Kathmandu',
      date: 'Aug 22, 2026', time: '10:30 AM', amount: 1025.0,
      method: 'Khalti', status: 'accepted', notes: 'Please bring extra wiring for the living room.',
      timelineStep: 1
    },
    {
      id: 'BK-20835', provider: 'Sunita Gurung', profession: 'House Cleaner',
      category: 'Deep Cleaning', location: 'Lazimpat, Kathmandu',
      date: 'Aug 18, 2026', time: '9:00 AM', amount: 1800.0,
      method: 'Cash on Service', status: 'ontheway', notes: 'Two-bedroom apartment, focus on kitchen.',
      timelineStep: 2
    },
    {
      id: 'BK-20812', provider: 'Bikash Shrestha', profession: 'Plumber',
      category: 'Pipe Installation', location: 'Patan, Lalitpur',
      date: 'Aug 10, 2026', time: '2:00 PM', amount: 1450.0,
      method: 'Credit Card', status: 'completed', notes: 'Kitchen sink leakage fixed.',
      timelineStep: 4
    },
    {
      id: 'BK-20798', provider: 'Anita Rai', profession: 'Beautician',
      category: 'Home Spa & Facial', location: 'Boudha, Kathmandu',
      date: 'Aug 5, 2026', time: '4:30 PM', amount: 2200.0,
      method: 'Khalti', status: 'completed', notes: '—',
      timelineStep: 4
    },
    {
      id: 'BK-20780', provider: 'Prakash Thapa', profession: 'Carpenter',
      category: 'Furniture Repair', location: 'Kalanki, Kathmandu',
      date: 'Jul 29, 2026', time: '11:00 AM', amount: 950.0,
      method: 'Cash on Service', status: 'cancelled', notes: 'Rescheduling requested by customer.',
      timelineStep: 1
    },
    {
      id: 'BK-20764', provider: 'Manisha Adhikari', profession: 'AC Technician',
      category: 'AC Servicing', location: 'Gongabu, Kathmandu',
      date: 'Jul 22, 2026', time: '1:00 PM', amount: 1600.0,
      method: 'Credit Card', status: 'completed', notes: 'Gas refill completed.',
      timelineStep: 4
    },
    {
      id: 'BK-20750', provider: 'Ramesh Bista', profession: 'Painter',
      category: 'Wall Painting', location: 'Sinamangal, Kathmandu',
      date: 'Aug 26, 2026', time: '8:30 AM', amount: 3400.0,
      method: 'Khalti', status: 'pending', notes: 'Two rooms, light blue shade requested.',
      timelineStep: 0
    },
    {
      id: 'BK-20733', provider: 'Sarita Magar', profession: 'Home Cleaner',
      category: 'Sofa & Carpet Cleaning', location: 'Chabahil, Kathmandu',
      date: 'Jul 15, 2026', time: '10:00 AM', amount: 1250.0,
      method: 'Cash on Service', status: 'cancelled', notes: 'Provider unavailable on requested date.',
      timelineStep: 1
    },
    {
      id: 'BK-20710', provider: 'Deepak Lama', profession: 'Electrician',
      category: 'Fan & Light Installation', location: 'Koteshwor, Kathmandu',
      date: 'Jul 8, 2026', time: '3:00 PM', amount: 780.0,
      method: 'Khalti', status: 'completed', notes: '—',
      timelineStep: 4
    },
    {
      id: 'BK-20695', provider: 'Nabin Poudel', profession: 'Pest Control',
      category: 'Full Home Pest Control', location: 'Naxal, Kathmandu',
      date: 'Aug 29, 2026', time: '9:30 AM', amount: 2100.0,
      method: 'Credit Card', status: 'pending', notes: 'Please use pet-safe chemicals.',
      timelineStep: 0
    }
  ];

  const avatarFor = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563EB&color=fff&size=128`;

  const statusMeta = {
    pending:   { label: 'Pending',    cls: 'status-pending' },
    accepted:  { label: 'Accepted',   cls: 'status-accepted' },
    ontheway:  { label: 'On the Way', cls: 'status-ontheway' },
    completed: { label: 'Completed',  cls: 'status-completed' },
    cancelled: { label: 'Cancelled',  cls: 'status-cancelled' }
  };

  function formatCurrency(amount) {
    return 'Rs. ' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* ---------- Action Buttons Per Status ---------- */
  function buildActions(booking) {
    const actionsByStatus = {
      completed: [
        { label: 'View Details', icon: 'fa-solid fa-eye', cls: 'btn-solid-outline', action: 'view' },
        { label: 'Book Again', icon: 'fa-solid fa-rotate', cls: 'btn-solid-primary', action: 'rebook' },
        { label: 'Leave Review', icon: 'fa-solid fa-star', cls: 'btn-solid-accent', action: 'review' }
      ],
      pending: [
        { label: 'Cancel Booking', icon: 'fa-solid fa-xmark', cls: 'btn-solid-danger', action: 'cancel' },
        { label: 'Contact Provider', icon: 'fa-solid fa-phone', cls: 'btn-solid-outline', action: 'contact' },
        { label: 'View Details', icon: 'fa-solid fa-eye', cls: 'btn-solid-outline', action: 'view' }
      ],
      accepted: [
        { label: 'Track Provider', icon: 'fa-solid fa-location-crosshairs', cls: 'btn-solid-primary', action: 'track' },
        { label: 'Message', icon: 'fa-regular fa-message', cls: 'btn-solid-outline', action: 'message' },
        { label: 'View Details', icon: 'fa-solid fa-eye', cls: 'btn-solid-outline', action: 'view' }
      ],
      ontheway: [
        { label: 'Track Provider', icon: 'fa-solid fa-location-crosshairs', cls: 'btn-solid-primary', action: 'track' },
        { label: 'Message', icon: 'fa-regular fa-message', cls: 'btn-solid-outline', action: 'message' },
        { label: 'View Details', icon: 'fa-solid fa-eye', cls: 'btn-solid-outline', action: 'view' }
      ],
      cancelled: [
        { label: 'Rebook', icon: 'fa-solid fa-rotate', cls: 'btn-solid-primary', action: 'rebook' },
        { label: 'View Details', icon: 'fa-solid fa-eye', cls: 'btn-solid-outline', action: 'view' }
      ]
    };

    // "Completed" status also gets a Download Invoice variant per spec
    const list = actionsByStatus[booking.status] || actionsByStatus.pending;
    if (booking.status === 'completed') {
      list.splice(1, 0, { label: 'Download Invoice', icon: 'fa-solid fa-download', cls: 'btn-solid-outline', action: 'invoice' });
    }
    return list;
  }

  /* ---------- Render a Single Booking Card ---------- */
  function renderCard(booking, index) {
    const meta = statusMeta[booking.status];
    const actions = buildActions(booking);

    const actionsHtml = actions.map(a =>
      `<button type="button" class="btn btn-ripple ${a.cls}" data-action="${a.action}" data-id="${booking.id}">
        <i class="${a.icon}"></i> ${a.label}
      </button>`
    ).join('');

    return `
      <article class="booking-card" style="animation-delay:${index * 0.06}s" data-status="${booking.status}"
        data-id="${booking.id}" data-provider="${booking.provider.toLowerCase()}"
        data-category="${booking.category.toLowerCase()}" data-location="${booking.location.toLowerCase()}">
        <div class="booking-card-top">
          <img src="${avatarFor(booking.provider)}" alt="${booking.provider}" class="booking-avatar">
          <div>
            <h4 class="booking-provider-name">${booking.provider}</h4>
            <p class="booking-provider-profession">${booking.profession}</p>
            <span class="booking-id-tag">#${booking.id}</span>
          </div>
          <span class="status-badge ${meta.cls}">${meta.label}</span>
        </div>

        <div class="booking-card-body">
          <div class="booking-meta-item">
            <span class="meta-label"><i class="fa-solid fa-tag"></i>Service</span>
            <span class="meta-value">${booking.category}</span>
          </div>
          <div class="booking-meta-item">
            <span class="meta-label"><i class="fa-solid fa-location-dot"></i>Location</span>
            <span class="meta-value">${booking.location}</span>
          </div>
          <div class="booking-meta-item">
            <span class="meta-label"><i class="fa-regular fa-calendar"></i>Date</span>
            <span class="meta-value">${booking.date}</span>
          </div>
          <div class="booking-meta-item">
            <span class="meta-label"><i class="fa-regular fa-clock"></i>Time</span>
            <span class="meta-value">${booking.time}</span>
          </div>
        </div>

        <div class="booking-card-footer">
          <div class="booking-amount">
            ${formatCurrency(booking.amount)}
            <span>${booking.method}</span>
          </div>
          <div class="booking-actions">
            ${actionsHtml}
          </div>
        </div>
      </article>
    `;
  }

  const bookingGrid = document.getElementById('bookingGrid');
  const emptyState = document.getElementById('emptyState');
  const paginationNav = document.getElementById('bookingPagination');

  function renderBookings(list) {
    if (list.length === 0) {
      bookingGrid.innerHTML = '';
      bookingGrid.classList.add('d-none');
      emptyState.classList.remove('d-none');
      paginationNav.classList.add('d-none');
    } else {
      bookingGrid.classList.remove('d-none');
      emptyState.classList.add('d-none');
      paginationNav.classList.remove('d-none');
      bookingGrid.innerHTML = list.map((b, i) => renderCard(b, i)).join('');
    }
  }

  renderBookings(bookings);

  /* ---------- Counter Animation ---------- */
  function animateCounters() {
    document.querySelectorAll('.summary-value').forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      const prefix = el.dataset.prefix || '';
      const duration = 1200;
      const startTime = performance.now();

      function tick(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const current = Math.round(target * eased);
        el.textContent = prefix + current.toLocaleString('en-IN');
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }
  animateCounters();

  /* ---------- Search & Filter ---------- */
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const dateFilter = document.getElementById('dateFilter');

  function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();
    const status = statusFilter.value;

    let filtered = bookings.filter(b => {
      const matchesQuery = !query ||
        b.id.toLowerCase().includes(query) ||
        b.provider.toLowerCase().includes(query) ||
        b.category.toLowerCase().includes(query) ||
        b.location.toLowerCase().includes(query);

      let matchesStatus = true;
      if (status === 'upcoming') {
        matchesStatus = b.status === 'accepted' || b.status === 'ontheway';
      } else if (status !== 'all') {
        matchesStatus = b.status === status;
      }

      return matchesQuery && matchesStatus;
    });

    // Date filter is dummy — reorders results, since dates are static strings
    const sortVal = dateFilter.value;
    if (sortVal === 'oldest') {
      filtered = [...filtered].reverse();
    }
    // 'newest' keeps original order; 'week'/'month' simply show the full filtered set (dummy demo)

    renderBookings(filtered);
  }

  searchInput.addEventListener('input', applyFilters);
  statusFilter.addEventListener('change', applyFilters);
  dateFilter.addEventListener('change', applyFilters);

  /* ---------- Ripple Effect ---------- */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-ripple');
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    ripple.className = 'ripple-effect';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });

  /* ---------- Booking Details Modal ---------- */
  const bookingDetailsModal = new bootstrap.Modal(document.getElementById('bookingDetailsModal'));

  function openBookingModal(id) {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;
    const meta = statusMeta[booking.status];

    document.getElementById('modalProviderImg').src = avatarFor(booking.provider);
    document.getElementById('modalProviderName').textContent = booking.provider;
    document.getElementById('modalProviderProfession').textContent = `${booking.profession} · ${booking.category}`;

    const badge = document.getElementById('modalStatusBadge');
    badge.textContent = meta.label;
    badge.className = 'status-badge ms-auto ' + meta.cls;

    document.getElementById('modalBookingId').textContent = '#' + booking.id;
    document.getElementById('modalCustomer').textContent = 'You (Logged-in Customer)';
    document.getElementById('modalDate').textContent = booking.date;
    document.getElementById('modalTime').textContent = booking.time;
    document.getElementById('modalAddress').textContent = booking.location;
    document.getElementById('modalPayment').textContent = `${formatCurrency(booking.amount)} · ${booking.method}`;
    document.getElementById('modalNotes').textContent = booking.notes || '—';

    // Timeline
    const steps = document.querySelectorAll('#statusTimeline .timeline-step');
    steps.forEach(step => {
      const stepIndex = parseInt(step.dataset.step, 10);
      step.classList.remove('completed', 'cancelled-step');

      if (booking.status === 'cancelled') {
        if (stepIndex <= booking.timelineStep) step.classList.add('cancelled-step');
      } else if (stepIndex <= booking.timelineStep) {
        step.classList.add('completed');
      }
    });

    bookingDetailsModal.show();
  }

  /* ---------- Card Action Handling (delegated) ---------- */
  bookingGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    switch (action) {
      case 'view':
        openBookingModal(id);
        break;
      case 'rebook':
        window.location.href = 'booking.html';
        break;
      case 'review':
        alert(`Thanks for using OneClick! Leave a review for ${booking.provider}.`);
        break;
      case 'cancel':
        if (confirm(`Cancel booking #${booking.id} with ${booking.provider}?`)) {
          booking.status = 'cancelled';
          applyFilters();
        }
        break;
      case 'contact':
        alert(`Contacting ${booking.provider}... (demo only)`);
        break;
      case 'track':
        alert(`Tracking ${booking.provider}'s live location... (demo only)`);
        break;
      case 'message':
        alert(`Opening chat with ${booking.provider}... (demo only)`);
        break;
      case 'invoice':
        alert(`Downloading invoice for #${booking.id}... (demo only)`);
        break;
      default:
        break;
    }
  });

  /* ---------- Pagination (frontend dummy) ---------- */
  const pageLinks = document.querySelectorAll('.booking-pagination .page-link[data-page]');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  let currentPage = 1;
  const totalPages = 3;

  function setActivePage(page) {
    currentPage = page;
    document.querySelectorAll('.booking-pagination .page-item').forEach(li => li.classList.remove('active'));
    const activeLink = document.querySelector(`.booking-pagination .page-link[data-page="${page}"]`);
    if (activeLink) activeLink.closest('.page-item').classList.add('active');

    prevPageBtn.classList.toggle('disabled', page === 1);
    nextPageBtn.classList.toggle('disabled', page === totalPages);

    bookingGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  pageLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      setActivePage(parseInt(link.dataset.page, 10));
    });
  });

  prevPageBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentPage > 1) setActivePage(currentPage - 1);
  });

  nextPageBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentPage < totalPages) setActivePage(currentPage + 1);
  });

  /* ---------- Sidebar Toggle (Mobile) ---------- */
  const sidebar = document.getElementById('oneclickSidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');

  function toggleSidebar(show) {
    sidebar.classList.toggle('show', show);
    sidebarBackdrop.classList.toggle('show', show);
  }

  sidebarToggleBtn.addEventListener('click', () => toggleSidebar(true));
  sidebarBackdrop.addEventListener('click', () => toggleSidebar(false));

  /* ---------- Bootstrap Tooltip Init ---------- */
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));

});