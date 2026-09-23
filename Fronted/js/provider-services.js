/* =========================================================
   ONECLICK — PROVIDER SERVICES
   ========================================================= */


const API_BASE =
    "http://127.0.0.1:8000/api";


const PROVIDER_SERVICES_API =
    `${API_BASE}/services/provider/`;


const SERVICES_API =
    `${API_BASE}/services/`;


const accessToken =
    localStorage.getItem("access_token");


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let providerServices = [];

let availableServices = [];

let editingServiceId = null;

let deletingServiceId = null;

let providerCategoryId = null;

/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        if (!accessToken) {

            window.location.href =
                "login.html?role=provider";

            return;

        }

        setupEvents();

        await loadProviderCategory();

        loadProviderServices();

    }
);

/* =========================================================
   EVENT SETUP
   ========================================================= */

function setupEvents() {

    document
        .getElementById("addServiceBtn")
        .addEventListener(
            "click",
            openAddServiceModal
        );


    document
        .getElementById("emptyAddServiceBtn")
        .addEventListener(
            "click",
            openAddServiceModal
        );


    document
        .getElementById("serviceForm")
        .addEventListener(
            "submit",
            handleServiceSubmit
        );


    document
        .getElementById("confirmDeleteBtn")
        .addEventListener(
            "click",
            deleteService
        );

}


/* =========================================================
   LOAD PROVIDER SERVICES
   ========================================================= */

async function loadProviderServices() {

    showLoading(true);


    try {

        const response =
            await fetch(
                PROVIDER_SERVICES_API,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${accessToken}`
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load provider services."
            );

        }


        const data =
            await response.json();


        providerServices =
            Array.isArray(data)
                ? data
                : data.results || [];


        renderProviderServices();

    }

    catch (error) {

        console.error(
            "Provider services error:",
            error
        );

        showAlert(
            "Unable to load your services.",
            "danger"
        );

    }

    finally {

        showLoading(false);

    }

}


/* =========================================================
   RENDER PROVIDER SERVICES
   ========================================================= */

function renderProviderServices() {

    const grid =
        document.getElementById(
            "servicesGrid"
        );

    const emptyState =
        document.getElementById(
            "emptyServices"
        );


    grid.innerHTML = "";


    if (providerServices.length === 0) {

        grid.classList.add("d-none");

        emptyState.classList.remove("d-none");

        return;

    }


    emptyState.classList.add("d-none");

    grid.classList.remove("d-none");


    providerServices.forEach(
        function (providerService) {

            grid.insertAdjacentHTML(
                "beforeend",
                createServiceCard(
                    providerService
                )
            );

        }
    );

}


/* =========================================================
   CREATE SERVICE CARD
   ========================================================= */

function createServiceCard(
    providerService
) {

    const statusClass =
        providerService.is_active
            ? "active"
            : "inactive";


    const statusText =
        providerService.is_active
            ? "Active"
            : "Inactive";


    return `

        <div class="col-md-6 col-lg-4">

            <div class="service-card">

                <div class="service-icon">

                    <i class="fa-solid fa-screwdriver-wrench"></i>

                </div>


                <div class="service-name">

                    ${escapeHtml(
                        providerService.service_name
                    )}

                </div>


                <div class="service-category">

                    ${escapeHtml(
                        providerService.category_name
                    )}

                </div>


                <div class="service-price">

                    Rs. ${escapeHtml(
                        providerService.price
                    )}

                </div>


                <div class="service-price-label">

                    Your provider price

                </div>


                <div class="mt-3">

                    <span
                        class="service-status ${statusClass}"
                    >

                        <span class="status-dot"></span>

                        ${statusText}

                    </span>

                </div>


                <div class="service-actions">

                    <button
                        type="button"
                        class="btn btn-outline-primary btn-sm"
                        onclick="openEditServiceModal(
                            ${providerService.id}
                        )"
                    >

                        <i class="fa-solid fa-pen me-1"></i>

                        Edit

                    </button>


                    <button
                        type="button"
                        class="btn btn-outline-danger btn-sm"
                        onclick="openDeleteModal(
                            ${providerService.id}
                        )"
                    >

                        <i class="fa-solid fa-trash me-1"></i>

                        Remove

                    </button>

                </div>

            </div>

        </div>

    `;

}


/* =========================================================
   OPEN ADD MODAL
   ========================================================= */

async function openAddServiceModal() {

    editingServiceId = null;


    document.getElementById(
        "serviceModalTitle"
    ).textContent = "Add Service";


    document.getElementById(
        "serviceForm"
    ).reset();


    document.getElementById(
        "serviceActive"
    ).checked = true;


    clearFormError();


    await loadAvailableServices();


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            document.getElementById(
                "serviceModal"
            )
        );


    modal.show();

}

async function loadProviderCategory() {
    try {
        const response = await fetch(
            `${API_BASE}/providers/dashboard/`,
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load provider information.");
        }

        const data = await response.json();

        providerCategoryId =
            data.provider?.category ||
            data.provider?.category_id ||
            null;

        console.log(
            "Provider category ID:",
            providerCategoryId
        );

    } catch (error) {
        console.error(
            "Error loading provider category:",
            error
        );
    }
}

/* =========================================================
   LOAD AVAILABLE SERVICES
   ========================================================= */

async function loadAvailableServices() {

    const select =
        document.getElementById(
            "serviceSelect"
        );


    select.innerHTML = `

        <option value="">
            Loading services...
        </option>

    `;


    try {

        const response =
            await fetch(
                SERVICES_API,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${accessToken}`
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load services."
            );

        }


        const data =
            await response.json();


        const services =
            Array.isArray(data)
                ? data
                : data.results || [];


        const existingIds =
            new Set(
                providerServices.map(
                    function (item) {

                        return Number(
                            item.service
                        );

                    }
                )
            );


       availableServices =
    services.filter(
        function (service) {

            return (
                service.is_active &&
                Number(service.category) ===
                    Number(providerCategoryId) &&
                !existingIds.has(
                    Number(service.id)
                )
            );

        }
    );


        renderServiceOptions();

    }

    catch (error) {

        console.error(error);

        select.innerHTML = `

            <option value="">
                Unable to load services
            </option>

        `;

    }

}


/* =========================================================
   RENDER SERVICE OPTIONS
   ========================================================= */

function renderServiceOptions() {

    const select =
        document.getElementById(
            "serviceSelect"
        );


    select.innerHTML = `

        <option value="">
            Select a service
        </option>

    `;


    availableServices.forEach(
        function (service) {

            select.insertAdjacentHTML(
                "beforeend",
                `
                    <option value="${service.id}">
                        ${escapeHtml(service.name)}
                        — ${escapeHtml(service.category_name)}
                    </option>
                `
            );

        }
    );


    if (availableServices.length === 0) {

        select.innerHTML = `

            <option value="">
                All available services are already added
            </option>

        `;

    }

}


/* =========================================================
   OPEN EDIT MODAL
   ========================================================= */

function openEditServiceModal(
    providerServiceId
) {

    const providerService =
        providerServices.find(
            function (item) {

                return (
                    Number(item.id) ===
                    Number(providerServiceId)
                );

            }
        );


    if (!providerService) {

        return;

    }


    editingServiceId =
        providerService.id;


    document.getElementById(
        "serviceModalTitle"
    ).textContent = "Edit Service";


    clearFormError();


    const select =
        document.getElementById(
            "serviceSelect"
        );


    select.innerHTML = `

        <option value="${providerService.service}">
            ${escapeHtml(
                providerService.service_name
            )}
        </option>

    `;


    select.disabled = true;


    document.getElementById(
        "servicePrice"
    ).value =
        providerService.price;


    document.getElementById(
        "serviceActive"
    ).checked =
        providerService.is_active;


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            document.getElementById(
                "serviceModal"
            )
        );


    modal.show();

}


/* =========================================================
   SUBMIT ADD / EDIT
   ========================================================= */

async function handleServiceSubmit(
    event
) {

    event.preventDefault();


    clearFormError();


    const serviceSelect =
        document.getElementById(
            "serviceSelect"
        );


    const priceInput =
        document.getElementById(
            "servicePrice"
        );


    const activeInput =
        document.getElementById(
            "serviceActive"
        );


    const saveButton =
        document.getElementById(
            "saveServiceBtn"
        );


    const serviceId =
        serviceSelect.value;


    const price =
        priceInput.value;


    const isActive =
        activeInput.checked;


    if (!price || Number(price) <= 0) {

        showFormError(
            "Please enter a valid price."
        );

        return;

    }


    saveButton.disabled = true;


    try {

        let response;


        if (editingServiceId) {

            response =
                await fetch(
                    `${PROVIDER_SERVICES_API}${editingServiceId}/`,
                    {
                        method: "PATCH",

                        headers: {
                            "Authorization":
                                `Bearer ${accessToken}`,

                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            price: price,
                            is_active: isActive
                        })
                    }
                );

        }

        else {

            if (!serviceId) {

                showFormError(
                    "Please select a service."
                );

                saveButton.disabled = false;

                return;

            }


            response =
                await fetch(
                    PROVIDER_SERVICES_API,
                    {
                        method: "POST",

                        headers: {
                            "Authorization":
                                `Bearer ${accessToken}`,

                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            service:
                                Number(serviceId),

                            price:
                                price,

                            is_active:
                                isActive
                        })
                    }
                );

        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                getApiErrorMessage(data)
            );

        }


        bootstrap.Modal
            .getInstance(
                document.getElementById(
                    "serviceModal"
                )
            )
            ?.hide();


        showAlert(
            editingServiceId
                ? "Service updated successfully."
                : "Service added successfully.",
            "success"
        );


        editingServiceId = null;


        await loadProviderServices();

    }

    catch (error) {

        console.error(
            "Save service error:",
            error
        );

        showFormError(
            error.message
        );

    }

    finally {

        saveButton.disabled = false;

    }

}


/* =========================================================
   OPEN DELETE MODAL
   ========================================================= */

function openDeleteModal(
    providerServiceId
) {

    const providerService =
        providerServices.find(
            function (item) {

                return (
                    Number(item.id) ===
                    Number(providerServiceId)
                );

            }
        );


    if (!providerService) {

        return;

    }


    deletingServiceId =
        providerService.id;


    document.getElementById(
        "deleteServiceName"
    ).textContent =
        providerService.service_name;


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            document.getElementById(
                "deleteModal"
            )
        );


    modal.show();

}


/* =========================================================
   DELETE SERVICE
   ========================================================= */

async function deleteService() {

    if (!deletingServiceId) {

        return;

    }


    const button =
        document.getElementById(
            "confirmDeleteBtn"
        );


    button.disabled = true;


    try {

        const response =
            await fetch(
                `${PROVIDER_SERVICES_API}${deletingServiceId}/`,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization":
                            `Bearer ${accessToken}`
                    }
                }
            );


        if (!response.ok) {

            const data =
                await response.json();

            throw new Error(
                getApiErrorMessage(data)
            );

        }


        bootstrap.Modal
            .getInstance(
                document.getElementById(
                    "deleteModal"
                )
            )
            ?.hide();


        showAlert(
            "Service removed successfully.",
            "success"
        );


        deletingServiceId = null;


        await loadProviderServices();

    }

    catch (error) {

        console.error(
            "Delete service error:",
            error
        );


        showAlert(
            error.message,
            "danger"
        );

    }

    finally {

        button.disabled = false;

    }

}


/* =========================================================
   LOADING STATE
   ========================================================= */

function showLoading(
    isLoading
) {

    const loading =
        document.getElementById(
            "servicesLoading"
        );


    if (isLoading) {

        loading.classList.remove(
            "d-none"
        );

    }

    else {

        loading.classList.add(
            "d-none"
        );

    }

}


/* =========================================================
   ALERT
   ========================================================= */

function showAlert(
    message,
    type
) {

    const alert =
        document.getElementById(
            "serviceAlert"
        );


    alert.className =
        `alert alert-${type}`;


    alert.textContent =
        message;


    alert.classList.remove(
        "d-none"
    );


    setTimeout(
        function () {

            alert.classList.add(
                "d-none"
            );

        },
        3500
    );

}


/* =========================================================
   FORM ERROR
   ========================================================= */

function showFormError(
    message
) {

    const error =
        document.getElementById(
            "formError"
        );


    error.textContent =
        message;


    error.classList.remove(
        "d-none"
    );

}


function clearFormError() {

    const error =
        document.getElementById(
            "formError"
        );


    error.textContent = "";

    error.classList.add(
        "d-none"
    );

}


/* =========================================================
   API ERROR
   ========================================================= */

function getApiErrorMessage(
    data
) {

    if (!data) {

        return "Something went wrong.";

    }


    if (typeof data === "string") {

        return data;

    }


    const messages = [];


    Object.keys(data).forEach(
        function (key) {

            const value =
                data[key];


            if (Array.isArray(value)) {

                messages.push(
                    value.join(" ")
                );

            }

            else if (
                typeof value === "string"
            ) {

                messages.push(value);

            }

        }
    );


    return messages.length
        ? messages.join(" ")
        : "Something went wrong.";

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(
    value
) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}