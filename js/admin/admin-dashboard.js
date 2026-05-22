// imports
import { BASE_URL } from '../../config.js';

export function initAdminDashboard() {
    renderAdminDashboardPage();
}

// Renderer admin dashboard siden
function renderAdminDashboardPage() {

    // Indsætter HTML i app containeren
    document.getElementById("app").innerHTML = `

        <h1>Admin dashboard</h1>
        <div>
            <h2>Poser klar til afhentning</h2>
            <p>
                Antal poser:
                <span id="bagsReadyForPickup">Indlæser...</span>
            </p>
        </div>

        <div>

            <!--onclick referere til routen, som loader den side der skal loades fra app.js (ctrl klik routen)-->
            <button onclick="window.location.hash='#/admin/businessList'">
                Virksomhedsadministration
            </button>
            
            <button onclick="window.location.hash='#/admin/collections'">
                 Afhentninger
            </button>

            <!--indsættes som eventlistener under html!-->
            <button id="statistik">
                Statistik
            </button>
            
            <!--QE-42 - QE-319 - knap til Admin til brugeradministration!-->
            <button onclick="window.location.hash='#/admin/userList'">
                Brugeradministration
            </button>

            <button onclick="alert('Coming soon!')">
                Udgifter
            </button>
            
            <button onclick="alert('Coming soon!')">
                Rute
            </button>

        </div>

        <p id="dashboardMessage"></p>
    `;

    // Henter data til dashboard
    loadDashboardData();
    document.getElementById("statistik").addEventListener("click", renderStatisticPage);
}

// Henter dashboard data fra backend
function loadDashboardData() {
    const token = localStorage.getItem('jwt')
    fetch(BASE_URL + "/admin/dashboard", {
        method: "GET",
        headers: { 'Authorization': `Bearer ${token}` } //Hvad betyder Bearer?
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
            showDashboardMessage("Kunne ikke hente data");
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