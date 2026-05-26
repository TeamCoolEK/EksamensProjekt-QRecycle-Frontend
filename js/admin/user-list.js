// admin/user-list.js

// QE-42: user-list.js tilføjet - Admin kan se alle brugere
// QE-319: Admin-side til brugeradministration
import { BASE_URL } from "../../config.js";

export function initAdminUserList() {
    renderAdminUserListPage();
}

// QE-319 & QE-325: Renderer siden med liste/tabel
function renderAdminUserListPage() {

    document.getElementById("app").innerHTML = `
    
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
        
        <!--QE-210 og QE-327: Succes/fejl beskeder vises her -->
        <!-- QE-326: Loading state -->
        <p id="userListMessage">Indlæser brugere...</p>
        
        <!-- QE-325: Tabel til visning af brugere -->
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Brugernavn</th>
                    <th>Rolle</th>
                    <th>Handling</th>
                </tr>
            </thead>
            
            <tbody id="usersTableBody"></tbody>
        </table>

        <div id="editUserContainer"></div>
    `;

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
                "Kunne ikke hente brugere fra databasen");
        });
}

// QE-325: Vis brugere i tabel eller liste på admin-dashboard
// QE-330: Viser brugernavn og rolle korrekt fra database
// QE-208: Tilføj slet-knap til hver bruger
// QE-207: Vis brugerne i tabel med valgbare rækker
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

        //QE-207: Gør rækkerne visuelt valgbare ved hover
        row.style.cursor = "pointer";
        row.addEventListener("mouseenter", () => {
            row.style.backgroundColor = "#f5f5f5";
        });
        row.addEventListener("mouseleave", () => {
            row.style.backgroundColor = "";
        });

        // QE-208: skjul slet-knap for ADMIN brugere
        const isProtected = user.role==='ADMIN';
        const deleteButton = isProtected
            ? `<span style="color:#999;font-size:12px;">🔒 Beskyttet</span>`
            : `<button class="delete-business-btn" onclick="confirmDeleteUser(${user.id}, '${user.username}')">🗑️ Slet</button>`;

        // QE-330: Viser ID, brugernavn og rolle fra database
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${getRoleBadge(user.role)}</td>
            <td>${deleteButton}</td>
                <!--<button class="delete-business-btn">
                    Slet
                </button>
            </td>-->
        `;

        // QE-328: Event listener til slet-knap
        /*row
            .querySelector(".delete-user-btn")
            .addEventListener("click", function () {
                confirmDeleteUser(user.id, user.username);
            });*/

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

// QE-209: Bekræftelsesdialog før sletning
window.confirmDeleteUser = function(userId, username) {

    const confirmed = confirm(`Er du sikker på, at du vil slette brugeren "${username}"?`);
    if (!confirmed) {
        return;
    }
    //QE-213: Kald delete funktionen
    deleteUser(userId, username);
}
// QE-206 og QE-213: Integrer API-kald til sletning
// QE-328: Sletter bruger og opdaterer listen automatisk
function deleteUser(userId, username) {

    const token = getToken();

    // QE-213: Vis loading state
    showUserListMessage(`Sletter bruger "${username}"...`);

    // QE-205: API kald til DELETE endpoint
    fetch(BASE_URL + "/admin/users/" + userId, {
        method: "DELETE",
        headers: {
            "Authorization": `${token}` // JWT authentication
        }
    })
        .then(res => {

            // QE-327: Fejlhåndtering ved sletning og QE-213: håndter fejl states
            if (!res.ok) {
                return res.text().then(errorMessage => {
                    throw new Error(errorMessage);
                });
            }

            return res.text();
        })
        .then(() => {
            // QE-210: Vis succesbesked
            showUserListMessage
            (`Bruger "${username}" blev slettet`, "green"
            );

            document.getElementById("editUserContainer").innerHTML = "";

            // QE-328: Opdaterer listen automatisk efter sletning
            setTimeout(() => {
                loadAllUsers();
            }, 1500);
        })
        .catch(error => {

            console.log(error);

            // QE-327 og QE-213: Viser fejlbesked
            showUserListMessage(
                `Fejl ved sletning: ${error.message}`,
                "red"
            );
        });
}

// QE-326 & QE-327: Viser loading eller fejlbeskeder
// QE-210: Vis beskeder til admin
function showUserListMessage(message, color = "black") {

    const msgElement = document.getElementById("userListMessage");
    msgElement.textContent = message;
    msgElement.style.color = color;

    // Ryd besked efter 5 sekunder (undtagen loading/error)
    if (color === "green") {
        setTimeout(() => {
            msgElement.textContent = "";
        }, 5000);
    }
}