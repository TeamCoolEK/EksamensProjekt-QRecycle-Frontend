// app.js

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

}