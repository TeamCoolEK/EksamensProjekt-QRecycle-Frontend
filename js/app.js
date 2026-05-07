//Henter API base fra config.js (første script i index)
const BASE_URL = window.APP_CONFIG.apiBaseUrl;

fetch( BASE_URL + "/restaurant/getRestaurants")
    .then(res => res.json())
    .then(data => {
        console.log(data);
        document.body.innerHTML = JSON.stringify(data);
    })
    .catch(err => console.log(err));