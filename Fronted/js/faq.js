/* =========================================================
   OneClick — FAQ Page JavaScript
   Search filtering, category filtering, accordion, smooth scroll
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------------------------------------------------------
     Footer year
  --------------------------------------------------------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     Navbar scroll state
  --------------------------------------------------------- */
  var navbar = document.getElementById('mainNavbar');
  function handleNavbarScroll() {
    if (!navbar) return;
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  handleNavbarScroll();
  window.addEventListener('scroll', handleNavbarScroll, { passive: true });

  /* ---------------------------------------------------------
     Back to top button
  --------------------------------------------------------- */
  var backToTop = document.getElementById('backToTop');
  function handleBackToTop() {
    if (!backToTop) return;
    if (window.scrollY > 500) {
      backToTop.classList.add('show');
    } else {
      backToTop.classList.remove('show');
    }
  }
  handleBackToTop();
  window.addEventListener('scroll', handleBackToTop, { passive: true });
  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------------------------------------------------------
     Smooth scrolling for in-page anchor links
  --------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;
      var target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      var offset = 90;
      var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: top, behavior: 'smooth' });

      var navCollapse = document.getElementById('navMenu');
      if (navCollapse && navCollapse.classList.contains('show')) {
        var bsCollapse = bootstrap.Collapse.getOrCreateInstance(navCollapse);
        bsCollapse.hide();
      }
    });
  });

  /* ---------------------------------------------------------
     Scroll reveal animations
  --------------------------------------------------------- */
  var animatedEls = document.querySelectorAll('[data-animate]');
  if ('IntersectionObserver' in window && animatedEls.length) {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    animatedEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    animatedEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ---------------------------------------------------------
     Button ripple effect
  --------------------------------------------------------- */
  document.querySelectorAll('.ripple').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var rect = btn.getBoundingClientRect();
      var circle = document.createElement('span');
      var size = Math.max(rect.width, rect.height);

      circle.style.width = circle.style.height = size + 'px';
      circle.style.left = (e.clientX - rect.left - size / 2) + 'px';
      circle.style.top = (e.clientY - rect.top - size / 2) + 'px';
      circle.classList.add('ripple-effect');

      btn.appendChild(circle);
      setTimeout(function () { circle.remove(); }, 600);
    });
  });

  /* ---------------------------------------------------------
     FAQ Search + Category Filtering
  --------------------------------------------------------- */
  var searchInput = document.getElementById('faqSearch');
  var clearBtn = document.getElementById('clearSearch');
  var resultCount = document.getElementById('resultCount');
  var noResults = document.getElementById('noResults');
  var catButtons = document.querySelectorAll('.cat-btn');
  var faqItems = document.querySelectorAll('.faq-item');
  var totalCount = faqItems.length;

  var activeCategory = 'all';

  // Cache original question HTML so highlighting can be reset cleanly
  faqItems.forEach(function (item) {
    var qEl = item.querySelector('.faq-q');
    if (qEl) qEl.dataset.original = qEl.textContent;
  });

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlightMatch(el, term) {
    var original = el.dataset.original || el.textContent;
    if (!term) {
      el.innerHTML = original;
      return;
    }
    var regex = new RegExp('(' + escapeRegExp(term) + ')', 'ig');
    el.innerHTML = original.replace(regex, '<mark>$1</mark>');
  }

  function applyFilters() {
    var term = searchInput ? searchInput.value.trim().toLowerCase() : '';
    var visibleCount = 0;

    faqItems.forEach(function (item) {
      var category = item.getAttribute('data-category');
      var qEl = item.querySelector('.faq-q');
      var bodyEl = item.querySelector('.accordion-body');
      var questionText = (qEl ? qEl.dataset.original : '').toLowerCase();
      var answerText = (bodyEl ? bodyEl.textContent : '').toLowerCase();

      var matchesCategory = activeCategory === 'all' || category === activeCategory;
      var matchesSearch = term === '' || questionText.indexOf(term) !== -1 || answerText.indexOf(term) !== -1;

      if (matchesCategory && matchesSearch) {
        item.classList.remove('filtered-out');
        visibleCount++;
        if (qEl) highlightMatch(qEl, term);
      } else {
        item.classList.add('filtered-out');
        if (qEl) highlightMatch(qEl, '');
      }
    });

    // Result count message
    if (resultCount) {
      if (term !== '') {
        resultCount.textContent = 'Showing ' + visibleCount + ' of ' + totalCount + ' questions for "' + searchInput.value.trim() + '"';
      } else if (activeCategory !== 'all') {
        resultCount.textContent = 'Showing ' + visibleCount + ' question' + (visibleCount === 1 ? '' : 's');
      } else {
        resultCount.textContent = '';
      }
    }

    // No results state
    if (noResults) {
      noResults.classList.toggle('show', visibleCount === 0);
    }

    // Clear button visibility
    if (clearBtn) {
      clearBtn.classList.toggle('show', term !== '');
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      searchInput.value = '';
      searchInput.focus();
      applyFilters();
    });
  }

  catButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      catButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-category');
      applyFilters();
    });
  });

  // Initial run (in case of pre-filled search via browser autofill)
  applyFilters();

});