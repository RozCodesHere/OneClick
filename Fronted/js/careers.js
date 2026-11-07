// Update the footer year automatically.
const footer = document.querySelector(".footer");

if (footer) {
    footer.innerHTML = footer.innerHTML.replace(
        /©\s*\d{4}/,
        `© ${new Date().getFullYear()}`
    );
}
