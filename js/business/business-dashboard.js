import { BASE_URL } from '../../config.js';
import { authFetch } from '../../utils.js';

export function initBusinessDashboard() {
    renderBusinessPickupPage();
}

// Renderer siden til markering af pant som klar
function renderBusinessPickupPage() {

    document.getElementById("app").innerHTML = `


        <!-- Navbar -->
        <nav class="navbar business-navbar">

            <span class="nav-title">
                Virksomhed
            </span>

            <div class="business-navbar-actions">

                <img
                    src="img/logo.png"
                    class="nav-logo business-logo-btn"
                    id="businessLogoBtn"
                    alt="Q Genbrug"
                >

                <button
                    id="businessLogoutBtn"
                    class="logout-btn"
                >
                    Log ud
                </button>

            </div>

        </nav>

        <div class="page-container">

            <h1>Markér pant klar til afhentning</h1>

            <div id="currentStatus" class="status-container">
                <p>Henter status...</p>
            </div>

            <form id="pickupForm">

                <label for="bagsInput">Antal pant poser:</label>

                <input
                    id="bagsInput"
                    type="number"
                    value="1"
                    min="1"
                    placeholder="Indtast antal pant poser"
                >

                <button type="submit">
                    Markér klar til afhentning
                </button>

            </form>

            <p id="pickupMessage"></p>

            <button
                id="cancelPickupBtn"
                class="btn-cancel hidden"
            >
                Annuller afhentning
            </button>

        </div>
    `;

    //Starter event listeners
    setupPickupEvents();
    loadCurrentStatus();
}

// Henter collection ID for den virksomhed, der er logget ind
async function getMyCollectionId() {

    const response = await authFetch(BASE_URL + "/business/me/collection", {
        method: "GET"
    });

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error("Kunne ikke hente collection");
    }

    const collection = await response.json();

    return collection.id;
}

function setupPickupEvents() {

    document
        .getElementById("pickupForm")
        .addEventListener("submit", handlePickupSubmit);

    document
        .getElementById("cancelPickupBtn")
        .addEventListener("click", handleCancelPickup);

    document
        .getElementById("businessLogoutBtn")
        .addEventListener("click", function () {

            localStorage.removeItem("jwt");

            window.location.hash = "#/login";
        });
}

async function loadCurrentStatus() {

    try {

        const collectionId = await getMyCollectionId();

        if (collectionId === null) {
            displayNoCollectionStatus();
            return;
        }

        const response = await authFetch(BASE_URL + "/business/collection/" + collectionId, {
            method: "GET"
        });

        if (!response.ok) {
            throw new Error("Kunne ikke finde afhentning");
        }

        const collection = await response.json();

        displayCurrentStatus(collection);

    } catch (err) {

        console.log("Fejl ved afhentning af status:", err);

        document.getElementById("currentStatus").innerHTML = `
            <div class="status-error">
                <p>Kunne ikke hente status</p>
                <p class="error-detail">${err.message}</p>
            </div>
        `;
    }
}

function displayNoCollectionStatus() {

    document.getElementById("currentStatus").innerHTML = `
        <div class="status-card status-not-ready">
            <h3>Nuværende status</h3>
            <p class="status-value">Ikke klar</p>
            <div class="status-details">
                <p>Antal pant poser: <strong>0</strong></p>
            </div>
        </div>
    `;

    const cancelBtn = document.getElementById("cancelPickupBtn");

    if (cancelBtn) {
        cancelBtn.classList.add("hidden");
    }
}

async function handlePickupSubmit(event) {

    event.preventDefault();

    const pickupData = await buildPickupObject();

    if (!validatePickup(pickupData)) {
        showPickupMessage("Antal poser skal være mindst 1");
        return;
    }

    savePickup(pickupData);
}

async function buildPickupObject() {

    const collectionId = await getMyCollectionId();

    return {
        collectionId: collectionId,
        businessBags: Number(document.getElementById("bagsInput").value)
    };
}

function validatePickup(pickupData) {
    return pickupData.businessBags >= 1;
}

function savePickup(pickupData) {

    authFetch(BASE_URL + "/business/collection/ready", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(pickupData)
    })
        .then(res => {

            if (!res.ok) {
                return res.text().then(errorMsg => {
                    throw new Error(errorMsg);
                });
            }

            return res.json();
        })
        .then(updatedCollection => {

            showPickupMessage(
                "Pant markeret klar til afhentning! " +
                "Antal poser: " + updatedCollection.businessBags
            );

            displayCurrentStatus(updatedCollection);

            console.log("Opdateret mængde pant klar: ", updatedCollection);
        })
        .catch(err => {

            console.log(err);

            showPickupMessage("Fejl: " + err.message);
        });
}

function showPickupMessage(message) {

    const messageElement = document.getElementById("pickupMessage");

    messageElement.textContent = message;

    setTimeout(() => {
        messageElement.textContent = "";
    }, 5000);
}

function displayCurrentStatus(collection) {

    const statusDiv = document.getElementById("currentStatus");

    const statusTexts = {
        "IKKE_KLAR": "Ikke klar",
        "KLAR": "Klar til afhentning",
        "AFHENTET": "Afhentet"
    };

    const statusText = statusTexts[collection.status] || collection.status;
    const statusClass = getStatusClass(collection.status);

    statusDiv.innerHTML = `
        <div class="status-card ${statusClass}">
            <h3>Nuværende status</h3>
            <p class="status-value">${statusText}</p>
            <div class="status-details">
                <p>Antal pant poser: <strong>${collection.businessBags || 0}</strong></p>
                ${collection.date ? `<p>Dato: ${formatDate(collection.date)}</p>` : ""}
            </div>
        </div>
    `;

    const cancelBtn = document.getElementById("cancelPickupBtn");

    if (cancelBtn) {
        if (collection.status === "KLAR") {
            cancelBtn.classList.remove("hidden");
        } else {
            cancelBtn.classList.add("hidden");
        }
    }


    function getStatusClass(status) {

        const classMap = {
            "IKKE_KLAR": "status-not-ready",
            "KLAR": "status-ready",
            "AFHENTET": "status-picked-up"
        };

        return classMap[status] || "";
    }

    function formatDate(dateString) {

        const date = new Date(dateString);

        return date.toLocaleDateString("da-DK", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

    async function handleCancelPickup() {

        if (!confirm("Er du sikker på at du vil annullere afhentningen?")) {
            return;
        }

        const cancelBtn = document.getElementById("cancelPickupBtn");
        const originalText = cancelBtn.textContent;

        try {

            cancelBtn.disabled = true;
            cancelBtn.textContent = "Annullerer...";

            const collectionId = await getMyCollectionId();

            if (collectionId === null) {
                showPickupMessage("Der er ingen aktiv afhentning at annullere");
                cancelBtn.disabled = false;
                cancelBtn.textContent = originalText;
                return;
            }

            const response = await authFetch(
                BASE_URL + "/business/collection/" + collectionId + "/cancel",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }

            const updatedCollection = await response.json();

            showPickupMessage("Afhentningen er annulleret");

            displayCurrentStatus(updatedCollection);

            cancelBtn.disabled = false;
            cancelBtn.textContent = originalText;

        } catch (error) {

            console.error("Fejl ved annullering:", error);

            showPickupMessage("Fejl: " + error.message);

            cancelBtn.disabled = false;
            cancelBtn.textContent = originalText;
        }
    }
}
