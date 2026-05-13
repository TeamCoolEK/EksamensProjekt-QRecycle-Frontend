import { BASE_URL } from '../../config.js';

export function initBusinessDashboard() {
    renderBusinessPickupPage()
}

//Renderer siden til markering af pant som klar//
function renderBusinessPickupPage() {

    document.getElementById("app").innerHTML = `
        
        <h1>Markér pant klar til afhentning</h1>
        
        <div id="currentStatus" class="status-container">
        <p>Henter status...</p>
        </div>
        
        <form id="pickupForm">
            
            <!-- QE-74: Input felt til antal poser -->
            <label for="bagsInput">Antal pant poser:</label>
            <input
                id="bagsInput"
                type="number"
                value="1"
                min="1"
                placeholder="Indtast antal pant poser"
            >
            
            <!-- QE-73: Knap til at markere klar -->
            <button type="submit">
                Markér klar til afhentning
            </button>
            
        </form>
        
        <!-- QE-83: Besked til brugeren -->
        <p id="pickupMessage"></p>
        
        <!-- Viser nuværende status (QE-83) -->
        <div id="currentStatus"></div>
    `;

    //Starter event listeners//
    setupPickupEvents();

    //Hent og vis nuværende status//
    loadCurrentStatus();

}

//Opretter events til pickup formularen//

function setupPickupEvents() {

    document
        .getElementById("pickupForm")
        .addEventListener("submit", handlePickupSubmit);

    //Validering af input felt//
    document
        .getElementById("bagsInput")
        .addEventListener("input", validateBagsInput);
}

//Sikrer at input altid er mindst 1//
function validateBagsInput() {

    const input = document.getElementById("bagsInput");

    if (input.value < 1) {
        input.value = 1;
    }
}

//Hent og vis nuværende status ved page load//
function loadCurrentStatus() {

    //Hent collectionId fra logged in bruger// OBS Slet ?//
    const collectionId = 1;

    fetch(BASE_URL + "/virksomhed/afhentning/" + collectionId,{
        method: "GET"
    })

        .then(res => {

            if(!res.ok) {
                throw new Error("kunne ikke finde afhentning");
            }

            return res.json();
        })

        .then(collection => {
            //Vis status på siden//
            displayCurrentStatus(collection);
        })

        .catch(err=> {
        console.log("Fejl ved afhentning af status:", err);

        document.getElementById("currentStatus").innerHTML =`
          <div class="status-error">
            <p>⚠️ Kunne ikke hente status</p>
            <p class="error-detail">${err.message}</p>
          </div>
        `;
    });
}


//Håndterer submit af pickup formular//

async function handlePickupSubmit(event) {
    //Stopper siden fra at reloade//
    event.preventDefault();
    //Bygger pickup objekt fra inputfelterne//
    const pickupData = buildPickupObject();
    //Validerer input//
    if(!validatePickup(pickupData)){
        showPickupMessage("Antal poser skal være mindst 1");
        return;
    }

    //Sender til backend//
    savePickup(pickupData);
}

//Bygger pickup objekt fra HTML formularen, der skal sendes som JSON til backend API'et//
function buildPickupObject() {
    //Return statement - returnerer objekt//
    return {
        //mangler? hente collectionId fra logged in bruger//
        //Hardcoded til 1, til test, indil login er implementeret - SKAL SLETTES HER//
        //HUSK at slette//
        collectionId: 1,

        businessBags: Number(document.getElementById("bagsInput").value)
    };
}


//Validerer pickup data//
function validatePickup(pickupData){
    return pickupData.businessBags >= 1;

}

//Sender pickup til backend API//
function savePickup(pickupData) {
    fetch(BASE_URL + "/virksomhed/afhentning/klar", {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(pickupData)
    })
        .then(res => {
            //Tjekker om request fejlede//
            if(!res.ok) {
                //Læs fejlbesked fra backend//
                return res.text().then(errorMsg => {
                    throw new Error(errorMsg);
                });
            }
            //Konverterer response til JSON//
            return res.json();
        })

        .then(updatedCollection => {

            //Viser succesbesked//
            showPickupMessage(
                "Pant markeret klar til afhentning! " +
                "Antal poser: " + updatedCollection.businessBags
            );

            //Opdater status visning//
            displayCurrentStatus(updatedCollection);

            console.log("Opdateret mængde pant klar: ", updatedCollection);
        })

        .catch(err => {

            console.log(err);

            //Viser fejlbesked fra backend//
            showPickupMessage("Fejl" + err.message)      //OBS Evt ændre//
        });
}

//Viser besked til brugeren//
function showPickupMessage(message) {

    const messageElement  = document.getElementById("pickupMessage");
    messageElement.textContent = message;

    //Fjerner besked efter 5 sekunder//
    setTimeout(() => {
        messageElement.textContent = "";
    }, 5000);
}


//Viser nuværende eller opdateret status på siden//
function displayCurrentStatus(collection) {

    const statusDiv = document.getElementById("currentStatus");

    //Status enum oversat til brugervenlig tekst//
    const statusTexts = {
        'IKKE_KLAR': 'Ikke klar',
        'KLAR': 'Klar til afhentning',
        'AFHENTET': 'Afhentet'
    };

    const statusText = statusTexts[collection.status] || collection.status;

    const statusClass = getStatusClass(collection.status);

    statusDiv.innerHTML = `
      <div class="status-card ${statusClass}">
          <h3>Nuværende status</h3>
          <p class="status-value">${statusText}</p>
          <div class="status-details">
              <p>Antal pant poser: <strong>${collection.businessBags || 0}</strong></p>
              ${collection.date ? `<p>Dato: ${formatDate(collection.date)}</p>` : ''}
          </div>
      </div>
    `;
}


//Reurnerer CSS klasse baseret på status//
function getStatusClass(status) {

    const classMap = {
        'IKKE_KLAR': 'status-not-ready',
        'KLAR': 'status-ready',
        'AFHENTET': 'status-picked-up'
    };

    return classMap[status] || '';
}

function formatDate(dateString) {

    const date = new Date(dateString);

    return date.toLocaleDateString('da-DK', {
        day:'numeric',
        month:'long',
        year: 'numeric'
    });
}