// =========================================================
// AOS ANIMATION
// =========================================================

AOS.init({
    duration: 700,
    once: true,
    offset: 70
});


// =========================================================
// CURRENT YEAR
// =========================================================

document.getElementById("year").textContent =
    new Date().getFullYear();


// =========================================================
// NAVBAR SCROLL
// =========================================================

const navbar = document.getElementById("mainNavbar");

window.addEventListener("scroll", function () {

    if (window.scrollY > 50) {
        navbar.classList.add("scrolled");
    } else {
        navbar.classList.remove("scrolled");
    }

});


// =========================================================
// SERVICE SEARCH + FILTER
// =========================================================

const searchInput = document.getElementById("serviceSearchInput");

const filterButtons =
    document.querySelectorAll(".filter-btn");

const serviceCards =
    document.querySelectorAll(".service-card-col");

const emptyState =
    document.getElementById("emptyState");

let currentFilter = "all";


// FILTER FUNCTION

function filterServices() {

    const searchValue =
        searchInput.value.toLowerCase().trim();

    let visibleCount = 0;


    serviceCards.forEach(function(card) {

        const category =
            card.dataset.category.toLowerCase();

        const name =
            card.dataset.name.toLowerCase();


        const categoryMatch =
            currentFilter === "all" ||
            category === currentFilter;


        const searchMatch =
            name.includes(searchValue);


        if (categoryMatch && searchMatch) {

            card.style.display = "";

            visibleCount++;

        } else {

            card.style.display = "none";

        }

    });


    // SHOW EMPTY STATE

    if (visibleCount === 0) {

        emptyState.classList.remove("d-none");

    } else {

        emptyState.classList.add("d-none");

    }

}


// SEARCH EVENT

searchInput.addEventListener("input", filterServices);


// FILTER BUTTON EVENT

filterButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        // REMOVE ACTIVE

        filterButtons.forEach(function(btn) {

            btn.classList.remove("active");

        });


        // ADD ACTIVE

        this.classList.add("active");


        // GET FILTER

        currentFilter =
            this.dataset.filter;


        // FILTER

        filterServices();

    });

});


// =========================================================
// BACK TO TOP
// =========================================================

const backToTop =
    document.getElementById("backToTop");


window.addEventListener("scroll", function() {

    if (window.scrollY > 400) {

        backToTop.classList.add("show");

    } else {

        backToTop.classList.remove("show");

    }

});


backToTop.addEventListener("click", function() {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// =========================================================
// CLOSE MOBILE NAVBAR AFTER CLICKING LINK
// =========================================================

const navLinks =
    document.querySelectorAll(".oc-nav-links .nav-link");


navLinks.forEach(function(link) {

    link.addEventListener("click", function() {

        const navMenu =
            document.getElementById("navMenu");

        const bsCollapse =
            bootstrap.Collapse.getInstance(navMenu);

        if (bsCollapse) {
            bsCollapse.hide();
        }

    });

});