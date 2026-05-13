// Global API base URL
const BASE_URL = window.APP_CONFIG.apiBaseUrl;

// Starter hele applikationen
initializeApp();

// Initialiserer appen
function initializeApp() {

    /* Renderer siden til kort med afhentninger som det første når appen starter.
   renderDriverExpensePage(); bliver kaldt når chaufføren eller admin klikker på tilføj udgift i sidepanelet.
    */

    // Midlertidig løsning
    const currentPage = 'business-pickup';

    //Admin dashboard
    if (currentPage === "adminDashboard") {
        renderAdminDashboardPage();
    }
    // Chauffør udgift side
    if (currentPage === "driver") {
        renderDriverExpensePage();
    }
    // Admin oprettelse af bruger
    if (currentPage === "admin") {
        renderAdminUserPage();
    }
    //Admin oprettelse af virksomhed
    if (currentPage === "business") {
        renderBusinessPage();
    }
    if (currentPage === "business-pickup"){
        renderBusinessPickupPage()
    }
    if (currentPage === "driver-map"){
        renderDriverMap()
    }

}