import { BASE_URL } from '../../config.js';
import { MAPS_API_KEY } from "../../config.secrets.js";
import { authFetch } from '../../utils.js'

export function initDriverDashboard() {
    renderDriverMap();
}

export function renderDriverExpenses() {
    renderDriverMap()
}

let map = null
let directionsService = null
let directionsRenderer = null
let collections = []


function renderDriverMap() {
    const app = document.getElementById('app')

    app.innerHTML = `
    <!-- Navigation bar -->
    <nav class="navbar" onclick="toggleMenu()">
        <button class="menu-btn">☰</button>
        <span class="nav-title">Dagens rute</span>
        <img src="img/logo.png" class="nav-logo" alt="Q Genbrug">
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

                <!-- QE-174 (Loading-state): som vises indtil data med adresser er hentet fra backend.
                -->
                <div id="stopList">
                    <p>Henter afhentninger...</p>
                </div>
                <!-- Opdater listen med nyt data ved at kalde fetchAndBuildRoute() funktionen -->
                <button onclick="fetchAndBuildRoute()">🔄 Opdater listen</button>

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
                <input type="number" id="bagCount" min="0" placeholder="Antal poser">
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

    loadGoogleMapsScript()
}


function loadGoogleMapsScript() {
    if (document.getElementById('gmaps-script')) {
        // Tjek om Google Maps scriptet allerede er loadet -> hvis ja køres initMap() med det samme.
        //Ellers loades scriptet igen.
        initMap()
        return
    }

    const script = document.createElement('script')
    script.id = 'gmaps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&callback=initMap`
    script.async = true
    script.defer = true
    document.body.appendChild(script)
}

//QE-169 (Opdater ved indlæsning). Implementeret via initMap,
// som kaldes automatisk, når kortet initialiseres ved sidens indlæsning.
async function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 55.6761, lng: 12.5683 },
        // Centrer kortet på København
        zoom: 11
        // Zoom niveau — højere tal = tættere på

    })

    directionsService = new google.maps.DirectionsService()
    // Service til at beregne ruter mellem adresser
    directionsRenderer = new google.maps.DirectionsRenderer()
    // Renderer til at tegne ruten på kortet
    directionsRenderer.setMap(map)
    // Kobl rendereren til vores kort så ruten tegnes der

    await fetchAndBuildRoute()
    // Hent afhentninger fra backend og byg ruten

}


async function fetchAndBuildRoute() {
    const stopList = document.getElementById('stopList')
    // Hent sidebar elementet hvor stop-listen vises

    // Sender GET request til Java backend
    // Henter alle afhentninger med status KLAR
    const response = await authFetch(`${BASE_URL}/driver/collections/active`)

    //fejlbesked hvis backend ikke giver svar, eller hvis status er ikke OK 200.
    if (!response.ok) {
        stopList.innerHTML = '<p>Kunne ikke hente afhentninger.</p>'
        return
    }

    const data = await response.json()
    collections = data.filter(c => c.address)

    if (collections.length === 0) {
        // Hvis ingen aktive afhentninger, altså at listen er tom, vises denne besked
        stopList.innerHTML = '<p>Ingen aktive afhentninger i dag.</p>'
        return
    }

    renderStopList()
    calculateRoute()
}

//Listen viser virksomhedens navn og adresse
function renderStopList() {
    const stopList = document.getElementById('stopList')

    stopList.innerHTML = collections.map(c => `
        <div class="stop-item" id="stop-${c.id}">
        <!--Opret en div per afhentning med unikt id
        id bruges til at fjerne stopet fra DOM når det er afhentet -->
            <div class="stop-info" onclick="onStopChecked(${c.id})">
                <div class="stop-header">
                <strong>${c.businessName}</strong>
                <button class="pickup-btn" onclick="onStopChecked(${c.id})">Afhent</button>
               </div>
                <small>${c.address}</small>
            </div>
            <button class="remove-btn" onclick="removeStop(${c.id})">×</button>
        </div>
    `).join('')
}

//Virksomheder vises som markører på kortet. Der placeres markører via Google Maps Geocoder.
function calculateRoute() {
    const addresses = collections.map(c => c.address)

    if (addresses.length === 0) {
        directionsRenderer.set('directions', null)
        return
    }

    if (addresses.length === 1) {
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

    const origin = addresses[0]
    const destination = addresses[addresses.length - 1]
    const waypoints = addresses.slice(1, -1).map(addr => ({
        location: addr,
        stopover: true
    }))

    directionsService.route({
        origin,
        destination,
        waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING
    }, (result, status) => {
        if (status !== 'OK') return
        directionsRenderer.setDirections(result)
    })
}


// Tilføj manuel adresse til ruten
function addManualStop() {
    const input = document.getElementById('newAddress')
    const address = input.value.trim()

    if (!address) return

    // Tilføj som et midlertidigt stop
    const tempId = `manual-${tempIdCounter++}`
    collections.push({
        id: tempId,
        businessName: address,
        address: address
    })

    input.value = ''
    renderStopList()
    calculateRoute() //Genkaldes efter tilføjelse af nyt stop
}


// Fjern stop fra ruten uden at markere som afhentet
function removeStop(collectionId) {
    collections = collections.filter(c => c.id !== collectionId)
    document.getElementById(`stop-${collectionId}`)?.remove()
    calculateRoute()
}


// Klik på stop — åbn pop-up til antal poser
function onStopChecked(collectionId) {
    const collection = collections.find(c => c.id === collectionId)
    if (!collection) return

    document.getElementById('modalTitle').textContent = collection.businessName
    document.getElementById('modalAddress').textContent = collection.address
    document.getElementById('bagCount').value = ''
    document.getElementById('bagModal').style.display = 'flex'
    document.getElementById('bagModal').dataset.collectionId = collectionId
}


// Bekræft afhentning
async function confirmPickup() {
    const modal = document.getElementById('bagModal')
    const collectionId = modal.dataset.collectionId
    const bagCount = parseInt(document.getElementById('bagCount').value)

    //Systemet accepterer 0 og op som gyldigt antal poser
    if (isNaN(bagCount) || bagCount < 0) {
        alert('Indtast venligst antal poser.')
        return
    }

    // Spring backend over hvis manuelt tilføjet stop
    if (!collectionId.toString().startsWith('manual')) {
        const response = await authFetch(`${BASE_URL}/driver/collections/${collectionId}/complete`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ driverBags: bagCount })
        })

        if (!response.ok) {
            alert('Noget gik galt. Prøv igen.')
            return
        }
    }

    collections = collections.filter(c => c.id.toString() !== collectionId.toString())
    document.getElementById(`stop-${collectionId}`)?.remove()
    closeModal()
    showSuccessEmoji()

    if (collections.length === 0) {
        document.getElementById('stopList').innerHTML = '<p>✅ Alle afhentninger afsluttet!</p>'
        directionsRenderer.set('directions', null)
    } else {
        calculateRoute()
    }
}

//Visningen og animationen af tommel-op emojien efter antal poser afhentet
function showSuccessEmoji() {
    const emoji = document.createElement('div');
    emoji.className = 'success-emoji';
    emoji.innerHTML = '👍';
    document.body.appendChild(emoji);

    // Fjern emojien igen efter 2 sekunder (inkl. fade-out)
    setTimeout(() => {
        emoji.classList.add('fade-out');
        setTimeout(() => emoji.remove(), 500);
    }, 1500);
}


function closeModal() {
    document.getElementById('bagModal').style.display = 'none'
}


function toggleMenu() {
    const sidebar = document.getElementById('sidebar')
    const overlay = document.getElementById('sidebarOverlay')
    const isOpen = sidebar.classList.toggle('open')
    overlay.classList.toggle('active', isOpen)
}

