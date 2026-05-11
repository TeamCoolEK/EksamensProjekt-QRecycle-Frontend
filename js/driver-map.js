// js/driver-map.js

let map = null
let directionsService = null
let directionsRenderer = null
let collections = []

// Supabase klient fra config.secrets.js
const supabase = window.supabase.createClient(
    window.APP_CONFIG.supabaseUrl,
    window.APP_CONFIG.supabaseAnonKey
)


function renderDriverMap() {
    const app = document.getElementById('app')

    app.innerHTML = `
        <!-- Navigation bar -->
        <nav class="navbar">
            <button class="menu-btn" onclick="toggleMenu()">☰</button>
            <span class="nav-title">Dagens rute</span>
        <img src="img/logo.png" class="nav-logo" alt="Q Genbrug">        </nav>

        <div class="layout">

            <!-- Sidebar -->
            <div class="sidebar" id="sidebar">

                <!-- Adresser fra Supabase -->
                <div id="stopList">
                    <p>Henter afhentninger...</p>
                </div>

                <!-- Tilføj ny adresse manuelt -->
                <div class="add-address">
                    <p>Ny adresse?</p>
                    <input type="text" id="newAddress" placeholder="Indtast adresse">
                    <button onclick="addManualStop()">Tilføj</button>
                </div>

                <!-- Udgift knap -->
                <button class="expense-btn" onclick="renderDriverExpensePage()">
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

    loadGoogleMapsScript()
}


function loadGoogleMapsScript() {
    if (document.getElementById('gmaps-script')) {
        initMap()
        return
    }

    const script = document.createElement('script')
    script.id = 'gmaps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${window.APP_CONFIG.googleMapsApiKey}&callback=initMap`
    script.async = true
    script.defer = true
    document.body.appendChild(script)
}


async function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 55.6761, lng: 12.5683 },
        zoom: 11
    })

    directionsService = new google.maps.DirectionsService()
    directionsRenderer = new google.maps.DirectionsRenderer()
    directionsRenderer.setMap(map)

    await fetchAndBuildRoute()
}


async function fetchAndBuildRoute() {
    const stopList = document.getElementById('stopList')

    const { data, error } = await supabase
        .from('Collection')
        .select(`
            id,
            status,
            bags,
            Business (
                id,
                name,
                address
            )
        `)
        .eq('status', 1)

    if (error) {
        stopList.innerHTML = '<p>Kunne ikke hente afhentninger.</p>'
        return
    }

    collections = data.filter(c => c.Business?.address)

    if (collections.length === 0) {
        stopList.innerHTML = '<p>Ingen aktive afhentninger i dag.</p>'
        return
    }

    renderStopList()
    calculateRoute()
}


function renderStopList() {
    const stopList = document.getElementById('stopList')

    stopList.innerHTML = collections.map(c => `
        <div class="stop-item" id="stop-${c.id}">
            <div class="stop-info" onclick="onStopChecked(${c.id})">
                <strong>${c.Business.name}</strong>
                <small>${c.Business.address}</small>
            </div>
            <!-- Kryds til at fjerne stop fra ruten -->
            <button class="remove-btn" onclick="removeStop(${c.id})">×</button>
        </div>
    `).join('')
}


function calculateRoute() {
    const addresses = collections.map(c => c.Business.address)

    if (addresses.length === 0) {
        directionsRenderer.set('directions', null)
        return
    }

    // Kun ét stop — vis bare en markør
    if (addresses.length === 1) {
        new google.maps.Geocoder().geocode({ address: addresses[0] }, (results, status) => {
            if (status === 'OK') {
                map.setCenter(results[0].geometry.location)
                new google.maps.Marker({
                    map,
                    position: results[0].geometry.location,
                    title: collections[0].Business.name
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

    // Tilføj som et midlertidigt stop uden Supabase id
    const tempId = 'manual-' + Date.now()
    collections.push({
        id: tempId,
        status: 1,
        bags: null,
        Business: { id: null, name: address, address: address }
    })

    input.value = ''
    renderStopList()
    calculateRoute()
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

    document.getElementById('modalTitle').textContent = collection.Business.name
    document.getElementById('modalAddress').textContent = collection.Business.address
    document.getElementById('bagCount').value = ''
    document.getElementById('bagModal').style.display = 'flex'
    document.getElementById('bagModal').dataset.collectionId = collectionId
}


// Bekræft afhentning — opdater Supabase og fjern stop
async function confirmPickup() {
    const modal = document.getElementById('bagModal')
    const collectionId = modal.dataset.collectionId
    const bagCount = parseInt(document.getElementById('bagCount').value)

    if (isNaN(bagCount) || bagCount < 0) {
        alert('Indtast venligst antal poser.')
        return
    }

    // Spring Supabase over hvis det er et manuelt tilføjet stop
    if (!collectionId.toString().startsWith('manual')) {
        const { error } = await supabase
            .from('Collection')
            .update({ status: 2, bags: bagCount })
            .eq('id', parseInt(collectionId))

        if (error) {
            alert('Noget gik galt. Prøv igen.')
            return
        }
    }

    // Fjern stop fra liste og genberegn rute
    collections = collections.filter(c => c.id.toString() !== collectionId.toString())
    document.getElementById(`stop-${collectionId}`)?.remove()
    closeModal()

    if (collections.length === 0) {
        document.getElementById('stopList').innerHTML = '<p>✅ Alle afhentninger afsluttet!</p>'
        directionsRenderer.set('directions', null)
    } else {
        calculateRoute()
    }
}


function closeModal() {
    document.getElementById('bagModal').style.display = 'none'
}


function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('open')
}