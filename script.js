/*
    Subject: Web Development (Assignment 5)
    Topic: Fetch API & Async/Await
    Student: Gibson | CSE 2nd Year
*/

// --- HINT: API Keys ---
// Some APIs need a key. CoinGecko is public, but if I had a key, I would put it here.
// Documentation says to pass it in the header or URL.
const API_KEY = "CG-XXXXXXXX"; // (Optional Key)
const BASE_URL = "https://api.coingecko.com/api/v3";

let curr = "usd";    // Default currency
let sign = "$";      // Default symbol
let allData = [];    // Global variable to store fetched data
let myChart = null;  // For the Chart.js graph

// DOM Elements
const homeDiv = document.getElementById("home-page");
const detailsDiv = document.getElementById("coin-page");
const tableBody = document.getElementById("crypto-table-body");
const searchBox = document.getElementById("searchInput");
const loader = document.getElementById("loader");

// --- HINT: Async/Await & Data Flow ---
// JavaScript is single-threaded. I used 'async' and 'await' here.
// If I didn't use 'await', the code would try to display 'data' before it arrived (undefined).
async function fetchAllCoins() {
    console.log("Fetching data... (Check Network Tab F12)"); // HINT: Network Tab debugging

    try {
        // Fetching top 10 coins
        // I am passing the currency and order parameters as per API documentation
        let url = `${BASE_URL}/coins/markets?vs_currency=${curr}&order=market_cap_desc&per_page=10&page=1&sparkline=false`;
        
        // Waiting for the server to respond
        const res = await fetch(url);
        const data = await res.json();
        
        allData = data;
        console.log(allData); // Checking if data is correct

        // Now that data is here, we update the UI
        showTable(allData);

    } catch (error) {
        console.log("Error: " + error);
        tableBody.innerHTML = "<p>Failed to load data. Please refresh.</p>";
    }
}

// --- HINT: DOM Manipulation ---
// I am not writing HTML manually. I am using document.createElement 
// to create rows dynamically based on the API data.
function showTable(items) {
    tableBody.innerHTML = ""; // Clear old data

    items.forEach(coin => {
        
        // Logic for Green/Red color
        let color = "green";
        if (coin.price_change_percentage_24h < 0) {
            color = "red";
        }

        // Creating the row element dynamically
        let row = document.createElement("div");
        row.className = "table-layout coin-row";
        
        // Interactivity: Click to open details
        row.onclick = function() {
            openDetails(coin.id);
        };

        // Updating innerHTML with data
        row.innerHTML = `
            <p>${coin.market_cap_rank}</p>
            <div class="card-coin-flex">
                <img src="${coin.image}" width="30px">
                <p>${coin.name} - ${coin.symbol.toUpperCase()}</p>
            </div>
            <p>${sign} ${coin.current_price.toLocaleString()}</p>
            <p class="${color}">${coin.price_change_percentage_24h.toFixed(2)}%</p>
            <p class="market-cap">${sign} ${coin.market_cap.toLocaleString()}</p>
        `;

        // Appending the new element to the DOM
        tableBody.appendChild(row);
    });
}

// Search Logic
function searchHandler() {
    let text = searchBox.value.toLowerCase();
    
    // Filtering the array
    let filteredData = allData.filter(coin => {
        return coin.name.toLowerCase().includes(text) || coin.symbol.toLowerCase().includes(text);
    });

    showTable(filteredData);
}

// Auto-refresh on typing
searchBox.addEventListener("input", (e) => {
    if(e.target.value === "") {
        showTable(allData);
    }
});

// Currency Change
function changeCurrency() {
    let selectBox = document.getElementById("currency-select");
    curr = selectBox.value;

    if(curr == "usd") sign = "$";
    else if(curr == "eur") sign = "€";
    else if(curr == "inr") sign = "₹";

    fetchAllCoins();
}

// --- Coin Details & Chart Logic ---
async function openDetails(id) {
    console.log("Clicked ID: " + id);

    // Switching views
    homeDiv.classList.add("hidden");
    detailsDiv.classList.remove("hidden");
    loader.classList.remove("hidden"); 
    document.getElementById("coin-content").classList.add("hidden");

    try {
        // Fetching individual coin details
        // Note: Using await again to prevent undefined data
        let res1 = await fetch(`${BASE_URL}/coins/${id}`);
        let data1 = await res1.json();

        // Fetching Chart data
        let res2 = await fetch(`${BASE_URL}/coins/${id}/market_chart?vs_currency=${curr}&days=10&interval=daily`);
        let data2 = await res2.json();

        updateCoinInfo(data1);
        drawChart(data2.prices);

        loader.classList.add("hidden");
        document.getElementById("coin-content").classList.remove("hidden");

    } catch (err) {
        console.log(err);
    }
}

function updateCoinInfo(info) {
    document.getElementById("detail-image").src = info.image.large;
    document.getElementById("detail-name").innerText = info.name;
    document.getElementById("detail-symbol").innerText = "(" + info.symbol.toUpperCase() + ")";
    
    document.getElementById("detail-price").innerText = sign + " " + info.market_data.current_price[curr].toLocaleString();
    document.getElementById("detail-market-cap").innerText = sign + " " + info.market_data.market_cap[curr].toLocaleString();
    document.getElementById("detail-high").innerText = sign + " " + info.market_data.high_24h[curr].toLocaleString();
    document.getElementById("detail-low").innerText = sign + " " + info.market_data.low_24h[curr].toLocaleString();
}

// Chart.js Graph
function drawChart(priceArray) {
    let ctx = document.getElementById('coinChart').getContext('2d');

    if (myChart) {
        myChart.destroy();
    }

    let labels = priceArray.map(item => {
        let date = new Date(item[0]);
        return date.getDate() + "/" + (date.getMonth() + 1);
    });

    let prices = priceArray.map(item => item[1]);

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Price History (10 Days)',
                data: prices,
                borderColor: '#7927ff',
                backgroundColor: 'rgba(121, 39, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: 'white' } }
            },
            scales: {
                x: { ticks: { color: '#bbb' }, grid: { display: false } },
                y: { ticks: { color: '#bbb' }, grid: { color: '#333' } }
            }
        }
    });
}

function showHome() {
    homeDiv.classList.remove("hidden");
    detailsDiv.classList.add("hidden");
}

fetchAllCoins();
