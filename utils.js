
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