export function initAdminBuisnessList(content) {
    renderAdminBusinessListPage(content)
}
// Renderer siden med liste over alle virksomheder
function renderAdminBusinessListPage(content) {

    // Indsætter HTML i app containeren
    content.innerHTML = `

        <h1>Virksomhedsadministration</h1>

        <div class="business-actions">
            <button onclick="renderAdminDashboardPage()">
                Tilbage til dashboard
            </button>

            <button onclick="renderBusinessPage()">
                Opret virksomhed
            </button>
        </div>

        <h2>Alle virksomheder</h2>

        <p id="businessListMessage">Indlæser virksomheder...</p>

        <table>
            <thead>
                <tr>
                    <th>Virksomhedsnavn</th>
                    <th>Kontaktperson</th>
                    <th>Telefonnummer</th>
                    <th>Adresse</th>
                    <th>Handling</th>
                </tr>
            </thead>

            <tbody id="businessTableBody"></tbody>
        </table>

        <div id="editBusinessContainer"></div>
    `;

    // Henter alle virksomheder når siden vises
    loadAllBusinesses();
}

// Henter alle virksomheder fra backend
function loadAllBusinesses() {

    // Sender GET request til admin endpoint
    fetch(BASE_URL + "/admin/businesses", {
        method: "GET",
        credentials: "include"
    })
        .then(res => {

            // Tjekker om request fejlede
            if (!res.ok) {
                throw new Error("Kunne ikke hente virksomheder");
            }

            // Konverterer response til JSON
            return res.json();
        })
        .then(businesses => {

            // Viser virksomhederne i tabellen
            displayBusinesses(businesses);
        })
        .catch(error => {

            // Logger fejl i console
            console.log(error);

            // Viser fejlbesked på siden
            document.getElementById("businessListMessage").textContent =
                "Kunne ikke hente virksomheder fra databasen";
        });
}

// Viser virksomheder i tabellen
function displayBusinesses(businesses) {

    // Finder table body
    const tableBody = document.getElementById("businessTableBody");

    // Finder besked element
    const messageElement = document.getElementById("businessListMessage");

    // Rydder tabellen før den fyldes igen
    tableBody.innerHTML = "";

    // Hvis der ikke findes virksomheder
    if (businesses.length === 0) {
        messageElement.textContent = "Der er ingen virksomheder";
        return;
    }

    // Fjerner loading besked
    messageElement.textContent = "";

    // Gennemgår alle virksomheder
    businesses.forEach(business => {

        // Opretter en ny tabelrække
        const row = document.createElement("tr");

        // Indsætter virksomhedsdata i rækken
        row.innerHTML = `
            <td>${business.companyName}</td>
            <td>${business.contactPerson}</td>
            <td>${business.phoneNumber}</td>
            <td>${business.address}</td>
            <td>
                <button onclick='showEditBusinessForm(${JSON.stringify(business)})'>
                    Rediger
                </button>
                <button onclick="confirmDeleteBusiness(${business.id})">
                 Slet
                 </button>
            </td>
        `;

        // Tilføjer rækken til tabellen
        tableBody.appendChild(row);
    });
}

// Viser formular til redigering af virksomhed
function showEditBusinessForm(business) {

    // Indsætter redigeringsformular med eksisterende virksomhedsdata
    document.getElementById("editBusinessContainer").innerHTML = `

        <h2>Rediger virksomhed</h2>

        <form id="editBusinessForm">

            <input
                id="editCompanyName"
                type="text"
                value="${business.companyName}"
                placeholder="Virksomhedsnavn"
            >

            <input
                id="editContactPerson"
                type="text"
                value="${business.contactPerson}"
                placeholder="Kontaktperson"
            >

            <input
                id="editPhoneNumber"
                type="text"
                value="${business.phoneNumber}"
                placeholder="Telefonnummer"
            >

            <input
                id="editAddress"
                type="text"
                value="${business.address}"
                placeholder="Adresse"
            >

            <button type="submit">
                Gem ændringer
            </button>

            <button type="button" onclick="cancelEditBusiness()">
                Annuller
            </button>
        </form>
    `;

    // Tilføjer submit event til formularen
    document
        .getElementById("editBusinessForm")
        .addEventListener("submit", function (event) {

            // Sender event og business id videre
            handleUpdateBusinessSubmit(event, business.id);
        });
}

// Håndterer submit af redigeringsformular
function handleUpdateBusinessSubmit(event, businessId) {

    // Stopper siden fra at reloade
    event.preventDefault();

    // Bygger objekt med opdaterede virksomhedsdata
    const updatedBusiness = {
        companyName: document.getElementById("editCompanyName").value,
        contactPerson: document.getElementById("editContactPerson").value,
        phoneNumber: document.getElementById("editPhoneNumber").value,
        address: document.getElementById("editAddress").value
    };

    // Validerer at alle felter er udfyldt
    if (!validateUpdatedBusiness(updatedBusiness)) {
        document.getElementById("businessListMessage").textContent =
            "Alle felter skal udfyldes";
        return;
    }

    // Sender opdaterede data til backend
    updateBusiness(businessId, updatedBusiness);
}

// Validerer redigeret virksomhedsdata
function validateUpdatedBusiness(business) {

    // Returnerer true hvis alle felter er udfyldt
    return business.companyName.trim() !== ""
        && business.contactPerson.trim() !== ""
        && business.phoneNumber.trim() !== ""
        && business.address.trim() !== "";
}

// Sender opdateret virksomhed til backend
function updateBusiness(businessId, updatedBusiness) {

    // Sender PUT request til backend
    fetch(BASE_URL + "/admin/businesses/" + businessId, {
        method: "PUT",

        headers: {
            "Content-Type": "application/json"
        },

        credentials: "include",

        body: JSON.stringify(updatedBusiness)
    })
        .then(res => {

            // Hvis request fejler, læses fejlbesked fra backend
            if (!res.ok) {
                return res.text().then(errorMessage => {
                    throw new Error(errorMessage);
                });
            }

            // Konverterer response til JSON
            return res.json();
        })
        .then(() => {

            // Viser bekræftelse til admin
            document.getElementById("businessListMessage").textContent =
                "Virksomhed opdateret";

            // Fjerner redigeringsformularen
            document.getElementById("editBusinessContainer").innerHTML = "";

            // Henter listen igen så opdaterede oplysninger vises
            loadAllBusinesses();
        })
        .catch(error => {

            // Logger fejl i console
            console.log(error);

            // Viser fejlbesked på siden
            document.getElementById("businessListMessage").textContent =
                "Fejl: " + error.message;
        });
}

// Annullerer redigering
function cancelEditBusiness() {

    // Fjerner redigeringsformularen
    document.getElementById("editBusinessContainer").innerHTML = "";
}

// Viser bekræftelsesdialog før sletning
function confirmDeleteBusiness(businessId) {

    // Spørger admin om virksomheden skal slettes
    const confirmed = confirm("Er du sikker på, at du vil slette virksomheden?");

    // Stopper funktionen hvis admin trykker annuller
    if (!confirmed) {
        return;
    }

    // Kalder delete funktionen hvis admin bekræfter
    deleteBusiness(businessId);
}

// Sletter virksomhed fra backend
function deleteBusiness(businessId) {

    // Sender DELETE request til backend
    fetch(BASE_URL + "/admin/businesses/" + businessId, {
        method: "DELETE", credentials: "include"
    })
        .then(res => {

            // Hvis request fejler, læses fejlbesked fra backend
            if (!res.ok) {
                return res.text().then(errorMessage => {
                    throw new Error(errorMessage);
                });
            }

            // Returnerer tekst response fra backend
            return res.text();
        })
        .then(() => {

            // Viser bekræftelse til admin
            document.getElementById("businessListMessage").textContent =
                "Virksomhed slettet";

            // Fjerner eventuel redigeringsformular
            document.getElementById("editBusinessContainer").innerHTML = "";

            // Henter listen igen så virksomheden fjernes fra visningen
            loadAllBusinesses();
        })
        .catch(error => {

            // Logger fejl i console
            console.log(error);

            // Viser fejlbesked på siden
            document.getElementById("businessListMessage").textContent =
                "Fejl: " + error.message;
        });
}