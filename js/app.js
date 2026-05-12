// app.js
// Global API base URL
const BASE_URL = window.APP_CONFIG.apiBaseUrl;

// Starter hele applikationen
initializeApp();

// Initialiserer appen
function initializeApp() {

    // Midlertidig løsning inden login side laves
    const currentPage = "business";

    // Chauffør side
    if (currentPage === "driver") {
        renderDriverExpensePage();
    }

    // Admin opret bruger side
    if (currentPage === "admin") {
        renderAdminUserPage();
    }

    // Opret virksomhed side
    if (currentPage === "business") {
        renderBusinessPage();
    }
}