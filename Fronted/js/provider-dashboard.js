/* ==========================================================================
   ONECLICK — PROVIDER DASHBOARD SCRIPT
   Vanilla JavaScript. Dummy data / interactions only — no backend calls.
   Organized into small, focused init functions, all bootstrapped on
   DOMContentLoaded at the bottom of the file.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
  initSidebarToggle();
  initDropdowns();
  initOnlineToggle();
  initAvailabilitySwitches();
  initAnimatedCounters();
  initProgressBars();
  initRadialProgress();
  initEarningsChart();
  initRippleButtons();
  initJobRequestActions();
  initSearchInteraction();
  initBackToTop();
  initNavActiveState();
});

/* --------------------------------------------------------------------------
   SIDEBAR TOGGLE
   Desktop: collapses sidebar to icon-only rail.
   Mobile (<992px): slides sidebar in/out with an overlay.
   -------------------------------------------------------------------------- */
function initSidebarToggle() {
  const appShell = document.querySelector('.app-shell');
  const menuToggle = document.getElementById('menuToggle');
  const sidebarClose = document.getElementById('sidebarClose');
  const overlay = document.getElementById('sidebarOverlay');

  if (!appShell || !menuToggle) return;

  function isMobile() {
    return window.innerWidth <= 992;
  }

  menuToggle.addEventListener('click', function () {
    if (isMobile()) {
      appShell.classList.toggle('sidebar-open');
    } else {
      appShell.classList.toggle('sidebar-collapsed');
    }
  });

  if (sidebarClose) {
    sidebarClose.addEventListener('click', function () {
      appShell.classList.remove('sidebar-open');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', function () {
      appShell.classList.remove('sidebar-open');
    });
  }

  // Reset mobile drawer state when resizing back to desktop
  window.addEventListener('resize', function () {
    if (!isMobile()) {
      appShell.classList.remove('sidebar-open');
    }
  });
}

/* --------------------------------------------------------------------------
   NAV ACTIVE STATE
   Highlights the sidebar item matching the section scrolled into view,
   and on click (dummy single-page navigation — no real routing).
   -------------------------------------------------------------------------- */
function initNavActiveState() {
  const navItems = document.querySelectorAll('.oc-sidebar .nav-item');

  navItems.forEach(function (item) {
    const link = item.querySelector('.nav-link');
    if (!link) return;
    link.addEventListener('click', function () {
      navItems.forEach(function (i) { i.classList.remove('active'); });
      item.classList.add('active');

      // Close mobile drawer after navigating
      const appShell = document.querySelector('.app-shell');
      if (appShell) appShell.classList.remove('sidebar-open');
    });
  });
}

/* --------------------------------------------------------------------------
   NOTIFICATION / MESSAGE / PROFILE DROPDOWNS
   -------------------------------------------------------------------------- */
function initDropdowns() {
  const dropdowns = document.querySelectorAll('.topbar-dropdown');

  dropdowns.forEach(function (dropdown) {
    const trigger = dropdown.querySelector('.icon-btn, .profile-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('open');
      dropdowns.forEach(function (d) { d.classList.remove('open'); });
      if (!isOpen) dropdown.classList.add('open');
    });
  });

  // Close all dropdowns when clicking outside
  document.addEventListener('click', function () {
    dropdowns.forEach(function (d) { d.classList.remove('open'); });
  });
}

/* --------------------------------------------------------------------------
   ONLINE / OFFLINE TOGGLE (top navbar)
   -------------------------------------------------------------------------- */
function initOnlineToggle() {
  const toggle = document.getElementById('onlineToggle');
  const wrap = document.querySelector('.status-toggle-wrap');
  const label = document.getElementById('statusLabel');

  if (!toggle || !wrap || !label) return;

  toggle.addEventListener('change', function () {
    if (toggle.checked) {
      wrap.classList.remove('offline');
      label.textContent = 'Online';
    } else {
      wrap.classList.add('offline');
      label.textContent = 'Offline';
    }
  });
}

/* --------------------------------------------------------------------------
   AVAILABILITY SWITCHES
   "Available Today" / "Unavailable" behave as mutually exclusive states.
   Vacation Mode is independent.
   -------------------------------------------------------------------------- */
function initAvailabilitySwitches() {
  const availableToday = document.getElementById('availableToday');
  const unavailable = document.getElementById('unavailable');

  if (!availableToday || !unavailable) return;

  availableToday.addEventListener('change', function () {
    if (availableToday.checked) unavailable.checked = false;
  });

  unavailable.addEventListener('change', function () {
    if (unavailable.checked) availableToday.checked = false;
  });
}

/* --------------------------------------------------------------------------
   ANIMATED COUNTERS (statistics cards)
   Reads data-count / data-prefix / data-suffix / data-decimal attributes
   and animates from 0 to the target value once the card enters the viewport.
   -------------------------------------------------------------------------- */
function initAnimatedCounters() {
  const counters = document.querySelectorAll('.stat-value[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach(function (counter) { observer.observe(counter); });
}

function animateCounter(el) {
  const target = parseFloat(el.getAttribute('data-count'));
  const prefix = el.getAttribute('data-prefix') || '';
  const suffix = el.getAttribute('data-suffix') || '';
  const decimals = parseInt(el.getAttribute('data-decimal') || '0', 10);
  const duration = 1400; // ms
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    // Ease-out for a smoother finish
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = target * eased;

    el.textContent = prefix + formatNumber(current, decimals) + suffix;

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = prefix + formatNumber(target, decimals) + suffix;
    }
  }

  requestAnimationFrame(tick);
}

function formatNumber(value, decimals) {
  if (decimals > 0) {
    return value.toFixed(decimals);
  }
  return Math.round(value).toLocaleString('en-IN');
}

/* --------------------------------------------------------------------------
   PROGRESS BAR ANIMATION (Current Job panel)
   -------------------------------------------------------------------------- */
function initProgressBars() {
  const bar = document.querySelector('.oc-progress-bar');
  if (!bar) return;

  const targetWidth = bar.getAttribute('data-progress') || '0';

  // Slight delay so the fill animates in after the panel fades in
  setTimeout(function () {
    bar.style.width = targetWidth + '%';
  }, 400);
}

/* --------------------------------------------------------------------------
   RADIAL (CIRCULAR) PROGRESS — Performance section
   -------------------------------------------------------------------------- */
function initRadialProgress() {
  const radials = document.querySelectorAll('.radial-progress');
  if (!radials.length) return;

  const circumference = 2 * Math.PI * 52; // r=52 from the SVG markup

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const percent = parseFloat(el.getAttribute('data-percent')) || 0;
      const bar = el.querySelector('.radial-bar');
      if (bar) {
        const offset = circumference - (percent / 100) * circumference;
        // Trigger after a tick so the CSS transition plays
        requestAnimationFrame(function () {
          bar.style.strokeDashoffset = offset;
        });
      }
      observer.unobserve(el);
    });
  }, { threshold: 0.4 });

  radials.forEach(function (el) { observer.observe(el); });
}

/* --------------------------------------------------------------------------
   MINI BAR CHART (Monthly Earnings)
   Animates each bar to its --val custom property.
   -------------------------------------------------------------------------- */
function initEarningsChart() {
  const bars = document.querySelectorAll('.mini-bar-chart .bar');
  if (!bars.length) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const val = getComputedStyle(el).getPropertyValue('--val').trim();
      requestAnimationFrame(function () {
        el.style.height = val;
      });
      observer.unobserve(el);
    });
  }, { threshold: 0.3 });

  bars.forEach(function (bar) { observer.observe(bar); });
}

/* --------------------------------------------------------------------------
   RIPPLE BUTTON EFFECT
   -------------------------------------------------------------------------- */
function initRippleButtons() {
  const buttons = document.querySelectorAll('.ripple');

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      const rect = btn.getBoundingClientRect();
      const circle = document.createElement('span');
      const size = Math.max(rect.width, rect.height);

      circle.classList.add('ripple-circle');
      circle.style.width = circle.style.height = size + 'px';
      circle.style.left = (e.clientX - rect.left - size / 2) + 'px';
      circle.style.top = (e.clientY - rect.top - size / 2) + 'px';

      btn.appendChild(circle);

      window.setTimeout(function () {
        circle.remove();
      }, 600);
    });
  });
}

/* --------------------------------------------------------------------------
   JOB REQUEST ACCEPT / REJECT (dummy — front-end only)
   -------------------------------------------------------------------------- */
function initJobRequestActions() {
  const acceptButtons = document.querySelectorAll('.accept-btn');
  const rejectButtons = document.querySelectorAll('.reject-btn');

  acceptButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const card = btn.closest('.request-card');
      if (!card) return;
      card.classList.add('card-accepted');
      btn.innerHTML = '<i class="fa-solid fa-check-double"></i> Accepted';
      btn.disabled = true;
      const rejectBtn = card.querySelector('.reject-btn');
      if (rejectBtn) rejectBtn.disabled = true;
    });
  });

  rejectButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const card = btn.closest('.request-card');
      if (!card) return;
      card.classList.add('card-rejected');
    });
  });
}

/* --------------------------------------------------------------------------
   SEARCH INTERACTION (top navbar)
   Dummy front-end filter placeholder — logs intent, ready for backend wiring.
   -------------------------------------------------------------------------- */
function initSearchInteraction() {
  const searchInput = document.getElementById('topSearch');
  if (!searchInput) return;

  let debounceTimer;

  searchInput.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    const query = searchInput.value.trim();

    debounceTimer = setTimeout(function () {
      if (query.length === 0) return;
      // Placeholder for real search — wire up to Django search endpoint later
      console.log('Searching OneClick provider dashboard for:', query);
    }, 300);
  });

  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchInput.blur();
    }
  });
}

/* --------------------------------------------------------------------------
   BACK TO TOP
   -------------------------------------------------------------------------- */
function initBackToTop() {
  const backToTopBtn = document.getElementById('backToTop');
  if (!backToTopBtn) return;

  window.addEventListener('scroll', function () {
    if (window.scrollY > 400) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });

  backToTopBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}