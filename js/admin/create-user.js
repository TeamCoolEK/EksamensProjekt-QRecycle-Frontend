import { BASE_URL } from "../../config.js";
import { initAdminUserList } from "./user-list.js";
import { renderAdminNavbar, setupAdminNavbarEvents } from "./admin-navbar.js";

export function initCreateUser() {
    renderAdminUserPage();
}

// Renderer siden til oprettelse af brugere
export function renderAdminUserPage() {

    document.getElementById("app").innerHTML = `

<<<<<<< HEAD
        ${renderAdminNavbar("Opret bruger")}
        
        <div class="business-actions">
            <button id="backToUserListBtn">
                Tilbage til brugerliste
            </button>
        </div>
=======
        ${renderAdminNavbar("Bruger")}
>>>>>>> 7dade4d6e6bc8a041bc80c093b3ac1b59576a232

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
    `;

    setupAdminNavbarEvents();
    setupUserEvents();
}

function setupUserEvents() {

    document
        .getElementById("createUserForm")
        .addEventListener("submit", handleCreateUserSubmit);

    document
        .getElementById("backToUserListBtn")
        .addEventListener("click", initAdminUserList);
}

async function handleCreateUserSubmit(event) {

    event.preventDefault();

    const user = buildUserObject();

    const validationMessage = validateUser(user);

    if (validationMessage !== "") {
        showUserMessage(validationMessage);
        return;
    }

    saveUser(user);
}

function buildUserObject() {

    return {
        username: document.getElementById("username").value,
        password: document.getElementById("password").value,
        role: document.getElementById("role").value
    };
}

function validateUser(user) {

    const errors = [];

    if (user.username.trim() === "") {
        errors.push("brugernavn");
    }

    if (user.password.trim() === "") {
        errors.push("password");
    }

    if (user.role.trim() === "") {
        errors.push("rolle");
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

async function saveUser(user) {

    const token = localStorage.getItem("jwt");

    try {

        const res = await fetch(BASE_URL + "/admin/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token
            },
            body: JSON.stringify(user)
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(
                data.error ||
                data.message ||
                "Brugeren kunne ikke oprettes"
            );
        }

        document
            .getElementById("createUserForm")
            .reset();

        showSuccessAnimation();

    } catch (err) {

        console.log(err);

        showUserMessage("Fejl: " + err.message);
    }
}

function showSuccessAnimation() {

    const emoji = document.createElement("div");

    emoji.classList.add("success-emoji");

    emoji.textContent = "👍";

    document.body.appendChild(emoji);

    setTimeout(() => {
        emoji.classList.add("fade-out");
    }, 1000);

    setTimeout(() => {
        initAdminUserList();
    }, 1600);
}

function showUserMessage(message) {

    document
        .getElementById("userMessage")
        .textContent = message;
}