import { BASE_URL } from "../../config.js";

export function initBusinessList() {
    renderAdminBusinessListPage();
}

// Renderer siden med liste over alle virksomheder
function renderAdminBusinessListPage() {

    document.getElementById("app").innerHTML = `

        <h1>Virksomhedsadministration</h1>

        <div class="business-actions">
            <button id="backToDashboardBtn">
                Tilbage til dashboard
            </button>

            <button id="createBusinessBtn">
                Opret virksomhed
            </button>
        </div>

        <h2>Alle virksomheder</h2>

        <p id="businessListMessage">Indlæser virksomheder...</p>

        <table>
            <thead>
                <tr>
                    <th>Virksomhedsnavn</th>
                    <th>Kontaktperson</th>
                    <th>Telefonnummer</th>
                    <th>Adresse</th>
                    <th>Handling</th>
                </tr>
            </thead>

            <tbody id="businessTableBody"></tbody>
        </table>

        <div id="editBusinessContainer"></div>
    `;

    setupPageEvents();
    loadAllBusinesses();
}

// Opretter events til navigation
function setupPageEvents() {

    document
        .getElementById("backToDashboardBtn")
        .addEventListener("click", function () {
            window.location.hash = "#/admin/dashboard";
        });

    document
        .getElementById("createBusinessBtn")
        .addEventListener("click", function () {
            window.location.hash = "#/admin/createBusiness";
        });
}

// Henter JWT token
function getToken() {
    return localStorage.getItem("jwt");
}

// Henter alle virksomheder fra backend
function loadAllBusinesses() {

    const token = getToken();

    fetch(BASE_URL + "/admin/businesses", {
        method: "GET",
        headers: {
            "Authorization": token
        }
    })
        .then(res => {

            if (!res.ok) {
                throw new Error("Kunne ikke hente virksomheder");
            }

            return res.json();
        })
        .then(businesses => {
            displayBusinesses(businesses);
        })
        .catch(error => {

            console.log(error);

            showBusinessListMessage(
                "Kunne ikke hente virksomheder fra databasen"
            );
        });
}

// Viser virksomheder i tabellen
function displayBusinesses(businesses) {

    const tableBody = document.getElementById("businessTableBody");

    tableBody.innerHTML = "";

    if (businesses.length === 0) {
        showBusinessListMessage("Der er ingen virksomheder");
        return;
    }

    showBusinessListMessage("");

    businesses.forEach(business => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${business.companyName}</td>
            <td>${business.contactPerson}</td>
            <td>${business.phoneNumber}</td>
            <td>${business.address}</td>
            <td>
                <button class="edit-business-btn">
                    Rediger
                </button>

                <button class="delete-business-btn">
                    Slet
                </button>
            </td>
        `;

        row
            .querySelector(".edit-business-btn")
            .addEventListener("click", function () {
                showEditBusinessForm(business);
            });

        row
            .querySelector(".delete-business-btn")
            .addEventListener("click", function () {
                confirmDeleteBusiness(business.id);
            });

        tableBody.appendChild(row);
    });
}

// Viser formular til redigering af virksomhed
function showEditBusinessForm(business) {

    document.getElementById("editBusinessContainer").innerHTML = `

        <h2>Rediger virksomhed</h2>

        <form id="editBusinessForm">

            <input
                id="editCompanyName"
                type="text"
                value="${business.companyName}"
                placeholder="Virksomhedsnavn"
            >

            <input
                id="editContactPerson"
                type="text"
                value="${business.contactPerson}"
                placeholder="Kontaktperson"
            >

            <input
                id="editPhoneNumber"
                type="text"
                value="${business.phoneNumber}"
                placeholder="Telefonnummer"
            >

            <input
                id="editAddress"
                type="text"
                value="${business.address}"
                placeholder="Adresse"
            >

            <button type="submit">
                Gem ændringer
            </button>

            <button type="button" id="cancelEditBusinessBtn">
                Annuller
            </button>

        </form>
    `;

    document
        .getElementById("editBusinessForm")
        .addEventListener("submit", function (event) {
            handleUpdateBusinessSubmit(event, business.id);
        });

    document
        .getElementById("cancelEditBusinessBtn")
        .addEventListener("click", cancelEditBusiness);
}

// Håndterer submit af redigeringsformular
function handleUpdateBusinessSubmit(event, businessId) {

    event.preventDefault();

    const updatedBusiness = {
        companyName: document.getElementById("editCompanyName").value,
        contactPerson: document.getElementById("editContactPerson").value,
        phoneNumber: document.getElementById("editPhoneNumber").value,
        address: document.getElementById("editAddress").value
    };

    if (!validateUpdatedBusiness(updatedBusiness)) {
        showBusinessListMessage("Alle felter skal udfyldes");
        return;
    }

    updateBusiness(businessId, updatedBusiness);
}

// Validerer redigeret virksomhedsdata
function validateUpdatedBusiness(business) {

    return business.companyName.trim() !== ""
        && business.contactPerson.trim() !== ""
        && business.phoneNumber.trim() !== ""
        && business.address.trim() !== "";
}

// Sender opdateret virksomhed til backend
function updateBusiness(businessId, updatedBusiness) {

    const token = getToken();

    fetch(BASE_URL + "/admin/businesses/" + businessId, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token
        },
        body: JSON.stringify(updatedBusiness)
    })
        .then(res => {

            if (!res.ok) {
                return res.text().then(errorMessage => {
                    throw new Error(errorMessage);
                });
            }

            return res.json();
        })
        .then(() => {

            showBusinessListMessage("Virksomhed opdateret");

            document.getElementById("editBusinessContainer").innerHTML = "";

            loadAllBusinesses();
        })
        .catch(error => {

            console.log(error);

            showBusinessListMessage("Fejl: " + error.message);
        });
}

// Annullerer redigering
function cancelEditBusiness() {

    document.getElementById("editBusinessContainer").innerHTML = "";
}

// Viser bekræftelsesdialog før sletning
function confirmDeleteBusiness(businessId) {

    const confirmed = confirm("Er du sikker på, at du vil slette virksomheden?");

    if (!confirmed) {
        return;
    }

    deleteBusiness(businessId);
}

// Sletter virksomhed fra backend
function deleteBusiness(businessId) {

    const token = getToken();

    fetch(BASE_URL + "/admin/businesses/" + businessId, {
        method: "DELETE",
        headers: {
            "Authorization": token
        }
    })
        .then(res => {

            if (!res.ok) {
                return res.text().then(errorMessage => {
                    throw new Error(errorMessage);
                });
            }

            return res.text();
        })
        .then(() => {

            showBusinessListMessage("Virksomhed slettet");

            document.getElementById("editBusinessContainer").innerHTML = "";

            loadAllBusinesses();
        })
        .catch(error => {

            console.log(error);

            showBusinessListMessage("Fejl: " + error.message);
        });
}

// Viser besked til admin
function showBusinessListMessage(message) {

    document
        .getElementById("businessListMessage")
        .textContent = message;
}