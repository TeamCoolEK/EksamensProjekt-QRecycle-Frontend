fetch("http://localhost:8080/api/restaurants")
    .then(res => res.json())
    .then(data => {
        console.log(data);
        document.body.innerHTML = JSON.stringify(data);
    })
    .catch(err => console.log(err));