import { BASE_URL } from '../../config.js';

// Renderer siden til oprettelse af virksomheder
function renderBusinessPage() {

    document.getElementById("app").innerHTML = `

        <h1>Opret virksomhed</h1>
        <form id="createBusinessForm">
            <input
                id="companyName"
                type="text"
                placeholder="Virksomhedsnavn"
            >

            <input
                id="contactPerson"
                type="text"
                placeholder="Kontaktperson"
            >

            <input
                id="phoneNumber"
                type="text"
                placeholder="Telefonnummer"
            >

            <input
                id="address"
                type="text"
                placeholder="Adresse"
            >

            <input
                id="username"
                type="text"
                placeholder="Brugernavn"
            >

            <button type="submit">
                Opret virksomhed
            </button>

        </form>

        <p id="businessMessage"></p>
    `;

    setupBusinessEvents();
}

// Opretter events til business funktionalitet
function setupBusinessEvents() {

    document
        .getElementById("createBusinessForm")
        .addEventListener("submit", handleCreateBusinessSubmit);
}

// Håndterer submit af formular
async function handleCreateBusinessSubmit(event) {

    event.preventDefault();
    const business = buildBusinessObject();

    if (!validateBusiness(business)) {
        showBusinessMessage("Udfyld alle felter");
        return;
    }

    saveBusiness(business);
}

// Bygger business objekt fra inputfelter
function buildBusinessObject() {

    return {
        companyName: document.getElementById("companyName").value,
        contactPerson: document.getElementById("contactPerson").value,
        phoneNumber: document.getElementById("phoneNumber").value,
        address: document.getElementById("address").value,
        username: document.getElementById("username").value
    };
}

// Validerer business data
function validateBusiness(business) {

    return business.companyName.trim() !== ""
        && business.contactPerson.trim() !== ""
        && business.phoneNumber.trim() !== ""
        && business.address.trim() !== ""
        && business.username.trim() !== "";
}


// Sender business til backend API
function saveBusiness(business) {

    fetch(BASE_URL + "/admin/businesses", {

        method: "POST",
        headers: {
            "Content-Type": "application/json"
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
            showBusinessMessage("Virksomhed oprettet");
            addBusinessToList(createdBusiness);

            document
                .getElementById("createBusinessForm")
                .reset();
        })

        .catch(err => {

            console.log(err);
            showBusinessMessage("Fejl ved oprettelse");
        });
}

// Tilføjer virksomhed til listen på siden
function addBusinessToList(business) {

    const businessList = document.getElementById("businessList");
    const li = document.createElement("li");

    li.textContent =
        business.companyName
        + " - "
        + business.address;

    businessList.appendChild(li);
}

// Viser besked til brugeren
function showBusinessMessage(message) {

    document
        .getElementById("businessMessage")
        .textContent = message;
}