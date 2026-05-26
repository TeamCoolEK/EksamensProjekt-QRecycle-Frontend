import { BASE_URL } from "../../config.js";
import { authFetch } from "../../utils.js";
import { renderAdminNavbar, setupAdminNavbarEvents } from "./admin-navbar.js";

let allExpenses = [];
let sortDateAsc = null; // null = unsorted, true = asc, false = desc

// Starter siden
export function initAdminExpenses() {
    renderAdminExpensesPage();
}

// Renderer hele siden
function renderAdminExpensesPage() {

    // Indsætter HTML i app container
    document.getElementById("app").innerHTML = `
    
        ${renderAdminNavbar("")}
    
        <h1>Registrerede udgifter</h1>
    
        <div class="business-actions">

            <!-- Knap tilbage til dashboard -->
            <button id="backToDashboardBtn">
                Tilbage til dashboard
            </button>

        </div>
    
        <h2>Alle udgifter</h2>
        
        <!-- Beskeder til bruger -->
        <p id="expenseListMessage">Indlæser...</p>
        
        <!-- Tabel med expenses -->
        <table>

            <thead>
                <tr>
                    <th>Titel</th>
                    <th>Beløb</th>
                    <th id="dateHeader" style="cursor: pointer;">Dato ↕</th>
                </tr>
            </thead>
              
            <!-- Her indsættes expenses dynamisk -->
            <tbody id="expenseTableBody"></tbody>
        </table>    
        
        <!-- Popup vindue til udgift -->
        <div id="expenseModal" class="expense-modal">

            <div class="expense-modal-content">

                <button id="closeExpenseModalBtn" class="expense-modal-close">
                    x
                </button>

                <h2>Udgiftsdetaljer</h2>

                <p>
                    <strong>Titel:</strong>
                    <span id="modalExpenseTitle"></span>
                </p>
                <p>
                    <strong>Beløb:</strong>
                    <span id="modalExpenseAmount"></span>
                </p>
                <p>
                    <strong>Dato:</strong>
                    <span id="modalExpenseDate"></span>
                </p>
                <p>
                    <strong>Bruger:</strong>
                    <span id="modalExpenseUserId"></span>
                </p>

                <h3>Bilag</h3>
                <img
                    id="modalExpenseReceipt"
                    class="expense-receipt-image">
               
                <p id="modalExpenseNoReceipt" style="display: none;">
                    Intet bilag registreret
                </p>
            </div>
        </div>
        
    `;

    // Starter navbar events
    setupAdminNavbarEvents();

    // Eventlistener til tilbage-knap
    document
        .getElementById("backToDashboardBtn")
        .addEventListener("click", function () {

            // Navigerer tilbage til dashboard
            window.location.hash = "#/admin/dashboard";
        });

    // Luk popup
    document
        .getElementById("closeExpenseModalBtn")
        .addEventListener("click", closeExpenseModal);

    // Luk popup ved klik udenfor content
    document
        .getElementById("expenseModal")
        .addEventListener("click", function (event) {

            if (event.target.id === "expenseModal") {
                closeExpenseModal();
            }
        });

    //Sortere dato by date
    document.getElementById("dateHeader").addEventListener("click", function () {
        sortDateAsc = sortDateAsc !== true; // toggle: null/false → true, true → false
        this.textContent = sortDateAsc ? "Dato ↑" : "Dato ↓";

        const sorted = [...allExpenses].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return sortDateAsc ? dateA - dateB : dateB - dateA;
        });

        displayExpenses(sorted);
    });

    // Henter alle expenses fra backend
    loadAllExpenses();
}

// Henter alle expenses fra backend.
function loadAllExpenses() {

    authFetch(BASE_URL + "/admin/expenses", {
        method: "GET"
    })

        .then(res => {

            // Tjekker om request fejlede
            if (!res.ok) {
                throw new Error("Kunne ikke hente udgifter");
            }

            // Konverterer response til JSON
            return res.json();
        })

        .then(expenses => {

            // Gemmer expenses globalt
            allExpenses = expenses;

            // Viser expenses i tabellen
            displayExpenses(expenses);
        })

        .catch(error => {

            // Logger fejl i console
            console.log(error);

            // Viser fejlbesked til bruger
            showExpenseMessage("Kunne ikke hente udgifter");
        });
}

// Viser expenses i tabellen
function displayExpenses(expenses) {

    // Henter tbody fra tabellen
    const tableBody = document.getElementById("expenseTableBody");

    // Nulstiller tabellen før nye rows tilføjes
    tableBody.innerHTML = "";

    // Hvis der ingen expenses er
    if (expenses.length === 0) {

        showExpenseMessage("Der er ingen udgifter");
        return;
    }

    // Fjerner tidligere beskeder
    showExpenseMessage("");

    // Gennemgår alle expenses
    expenses.forEach((expense, index) => {

        // Opretter ny tabel række
        const row = document.createElement("tr");
        row.style.cursor = "pointer";

        // Åbn popup ved klik på row
        row.addEventListener("click", function () {
            openExpenseModal(index);
        });

        // Indsætter expense data i rækken
        row.innerHTML = `
            <td>${expense.title}</td>
            <td>${expense.amount} kr.</td>
            <td>${expense.date}</td>
        `;

        // Tilføjer rækken til tabellen
        tableBody.appendChild(row);
    });
}

// Åbner popup med expense info
function openExpenseModal(index) {

    const expense = allExpenses[index];

    document.getElementById("modalExpenseTitle").textContent =
        expense.title;

    document.getElementById("modalExpenseAmount").textContent =
        expense.amount + " kr.";

    document.getElementById("modalExpenseDate").textContent =
        formatDate(expense.date);

    document.getElementById("modalExpenseUserId").textContent =
        expense.username ?? "Slettet bruger";

    document.getElementById("modalExpenseReceipt").src =
        expense.receiptBase64;

    document.getElementById("expenseModal").style.display = "flex";

    const receiptImage = document.getElementById("modalExpenseReceipt");
    const noReceiptMessage = document.getElementById("modalExpenseNoReceipt");

    if (expense.receiptBase64) {
        receiptImage.src = expense.receiptBase64;
        receiptImage.style.display = "block";
        noReceiptMessage.style.display = "none";
    } else {
        receiptImage.removeAttribute("src");
        receiptImage.style.display = "none";
        noReceiptMessage.style.display = "block";
    }
}

// Lukker popup
function closeExpenseModal() {

    document.getElementById("expenseModal").style.display = "none";
}

// Formatterer dato
function formatDate(dateString) {

    if (!dateString) {
        return "Ingen dato";
    }

    const date = new Date(dateString);

    return date.toLocaleDateString("da-DK", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

// Viser besked til bruger
function showExpenseMessage(message) {

    document
        .getElementById("expenseListMessage")
        .textContent = message;
}