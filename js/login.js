import { BASE_URL } from '../config.js';

import { navigate } from './app.js';

//expoterer funktionen til app.js
export function initLogin(content) {
    renderLoginForm(content);
}
//funktion til at vise html
function renderLoginForm(content) {
    content.innerHTML = `
        <nav class="navbar">
            <span></span>
            <span class="nav-title">Log ind</span>
            <img src="img/logo.png" class="nav-logo" alt="Q Genbrug">
        </nav>

        <div class="login-container">
            <div class="login-card">
                <div class="login-error" id="loginError"></div>

                <div class="form-group">
                    <label for="username">Brugernavn</label>
                    <input type="text" id="username" placeholder="Indtast brugernavn" autocomplete="username">
                </div>

                <div class="form-group">
                    <label for="password">Adgangskode</label>
                    <input type="password" id="password" placeholder="Indtast adgangskode" autocomplete="current-password">
                </div>

                <button class="login-btn">Log ind</button>
            </div>
        </div>
    `;
    //tilføjer handleLogin til login knappen
    content.querySelector('.login-btn').addEventListener('click', handleLogin);
}
//funktion til at håndtere login request
async function handleLogin() {
    const username = document.getElementById('username').value.trim()
    const password = document.getElementById('password').value
    const btn = document.querySelector('.login-btn')

    console.log('handleLogin kaldt')
    console.log('BASE_URL:', BASE_URL)
    console.log('username:', username)

    if (!username || !password) {
        showLoginError('Udfyld alle felter.')
        return
    }

    btn.disabled = true
    btn.textContent = 'Logger ind...'
    //fetcher post til login endpoint og gemmer JWT token i header
    try {
        //fetcher login api kald
        const response = await fetch(BASE_URL + '/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })

        console.log('status:', response.status)
        console.log('token:', response.headers.get('Authorization'))

        if (response.status === 401 || response.status === 403) {
            showLoginError('Forkert brugernavn eller adgangskode.')
            return
        }

        if (!response.ok) {
            showLoginError('Serverfejl. Prøv igen.')
            return
        }

        // henter token fra header og sætter i localStorage
        const token = response.headers.get('Authorization')
        if (!token) {
            showLoginError('Login fejlede. Prøv igen.')
            return
        }

        localStorage.setItem('jwt', token)
        //kalder navigate fra app.js
        await navigate(window.location.hash);

    } catch (err) {
        showLoginError('Serverfejl. Prøv igen.')
    } finally { //resetter knap til sidst
        btn.disabled = false
        btn.textContent = 'Log ind'
    }
}

function showLoginError(msg) {
    const el = document.getElementById('loginError')
    el.textContent = msg
    el.style.display = 'block'
}