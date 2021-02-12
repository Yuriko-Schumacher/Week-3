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


    // Drawing all charts with the whole data
    drawTimeChart();
    drawDelayChart();
    // loadTable();

    // adding brush to the time bar-chart
    timeBrush = d3.brushX()
        // defining its width and height
        .extent([[0,0], [size.w, size.h]])
        .on('end', function(event) {
            // when the user stops brushing
            // this is the function that's called
            console.log(event.selection);

            // if there is no selection (eg when user just clicks and doesn't drag)
            if (!event.selection) return;

            // calculating the data value from canvas value
            let step = timeScaleX.step()
            let lowerIndex = Math.floor(event.selection[0]/step);
            let lowerVal = timeScaleX.domain()[lowerIndex];

            let upperIndex = Math.floor(event.selection[1]/step);
            let upperVal = timeScaleX.domain()[upperIndex]

            console.log(lowerVal, upperVal);
            filters.time = [lowerVal, upperVal];
            updateData();
        });
    // binding the brush to timeSVG
    timeSVG.call(timeBrush);

    // adding brush to the delay bar-chart
    delayBrush = d3.brushX()
        .extent([[0,0], [size.w, size.h]])
        .on('end', function(event) {
            console.log(event.selection);

            // if there's no selection (eg. when user just clicks and doesn't drag)
            if (!event.selection) return;

            // calculating the data value from canvas value
            let lowerVal = delayScaleX.invert(event.selection[0]);
            let upperVal = delayScaleX.invert(event.selection[1]);

            console.log(lowerVal, upperVal);
            filters.delay = [lowerVal, upperVal];
            updateData();
        });
    // binding the brush to delaySVG
    delaySVG.call(delayBrush);

});

function updateData() {
    // filtering out the data as per newly set filters
    let filteredData = flightsData
    if (filters.time) {
        filteredData = filteredData.filter(d => {
            return d.date.getHours() >= filters.time[0] && d.date.getHours() <= filters.time[1];
        })
    }
    if (filters.delay) {
        filteredData = filteredData.filter(d => {
            return d.delay >= filters.delay[0] && d.delay <= filters.delay[1];
        });
    }

    // calling draw functions after freshly filtered data
    console.log("updating data");
    drawTimeChart(filteredData);
    drawDelayChart(filteredData);
    // loadTable(filteredData);
}

// DRAW BAR CHART for time
function drawTimeChart(data = flightsData) {
    data = d3.group(data, d => d.date.getHours());
    data = Array.from(data);

    if (!timeScaleX) {
        timeScaleX = d3.scaleBand()
            .padding(0.2)
            .domain([...Array(24).keys()])
            .range([0, size.w]);
    }
    
    if (!timeScaleY) {
        timeScaleY = d3.scaleLinear()
            .domain(d3.extent(data, d => d[1].length))
            .range([size.h, 0]);
    }

    timeG.selectAll('rect')
        .data(data)
        .join('rect')
        .transition()
        .duration(0.5)
        .attr('width', timeScaleX.bandwidth())
        .attr('height', d => size.h - timeScaleY(d[1].length))
        .attr('x', d => timeScaleX(d[0]))
        .attr('y', d => timeScaleY(d[1].length));
}

// DRAW LINE CHART for delay
function drawDelayChart(data = flightsData) {
    data = d3.group(data, d => d.delay);
    data = Array.from(data).sort((d,e) => d[0] > e[0]);
    console.log(data.map(d => d[0]));

    if (!delayScaleX) {
        delayScaleX = d3.scaleLinear()
            .domain([0, 150])
            .range([0, size.w]);
    }
    
    if (!delayScaleY) {
        delayScaleY = d3.scaleLinear()
            .domain([0, d3.max(data, d => d[1].length)])
            .range([size.h, 0]);
    }

    let pathFn = d3.line()
        .x(d => delayScaleX(d[0]))
        .y(d => delayScaleY(d[1].length));

    delayG.selectAll('path')
        .data([1])
        .join('path')
        .datum(data)
        .attr('d', d => pathFn(d))
}


// LOADING TABLE
function loadTable(data = flightsData) {
    let flightRowSel = d3.select('div.flight-table-content')
        .selectAll('div.flight-row')
        .data(data, d => d.id)
        .join('div')
        .classed('flight-row', true);

    flightRowSel.selectAll('div.flight-origin')
        .data(d => [d])
        .join('div')
        .classed('flight-origin', true)
        .text(d => d.origin);
    
    flightRowSel.selectAll('div.flight-destination')
        .data(d => [d])
        .join('div')
        .classed('flight-destination', true)
        .text(d => d.destination);

    flightRowSel.selectAll('div.flight-distance')
        .data(d => [d])
        .join('div')
        .classed('flight-distance', true)
        .text(d => d.distance);

    flightRowSel.selectAll('div.flight-delay')
        .data(d => [d])
        .join('div')
        .classed('flight-delay', true)
        .text(d => d.delay);
}