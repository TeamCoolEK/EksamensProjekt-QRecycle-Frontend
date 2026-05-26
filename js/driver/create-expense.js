import { BASE_URL } from '../../config.js';

export function initDriverExpenses() {
    renderDriverExpensePage();
}

function renderDriverExpensePage() {

    document.getElementById("app").innerHTML = `

        <!-- Navbar -->
        <nav class="navbar">

            <span class="nav-title">
                Registrer udgift
            </span>

            <img
                src="img/logo.png"
                class="nav-logo"
                alt="Q Genbrug"
            >

        </nav>

        <div class="page-container">

            <div class="business-actions">
                <button id="backToDashboardBtn">
                    Tilbage til dashboard
                </button>
            </div>

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

        </div>
    `;

    setupExpenseEvents();
}

function setupExpenseEvents() {

    document
        .getElementById("backToDashboardBtn")
        .addEventListener("click", function () {

            window.location.hash = "#/driver/dashboard";
        });

    document
        .getElementById("expenseForm")
        .addEventListener("submit", handleExpenseSubmit);

    document
        .getElementById("expenseReceipt")
        .addEventListener("change", handleImagePreview);
}

async function handleImagePreview() {

    const file = document.getElementById("expenseReceipt").files[0];

    if (!file) {
        return;
    }

    const receiptBase64 = await imageToBase64(file);

    const previewImage = document.getElementById("previewImage");

    previewImage.src = receiptBase64;
    previewImage.style.display = "block";
}

async function handleExpenseSubmit(event) {

    event.preventDefault();

    const expense = await buildExpenseObject();

    if (!validateExpense(expense)) {
        showExpenseMessage("Udfyld alle felter korrekt");
        return;
    }

    try {
        const response = await saveExpense(expense);

        console.log(response);

        showSuccessAnimation();

    } catch (error) {
        console.log(error);
        showExpenseMessage("Fejl ved gemning");
    }
}

async function buildExpenseObject() {

    const file = document.getElementById("expenseReceipt").files[0];
    const receiptBase64 = file ? await imageToBase64(file) : null;

    return {
        title: document.getElementById("expenseTitle").value,
        amount: Number(document.getElementById("expenseAmount").value),
        receiptBase64: receiptBase64
    };
}

function validateExpense(expense) {

    return expense.title.trim() !== ""
        && expense.amount > 0
        && expense.receiptBase64 !== null;
}

function imageToBase64(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
            console.log(reader.result);
            resolve(reader.result.toString());
        };

        reader.onerror = function (error) {
            reject(error);
        };
    });
}

async function saveExpense(expense) {

    const token = localStorage.getItem("jwt");

    const response = await fetch(
        `${BASE_URL}/driver/expenses`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token
            },
            body: JSON.stringify(expense)
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
    }

    return await response.text();
}

function showSuccessAnimation() {

    const emoji = document.createElement("div");

    emoji.classList.add("success-emoji");

    emoji.textContent = "👍";

    document.body.appendChild(emoji);

    setTimeout(() => {
        emoji.classList.add("fade-out");
    }, 1000);

    setTimeout(() => {
        window.location.hash = "#/driver/dashboard";
    }, 1600);
}

function showExpenseMessage(message) {

    document
        .getElementById("expenseMessage")
        .textContent = message;
}