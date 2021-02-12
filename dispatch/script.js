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

let mapData, flightsData, delayRange,
    delayScaleX, delayScaleY,
    timeScaleX, timeScaleY,
    timeBrush, arrivalBrush, filters = {},
    dispatch = d3.dispatch("update");

timeSVG.attr('width', size.w)
    .attr('height', size.h);
delaySVG.attr('width', size.w)
    .attr('height', size.h);

Promise.all([
    d3.csv('data/flights-filtered.csv')
]).then(function (datasets) {
    flightsData = datasets[0].map((row, i) => {
        row.date = new Date(row.date*1000);
        row.delay = +row.delay;
        row.distance = +row.distance;
        row.id = i;

        return row;
    });
    

    delayRange = d3.extent(flightsData, d => d.delay);

    for (let i = -60; i <= 510; i+=30) {
        delayRange.push(i);
    }

    dispatch.on('update', updateData);
    dispatch.call('update');

    timeBrush = d3.brushX()
        .extent([[0,0], [size.w, size.h]])
        .on('end', function(event) {
            console.log(event.selection);

            if (!event.selection) return;

            let step = timeScaleX.step()
            let lowerIndex = Math.floor(event.selection[0]/step);
            let lowerVal = timeScaleX.domain()[lowerIndex];

            let upperIndex = Math.floor(event.selection[1]/step);
            let upperVal = timeScaleX.domain()[upperIndex]

            console.log(lowerVal, upperVal);
            filters.time = [lowerVal, upperVal];
            dispatch.call('update');
        });
    timeSVG.call(timeBrush);

    delayBrush = d3.brushX()
        .extent([[0,0], [size.w, size.h]])
        .on('end', function(event) {
            console.log(event.selection);

            if (!event.selection) return;

            let lowerVal = delayScaleX.invert(event.selection[0]);
            let upperVal = delayScaleX.invert(event.selection[1]);

            console.log(lowerVal, upperVal);
            filters.delay = [lowerVal, upperVal];
            dispatch.call('update');
        });
    delaySVG.call(delayBrush);
});

function updateData() {
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
        .data(data)
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