import { BASE_URL } from "../../config.js";
import { renderAdminNavbar, setupAdminNavbarEvents } from "./admin-navbar.js";

export function initCreateBusiness() {
    renderBusinessPage();
}

function renderBusinessPage() {

    document.getElementById("app").innerHTML = `

        ${renderAdminNavbar("Opret virksomhed")}

        <h1>Opret virksomhed</h1>

        <form id="createBusinessForm">
            <input id="companyName" type="text" placeholder="Virksomhedsnavn">
            <input id="contactPerson" type="text" placeholder="Kontaktperson">
            <input id="phoneNumber" type="text" placeholder="Telefonnummer">
            <input id="address" type="text" placeholder="Adresse">
            <input id="username" type="text" placeholder="Brugernavn">
            <input id="password" type="password" placeholder="Password">

            <button type="submit">
                Opret virksomhed
            </button>
        </form>

        <p id="businessMessage"></p>
    `;

    setupAdminNavbarEvents();
    setupBusinessEvents();
}

function setupBusinessEvents() {

    document
        .getElementById("createBusinessForm")
        .addEventListener("submit", handleCreateBusinessSubmit);
}

function handleCreateBusinessSubmit(event) {

    event.preventDefault();

    const business = buildBusinessObject();

    const validationMessage = validateBusiness(business);

    if (validationMessage !== "") {
        showBusinessMessage(validationMessage);
        return;
    }

    saveBusiness(business);
}

function buildBusinessObject() {

    return {
        companyName: document.getElementById("companyName").value,
        contactPerson: document.getElementById("contactPerson").value,
        phoneNumber: document.getElementById("phoneNumber").value,
        address: document.getElementById("address").value,
        username: document.getElementById("username").value,
        password: document.getElementById("password").value
    };
}

function validateBusiness(business) {

    const errors = [];

    if (business.companyName.trim() === "") errors.push("virksomhedsnavn");
    if (business.contactPerson.trim() === "") errors.push("kontaktperson");
    if (business.phoneNumber.trim() === "") errors.push("telefonnummer");
    if (business.address.trim() === "") errors.push("adresse");
    if (business.username.trim() === "") errors.push("brugernavn");
    if (business.password.trim() === "") errors.push("password");

    if (errors.length > 0) {
        return "Mangler: " + errors.join(", ");
    }

    const passwordErrors = [];

    if (business.password.length < 4) passwordErrors.push("minimum 4 tegn");
    if (!/[A-Z]/.test(business.password)) passwordErrors.push("stort bogstav");
    if (!/[a-z]/.test(business.password)) passwordErrors.push("lille bogstav");
    if (!/[0-9]/.test(business.password)) passwordErrors.push("tal");
    if (!/[^a-zA-Z0-9]/.test(business.password)) passwordErrors.push("specialtegn");

    if (passwordErrors.length > 0) {
        return "Password mangler: " + passwordErrors.join(", ");
    }

    return "";
}

function saveBusiness(business) {

    const token = localStorage.getItem("jwt");

    fetch(BASE_URL + "/admin/businesses", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `${token}`
        },
        body: JSON.stringify(business)
    })
        .then(res => {

            if (!res.ok) {
                throw new Error("Kunne ikke oprette virksomhed");
            }

            return res.json();
        })
        .then(createdBusiness => {

            console.log(createdBusiness);

            window.location.hash = "#/admin/businessList";
        })
        .catch(error => {

            console.log(error);

            showBusinessMessage("Fejl: " + error.message);
        });
}

function showBusinessMessage(message) {

    document
        .getElementById("businessMessage")
        .textContent = message;
}