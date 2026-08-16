document.addEventListener("DOMContentLoaded", function () {

  /* =========================================================
     TIMELINE SCROLL PROGRESS
  ========================================================= */

  const timeline = document.querySelector(".timeline-wrap");
  const progress = document.getElementById("spineProgress");

  function updateTimelineProgress() {

    if (!timeline || !progress) return;

    const rect = timeline.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    const timelineTop = rect.top;
    const timelineHeight = rect.height;

    const visiblePoint = windowHeight * 0.6;

    let progressValue =
      ((visiblePoint - timelineTop) / timelineHeight) * 100;

    progressValue = Math.max(0, Math.min(100, progressValue));

    progress.style.height = progressValue + "%";
  }

  window.addEventListener("scroll", updateTimelineProgress);
  window.addEventListener("resize", updateTimelineProgress);

  updateTimelineProgress();


  /* =========================================================
     STEP CARD ANIMATION ON SCROLL
  ========================================================= */

  const timelineItems =
    document.querySelectorAll(".timeline-item");

  const observer = new IntersectionObserver(
    function (entries) {

      entries.forEach(function (entry) {

        if (entry.isIntersecting) {

          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";

        }

      });

    },
    {
      threshold: 0.15
    }
  );

  timelineItems.forEach(function (item) {

    item.style.opacity = "0";
    item.style.transform = "translateY(30px)";
    item.style.transition =
      "opacity 0.6s ease, transform 0.6s ease";

    observer.observe(item);

  });


  /* =========================================================
     SMOOTH SCROLL
  ========================================================= */

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {

    link.addEventListener("click", function (event) {

      const targetId = this.getAttribute("href");

      if (targetId === "#") return;

      const target =
        document.querySelector(targetId);

      if (target) {

        event.preventDefault();

        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      }

    });

  });

});