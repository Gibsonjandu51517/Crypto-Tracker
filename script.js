/*
    Name: Gibson
    Class: CSE 2nd Year
    Assignment: 5 (Crypto API Project)
    Date: 26/11/2025
*/

// --- 1. Global Variables & Config ---
const BASE_URL = "https://api.coingecko.com/api/v3";
let curr = "usd";    // Default currency
let sign = "$";      // Default symbol
let allData = [];    // To store API response
let myChart = null;  // For the Chart.js graph

// --- 2. Selecting DOM Elements ---
const homeDiv = document.getElementById("home-page");
const detailsDiv = document.getElementById("coin-page");
const tableBody = document.getElementById("crypto-table-body");
const searchBox = document.getElementById("searchInput");
const loader = document.getElementById("loader");

// --- 3. Function to Fetch Data from API ---
async function fetchAllCoins() {
    console.log("Fetching data from API..."); // Debugging

    try {
        // Fetching top 35 coins by market cap
        let url = `${BASE_URL}/coins/markets?vs_currency=${curr}&order=market_cap_desc&per_page=35&page=1&sparkline=false`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        // Save data to global variable
        allData = data;
        console.log(allData); // Check if data arrived

        // Call function to show table
        showTable(allData);

    } catch (error) {
        console.log("Error: " + error);
        tableBody.innerHTML = "<p>Failed to load data. Please refresh.</p>";
    }
}

// --- 4. Function to Display Table Rows ---
function showTable(items) {
    // Clear previous data
    tableBody.innerHTML = "";

    // Loop through each coin
    items.forEach(coin => {
        
        // Check if price is positive or negative (for color)
        let color = "green";
        if (coin.price_change_percentage_24h < 0) {
            color = "red";
        }

        // Creating a new div for the row
        let row = document.createElement("div");
        row.className = "table-layout coin-row";
        
        // Adding Click event to open details
        row.onclick = function() {
            openDetails(coin.id);
        };

        // Injecting HTML
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

        tableBody.appendChild(row);
    });
}

// --- 5. Search Logic ---
function searchHandler() {
    let text = searchBox.value.toLowerCase();
    
    // Filter the array
    let filteredData = allData.filter(coin => {
        return coin.name.toLowerCase().includes(text) || coin.symbol.toLowerCase().includes(text);
    });

    // Show filtered results
    showTable(filteredData);
}

// Auto-refresh table when search is cleared
searchBox.addEventListener("input", (e) => {
    if(e.target.value === "") {
        showTable(allData);
    }
});

// --- 6. Handle Currency Change ---
function changeCurrency() {
    let selectBox = document.getElementById("currency-select");
    curr = selectBox.value;

    // Update the symbol variable
    if(curr == "usd") sign = "$";
    else if(curr == "eur") sign = "€";
    else if(curr == "inr") sign = "₹";

    // Reload data with new currency
    fetchAllCoins();
}

// --- 7. Coin Details & Chart Logic ---
async function openDetails(id) {
    console.log("Clicked coin ID: " + id);

    // Hide Home, Show Details
    homeDiv.classList.add("hidden");
    detailsDiv.classList.remove("hidden");
    loader.classList.remove("hidden"); // Show spinner
    document.getElementById("coin-content").classList.add("hidden");

    try {
        // API Call 1: Get Coin Info
        let res1 = await fetch(`${BASE_URL}/coins/${id}`);
        let data1 = await res1.json();

        // API Call 2: Get Chart Data (10 days)
        let res2 = await fetch(`${BASE_URL}/coins/${id}/market_chart?vs_currency=${curr}&days=10&interval=daily`);
        let data2 = await res2.json();

        // Update UI
        updateCoinInfo(data1);
        drawChart(data2.prices);

        // Hide spinner, show content
        loader.classList.add("hidden");
        document.getElementById("coin-content").classList.remove("hidden");

    } catch (err) {
        console.log(err);
    }
}

// Helper to update text in Details Page
function updateCoinInfo(info) {
    document.getElementById("detail-image").src = info.image.large;
    document.getElementById("detail-name").innerText = info.name;
    document.getElementById("detail-symbol").innerText = "(" + info.symbol.toUpperCase() + ")";
    
    document.getElementById("detail-price").innerText = sign + " " + info.market_data.current_price[curr].toLocaleString();
    document.getElementById("detail-market-cap").innerText = sign + " " + info.market_data.market_cap[curr].toLocaleString();
    document.getElementById("detail-high").innerText = sign + " " + info.market_data.high_24h[curr].toLocaleString();
    document.getElementById("detail-low").innerText = sign + " " + info.market_data.low_24h[curr].toLocaleString();
}

// --- 8. Chart.js Function ---
function drawChart(priceArray) {
    let ctx = document.getElementById('coinChart').getContext('2d');

    // Remove old chart if exists (otherwise it glitches)
    if (myChart) {
        myChart.destroy();
    }

    // Convert timestamps to readable dates
    let labels = priceArray.map(item => {
        let date = new Date(item[0]);
        return date.getDate() + "/" + (date.getMonth() + 1);
    });

    let prices = priceArray.map(item => item[1]);

    // Create new Chart
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

// Back Button Logic
function showHome() {
    homeDiv.classList.remove("hidden");
    detailsDiv.classList.add("hidden");
}

// Run this when page loads
fetchAllCoins();