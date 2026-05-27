//wake-lock.js er et browser API (indbygget i browseren) som holder telefonen vågen. Kaldes ved start tracking.
let wakeLock = null;

//Tænder wakeLock
export async function requestWakeLock() {
    if (!('wakeLock' in navigator)) {
        console.log('Wake Lock API not supported on this device');
        return;
    }
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('Screen wake lock acquired');

        // Re-acquire if released (e.g. tab went to background)
        wakeLock.addEventListener('release', () => {
            console.log('Wake lock released');
            showWakeLockWarning();
        });
    } catch (err) {
        console.error('Wake lock failed:', err);
    }
}

//slukker wakeLock
export async function releaseWakeLock() {
    if (wakeLock !== null) {
        await wakeLock.release();
        wakeLock = null;
    }
}

//lytter til knap der starter wakeLock
export function setupWakeLockVisibilityListener() {
    document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible' && wakeLock === null) {
            await requestWakeLock();
        }
    });
}
//Viser warning hvis low power mode er aktiveret (WakeLock virker ikke i low power mode! Apple limitation)
function showWakeLockWarning() {
    const existing = document.getElementById('wakelock-warning');
    if (existing) return; // don't show twice

    const warning = document.createElement('div');
    warning.id = 'wakelock-warning';
    warning.textContent = '⚠️ Skærmen kan slukke automatisk. Tjek om strømbesparende tilstand er aktiv.';
    warning.style.cssText = `
        position: fixed;
        bottom: 1rem;
        left: 50%;
        transform: translateX(-50%);
        background: #f59e0b;
        color: white;
        padding: 0.75rem 1.25rem;
        border-radius: 0.5rem;
        font-size: 0.9rem;
        z-index: 9999;
        text-align: center;
        max-width: 90vw;
    `;
    document.body.appendChild(warning);
}