/* =========================================================
   OneClick — 404 Error Page Scripts
   - Rotating helpful tips
   - Search placeholder functionality
   - Button ripple effect
   - Fade-in on load (handled primarily via CSS)
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------------------------------------------------------
     Rotating helpful tips
     --------------------------------------------------------- */
  var tips = [
    {
      title: 'Need an electrician?',
      subtitle: 'Book trusted providers in minutes.'
    },
    {
      title: 'Looking for plumbers?',
      subtitle: 'Visit our Services page.'
    },
    {
      title: 'Moving house?',
      subtitle: 'Try our verified movers.'
    },
    {
      title: 'Home feeling dusty?',
      subtitle: 'Find a cleaning provider near you.'
    },
    {
      title: 'Something needs fixing?',
      subtitle: 'Browse handyman services on OneClick.'
    }
  ];

  var tipIndex = 0;
  var tipCard = document.getElementById('tipCard');
  var tipTitle = document.getElementById('tipTitle');
  var tipSubtitle = document.getElementById('tipSubtitle');

  function rotateTip() {
    if (!tipCard || !tipTitle || !tipSubtitle) return;

    tipCard.classList.add('oc-tip-fade');

    setTimeout(function () {
      tipIndex = (tipIndex + 1) % tips.length;
      tipTitle.textContent = tips[tipIndex].title;
      tipSubtitle.textContent = tips[tipIndex].subtitle;
      tipCard.classList.remove('oc-tip-fade');
    }, 350);
  }

  if (tipCard) {
    setInterval(rotateTip, 4000);
  }

  /* ---------------------------------------------------------
     Search placeholder functionality
     --------------------------------------------------------- */
  var searchInput = document.getElementById('errorSearchInput');
  var searchBtn = document.getElementById('errorSearchBtn');
  var searchMessage = document.getElementById('searchMessage');
  var messageTimeout;

  function showSearchMessage() {
    if (!searchMessage) return;

    searchMessage.textContent = 'Search functionality will be available after backend integration.';
    searchMessage.classList.add('show');

    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(function () {
      searchMessage.classList.remove('show');
    }, 3500);
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', showSearchMessage);
  }

  if (searchInput) {
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        showSearchMessage();
      }
    });
  }

  /* ---------------------------------------------------------
     Button ripple effect
     --------------------------------------------------------- */
  var rippleButtons = document.querySelectorAll('.oc-btn-ripple');

  rippleButtons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      var x = e.clientX - rect.left - size / 2;
      var y = e.clientY - rect.top - size / 2;

      var ripple = document.createElement('span');
      ripple.className = 'oc-ripple-circle';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';

      btn.appendChild(ripple);

      setTimeout(function () {
        ripple.remove();
      }, 650);
    });
  });

});