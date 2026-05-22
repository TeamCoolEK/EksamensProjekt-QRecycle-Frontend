// Global API base URL
import { BASE_URL } from '../config.js';
// fjern den eksisterende: const BASE_URL = window.APP_CONFIG.apiBaseUrl;

// Route definitions
const routes = {
    //selve routen i url.    //hvilken rolle der kan tilgå.       //hvilken side der loades(fra loadPage funktionen)
    '#/login':                { roles: null,                          page: 'login' },
    //admin routes
    '#/admin/dashboard':      { roles: ['ADMIN'],                     page: 'adminDashboard' },
    '#/admin/businessList':   { roles: ['ADMIN'],                     page: 'businessList' },
    '#/admin/createBusiness': { roles: ['ADMIN'],                     page: 'createBusiness' },
    '#/admin/createUser':     { roles: ['ADMIN'],                     page: 'createUser' },
    '#/admin/userList':       { roles: ['ADMIN'],                     page: 'userList' },
    //driver routes
    '#/driver/dashboard':     { roles: ['ADMIN', 'DRIVER'],           page: 'driverDashboard' },
    '#/driver/createExpenses':{ roles: ['ADMIN', 'DRIVER'],           page: 'createExpenses'},
    //business routes
    '#/business/dashboard':   { roles: ['BUSINESS'],                  page: 'businessDashboard' },
    '#/admin/collections':    { roles: ['ADMIN'],                     page: 'adminCollections' },
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
        //Login page
        case 'login':
            const { initLogin } = await import('./login.js');
            initLogin(content);
            break;
        //Admin routes
        case 'adminDashboard':
            const { initAdminDashboard } = await import('./admin/admin-dashboard.js');
            initAdminDashboard(content);
            break;
        case 'createUser':
            const { initCreateUser } = await import('./admin/create-user.js');
            initCreateUser(content);
            break;
        case 'userList':
            const { initAdminUserList } = await import('./admin/user-list.js');
            initAdminUserList(content);
            break;
        case 'createBusiness':
            const { initCreateBusiness } = await import('./admin/create-business.js');
            initCreateBusiness(content);
            break;
        case 'businessList':
            const { initBusinessList } = await import('./admin/business-list.js');
            initBusinessList(content);
            break;
        //Driver routes
        case 'driverDashboard':
            const { initDriverDashboard } = await import('./driver/driver-dashboard.js');
            initDriverDashboard(content);
            break;
        case 'createExpenses':
            const { initDriverExpenses } = await import('./driver/create-expense.js');
            initDriverExpenses(content);
            break;
        //Business routes
        case 'businessDashboard':
            const { initBusinessDashboard } = await import('./business/business-dashboard.js');
            initBusinessDashboard(content);
            break;
        case 'adminCollections':
            const { initAdminCollections } = await import('./admin/admin-collections.js');
            initAdminCollections(content);
            break;
        case 'unauthorized':
            content.innerHTML = '<h1>Access Denied</h1><p>You do not have permission to view this page.</p>';
            break;
        default:
            content.innerHTML = '<h1>404 - Page Not Found</h1>';
    }
}

// Listen for hash changes (sat i window så den er globalt tilgængelig)
window.addEventListener('hashchange', async () => await navigate(window.location.hash));

// Start the app
navigate(window.location.hash || '#/login')