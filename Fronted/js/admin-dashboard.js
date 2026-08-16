/* =========================================================
   ONECLICK ADMIN DASHBOARD — SCRIPT
   Vanilla JS only. Dummy data. No backend integration.
   Organized into small, independent modules initialized on DOMContentLoaded.
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {
  initSidebarToggle();
  initAnimatedCounters();
  initGlobalSearch();
  initBackToTop();
  initRippleButtons();
  initThemeToggle();
  initQuickNotes();
  initChartPlaceholders();
  initTableRowActions();
});

/* ---------------------------------------------------------
   1. SIDEBAR TOGGLE (desktop collapse + mobile drawer)
   --------------------------------------------------------- */
function initSidebarToggle() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const toggleBtn = document.getElementById('sidebarToggle');
  const closeBtn = document.getElementById('sidebarClose');

  if (!sidebar || !toggleBtn) return;

  function openMobileSidebar() {
    sidebar.classList.add('show');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileSidebar() {
    sidebar.classList.remove('show');
    overlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  function isMobile() {
    return window.innerWidth <= 991.98;
  }

  toggleBtn.addEventListener('click', function () {
    if (isMobile()) {
      sidebar.classList.contains('show') ? closeMobileSidebar() : openMobileSidebar();
    } else {
      // Desktop: collapse sidebar width for more content space
      document.body.classList.toggle('sidebar-collapsed-mode');
      sidebar.classList.toggle('collapsed');
      document.getElementById('mainWrapper').classList.toggle('expanded');
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', closeMobileSidebar);
  if (overlay) overlay.addEventListener('click', closeMobileSidebar);

  // Close mobile sidebar automatically when a nav link is tapped
  document.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', function () {
      setActiveNavLink(link);
      if (isMobile()) closeMobileSidebar();
    });
  });

  // Reset state on resize back to desktop
  window.addEventListener('resize', function () {
    if (!isMobile()) closeMobileSidebar();
  });
}

function setActiveNavLink(clickedLink) {
  document.querySelectorAll('.nav-item').forEach(function (item) {
    item.classList.remove('active');
  });
  const parentItem = clickedLink.closest('.nav-item');
  if (parentItem) parentItem.classList.add('active');
}

/* ---------------------------------------------------------
   2. ANIMATED COUNTERS (stat cards)
   --------------------------------------------------------- */
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
  }, { threshold: 0.3 });

  counters.forEach(function (counter) {
    observer.observe(counter);
  });
}

function animateCounter(el) {
  const target = parseFloat(el.getAttribute('data-count'));
  const prefix = el.getAttribute('data-prefix') || '';
  const decimals = parseInt(el.getAttribute('data-decimal') || '0', 10);
  const duration = 1400; // ms
  const startTime = performance.now();

  function frame(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    // Ease-out cubic for a smooth deceleration
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = target * eased;

    el.textContent = prefix + formatNumber(currentValue, decimals);

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      el.textContent = prefix + formatNumber(target, decimals);
    }
  }

  requestAnimationFrame(frame);
}

function formatNumber(value, decimals) {
  if (decimals > 0) {
    return value.toFixed(decimals);
  }
  return Math.round(value).toLocaleString('en-US');
}

/* ---------------------------------------------------------
   3. GLOBAL SEARCH INTERACTION (dummy client-side filter)
   --------------------------------------------------------- */
function initGlobalSearch() {
  const input = document.getElementById('globalSearch');
  const resultsBox = document.getElementById('searchResults');
  if (!input || !resultsBox) return;

  // Dummy searchable index — replace with live API results later
  const searchIndex = [
    { label: 'Sabina Gurung', type: 'Customer', icon: 'fa-user' },
    { label: 'Bikash Shrestha', type: 'Provider · Electrician', icon: 'fa-user-gear' },
    { label: '#BK-1042', type: 'Booking', icon: 'fa-calendar-check' },
    { label: '#BK-1041', type: 'Booking', icon: 'fa-calendar-check' },
    { label: 'Electrician', type: 'Service Category', icon: 'fa-toolbox' },
    { label: 'Plumber', type: 'Service Category', icon: 'fa-toolbox' },
    { label: '#TXN-8821', type: 'Transaction', icon: 'fa-receipt' },
    { label: 'Rajendra Shah', type: 'Provider · Pending Approval', icon: 'fa-user-clock' }
  ];

  input.addEventListener('input', function () {
    const query = input.value.trim().toLowerCase();

    if (!query) {
      resultsBox.classList.remove('show');
      resultsBox.innerHTML = '';
      return;
    }

    const matches = searchIndex.filter(function (item) {
      return item.label.toLowerCase().includes(query);
    });

    renderSearchResults(matches, resultsBox);
  });

  document.addEventListener('click', function (e) {
    if (!input.contains(e.target) && !resultsBox.contains(e.target)) {
      resultsBox.classList.remove('show');
    }
  });

  // Keyboard shortcut: Ctrl/Cmd + K focuses the search box
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      input.focus();
    }
  });
}

function renderSearchResults(matches, resultsBox) {
  if (!matches.length) {
    resultsBox.innerHTML = '<div class="search-empty">No results found</div>';
    resultsBox.classList.add('show');
    return;
  }

  resultsBox.innerHTML = matches.map(function (item) {
    return (
      '<a href="#" class="search-result-item">' +
        '<i class="fa-solid ' + item.icon + '"></i>' +
        '<span>' + item.label + ' <small class="text-muted">— ' + item.type + '</small></span>' +
      '</a>'
    );
  }).join('');

  resultsBox.classList.add('show');
}

/* ---------------------------------------------------------
   4. BACK TO TOP BUTTON
   --------------------------------------------------------- */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', function () {
    if (window.scrollY > 320) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
    }
  });

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ---------------------------------------------------------
   5. RIPPLE EFFECT ON BUTTONS
   --------------------------------------------------------- */
function initRippleButtons() {
  document.querySelectorAll('.ripple').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      const rect = btn.getBoundingClientRect();
      const circle = document.createElement('span');
      const size = Math.max(rect.width, rect.height);

      circle.className = 'ripple-circle';
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

/* ---------------------------------------------------------
   6. THEME TOGGLE (light / dark surface accent — visual only)
   --------------------------------------------------------- */
function initThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  toggle.addEventListener('click', function () {
    document.body.classList.toggle('dark-preview');
    const icon = toggle.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-moon');
      icon.classList.toggle('fa-sun');
    }
  });
}

/* ---------------------------------------------------------
   7. QUICK NOTES (local, in-memory save simulation)
   --------------------------------------------------------- */
function initQuickNotes() {
  const saveBtn = document.querySelector('.quick-notes-area')?.closest('.aside-card')?.querySelector('button');
  const textarea = document.querySelector('.quick-notes-area');
  if (!saveBtn || !textarea) return;

  saveBtn.addEventListener('click', function () {
    const originalHTML = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved';
    saveBtn.disabled = true;

    window.setTimeout(function () {
      saveBtn.innerHTML = originalHTML;
      saveBtn.disabled = false;
    }, 1400);
  });
}

/* ---------------------------------------------------------
   8. CHART PLACEHOLDERS (ready for Chart.js swap-in)
   --------------------------------------------------------- */
function initChartPlaceholders() {
  const canvases = document.querySelectorAll('canvas[data-chart-placeholder]');
  if (!canvases.length) return;

  canvases.forEach(function (canvas) {
    drawPlaceholderChart(canvas, canvas.getAttribute('data-chart-placeholder'));
  });
}

/**
 * Draws a lightweight dummy chart directly on canvas using the Canvas API.
 * This is a visual placeholder only — swap this function out for real
 * Chart.js instances once live data endpoints are wired up:
 *
 *   new Chart(canvas, { type: 'bar', data: {...}, options: {...} });
 */
function drawPlaceholderChart(canvas, type) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = (canvas.height || 220) * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = canvas.height / dpr;

  const primary = getComputedStyle(document.documentElement).getPropertyValue('--oc-primary').trim() || '#2563EB';
  const secondary = getComputedStyle(document.documentElement).getPropertyValue('--oc-secondary').trim() || '#3B82F6';
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--oc-accent').trim() || '#F59E0B';
  const success = getComputedStyle(document.documentElement).getPropertyValue('--oc-success').trim() || '#22C55E';
  const slate = '#E2E8F0';

  ctx.clearRect(0, 0, width, height);

  if (type === 'bar') {
    const values = [40, 65, 50, 80, 60, 90];
    const barWidth = width / (values.length * 2);
    const maxVal = 100;

    values.forEach(function (val, i) {
      const barHeight = (val / maxVal) * (height - 30);
      const x = i * (barWidth * 2) + barWidth / 2;
      const y = height - barHeight - 10;

      const gradient = ctx.createLinearGradient(0, y, 0, height - 10);
      gradient.addColorStop(0, primary);
      gradient.addColorStop(1, secondary);

      ctx.fillStyle = gradient;
      roundRect(ctx, x, y, barWidth, barHeight, 6);
      ctx.fill();
    });
  }

  if (type === 'line') {
    const values = [30, 55, 42, 70, 58, 85];
    const stepX = width / (values.length - 1);
    const maxVal = 100;

    // Filled area under the line
    ctx.beginPath();
    ctx.moveTo(0, height - (values[0] / maxVal) * (height - 20) - 10);
    values.forEach(function (val, i) {
      const x = i * stepX;
      const y = height - (val / maxVal) * (height - 20) - 10;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    const areaGradient = ctx.createLinearGradient(0, 0, 0, height);
    areaGradient.addColorStop(0, hexToRgba(primary, 0.25));
    areaGradient.addColorStop(1, hexToRgba(primary, 0.02));
    ctx.fillStyle = areaGradient;
    ctx.fill();

    // Line stroke
    ctx.beginPath();
    values.forEach(function (val, i) {
      const x = i * stepX;
      const y = height - (val / maxVal) * (height - 20) - 10;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = primary;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Point markers
    values.forEach(function (val, i) {
      const x = i * stepX;
      const y = height - (val / maxVal) * (height - 20) - 10;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = primary;
      ctx.stroke();
    });
  }

  if (type === 'doughnut') {
    const segments = [
      { value: 32, color: primary },
      { value: 24, color: secondary },
      { value: 20, color: accent },
      { value: 14, color: success },
      { value: 10, color: slate }
    ];

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 10;
    const innerRadius = radius * 0.62;
    let startAngle = -Math.PI / 2;

    segments.forEach(function (seg) {
      const sliceAngle = (seg.value / 100) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
      ctx.arc(cx, cy, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      startAngle += sliceAngle;
    });
  }

  // Subtle baseline for bar/line charts
  if (type === 'bar' || type === 'line') {
    ctx.beginPath();
    ctx.moveTo(0, height - 10);
    ctx.lineTo(width, height - 10);
    ctx.strokeStyle = slate;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hexToRgba(hex, alpha) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(function (c) { return c + c; }).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

/* ---------------------------------------------------------
   9. TABLE ROW ACTIONS (dummy view/edit/delete + approve/reject)
   --------------------------------------------------------- */
function initTableRowActions() {
  // View / Edit / Delete buttons on bookings & service tables
  document.querySelectorAll('.action-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const row = btn.closest('tr') || btn.closest('.service-card');
      const label = btn.getAttribute('title') || 'Action';
      flashRowFeedback(row, label);
    });
  });

  // Approve / Reject buttons across registrations, provider approvals, reviews
  document.querySelectorAll('.btn-approve, .btn-reject').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.disabled) return;
      const isApprove = btn.classList.contains('btn-approve');
      const container = btn.closest('tr') || btn.closest('.approval-card') || btn.closest('.review-item');

      if (container) {
        container.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
        container.style.opacity = '0.45';
        window.setTimeout(function () {
          container.style.opacity = '1';
        }, 500);
      }

      // Placeholder feedback only — wire to real API calls on integration
      console.log((isApprove ? 'Approved' : 'Rejected/Hidden') + ' item — dummy interaction, no backend call.');
    });
  });
}

function flashRowFeedback(el, label) {
  if (!el) return;
  el.style.transition = 'background-color 0.3s ease';
  const originalBg = el.style.backgroundColor;
  el.style.backgroundColor = 'rgba(37, 99, 235, 0.08)';
  window.setTimeout(function () {
    el.style.backgroundColor = originalBg;
  }, 400);
  console.log(label + ' action triggered — dummy interaction, ready for backend wiring.');
}