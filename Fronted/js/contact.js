/* =========================================================
   OneClick — Contact Page JavaScript
   Form validation, character counter, scroll reveal, ripple
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------------------------------------------------------
     Footer year
  --------------------------------------------------------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     Navbar scroll state (glass -> solid)
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
     Scroll reveal animations (fade / slide / zoom)
  --------------------------------------------------------- */
  var animatedEls = document.querySelectorAll('[data-animate]');
  if ('IntersectionObserver' in window && animatedEls.length) {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var delay = el.getAttribute('data-delay');
          if (delay) el.style.setProperty('--delay', delay + 'ms');
          el.classList.add('in-view');
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

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
     Character counter for message textarea
  --------------------------------------------------------- */
  var messageField = document.getElementById('message');
  var charCount = document.getElementById('charCount');
  var MAX_CHARS = 500;

  function updateCharCount() {
    if (!messageField || !charCount) return;
    var len = messageField.value.length;
    charCount.textContent = len;

    var counterWrap = charCount.parentElement;
    counterWrap.classList.remove('limit-near', 'limit-reached');
    if (len >= MAX_CHARS) {
      counterWrap.classList.add('limit-reached');
    } else if (len >= MAX_CHARS * 0.85) {
      counterWrap.classList.add('limit-near');
    }
  }

  if (messageField) {
    messageField.addEventListener('input', updateCharCount);
    updateCharCount();
  }

  /* ---------------------------------------------------------
     Contact form validation (frontend only, no submission)
  --------------------------------------------------------- */
  var form = document.getElementById('contactForm');
  var successAlert = document.getElementById('formSuccess');

  var validators = {
    fullName: function (value) {
      return value.trim().length >= 2;
    },
    email: function (value) {
      var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(value.trim());
    },
    phone: function (value) {
      var digits = value.replace(/\D/g, '');
      return digits.length >= 7 && digits.length <= 10;
    },
    subject: function (value) {
      return value.trim().length >= 3;
    },
    message: function (value) {
      return value.trim().length >= 10 && value.trim().length <= 500;
    },
    agreePolicy: function (checked) {
      return checked === true;
    }
  };

  function setFieldState(field, isValid) {
    if (!field) return;
    field.classList.remove('is-invalid', 'is-valid');
    field.classList.add(isValid ? 'is-valid' : 'is-invalid');
  }

  function validateField(field) {
    if (!field || !validators[field.name]) return true;
    var value = field.type === 'checkbox' ? field.checked : field.value;
    var isValid = validators[field.name](value);
    setFieldState(field, isValid);
    return isValid;
  }

  if (form) {
    // Live validation as the user types / interacts
    ['fullName', 'email', 'phone', 'subject', 'message'].forEach(function (name) {
      var field = form.elements[name];
      if (!field) return;
      field.addEventListener('blur', function () { validateField(field); });
      field.addEventListener('input', function () {
        if (field.classList.contains('is-invalid') || field.classList.contains('is-valid')) {
          validateField(field);
        }
      });
    });

    var agreeField = form.elements['agreePolicy'];
    if (agreeField) {
      agreeField.addEventListener('change', function () { validateField(agreeField); });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var fieldsToCheck = ['fullName', 'email', 'phone', 'subject', 'message'];
      var allValid = true;

      fieldsToCheck.forEach(function (name) {
        var field = form.elements[name];
        if (!validateField(field)) allValid = false;
      });

      if (!validateField(agreeField)) allValid = false;

      if (!allValid) {
        if (successAlert) successAlert.classList.remove('show');
        var firstInvalid = form.querySelector('.is-invalid');
        if (firstInvalid) {
          firstInvalid.focus();
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      // Frontend-only "submission" — no backend integration
      if (successAlert) {
        successAlert.classList.add('show');
        successAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      form.reset();
      fieldsToCheck.concat(['agreePolicy']).forEach(function (name) {
        var field = form.elements[name];
        if (field) field.classList.remove('is-valid', 'is-invalid');
      });
      updateCharCount();
    });
  }

});