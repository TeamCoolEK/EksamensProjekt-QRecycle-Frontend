import { BASE_URL } from "../../config.js";
import { renderAdminNavbar, setupAdminNavbarEvents } from "./admin-navbar.js";

export function initBusinessList() {
    renderAdminBusinessListPage();
}

function renderAdminBusinessListPage() {

    document.getElementById("app").innerHTML = `

        ${renderAdminNavbar("Virksomhedsadministration")}

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

        <div
            id="editBusinessModal"
            style="
                display:none;
                position:fixed;
                top:0;
                left:0;
                width:100%;
                height:100%;
                background:rgba(0,0,0,0.5);
                justify-content:center;
                align-items:center;
                z-index:9999;
            "
        >
            <div
                style="
                    background:white;
                    padding:30px;
                    border-radius:12px;
                    min-width:400px;
                    max-width:500px;
                    box-shadow:0 0 20px rgba(0,0,0,0.3);
                "
            >
                <div id="editBusinessContainer"></div>
            </div>
        </div>
    `;

    setupAdminNavbarEvents();
    setupPageEvents();
    loadAllBusinesses();
}

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

function getToken() {
    return localStorage.getItem("jwt");
}

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

function showEditBusinessForm(business) {

    document.getElementById("editBusinessModal").style.display = "flex";

    document.getElementById("editBusinessContainer").innerHTML = `

        <div style="display:flex;justify-content:space-between;align-items:center;">
            <h2>Rediger virksomhed</h2>

            <button id="closeEditBusinessModalBtn" type="button">
                X
            </button>
        </div>

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

            <div class="business-actions">
                <button type="submit">
                    Gem ændringer
                </button>

                <button type="button" id="cancelEditBusinessBtn">
                    Annuller
                </button>
            </div>

        </form>
    `;

    document
        .getElementById("editBusinessForm")
        .addEventListener("submit", function (event) {
            handleUpdateBusinessSubmit(event, business.id);
        });

    document
        .getElementById("cancelEditBusinessBtn")
        .addEventListener("click", closeEditBusinessModal);

    document
        .getElementById("closeEditBusinessModalBtn")
        .addEventListener("click", closeEditBusinessModal);
}

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

function validateUpdatedBusiness(business) {

    return business.companyName.trim() !== ""
        && business.contactPerson.trim() !== ""
        && business.phoneNumber.trim() !== ""
        && business.address.trim() !== "";
}

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

            closeEditBusinessModal();

            loadAllBusinesses();
        })
        .catch(error => {

            console.log(error);

            showBusinessListMessage("Fejl: " + error.message);
        });
}

function confirmDeleteBusiness(businessId) {

    const confirmed = confirm("Er du sikker på, at du vil slette virksomheden?");

    if (!confirmed) {
        return;
    }

    deleteBusiness(businessId);
}

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

            closeEditBusinessModal();

            loadAllBusinesses();
        })
        .catch(error => {

            console.log(error);

            showBusinessListMessage("Fejl: " + error.message);
        });
}

function closeEditBusinessModal() {

    document.getElementById("editBusinessModal").style.display = "none";

    document.getElementById("editBusinessContainer").innerHTML = "";
}

function showBusinessListMessage(message) {
    const messageElement = document.getElementById("businessListMessage");

    messageElement.textContent = message;

    if (message === "") {
        messageElement.style.display = "none";
    } else {
        messageElement.style.display = "block";
    }
}