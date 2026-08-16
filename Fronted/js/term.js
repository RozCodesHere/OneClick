/* =========================================================
   OneClick — Terms & Conditions Page Scripts
   - TOC active section highlighting
   - Smooth scrolling
   - Mobile TOC toggle
   - Scroll-to-top button
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc-link'));
  var sections = tocLinks
    .map(function (link) {
      var id = link.getAttribute('href').replace('#', '');
      return document.getElementById(id);
    })
    .filter(Boolean);

  /* ---------------------------------------------------------
     Smooth scrolling for TOC links
     --------------------------------------------------------- */
  tocLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = link.getAttribute('href');
      var targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      e.preventDefault();

      var offset = 90;
      var top = targetEl.getBoundingClientRect().top + window.pageYOffset - offset;

      window.scrollTo({
        top: top,
        behavior: 'smooth'
      });

      // Close mobile TOC after selecting a section
      var tocNav = document.getElementById('tocNav');
      if (tocNav && tocNav.classList.contains('show') && window.innerWidth < 992) {
        var bsCollapse = bootstrap.Collapse.getOrCreateInstance(tocNav);
        bsCollapse.hide();
      }
    });
  });

  /* ---------------------------------------------------------
     Active section highlighting on scroll
     --------------------------------------------------------- */
  function setActiveLink() {
    var scrollPos = window.pageYOffset + 120;
    var currentSection = null;

    sections.forEach(function (section) {
      if (section.offsetTop <= scrollPos) {
        currentSection = section;
      }
    });

    tocLinks.forEach(function (link) {
      link.classList.remove('active');
    });

    if (currentSection) {
      var activeLink = document.querySelector('.toc-link[href="#' + currentSection.id + '"]');
      if (activeLink) {
        activeLink.classList.add('active');
      }
    } else if (tocLinks.length) {
      tocLinks[0].classList.add('active');
    }
  }

  window.addEventListener('scroll', setActiveLink);
  setActiveLink();

  /* ---------------------------------------------------------
     Mobile TOC toggle (rotate chevron icon)
     --------------------------------------------------------- */
  var tocToggleBtn = document.getElementById('tocToggle');
  var tocToggleIcon = document.getElementById('tocToggleIcon');
  var tocNavEl = document.getElementById('tocNav');

  if (tocToggleBtn && tocNavEl) {
    tocToggleBtn.addEventListener('click', function () {
      var bsCollapse = bootstrap.Collapse.getOrCreateInstance(tocNavEl, { toggle: false });
      bsCollapse.toggle();
    });

    tocNavEl.addEventListener('shown.bs.collapse', function () {
      tocToggleIcon.classList.add('rotated');
    });

    tocNavEl.addEventListener('hidden.bs.collapse', function () {
      tocToggleIcon.classList.remove('rotated');
    });
  }

  /* ---------------------------------------------------------
     Scroll-to-top button
     --------------------------------------------------------- */
  var scrollTopBtn = document.getElementById('scrollTopBtn');

  function toggleScrollTopBtn() {
    if (window.pageYOffset > 400) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', toggleScrollTopBtn);
  toggleScrollTopBtn();

  scrollTopBtn.addEventListener('click', function () {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

});