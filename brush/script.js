const size = {w: 350, h: 300};

// contains the full timeilne
const timeSVG = d3.select('svg.time');
// contains the detailed bar chart
const delaySVG = d3.select('svg.delay');

// defining a container group
// which will contain everything within the SVG
// we can transform it to make things everything zoomable
const timeG = timeSVG.append('g').classed('container', true);
const delayG = delaySVG.append('g').classed('container', true);

// defining all the required variables as global
let flightsData,
    delayScaleX, delayScaleY,
    timeScaleX, timeScaleY,
    timeBrush, arrivalBrush, filters = {};


// setting width and height of the SVG elements
timeSVG.attr('width', size.w)
    .attr('height', size.h);
delaySVG.attr('width', size.w)
    .attr('height', size.h);

// loading our data
Promise.all([
    d3.csv('data/flights-filtered.csv')
]).then(function (datasets) {
    // processing data a bit to calculate dates and change strings to numbers
    flightsData = datasets[0].map((row, i) => {
        row.date = new Date(row.date*1000);
        row.delay = +row.delay;
        row.distance = +row.distance;
        row.id = i;

        return row;
    });

});

function updateData() {
}

// DRAW BAR CHART for time
function drawTimeChart(data = flightsData) {
}

// DRAW LINE CHART for delay
function drawDelayChart(data = flightsData) {
}


// LOADING TABLE
function loadTable(data = flightsData) {
}