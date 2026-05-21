import { BASE_URL } from "../../config.js";
import{renderAdminNavbar, setupAdminNavbarEvents} from "./admin-navbar.js";

export function initCreateUser() {
    renderAdminUserPage();
}

// Renderer siden til oprettelse af brugere
export function renderAdminUserPage() {

    // Indsætter HTML i app containeren
    document.getElementById("app").innerHTML = `

        ${renderAdminNavbar("Statestik")}

        <h1>Opret bruger</h1>

        <form id="createUserForm">

            <input
                id="username"
                type="text"
                placeholder="Brugernavn"
            >

            <input
                id="password"
                type="password"
                placeholder="Password"
            >

            <select id="role">
                <option value="">Vælg rolle</option>
                <option value="ADMIN">Admin</option>
                <option value="DRIVER">Chauffør</option>
            </select>

            <button type="submit">
                Opret bruger
            </button>

        </form>

        <p id="userMessage"></p>

        <h2>Brugerliste</h2>
        <ul id="userList"></ul>
    `;

    setupAdminNavbarEvents()

    // Starter event listeners
    setupUserEvents();
}

// Opretter events til bruger-formularen
function setupUserEvents() {

    document
        .getElementById("createUserForm")
        .addEventListener("submit", handleCreateUserSubmit);
}


// Håndterer submit af opret bruger-formular
async function handleCreateUserSubmit(event) {

    // Stopper siden fra at reloade
    event.preventDefault();

    // Bygger user objekt fra inputfelter
    const user = buildUserObject();

    // Validerer input
    if (!validateUser(user)) {
        showUserMessage("Udfyld alle felter");
        return;
    }

    // Sender bruger til backend
    saveUser(user);
}

// Bygger user objekt fra formularen
function buildUserObject() {

    return {
        username: document.getElementById("username").value,
        password: document.getElementById("password").value,
        role: document.getElementById("role").value
    };
}

// Validerer user data
function validateUser(user) {

    return user.username.trim() !== ""
        && user.password.trim() !== ""
        && user.role.trim() !== "";
}

// Sender user til backend API
function saveUser(user) {
    const token = localStorage.getItem("jwt");

    fetch(BASE_URL + "/admin/users", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token
        },
        body: JSON.stringify(user)
    })

        .then(res => {
            if (!res.ok) {
                return res.text().then(errorMessage => {
                    throw new Error(errorMessage);
                });
            }

            return res.json();
        })

        .then(createdUser => {
            showUserMessage("Bruger oprettet");

            addUserToList(createdUser);

            document
                .getElementById("createUserForm")
                .reset();
        })

        .catch(err => {
            console.log(err);

            showUserMessage("Fejl: " + err.message);
        });
}

// Tilføjer oprettet bruger til listen på siden
function addUserToList(user) {

    const userList = document.getElementById("userList");
    const li = document.createElement("li");
    li.textContent = user.username + " - " + user.role;

    userList.appendChild(li);
}

// Viser besked til brugeren
function showUserMessage(message) {

    document
        .getElementById("userMessage")
        .textContent = message;
}