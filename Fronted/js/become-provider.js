document.addEventListener("DOMContentLoaded", function () {

  // Current year
  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }


  // Back to top button
  const backToTop = document.getElementById("backToTop");

  window.addEventListener("scroll", function () {

    if (window.scrollY > 500) {
      backToTop.classList.add("show");
    } else {
      backToTop.classList.remove("show");
    }

  });


  if (backToTop) {
    backToTop.addEventListener("click", function () {

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    });
  }


  // Navbar scroll effect
  const navbar = document.getElementById("mainNavbar");

  window.addEventListener("scroll", function () {

    if (window.scrollY > 50) {
      navbar.classList.add("navbar-scrolled");
    } else {
      navbar.classList.remove("navbar-scrolled");
    }

  });


  // Smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {

    link.addEventListener("click", function (e) {

      const targetId = this.getAttribute("href");

      if (targetId === "#") return;

      const target = document.querySelector(targetId);

      if (target) {

        e.preventDefault();

        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      }

    });

  });


  // Close mobile navbar after clicking link
  const navLinks = document.querySelectorAll(".oc-nav-links .nav-link");
  const navMenu = document.getElementById("navMenu");

  navLinks.forEach(function (link) {

    link.addEventListener("click", function () {

      if (window.innerWidth < 992 && navMenu.classList.contains("show")) {

        const bsCollapse = bootstrap.Collapse.getOrCreateInstance(navMenu);

        bsCollapse.hide();
      }

    });

  });

});