// // Global API base URL
// const BASE_URL = window.APP_CONFIG.apiBaseUrl;
//
// // Starter hele applikationen
// initializeApp();
//
// // Initialiserer appen
// function initializeApp() {
//
//     /* Renderer siden til kort med afhentninger som det første når appen starter.
//    renderDriverExpensePage(); bliver kaldt når chaufføren eller admin klikker på tilføj udgift i sidepanelet.
//     */
//
//     // renderDriverMap();
//
//     // Midlertidig løsning
//     const currentPage = "adminDashboard";
//
//     //Admin dashboard
//     if (currentPage === "adminDashboard") {
//         renderAdminDashboardPage();
//     }
//     // Chauffør udgift side
//     if (currentPage === "driver") {
//         renderDriverExpensePage();
//     }
//
//     // Admin oprettelse af bruger
//     if (currentPage === "admin") {
//         renderAdminUserPage();
//     }
//     //Admin oprettelse af virksomhed
//     if (currentPage === "business") {
//         renderBusinessPage();
//     }
// }

// Global API base URL
import { BASE_URL } from '../config.js';
// fjern den eksisterende: const BASE_URL = window.APP_CONFIG.apiBaseUrl;

// Route definitions
const routes = {
    '#/login':              { roles: null,                          page: 'login' },
    '#/admin/dashboard':    { roles: ['ADMIN'],                     page: 'adminDashboard' },
    '#/driver/dashboard':   { roles: ['ADMIN', 'DRIVER'],           page: 'driverDashboard' },
    '#/business/dashboard': { roles: ['BUSINESS'],                  page: 'businessDashboard' },
};

// Default landing page per role
function getRoleHomePage(role) {
    switch (role) {
        case 'ADMIN':    return '#/admin/dashboard';
        case 'DRIVER':   return '#/driver/dashboard';
        case 'BUSINESS': return '#/business/dashboard';
        default:         return '#/login';
    }
}

// Get current user from backend using JWT
async function getCurrentUser() {
    const token = localStorage.getItem('jwt');
    if (!token) return null;

    try {
        const res = await fetch(`${BASE_URL}/auth/me`, {
            headers: { 'Authorization': `${token}` }
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.error('getCurrentUser fejlede:', err);
        return null;
    }
}

// Navigate to a hash route
export async function navigate(hash) {
    const user = await getCurrentUser();

    // No JWT or expired — send to login
    if (!user) {
        if (hash !== '#/login') window.location.hash = '#/login';
        await loadPage('login');
        return;
    }

    // Already logged in and trying to visit login — redirect to their dashboard
    if (hash === '#/login') {
        window.location.hash = getRoleHomePage(user.role);
        return;
    }

    const route = routes[hash];

    // Unknown route
    if (!route) {
        await loadPage('404');
        return;
    }

    // directer til 403 i loadPage funktionen
    if (route.roles && !route.roles.includes(user.role)) {
        await loadPage('unauthorized');
        return;
    }

    await loadPage(route.page);
}

// Load the correct page module
async function loadPage(page) {
    const content = document.getElementById('app');
    //switch navigere til den js der skal loades ud fra route funktionen
    switch (page) {
        case 'login':
            const { initLogin } = await import('./login.js');
            initLogin(content);
            break;
        case 'driverDashboard':
            const { initDriverDashboard } = await import('./driver/driver-dashboard.js');
            initDriverDashboard(content);
            break;
        case 'adminDashboard':
            const { initAdminDashboard } = await import('./admin/admin-dashboard.js');
            initAdminDashboard(content);
            break;
        case 'businessDashboard':
            const { initBusinessDashboard } = await import('./business/business-dashboard.js');
            initBusinessDashboard(content);
            break;
        case 'unauthorized':
            content.innerHTML = '<h1>Access Denied</h1><p>You do not have permission to view this page.</p>';
            break;
        default:
            content.innerHTML = '<h1>404 - Page Not Found</h1>';
    }
}

// Listen for hash changes
window.addEventListener('hashchange', async () => await navigate(window.location.hash));

// Start the app
navigate(window.location.hash || '#/login')