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
})();