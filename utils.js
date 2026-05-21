
// authFetch er en wrapper omkring den indbyggede fetch funktion.
// Den henter automatisk JWT-tokenen fra localStorage og tilføjer den
// som Authorization header på alle requests, så man ikke behøver
// at skrive headers: { 'Authorization': token } manuelt hver gang.

export function authFetch(url, options = {}) {
    const token = localStorage.getItem('jwt')
    return fetch(url, {
        ...options,
        headers: {
            'Authorization': token,
            ...options.headers
        }
    })
}