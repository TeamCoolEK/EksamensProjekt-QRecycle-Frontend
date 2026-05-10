// Henter API base URL fra config.js
const BASE_URL = window.APP_CONFIG.apiBaseUrl;


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
    setupExpenseEvents();
}

// Opretter events til expense funktionalitet
function setupExpenseEvents() {

    document
        .getElementById("expenseForm")
        .addEventListener("submit", handleExpenseSubmit);

    document
        .getElementById("expenseReceipt")
        .addEventListener("change", handleImagePreview);
}

// Viser billede på siden når det uploades
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

    event.preventDefault();
    const expense = await buildExpenseObject();

    if (!validateExpense(expense)) {
        showExpenseMessage("Udfyld alle felter korrekt");
        return;
    }
    saveExpense(expense);
}

// Bygger expense objekt fra inputfelterne
async function buildExpenseObject() {

    const file =
        document.getElementById("expenseReceipt").files[0];

    const receiptBase64 =
        file ? await imageToBase64(file) : null;

    return {

        title:
        document.getElementById("expenseTitle").value,

        amount:
            Number(document.getElementById("expenseAmount").value),

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


// Konverterer billede til Base64 string
function imageToBase64(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);

        reader.readAsDataURL(file);
    });
}


// Sender expense til backend API
function saveExpense(expense) {

    fetch(BASE_URL + "/driver/expenses", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        credentials: "include",

        body: JSON.stringify(expense)
    })

        .then(res => {

            if (!res.ok) {
                throw new Error("Kunne ikke gemme");
            }

            return res.text();
        })

        .then(data => {

            console.log(data);

            showExpenseMessage("Udgift gemt");

            document
                .getElementById("expenseForm")
                .reset();

            document
                .getElementById("previewImage")
                .style.display = "none";
        })

        .catch(err => {

            console.log(err);

            showExpenseMessage("Fejl ved gemning");
        });
}


// Viser besked til brugeren
function showExpenseMessage(message) {

    document
        .getElementById("expenseMessage")
        .textContent = message;
}