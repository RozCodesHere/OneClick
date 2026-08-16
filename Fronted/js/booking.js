/* =========================================================
   ONECLICK — SERVICE BOOKING PAGE SCRIPT
   Vanilla JS only. Dummy data & client-side logic.
   No backend integration — form submission is simulated.
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {
  initDateTimeDefaults();
  initPriceEstimator();
  initEmergencyToggle();
  initCharCounter();
  initUseLocation();
  initFormValidation();
  initRippleButtons();
  initScrollAnimations();
});

/* ---------------------------------------------------------
   CONFIG — dummy pricing rules
   --------------------------------------------------------- */
const PRICING = {
  bookingFee: 100,
  visitCharge: 150,
  emergencySurcharge: 500
};

/* ---------------------------------------------------------
   1. DATE / TIME DEFAULTS
   Restrict date picker to today or later, default a sensible time.
   --------------------------------------------------------- */
function initDateTimeDefaults() {
  const dateInput = document.getElementById('preferredDate');
  const timeInput = document.getElementById('preferredTime');
  if (!dateInput) return;

  const today = new Date();
  const isoToday = today.toISOString().split('T')[0];
  dateInput.setAttribute('min', isoToday);

  dateInput.addEventListener('change', updateSummary);
  if (timeInput) timeInput.addEventListener('change', updateSummary);
}

/* ---------------------------------------------------------
   2. PRICE ESTIMATOR + LIVE SUMMARY
   --------------------------------------------------------- */
function initPriceEstimator() {
  const categorySelect = document.getElementById('serviceCategory');
  if (!categorySelect) return;

  categorySelect.addEventListener('change', updateEstimate);
  updateEstimate(); // initial render
}

function getSelectedCategoryPrice() {
  const categorySelect = document.getElementById('serviceCategory');
  const selectedOption = categorySelect.options[categorySelect.selectedIndex];
  const basePrice = selectedOption && selectedOption.value ? parseFloat(selectedOption.getAttribute('data-price')) : 0;
  return basePrice;
}

function updateEstimate() {
  const categorySelect = document.getElementById('serviceCategory');
  const selectedOption = categorySelect.options[categorySelect.selectedIndex];
  const estimateValue = document.getElementById('estimateValue');
  const estimateNote = document.getElementById('estimateNote');
  const emergencyToggle = document.getElementById('emergencyToggle');

  const basePrice = getSelectedCategoryPrice();
  const isEmergency = emergencyToggle && emergencyToggle.checked;
  const total = basePrice > 0 ? basePrice + PRICING.bookingFee + PRICING.visitCharge + (isEmergency ? PRICING.emergencySurcharge : 0) : 0;

  if (basePrice > 0) {
    estimateValue.textContent = formatCurrency(total);
    estimateNote.textContent = selectedOption.value + ' — includes booking fee & visit charge';
  } else {
    estimateValue.textContent = formatCurrency(0);
    estimateNote.textContent = 'Select a service to see pricing';
  }

  updateSummary();
}

function updateSummary() {
  const categorySelect = document.getElementById('serviceCategory');
  const selectedOption = categorySelect.options[categorySelect.selectedIndex];
  const dateInput = document.getElementById('preferredDate');
  const timeInput = document.getElementById('preferredTime');
  const emergencyToggle = document.getElementById('emergencyToggle');

  const summaryService = document.getElementById('summaryService');
  const summarySlot = document.getElementById('summarySlot');
  const summaryBookingFee = document.getElementById('summaryBookingFee');
  const summaryVisitCharge = document.getElementById('summaryVisitCharge');
  const summaryEmergencyFee = document.getElementById('summaryEmergencyFee');
  const summaryTotal = document.getElementById('summaryTotal');

  const basePrice = getSelectedCategoryPrice();
  const isEmergency = emergencyToggle && emergencyToggle.checked;

  // Service name
  summaryService.textContent = selectedOption && selectedOption.value ? selectedOption.value : 'Not selected';

  // Preferred slot
  const dateVal = dateInput.value ? formatDate(dateInput.value) : '';
  const timeVal = timeInput.value ? formatTime(timeInput.value) : '';
  if (dateVal && timeVal) {
    summarySlot.textContent = dateVal + ' at ' + timeVal;
  } else if (dateVal) {
    summarySlot.textContent = dateVal;
  } else {
    summarySlot.textContent = '—';
  }

  // Fees
  summaryBookingFee.textContent = formatCurrency(PRICING.bookingFee);
  summaryVisitCharge.textContent = formatCurrency(PRICING.visitCharge);
  summaryEmergencyFee.textContent = formatCurrency(isEmergency ? PRICING.emergencySurcharge : 0);

  const total = PRICING.bookingFee + PRICING.visitCharge + (isEmergency ? PRICING.emergencySurcharge : 0) + basePrice;
  summaryTotal.textContent = formatCurrency(total);
}

function formatCurrency(amount) {
  return 'Rs. ' + Math.round(amount).toLocaleString('en-US');
}

function formatDate(isoDate) {
  const date = new Date(isoDate + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(time24) {
  const [hourStr, minuteStr] = time24.split(':');
  let hour = parseInt(hourStr, 10);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return hour + ':' + minuteStr + ' ' + suffix;
}

/* ---------------------------------------------------------
   3. EMERGENCY TOGGLE
   --------------------------------------------------------- */
function initEmergencyToggle() {
  const toggle = document.getElementById('emergencyToggle');
  const block = document.querySelector('.emergency-toggle-block');
  if (!toggle) return;

  toggle.addEventListener('change', function () {
    block.classList.toggle('active', toggle.checked);
    updateEstimate();
  });
}

/* ---------------------------------------------------------
   4. CHARACTER COUNTER FOR PROBLEM DESCRIPTION
   --------------------------------------------------------- */
function initCharCounter() {
  const textarea = document.getElementById('problemDescription');
  const counter = document.getElementById('charCount');
  const maxLength = 500;
  if (!textarea || !counter) return;

  textarea.addEventListener('input', function () {
    if (textarea.value.length > maxLength) {
      textarea.value = textarea.value.slice(0, maxLength);
    }
    counter.textContent = textarea.value.length;
  });
}

/* ---------------------------------------------------------
   5. "USE CURRENT LOCATION" BUTTON (dummy geolocation flow)
   --------------------------------------------------------- */
function initUseLocation() {
  const btn = document.getElementById('useLocationBtn');
  const input = document.getElementById('serviceLocation');
  if (!btn || !input) return;

  const dummyAddresses = [
    'New Baneshwor, Kathmandu',
    'Lazimpat, Kathmandu',
    'Jhamsikhel, Lalitpur',
    'Chabahil, Kathmandu'
  ];

  btn.addEventListener('click', function () {
    btn.classList.add('locating');
    const icon = btn.querySelector('i');
    icon.classList.remove('fa-crosshairs');
    icon.classList.add('fa-spinner');

    // Simulated geolocation lookup — replace with navigator.geolocation + reverse geocoding API later
    window.setTimeout(function () {
      const randomAddress = dummyAddresses[Math.floor(Math.random() * dummyAddresses.length)];
      input.value = randomAddress;
      input.classList.remove('is-invalid');

      btn.classList.remove('locating');
      icon.classList.remove('fa-spinner');
      icon.classList.add('fa-crosshairs');
    }, 900);
  });
}

/* ---------------------------------------------------------
   6. FORM VALIDATION + SUBMISSION (dummy — no backend)
   --------------------------------------------------------- */
function initFormValidation() {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  const fields = [
    { el: document.getElementById('serviceCategory'), type: 'select' },
    { el: document.getElementById('serviceLocation'), type: 'text' },
    { el: document.getElementById('preferredDate'), type: 'text' },
    { el: document.getElementById('preferredTime'), type: 'text' },
    { el: document.getElementById('problemDescription'), type: 'text' }
  ];

  // Live-clear invalid state as the user fixes fields
  fields.forEach(function (field) {
    if (!field.el) return;
    field.el.addEventListener('input', function () {
      if (field.el.value) field.el.classList.remove('is-invalid');
    });
    field.el.addEventListener('change', function () {
      if (field.el.value) field.el.classList.remove('is-invalid');
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    let isValid = true;
    fields.forEach(function (field) {
      if (!field.el) return;
      if (!field.el.value || !field.el.value.trim()) {
        field.el.classList.add('is-invalid');
        isValid = false;
      } else {
        field.el.classList.remove('is-invalid');
      }
    });

    if (!isValid) {
      const firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid.focus({ preventScroll: true });
      }
      return;
    }

    simulateBookingSubmission(form);
  });
}

function simulateBookingSubmission(form) {
  const submitBtn = form.querySelector('.btn-book-service');
  const originalHTML = submitBtn.innerHTML;

  submitBtn.classList.add('is-loading');
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner"></i> Processing Booking...';

  // Simulated network delay — no backend call is made
  window.setTimeout(function () {
    submitBtn.classList.remove('is-loading');
    submitBtn.innerHTML = originalHTML;
    showBookingToast();
    console.log('Dummy booking submitted — ready for backend integration.', {
      service: document.getElementById('serviceCategory').value,
      location: document.getElementById('serviceLocation').value,
      date: document.getElementById('preferredDate').value,
      time: document.getElementById('preferredTime').value,
      emergency: document.getElementById('emergencyToggle').checked,
      description: document.getElementById('problemDescription').value
    });
  }, 1200);
}

/* ---------------------------------------------------------
   7. CONFIRMATION TOAST
   --------------------------------------------------------- */
function showBookingToast() {
  const toast = document.getElementById('bookingToast');
  const closeBtn = document.getElementById('toastClose');
  if (!toast) return;

  toast.classList.add('show');

  const autoHide = window.setTimeout(function () {
    toast.classList.remove('show');
  }, 5000);

  if (closeBtn) {
    closeBtn.onclick = function () {
      toast.classList.remove('show');
      window.clearTimeout(autoHide);
    };
  }
}

/* ---------------------------------------------------------
   8. RIPPLE EFFECT
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
      window.setTimeout(function () { circle.remove(); }, 600);
    });
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