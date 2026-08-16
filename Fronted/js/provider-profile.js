/* =========================================================
   ONECLICK — PROVIDER PROFILE PAGE SCRIPT
   Vanilla JS only. Dummy data & client-side interactions.
   No backend integration.
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {
  initAnimatedCounters();
  initSaveProvider();
  initActionButtons();
  initGalleryLightbox();
  initLoadMoreReviews();
  initMobileActionBar();
  initRippleButtons();
  initScrollAnimations();
});

/* ---------------------------------------------------------
   1. ANIMATED COUNTERS (stats strip)
   --------------------------------------------------------- */
function initAnimatedCounters() {
  const counters = document.querySelectorAll('.mini-stat-value[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach(function (counter) {
    observer.observe(counter);
  });
}

function animateCounter(el) {
  const target = parseFloat(el.getAttribute('data-count'));
  const suffix = el.getAttribute('data-suffix') || '';
  const duration = 1400;
  const startTime = performance.now();

  function frame(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = target * eased;

    el.textContent = Math.round(currentValue).toLocaleString('en-US') + suffix;

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      el.textContent = Math.round(target).toLocaleString('en-US') + suffix;
    }
  }

  requestAnimationFrame(frame);
}

/* ---------------------------------------------------------
   2. SAVE PROVIDER (toggle heart icon, dummy persistence)
   --------------------------------------------------------- */
function initSaveProvider() {
  const btn = document.getElementById('saveProviderBtn');
  if (!btn) return;

  btn.addEventListener('click', function () {
    const isSaved = btn.classList.toggle('saved');
    const icon = btn.querySelector('i');
    const label = btn.querySelector('span');

    btn.setAttribute('aria-pressed', String(isSaved));
    icon.classList.toggle('fa-regular', !isSaved);
    icon.classList.toggle('fa-solid', isSaved);
    if (label) label.textContent = isSaved ? 'Saved' : 'Save';

    showToast(
      isSaved ? 'Provider Saved' : 'Removed from Saved',
      isSaved ? 'You can find this provider in your saved list.' : 'Bikash Shrestha was removed from your saved providers.'
    );
  });
}

/* ---------------------------------------------------------
   3. ACTION BUTTONS (Book Now / Message / Call) — dummy feedback
   --------------------------------------------------------- */
function initActionButtons() {
  document.querySelectorAll('.btn-book-now').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showToast('Booking Started', 'Redirecting you to the booking form for Bikash Shrestha...');
    });
  });

  document.querySelectorAll('.btn-message').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showToast('Message Window Opened', 'Start chatting with Bikash Shrestha directly.');
    });
  });

  document.querySelectorAll('.btn-call').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showToast('Calling Provider', 'Connecting your call to Bikash Shrestha...');
    });
  });
}

/* ---------------------------------------------------------
   4. TOAST NOTIFICATIONS
   --------------------------------------------------------- */
function showToast(title, text) {
  const toast = document.getElementById('actionToast');
  const toastTitle = document.getElementById('toastTitle');
  const toastText = document.getElementById('toastText');
  const closeBtn = document.getElementById('toastClose');
  if (!toast) return;

  toastTitle.textContent = title;
  toastText.textContent = text;
  toast.classList.add('show');

  const autoHide = window.setTimeout(function () {
    toast.classList.remove('show');
  }, 4000);

  if (closeBtn) {
    closeBtn.onclick = function () {
      toast.classList.remove('show');
      window.clearTimeout(autoHide);
    };
  }
}

/* ---------------------------------------------------------
   5. GALLERY LIGHTBOX
   --------------------------------------------------------- */
function initGalleryLightbox() {
  const galleryItems = document.querySelectorAll('.gallery-item img');
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const closeBtn = document.getElementById('lightboxClose');
  if (!galleryItems.length || !lightbox) return;

  galleryItems.forEach(function (img) {
    img.addEventListener('click', function () {
      lightboxImage.src = img.src;
      lightboxImage.alt = img.alt;
      lightbox.classList.add('show');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLightbox() {
    lightbox.classList.remove('show');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox.classList.contains('show')) closeLightbox();
  });
}

/* ---------------------------------------------------------
   6. LOAD MORE REVIEWS (appends dummy reviews)
   --------------------------------------------------------- */
function initLoadMoreReviews() {
  const btn = document.getElementById('loadMoreReviews');
  const list = document.querySelector('.review-list');
  if (!btn || !list) return;

  const extraReviews = [
    {
      avatar: 'https://i.pravatar.cc/50?img=41',
      name: 'Diya Koirala',
      stars: 5,
      text: 'Very knowledgeable and polite. Diagnosed the fault in minutes and had it fixed within the hour.',
      date: 'Jul 14, 2026'
    },
    {
      avatar: 'https://i.pravatar.cc/50?img=8',
      name: 'Suman Lama',
      stars: 4,
      text: 'Solid work on our office wiring. Slightly pricier than expected but worth the quality.',
      date: 'Jul 2, 2026'
    }
  ];

  let loaded = false;

  btn.addEventListener('click', function () {
    if (loaded) return;
    loaded = true;

    extraReviews.forEach(function (review, index) {
      const item = document.createElement('div');
      item.className = 'review-item fade-up';
      item.style.animationDelay = (index * 0.1) + 's';
      item.innerHTML =
        '<img src="' + review.avatar + '" alt="" class="review-avatar">' +
        '<div class="review-body">' +
          '<div class="review-top">' +
            '<h5>' + review.name + '</h5>' +
            '<div class="review-stars">' + starsMarkup(review.stars) + '</div>' +
          '</div>' +
          '<p class="review-text">' + review.text + '</p>' +
          '<span class="review-date">' + review.date + '</span>' +
        '</div>';
      list.appendChild(item);
    });

    btn.innerHTML = '<i class="fa-solid fa-check"></i> All Reviews Loaded';
    btn.disabled = true;
  });
}

function starsMarkup(count) {
  let markup = '';
  for (let i = 0; i < 5; i++) {
    markup += i < count ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';
  }
  return markup;
}

/* ---------------------------------------------------------
   7. MOBILE FLOATING ACTION BAR (shows after scrolling past header)
   --------------------------------------------------------- */
function initMobileActionBar() {
  const bar = document.getElementById('mobileActionBar');
  const header = document.querySelector('.profile-header');
  if (!bar || !header) return;

  function toggleBar() {
    const headerBottom = header.getBoundingClientRect().bottom;
    if (headerBottom < 0) {
      bar.classList.add('show');
    } else {
      bar.classList.remove('show');
    }
  }

  window.addEventListener('scroll', toggleBar, { passive: true });
  toggleBar();

  // Wire the mobile bar's own buttons to the same feedback as the header buttons
  bar.querySelectorAll('.btn-book-now').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showToast('Booking Started', 'Redirecting you to the booking form for Bikash Shrestha...');
    });
  });
  bar.querySelectorAll('.btn-message').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showToast('Message Window Opened', 'Start chatting with Bikash Shrestha directly.');
    });
  });
  bar.querySelectorAll('.btn-call').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showToast('Calling Provider', 'Connecting your call to Bikash Shrestha...');
    });
  });
}

/* ---------------------------------------------------------
   8. RIPPLE EFFECT
   --------------------------------------------------------- */
function initRippleButtons() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.ripple');
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const circle = document.createElement('span');
    const size = Math.max(rect.width, rect.height);

    circle.className = 'ripple-circle';
    circle.style.width = circle.style.height = size + 'px';
    circle.style.left = (e.clientX - rect.left - size / 2) + 'px';
    circle.style.top = (e.clientY - rect.top - size / 2) + 'px';

    btn.appendChild(circle);
    window.setTimeout(function () { circle.remove(); }, 600);
  });
}

/* ---------------------------------------------------------
   9. SCROLL-TRIGGERED FADE ANIMATIONS
   --------------------------------------------------------- */
function initScrollAnimations() {
  const items = document.querySelectorAll('.fade-up');
  if (!items.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  items.forEach(function (item) {
    observer.observe(item);
  });
}