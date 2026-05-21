import { BASE_URL } from "../../config.js";
import{renderAdminNavbar, setupAdminNavbarEvents} from "./admin-navbar.js";

export function initAdminStatistics() {
    renderAdminStatisticsPage();
}

let allStatistics = [];

function renderAdminStatisticsPage() {

    document.getElementById("app").innerHTML = `

        ${renderAdminNavbar("Statestik")}
        
        <h1>Statistik over afhentet pant</h1>

        <div class="business-actions">
            <button id="backToDashboardBtn">
                Tilbage til dashboard
            </button>
        </div>

        <div class="business-actions">
            <select id="sortSelect">
                <option value="az">Virksomhed A-Z</option>
                <option value="za">Virksomhed Z-A</option>
                <option value="mostBags">Mest pant</option>
                <option value="leastBags">Mindst pant</option>
                <option value="newest">Nyeste først</option>
                <option value="oldest">Ældste først</option>
            </select>

            <input
                id="businessFilter"
                type="text"
                placeholder="Søg efter virksomhed"
            >

            <input
                id="fromDateFilter"
                type="date"
            >

            <input
                id="toDateFilter"
                type="date"
            >
        </div>

        <p id="statisticsMessage">Indlæser statistik...</p>

        <div id="statisticsSummary"></div>

        <table>
            <thead>
                <tr>
                    <th>Virksomhed</th>
                    <th>Oprettet</th>
                    <th>Afhentet / opdateret</th>
                    <th>Virksomhed poser</th>
                    <th>Chauffør poser</th>
                </tr>
            </thead>

            <tbody id="statisticsTableBody"></tbody>
        </table>
    `;

    setupAdminNavbarEvents()

    document
        .getElementById("backToDashboardBtn")
        .addEventListener("click", function () {
            window.location.hash = "#/admin/dashboard";
        });

    document
        .getElementById("sortSelect")
        .addEventListener("change", applyFiltersAndSorting);

    document
        .getElementById("businessFilter")
        .addEventListener("input", applyFiltersAndSorting);

    document
        .getElementById("fromDateFilter")
        .addEventListener("change", applyFiltersAndSorting);

    document
        .getElementById("toDateFilter")
        .addEventListener("change", applyFiltersAndSorting);

    loadStatistics();
}

function loadStatistics() {

    const token = localStorage.getItem("jwt");

    fetch(BASE_URL + "/admin/statistics/collections", {
        method: "GET",
        headers: {
            "Authorization": token
        }
    })
        .then(res => {
            if (!res.ok) {
                throw new Error("Kunne ikke hente statistik");
            }

            return res.json();
        })
        .then(statistics => {
            allStatistics = statistics;
            applyFiltersAndSorting();
        })
        .catch(error => {
            console.log(error);
            showStatisticsMessage("Kunne ikke hente statistik fra databasen");
        });
}

function applyFiltersAndSorting() {

    const sortValue = document.getElementById("sortSelect").value;
    const businessFilter = document.getElementById("businessFilter").value.toLowerCase();
    const fromDate = document.getElementById("fromDateFilter").value;
    const toDate = document.getElementById("toDateFilter").value;

    let filteredStatistics = [...allStatistics];

    if (businessFilter !== "") {
        filteredStatistics = filteredStatistics.filter(statistic =>
            statistic.businessName.toLowerCase().includes(businessFilter)
        );
    }

    if (fromDate !== "") {
        filteredStatistics = filteredStatistics.filter(statistic => {
            if (!statistic.createdAt) {
                return false;
            }

            return new Date(statistic.createdAt) >= new Date(fromDate);
        });
    }

    if (toDate !== "") {
        filteredStatistics = filteredStatistics.filter(statistic => {
            if (!statistic.createdAt) {
                return false;
            }

            return new Date(statistic.createdAt) <= new Date(toDate + "T23:59:59");
        });
    }

    if (sortValue === "az") {
        filteredStatistics.sort((a, b) =>
            a.businessName.localeCompare(b.businessName)
        );
    }

    if (sortValue === "za") {
        filteredStatistics.sort((a, b) =>
            b.businessName.localeCompare(a.businessName)
        );
    }

    if (sortValue === "mostBags") {
        filteredStatistics.sort((a, b) =>
            b.driverBags - a.driverBags
        );
    }

    if (sortValue === "leastBags") {
        filteredStatistics.sort((a, b) =>
            a.driverBags - b.driverBags
        );
    }

    if (sortValue === "newest") {
        filteredStatistics.sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );
    }

    if (sortValue === "oldest") {
        filteredStatistics.sort((a, b) =>
            new Date(a.createdAt) - new Date(b.createdAt)
        );
    }

    displayStatistics(filteredStatistics);
    displaySummary(filteredStatistics);
}

function displayStatistics(statistics) {

    const tableBody = document.getElementById("statisticsTableBody");

    tableBody.innerHTML = "";

    if (statistics.length === 0) {
        showStatisticsMessage("Der findes ingen statistik");
        return;
    }

    showStatisticsMessage("");

    statistics.forEach(statistic => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${statistic.businessName}</td>
            <td>${formatDate(statistic.createdAt)}</td>
            <td>${formatDate(statistic.updatedAt)}</td>
            <td>${statistic.businessBags}</td>
            <td>${statistic.driverBags}</td>
        `;

        tableBody.appendChild(row);
    });
}

function displaySummary(statistics) {

    const totalCollections = statistics.length;

    const totalBusinessBags = statistics.reduce((sum, statistic) =>
        sum + statistic.businessBags, 0
    );

    const totalDriverBags = statistics.reduce((sum, statistic) =>
        sum + statistic.driverBags, 0
    );

    document.getElementById("statisticsSummary").innerHTML = `

        <div class="status-card status-ready">
            <h3>Samlet statistik</h3>
            <p>Antal afhentninger: <strong>${totalCollections}</strong></p>
            <p>Poser registreret af virksomheder: <strong>${totalBusinessBags}</strong></p>
            <p>Poser registreret af chauffører: <strong>${totalDriverBags}</strong></p>
        </div>
    `;
}

function formatDate(dateString) {

    if (!dateString) {
        return "Ingen dato";
    }

    const date = new Date(dateString);

    return date.toLocaleString("da-DK", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function showStatisticsMessage(message) {

    document
        .getElementById("statisticsMessage")
        .textContent = message;
}