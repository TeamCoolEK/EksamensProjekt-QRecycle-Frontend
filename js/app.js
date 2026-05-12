// app.js
// Global API base URL
const BASE_URL = window.APP_CONFIG.apiBaseUrl;

// Starter hele applikationen
initializeApp();

// Initialiserer appen
function initializeApp() {

    /* Renderer siden til kort med afhentninger som det første når appen starter.
   renderDriverExpensePage(); bliver kaldt når chaufføren eller admin klikker på tilføj udgift i sidepanelet.
    */
    renderDriverMap();

    // Renderer siden til registrering af udgifter
   // renderDriverExpensePage();

    // Midlertidig løsning inden login side laves
    const currentPage = "driver";

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