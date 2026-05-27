import { BASE_URL } from '../../config.js';
import { authFetch } from '../../utils.js';

let watchId = null
let isTracking = false

// Tjekker GPS-tilladelse når siden loader og aktiverer knappen
export function checkLocationPermission() {
    console.log('checkLocationPermission called')
    if (!navigator.geolocation) {
        console.log('geolocation not supported')
        document.getElementById('locationBtn').textContent = '❌ GPS ikke understøttet'
        return
    }

    navigator.permissions.query({ name: 'geolocation' }).then(result => {
        console.log('permission state:', result.state)
        const btn = document.getElementById('locationBtn')
        if (result.state === 'denied') {
            btn.textContent = '❌ Tillad lokation for at starte ruten'
            btn.disabled = true
        } else {
            btn.textContent = '📍 Beregn rute fra min lokation'
            btn.disabled = false
        }
    })
}

// Starter GPS-sporing — kaldes når chaufføren trykker på knappen
export function startTracking() {
    console.log('startTracking called')
    const btn = document.getElementById('locationBtn')

    if (isTracking) {
        stopTracking()
        return
    }

    watchId = navigator.geolocation.watchPosition(
        // GPS-tilladelse givet
        async (position) => {
            const { latitude, longitude , heading, speed} = position.coords
            // Only use heading if actually moving (speed > 0.5 m/s ≈ walking pace)
            const MIN_SPEED_MS = 1.5;
            const reliableHeading = (speed !== null && speed > MIN_SPEED_MS) ? heading : null
            try {
                await sendLocation(latitude, longitude)
            } catch (err) {
                console.log('sendLocation failed:', err)
            }
            window.updateDriverMarker(latitude, longitude, reliableHeading) // Heading fortæller hvilken grad gps er peget imod
        },
        // GPS-tilladelse afvist eller utilgængelig
        () => {
            btn.textContent = '❌ Tillad lokation for at starte ruten'
            btn.disabled = true
            isTracking = false
            document.getElementById('followBtn').style.display = 'none'
            window.stopPolling()
        },
        {
            enableHighAccuracy: true,  // 👈 required for heading on iOS
            maximumAge: 0,             // 👈 always fresh position
            timeout: 10000
        }
    )

    // Start polling og opdater UI med det samme
    // i stedet for at vente på første GPS-callback
    isTracking = true
    btn.textContent = '⏹ Stop sporing'
    btn.disabled = false
    document.getElementById('followBtn').style.display = 'block'
    window.startPolling()
}

//Stopper sporingen
export function stopTracking() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
        watchId = null
    }
    isTracking = false

    const btn = document.getElementById('locationBtn')
    if (btn) {
        btn.textContent = '📍 Beregn rute fra min lokation'
        btn.disabled = false
    }

    const followBtn = document.getElementById('followBtn')
    if (followBtn) followBtn.style.display = 'none'

    window.stopPolling()
    window.removeDriverMarker() // fjerner markøren fra kortet
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