// app.js

// Global API base URL
const BASE_URL = window.APP_CONFIG.apiBaseUrl;


// Starter hele applikationen
initializeApp();


// Initialiserer appen
function initializeApp() {

    //Midlertidig løsning inden login siden laves
    const currentPage = "admin";

    if (currentPage === "driver") {

        renderDriverExpensePage();
    }

    if (currentPage === "admin") {

        renderAdminUserPage();
    }
}