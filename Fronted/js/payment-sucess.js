/* ==========================================================
   OneClick — Payment Success Page Logic
   Frontend-only demo. No backend, no real APIs.
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Populate Details from URL Params (fallback to dummy) ---------- */
  const params = new URLSearchParams(window.location.search);

  const data = {
    bookingId: params.get('bookingId') || 'BK-20841',
    provider: params.get('provider') || 'Rajesh Karki',
    amount: params.get('amount') || '1025.00',
    method: params.get('method') || 'Khalti'
  };

  document.getElementById('bookingIdValue').textContent = data.bookingId;
  document.getElementById('providerValue').textContent = data.provider;
  document.getElementById('methodValue').textContent = data.method;

  const amountNum = parseFloat(data.amount);
  document.getElementById('amountValue').textContent =
    'Rs. ' + amountNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* ---------- Download Receipt (dummy) ---------- */
  document.getElementById('downloadReceiptBtn').addEventListener('click', () => {
    const receiptText =
`OneClick — Payment Receipt
----------------------------------
Booking ID:      ${data.bookingId}
Provider:        ${data.provider}
Amount Paid:     Rs. ${amountNum.toFixed(2)}
Payment Method:  ${data.method}
Status:          Successful
----------------------------------
This is a dummy receipt generated for
frontend demonstration purposes only.`;

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OneClick-Receipt-${data.bookingId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  /* ---------- Confetti Effect (frontend-only, canvas based) ---------- */
  const canvas = document.getElementById('confettiCanvas');
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const colors = ['#2563EB', '#3B82F6', '#F59E0B', '#22C55E', '#FBBF24'];
  const confettiCount = 140;
  let confetti = [];

  function createConfetti() {
    confetti = [];
    for (let i = 0; i < confettiCount; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.5,
        size: 6 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: 2 + Math.random() * 3,
        speedX: (Math.random() - 0.5) * 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        shape: Math.random() > 0.5 ? 'circle' : 'rect'
      });
    }
  }

  let animationFrame;
  let elapsedFrames = 0;
  const maxFrames = 260; // roughly ~4 seconds at 60fps

  function drawConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    confetti.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }

      ctx.restore();

      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotationSpeed;
    });

    elapsedFrames++;

    if (elapsedFrames < maxFrames) {
      animationFrame = requestAnimationFrame(drawConfetti);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrame);
    }
  }

  // Respect reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    createConfetti();
    requestAnimationFrame(drawConfetti);
  }

});