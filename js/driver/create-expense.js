import { BASE_URL } from '../../config.js';
// Renderer siden til registrering af udgifter
function renderDriverExpensePage() {

    document.getElementById("app").innerHTML = `

        <h1>Registrer udgift</h1>

        <form id="expenseForm">

            <input
                id="expenseTitle"
                type="text"
                placeholder="Titel"
            >

            <input
                id="expenseAmount"
                type="number"
                placeholder="Beløb"
            >

            <input
                id="expenseReceipt"
                type="file"
                accept="image/*"
            >

            <img
                id="previewImage"
                width="200"
                style="display: none;"
            >

            <button type="submit">
                Gem udgift
            </button>

        </form>

        <p id="expenseMessage"></p>
    `;

    // Starter events
    setupExpenseEvents();
}

// Opretter events til expense funktionalitet
function setupExpenseEvents() {

    document.getElementById("expenseForm").addEventListener("submit", handleExpenseSubmit);
    document.getElementById("expenseReceipt").addEventListener("change", handleImagePreview);
}

// Viser preview billede når bruger uploader fil
async function handleImagePreview() {

    const file = document.getElementById("expenseReceipt").files[0];

    if (!file) {
        return;
    }

    const receiptBase64 = await imageToBase64(file);

    const previewImage =
        document.getElementById("previewImage");

    previewImage.src = receiptBase64;
    previewImage.style.display = "block";
}


// Håndterer submit af formular
async function handleExpenseSubmit(event) {

    // Stopper reload af side
    event.preventDefault();

    // Bygger expense objekt
    const expense =
        await buildExpenseObject();

    // Validerer data
    if (!validateExpense(expense)) {

        showExpenseMessage(
            "Udfyld alle felter korrekt"
        );

        return;
    }

    try {

        // Sender expense til backend
        const response = await saveExpense(expense);

        console.log(response);

        // Viser succes besked
        showExpenseMessage("Udgift gemt");

        // Resetter formular
        document.getElementById("expenseForm").reset();

        // Skjuler preview billede
        document.getElementById("previewImage").style.display = "none";

    } catch (error) {

        console.log(error);

        showExpenseMessage(
            "Fejl ved gemning"
        );
    }
}

// Bygger expense objekt fra inputfelter
async function buildExpenseObject() {

    const file = document.getElementById("expenseReceipt").files[0];
    const receiptBase64 = file ? await imageToBase64(file) : null;

    return {

        title: document.getElementById("expenseTitle").value,
        amount: Number(document.getElementById("expenseAmount").value),

        receiptBase64:
        receiptBase64
    };
}

// Validerer expense data
function validateExpense(expense) {

    return expense.title.trim() !== ""
        && expense.amount > 0
        && expense.receiptBase64 !== null;
}

// Konverterer billede til Base64
function imageToBase64(file) {

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        // Returnerer base64 string
        reader.onload = () => resolve(reader.result);

        // Returnerer fejl
        reader.onerror = error => reject(error);
        // Læser fil
        reader.readAsDataURL(file);
    });
}


// Sender expense til backend API
async function saveExpense(expense) {

    const response = await fetch(
        `${BASE_URL}/driver/expenses`,
        {
            method: "POST",
            headers: {"Content-Type": "application/json"},

            // Sender session cookie med request
            credentials: "include",
            body: JSON.stringify(expense)
        }
    );

    // Hvis request fejler
    if (!response.ok) {
        const errorText =
            await response.text();
        throw new Error(errorText);
    }

    // Returnerer response text
    return await response.text();
}

// Viser besked til bruger
function showExpenseMessage(message) {
    document.getElementById("expenseMessage").textContent = message;
}