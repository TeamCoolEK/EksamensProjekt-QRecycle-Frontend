

renderLoginForm();

function renderLoginForm() {
    const app = document.getElementById('app')

    app.innerHTML = `
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

                <button class="login-btn" onclick="handleLogin()">Log ind</button>
            </div>
        </div>
    `
}

async function handleLogin() {
    const username = document.getElementById('username').value.trim()
    const password = document.getElementById('password').value
    const btn = document.querySelector('.login-btn')

    if (!username || !password) {
        showLoginError('Udfyld alle felter.')
        return
    }

    btn.disabled = true
    btn.textContent = 'Logger ind...'

    try {
        const response = await fetch(BASE_URL + '/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })

        if (response.status === 401 || response.status === 403) {
            showLoginError('Forkert brugernavn eller adgangskode.')
            return
        }

        if (!response.ok) {
            showLoginError('Serverfejl. Prøv igen.')
            return
        }

        // Token comes from the response header, not the body
        const token = response.headers.get('Authorization')
        if (!token) {
            showLoginError('Login fejlede. Prøv igen.')
            return
        }

        localStorage.setItem('jwt', token)

        initializeApp();

    } catch (err) {
        showLoginError('Serverfejl. Prøv igen.')
    } finally {
        btn.disabled = false
        btn.textContent = 'Log ind'
    }
}

function showLoginError(msg) {
    const el = document.getElementById('loginError')
    el.textContent = msg
    el.style.display = 'block'
}