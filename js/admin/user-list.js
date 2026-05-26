// admin/user-list.js

import {BASE_URL} from "../../config.js";
import {initCreateUser} from "./create-user.js";
import {renderAdminNavbar, setupAdminNavbarEvents} from "./admin-navbar.js";

let allUsers = []; //til at gemme alle users til søgebaren

export function initAdminUserList() {
    renderAdminUserListPage();
}

function renderAdminUserListPage() {

    document.getElementById("app").innerHTML = `

        ${renderAdminNavbar("")}
    
        <h1>Brugeradministration</h1>
       
        <div class="business-actions">
            <button id="backToDashboardBtn">
                Tilbage til dashboard
            </button>
            
            <button id="createUserBtn">
                Opret bruger
            </button>
        </div>
        
        <input 
            type="text"
            id="userSearchInput"
            placeholder="Søg efter brugernavn..."
            style="display: block; margin: 0 auto 12px auto; padding: 8px 12px; width: 100%; max-width: 300px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px;"
        /> <!-- search bar til at sotere efter navn -->
        
        <!--QE-210 og QE-327: Succes/fejl beskeder vises her -->
        <!-- QE-326: Loading state -->
        <p id="userListMessage">Indlæser brugere...</p>
        
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Brugernavn</th>
                    <th>Rolle</th>
                    <th>Handlinger</th>
                </tr>
            </thead>
            
            <tbody id="usersTableBody"></tbody>
        </table>

<div
    id="editUserModal"
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
        <div id="editUserContainer"></div>
    </div>
</div>
    `;
    setupAdminNavbarEvents();

    setupPageEvents();
    loadAllUsers();
}

function setupPageEvents() {

    document
        .getElementById("backToDashboardBtn")
        .addEventListener("click", function () {
            window.location.hash = "#/admin/dashboard";
        });

    document
        .getElementById("createUserBtn")
        .addEventListener("click", initCreateUser);

    document
        .getElementById("userSearchInput")
        .addEventListener("input", function () {
            filterUsers(this.value);
        });
}

function getToken() {
    return localStorage.getItem("jwt");
}

function loadAllUsers() {

    const token = getToken();

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
            allUsers = users;
            displayUsers(users);
        })
        .catch(error => {
            console.log(error);
            // QE-327: Viser fejlbesked hvis data ikke kan hentes
            showUserListMessage(
                "Kunne ikke hente brugere fra databasen");
        });
}
//Metode til at filtrere users i søgebaren
function filterUsers(query) {
    const trimmed = query.trim().toLowerCase();
    const filtered = trimmed === ""
        ? allUsers
        : allUsers.filter(user =>
            user.username.toLowerCase().includes(trimmed)
        );
    displayUsers(filtered);
}

// QE-325: Vis brugere i tabel eller liste på admin-dashboard
// QE-330: Viser brugernavn og rolle korrekt fra database
// QE-208: Tilføj slet-knap til hver bruger
// QE-207: Vis brugerne i tabel med valgbare rækker
function displayUsers(users) {

    const tableBody = document.getElementById("usersTableBody");
    tableBody.innerHTML = "";

    if (!Array.isArray(users) || users.length === 0) {
        showUserListMessage("Der er ingen brugere");
        return;
    }

    showUserListMessage("");

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
        const isProtected = user.role === "ADMIN";
        const deleteButton = isProtected
            ? `<span style="color:#999;font-size:12px;">🔒 Beskyttet</span>`
            : `<button class="delete-user-btn">🗑️ Slet</button>`;

        // QE-330: Viser ID, brugernavn og rolle fra database
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${getRoleBadge(user.role)}</td>
            <td>
                <button class="edit-user-btn">Rediger</button>
                ${deleteButton}
            </td>
        `;

        row
            .querySelector(".edit-user-btn")
            .addEventListener("click", function () {
                showEditUserForm(user);
            });

        // Only attach delete listener if button exists (non-ADMIN users)
        const deleteBtn = row.querySelector(".delete-user-btn");
        if (deleteBtn) {
            deleteBtn.addEventListener("click", function () {
                confirmDeleteUser(user.id, user.username);
            });
        }

        tableBody.appendChild(row);
    });
}

function getRoleBadge(role) {
    const roleColors = {
        "ADMIN": "#e74c3c",
        "DRIVER": "#1e293b",
        "BUSINESS": "var(--qr-green)"
    };

    const color = roleColors[role] || "#6c757d";

    return `<span style="background:${color};color:white;padding:4px 10px;border-radius:4px;font-weight:bold;">${role}</span>`;
}

function showEditUserForm(user) {

    document.getElementById("editUserModal").style.display = "flex";

    document.getElementById("editUserContainer").innerHTML = `
<div>
    <form id="editUserForm">

        <div id="editUserMessage" class="form-message"></div>

        <input id="editUsername" type="text" placeholder="Brugernavn" value="${user.username}">
        <input id="editPassword" type="password" placeholder="Ny password">

        <div class="business-actions">
            <button type="submit">Gem ændringer</button>
            <button id="cancelEditUserBtn" type="button">Annuller</button>
        </div>

    </form>
</div>
`;

    document
        .getElementById("editUserForm")
        .addEventListener("submit", function (event) {
            handleEditUserSubmit(event, user.id);
        });

    document
        .getElementById("cancelEditUserBtn")
        .addEventListener("click", closeEditUserModal);
}

function handleEditUserSubmit(event, userId) {

    event.preventDefault();

    const updatedUser = buildUpdatedUserObject();

    const validationMessage = validateUpdatedUser(updatedUser);

    if (validationMessage !== "") {
        showEditUserMessage(validationMessage);
        return;
    }

    updateUser(userId, updatedUser);
}

function showEditUserMessage(message) {
    const el = document.getElementById("editUserMessage");
    if (el) {
        el.textContent = message;
    }
}

function buildUpdatedUserObject() {

    return {
        username: document.getElementById("editUsername").value,
        password: document.getElementById("editPassword").value
    };
}

function validateUpdatedUser(user) {

    const errors = [];

    if (user.username.trim() === "") {
        errors.push("brugernavn");
    }

    if (user.password.trim() === "") {
        errors.push("password");
    }

    if (errors.length > 0) {
        return "Mangler: " + errors.join(", ");
    }

    const passwordErrors = [];

    if (user.password.length < 4) {
        passwordErrors.push("minimum 4 tegn");
    }

    if (!/[A-Z]/.test(user.password)) {
        passwordErrors.push("stort bogstav");
    }

    if (!/[a-z]/.test(user.password)) {
        passwordErrors.push("lille bogstav");
    }

    if (!/[0-9]/.test(user.password)) {
        passwordErrors.push("tal");
    }

    if (!/[^a-zA-Z0-9]/.test(user.password)) {
        passwordErrors.push("specialtegn");
    }

    if (passwordErrors.length > 0) {
        return "Password mangler: " + passwordErrors.join(", ");
    }

    return "";
}

function updateUser(userId, updatedUser) {

    const token = getToken();

    fetch(BASE_URL + "/admin/users/" + userId, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `${token}`
        },
        body: JSON.stringify(updatedUser)
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

            closeEditUserModal();

            loadAllUsers();
        })
        .catch(error => {

            console.log(error);

            showUserListMessage("Fejl: " + error.message);
        });
}

// QE-209: Bekræftelsesdialog før sletning
function confirmDeleteUser(userId, username) {

    const confirmed = confirm(`Er du sikker på, at du vil slette brugeren "${username}"?`);
    if (!confirmed) {
        return;
    }
    if (confirmed) {
        const confirmed2 = confirm(
            "⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️️\n" +
            "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ADVARSEL !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n" +
            "⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️️" +
            "\n" + "\n" +
            'ALLE AFGIFTER TILKNYTTET TIL BRUGEREN   \n' +
            "                        VIL BLIVE SLETTET!               \n" +
            "\n" +
            "           Er du heeeeeeelt sikker på du vil slette?\n" +
            "\n" +
            "⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️️\n" +
            "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ADVARSEL !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n" +
            "⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️️"
        );
        if (!confirmed2) {
            return;
        }
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
            "Authorization": `${token}`
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
            showUserListMessage(
                `Bruger "${username}" blev slettet`, "green"
            );

            document.getElementById("editUserContainer").innerHTML = "";

            // QE-328: Opdaterer listen automatisk efter sletning
            setTimeout(() => {
                loadAllUsers();
            }, 1500);

            closeEditUserModal();

            loadAllUsers();
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

    if (color === "green") {
        setTimeout(() => {
            msgElement.textContent = "";
        }, 5000);
    }
}

function closeEditUserModal() {

    document.getElementById("editUserModal").style.display = "none";

    document.getElementById("editUserContainer").innerHTML = "";
}