import { BASE_URL } from '../../config.js';
import { authFetch } from '../../utils.js'; //se forklaring i utils.js
import { checkLocationPermission, startTracking, stopTracking } from './driver-location.js';

export function initDriverDashboard() {
    renderDriverMap();
}

export function renderDriverExpenses() {
    renderDriverMap();
}

let map = null
let directionsService = null
let directionsRenderer = null
let collections = []
let tempIdCounter = 0
let locationInterval = null
let driverMarker = null
let userPanned = false
let driverPosition = null


// Fast slutpunkt for ruten
const ROUTE_DESTINATION = "Retortvej 38, 2500 Valby";

const TEMP_STOPS_KEY = "driverTempStops"

function renderDriverMap() {
    const app = document.getElementById('app');

    app.innerHTML = `
        <!-- Navigation bar -->
        <nav class="navbar">
            <button class="menu-btn" onclick="toggleMenu()">☰</button>

            <span class="nav-title">Dagens rute</span>

            <div class="driver-navbar-actions">
                <img
                    src="img/logo.png"
                    class="nav-logo driver-logo-btn"
                    id="driverLogoBtn"
                    alt="Q Genbrug"
                >

                <button id="driverLogoutBtn" class="logout-btn">
                    Log ud
                </button>
            </div>
        </nav>

        <div class="layout">

            <!-- Overlay til at lukke sidebar ved at klikke på kortet -->
            <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleMenu()"></div>

            <!-- Sidebar -->
            <div class="sidebar" id="sidebar">

                <!-- Sidebar header med lukkeknap -->
                <div class="sidebar-header">
                    <span>Luk sidepanel</span>
                    <button class="sidebar-close-btn" onclick="toggleMenu()">✕</button>
                </div>

                <!-- QE-174 (Loading-state): som vises indtil data med adresser er hentet fra backend. -->
                <div id="stopList">
                    <p>Henter afhentninger...</p>
                </div>
                
                <!-- Live lokation knap -->
                <button id="locationBtn" onclick="startTracking()" disabled>
                📍 Henter GPS...
                </button>
                
                <!-- Find mig knap — genaktiverer auto-center -->
                <button id="followBtn" onclick="followDriver()" style="display:none;">
               👀 Find mig
                </button>
                
                <!-- Start rute knap — zoomer ind på chaufføren og beregner rute -->
                <button id="routeBtn" onclick="startRoute()" style="display:none;">
                 🚀 Start rute
                </button>

                <!-- Tilføj ny adresse manuelt -->
                <div class="add-address">
                    <p>Tilføj midlertidig adresse?</p>
                    <input type="text" id="newAddress" placeholder="Indtast adresse">
                    <button onclick="addManualStop()">Tilføj</button>
                </div>

                <!-- Udgift knap -->
                <button class="expense-btn" onclick="window.location.hash='#/driver/createExpenses'">
                    Tilføj udgift
                </button>

            </div>

            <!-- Kort -->
            <div id="map"></div>

        </div>

        <!-- Pop-up til antal poser -->
        <div id="bagModal" style="display:none;">
            <div class="modal-box">
                <h3 id="modalTitle"></h3>
                <p id="modalAddress"></p>

                <label>Antal poser afhentet:</label>

                <input
                    type="number"
                    id="bagCount"
                    min="0"
                    placeholder="Antal poser"
                >

                <div class="modal-buttons">
                    <button onclick="confirmPickup()">Bekræft afhentning</button>
                    <button class="cancel-btn" onclick="closeModal()">Annuller</button>
                </div>
            </div>
        </div>
    `
    window.initMap = initMap
    window.toggleMenu = toggleMenu
    window.fetchAndBuildRoute = fetchAndBuildRoute
    window.addManualStop = addManualStop
    window.removeStop = removeStop
    window.onStopChecked = onStopChecked
    window.confirmPickup = confirmPickup
    window.closeModal = closeModal
    window.doneManualStop = doneManualStop
    window.startTracking = startTracking
    window.stopTracking = stopTracking
    window.addEventListener('beforeunload', stopTracking)
    window.startPolling = startPolling
    window.stopPolling = stopPolling
    window.followDriver = followDriver
    window.removeDriverMarker = removeDriverMarker
    window.zoomToDriver = zoomToDriver
    window.startRoute = startRoute


    loadGoogleMapsScript()
}

// Zoomer ind på chaufføren — bruges ved start sporing og følg mig
function zoomToDriver() {
    if (driverMarker !== null) {
        map.setCenter(driverMarker.getPosition())
        map.setZoom(20)
    }
}

function followDriver() {
    userPanned = false
    if (driverMarker !== null) {
        map.setCenter(driverMarker.getPosition())
    }
}


async function loadGoogleMapsScript() {
    const { apiKey } = await authFetch(BASE_URL + '/config/maps').then(r => r.json());
    if (document.getElementById('gmaps-script')) {
        // Tjek om Google Maps scriptet allerede er loadet -> hvis ja køres initMap() med det samme.
        //Ellers loades scriptet igen.
        await initMap()
        return
    }

    const script = document.createElement('script')
    script.id = 'gmaps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`
    script.async = true
    script.defer = true
    document.body.appendChild(script)
}

// Autocomplete funktion til at tilføje manuel adresse
function initAutocomplete() {
    const input = document.getElementById('newAddress');

    const autocomplete = new google.maps.places.Autocomplete(input, {
        componentRestrictions: { country: 'dk' },
        fields: ['formatted_address', 'name']
    });

    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();

        if (!place.formatted_address) {
            return;
        }

        input.value = place.formatted_address;
    });
}

// QE-169 (Opdater ved indlæsning). Implementeret via initMap,
// som kaldes automatisk, når kortet initialiseres ved sidens indlæsning.
async function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 55.6761, lng: 12.5683 },
        // Centrer kortet på København
        zoom: 11
        // Zoom niveau — højere tal = tættere på
    });

    directionsService = new google.maps.DirectionsService();
    // Service til at beregne ruter mellem adresser

    directionsRenderer = new google.maps.DirectionsRenderer();
    // Renderer til at tegne ruten på kortet

    directionsRenderer.setMap(map);
    // Kobl rendereren til vores kort så ruten tegnes der

    // Deaktiver auto-center når brugeren panorerer manuelt
    map.addListener('dragstart', () => {
        userPanned = true
    })

    initAutocomplete()

    await fetchAndBuildRoute();
    // Hent afhentninger fra backend og byg ruten
    checkLocationPermission()
}

async function fetchAndBuildRoute() {
    const stopList = document.getElementById('stopList');

    // Hent sidebar elementet hvor stop-listen vises
    // Sender GET request til Java backend
    // Henter alle afhentninger med status KLAR
    const response = await authFetch(`${BASE_URL}/driver/collections/active`);

    // Fejlbesked hvis backend ikke giver svar, eller hvis status ikke er OK 200.
    if (!response.ok) {
        stopList.innerHTML = '<p>Kunne ikke hente afhentninger.</p>';
        return;
    }

    const data = await response.json();
    const savedTempStops = loadTempStops();

    collections = [
        ...data.filter(c => c.address),
        ...savedTempStops
    ]

    if (collections.length === 0) {
        // Hvis ingen aktive afhentninger, altså at listen er tom, vises denne besked
        stopList.innerHTML = '<p>Ingen aktive afhentninger i dag.</p>'
        document.getElementById('locationBtn').style.display = 'none'
        return
    }

    renderStopList();
    calculateRoute();
}

// Listen viser virksomhedens navn og adresse
function renderStopList() {
    const stopList = document.getElementById('stopList');

    stopList.innerHTML = collections.map(c => {
        const isManual = c.id.toString().startsWith('manual');

        const buttons = isManual
            ? `
                <button class="pickup-btn" onclick="onStopChecked('${c.id}')">Afhent</button>
                <button class="pickup-btn done-btn" onclick="doneManualStop('${c.id}')">Done</button>
            `
            : `
                <button class="pickup-btn" onclick="onStopChecked('${c.id}')">Afhent</button>
            `;

        return `
            <!-- Opret en div per afhentning med unikt id.
            id bruges til at fjerne stoppet fra DOM når det er afhentet -->
            <div class="stop-item" id="stop-${c.id}">

                <div class="stop-info">

                    <div class="stop-header">
                        <strong>${c.businessName}</strong>

                        <div class="stop-buttons">
                            ${buttons}
                        </div>
                    </div>

                    <small>${c.address}</small>

                </div>

                <button class="remove-btn" onclick="removeStop('${c.id}')">×</button>

            </div>
        `;
    }).join('');
}

function doneManualStop(collectionId) {
    collections = collections.filter(c =>
        c.id.toString() !== collectionId.toString()
    );

    saveTempStops()

    document.getElementById(`stop-${collectionId}`)?.remove();

    showSuccessEmoji();

    if (collections.length === 0) {
        document.getElementById('stopList').innerHTML =
            '<p>✅ Alle afhentninger afsluttet!</p>';

        directionsRenderer.set('directions', null);
    } else {
        calculateRoute();
    }
}

// Virksomheder vises som route på kortet.
// Ruten slutter altid på Retortvej 38, 2500 Valby.
function calculateRoute() {
    const addresses = collections.map(c => c.address);

    if (addresses.length === 0) {
        directionsRenderer.set('directions', null);
        return;
    }

    // Brug chaufføren position som startpunkt hvis sporing er aktiv
    // Ellers brug første adresse i listen som før
    const origin = driverPosition
        ? { lat: driverPosition.lat, lng: driverPosition.lng }
        : addresses[0]

    if (addresses.length === 1 && !driverPosition) {
        new google.maps.Geocoder().geocode({ address: addresses[0] }, (results, status) => {
            if (status === 'OK') {
                map.setCenter(results[0].geometry.location)
                new google.maps.Marker({
                    map,
                    position: results[0].geometry.location,
                    title: collections[0].businessName
                })
            }
        })
        return
    }

    // Alle adresser er waypoints når chaufføren position bruges som startpunkt
    const destination = addresses[addresses.length - 1]
    const waypoints = driverPosition
        ? addresses.slice(0, -1).map(addr => ({ location: addr, stopover: true }))
        : addresses.slice(1, -1).map(addr => ({ location: addr, stopover: true }))

    directionsService.route({
        origin: origin,
        destination: ROUTE_DESTINATION,
        waypoints: waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING
    }, (result, status) => {

        if (status !== 'OK') {
            console.log("Kunne ikke beregne rute:", status);
            return;
        }

        directionsRenderer.setDirections(result);
    });
}

// Tilføj manuel adresse til ruten
function addManualStop() {
    const input = document.getElementById('newAddress');
    const address = input.value.trim();

    if (!address) {
        return;
    }

    // Tilføj som et midlertidigt stop
    const tempId = `manual-${Date.now()}`;

    const tempStop = {
        id: tempId,
        businessName: address,
        address: address
    };

    collections.push(tempStop)

    saveTempStops();

    input.value = '';

    renderStopList();

    calculateRoute();
    // Genkaldes efter tilføjelse af nyt stop
}

// Fjern stop fra ruten uden at markere som afhentet
function removeStop(collectionId) {
    collections = collections.filter(c =>
        c.id.toString() !== collectionId.toString()
    );

    saveTempStops();

    document.getElementById(`stop-${collectionId}`)?.remove();

    if (collections.length === 0) {
        directionsRenderer.set('directions', null);
        document.getElementById('stopList').innerHTML =
            '<p>Ingen aktive afhentninger i dag.</p>';
        return;
    }

    calculateRoute();
}

// Klik på stop — åbn pop-up til antal poser
function onStopChecked(collectionId) {
    const collection = collections.find(c =>
        c.id.toString() === collectionId.toString()
    );

    if (!collection) {
        return;
    }

    const isManual = collectionId.toString().startsWith('manual');

    document.getElementById('modalTitle').textContent =
        collection.businessName;

    document.getElementById('modalAddress').textContent =
        collection.address;

    document.getElementById('bagCount').value = '';

    // Skift knaptekst afhængigt af om det er manuelt stop eller virksomhed som har markeret klar til afhentning
    document.querySelector('#bagModal .modal-buttons button').textContent =
        isManual ? 'Poser ikke nødvendigt' : 'Bekræft afhentning';

    document.getElementById('bagModal').style.display = 'flex';

    document.getElementById('bagModal').dataset.collectionId =
        collectionId;
}

// Bekræft afhentning
async function confirmPickup() {
    const modal = document.getElementById('bagModal');

    const collectionId = modal.dataset.collectionId;

    const bagCount = parseInt(
        document.getElementById('bagCount').value
    );

    // Systemet accepterer 0 og op som gyldigt antal poser
    const isManual = collectionId.toString().startsWith('manual');

    if (!isManual && (isNaN(bagCount) || bagCount < 0)) {
        alert('Indtast venligst antal poser.');
        return;
    }

    // Spring backend over hvis manuelt tilføjet stop
    if (!isManual) {
        const response = await authFetch(
            `${BASE_URL}/driver/collections/${collectionId}/complete`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    driverBags: bagCount
                })
            }
        );

        if (!response.ok) {
            alert('Noget gik galt. Prøv igen.');
            return;
        }
    }

    collections = collections.filter(c =>
        c.id.toString() !== collectionId.toString()
    );

    saveTempStops()

    document.getElementById(`stop-${collectionId}`)?.remove();

    closeModal();

    showSuccessEmoji();

    if (collections.length === 0) {
        document.getElementById('stopList').innerHTML = '<p>✅ Alle afhentninger afsluttet!</p>'
        directionsRenderer.set('directions', null)
        window.stopTracking() // stop sporing og ryd position i backend
        document.getElementById('locationBtn').style.display = 'none'

    } else {
        calculateRoute();
    }
}

// Visningen og animationen af tommel-op emojien efter antal poser afhentet
function showSuccessEmoji() {
    const emoji = document.createElement('div');

    emoji.className = 'success-emoji';

    emoji.innerHTML = '👍';

    document.body.appendChild(emoji);

    // Fjern emojien igen efter 2 sekunder inkl. fade-out
    setTimeout(() => {
        emoji.classList.add('fade-out');

        setTimeout(() => {
            emoji.remove();
        }, 500);

    }, 1500);
}

function closeModal() {
    document.getElementById('bagModal').style.display = 'none';
}

function toggleMenu() {
    const sidebar = document.getElementById('sidebar')
    const overlay = document.getElementById('sidebarOverlay')
    const isOpen = sidebar.classList.toggle('open')
    overlay.classList.toggle('active', isOpen)

}

// Starter polling — henter chaufføren position fra backend hvert 10. sek.
/*
Polling er at frontend spørger backend "har du noget nyt ift. lokationen?" med et fast interval,
som i vores tilfælde er 10 sekunder, uanset om der er nyt eller ej.
 */
function startPolling() {
    // Kald med det samme første gang
    pollLocation()
    // Derefter hvert 10. sekund
    locationInterval = setInterval(pollLocation, 10000)
}

// Selve poll-kaldet — udskilt så det kan kaldes både med det samme og via interval
async function pollLocation() {
    const response = await authFetch(`${BASE_URL}/driver/location`)

    if (response.status === 401) {
        stopPolling()
        window.location.hash = '#/login'
        return
    }

    if (response.status === 403) {
        stopPolling()
        alert('Du har ikke adgang til denne funktion.')
        return
    }

    if (response.status === 404) {
        stopPolling()
        alert('Sporingen er afbrudt. Tryk start for at genoptage.')
        return
    }

    const data = await response.json()
    updateDriverMarker(data.latitude, data.longitude)
}

// Stopper polling
function stopPolling() {
    if (locationInterval !== null) {
        clearInterval(locationInterval)
        locationInterval = null
    }
}

// Opdaterer eller opretter chaufføren markør på kortet
function updateDriverMarker(latitude, longitude) {
    if (!map) return

    const position = { lat: latitude, lng: longitude }
    driverPosition = position // gem chaufføren position

    if (driverMarker === null) {
        // Opret markør første gang
        driverMarker = new google.maps.Marker({
            position,
            map,
            title: 'Din position',
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2
            }
        })
        // Zoom ind første gang markøren vises
        map.setCenter(position)
        map.setZoom(15)
        calculateRoute() // genberegn ruten med chaufføren som startpunkt
        // Vis rute-knap
        document.getElementById('routeBtn').style.display = 'block'
    } else {
        driverMarker.setPosition(position)
    }

    if (!userPanned) {
        map.setCenter(position)
    }
}

// Fjerner chaufføren markør fra kortet
function removeDriverMarker() {
    if (driverMarker !== null) {
        driverMarker.setMap(null)
        driverMarker = null
    }
    driverPosition = null
    const routeBtn = document.getElementById('routeBtn')
    if (routeBtn) routeBtn.style.display = 'none'
    calculateRoute()
}

// Zoomer ind på chaufføren og beregner rute fra chaufføren position
function startRoute() {
    userPanned = false
    calculateRoute()
    // Vent til ruten er beregnet og zoom derefter ind på chaufføren
    setTimeout(() => {
        if (driverMarker !== null) {
            map.setCenter(driverMarker.getPosition())
            map.setZoom(20)
        }
    }, 500)
}
    const sidebar = document.getElementById('sidebar');

    const overlay = document.getElementById('sidebarOverlay');

    const isOpen = sidebar.classList.toggle('open');

    overlay.classList.toggle('active', isOpen);
}

function setupDriverNavbarEvents() {

    document
        .getElementById("driverLogoutBtn")
        .addEventListener("click", function () {

            clearTempStops();

            localStorage.removeItem("jwt");

            window.location.hash = "#/login";
        });

    document
        .getElementById("driverLogoBtn")
        .addEventListener("click", async function () {

            const user = await getCurrentUser();

            if (user && user.role === "ADMIN") {
                window.location.hash = "#/admin/dashboard";
            }
        });
}

async function getCurrentUser() {

    try {
        const response = await authFetch(`${BASE_URL}/auth/me`);

        if (!response.ok) {
            return null;
        }

        return await response.json();

    } catch (error) {
        console.log(error);
        return null;
    }
}

function saveTempStops(){
    const tempStops = collections.filter(c =>
    c.id.toString().startsWith("manual"))

    localStorage.setItem(TEMP_STOPS_KEY, JSON.stringify(tempStops))
}

function loadTempStops(){
    const savedTempStops = localStorage.getItem(TEMP_STOPS_KEY)

    if (!savedTempStops){
        return []
    }

    return JSON.parse(savedTempStops)
}

    function clearTempStops(){
        localStorage.removeItem(TEMP_STOPS_KEY)

}
