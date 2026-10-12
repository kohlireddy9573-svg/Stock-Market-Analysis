// ============================================================
// STOCK MARKET ANALYSIS
// PLAIN JAVASCRIPT
// ============================================================


// ============================================================
// STOCKS
// ============================================================

const stocks = [
    "AAPL",
    "MSFT",
    "GOOGL",
    "AMZN",
    "PYPL",
    "TSLA",
    "JPM",
    "NVDA",
    "NFLX",
    "DIS"
];


// ============================================================
// API URLs
// ============================================================

const API_BASE =
    "https://stock-market-api-k9vl.onrender.com/api";

const CHART_API =
    `${API_BASE}/stocksdata`;

const STATS_API =
    `${API_BASE}/stockstatsdata`;

const DETAILS_API =
    `${API_BASE}/profitdata`;


// ============================================================
// DOM ELEMENTS
// ============================================================

const stockContainer =
    document.querySelector("#stock-container");

const stockDetails =
    document.querySelector("#stock-details");

const canvas =
    document.querySelector("#stockChart");

const ctx =
    canvas.getContext("2d");

const tooltip =
    document.querySelector("#chart-tooltip");

const peakValue =
    document.querySelector("#peak-value");

const lowValue =
    document.querySelector("#low-value");

const rangeButtons =
    document.querySelectorAll(".range-btn");


// ============================================================
// APPLICATION VARIABLES
// ============================================================

let chartData = [];

let stockStats = [];

let stockDetailsData = [];

let selectedStock = "AAPL";

let selectedRange = "1month";


// ============================================================
// API FUNCTIONS
// ============================================================

async function getChartData() {

    const response =
        await fetch(CHART_API);

    if (!response.ok) {
        throw new Error(
            `Chart API error: ${response.status}`
        );
    }

    return await response.json();
}


async function getStatsData() {

    const response =
        await fetch(STATS_API);

    if (!response.ok) {
        if (response.status === 404) {
            return [];
        }

        throw new Error(
            `Stats API error: ${response.status}`
        );
    }

    return await response.json();
}


async function getDetailsData() {

    const response =
        await fetch(DETAILS_API);

    if (!response.ok) {
        if (response.status === 404) {
            return [];
        }

        throw new Error(
            `Details API error: ${response.status}`
        );
    }

    return await response.json();
}


// ============================================================
// CONVERT API RESPONSE INTO ARRAY
// ============================================================

function convertToArray(data) {

    // Already an array
    if (Array.isArray(data)) {
        return data;
    }


    // Common API wrapper properties
    if (data && Array.isArray(data.data)) {
        return data.data;
    }


    if (data && Array.isArray(data.stocksData)) {
        return data.stocksData;
    }


    if (data && Array.isArray(data.stocks)) {
        return data.stocks;
    }


    if (data && Array.isArray(data.result)) {
        return data.result;
    }


    if (data && Array.isArray(data.results)) {
        return data.results;
    }


    // If object contains stock keys
    if (
        data &&
        typeof data === "object"
    ) {

        const values =
            Object.values(data);

        if (
            values.length &&
            values.every(
                value =>
                    typeof value === "object"
            )
        ) {

            return values;
        }
    }


    return [];
}


// ============================================================
// HELPER - GET NUMBER
// ============================================================

function getNumber(value) {

    if (typeof value === "number") {
        return value;
    }


    if (typeof value === "string") {

        const number =
            parseFloat(
                value.replace(
                    /[$,%]/g,
                    ""
                )
            );

        return isNaN(number)
            ? 0
            : number;
    }


    return 0;
}


// ============================================================
// HELPER - GET STOCK NAME
// ============================================================

function getStockName(item) {

    if (!item) {
        return undefined;
    }


    return (
        item.name ??
        item.symbol ??
        item.stock ??
        item.ticker ??
        item.code
    );
}


// ============================================================
// HELPER - GET BOOK VALUE
// ============================================================

function getBookValue(item) {

    if (!item) {
        return 0;
    }


    return getNumber(
        item.bookValue ??
        item.bookvalue ??
        item.book_value ??
        item.bookVal ??
        item.price ??
        item.value
    );
}


// ============================================================
// HELPER - GET PROFIT
// ============================================================

function getProfit(item) {

    if (!item) {
        return 0;
    }


    return getNumber(
        item.profit ??
        item.change ??
        item.percentage ??
        item.percent ??
        item.profitPercentage
    );
}


// ============================================================
// FIND STOCK DATA
// ============================================================

function findStock(data, stockName) {

    const array =
        convertToArray(data);


    return array.find(item => {

        return (
            getStockName(item) ===
            stockName
        );

    });
}


function getFallbackStats(stockName) {

    const series =
        chartData?.stocksData?.[0]?.[stockName]?.["1mo"];


    if (
        !series ||
        !Array.isArray(series.value) ||
        !series.value.length
    ) {
        return null;
    }


    const firstValue =
        getNumber(series.value[0]);


    const lastValue =
        getNumber(
            series.value[series.value.length - 1]
        );


    return {
        name: stockName,
        bookValue: lastValue,
        profit: firstValue
            ? ((lastValue - firstValue) / firstValue) * 100
            : 0
    };

}


// ============================================================
// NORMALIZE CHART DATA
// ============================================================

function normalizeChartData(data) {

    const apiStock =
        data?.stocksData?.[0]?.[selectedStock];


    if (apiStock) {

        const rangeKey = {
            "1month": "1mo",
            "3month": "3mo",
            "1year": "1y",
            "5year": "5y"
        }[selectedRange];


        const series =
            apiStock[rangeKey];


        if (
            series &&
            Array.isArray(series.value) &&
            Array.isArray(series.timeStamp)
        ) {

            return series.value
                .map((value, index) => ({
                    timestamp:
                        Number(series.timeStamp[index]) * 1000,
                    price: getNumber(value)
                }))
                .filter(item => {
                    return (
                        Number.isFinite(item.timestamp) &&
                        Number.isFinite(item.price)
                    );
                });

        }

    }

    const array =
        convertToArray(data);


    let result = [];


    // --------------------------------------------------------
    // Find selected stock object
    // --------------------------------------------------------

    const stockObject =
        array.find(item => {

            return (
                getStockName(item) ===
                selectedStock
            );

        });


    // --------------------------------------------------------
    // If stock object contains data
    // --------------------------------------------------------

    if (
        stockObject &&
        Array.isArray(stockObject.data)
    ) {

        result =
            stockObject.data;

    }


    // --------------------------------------------------------
    // If stock object contains history
    // --------------------------------------------------------

    else if (
        stockObject &&
        Array.isArray(stockObject.history)
    ) {

        result =
            stockObject.history;

    }


    // --------------------------------------------------------
    // If stock object contains prices
    // --------------------------------------------------------

    else if (
        stockObject &&
        Array.isArray(stockObject.prices)
    ) {

        result =
            stockObject.prices;

    }


    // --------------------------------------------------------
    // Otherwise use array itself
    // --------------------------------------------------------

    else {

        result =
            array.filter(item => {

                const name =
                    getStockName(item);

                return (
                    !name ||
                    name === selectedStock
                );

            });

    }


    // --------------------------------------------------------
    // Convert each point
    // --------------------------------------------------------

    return result
        .map(item => {

            const timestamp =
                item.timestamp ??
                item.time ??
                item.date ??
                item.datetime ??
                item.Date ??
                item.x;


            const price =
                getNumber(
                    item.price ??
                    item.Price ??
                    item.value ??
                    item.close ??
                    item.Close ??
                    item.y
                );


            return {
                timestamp,
                price
            };

        })
        .filter(item => {

            return (
                item.timestamp !== undefined &&
                item.timestamp !== null &&
                !isNaN(item.price)
            );

        });

}


// ============================================================
// GET RANGE DATA
// ============================================================

function getRangeData(data) {

    if (!data.length) {
        return [];
    }


    /*
       The API may provide historical data
       that doesn't end on today's date.

       Therefore we use the number of data
       points instead of comparing with Date.now().
    */


    let numberOfPoints;


    switch (selectedRange) {

        case "1month":

            numberOfPoints = 30;

            break;


        case "3month":

            numberOfPoints = 90;

            break;


        case "1year":

            numberOfPoints = 365;

            break;


        case "5year":

            numberOfPoints = data.length;

            break;


        default:

            numberOfPoints = data.length;
    }


    if (
        data.length <=
        numberOfPoints
    ) {

        return data;
    }


    return data.slice(
        data.length - numberOfPoints
    );

}


// ============================================================
// RENDER STOCK LIST
// ============================================================

function renderStockList() {

    stockContainer.innerHTML = "";


    stocks.forEach(stockName => {

        const stats =
            findStock(
                stockStats,
                stockName
            ) ||
            getFallbackStats(stockName);


        const hasStats =
            Boolean(stats);


        const bookValue =
            getBookValue(stats);


        const profit =
            getProfit(stats);


        const item =
            document.createElement("div");


        item.className =
            "stock-item";


        const button =
            document.createElement("button");


        button.className =
            "stock-button";


        if (
            stockName ===
            selectedStock
        ) {

            button.classList.add(
                "selected"
            );

        }


        button.dataset.stock =
            stockName;


        button.textContent =
            stockName;


        const price =
            document.createElement("span");


        price.className =
            "stock-price";


        price.textContent =
            hasStats
                ? `$${bookValue.toFixed(3)}`
                : "N/A";


        const profitElement =
            document.createElement("span");


        profitElement.className =
            "stock-profit";


        if (hasStats && profit >= 0) {

            profitElement.classList.add(
                "profit-positive"
            );

        } else if (hasStats) {

            profitElement.classList.add(
                "profit-negative"
            );

        }


        profitElement.textContent =
            hasStats
                ? `${profit.toFixed(2)}%`
                : "N/A";


        item.appendChild(button);

        item.appendChild(price);

        item.appendChild(
            profitElement
        );


        stockContainer.appendChild(item);

    });

}


// ============================================================
// STOCK CLICK
// ============================================================

stockContainer.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".stock-button"
            );


        if (!button) {
            return;
        }


        selectedStock =
            button.dataset.stock;


        renderStockList();

        renderChart();

        renderDetails();

    }
);


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(timestamp) {

    const date =
        new Date(timestamp);


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return String(timestamp);

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


// ============================================================
// CANVAS RESIZE
// ============================================================

function resizeCanvas() {

    const rect =
        canvas.getBoundingClientRect();


    const ratio =
        window.devicePixelRatio || 1;


    canvas.width =
        rect.width * ratio;


    canvas.height =
        rect.height * ratio;


    ctx.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0
    );


    renderChart();

}


// ============================================================
// DRAW CHART
// ============================================================

function renderChart() {

    const rect =
        canvas.getBoundingClientRect();


    const width =
        rect.width;


    const height =
        rect.height;


    if (
        !width ||
        !height
    ) {

        return;
    }


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    const normalized =
        normalizeChartData(
            chartData
        );


    const data =
        getRangeData(
            normalized
        );


    // --------------------------------------------------------
    // No data
    // --------------------------------------------------------

    if (!data.length) {

        ctx.fillStyle =
            "white";


        ctx.font =
            "18px Arial";


        ctx.fillText(
            "No chart data available",
            30,
            50
        );


        peakValue.textContent =
            "--";


        lowValue.textContent =
            "--";


        return;
    }


    // --------------------------------------------------------
    // Chart dimensions
    // --------------------------------------------------------

    const paddingLeft = 55;

    const paddingRight = 25;

    const paddingTop = 25;

    const paddingBottom = 45;


    const chartWidth =
        width -
        paddingLeft -
        paddingRight;


    const chartHeight =
        height -
        paddingTop -
        paddingBottom;


    // --------------------------------------------------------
    // Prices
    // --------------------------------------------------------

    const prices =
        data.map(
            item =>
                item.price
        );


    let min =
        Math.min(...prices);


    let max =
        Math.max(...prices);


    const originalRange =
        max - min || 1;


    min -=
        originalRange * 0.08;


    max +=
        originalRange * 0.08;


    // --------------------------------------------------------
    // Peak / Low
    // --------------------------------------------------------

    const highest =
        Math.max(...prices);


    const lowest =
        Math.min(...prices);


    peakValue.textContent =
        `$${highest.toFixed(2)}`;


    lowValue.textContent =
        `$${lowest.toFixed(2)}`;


    // --------------------------------------------------------
    // Grid
    // --------------------------------------------------------

    ctx.strokeStyle =
        "rgba(255,255,255,0.08)";


    ctx.lineWidth = 1;


    const gridLines = 5;


    for (
        let i = 0;
        i <= gridLines;
        i++
    ) {

        const y =
            paddingTop +
            (
                chartHeight /
                gridLines
            ) *
            i;


        ctx.beginPath();


        ctx.moveTo(
            paddingLeft,
            y
        );


        ctx.lineTo(
            width -
            paddingRight,
            y
        );


        ctx.stroke();


        const value =
            max -
            (
                (
                    max -
                    min
                ) /
                gridLines
            ) *
            i;


        ctx.fillStyle =
            "#aaa";


        ctx.font =
            "11px Arial";


        ctx.fillText(
            value.toFixed(2),
            5,
            y + 4
        );

    }


    // --------------------------------------------------------
    // Coordinate functions
    // --------------------------------------------------------

    function getX(index) {

        if (data.length === 1) {

            return (
                paddingLeft +
                chartWidth / 2
            );

        }


        return (
            paddingLeft +
            (
                index /
                (data.length - 1)
            ) *
            chartWidth
        );

    }


    function getY(price) {

        return (
            paddingTop +
            (
                (
                    max -
                    price
                ) /
                (
                    max -
                    min
                )
            ) *
            chartHeight
        );

    }


    // --------------------------------------------------------
    // Draw line
    // --------------------------------------------------------

    ctx.beginPath();


    data.forEach(
        (item, index) => {

            const x =
                getX(index);


            const y =
                getY(item.price);


            if (index === 0) {

                ctx.moveTo(
                    x,
                    y
                );

            } else {

                ctx.lineTo(
                    x,
                    y
                );

            }

        }
    );


    ctx.strokeStyle =
        "#00ff19";


    ctx.lineWidth = 2;


    ctx.stroke();


    // --------------------------------------------------------
    // X axis dates
    // --------------------------------------------------------

    const labelCount =
        Math.min(
            5,
            data.length
        );


    for (
        let i = 0;
        i < labelCount;
        i++
    ) {

        const index =
            Math.floor(
                (
                    i /
                    (
                        labelCount -
                        1 ||
                        1
                    )
                ) *
                (
                    data.length -
                    1
                )
            );


        const x =
            getX(index);


        ctx.fillStyle =
            "#aaa";


        ctx.font =
            "11px Arial";


        ctx.textAlign =
            "center";


        ctx.fillText(
            formatDate(
                data[index].timestamp
            ),
            x,
            height - 12
        );

    }


    ctx.textAlign =
        "left";

}


// ============================================================
// CHART HOVER
// ============================================================

canvas.addEventListener(
    "mousemove",
    event => {

        const normalized =
            normalizeChartData(
                chartData
            );


        const data =
            getRangeData(
                normalized
            );


        if (!data.length) {
            return;
        }


        const rect =
            canvas.getBoundingClientRect();


        const mouseX =
            event.clientX -
            rect.left;


        const paddingLeft = 55;

        const paddingRight = 25;


        const chartWidth =
            rect.width -
            paddingLeft -
            paddingRight;


        if (
            mouseX <
            paddingLeft ||
            mouseX >
            rect.width -
            paddingRight
        ) {

            tooltip.style.display =
                "none";


            renderChart();


            return;
        }


        let index;


        if (data.length === 1) {

            index = 0;

        } else {

            index =
                Math.round(
                    (
                        mouseX -
                        paddingLeft
                    ) /
                    chartWidth *
                    (
                        data.length -
                        1
                    )
                );

        }


        index =
            Math.max(
                0,
                Math.min(
                    data.length - 1,
                    index
                )
            );


        const item =
            data[index];


        // ----------------------------------------------------
        // Redraw normal chart
        // ----------------------------------------------------

        renderChart();


        // ----------------------------------------------------
        // Calculate point
        // ----------------------------------------------------

        const prices =
            data.map(
                item =>
                    item.price
            );


        let min =
            Math.min(...prices);


        let max =
            Math.max(...prices);


        const originalRange =
            max - min || 1;


        min -=
            originalRange * 0.08;


        max +=
            originalRange * 0.08;


        const paddingTop = 25;

        const paddingBottom = 45;


        const chartHeight =
            rect.height -
            paddingTop -
            paddingBottom;


        const x =
            data.length === 1
                ? paddingLeft +
                  chartWidth / 2
                : paddingLeft +
                  (
                      index /
                      (
                          data.length -
                          1
                      )
                  ) *
                  chartWidth;


        const y =
            paddingTop +
            (
                (
                    max -
                    item.price
                ) /
                (
                    max -
                    min
                )
            ) *
            chartHeight;


        // ----------------------------------------------------
        // Vertical line
        // ----------------------------------------------------

        ctx.beginPath();


        ctx.moveTo(
            x,
            paddingTop
        );


        ctx.lineTo(
            x,
            rect.height -
            paddingBottom
        );


        ctx.strokeStyle =
            "rgba(255,255,255,0.7)";


        ctx.lineWidth = 1;


        ctx.stroke();


        // ----------------------------------------------------
        // Point
        // ----------------------------------------------------

        ctx.beginPath();


        ctx.arc(
            x,
            y,
            4,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            "#00ff19";


        ctx.fill();


        // ----------------------------------------------------
        // Tooltip
        // ----------------------------------------------------

        tooltip.replaceChildren();


        const title =
            document.createElement(
                "strong"
            );


        title.textContent =
            selectedStock;


        tooltip.appendChild(
            title
        );


        tooltip.appendChild(
            document.createTextNode(
                `: $${item.price.toFixed(2)}`
            )
        );


        tooltip.appendChild(
            document.createElement(
                "br"
            )
        );


        tooltip.appendChild(
            document.createTextNode(
                formatDate(
                    item.timestamp
                )
            )
        );


        tooltip.style.display =
            "block";


        let tooltipLeft =
            x + 12;


        let tooltipTop =
            y - 20;


        if (
            tooltipLeft + 150 >
            rect.width
        ) {

            tooltipLeft =
                x - 160;

        }


        tooltip.style.left =
            `${tooltipLeft}px`;


        tooltip.style.top =
            `${tooltipTop}px`;

    }
);


// ============================================================
// HIDE TOOLTIP
// ============================================================

canvas.addEventListener(
    "mouseleave",
    () => {

        tooltip.style.display =
            "none";


        renderChart();

    }
);


// ============================================================
// RANGE BUTTONS
// ============================================================

rangeButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                selectedRange =
                    button.dataset.range;


                rangeButtons.forEach(
                    btn => {

                        btn.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                renderChart();

            }
        );

    }
);


// ============================================================
// GET SUMMARY
// ============================================================

function getSummary(item) {

    if (!item) {
        return "";
    }


    return (
        item.summary ??
        item.description ??
        item.details ??
        item.about ??
        item.text ??
        item.content ??
        ""
    );

}


// ============================================================
// RENDER DETAILS
// ============================================================

function renderDetails() {

    const stats =
        findStock(
            stockStats,
            selectedStock
        ) ||
        getFallbackStats(selectedStock);


    const details =
        findStock(
            stockDetailsData,
            selectedStock
        );


    const hasStats =
        Boolean(stats);


    const bookValue =
        hasStats
            ? getBookValue(stats)
            : 0;


    const profit =
        hasStats
            ? getProfit(stats)
            : 0;


    const summary =
        getSummary(details) ||
        "Historical market data is available for this stock across the selected time ranges.";


    stockDetails.innerHTML = `

        <div class="details-grid">

            <div class="detail-card">

                <span>
                    Stock
                </span>

                <strong>
                    ${selectedStock}
                </strong>

            </div>


            <div class="detail-card">

                <span>
                    Book Value
                </span>

                <strong>
                    ${
                        hasStats
                            ? `$${bookValue.toFixed(3)}`
                            : "N/A"
                    }
                </strong>

            </div>


            <div class="detail-card">

                <span>
                    Profit
                </span>

                <strong
                    class="${
                        hasStats && profit >= 0
                            ? "profit-positive"
                            : hasStats
                                ? "profit-negative"
                                : ""
                    }"
                >
                    ${
                        hasStats
                            ? `${profit.toFixed(2)}%`
                            : "N/A"
                    }
                </strong>

            </div>

        </div>


        <p class="summary"></p>

    `;


    const summaryElement =
        stockDetails.querySelector(
            ".summary"
        );


    summaryElement.textContent =
        summary ||
        "No summary available.";

}


// ============================================================
// INITIALIZE APPLICATION
// ============================================================

async function init() {

    try {

        console.log(
            "Fetching stock data..."
        );


        const [
            chartResponse,
            statsResponse,
            detailsResponse
        ] = await Promise.all([

            getChartData(),

            getStatsData(),

            getDetailsData()

        ]);


        // ----------------------------------------------------
        // IMPORTANT DEBUG OUTPUT
        // ----------------------------------------------------

        console.log(
            "CHART RESPONSE:",
            chartResponse
        );


        console.log(
            "STATS RESPONSE:",
            statsResponse
        );


        console.log(
            "DETAILS RESPONSE:",
            detailsResponse
        );


        // ----------------------------------------------------
        // Store responses
        // ----------------------------------------------------

        chartData =
            chartResponse;


        stockStats =
            convertToArray(
                statsResponse
            );


        stockDetailsData =
            convertToArray(
                detailsResponse
            );


        // ----------------------------------------------------
        // Show normalized data
        // ----------------------------------------------------

        console.log(
            "NORMALIZED STATS:",
            stockStats
        );


        console.log(
            "NORMALIZED DETAILS:",
            stockDetailsData
        );


        // ----------------------------------------------------
        // Render
        // ----------------------------------------------------

        renderStockList();

        resizeCanvas();

        renderDetails();

    }
    catch (error) {

        console.error(
            "APPLICATION ERROR:",
            error
        );


        stockContainer.innerHTML = `

            <p style="color:red">

                Unable to load stock data.

            </p>

        `;


        stockDetails.textContent =
            "Unable to load stock details.";


        peakValue.textContent =
            "--";


        lowValue.textContent =
            "--";

    }

}


// ============================================================
// WINDOW RESIZE
// ============================================================

window.addEventListener(
    "resize",
    resizeCanvas
);


// ============================================================
// START APPLICATION
// ============================================================

init();