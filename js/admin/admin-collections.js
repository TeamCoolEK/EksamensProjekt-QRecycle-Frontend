import {BASE_URL} from "../../config.js";
import{renderAdminNavbar, setupAdminNavbarEvents} from "./admin-navbar.js";

export function initAdminCollections(){
    renderAdminCollectionsPage();
}

function renderAdminCollectionsPage(){

    document.getElementById("app").innerHTML = `
    
        ${renderAdminNavbar("Afhentninger")}
    
    <h1>Afhentningshistorik</h1>
    
    <div class="business-actions">
    <button id="backToDashboardBtn">
    Tilbage til dashboard
</button>
</div>
    
    <h2>Alle Afhentninger</h2>
    
    <p id="collectionListMessage">Indlæser afhentninger</p>
    
    <table>
    <thead>
    <tr>
    <th>Virksomhed</th>
    <th>Oprettet</th>
    <th>Afhentet</th>
    <th>Registreret poser fra virksomhed</th>
    <th>Registreret poser fra chauffør</th>
    <th>Status</th>
</tr>
</thead>

<tbody id="collectionTableBody"></tbody>
</table>
    `;

    setupAdminNavbarEvents()

    document.getElementById("backToDashboardBtn")
        .addEventListener("click", function (){
            window.location.hash = "#/admin/dashboard";
        });
    loadAllCollections();
}

function loadAllCollections(){
    const token = localStorage.getItem("jwt")

    fetch(BASE_URL + "/admin/collections", {
        method: "GET", headers: {"Authorization": token}
    })
        .then(res => {
            if (!res.ok){
                throw new Error("Kunne ikke hente afhentning")
            }
            return res.json()
        })
        .then(collections => {
            displayCollections(collections)
        })
        .catch(error => {
            console.log(error)

            showCollectionMessage("Kunne ikke hente afhentninger fra databasen")
        })
}

function displayCollections(collections) {
    const tableBody = document.getElementById("collectionTableBody");

    tableBody.innerHTML = "";

    if (collections.length === 0) {
        showCollectionMessage("Der er ingen afhentninger");
        return;
    }

    showCollectionMessage("");

    collections.sort((a, b) => {

        const statusOrder = {
            KLAR: 1,
            AFHENTET: 2,
            IKKE_KLAR: 3
        };

        const statusCompare =
            statusOrder[a.status] - statusOrder[b.status];

        if (statusCompare !== 0) {
            return statusCompare;
        }

        return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    collections.forEach(collection => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${collection.businessName}</td>
            <td>${formatDate(collection["createdAt"])}</td>
            <td>${formatDate(collection["updatedAt"])}</td>
            <td>${collection.businessBags}</td>
            <td>${collection.driverBags}</td>
            <td>${formatStatus(collection.status)}</td>
        `;

        tableBody.appendChild(row);
    });
}

function formatDate(dateString){
    if (!dateString){
        return "Ingen dato";
    }
    const date = new Date(dateString)

    return date.toLocaleString("da-DK",{
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatStatus(status){

        const statusTexts = {
            IKKE_KLAR: "Ikke klar",
            KLAR: "Klar til afhentning",
            AFHENTET: "Afhentet"
        }

        return statusTexts[status] || status;
    }
    function showCollectionMessage(message){

        document.getElementById("collectionListMessage")
            .textContent = message;
    }
