// imports
import { BASE_URL } from '../../config.js';
import { authFetch } from "../../utils.js";
import{renderAdminNavbar, setupAdminNavbarEvents} from "./admin-navbar.js";

export function initAdminDashboard() {
    renderAdminDashboardPage();
}

// Renderer admin dashboard siden
function renderAdminDashboardPage() {

    // Indsætter HTML i app containeren
    document.getElementById("app").innerHTML = `

        ${renderAdminNavbar("Dashboard")}


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
            <button onclick="window.location.hash='#/admin/statistics'">
                Statistik
            </button>

            <button onclick="window.location.hash='#/admin/createUser'">
                Opret bruger
            </button>

            <button onclick="window.location.hash='#/admin/getExpenses'">
                Udgifter
            </button>
            
            <button onclick="window.location.hash='#/driver/dashboard'">
                Rute
            </button>

        </div>

        <p id="dashboardMessage"></p>
    `;

    setupAdminNavbarEvents();

// Henter data til dashboard
    loadDashboardData();
}

// Henter dashboard data fra backend
function loadDashboardData() {
    authFetch(BASE_URL + "/admin/dashboard", { //henter auth fra authFetch utils.js
        method: "GET"
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

// Viser besked til brugeren
function showDashboardMessage(message) {

    document
        .getElementById("dashboardMessage")
        .textContent = message;
}