/* =========================================================
   ONECLICK — MAIN JAVASCRIPT
   Handles: AOS init, sticky navbar shadow, animated counters,
   back-to-top button, footer year, mobile menu auto-close.
========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Init AOS ---------- */
  if (window.AOS) {
    AOS.init({
      duration: 700,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60
    });
  }

  /* ---------- Footer Year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* ---------- Sticky Navbar Shadow on Scroll ---------- */
  var navbar = document.getElementById('mainNavbar');
  function handleNavbarScroll() {
    if (window.scrollY > 40) {
      navbar.classList.add('oc-scrolled');
    } else {
      navbar.classList.remove('oc-scrolled');
    }
  }
  handleNavbarScroll();
  window.addEventListener('scroll', handleNavbarScroll);

  /* ---------- Auto-close Mobile Menu on Link Click ---------- */
  var navMenu = document.getElementById('navMenu');
  var navLinks = navMenu ? navMenu.querySelectorAll('.nav-link, .oc-nav-actions .btn') : [];
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      if (navMenu.classList.contains('show')) {
        var bsCollapse = bootstrap.Collapse.getOrCreateInstance(navMenu);
        bsCollapse.hide();
      }
    });
  });

  /* ---------- Animated Stat Counters ---------- */
  var counters = document.querySelectorAll('.oc-stat-num');

  function animateCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var isDecimal = el.hasAttribute('data-decimal');
    var duration = 1600;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      var current = target * eased;

      el.textContent = (isDecimal ? current.toFixed(1) : Math.floor(current).toLocaleString()) + suffix;

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = (isDecimal ? target.toFixed(1) : target.toLocaleString()) + suffix;
      }
    }
    window.requestAnimationFrame(step);
  }

  if (counters.length) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (counter) {
      counterObserver.observe(counter);
    });
  }

  /* ---------- Back to Top Button ---------- */
  var backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 500) {
        backToTop.classList.add('oc-visible');
      } else {
        backToTop.classList.remove('oc-visible');
      }
    });

    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

});