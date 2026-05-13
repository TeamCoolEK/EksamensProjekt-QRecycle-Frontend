function renderAdminBusinessListPage(){

    document.getElementById("app").innerHTML = `
    <h1> Virksomhedsadministration </h1>
    
    <button onclick="renderAdminDashboardPage()">
    Tilbage til dashboard
    
    <button onclick="renderBusinessPage()">
        Opret virksomhed
        </button>
</button>
    
    <h2> Alle virksomheder </h2>
    
    <p id="businessListMessage">Indlæser...</p>
    
    <table>
    <thead>
        <tr>
            <th>Virksomhedsnavn</th>
            <th>Kontaktperson</th>
            <th>Telefonnummer</th>
            <th>Adresse</th>
        </tr>
    </thead>
    <tbody id="businessTableBody"></tbody>
</table>
`;

    loadAllBusinesses();
}

function loadAllBusinesses(){
    fetch(BASE_URL + "/admin/businesses",{
        method: "GET", credentials: "include"
    })
        .then(res => {
            if (!res.ok){
                throw new Error("Kunne ikke hente virksomheder")
            }

            return res.json();
        })
        .then(businesses => {displayBusinesses(businesses);
        })
        .catch(error => {console.log(error);

            document.getElementById("businessListMessage").textContent =
                "Kunne ikke hente virksomheder fra databasen";
        })
}

function displayBusinesses(business){

    const tableBody = document.getElementById("businessTableBody");
    const messageElement = document.getElementById("businessListMessage");

    tableBody.innerHTML = "";

    if (business.length === 0){
        messageElement.textContent = "Der er ingen virksomheder";
        return
    }

    messageElement.textContent = "";

    business.forEach(business => {

        const row = document.createElement("tr");

        row.innerHTML = `
       <td>${business.name}</td>
       <td>${business.contactPerson}</td>
       <td>${business.phoneNumber}</td>
       <td>${business.address}</td>
        `;

        tableBody.appendChild(row);
    })
}