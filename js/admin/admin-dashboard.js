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
        
        <div class="business-actions">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                <span style="font-size: 14px; color: var(--qr-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Poser klar til afhentning</span>
                <span id="bagsReadyForPickup" style="font-size: 32px; font-weight: 800; color: var(--qr-green);">Indlæser...</span>
            </div>
        </div>

        <h2>Navigation</h2>

        <table class="dashboard-nav-table">
            <tbody>
                <tr class="clickable-row" onclick="window.location.hash='#/admin/businessList'">
                    <td>Virksomhedsadministration</td>
                </tr>
                <tr class="clickable-row" onclick="window.location.hash='#/admin/collections'">
                    <td>Afhentninger</td>
                </tr>
                <tr class="clickable-row" onclick="window.location.hash='#/admin/statistics'">
                    <td>Statistik</td>
                </tr>
                <tr class="clickable-row" onclick="window.location.hash='#/admin/userList'">
                    <td>Brugeradministration</td>
                </tr>
                <tr class="clickable-row" onclick="window.location.hash='#/admin/getExpenses'">
                    <td>Udgifter</td>
                </tr>
                <tr class="clickable-row" onclick="window.location.hash='#/driver/dashboard'">
                    <td>Rute plan</td>
                </tr>
            </tbody>
        </table>

        <p id="dashboardMessage"></p>
    `;

    setupAdminNavbarEvents();

    // renser driver dashboard body og html class hvis admin retunerer til admin dashboard fra driver dashboard
    unmountDriverMap();

    // Henter data til dashboard
    loadDashboardData();
}
// cleanup af driverMapBody så man kan scrolle på admin dashboard
function unmountDriverMap() {
    document.body.classList.remove('driver-map-page');
    document.documentElement.classList.remove('driver-map-page');
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