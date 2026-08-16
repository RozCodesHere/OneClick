/* ==========================================================
   OneClick — Customer Dashboard JS
   ========================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- AOS ---------- */
  AOS.init({
    duration: 650,
    easing: 'ease-out-cubic',
    once: true,
    offset: 60
  });

  /* ---------- Dynamic greeting ---------- */
  setGreeting();

  /* ---------- Render 15 service category cards ---------- */
  renderServices();

  /* ---------- Animated counters ---------- */
  initCounters();

});

/* Greet the customer based on time of day */
function setGreeting() {
  const el = document.getElementById('greetingText');
  if (!el) return;

  const hour = new Date().getHours();
  let text = 'Good Morning';
  let icon = 'fa-regular fa-sun';

  if (hour >= 12 && hour < 17) {
    text = 'Good Afternoon';
    icon = 'fa-solid fa-cloud-sun';
  } else if (hour >= 17 || hour < 5) {
    text = 'Good Evening';
    icon = 'fa-regular fa-moon';
  }

  el.innerHTML = `<i class="${icon}"></i> ${text}`;
}

/* Build the "All Services" grid (15 categories) */
function renderServices() {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;

  const services = [
    { name: 'Electrician',        icon: 'fa-solid fa-bolt' },
    { name: 'Plumber',            icon: 'fa-solid fa-faucet-drip' },
    { name: 'Home Cleaning',      icon: 'fa-solid fa-broom' },
    { name: 'Painting',           icon: 'fa-solid fa-paint-roller' },
    { name: 'Carpenter',          icon: 'fa-solid fa-hammer' },
    { name: 'AC Repair',          icon: 'fa-solid fa-snowflake' },
    { name: 'Appliance Repair',   icon: 'fa-solid fa-blender' },
    { name: 'Pest Control',       icon: 'fa-solid fa-bug-slash' },
    { name: 'Home Shifting',      icon: 'fa-solid fa-truck-moving' },
    { name: 'Salon for Women',    icon: 'fa-solid fa-spa' },
    { name: 'Salon for Men',      icon: 'fa-solid fa-scissors' },
    { name: 'Gardening',          icon: 'fa-solid fa-seedling' },
    { name: 'Car Wash',           icon: 'fa-solid fa-car' },
    { name: 'CCTV Install',       icon: 'fa-solid fa-video' },
    { name: 'Water Purifier',     icon: 'fa-solid fa-droplet' }
  ];

  const cardsHtml = services.map((s, i) => `
    <div class="col-6 col-sm-4 col-lg-3 col-xl-2" data-aos="fade-up" data-aos-delay="${(i % 6) * 60}">
      <div class="oc-service-card">
        <div class="oc-service-icon"><i class="${s.icon}"></i></div>
        <h6>${s.name}</h6>
      </div>
    </div>
  `).join('');

  grid.innerHTML = cardsHtml;
}

/* Animate the statistic counters when they scroll into view */
function initCounters() {
  const counters = document.querySelectorAll('.oc-counter');
  if (!counters.length) return;

  const animate = (el) => {
    const target = parseInt(el.getAttribute('data-count'), 10) || 0;
    const duration = 1400;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      el.textContent = Math.floor(eased * target);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target;
      }
    }
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach(c => observer.observe(c));
}