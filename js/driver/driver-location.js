import { BASE_URL } from '../../config.js';
import { authFetch } from '../../utils.js';

let watchId = null
let isTracking = false

// Tjekker GPS-tilladelse når siden loader og aktiverer knappen
export function checkLocationPermission() {
    if (!navigator.geolocation) {
        document.getElementById('locationBtn').textContent = '❌ GPS ikke understøttet'
        return
    }

    navigator.permissions.query({ name: 'geolocation' }).then(result => {
        const btn = document.getElementById('locationBtn')
        if (result.state === 'denied') {
            btn.textContent = '❌ Tillad lokation for at starte ruten'
            btn.disabled = true
        } else {
            btn.textContent = '📍 Start sporing'
            btn.disabled = false
        }
    })
}

// Starter GPS-sporing — kaldes når chaufføren trykker på knappen
export function startTracking() {
    const btn = document.getElementById('locationBtn')

    if (isTracking) {
        stopTracking()
        return
    }

    watchId = navigator.geolocation.watchPosition(
        // GPS-tilladelse givet
        (position) => {
            const { latitude, longitude } = position.coords
            sendLocation(latitude, longitude)

            if (!isTracking) {
                isTracking = true
                btn.textContent = '⏹ Stop sporing'
                btn.disabled = false
            }
        },
        // GPS-tilladelse afvist eller utilgængelig
        () => {
            btn.textContent = '❌ Tillad lokation for at starte ruten'
            btn.disabled = true
            isTracking = false
        }
    )
}

// Stopper GPS-sporing
export function stopTracking() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
        watchId = null
    }
    isTracking = false
    const btn = document.getElementById('locationBtn')
    if (btn) {
        btn.textContent = '📍 Start sporing'
        btn.disabled = false
    }
}

// Sender koordinater til Spring backend
async function sendLocation(latitude, longitude) {
    const response = await authFetch(`${BASE_URL}/driver/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude })
    })

    if (response.status === 401) {
        stopTracking()
        window.location.hash = '#/login'
    } else if (response.status === 403) {
        stopTracking()
        alert('Du har ikke adgang til denne funktion.')
    }
}