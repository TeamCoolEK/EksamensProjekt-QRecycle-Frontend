export function renderAdminNavbar(title = "Admin") {

    return `

        <nav class="navbar admin-navbar">

            <div class="admin-navbar-left">
                <img
                    src="img/logo.png"
                    class="nav-logo admin-logo-btn"
                    id="adminDashboardBtn"
                    alt="Dashboard"
                >
            </div>

            <span class="nav-title">
                ${title}
            </span>

            <div class="admin-navbar-right">
                <button
                    id="logoutBtn"
                    class="logout-btn"
                >
                    Log ud
                </button>
            </div>

        </nav>
    `;
}

export function setupAdminNavbarEvents() {

    document
        .getElementById("adminDashboardBtn")
        .addEventListener("click", function () {

            window.location.hash = "#/admin/dashboard";
        });

    document
        .getElementById("logoutBtn")
        .addEventListener("click", function () {

            localStorage.removeItem("jwt");

            window.location.hash = "#/login";
        });
}