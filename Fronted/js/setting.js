/* =========================================================
   OneClick · Settings Page
   Dummy frontend-only interactivity
========================================================= */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------
     1. Sidebar category navigation (scroll + active highlight)
  --------------------------------------------------------- */
  const navItems = document.querySelectorAll('.oc-nav-item');
  const sections = document.querySelectorAll('.settings-section');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = item.getAttribute('data-target');
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      setActiveNav(targetId);

      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      targetEl.classList.remove('oc-section-slide-in');
      // force reflow to restart animation
      void targetEl.offsetWidth;
      targetEl.classList.add('oc-section-slide-in');
    });
  });

  function setActiveNav(id) {
    navItems.forEach(el => el.classList.remove('active'));
    const active = document.querySelector(`.oc-nav-item[data-target="${id}"]`);
    if (active) active.classList.add('active');
  }

  // Highlight the correct sidebar item as the user scrolls
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setActiveNav(entry.target.id);
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });

  sections.forEach(sec => observer.observe(sec));


  /* ---------------------------------------------------------
     2. Toast helper
  --------------------------------------------------------- */
  const toast = document.getElementById('successToast');
  const toastMessage = document.getElementById('toastMessage');
  let toastTimer = null;

  function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }


  /* ---------------------------------------------------------
     3. Profile picture preview
  --------------------------------------------------------- */
  const avatarInput = document.getElementById('avatarInput');
  const avatarPreview = document.getElementById('avatarPreview');

  avatarInput.addEventListener('change', () => {
    const file = avatarInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { avatarPreview.src = e.target.result; };
    reader.readAsDataURL(file);
  });


  /* ---------------------------------------------------------
     4. Profile save animation (Save Changes button)
  --------------------------------------------------------- */
  const profileForm = document.getElementById('profileForm');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const resetProfileBtn = document.getElementById('resetProfileBtn');

  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    runSaveAnimation(saveProfileBtn, 'Profile updated successfully.');
  });

  resetProfileBtn.addEventListener('click', () => {
    profileForm.reset();
    avatarPreview.src = "https://ui-avatars.com/api/?name=Rozit+Chhetri&background=2563EB&color=fff&size=160&font-size=0.38&bold=true";
    showToast('Form reset to last saved values.');
  });

  function runSaveAnimation(btn, successMessage) {
    const label = btn.querySelector('.btn-label');
    const spinner = btn.querySelector('.btn-spinner');
    const check = btn.querySelector('.btn-check');

    btn.disabled = true;
    label.classList.add('d-none');
    spinner.classList.remove('d-none');
    check.classList.add('d-none');

    setTimeout(() => {
      spinner.classList.add('d-none');
      check.classList.remove('d-none');

      setTimeout(() => {
        check.classList.add('d-none');
        label.classList.remove('d-none');
        btn.disabled = false;
        showToast(successMessage);
      }, 900);
    }, 1000);
  }


  /* ---------------------------------------------------------
     5. Security form (password update)
  --------------------------------------------------------- */
  const securityForm = document.getElementById('securityForm');

  securityForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;

    if (!newPass || !confirmPass) {
      showToast('Please fill in your new password.');
      return;
    }
    if (newPass !== confirmPass) {
      showToast('New password and confirmation do not match.');
      return;
    }
    securityForm.reset();
    showToast('Password updated successfully.');
  });

  // Password show/hide toggle
  document.querySelectorAll('.oc-eye-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const icon = btn.querySelector('i');
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      icon.classList.toggle('fa-eye', !isPassword);
      icon.classList.toggle('fa-eye-slash', isPassword);
    });
  });


  /* ---------------------------------------------------------
     6. Notifications checkboxes (dummy persistence via toast)
  --------------------------------------------------------- */
  document.querySelectorAll('#notifications input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const label = cb.closest('.oc-check-item').querySelector('strong').textContent;
      showToast(`${label} ${cb.checked ? 'enabled' : 'disabled'}.`);
    });
  });


  /* ---------------------------------------------------------
     7. Privacy toggle switches
  --------------------------------------------------------- */
  document.querySelectorAll('#privacy .oc-switch input').forEach(sw => {
    sw.addEventListener('change', () => {
      const label = sw.closest('.oc-toggle-row').querySelector('strong').textContent;
      showToast(`${label} ${sw.checked ? 'turned on' : 'turned off'}.`);
    });
  });


  /* ---------------------------------------------------------
     8. Appearance — theme preview
  --------------------------------------------------------- */
  const themeOptions = document.querySelectorAll('.oc-theme-option');
  themeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      themeOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      const theme = opt.getAttribute('data-theme');

      if (theme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
      } else if (theme === 'light') {
        document.body.removeAttribute('data-theme');
      } else {
        // system default
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.body.setAttribute('data-theme', 'dark');
        } else {
          document.body.removeAttribute('data-theme');
        }
      }
      showToast(`Theme set to ${opt.textContent.trim()}.`);
    });
  });

  // Accent color
  const accentSwatches = document.querySelectorAll('.oc-accent-swatch');
  const accentPreview = document.getElementById('accentPreview');

  accentSwatches.forEach(sw => {
    sw.addEventListener('click', () => {
      accentSwatches.forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      const color = sw.getAttribute('data-accent');
      document.documentElement.style.setProperty('--oc-accent-active', color);
      accentPreview.style.background = color;
    });
  });

  // Font size
  const fsOptions = document.querySelectorAll('.oc-fs-option');
  const fontScaleMap = { small: 0.92, medium: 1, large: 1.12 };

  fsOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      fsOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      const size = opt.getAttribute('data-size');
      document.documentElement.style.setProperty('--oc-font-scale', fontScaleMap[size]);
      showToast(`Font size set to ${size}.`);
    });
  });


  /* ---------------------------------------------------------
     9. Language dropdown
  --------------------------------------------------------- */
  const languageSelect = document.getElementById('languageSelect');
  languageSelect.addEventListener('change', () => {
    const selectedText = languageSelect.options[languageSelect.selectedIndex].text;
    showToast(`Language changed to ${selectedText}.`);
  });


  /* ---------------------------------------------------------
     10. Payment methods (dummy add)
  --------------------------------------------------------- */
  document.getElementById('addPaymentBtn').addEventListener('click', () => {
    showToast('Add Payment Method — this is a demo action.');
  });

  document.querySelectorAll('.oc-payment-card .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast(`${btn.textContent.trim()} — this is a demo action.`);
    });
  });


  /* ---------------------------------------------------------
     11. Danger zone — deactivate
  --------------------------------------------------------- */
  document.getElementById('deactivateBtn').addEventListener('click', () => {
    showToast('Account deactivation requested (demo only).');
  });


  /* ---------------------------------------------------------
     12. Danger zone — delete account confirmation modal
  --------------------------------------------------------- */
  const deleteConfirmInput = document.getElementById('deleteConfirmInput');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const deleteModalEl = document.getElementById('deleteModal');

  deleteConfirmInput.addEventListener('input', () => {
    confirmDeleteBtn.disabled = deleteConfirmInput.value.trim().toUpperCase() !== 'DELETE';
  });

  confirmDeleteBtn.addEventListener('click', () => {
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin me-2"></i>Deleting...';

    setTimeout(() => {
      const modal = bootstrap.Modal.getInstance(deleteModalEl);
      if (modal) modal.hide();
      showToast('Account deletion simulated — this is a demo only.');
      confirmDeleteBtn.innerHTML = '<i class="fa-solid fa-trash me-2"></i>Delete Permanently';
    }, 1400);
  });

  // Reset the delete modal state whenever it is closed
  deleteModalEl.addEventListener('hidden.bs.modal', () => {
    deleteConfirmInput.value = '';
    confirmDeleteBtn.disabled = true;
  });

});