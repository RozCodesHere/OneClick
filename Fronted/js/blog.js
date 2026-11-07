
document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("blogSearch");
    const categoryButtons = document.querySelectorAll(".category-btn");
    const blogItems = document.querySelectorAll(".blog-item");
    const noResults = document.getElementById("noResults");

    let selectedCategory = "all";

    // Article filtering and search
    function filterArticles() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        let visibleCount = 0;

        blogItems.forEach(function (item) {
            const category = item.dataset.category;
            const title = item.dataset.title.toLowerCase();
            const description = item.querySelector(".article-content p")
                .textContent.toLowerCase();

            const matchesCategory =
                selectedCategory === "all" ||
                category === selectedCategory;

            const matchesSearch =
                title.includes(searchTerm) ||
                description.includes(searchTerm) ||
                category.replace("-", " ").includes(searchTerm);

            const shouldShow = matchesCategory && matchesSearch;

            item.classList.toggle("d-none", !shouldShow);

            if (shouldShow) {
                visibleCount++;
            }
        });

        noResults.classList.toggle("d-none", visibleCount !== 0);
    }

    // Category button clicks
    categoryButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            categoryButtons.forEach(function (btn) {
                btn.classList.remove("active");
            });

            button.classList.add("active");
            selectedCategory = button.dataset.category;

            filterArticles();
        });
    });

    // Search as the user types
    searchInput.addEventListener("input", filterArticles);

    // Article content
    const articles = {
        plumbing: {
            category: "Home Repair",
            title: "5 Common Plumbing Problems and How to Spot Them",
            paragraphs: [
                {
                    heading: "1. Leaking faucets",
                    text: "A dripping faucet can waste water over time. Check the tap and its connections, and seek professional help if the leak continues."
                },
                {
                    heading: "2. Slow or blocked drains",
                    text: "Water draining slowly may indicate a buildup in the pipe. Avoid pouring harsh chemicals into drains without checking whether they are suitable."
                },
                {
                    heading: "3. Low water pressure",
                    text: "Low pressure can be caused by a clogged fixture, a supply problem, or a leak. A professional can help identify the cause."
                },
                {
                    heading: "4. Pipe leaks",
                    text: "Look for damp patches, unexplained water stains, or persistent moisture around visible pipes."
                },
                {
                    heading: "5. Running toilets",
                    text: "A toilet that continues running after flushing may have a faulty internal component and can waste water."
                }
            ],
            ending: "If you cannot identify or safely resolve the problem, contact a qualified plumbing professional."
        },

        cleaning: {
            category: "Cleaning",
            title: "A Simple Weekly Cleaning Checklist for Your Home",
            paragraphs: [
                {
                    heading: "Living room",
                    text: "Dust surfaces, organize items, vacuum or sweep the floor, and clean frequently touched areas."
                },
                {
                    heading: "Kitchen",
                    text: "Wipe countertops, clean the sink, remove food waste, and check the refrigerator for expired items."
                },
                {
                    heading: "Bathroom",
                    text: "Clean the toilet, sink, and shower surfaces. Keep the room ventilated to help reduce moisture."
                },
                {
                    heading: "Bedroom",
                    text: "Change bedding when needed, organize clothes, dust furniture, and clean the floor."
                },
                {
                    heading: "Finish with a quick reset",
                    text: "Return items to their places and prepare a short list of tasks that need attention next week."
                }
            ],
            ending: "A small, consistent routine can make home cleaning more manageable. Adjust the schedule to your household's needs."
        },

        provider: {
            category: "Customer Guides",
            title: "How to Choose the Right Service Provider",
            paragraphs: [
                {
                    heading: "Check relevant experience",
                    text: "Choose someone whose experience matches the type of service you need."
                },
                {
                    heading: "Read customer reviews",
                    text: "Look for useful details about punctuality, communication, workmanship, and overall customer experience."
                },
                {
                    heading: "Understand the price",
                    text: "Ask what is included in the quoted price and whether materials or additional work cost extra."
                },
                {
                    heading: "Explain the job clearly",
                    text: "Describe the problem, location, and expected work so the provider can better understand your needs."
                },
                {
                    heading: "Confirm the arrangements",
                    text: "Agree on the service scope, appointment time, and any relevant terms before work begins."
                }
            ],
            ending: "OneClick helps customers explore local service providers and make more informed service choices."
        },

        vehicle: {
            category: "Vehicle Care",
            title: "Basic Vehicle Maintenance Tips for Beginners",
            paragraphs: [
                {
                    heading: "Check tire condition",
                    text: "Inspect tires for visible damage and maintain the pressure recommended by your vehicle manufacturer."
                },
                {
                    heading: "Pay attention to warning lights",
                    text: "Do not ignore dashboard warning lights. Consult the owner's manual and seek professional assistance when necessary."
                },
                {
                    heading: "Maintain fluid levels",
                    text: "Follow the manufacturer's instructions for checking engine oil and other service fluids."
                },
                {
                    heading: "Keep up with servicing",
                    text: "Follow the recommended maintenance schedule for inspections, filters, brakes, and other components."
                },
                {
                    heading: "Notice unusual changes",
                    text: "New noises, vibrations, smells, or changes in braking should be checked by a qualified mechanic."
                }
            ],
            ending: "Always follow your vehicle's manual and use a qualified professional for safety-critical repairs."
        },

        trust: {
            category: "Provider Tips",
            title: "How Service Providers Can Build Customer Trust",
            paragraphs: [
                {
                    heading: "Communicate clearly",
                    text: "Explain the service, expected timeline, and possible limitations in language the customer understands."
                },
                {
                    heading: "Be punctual",
                    text: "Arrive at the agreed time or inform the customer promptly if a delay occurs."
                },
                {
                    heading: "Explain prices honestly",
                    text: "Discuss the expected cost and obtain agreement before carrying out additional work."
                },
                {
                    heading: "Work professionally",
                    text: "Respect the customer's property, follow appropriate safety practices, and keep the work area organized."
                },
                {
                    heading: "Follow up appropriately",
                    text: "Confirm that the agreed work is complete and respond respectfully to questions or concerns."
                }
            ],
            ending: "Consistent service, honest communication, and respect can help professionals build lasting customer relationships."
        },

        leakage: {
            category: "Home Repair",
            title: "Simple Ways to Prevent Water Leakage",
            paragraphs: [
                {
                    heading: "Inspect visible connections",
                    text: "Occasionally check taps, exposed pipes, and visible joints for moisture or corrosion."
                },
                {
                    heading: "Watch for damp patches",
                    text: "New stains, peeling paint, or persistent dampness may indicate a leak that needs investigation."
                },
                {
                    heading: "Avoid forcing fittings",
                    text: "Over-tightening plumbing connections can damage components. Use suitable fittings and proper installation methods."
                },
                {
                    heading: "Know where the shutoff is",
                    text: "Learn where your main water shutoff is located so you can act quickly if a significant leak occurs."
                },
                {
                    heading: "Get problems checked early",
                    text: "If a leak persists or is hidden inside a wall or ceiling, contact a qualified professional."
                }
            ],
            ending: "For serious leaks or water near electrical equipment, keep clear of the hazard and seek appropriate professional help."
        }
    };

    // Open an article in the modal
    const articleModalElement = document.getElementById("articleModal");
    const articleModal = bootstrap.Modal.getOrCreateInstance(articleModalElement);

    document.querySelectorAll(".read-more-btn").forEach(function (button) {
        button.addEventListener("click", function () {
            const article = articles[button.dataset.article];

            if (!article) {
                return;
            }

            document.getElementById("modalCategory").textContent =
                article.category;

            document.getElementById("articleModalTitle").textContent =
                article.title;

            const articleBody = document.getElementById("modalArticleBody");
            articleBody.replaceChildren();

            const articleText = document.createElement("div");
            articleText.className = "article-text";

            article.paragraphs.forEach(function (section) {
                const heading = document.createElement("h3");
                heading.textContent = section.heading;

                const paragraph = document.createElement("p");
                paragraph.textContent = section.text;

                articleText.append(heading, paragraph);
            });

            const ending = document.createElement("p");
            ending.textContent = article.ending;
            articleText.appendChild(ending);

            articleBody.appendChild(articleText);
            articleModal.show();
        });
    });

    // Current year
    document.getElementById("currentYear").textContent =
        new Date().getFullYear();

    // Initial display
    filterArticles();
});
