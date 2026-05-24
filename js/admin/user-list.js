// admin/user-list.js

import { BASE_URL } from "../../config.js";
import { initCreateUser } from "./create-user.js";

export function initAdminUserList() {
    renderAdminUserListPage();
}

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

    setupPageEvents();
    loadAllUsers();
}

function setupPageEvents() {

    document
        .getElementById("backToDashboardBtn")
        .addEventListener("click", function() {
            window.location.hash = "#/admin/dashboard";
        });

    document
        .getElementById("createUserBtn")
        .addEventListener("click", initCreateUser);
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

            if (!res.ok) {
                throw new Error("Kunne ikke hente brugere");
            }

            return res.json();
        })
        .then(users => {
            displayUsers(users);
        })
        .catch(error => {

            console.log(error);

            showUserListMessage(
                "Kunne ikke hente brugere fra databasen"
            );
        });
}

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

        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${getRoleBadge(user.role)}</td>
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
                showEditUserForm(user);
            });

        row
            .querySelector(".delete-business-btn")
            .addEventListener("click", function () {
                confirmDeleteUser(user.id, user.username);
            });

        tableBody.appendChild(row);
    });
}

function getRoleBadge(role) {

    const roleColors = {
        "ADMIN": "#dc3545",
        "DRIVER": "#007bff",
        "BUSINESS": "#28a745"
    };

    const color = roleColors[role] || "#6c757d";

    return `<span style="background:${color};color:white;padding:4px 10px;border-radius:4px;font-weight:bold;">${role}</span>`;
}

function showEditUserForm(user) {

    document.getElementById("editUserModal").style.display = "flex";

    document.getElementById("editUserContainer").innerHTML = `

        <div style="display:flex;justify-content:space-between;align-items:center;">
            <h2>Rediger bruger</h2>

            <button id="closeEditUserModalBtn" type="button">
                X
            </button>
        </div>

        <form id="editUserForm">

            <input
                id="editUsername"
                type="text"
                placeholder="Brugernavn"
                value="${user.username}"
            >

            <input
                id="editPassword"
                type="password"
                placeholder="Ny password"
            >

            <div class="business-actions">
                <button type="submit">
                    Gem ændringer
                </button>

                <button id="cancelEditUserBtn" type="button">
                    Annuller
                </button>
            </div>

        </form>
    `;

    document
        .getElementById("editUserForm")
        .addEventListener("submit", function (event) {
            handleEditUserSubmit(event, user.id);
        });

    document
        .getElementById("cancelEditUserBtn")
        .addEventListener("click", closeEditUserModal);

    document
        .getElementById("closeEditUserModalBtn")
        .addEventListener("click", closeEditUserModal);
}

function handleEditUserSubmit(event, userId) {

    event.preventDefault();

    const updatedUser = buildUpdatedUserObject();

    const validationMessage = validateUpdatedUser(updatedUser);

    if (validationMessage !== "") {
        showUserListMessage(validationMessage);
        return;
    }

    updateUser(userId, updatedUser);
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

function confirmDeleteUser(userId, username) {

    const confirmed = confirm(`Er du sikker på, at du vil slette brugeren "${username}"?`);

    if (!confirmed) {
        return;
    }

    deleteUser(userId, username);
}

function deleteUser(userId, username) {

    const token = getToken();

    fetch(BASE_URL + "/admin/users/" + userId, {
        method: "DELETE",
        headers: {
            "Authorization": `${token}`
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

            closeEditUserModal();

            loadAllUsers();
        })
        .catch(error => {

            console.log(error);

            showUserListMessage("Fejl: " + error.message);
        });
}

function closeEditUserModal() {

    document.getElementById("editUserModal").style.display = "none";

    document.getElementById("editUserContainer").innerHTML = "";
}

function showUserListMessage(message) {

    document
        .getElementById("userListMessage")
        .textContent = message;
}