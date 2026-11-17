
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

function t(key, fallback) {
  const language = window.OneClickLanguage
    ? window.OneClickLanguage.get()
    : 'en';

  const messages = {
    en: {
      saved: 'Changes saved successfully.',
      language_saved: 'Language preference saved.',
      notifications_saved: 'Notification preferences saved.',
      privacy_saved: 'Privacy settings saved.',
      appearance_saved: 'Appearance settings saved.',
      payment_saved: 'Payment preference saved.'
    },
    ne: {
      saved: 'परिवर्तनहरू सफलतापूर्वक सुरक्षित गरियो।',
      language_saved: 'भाषा प्राथमिकता सुरक्षित गरियो।',
      notifications_saved: 'सूचना प्राथमिकताहरू सुरक्षित गरियो।',
      privacy_saved: 'गोपनीयता सेटिङहरू सुरक्षित गरियो।',
      appearance_saved: 'रूपरङ सेटिङहरू सुरक्षित गरियो।',
      payment_saved: 'भुक्तानी प्राथमिकता सुरक्षित गरियो।'
    },
    hi: {
      saved: 'बदलाव सफलतापूर्वक सहेजे गए।',
      language_saved: 'भाषा प्राथमिकता सहेजी गई।',
      notifications_saved: 'सूचना प्राथमिकताएं सहेजी गईं।',
      privacy_saved: 'गोपनीयता सेटिंग्स सहेजी गईं।',
      appearance_saved: 'रूप सेटिंग्स सहेजी गईं।',
      payment_saved: 'भुगतान प्राथमिकता सहेजी गई।'
    }
  };

  return messages[language]?.[key] || fallback;
}

  /* ---------------------------------------------------------
     3. API settings
  --------------------------------------------------------- */

 const BACKEND_BASE = (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
)
    ? 'http://127.0.0.1:8000'
    : 'http://127.0.0.1:8000';

const API_BASE = `${BACKEND_BASE}/api`;



  /* ---------------------------------------------------------
     4. Profile elements
  --------------------------------------------------------- */

  const profileForm =
    document.getElementById('profileForm');

  const saveProfileBtn =
    document.getElementById('saveProfileBtn');

  const resetProfileBtn =
    document.getElementById('resetProfileBtn');

  const firstNameInput =
    document.getElementById('firstName');

  const lastNameInput =
    document.getElementById('lastName');

  const emailInput =
    document.getElementById('email');

  const avatarInput =
    document.getElementById('avatarInput');

  const avatarPreview =
    document.getElementById('avatarPreview');



  /* ---------------------------------------------------------
     5. Load current user profile
  --------------------------------------------------------- */

  async function loadCurrentUser() {

    const accessToken =
      localStorage.getItem('access_token');

    if (!accessToken) {

      console.warn(
        'No access token found.'
      );

      return null;
    }


    try {

      const response =
        await fetch(
          `${API_BASE}/users/me/`,
          {
            method: 'GET',

            headers: {
              'Authorization':
                `Bearer ${accessToken}`
            }
          }
        );


      const data =
        await response.json()
          .catch(() => ({}));


      console.log(
        'CURRENT USER:',
        response.status,
        data
      );
      loadNotificationPreferences(
  data.notification_preferences || {}
);
loadPrivacyPreferences(
  data.privacy_preferences || {}
);

loadAppearancePreferences(
  data.appearance_preferences || {}
);
loadPaymentPreference(
  data.preferred_payment_method || 'cash'
);

      if (!response.ok) {

        console.error(
          'Unable to load current user:',
          data
        );

        return null;
      }
const settingsDashboardLink =
    document.getElementById('settingsDashboardLink');

if (settingsDashboardLink) {
    settingsDashboardLink.href =
        data.role === 'provider'
            ? 'provider-dashboard.html'
            : 'customer-dashboard.html';
}

      /* -----------------------------------------------------
         Fill name and email fields
      ----------------------------------------------------- */

      if (firstNameInput) {

        firstNameInput.value =
          data.first_name || '';

      }


      if (lastNameInput) {

        lastNameInput.value =
          data.last_name || '';

      }


      if (emailInput) {

        emailInput.value =
          data.email || '';

      }
      const phoneInput = document.getElementById('phone');

if (phoneInput) {
    phoneInput.value = data.phone || '';
}


      /* -----------------------------------------------------
         Save latest user information locally
      ----------------------------------------------------- */

      localStorage.setItem(
        'user',
        JSON.stringify(data)
      );


      /* -----------------------------------------------------
         Load profile picture
      ----------------------------------------------------- */

      if (
        avatarPreview &&
        data.profile_picture
      ) {

        const imageUrl =
          data.profile_picture.startsWith('http')
            ? data.profile_picture
            : `${BACKEND_BASE}${data.profile_picture}`;

        avatarPreview.src =
          imageUrl;
      }


      return data;


    } catch (error) {

      console.error(
        'Load user error:',
        error
      );

      return null;
    }
  }



  /* ---------------------------------------------------------
     Load profile when page opens
  --------------------------------------------------------- */

  loadCurrentUser();
  
     
  /* =========================================================
     18. SERVICE LOCATION — CUSTOMER AND PROVIDER
  ========================================================= */

  const locationForm =
    document.getElementById('serviceLocationForm');

  const locationMessage =
    document.getElementById('serviceLocationMessage');

  const locationButton =
    document.getElementById('saveServiceLocationBtn');

  const countryInput =
    document.getElementById('settingCountry');

  const provinceInput =
    document.getElementById('settingProvince');

  const districtInput =
    document.getElementById('settingDistrict');

  const cityInput =
    document.getElementById('settingCity');

  const locationDescription =
    document.getElementById('locationDescription');

  // Map elements
  const mapElement =
    document.getElementById('serviceLocationMap');

  const latitudeInput =
    document.getElementById('selectedLatitude');

  const longitudeInput =
    document.getElementById('selectedLongitude');

  const latitudeText =
    document.getElementById('selectedLatitudeText');

  const longitudeText =
    document.getElementById('selectedLongitudeText');

  let currentUserRole = '';
  let locationMap = null;
  let locationMarker = null;


  function showLocationMessage(message, success = true) {

    if (!locationMessage) return;

    locationMessage.textContent = message;

    locationMessage.className = success
      ? 'mt-3 text-success'
      : 'mt-3 text-danger';
  }


  function fillLocationFields(location) {

    if (!location) return;

    if (countryInput) {
      countryInput.value = location.country || 'Nepal';
    }

    if (provinceInput) {
      provinceInput.value = location.province || '';
    }

    if (districtInput) {
      districtInput.value = location.district || '';
    }

    if (cityInput) {
      cityInput.value = location.city || '';
    }
  }


  /* ---------------------------------------------------------
     MAP — UPDATE SELECTED COORDINATES
  --------------------------------------------------------- */

  function updateSelectedCoordinates(latitude, longitude) {

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    if (latitudeInput) {
      latitudeInput.value = lat.toFixed(6);
    }

    if (longitudeInput) {
      longitudeInput.value = lng.toFixed(6);
    }

    if (latitudeText) {
      latitudeText.textContent = lat.toFixed(6);
    }

    if (longitudeText) {
      longitudeText.textContent = lng.toFixed(6);
    }
  }


  /* ---------------------------------------------------------
     MAP — INITIALIZE LEAFLET
  --------------------------------------------------------- */

  function initializeLocationMap(savedLatitude = null, savedLongitude = null) {

    if (!mapElement) {
      console.warn('Service location map element not found.');
      return;
    }

    if (typeof L === 'undefined') {
      showLocationMessage(
        'Map library could not load. Please refresh the page.',
        false
      );
      return;
    }

    // Prevent initializing the same map twice.
    if (locationMap) {
      return;
    }

    // Default map center: Nepal.
    let mapCenter = [28.3949, 84.1240];
    let mapZoom = 7;

    const hasSavedCoordinates =
      savedLatitude !== null &&
      savedLatitude !== '' &&
      savedLongitude !== null &&
      savedLongitude !== '' &&
      Number.isFinite(Number(savedLatitude)) &&
      Number.isFinite(Number(savedLongitude));

    if (hasSavedCoordinates) {
      mapCenter = [
        Number(savedLatitude),
        Number(savedLongitude)
      ];

      mapZoom = 15;
    }

    locationMap = L.map('serviceLocationMap').setView(
      mapCenter,
      mapZoom
    );

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }
    ).addTo(locationMap);


    // Create marker if coordinates already exist.
    if (hasSavedCoordinates) {

      locationMarker = L.marker(
        mapCenter,
        { draggable: true }
      ).addTo(locationMap);

      updateSelectedCoordinates(
        mapCenter[0],
        mapCenter[1]
      );

      locationMarker.on('dragend', function () {

        const position =
          locationMarker.getLatLng();

        updateSelectedCoordinates(
          position.lat,
          position.lng
        );

      });
    }


    // Click anywhere on map to select a location.
    locationMap.on('click', function (event) {

      const latitude = event.latlng.lat;
      const longitude = event.latlng.lng;

      if (!locationMarker) {

        locationMarker = L.marker(
          [latitude, longitude],
          { draggable: true }
        ).addTo(locationMap);

        locationMarker.on('dragend', function () {

          const position =
            locationMarker.getLatLng();

          updateSelectedCoordinates(
            position.lat,
            position.lng
          );

        });

      } else {

        locationMarker.setLatLng([
          latitude,
          longitude
        ]);

      }

      updateSelectedCoordinates(
        latitude,
        longitude
      );

    });

    // Ensure map displays correctly after initialization.
    setTimeout(() => {
      locationMap.invalidateSize();
    }, 200);
  }


  /* ---------------------------------------------------------
     LOAD CUSTOMER / PROVIDER LOCATION
  --------------------------------------------------------- */

  async function loadServiceLocation() {

    const token =
      localStorage.getItem('access_token');

    if (!token) return;

    try {

      // Identify logged-in user.
      const userResponse = await fetch(
        `${API_BASE}/users/me/`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!userResponse.ok) {
        throw new Error('Unable to load your account.');
      }

      const user = await userResponse.json();

      currentUserRole =
        (user.role || '').toLowerCase();


      // CUSTOMER LOCATION
      if (currentUserRole !== 'provider') {

        fillLocationFields(user);

        if (locationDescription) {
          locationDescription.textContent =
            'Choose where you want to find service providers.';
        }

        // Customer coordinates are not saved by the
        // current customer location API.
        const mapWrapper =
          mapElement ? mapElement.closest('.col-12') : null;

        if (mapWrapper) {
          mapWrapper.style.display = 'none';
        }

        return;
      }


      // PROVIDER LOCATION
      const providerResponse = await fetch(
        `${API_BASE}/providers/dashboard/`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!providerResponse.ok) {
        throw new Error('Unable to load provider profile.');
      }

      const dashboardData =
        await providerResponse.json();

      const provider =
        dashboardData.provider;

      if (!provider) {
        throw new Error('Provider profile was not returned.');
      }

      fillLocationFields(provider);

      if (locationDescription) {
        locationDescription.textContent =
          'Choose the primary location where you provide services. Pin your exact location on the map.';
      }

      // Load map with previously saved coordinates.
      initializeLocationMap(
        provider.latitude,
        provider.longitude
      );

    } catch (error) {

      console.error(
        'Load service location error:',
        error
      );

      showLocationMessage(error.message, false);
    }
  }


  /* ---------------------------------------------------------
     SAVE CUSTOMER / PROVIDER LOCATION
  --------------------------------------------------------- */

  if (locationForm) {

    locationForm.addEventListener('submit', async function (event) {

      event.preventDefault();

      const token =
        localStorage.getItem('access_token');

      if (!token) {
        showLocationMessage('Please log in first.', false);
        return;
      }

      const locationData = {
        country: countryInput.value.trim(),
        province: provinceInput.value.trim(),
        district: districtInput.value.trim(),
        city: cityInput.value.trim()
      };


      // Basic address validation.
      if (
        !locationData.country ||
        !locationData.province ||
        !locationData.district
      ) {
        showLocationMessage(
          'Please complete Country, Province and District.',
          false
        );
        return;
      }


      // Provider must select an exact map location.
      if (currentUserRole === 'provider') {

        const latitude =
          latitudeInput ? latitudeInput.value : '';

        const longitude =
          longitudeInput ? longitudeInput.value : '';

        if (latitude === '' || longitude === '') {
          showLocationMessage(
            'Please select your exact location on the map.',
            false
          );
          return;
        }

        locationData.latitude = Number(latitude);
        locationData.longitude = Number(longitude);
      }


      if (locationButton) {
        locationButton.disabled = true;
        locationButton.innerHTML =
          '<i class="fa-solid fa-spinner fa-spin me-2"></i>Saving...';
      }


      try {

        const endpoint =
          currentUserRole === 'provider'
            ? `${API_BASE}/providers/location/`
            : `${API_BASE}/users/me/`;

        const response = await fetch(endpoint, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(locationData)
        });

        const data =
          await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.detail ||
            data.error ||
            'Unable to save location.'
          );
        }


        // Update local user data only for customers.
        if (currentUserRole !== 'provider') {

          const savedUser = JSON.parse(
            localStorage.getItem('user') || '{}'
          );

          localStorage.setItem(
            'user',
            JSON.stringify({
              ...savedUser,
              ...locationData
            })
          );
        }


        // Display coordinates returned by the backend.
        if (currentUserRole === 'provider') {

          if (
            data.latitude !== null &&
            data.latitude !== undefined &&
            data.longitude !== null &&
            data.longitude !== undefined
          ) {
            updateSelectedCoordinates(
              data.latitude,
              data.longitude
            );
          }
        }


        showLocationMessage(
          'Service location saved successfully!'
        );

      } catch (error) {

        console.error(
          'Save service location error:',
          error
        );

        showLocationMessage(error.message, false);

      } finally {

        if (locationButton) {
          locationButton.disabled = false;
          locationButton.innerHTML =
            '<i class="fa-solid fa-location-crosshairs me-2"></i>Save My Location';
        }
      }
    });

    loadServiceLocation();
  }

  /* ---------------------------------------------------------
     6. Profile picture preview
  --------------------------------------------------------- */

  if (avatarInput && avatarPreview) {

    avatarInput.addEventListener(
      'change',
      () => {

        const file =
          avatarInput.files[0];

        if (!file) {
          return;
        }


        const reader =
          new FileReader();


        reader.onload =
          (e) => {

            avatarPreview.src =
              e.target.result;

          };


        reader.readAsDataURL(file);

      }
    );

  }



  /* ---------------------------------------------------------
     7. Save profile
  --------------------------------------------------------- */

  if (profileForm && saveProfileBtn) {

    profileForm.addEventListener(
      'submit',
      async (e) => {

        e.preventDefault();


        const accessToken =
          localStorage.getItem('access_token');


        if (!accessToken) {

          showToast(
            'You are not logged in.'
          );

          return;
        }


        /* ---------------------------------------------------
           Get values
        --------------------------------------------------- */

        const firstName =
          firstNameInput
            ? firstNameInput.value.trim()
            : '';

        const lastName =
          lastNameInput
            ? lastNameInput.value.trim()
            : '';

        const email =
          emailInput
            ? emailInput.value.trim()
            : '';


        const file =
          avatarInput &&
          avatarInput.files.length
            ? avatarInput.files[0]
            : null;


        /* ---------------------------------------------------
           Basic validation
        --------------------------------------------------- */

        if (!firstName) {

          showToast(
            'First name is required.'
          );

          return;
        }


        if (!lastName) {

          showToast(
            'Last name is required.'
          );

          return;
        }


        if (!email) {

          showToast(
            'Email is required.'
          );

          return;
        }


        /* ---------------------------------------------------
           Disable button
        --------------------------------------------------- */

        saveProfileBtn.disabled = true;


        const label =
          saveProfileBtn.querySelector(
            '.btn-label'
          );


        const spinner =
          saveProfileBtn.querySelector(
            '.btn-spinner'
          );


        if (label) {
          label.classList.add('d-none');
        }


        if (spinner) {
          spinner.classList.remove('d-none');
        }


        try {

          /* -------------------------------------------------
             Create FormData
          ------------------------------------------------- */

          const formData =
            new FormData();


          formData.append(
            'first_name',
            firstName
          );


          formData.append(
            'last_name',
            lastName
          );


          formData.append(
            'email',
            email
          );
const phoneInput = document.getElementById('phone');

const phone = phoneInput
    ? phoneInput.value.trim()
    : '';

formData.append('phone', phone);

          if (file) {

            formData.append(
              'profile_picture',
              file
            );

          }


          /* -------------------------------------------------
             Send PATCH request
          ------------------------------------------------- */

          const response =
            await fetch(
              `${API_BASE}/users/me/`,
              {
                method: 'PATCH',

                headers: {
                  'Authorization':
                    `Bearer ${accessToken}`
                },

                body: formData
              }
            );


          const data =
            await response.json()
              .catch(() => ({}));


          console.log(
            'PROFILE UPDATE:',
            response.status,
            data
          );


          /* -------------------------------------------------
             Handle error
          ------------------------------------------------- */

          if (!response.ok) {

            let errorMessage =
              'Unable to update profile.';


            if (data.error) {

              if (Array.isArray(data.error)) {

                errorMessage =
                  data.error.join(' ');

              } else {

                errorMessage =
                  data.error;

              }

            } else if (data.detail) {

              errorMessage =
                data.detail;

            } else if (
              data.first_name &&
              Array.isArray(data.first_name)
            ) {

              errorMessage =
                data.first_name[0];

            } else if (
              data.last_name &&
              Array.isArray(data.last_name)
            ) {

              errorMessage =
                data.last_name[0];

            } else if (
              data.email &&
              Array.isArray(data.email)
            ) {

              errorMessage =
                data.email[0];

            }


            showToast(errorMessage);

            return;
          }


          /* -------------------------------------------------
             Save updated user locally
          ------------------------------------------------- */

          localStorage.setItem(
            'user',
            JSON.stringify(data)
          );


          /* -------------------------------------------------
             Update fields with database values
          ------------------------------------------------- */

          if (firstNameInput) {

            firstNameInput.value =
              data.first_name || '';

          }


          if (lastNameInput) {

            lastNameInput.value =
              data.last_name || '';

          }


          if (emailInput) {

            emailInput.value =
              data.email || '';

          }


          /* -------------------------------------------------
             Update profile picture
          ------------------------------------------------- */

          if (
            avatarPreview &&
            data.profile_picture
          ) {

            const imageUrl =
              data.profile_picture.startsWith('http')
                ? data.profile_picture
                : `${BACKEND_BASE}${data.profile_picture}`;

            avatarPreview.src =
              imageUrl;
          }


          showToast(
            'Profile updated successfully.'
          );


        } catch (error) {

          console.error(
            'Profile update error:',
            error
          );


          showToast(
            'Unable to connect to the server.'
          );


        } finally {

          saveProfileBtn.disabled = false;


          if (label) {
            label.classList.remove('d-none');
          }


          if (spinner) {
            spinner.classList.add('d-none');
          }

        }

      }
    );

  }



  /* ---------------------------------------------------------
     8. Reset profile
  --------------------------------------------------------- */

  if (
    resetProfileBtn &&
    profileForm
  ) {

    resetProfileBtn.addEventListener(
      'click',
      async () => {

        avatarInput.value = '';

        await loadCurrentUser();

        showToast(
          'Form reset to last saved values.'
        );

      }
    );

  }



  /* =========================================================
     9. SECURITY — CHANGE PASSWORD
     ========================================================= */

  const securityForm =
    document.getElementById(
      'securityForm'
    );


  if (securityForm) {

    securityForm.addEventListener(
      'submit',
      async (e) => {

        e.preventDefault();


        /* ---------------------------------------------------
           Get access token
        --------------------------------------------------- */

        const accessToken =
          localStorage.getItem(
            'access_token'
          );


        if (!accessToken) {

          showToast(
            'You are not logged in. Please login again.'
          );

          return;
        }


        /* ---------------------------------------------------
           Get password fields
        --------------------------------------------------- */

        const currentPasswordInput =
          document.getElementById(
            'currentPassword'
          );


        const newPasswordInput =
          document.getElementById(
            'newPassword'
          );


        const confirmPasswordInput =
          document.getElementById(
            'confirmPassword'
          );


        const currentPassword =
          currentPasswordInput
            ? currentPasswordInput.value
            : '';


        const newPassword =
          newPasswordInput
            ? newPasswordInput.value
            : '';


        const confirmPassword =
          confirmPasswordInput
            ? confirmPasswordInput.value
            : '';


        /* ---------------------------------------------------
           Validate fields
        --------------------------------------------------- */

        if (
          !currentPassword ||
          !newPassword ||
          !confirmPassword
        ) {

          showToast(
            'Please fill in all password fields.'
          );

          return;
        }


        /* ---------------------------------------------------
           Check password confirmation
        --------------------------------------------------- */

        if (
          newPassword !==
          confirmPassword
        ) {

          showToast(
            'New password and confirmation do not match.'
          );

          return;
        }


        /* ---------------------------------------------------
           Prevent same password
        --------------------------------------------------- */

        if (
          currentPassword ===
          newPassword
        ) {

          showToast(
            'New password must be different from your current password.'
          );

          return;
        }


        /* ---------------------------------------------------
           Find submit button
        --------------------------------------------------- */

        const passwordButton =
          securityForm.querySelector(
            'button[type="submit"]'
          );


        let originalButtonHTML = '';


        if (passwordButton) {

          originalButtonHTML =
            passwordButton.innerHTML;

          passwordButton.disabled = true;

          passwordButton.innerHTML =
            '<i class="fa-solid fa-circle-notch fa-spin me-2"></i>Changing...';

        }


        try {

          /* -------------------------------------------------
             Send password to Django
          ------------------------------------------------- */

          const response =
            await fetch(
              `${API_BASE}/users/change-password/`,
              {
                method: 'POST',

                headers: {
                  'Authorization':
                    `Bearer ${accessToken}`,

                  'Content-Type':
                    'application/json'
                },

                body: JSON.stringify(
                  {
                    current_password:
                      currentPassword,

                    new_password:
                      newPassword,

                    confirm_password:
                      confirmPassword
                  }
                )
              }
            );


          /* -------------------------------------------------
             Read response
          ------------------------------------------------- */

          const data =
            await response.json()
              .catch(() => ({}));


          console.log(
            'PASSWORD CHANGE:',
            response.status,
            data
          );


          /* -------------------------------------------------
             Handle error
          ------------------------------------------------- */

          if (!response.ok) {

            let errorMessage =
              'Password change failed.';


            if (data.error) {

              if (
                Array.isArray(data.error)
              ) {

                errorMessage =
                  data.error.join(' ');

              } else {

                errorMessage =
                  data.error;

              }

            } else if (data.detail) {

              errorMessage =
                data.detail;

            }


            showToast(
              errorMessage
            );

            return;
          }


          /* -------------------------------------------------
             SUCCESS
          ------------------------------------------------- */

          securityForm.reset();


          showToast(
            data.message ||
            'Password changed successfully!'
          );


        } catch (error) {

          console.error(
            'Password change error:',
            error
          );


          showToast(
            'Unable to connect to the server.'
          );


        } finally {

          if (passwordButton) {

            passwordButton.disabled =
              false;

            passwordButton.innerHTML =
              originalButtonHTML;

          }

        }

      }
    );

  }



  /* ---------------------------------------------------------
     10. Password show / hide toggle
  --------------------------------------------------------- */

  document
    .querySelectorAll('.oc-eye-toggle')
    .forEach(btn => {

      btn.addEventListener(
        'click',
        () => {

          const targetId =
            btn.getAttribute(
              'data-target'
            );


          const input =
            document.getElementById(
              targetId
            );


          const icon =
            btn.querySelector('i');


          if (!input || !icon) {
            return;
          }


          const isPassword =
            input.type === 'password';


          input.type =
            isPassword
              ? 'text'
              : 'password';


          icon.classList.toggle(
            'fa-eye',
            !isPassword
          );


          icon.classList.toggle(
            'fa-eye-slash',
            isPassword
          );

        }
      );

    });



    /* ---------------------------------------------------------
     11. Notifications checkboxes
  --------------------------------------------------------- */

  const notificationIds = {
    notifyEmail: 'email',
    notifySMS: 'sms',
    notifyBookings: 'bookings',
    notifyPromotions: 'promotions',
    notifyMessages: 'messages',
    notifyAnnouncements: 'announcements'
  };

  async function saveNotificationPreferences() {

    const accessToken =
      localStorage.getItem('access_token');

    if (!accessToken) {
      showToast('Please log in first.');
      return false;
    }

    const preferences = {};

    Object.entries(notificationIds).forEach(
      ([id, key]) => {
        const checkbox = document.getElementById(id);

        if (checkbox) {
          preferences[key] = checkbox.checked;
        }
      }
    );

    try {

      const response = await fetch(
        `${API_BASE}/users/me/`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            notification_preferences: preferences
          })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || data.detail || 'Unable to save notifications.'
        );
      }

      localStorage.setItem('user', JSON.stringify(data));

      showToast(t('notifications_saved', 'Notification preferences saved.'));

      return true;

    } catch (error) {

      console.error('Notification save error:', error);
      showToast(error.message);

      return false;
    }
  }

  function loadNotificationPreferences(preferences = {}) {

    Object.entries(notificationIds).forEach(
      ([id, key]) => {

        const checkbox = document.getElementById(id);

        if (checkbox) {
          checkbox.checked =
            preferences[key] !== undefined
              ? preferences[key]
              : checkbox.defaultChecked;
        }
      }
    );
  }

  document
    .querySelectorAll('#notifications input[type="checkbox"]')
    .forEach(cb => {

      cb.addEventListener('change', async () => {

        cb.disabled = true;

        const saved = await saveNotificationPreferences();

        if (!saved) {
          cb.checked = !cb.checked;
        }

        cb.disabled = false;
      });

    });

   /* ---------------------------------------------------------
     12. Privacy toggle switches
  --------------------------------------------------------- */

  const privacyIds = {
    privacyPhone: 'show_phone',
    privacyPublic: 'show_profile',
    privacyContact: 'allow_contact',
    privacyLocation: 'location_sharing'
  };

  async function savePrivacyPreferences() {

    const accessToken =
      localStorage.getItem('access_token');

    if (!accessToken) {
      showToast('Please log in first.');
      return false;
    }

    const preferences = {};

    Object.entries(privacyIds).forEach(([id, key]) => {
      const checkbox = document.getElementById(id);

      if (checkbox) {
        preferences[key] = checkbox.checked;
      }
    });

    try {
      const response = await fetch(
        `${API_BASE}/users/me/`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            privacy_preferences: preferences
          })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || data.detail || 'Unable to save privacy settings.'
        );
      }

      localStorage.setItem('user', JSON.stringify(data));
      showToast(t('privacy_saved', 'Privacy settings saved.'));
      return true;

    } catch (error) {
      console.error('Privacy save error:', error);
      showToast(error.message);
      return false;
    }
  }

  function loadPrivacyPreferences(preferences = {}) {

    Object.entries(privacyIds).forEach(([id, key]) => {
      const checkbox = document.getElementById(id);

      if (checkbox) {
        checkbox.checked =
          preferences[key] !== undefined
            ? preferences[key]
            : checkbox.defaultChecked;
      }
    });
  }

  document
    .querySelectorAll('#privacy .oc-switch input')
    .forEach(sw => {

      sw.addEventListener('change', async () => {

        sw.disabled = true;

        const saved = await savePrivacyPreferences();

        if (!saved) {
          sw.checked = !sw.checked;
        }

        sw.disabled = false;
      });

    });

  
  /* ---------------------------------------------------------
     13. Appearance — save and load preferences
  --------------------------------------------------------- */

  const themeOptions =
    document.querySelectorAll('.oc-theme-option');

  const accentOptions =
    document.querySelectorAll('.oc-accent-swatch');

  const fontSizeOptions =
    document.querySelectorAll('.oc-fs-option');


  function applyTheme(theme) {

    if (window.OneClickTheme) {
      window.OneClickTheme.set(theme);
    } else {
      localStorage.setItem('oneclick_theme', theme);

      const prefersDark =
        window.matchMedia('(prefers-color-scheme: dark)').matches;

      document.documentElement.setAttribute(
        'data-theme',
        theme === 'system'
          ? (prefersDark ? 'dark' : 'light')
          : theme
      );
    }

    themeOptions.forEach(opt => {
      opt.classList.toggle(
        'active',
        opt.dataset.theme === theme
      );
    });
  }


  function applyAccent(accent) {

    document.documentElement.style.setProperty(
      '--oc-primary',
      accent
    );

    document.documentElement.style.setProperty(
      '--oc-accent-active',
      accent
    );

    const preview =
      document.getElementById('accentPreview');

    if (preview) {
      preview.style.background = accent;
    }

    accentOptions.forEach(opt => {
      opt.classList.toggle(
        'active',
        opt.dataset.accent === accent
      );
    });
  }


  function applyFontSize(size) {

    const scales = {
      small: '0.9',
      medium: '1',
      large: '1.1'
    };

    document.documentElement.style.setProperty(
      '--oc-font-scale',
      scales[size] || '1'
    );

    fontSizeOptions.forEach(opt => {
      opt.classList.toggle(
        'active',
        opt.dataset.size === size
      );
    });
  }


  async function saveAppearancePreferences(preferences) {

    const accessToken =
      localStorage.getItem('access_token');

    if (!accessToken) {
      showToast('Please log in first.');
      return false;
    }

    try {

      const response = await fetch(
        `${API_BASE}/users/me/`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            appearance_preferences: preferences
          })
        }
      );

      const data =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || data.detail || 'Unable to save appearance settings.'
        );
      }

      localStorage.setItem('user', JSON.stringify(data));
      showToast(t('appearance_saved', 'Appearance settings saved.'));
      return true;

    } catch (error) {
      console.error('Appearance save error:', error);
      showToast(error.message);
      return false;
    }
  }


  function loadAppearancePreferences(preferences = {}) {

    const theme =
      preferences.theme ||
      (window.OneClickTheme
        ? window.OneClickTheme.get()
        : localStorage.getItem('oneclick_theme') || 'light');

    applyTheme(theme);
    applyAccent(preferences.accent || '#2563EB');
    applyFontSize(preferences.font_size || 'medium');
  }


  themeOptions.forEach(opt => {

    opt.addEventListener('click', async () => {

      const theme = opt.dataset.theme;

      applyTheme(theme);

      await saveAppearancePreferences({
        theme,
        accent:
          document.documentElement.style.getPropertyValue('--oc-primary').trim()
          || '#2563EB',
        font_size:
          document.documentElement.style.getPropertyValue('--oc-font-scale').trim() === '0.9'
            ? 'small'
            : document.documentElement.style.getPropertyValue('--oc-font-scale').trim() === '1.1'
              ? 'large'
              : 'medium'
      });

    });

  });


  accentOptions.forEach(opt => {

    opt.addEventListener('click', async () => {

      const accent = opt.dataset.accent;

      applyAccent(accent);

      await saveAppearancePreferences({
        theme: window.OneClickTheme
          ? window.OneClickTheme.get()
          : localStorage.getItem('oneclick_theme') || 'light',
        accent,
        font_size:
          document.documentElement.style.getPropertyValue('--oc-font-scale').trim() === '0.9'
            ? 'small'
            : document.documentElement.style.getPropertyValue('--oc-font-scale').trim() === '1.1'
              ? 'large'
              : 'medium'
      });

    });

  });


  fontSizeOptions.forEach(opt => {

    opt.addEventListener('click', async () => {

      const size = opt.dataset.size;

      applyFontSize(size);

      await saveAppearancePreferences({
        theme: window.OneClickTheme
          ? window.OneClickTheme.get()
          : localStorage.getItem('oneclick_theme') || 'light',
        accent:
          document.documentElement.style.getPropertyValue('--oc-primary').trim()
          || '#2563EB',
        font_size: size
      });

    });

  });

  /* ---------------------------------------------------------
   14. Language dropdown
--------------------------------------------------------- */

const languageSelect =
  document.getElementById('languageSelect');

if (languageSelect && window.OneClickLanguage) {

  languageSelect.value = window.OneClickLanguage.get();

  window.OneClickLanguage.apply();

  languageSelect.addEventListener('change', () => {

    window.OneClickLanguage.set(languageSelect.value);

    showToast(t('language_saved', 'Language preference saved.'));

  });

}

  /* ---------------------------------------------------------
   15. Payment methods
--------------------------------------------------------- */

const paymentCards =
  document.querySelectorAll(
    '.oc-payment-card[data-payment-method]'
  );


function loadPaymentPreference(method = 'cash') {

  paymentCards.forEach(card => {

    const selected =
      card.dataset.paymentMethod === method;

    card.style.borderColor = selected
      ? 'var(--oc-primary)'
      : '';

    const badge = card.querySelector('.badge');

    if (badge) {
  const language = window.OneClickLanguage
    ? window.OneClickLanguage.get()
    : 'en';

  const labels = {
    en: { selected: 'Selected', select: 'Select' },
    ne: { selected: 'छानिएको', select: 'छान्नुहोस्' },
    hi: { selected: 'चयनित', select: 'चुनें' }
  };

  badge.textContent = selected
    ? labels[language].selected
    : labels[language].select;
}

  });

}


async function savePaymentPreference(method) {

  const accessToken =
    localStorage.getItem('access_token');

  if (!accessToken) {
    showToast('Please log in first.');
    return;
  }

  try {

    const response = await fetch(
      `${API_BASE}/users/me/`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          preferred_payment_method: method
        })
      }
    );

    const data =
      await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.detail ||
        'Unable to save payment method.'
      );
    }

    localStorage.setItem(
      'user',
      JSON.stringify(data)
    );

    loadPaymentPreference(method);

    showToast(t('payment_saved', 'Payment preference saved.'));

  } catch (error) {

    console.error('Payment preference error:', error);
    showToast(error.message);

  }

}


paymentCards.forEach(card => {

  card.addEventListener('click', () => {

    savePaymentPreference(
      card.dataset.paymentMethod
    );

  });

});


  /* =========================================================
     16. DANGER ZONE — DEACTIVATE ACCOUNT
     ========================================================= */

  const deactivateBtn =
    document.getElementById(
      'deactivateBtn'
    );


  if (deactivateBtn) {

    deactivateBtn.addEventListener(
      'click',
      async () => {

        const confirmed =
          confirm(
            'Are you sure you want to deactivate your account?'
          );


        if (!confirmed) {
          return;
        }


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


        const originalText =
          deactivateBtn.textContent;


        deactivateBtn.disabled =
          true;


        deactivateBtn.textContent =
          'Deactivating...';


        try {

          const response =
            await fetch(
              `${API_BASE}/users/deactivate/`,
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


          if (!response.ok) {

            showToast(
              data.error ||
              data.detail ||
              'Unable to deactivate your account.'
            );


            deactivateBtn.disabled =
              false;


            deactivateBtn.textContent =
              originalText;


            return;
          }


          showToast(
            data.message ||
            'Your account has been deactivated.'
          );


          localStorage.removeItem(
            'access_token'
          );

          localStorage.removeItem(
            'refresh_token'
          );

          localStorage.removeItem(
            'user'
          );


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


          deactivateBtn.disabled =
            false;


          deactivateBtn.textContent =
            originalText;

        }

      }
    );

  }



  /* =========================================================
     17. DANGER ZONE — DELETE ACCOUNT
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



  /* ---------------------------------------------------------
     Permanently delete account
  --------------------------------------------------------- */

  if (confirmDeleteBtn) {

    confirmDeleteBtn.addEventListener(
      'click',
      async () => {

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


        confirmDeleteBtn.disabled =
          true;


        confirmDeleteBtn.innerHTML =
          '<i class="fa-solid fa-circle-notch fa-spin me-2"></i>Deleting...';


        try {

          const response =
            await fetch(
              `${API_BASE}/users/delete/`,
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


          localStorage.removeItem(
            'access_token'
          );

          localStorage.removeItem(
            'refresh_token'
          );

          localStorage.removeItem(
            'user'
          );


          showToast(
            data.message ||
            'Your account has been permanently deleted.'
          );


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
     Reset delete modal
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
