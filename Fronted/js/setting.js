/* =========================================================
   OneClick · Settings Page
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------
     1. Sidebar category navigation
  --------------------------------------------------------- */

  const navItems = document.querySelectorAll('.oc-nav-item');
  const sections = document.querySelectorAll('.settings-section');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();

      const targetId = item.getAttribute('data-target');
      const targetEl = document.getElementById(targetId);

      if (!targetEl) {
        return;
      }

      setActiveNav(targetId);

      targetEl.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      targetEl.classList.remove('oc-section-slide-in');

      // Force reflow to restart animation
      void targetEl.offsetWidth;

      targetEl.classList.add('oc-section-slide-in');
    });
  });


  function setActiveNav(id) {

    navItems.forEach(el => {
      el.classList.remove('active');
    });

    const active = document.querySelector(
      `.oc-nav-item[data-target="${id}"]`
    );

    if (active) {
      active.classList.add('active');
    }
  }


  // Highlight correct sidebar item while scrolling
  const observer = new IntersectionObserver(
    (entries) => {

      entries.forEach(entry => {

        if (entry.isIntersecting) {
          setActiveNav(entry.target.id);
        }

      });

    },
    {
      rootMargin: '-40% 0px -50% 0px',
      threshold: 0
    }
  );


  sections.forEach(section => {
    observer.observe(section);
  });



  /* ---------------------------------------------------------
     2. Toast helper
  --------------------------------------------------------- */

  const toast = document.getElementById('successToast');
  const toastMessage = document.getElementById('toastMessage');

  let toastTimer = null;


  function showToast(message) {

    if (!toast || !toastMessage) {
      alert(message);
      return;
    }

    toastMessage.textContent = message;

    toast.classList.remove('show');

    void toast.offsetWidth;

    toast.classList.add('show');

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }



  /* ---------------------------------------------------------
     3. Profile picture preview
  --------------------------------------------------------- */

  const avatarInput = document.getElementById('avatarInput');
  const avatarPreview = document.getElementById('avatarPreview');


  if (avatarInput && avatarPreview) {

    avatarInput.addEventListener('change', () => {

      const file = avatarInput.files[0];

      if (!file) {
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        avatarPreview.src = e.target.result;
      };

      reader.readAsDataURL(file);
    });

  }



  /* ---------------------------------------------------------
     4. Profile save animation
  --------------------------------------------------------- */

  const profileForm = document.getElementById('profileForm');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const resetProfileBtn = document.getElementById('resetProfileBtn');


  if (profileForm && saveProfileBtn) {

    profileForm.addEventListener('submit', (e) => {

      e.preventDefault();

      runSaveAnimation(
        saveProfileBtn,
        'Profile updated successfully.'
      );

    });

  }


  if (resetProfileBtn && profileForm) {

    resetProfileBtn.addEventListener('click', () => {

      profileForm.reset();

      if (avatarPreview) {

        avatarPreview.src =
          'https://ui-avatars.com/api/?name=Rozit+Chhetri&background=2563EB&color=fff&size=160&font-size=0.38&bold=true';

      }

      showToast('Form reset to last saved values.');

    });

  }


  function runSaveAnimation(btn, successMessage) {

    const label = btn.querySelector('.btn-label');
    const spinner = btn.querySelector('.btn-spinner');
    const check = btn.querySelector('.btn-check');


    btn.disabled = true;


    if (label) {
      label.classList.add('d-none');
    }

    if (spinner) {
      spinner.classList.remove('d-none');
    }

    if (check) {
      check.classList.add('d-none');
    }


    setTimeout(() => {

      if (spinner) {
        spinner.classList.add('d-none');
      }

      if (check) {
        check.classList.remove('d-none');
      }


      setTimeout(() => {

        if (check) {
          check.classList.add('d-none');
        }

        if (label) {
          label.classList.remove('d-none');
        }

        btn.disabled = false;

        showToast(successMessage);

      }, 900);

    }, 1000);

  }



  /* ---------------------------------------------------------
     5. Security form
  --------------------------------------------------------- */

  const securityForm = document.getElementById('securityForm');


  if (securityForm) {

    securityForm.addEventListener('submit', (e) => {

      e.preventDefault();


      const newPassword =
        document.getElementById('newPassword');

      const confirmPassword =
        document.getElementById('confirmPassword');


      const newPass =
        newPassword ? newPassword.value : '';

      const confirmPass =
        confirmPassword ? confirmPassword.value : '';


      if (!newPass || !confirmPass) {

        showToast(
          'Please fill in your new password.'
        );

        return;
      }


      if (newPass !== confirmPass) {

        showToast(
          'New password and confirmation do not match.'
        );

        return;
      }


      securityForm.reset();

      showToast(
        'Password updated successfully.'
      );

    });

  }



  /* ---------------------------------------------------------
     Password show / hide toggle
  --------------------------------------------------------- */

  document
    .querySelectorAll('.oc-eye-toggle')
    .forEach(btn => {

      btn.addEventListener('click', () => {

        const targetId =
          btn.getAttribute('data-target');

        const input =
          document.getElementById(targetId);

        const icon =
          btn.querySelector('i');


        if (!input || !icon) {
          return;
        }


        const isPassword =
          input.type === 'password';


        input.type =
          isPassword ? 'text' : 'password';


        icon.classList.toggle(
          'fa-eye',
          !isPassword
        );

        icon.classList.toggle(
          'fa-eye-slash',
          isPassword
        );

      });

    });



  /* ---------------------------------------------------------
     6. Notifications checkboxes
  --------------------------------------------------------- */

  document
    .querySelectorAll(
      '#notifications input[type="checkbox"]'
    )
    .forEach(cb => {

      cb.addEventListener('change', () => {

        const item =
          cb.closest('.oc-check-item');

        if (!item) {
          return;
        }


        const strong =
          item.querySelector('strong');

        const label =
          strong
            ? strong.textContent
            : 'Notification';


        showToast(
          `${label} ${cb.checked ? 'enabled' : 'disabled'}.`
        );

      });

    });



  /* ---------------------------------------------------------
     7. Privacy toggle switches
  --------------------------------------------------------- */

  document
    .querySelectorAll('#privacy .oc-switch input')
    .forEach(sw => {

      sw.addEventListener('change', () => {

        const row =
          sw.closest('.oc-toggle-row');

        if (!row) {
          return;
        }


        const strong =
          row.querySelector('strong');

        const label =
          strong
            ? strong.textContent
            : 'Privacy setting';


        showToast(
          `${label} ${sw.checked ? 'turned on' : 'turned off'}.`
        );

      });

    });



  /* ---------------------------------------------------------
     8. Appearance — global theme
  --------------------------------------------------------- */

  const themeOptions =
    document.querySelectorAll('.oc-theme-option');


  function updateThemeButtons() {

    const currentTheme =
      window.OneClickTheme
        ? window.OneClickTheme.get()
        : localStorage.getItem('oneclick_theme') || 'light';


    themeOptions.forEach(opt => {

      opt.classList.toggle(
        'active',
        opt.getAttribute('data-theme') === currentTheme
      );

    });

  }


  themeOptions.forEach(opt => {

    opt.addEventListener('click', () => {

      const theme =
        opt.getAttribute('data-theme');


      if (window.OneClickTheme) {

        // Global theme system
        window.OneClickTheme.set(theme);

      } else {

        // Fallback
        localStorage.setItem(
          'oneclick_theme',
          theme
        );


        if (theme === 'dark') {

          document.documentElement.setAttribute(
            'data-theme',
            'dark'
          );

        } else if (theme === 'light') {

          document.documentElement.setAttribute(
            'data-theme',
            'light'
          );

        } else {

          const prefersDark =
            window.matchMedia(
              '(prefers-color-scheme: dark)'
            ).matches;


          document.documentElement.setAttribute(
            'data-theme',
            prefersDark ? 'dark' : 'light'
          );

        }

      }


      updateThemeButtons();


      showToast(
        `Theme set to ${opt.textContent.trim()}.`
      );

    });

  });


  // Load saved theme
  updateThemeButtons();



  /* ---------------------------------------------------------
     9. Language dropdown
  --------------------------------------------------------- */

  const languageSelect =
    document.getElementById('languageSelect');


  if (languageSelect) {

    languageSelect.addEventListener('change', () => {

      const selectedText =
        languageSelect.options[
          languageSelect.selectedIndex
        ].text;


      showToast(
        `Language changed to ${selectedText}.`
      );

    });

  }



  /* ---------------------------------------------------------
     10. Payment methods
  --------------------------------------------------------- */

  const addPaymentBtn =
    document.getElementById('addPaymentBtn');


  if (addPaymentBtn) {

    addPaymentBtn.addEventListener('click', () => {

      showToast(
        'Add Payment Method — this is a demo action.'
      );

    });

  }


  document
    .querySelectorAll('.oc-payment-card .btn')
    .forEach(btn => {

      btn.addEventListener('click', () => {

        showToast(
          `${btn.textContent.trim()} — this is a demo action.`
        );

      });

    });



  /* =========================================================
     11. DANGER ZONE — DEACTIVATE ACCOUNT
     ========================================================= */

  const deactivateBtn =
    document.getElementById('deactivateBtn');


  if (deactivateBtn) {

    deactivateBtn.addEventListener(
      'click',
      async () => {

        /*
         * Ask user for confirmation
         */

        const confirmed =
          confirm(
            'Are you sure you want to deactivate your account?'
          );


        if (!confirmed) {
          return;
        }


        /*
         * Get JWT access token
         */

        const accessToken =
          localStorage.getItem('access_token');


        if (!accessToken) {

          showToast(
            'You are not logged in.'
          );

          return;
        }


        /*
         * Save original button text
         */

        const originalText =
          deactivateBtn.textContent;


        /*
         * Disable button while request is running
         */

        deactivateBtn.disabled = true;

        deactivateBtn.textContent =
          'Deactivating...';


        try {

          /*
           * Send request to Django
           */

          const response =
            await fetch(
              'http://127.0.0.1:8000/api/users/deactivate/',
              {
                method: 'POST',

                headers: {
                  'Authorization':
                    `Bearer ${accessToken}`,

                  'Content-Type':
                    'application/json'
                }
              }
            );


          /*
           * Safely read response
           */

          let data = {};

          try {

            data = await response.json();

          } catch (jsonError) {

            console.error(
              'Invalid server response:',
              jsonError
            );

          }


          /*
           * Handle API error
           */

          if (!response.ok) {

            showToast(
              data.error ||
              data.detail ||
              'Unable to deactivate your account.'
            );


            deactivateBtn.disabled = false;

            deactivateBtn.textContent =
              originalText;


            return;
          }


          /*
           * Account successfully deactivated
           */

          showToast(
            data.message ||
            'Your account has been deactivated.'
          );


          /*
           * Remove saved login information
           */

          localStorage.removeItem(
            'access_token'
          );

          localStorage.removeItem(
            'refresh_token'
          );

          localStorage.removeItem(
            'user'
          );


          /*
           * Redirect to login page
           */

          setTimeout(() => {

            window.location.href =
              'login.html';

          }, 1500);

        } catch (error) {

          console.error(
            'Deactivate account error:',
            error
          );


          showToast(
            'Unable to connect to the server.'
          );


          deactivateBtn.disabled = false;

          deactivateBtn.textContent =
            originalText;

        }

      }
    );

  }



  /* =========================================================
     12. DANGER ZONE — DELETE ACCOUNT
     ========================================================= */

  const deleteConfirmInput =
    document.getElementById(
      'deleteConfirmInput'
    );


  const confirmDeleteBtn =
    document.getElementById(
      'confirmDeleteBtn'
    );


  const deleteModalEl =
    document.getElementById(
      'deleteModal'
    );



  /*
   * Enable Delete button only when
   * user types DELETE
   */

  if (
    deleteConfirmInput &&
    confirmDeleteBtn
  ) {

    deleteConfirmInput.addEventListener(
      'input',
      () => {

        const typedText =
          deleteConfirmInput.value
            .trim()
            .toUpperCase();


        confirmDeleteBtn.disabled =
          typedText !== 'DELETE';

      }
    );

  }



  /*
   * Permanently delete account
   */

  if (confirmDeleteBtn) {

    confirmDeleteBtn.addEventListener(
      'click',
      async () => {

        /*
         * Get access token
         */

        const accessToken =
          localStorage.getItem(
            'access_token'
          );


        if (!accessToken) {

          showToast(
            'You are not logged in.'
          );

          return;
        }


        /*
         * Extra safety check
         */

        if (
          !deleteConfirmInput ||
          deleteConfirmInput.value
            .trim()
            .toUpperCase() !== 'DELETE'
        ) {

          showToast(
            'Please type DELETE to confirm.'
          );

          return;
        }


        /*
         * Disable button
         */

        confirmDeleteBtn.disabled =
          true;


        confirmDeleteBtn.innerHTML =
          '<i class="fa-solid fa-circle-notch fa-spin me-2"></i>Deleting...';



        try {

          /*
           * Send DELETE request to Django
           */

          const response =
            await fetch(
              'http://127.0.0.1:8000/api/users/delete/',
              {
                method: 'DELETE',

                headers: {
                  'Authorization':
                    `Bearer ${accessToken}`,

                  'Content-Type':
                    'application/json'
                }
              }
            );


          /*
           * Safely read server response
           */

          let data = {};

          try {

            data =
              await response.json();

          } catch (jsonError) {

            console.error(
              'Invalid server response:',
              jsonError
            );

          }


          /*
           * Handle API error
           */

          if (!response.ok) {

            showToast(
              data.error ||
              data.detail ||
              'Unable to delete your account.'
            );


            confirmDeleteBtn.disabled =
              false;


            confirmDeleteBtn.innerHTML =
              '<i class="fa-solid fa-trash me-2"></i>Delete Permanently';


            return;
          }


          /*
           * Close Bootstrap modal
           */

          if (
            deleteModalEl &&
            typeof bootstrap !== 'undefined'
          ) {

            const modal =
              bootstrap.Modal.getInstance(
                deleteModalEl
              );


            if (modal) {
              modal.hide();
            }

          }


          /*
           * Remove login information
           */

          localStorage.removeItem(
            'access_token'
          );

          localStorage.removeItem(
            'refresh_token'
          );

          localStorage.removeItem(
            'user'
          );


          /*
           * Show success message
           */

          showToast(
            data.message ||
            'Your account has been permanently deleted.'
          );


          /*
           * Redirect to login
           */

          setTimeout(() => {

            window.location.href =
              'login.html';

          }, 1500);

        } catch (error) {

          console.error(
            'Delete account error:',
            error
          );


          showToast(
            'Unable to connect to the server.'
          );


          confirmDeleteBtn.disabled =
            false;


          confirmDeleteBtn.innerHTML =
            '<i class="fa-solid fa-trash me-2"></i>Delete Permanently';

        }

      }
    );

  }



  /* ---------------------------------------------------------
     Reset delete modal whenever it closes
  --------------------------------------------------------- */

  if (
    deleteModalEl &&
    deleteConfirmInput &&
    confirmDeleteBtn
  ) {

    deleteModalEl.addEventListener(
      'hidden.bs.modal',
      () => {

        deleteConfirmInput.value =
          '';


        confirmDeleteBtn.disabled =
          true;


        confirmDeleteBtn.innerHTML =
          '<i class="fa-solid fa-trash me-2"></i>Delete Permanently';

      }
    );

  }

});