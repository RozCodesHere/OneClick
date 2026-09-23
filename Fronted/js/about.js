/* =========================================================
   OneClick — About Page JavaScript
   Backend statistics, animations, timeline, ripple, misc UI
   ========================================================= */

const API_BASE_URL = "http://127.0.0.1:8000/api";

document.addEventListener("DOMContentLoaded", function () {

  /* ---------------------------------------------------------
     Footer year
  --------------------------------------------------------- */
  const yearEl = document.getElementById("year");

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }


  /* ---------------------------------------------------------
     Navbar scroll state
  --------------------------------------------------------- */
  const navbar = document.getElementById("mainNavbar");

  function handleNavbarScroll() {

    if (!navbar) return;

    if (window.scrollY > 40) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  }

  handleNavbarScroll();

  window.addEventListener(
    "scroll",
    handleNavbarScroll,
    { passive: true }
  );


  /* ---------------------------------------------------------
     Back to top button
  --------------------------------------------------------- */
  const backToTop =
    document.getElementById("backToTop");

  function handleBackToTop() {

    if (!backToTop) return;

    if (window.scrollY > 500) {
      backToTop.classList.add("show");
    } else {
      backToTop.classList.remove("show");
    }
  }

  handleBackToTop();

  window.addEventListener(
    "scroll",
    handleBackToTop,
    { passive: true }
  );

  if (backToTop) {

    backToTop.addEventListener(
      "click",
      function () {

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

      }
    );
  }


  /* ---------------------------------------------------------
     Smooth scrolling for in-page anchor links
  --------------------------------------------------------- */
  document
    .querySelectorAll('a[href^="#"]')
    .forEach(function (link) {

      link.addEventListener(
        "click",
        function (e) {

          const targetId =
            this.getAttribute("href");

          if (!targetId || targetId === "#") {
            return;
          }

          const target =
            document.querySelector(targetId);

          if (!target) return;

          e.preventDefault();

          const offset = 90;

          const top =
            target.getBoundingClientRect().top +
            window.pageYOffset -
            offset;

          window.scrollTo({
            top: top,
            behavior: "smooth"
          });


          /* Close mobile navbar */
          const navCollapse =
            document.getElementById("navMenu");

          if (
            navCollapse &&
            navCollapse.classList.contains("show")
          ) {

            const bsCollapse =
              bootstrap.Collapse.getOrCreateInstance(
                navCollapse
              );

            bsCollapse.hide();
          }

        }
      );

    });


  /* ---------------------------------------------------------
     Scroll reveal animations
  --------------------------------------------------------- */
  const animatedEls =
    document.querySelectorAll("[data-animate]");

  if (
    "IntersectionObserver" in window &&
    animatedEls.length
  ) {

    const revealObserver =
      new IntersectionObserver(
        function (entries, observer) {

          entries.forEach(function (entry) {

            if (!entry.isIntersecting) return;

            const el = entry.target;

            const delay =
              el.getAttribute("data-delay");

            if (delay) {
              el.style.setProperty(
                "--delay",
                delay + "ms"
              );
            }

            el.classList.add("in-view");

            observer.unobserve(el);

          });

        },
        {
          threshold: 0.15,
          rootMargin: "0px 0px -60px 0px"
        }
      );


    animatedEls.forEach(function (el) {
      revealObserver.observe(el);
    });

  } else {

    animatedEls.forEach(function (el) {
      el.classList.add("in-view");
    });

  }


  /* ---------------------------------------------------------
     Timeline reveal
  --------------------------------------------------------- */
  const timelineItems =
    document.querySelectorAll("[data-timeline]");

  if (
    "IntersectionObserver" in window &&
    timelineItems.length
  ) {

    const timelineObserver =
      new IntersectionObserver(
        function (entries, observer) {

          entries.forEach(function (entry) {

            if (!entry.isIntersecting) return;

            const el = entry.target;

            const index =
              Array.prototype.indexOf.call(
                timelineItems,
                el
              );

            setTimeout(
              function () {
                el.classList.add("in-view");
              },
              (index % 5) * 120
            );

            observer.unobserve(el);

          });

        },
        {
          threshold: 0.25
        }
      );


    timelineItems.forEach(function (el) {
      timelineObserver.observe(el);
    });

  } else {

    timelineItems.forEach(function (el) {
      el.classList.add("in-view");
    });

  }


  /* ---------------------------------------------------------
     Load real statistics from Django
  --------------------------------------------------------- */
  loadAboutStatistics();


  /* ---------------------------------------------------------
     Button ripple effect
  --------------------------------------------------------- */
  document
    .querySelectorAll(".ripple")
    .forEach(function (btn) {

      btn.addEventListener(
        "click",
        function (e) {

          const rect =
            btn.getBoundingClientRect();

          const circle =
            document.createElement("span");

          const size =
            Math.max(
              rect.width,
              rect.height
            );

          circle.style.width =
            size + "px";

          circle.style.height =
            size + "px";

          circle.style.left =
            (e.clientX -
              rect.left -
              size / 2) + "px";

          circle.style.top =
            (e.clientY -
              rect.top -
              size / 2) + "px";

          circle.classList.add(
            "ripple-effect"
          );

          btn.appendChild(circle);

          setTimeout(
            function () {
              circle.remove();
            },
            600
          );

        }
      );

    });


  /* ---------------------------------------------------------
     Team card subtle tilt
  --------------------------------------------------------- */
  document
    .querySelectorAll(".team-card")
    .forEach(function (card) {

      card.addEventListener(
        "mousemove",
        function (e) {

          const rect =
            card.getBoundingClientRect();

          const x =
            e.clientX - rect.left;

          const y =
            e.clientY - rect.top;

          const centerX =
            rect.width / 2;

          const centerY =
            rect.height / 2;

          const rotateX =
            ((y - centerY) / centerY) * -4;

          const rotateY =
            ((x - centerX) / centerX) * 4;

          card.style.transform =
            "translateY(-8px) " +
            "rotateX(" +
            rotateX +
            "deg) rotateY(" +
            rotateY +
            "deg)";

        }
      );


      card.addEventListener(
        "mouseleave",
        function () {
          card.style.transform = "";
        }
      );

    });

});


/* =========================================================
   ABOUT PAGE — LOAD BACKEND STATISTICS
========================================================= */

async function loadAboutStatistics() {

  try {

    const response =
      await fetch(
        `${API_BASE_URL}/stats/`
      );


    if (!response.ok) {

      throw new Error(
        `Failed to load statistics: ${response.status}`
      );

    }


    const data =
      await response.json();


    /*
     * -------------------------------------------------------
     * Provider count
     * -------------------------------------------------------
     */

    setAboutStat(
      "aboutProviders",
      data.verified_providers
    );


    /*
     * -------------------------------------------------------
     * Customer count
     * -------------------------------------------------------
     */

    setAboutStat(
      "aboutCustomers",
      data.customers
    );


    /*
     * -------------------------------------------------------
     * Service category count
     * -------------------------------------------------------
     */

    setAboutStat(
      "aboutCategories",
      data.service_categories
    );


    /*
     * -------------------------------------------------------
     * Booking count
     * -------------------------------------------------------
     */

    setAboutStat(
      "aboutBookings",
      data.bookings
    );


    /*
     * Start counter animation after
     * real backend values are loaded.
     */

    setupAboutCounters();

  } catch (error) {

    console.error(
      "About page statistics error:",
      error
    );


    /*
     * Keep safe fallback values.
     */

    setAboutStat(
      "aboutProviders",
      0
    );

    setAboutStat(
      "aboutCustomers",
      0
    );

    setAboutStat(
      "aboutCategories",
      0
    );

    setAboutStat(
      "aboutBookings",
      0
    );

  }

}


/* =========================================================
   SET ABOUT STAT
========================================================= */

function setAboutStat(
  elementId,
  value
) {

  const element =
    document.getElementById(elementId);

  if (!element) return;


  const number =
    Number(value);


  element.dataset.target =
    Number.isFinite(number)
      ? number
      : 0;


  /*
   * Start from zero so the
   * animation can count upward.
   */

  element.textContent = "0";

}


/* =========================================================
   ABOUT PAGE COUNTER ANIMATION
========================================================= */

function setupAboutCounters() {

  const counters =
    document.querySelectorAll(
      ".impact-section .counter"
    );


  if (!counters.length) return;


  function animateCounter(element) {

    const target =
      Number(element.dataset.target) || 0;

    const duration = 1200;

    const startTime =
      performance.now();


    function update(currentTime) {

      const progress =
        Math.min(
          (currentTime - startTime) /
          duration,
          1
        );


      /*
       * Ease-out animation
       */

      const eased =
        1 -
        Math.pow(
          1 - progress,
          3
        );


      const current =
        Math.floor(
          target * eased
        );


      element.textContent =
        current.toLocaleString();


      if (progress < 1) {

        requestAnimationFrame(
          update
        );

      } else {

        element.textContent =
          target.toLocaleString();

      }

    }


    requestAnimationFrame(update);

  }


  /*
   * Animate only when the
   * statistics section enters view.
   */

  if ("IntersectionObserver" in window) {

    const observer =
      new IntersectionObserver(
        function (entries, observer) {

          entries.forEach(function (entry) {

            if (!entry.isIntersecting) return;

            animateCounter(
              entry.target
            );

            observer.unobserve(
              entry.target
            );

          });

        },
        {
          threshold: 0.5
        }
      );


    counters.forEach(function (counter) {
      observer.observe(counter);
    });

  } else {

    counters.forEach(function (counter) {
      animateCounter(counter);
    });

  }

}