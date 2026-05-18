import { BASE_URL } from '../../config.js';
import { initAdminBuisnessList } from "./business-list.js";

export function initAdminDashboard(content) {
    renderAdminDashboardPage(content);
}

// Renderer admin dashboard siden
function renderAdminDashboardPage(content) {

    // Indsætter HTML i app containeren
    content.innerHTML = `

        <h1>Admin dashboard</h1>
        <div>
            <h2>Poser klar til afhentning</h2>
            <p>
                Antal poser:
                <span id="bagsReadyForPickup">Indlæser...</span>
            </p>
        </div>

        <div>
            <button onclick="initAdminBuisnessList()">
                Virksomhedsadministration
            </button>

            <button onclick="renderAdminUserPage()">
                Brugeradministration
            </button>

            <button onclick="renderStatisticPage()">
                Statistik
            </button>

            <button onclick="renderBusinessPage()">
                Opret virksomhed
            </button>

            <button onclick="renderAdminUserPage()">
                Opret bruger
            </button>

            <button onclick="renderDriverExpensePage()">
                Udgifter
            </button>

        </div>

        <p id="dashboardMessage"></p>
    `;

    // Henter data til dashboard
    loadDashboardData();
}

// Henter dashboard data fra backend
function loadDashboardData() {
    const token = localStorage.getItem('jwt')
    fetch(BASE_URL + "/admin/dashboard", {
        method: "GET",
        headers: { 'Authorization': `${token}` }
    })

        .then(res => {

            // Tjekker om request fejlede
            if (!res.ok) {
                throw new Error("Kunne ikke hente dashboard");
            }

            // Konverterer response til JSON
            return res.json();
        })

        .then(bagsReadyForPickup => {

            // Viser antal poser klar til afhentning
            document.getElementById("bagsReadyForPickup").textContent = bagsReadyForPickup + " poser";
        })

        .catch(error => {

            // Logger fejl i console
            console.log(error);

            // Viser fejl på dashboardet
            document.getElementById("bagsReadyForPickup").textContent = "Fejl";
            showDashboardMessage("Kunne ikke hente dashboard data");
        });
}

// Renderer midlertidig statistikside
function renderStatisticPage() {

    // Indsætter HTML i app containeren
    document.getElementById("app").innerHTML = `

        <h1>Statistik</h1>
        <p>Statistikside kommer senere</p>
        <button onclick="renderAdminDashboardPage()">
            Tilbage til dashboard
        </button>
    `;
}

// Viser besked til brugeren
function showDashboardMessage(message) {

    document
        .getElementById("dashboardMessage")
        .textContent = message;
}