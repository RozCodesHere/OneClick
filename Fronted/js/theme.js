(function () {
    const STORAGE_KEY = "oneclick_theme";

    function getTheme() {
        return localStorage.getItem(STORAGE_KEY) || "light";
    }

    function applyTheme() {
        const setting = getTheme();

        let theme = setting;

        if (setting === "system") {
            theme = window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
        }

        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.setAttribute("data-theme-setting", setting);
    }

    applyTheme();

    window.OneClickTheme = {
        get: getTheme,

        set: function (theme) {
            localStorage.setItem(STORAGE_KEY, theme);
            applyTheme();
        },

        apply: applyTheme
    };

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    media.addEventListener?.("change", function () {
        if (getTheme() === "system") {
            applyTheme();
        }
    });
    /* =========================================
   OneClick Global Language System
========================================= */

const LANGUAGE_KEY = "oneclick_language";


const translations = {

  en: {
    dashboard: "Dashboard",
    bookings: "Bookings",
    messages: "Messages",
    notifications: "Notifications",
    settings: "Settings",
    profile: "Profile",
    logout: "Logout",
    not_selected: "Not selected",

    settings_subtitle: "Manage your account preferences and security.",
    settings_categories: "Settings Categories",

    service_location: "Service Location",
    my_service_location: "My Service Location",
    location_description: "Choose where you want to find service providers.",
    country: "Country",
    province: "Province / State",
    district: "District",
    country_placeholder: "Enter country",
province_placeholder: "Enter province",
district_placeholder: "Enter district",
city_placeholder: "Enter city or municipality",
current_password_placeholder: "Enter current password",
new_password_placeholder: "Enter new password",
confirm_password_placeholder: "Confirm new password",
    city_municipality: "City / Municipality",
    pin_location: "Pin Your Exact Service Location",
    map_instruction: "Click anywhere on the map or drag the marker to select your exact service location.",
    selected_coordinates: "Selected Coordinates",
    latitude: "Latitude:",
    longitude: "Longitude:",
    save_location: "Save My Location",

    security: "Security",
    security_description: "Keep your account safe with a strong password.",
    current_password: "Current Password",
    new_password: "New Password",
    confirm_password: "Confirm Password",
    update_password: "Update Password",

    notifications: "Notifications",
    notifications_description: "Choose what you want to hear about.",
    email_notifications: "Email Notifications",
    sms_notifications: "SMS Notifications",
    booking_updates: "Booking Updates",
    promotional_offers: "Promotional Offers",
    provider_messages: "Provider Messages",
    system_announcements: "System Announcements",
cancel: "Cancel",
delete_permanently: "Delete Permanently",
email_description: "Get updates in your inbox",
sms_description: "Text alerts on your phone",
booking_description: "Status changes on your bookings",
promotion_description: "Discounts and campaigns",
messages_description: "Direct messages from providers",
announcements_description: "Platform-wide notices",
delete_confirm_title: "Delete your account?",
    privacy: "Privacy",
    privacy_description: "Control what others can see and do.",
    show_phone: "Show phone number",
    show_phone_description: "Visible to providers you've booked",
    show_profile: "Show profile publicly",
    show_profile_description: "Anyone on OneClick can view your profile",
    allow_contact: "Allow provider contact",
    allow_contact_description: "Providers can message you directly",
    location_sharing: "Location sharing",
    location_sharing_description: "Share live location during active bookings",

    appearance: "Appearance",
    appearance_description: "Personalize how OneClick looks on your device.",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    system_default: "System Default",
    accent_color: "Accent Color",
    preview: "Preview",
    font_size: "Font Size",
    small: "Small",
    medium: "Medium",
    large: "Large",

    language: "Language",
    language_description: "Choose the language you'd like to use.",
    english: "English",
    nepali: "Nepali",
    hindi: "Hindi",

    payment_methods: "Payment Methods",
    payment_description: "Manage how you pay for services.",
    khalti: "Khalti",
    khalti_description: "Pay digitally using Khalti",
    cash_service: "Cash on Service",
    cash_description: "Pay after service completion",
    default: "Default",
    available: "Available",

    danger_zone: "Danger Zone",
    danger_description: "These actions are irreversible or account-limiting. Proceed carefully.",
    deactivate_account: "Deactivate Account",
    deactivate_description: "Temporarily hide your account. You can reactivate anytime by logging back in.",
    delete_account: "Delete Account",
    delete_description: "Permanently delete your account and all associated data. This cannot be undone."
    
  },

  ne: {
    dashboard: "ड्यासबोर्ड",
    bookings: "बुकिङहरू",
    messages: "सन्देशहरू",
    notifications: "सूचनाहरू",
    settings: "सेटिङहरू",
    profile: "प्रोफाइल",
    logout: "लगआउट",
    not_selected: "छानिएको छैन",

    settings_subtitle: "आफ्नो खाता प्राथमिकता र सुरक्षा व्यवस्थापन गर्नुहोस्।",
    settings_categories: "सेटिङका विभागहरू",

    service_location: "सेवा स्थान",
    my_service_location: "मेरो सेवा स्थान",
    location_description: "सेवा प्रदायकहरू खोज्न चाहेको स्थान छान्नुहोस्।",
    country: "देश",
    province: "प्रदेश",
    district: "जिल्ला",
    country_placeholder: "देश लेख्नुहोस्",
province_placeholder: "प्रदेश लेख्नुहोस्",
district_placeholder: "जिल्ला लेख्नुहोस्",
city_placeholder: "शहर वा नगरपालिका लेख्नुहोस्",
current_password_placeholder: "हालको पासवर्ड लेख्नुहोस्",
new_password_placeholder: "नयाँ पासवर्ड लेख्नुहोस्",
confirm_password_placeholder: "नयाँ पासवर्ड पुष्टि गर्नुहोस्",
    city_municipality: "नगरपालिका / शहर",
    pin_location: "आफ्नो सही सेवा स्थान नक्सामा राख्नुहोस्",
    map_instruction: "आफ्नो सही सेवा स्थान छान्न नक्सामा क्लिक गर्नुहोस् वा मार्कर तान्नुहोस्।",
    selected_coordinates: "छानिएका निर्देशाङ्कहरू",
    latitude: "अक्षांश:",
    longitude: "देशान्तर:",
    save_location: "मेरो स्थान सुरक्षित गर्नुहोस्",
delete_confirm_description: "यसले तपाईंको OneClick खाता, बुकिङ र डाटा स्थायी रूपमा मेटाउनेछ। यो कार्य फिर्ता गर्न सकिँदैन।",
   delete_confirm_placeholder: 'पुष्टि गर्न "DELETE" टाइप गर्नुहोस्',
    security: "सुरक्षा",
    security_description: "बलियो पासवर्ड प्रयोग गरेर आफ्नो खाता सुरक्षित राख्नुहोस्।",
    current_password: "हालको पासवर्ड",
    new_password: "नयाँ पासवर्ड",
    confirm_password: "पासवर्ड पुष्टि गर्नुहोस्",
    update_password: "पासवर्ड अपडेट गर्नुहोस्",
cancel: "रद्द गर्नुहोस्",
delete_permanently: "स्थायी रूपमा मेटाउनुहोस्",
    notifications: "सूचनाहरू",
    notifications_description: "कस्ता सूचनाहरू प्राप्त गर्न चाहनुहुन्छ छान्नुहोस्।",
    email_notifications: "इमेल सूचनाहरू",
    sms_notifications: "एसएमएस सूचनाहरू",
    booking_updates: "बुकिङ अपडेटहरू",
    promotional_offers: "प्रचारात्मक अफरहरू",
    provider_messages: "सेवा प्रदायकका सन्देशहरू",
    system_announcements: "प्रणालीका घोषणाहरू",

email_description: "तपाईंको इमेलमा अपडेटहरू प्राप्त गर्नुहोस्",
sms_description: "तपाईंको फोनमा एसएमएस सूचना प्राप्त गर्नुहोस्",
booking_description: "तपाईंको बुकिङको अवस्थाबारे अपडेटहरू",
promotion_description: "छुट र विशेष अफरहरू",
messages_description: "सेवा प्रदायकहरूबाट सिधा सन्देशहरू",
announcements_description: "प्लेटफर्मका सबैका लागि घोषणाहरू",
delete_confirm_title: "के तपाईं आफ्नो खाता मेटाउन चाहनुहुन्छ?",
    privacy: "गोपनीयता",
    privacy_description: "अरूले के हेर्न र गर्न सक्छन् भन्ने नियन्त्रण गर्नुहोस्।",
    show_phone: "फोन नम्बर देखाउनुहोस्",
    show_phone_description: "तपाईंले बुक गरेका प्रदायकहरूले देख्न सक्छन्",
    show_profile: "प्रोफाइल सार्वजनिक देखाउनुहोस्",
    show_profile_description: "OneClick का सबैले तपाईंको प्रोफाइल हेर्न सक्छन्",
    allow_contact: "प्रदायकलाई सम्पर्क गर्न दिनुहोस्",
    allow_contact_description: "प्रदायकहरूले तपाईंलाई सिधै सन्देश पठाउन सक्छन्",
    location_sharing: "स्थान साझा गर्नुहोस्",
    location_sharing_description: "सक्रिय बुकिङको समयमा लाइभ स्थान साझा गर्नुहोस्",

    appearance: "रूपरङ",
    appearance_description: "आफ्नो उपकरणमा OneClick को रूप आफूअनुसार बनाउनुहोस्।",
    theme: "थिम",
    light: "उज्यालो",
    dark: "गाढा",
    system_default: "प्रणाली अनुसार",
    accent_color: "मुख्य रङ",
    preview: "पूर्वावलोकन",
    font_size: "अक्षरको आकार",
    small: "सानो",
    medium: "मध्यम",
    large: "ठूलो",

    language: "भाषा",
    language_description: "तपाईं प्रयोग गर्न चाहनुभएको भाषा छान्नुहोस्।",
    english: "अङ्ग्रेजी",
    nepali: "नेपाली",
    hindi: "हिन्दी",

    payment_methods: "भुक्तानी विधिहरू",
    payment_description: "सेवाको भुक्तानी कसरी गर्ने भन्ने व्यवस्थापन गर्नुहोस्।",
    khalti: "खल्ती",
    khalti_description: "खल्ती प्रयोग गरेर डिजिटल भुक्तानी गर्नुहोस्",
    cash_service: "सेवा पछि नगद भुक्तानी",
    cash_description: "सेवा पूरा भएपछि भुक्तानी गर्नुहोस्",
    default: "पूर्वनिर्धारित",
    available: "उपलब्ध",

    danger_zone: "जोखिम क्षेत्र",
    danger_description: "यी कार्यहरू उल्टाउन नसकिने वा खातालाई सीमित गर्ने हुन सक्छन्। सावधानीपूर्वक अघि बढ्नुहोस्।",
    deactivate_account: "खाता निष्क्रिय गर्नुहोस्",
    deactivate_description: "आफ्नो खाता अस्थायी रूपमा लुकाउनुहोस्। फेरि लगइन गरेर सक्रिय गर्न सक्नुहुन्छ।",
    delete_account: "खाता मेटाउनुहोस्",
    delete_description: "आफ्नो खाता र यससँग सम्बन्धित सबै डाटा स्थायी रूपमा मेटाउनुहोस्। यो कार्य उल्टाउन सकिँदैन।"
  },

  hi: {
    dashboard: "डैशबोर्ड",
    bookings: "बुकिंग",
    messages: "संदेश",
    notifications: "सूचनाएं",
    settings: "सेटिंग्स",
    profile: "प्रोफ़ाइल",
    logout: "लॉग आउट",
    not_selected: "चयन नहीं किया गया",

    settings_subtitle: "अपनी खाता प्राथमिकताओं और सुरक्षा को प्रबंधित करें।",
    settings_categories: "सेटिंग्स श्रेणियाँ",
delete_confirm_description: "इससे आपका OneClick खाता, बुकिंग और डेटा स्थायी रूप से हट जाएगा। यह कार्रवाई वापस नहीं की जा सकती।",
   delete_confirm_placeholder: 'पुष्टि करने के लिए "DELETE" टाइप करें',
    service_location: "सेवा स्थान",
    my_service_location: "मेरा सेवा स्थान",
    location_description: "सेवा प्रदाताओं को खोजने के लिए अपना स्थान चुनें।",
    country: "देश",
    province: "प्रदेश / राज्य",
    district: "ज़िला",
    country_placeholder: "देश दर्ज करें",
province_placeholder: "प्रदेश दर्ज करें",
district_placeholder: "ज़िला दर्ज करें",
city_placeholder: "शहर या नगरपालिका दर्ज करें",
current_password_placeholder: "वर्तमान पासवर्ड दर्ज करें",
new_password_placeholder: "नया पासवर्ड दर्ज करें",
confirm_password_placeholder: "नए पासवर्ड की पुष्टि करें",
    city_municipality: "शहर / नगरपालिका",
    pin_location: "अपना सही सेवा स्थान मानचित्र पर चुनें",
    map_instruction: "अपना सही सेवा स्थान चुनने के लिए मानचित्र पर क्लिक करें या मार्कर खींचें।",
    selected_coordinates: "चुने गए निर्देशांक",
    latitude: "अक्षांश:",
    longitude: "देशांतर:",
    save_location: "मेरा स्थान सुरक्षित करें",

    security: "सुरक्षा",
    security_description: "मजबूत पासवर्ड से अपना खाता सुरक्षित रखें।",
    current_password: "वर्तमान पासवर्ड",
    new_password: "नया पासवर्ड",
    confirm_password: "पासवर्ड की पुष्टि करें",
    update_password: "पासवर्ड अपडेट करें",

    notifications: "सूचनाएं",
    notifications_description: "चुनें कि आप किन चीज़ों के बारे में सूचनाएं पाना चाहते हैं।",
    email_notifications: "ईमेल सूचनाएं",
    sms_notifications: "एसएमएस सूचनाएं",
    booking_updates: "बुकिंग अपडेट",
    promotional_offers: "प्रचार ऑफ़र",
    provider_messages: "सेवा प्रदाता के संदेश",
    system_announcements: "सिस्टम घोषणाएं",

email_description: "अपने ईमेल में अपडेट प्राप्त करें",
sms_description: "अपने फोन पर एसएमएस अलर्ट प्राप्त करें",
booking_description: "आपकी बुकिंग की स्थिति में बदलाव",
promotion_description: "छूट और विशेष ऑफ़र",
messages_description: "सेवा प्रदाताओं से सीधे संदेश",
announcements_description: "पूरे प्लेटफ़ॉर्म की घोषणाएं",
delete_confirm_title: "क्या आप अपना खाता हटाना चाहते हैं?",
    privacy: "गोपनीयता",
    privacy_description: "नियंत्रित करें कि दूसरे क्या देख और कर सकते हैं।",
    show_phone: "फ़ोन नंबर दिखाएं",
    show_phone_description: "आपके बुक किए गए प्रदाता इसे देख सकते हैं",
    show_profile: "प्रोफ़ाइल सार्वजनिक दिखाएं",
    show_profile_description: "OneClick पर कोई भी आपकी प्रोफ़ाइल देख सकता है",
    allow_contact: "प्रदाता को संपर्क करने दें",
    allow_contact_description: "प्रदाता आपको सीधे संदेश भेज सकते हैं",
    location_sharing: "स्थान साझा करना",
    location_sharing_description: "सक्रिय बुकिंग के दौरान लाइव स्थान साझा करें",

    appearance: "रूप",
    appearance_description: "अपने डिवाइस पर OneClick का रूप अपनी पसंद के अनुसार बनाएं।",
    theme: "थीम",
    light: "लाइट",
    dark: "डार्क",
    system_default: "सिस्टम डिफ़ॉल्ट",
    accent_color: "मुख्य रंग",
    preview: "पूर्वावलोकन",
    font_size: "फ़ॉन्ट आकार",
    small: "छोटा",
    medium: "मध्यम",
    large: "बड़ा",

    language: "भाषा",
    language_description: "वह भाषा चुनें जिसका आप उपयोग करना चाहते हैं।",
    english: "अंग्रेज़ी",
    nepali: "नेपाली",
    hindi: "हिन्दी",

    payment_methods: "भुगतान के तरीके",
    payment_description: "सेवाओं के लिए भुगतान करने का तरीका प्रबंधित करें।",
    khalti: "खल्ती",
    khalti_description: "खल्ती का उपयोग करके डिजिटल भुगतान करें",
    cash_service: "सेवा के बाद नकद भुगतान",
    cash_description: "सेवा पूरी होने के बाद भुगतान करें",
    default: "डिफ़ॉल्ट",
    available: "उपलब्ध",
    cancel: "रद्द करें",
delete_permanently: "स्थायी रूप से हटाएं",

    danger_zone: "खतरे का क्षेत्र",
    danger_description: "ये कार्य वापस नहीं लिए जा सकते या खाते को सीमित कर सकते हैं। सावधानी से आगे बढ़ें।",
    deactivate_account: "खाता निष्क्रिय करें",
    deactivate_description: "अपने खाते को अस्थायी रूप से छिपाएं। दोबारा लॉगिन करके इसे सक्रिय कर सकते हैं।",
    delete_account: "खाता हटाएं",
    delete_description: "अपना खाता और उससे जुड़ा सारा डेटा स्थायी रूप से हटाएं। इसे वापस नहीं किया जा सकता।"
  }

};


function getLanguage() {
    return localStorage.getItem(LANGUAGE_KEY) || "en";
}

function applyLanguage() {

    const language = getLanguage();
    const currentTranslations = translations[language] || translations.en;

    document.documentElement.lang = language;

    // Translate normal text
    document.querySelectorAll("[data-i18n]").forEach(element => {
        const key = element.dataset.i18n;
        const translation = currentTranslations[key];

        if (translation) {
            element.textContent = translation;
        }
    });

    // Translate input placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach(element => {
        const key = element.dataset.i18nPlaceholder;
        const translation = currentTranslations[key];

        if (translation) {
            element.placeholder = translation;
        }
    });
}

window.OneClickLanguage = {
    get: getLanguage,

    set: function(language) {
        localStorage.setItem(LANGUAGE_KEY, language);
        applyLanguage();
    },

    apply: applyLanguage
};

document.addEventListener("DOMContentLoaded", applyLanguage);
})();
