/* ==========================================================
   OneClick — Payment Page Logic
   All data below is dummy/static. No backend, no real APIs.
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Dummy Booking Data ---------- */
  const booking = {
    id: 'BK-20841',
    provider: 'Rajesh Karki',
    serviceCharge: 950.0,
    platformFee: 75.0
  };

  let discount = 0;
  let currentMethod = 'khalti';

  const baseTotal = booking.serviceCharge + booking.platformFee;

  const grandTotalEl = document.getElementById('grandTotal');
  const orderTotalEl = document.getElementById('orderTotal');
  const orderMethodValueEl = document.getElementById('orderMethodValue');
  const discountRow = document.getElementById('discountRow');
  const discountAmountEl = document.getElementById('discountAmount');

  const methodMeta = {
    khalti: { label: 'Khalti', icon: 'fa-solid fa-wallet' },
    card: { label: 'Credit / Debit Card', icon: 'fa-regular fa-credit-card' },
    cash: { label: 'Cash on Service', icon: 'fa-solid fa-money-bill-wave' }
  };

  function formatCurrency(amount) {
    return 'Rs. ' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function updateTotals() {
    const total = Math.max(baseTotal - discount, 0);
    grandTotalEl.textContent = formatCurrency(total);
    orderTotalEl.textContent = formatCurrency(total);
  }

  function updateOrderMethod(method) {
    const meta = methodMeta[method];
    orderMethodValueEl.innerHTML = `<i class="${meta.icon}"></i> ${meta.label}`;
  }

  updateTotals();
  updateOrderMethod(currentMethod);

  /* ---------- Coupon Logic (dummy) ---------- */
  const couponInput = document.getElementById('couponInput');
  const applyCouponBtn = document.getElementById('applyCouponBtn');
  const couponMessage = document.getElementById('couponMessage');
  const VALID_COUPON = 'ONECLICK10';

  applyCouponBtn.addEventListener('click', () => {
    const code = couponInput.value.trim().toUpperCase();

    if (!code) {
      couponMessage.textContent = 'Please enter a coupon code.';
      couponMessage.className = 'coupon-message error';
      return;
    }

    if (code === VALID_COUPON) {
      discount = baseTotal * 0.10;
      discountRow.classList.remove('d-none');
      discountAmountEl.textContent = '- ' + formatCurrency(discount);
      couponMessage.textContent = '10% discount applied successfully!';
      couponMessage.className = 'coupon-message success';
      applyCouponBtn.disabled = true;
      couponInput.disabled = true;
    } else {
      discount = 0;
      discountRow.classList.add('d-none');
      couponMessage.textContent = 'Invalid coupon code. Please try again.';
      couponMessage.className = 'coupon-message error';
    }

    updateTotals();
  });

  /* ---------- Payment Method Switching ---------- */
  const methodOptions = document.querySelectorAll('.method-option');
  const panels = {
    khalti: document.getElementById('khaltiPanel'),
    card: document.getElementById('cardPanel'),
    cash: document.getElementById('cashPanel')
  };

  function switchMethod(method) {
    currentMethod = method;

    methodOptions.forEach(opt => {
      opt.classList.toggle('active', opt.dataset.method === method);
    });

    Object.keys(panels).forEach(key => {
      if (key === method) {
        panels[key].classList.remove('d-none');
      } else {
        panels[key].classList.add('d-none');
      }
    });

    updateOrderMethod(method);
  }

  methodOptions.forEach(option => {
    option.addEventListener('click', () => switchMethod(option.dataset.method));
  });

  /* ---------- Khalti Flow ---------- */
  const simulatePaymentBtn = document.getElementById('simulatePaymentBtn');

  simulatePaymentBtn.addEventListener('click', () => {
    simulatePaymentBtn.disabled = true;
    simulatePaymentBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

    setTimeout(() => {
      window.location.href = buildSuccessUrl('Khalti');
    }, 1200);
  });

  /* ---------- Card Payment Validation ---------- */
  const cardForm = document.getElementById('cardForm');
  const cardNumberInput = document.getElementById('cardNumber');
  const cardExpiryInput = document.getElementById('cardExpiry');

  // Auto-format card number with spaces
  cardNumberInput.addEventListener('input', () => {
    let digits = cardNumberInput.value.replace(/\D/g, '').slice(0, 16);
    cardNumberInput.value = digits.replace(/(.{4})/g, '$1 ').trim();
  });

  // Auto-format expiry MM/YY
  cardExpiryInput.addEventListener('input', () => {
    let digits = cardExpiryInput.value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      cardExpiryInput.value = digits.slice(0, 2) + '/' + digits.slice(2);
    } else {
      cardExpiryInput.value = digits;
    }
  });

  cardForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const nameField = document.getElementById('cardName');
    const numberField = document.getElementById('cardNumber');
    const expiryField = document.getElementById('cardExpiry');
    const cvvField = document.getElementById('cardCvv');

    // Name check
    if (nameField.value.trim().length < 3) {
      nameField.classList.add('is-invalid');
      valid = false;
    } else {
      nameField.classList.remove('is-invalid');
    }

    // Card number check (16 digits)
    const rawNumber = numberField.value.replace(/\s/g, '');
    if (!/^\d{16}$/.test(rawNumber)) {
      numberField.classList.add('is-invalid');
      valid = false;
    } else {
      numberField.classList.remove('is-invalid');
    }

    // Expiry check MM/YY
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryField.value.trim())) {
      expiryField.classList.add('is-invalid');
      valid = false;
    } else {
      expiryField.classList.remove('is-invalid');
    }

    // CVV check (3 digits)
    if (!/^\d{3}$/.test(cvvField.value.trim())) {
      cvvField.classList.add('is-invalid');
      valid = false;
    } else {
      cvvField.classList.remove('is-invalid');
    }

    if (!valid) return;

    const submitBtn = cardForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing Payment...';

    setTimeout(() => {
      window.location.href = buildSuccessUrl('Credit / Debit Card');
    }, 1200);
  });

  /* ---------- Cash on Service ---------- */
  const confirmCashBtn = document.getElementById('confirmCashBtn');

  confirmCashBtn.addEventListener('click', () => {
    confirmCashBtn.disabled = true;
    confirmCashBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Confirming...';

    setTimeout(() => {
      window.location.href = buildSuccessUrl('Cash on Service');
    }, 1000);
  });

  /* ---------- Floating Order Summary "Confirm & Pay" ---------- */
  const orderConfirmBtn = document.getElementById('orderConfirmBtn');

  orderConfirmBtn.addEventListener('click', () => {
    if (currentMethod === 'khalti') {
      const khaltiModal = new bootstrap.Modal(document.getElementById('khaltiModal'));
      khaltiModal.show();
    } else if (currentMethod === 'card') {
      document.getElementById('cardPanel').scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('cardName').focus();
    } else if (currentMethod === 'cash') {
      confirmCashBtn.click();
    }
  });

  /* ---------- Helper: Build Success Page URL with Query Params ---------- */
  function buildSuccessUrl(methodLabel) {
    const total = Math.max(baseTotal - discount, 0);
    const params = new URLSearchParams({
      bookingId: booking.id,
      provider: booking.provider,
      amount: total.toFixed(2),
      method: methodLabel
    });
    return `payment-success.html?${params.toString()}`;
  }

});