// admin/user-list.js
import { BASE_URL } from "../../config.js";

// Init-slagenter: kaldes fra routeren
export function initAdminUserList() {
    renderUserListPage();
}

// Renderer for "Alle brugere" siden
function renderUserListPage() {
    document.getElementById("app").innerHTML = `
    <h1>Brugeradministration</h1>
    

    <div style="margin-bottom:20px;">
      <button onclick="window.location.hash='#/admin/dashboard'">Tilbage til dashboard</button>
      <button id="btnCreateUser">Opret bruger</button>
    </div>

    <table id="usersTable" border="1" cellpadding="6" cellspacing="0" width="100%">
      <thead>
        <tr>
          <th>ID</th>
          <th>Navn</th>
          <th>Rolle</th>
        </tr>
      </thead>
      <tbody id="usersTableBody"></tbody>
    </table>

    <p id="allUsersMessage" style="color:red;"></p>
  `;

    // Bind Opret-knappen til oprettelsesruten
    document.getElementById("btnCreateUser").addEventListener("click", () => {
        window.location.hash = '#/admin/createUser';
    });

    // Hent og vis data
    loadUserListData();
}

// Henter data for alle brugere
async function loadUserListData() {
    const token = localStorage.getItem('jwt');
    try {
        const res = await fetch(BASE_URL + "/admin/users", {
            method: "GET",
            headers: { 'Authorization': `${token}` } // Følg dit nuværende token-format
        });

        if (!res.ok) {
            throw new Error("Kunne ikke hente brugere");
        }

        const users = await res.json();
        renderUsersTable(users);
    } catch (err) {
        console.log(err);
        document.getElementById("allUsersMessage").textContent = "Kunne ikke hente brugere";
    }
}

// Renderér tabellen med brugere
function renderUsersTable(users) {
    const tbody = document.getElementById("usersTableBody");
    tbody.innerHTML = "";

    if (!Array.isArray(users) || users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3">Ingen brugere fundet</td></tr>`;
        return;
    }

    users.forEach(u => {
        const tr = document.createElement("tr");
        const displayName = u.username ?? u.name ?? '';
        const role = u.role ?? '';

        tr.innerHTML = `
          <td>${u.id ?? ""}</td>
          <td>${displayName}</td>
          <td>${role}</td>
        `;
        tbody.appendChild(tr);
    });
}