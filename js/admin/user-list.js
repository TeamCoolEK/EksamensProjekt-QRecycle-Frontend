// admin/user-list.js

// QE-42: user-list.js tilføjet - Admin kan se alle brugere
// QE-319: Admin-side til brugeradministration
import { BASE_URL } from "../../config.js";
import{renderAdminNavbar, setupAdminNavbarEvents} from "./admin-navbar.js";

export function initAdminUserList() {
    renderAdminUserListPage();
}

// QE-319 & QE-325: Renderer siden med liste/tabel
function renderAdminUserListPage() {

    document.getElementById("app").innerHTML = `

        ${renderAdminNavbar("Opret virksomhed")}
    
        <h1>Brugeradministration</h1>
       
        <div class="business-actions">
            <button id="backToDashboardBtn">
                Tilbage til dashboard
            </button>
            
            <button id="createUserBtn">
                Opret bruger
            </button>
        </div>
        
        <h2>Alle brugere</h2>
        
        <!-- QE-326: Loading state -->
        <!-- QE-327: Fejlbesked vises her -->
        <p id="userListMessage">Indlæser brugere...</p>
        
        <!-- QE-325: Tabel til visning af brugere -->
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Brugernavn</th>
                    <th>Rolle</th>
                </tr>
            </thead>
            
            <tbody id="usersTableBody"></tbody>
        </table>

        <div id="editUserContainer"></div>
    `;
    setupAdminNavbarEvents();

    setupPageEvents();
    // QE-324: Starter fetch til backend
    loadAllUsers();


}

// Setup navigation events
function setupPageEvents() {

    document
        .getElementById("backToDashboardBtn")
        .addEventListener("click", function() {
            window.location.hash = "#/admin/dashboard";
        });

    // QE-319: Navigation til opret bruger side
    document
        .getElementById("createUserBtn")
        .addEventListener("click", () => {
            window.location.hash = '#/admin/createUser';
        });
}

// Helper til JWT token
function getToken() {
    return localStorage.getItem("jwt");
}

// QE-324: Implementer frontend fetch til hentning af brugere
// QE-326: Loading state (vises før data hentes)
// QE-327: Fejlhåndtering hvis data ikke kan hentes
function loadAllUsers() {

    const token = getToken();

    // QE-324: Fetch request til backend endpoint
    fetch(BASE_URL + "/admin/users", {
        method: "GET",
        headers: {
            "Authorization": `${token}`
        }
    })
        .then(res => {

            // QE-327: Tjekker om request fejlede
            if (!res.ok) {
                throw new Error("Kunne ikke hente brugere");
            }

            // QE-323: Parser JSON response (UserResponseDTO[])
            return res.json();
        })
        .then(users => {
            // QE-325: Viser brugere i tabel
            displayUsers(users);
        })
        .catch(error => {

            console.log(error);

            // QE-327: Viser fejlbesked hvis data ikke kan hentes
            showUserListMessage(
                "Kunne ikke hente brugere fra databasen"
            );
        });
}

// QE-325: Vis brugere i tabel eller liste på admin-dashboard
// QE-330: Viser brugernavn og rolle korrekt fra database
function displayUsers(users) {

    const tableBody = document.getElementById("usersTableBody");

    tableBody.innerHTML = "";

    // QE-327: Håndterer tom liste
    if (!Array.isArray(users) || users.length === 0) {
        showUserListMessage("Der er ingen brugere");
        return;
    }

    // QE-326: Fjerner loading besked når data er hentet
    showUserListMessage("");

    // QE-325 & QE-330: Viser hver bruger i tabellen
    users.forEach(user => {

        const row = document.createElement("tr");

        // QE-330: Viser ID, brugernavn og rolle fra database
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${getRoleBadge(user.role)}</td>
            <td>
                <button class="delete-business-btn">
                    Slet
                </button>
            </td>
        `;

        // QE-328: Event listener til slet-knap
        row
            .querySelector(".delete-business-btn")
            .addEventListener("click", function () {
                confirmDeleteUser(user.id, user.username);
            });

        tableBody.appendChild(row);
    });
}

// QE-330: Pæn visning af roller med farver
function getRoleBadge(role) {
    const roleColors = {
        'ADMIN': '#dc3545',    // Rød
        'DRIVER': '#007bff',   // Blå
        'BUSINESS': '#28a745'  // Grøn
    };

    const color = roleColors[role] || '#6c757d';

    return `<span style="background:${color};color:white;padding:4px 10px;border-radius:4px;font-weight:bold;">${role}</span>`;
}

// Bekræftelsesdialog før sletning
function confirmDeleteUser(userId, username) {

    const confirmed = confirm(`Er du sikker på, at du vil slette brugeren "${username}"?`);

    if (!confirmed) {
        return;
    }

    deleteUser(userId, username);
}

// QE-328: Sletter bruger og opdaterer listen automatisk
function deleteUser(userId, username) {

    const token = getToken();

    fetch(BASE_URL + "/admin/users/" + userId, {
        method: "DELETE",
        headers: {
            "Authorization": `${token}` // JWT authentication
        }
    })
        .then(res => {

            // QE-327: Fejlhåndtering ved sletning
            if (!res.ok) {
                return res.text().then(errorMessage => {
                    throw new Error(errorMessage);
                });
            }

            return res.text();
        })
        .then(() => {

            showUserListMessage(`Bruger "${username}" slettet`);

            document.getElementById("editUserContainer").innerHTML = "";

            // QE-328: Opdaterer listen automatisk efter sletning
            loadAllUsers();
        })
        .catch(error => {

            console.log(error);

            // QE-327: Viser fejlbesked
            showUserListMessage("Fejl: " + error.message);
        });
}

// QE-326 & QE-327: Viser loading eller fejlbeskeder
function showUserListMessage(message) {

    document
        .getElementById("userListMessage")
        .textContent = message;
}