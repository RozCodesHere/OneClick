/* ==========================================================
   OneClick — Booking Details Page JS
   Dummy data driven. No backend calls — ready for Django
   REST API integration later (replace DUMMY_BOOKING with
   an API fetch and re-render).
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------------------------
     DUMMY DATA — simulates what would come from the backend
     e.g. GET /api/bookings/<id>/
  ---------------------------------------------------------- */
  const DUMMY_BOOKING = {
    id: 'OC-20458',
    status: 'completed', // 'completed' | 'upcoming' | 'cancelled'
    hasReview: true
  };

  /* ----------------------------------------------------------
     1. STATUS BADGE
     Updates badge color/icon/text based on booking status.
  ---------------------------------------------------------- */
  function renderStatusBadge(status) {
    const badge = document.querySelector('.status-badge');
    if (!badge) return;

    const statusMap = {
      completed: { cls: 'status-completed', icon: 'fa-circle-check', label: 'Completed' },
      upcoming: { cls: 'status-upcoming', icon: 'fa-clock', label: 'Upcoming' },
      cancelled: { cls: 'status-cancelled', icon: 'fa-circle-xmark', label: 'Cancelled' }
    };

    const config = statusMap[status] || statusMap.completed;

    badge.classList.remove('status-completed', 'status-upcoming', 'status-cancelled');
    badge.classList.add(config.cls);
    badge.innerHTML = `<i class="fa-solid ${config.icon}"></i> ${config.label}`;
  }

  /* ----------------------------------------------------------
     2. REVIEW SECTION LOGIC
     - Completed + already reviewed  -> show existing review
     - Completed + not reviewed yet  -> show review form
     - Not completed                 -> show "review after completion" notice
  ---------------------------------------------------------- */
  function renderReviewSection(status, hasReview) {
    const existingReview = document.getElementById('existingReview');
    const reviewForm = document.getElementById('reviewForm');
    const notCompletedNotice = document.getElementById('notCompletedNotice');

    existingReview.classList.add('d-none');
    reviewForm.classList.add('d-none');
    notCompletedNotice.classList.add('d-none');

    if (status === 'completed' && hasReview) {
      existingReview.classList.remove('d-none');
    } else if (status === 'completed' && !hasReview) {
      reviewForm.classList.remove('d-none');
    } else {
      notCompletedNotice.classList.remove('d-none');
    }
  }

  /* ----------------------------------------------------------
     3. STAR RATING INPUT (interactive)
  ---------------------------------------------------------- */
  let selectedRating = 0;

  function setupStarInput() {
    const stars = document.querySelectorAll('#starInput i');

    stars.forEach((star) => {
      star.addEventListener('click', () => {
        selectedRating = parseInt(star.dataset.value, 10);
        highlightStars(selectedRating);
      });

      star.addEventListener('mouseenter', () => {
        highlightStars(parseInt(star.dataset.value, 10));
      });
    });

    const starInputContainer = document.getElementById('starInput');
    if (starInputContainer) {
      starInputContainer.addEventListener('mouseleave', () => {
        highlightStars(selectedRating);
      });
    }
  }

  function highlightStars(count) {
    const stars = document.querySelectorAll('#starInput i');
    stars.forEach((star) => {
      const value = parseInt(star.dataset.value, 10);
      if (value <= count) {
        star.classList.remove('fa-regular');
        star.classList.add('fa-solid', 'active');
      } else {
        star.classList.remove('fa-solid', 'active');
        star.classList.add('fa-regular');
      }
    });
  }

  /* ----------------------------------------------------------
     4. SUBMIT REVIEW
     In production this would POST to e.g. /api/bookings/<id>/review/
  ---------------------------------------------------------- */
  function setupReviewSubmit() {
    const submitBtn = document.getElementById('submitReviewBtn');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', () => {
      const reviewText = document.getElementById('reviewText').value.trim();

      if (selectedRating === 0) {
        alert('Please select a star rating before submitting.');
        return;
      }
      if (reviewText.length === 0) {
        alert('Please write a short review before submitting.');
        return;
      }

      // Simulate a successful submit — swap form for a thank-you state
      const reviewForm = document.getElementById('reviewForm');
      reviewForm.innerHTML = `
        <div class="text-center py-3">
          <i class="fa-solid fa-circle-check text-success mb-2" style="font-size:2rem;"></i>
          <p class="fw-600 mb-0">Thank you for your review!</p>
          <p class="text-muted mb-0" style="font-size:0.85rem;">Your feedback helps other customers choose the right provider.</p>
        </div>
      `;
    });
  }

  /* ----------------------------------------------------------
     5. INVOICE ACTIONS
  ---------------------------------------------------------- */
  function setupInvoiceActions() {
    const downloadBtn = document.getElementById('downloadInvoiceBtn');
    const printBtn = document.getElementById('printInvoiceBtn');

    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        // Placeholder — in production this would trigger a PDF download
        // e.g. window.location.href = `/api/bookings/${DUMMY_BOOKING.id}/invoice/download/`;
        alert('Downloading invoice for booking #' + DUMMY_BOOKING.id + ' ...');
      });
    }

    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }
  }

  /* ----------------------------------------------------------
     6. BOTTOM ACTION BUTTONS
  ---------------------------------------------------------- */
  function setupBottomActions() {
    const buttons = document.querySelectorAll('.bottom-actions .btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const label = btn.textContent.trim();
        if (label.includes('Back to History')) {
          // e.g. window.location.href = 'booking-history.html';
          console.log('Navigating back to Booking History...');
        } else if (label.includes('Book Again')) {
          console.log('Redirecting to new booking flow...');
        } else if (label.includes('Contact Provider')) {
          console.log('Opening chat/contact with provider...');
        }
      });
    });
  }

  /* ----------------------------------------------------------
     7. PROVIDER CALL / MESSAGE BUTTONS
  ---------------------------------------------------------- */
  function setupProviderActions() {
    const callBtn = document.querySelector('.provider-avatar')?.closest('.card-body')?.querySelector('.btn-primary-custom');
    const messageBtn = document.querySelector('.provider-avatar')?.closest('.card-body')?.querySelector('.btn-outline-custom');

    if (callBtn) {
      callBtn.addEventListener('click', () => {
        alert('Calling provider...');
      });
    }
    if (messageBtn) {
      messageBtn.addEventListener('click', () => {
        console.log('Opening message thread with provider...');
      });
    }
  }

  /* ----------------------------------------------------------
     INIT
  ---------------------------------------------------------- */
  renderStatusBadge(DUMMY_BOOKING.status);
  renderReviewSection(DUMMY_BOOKING.status, DUMMY_BOOKING.hasReview);
  setupStarInput();
  setupReviewSubmit();
  setupInvoiceActions();
  setupBottomActions();
  setupProviderActions();

});