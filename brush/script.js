const size = { w: 350, h: 300 };

// contains the full timeilne
const timeSVG = d3.select("svg.time");
// contains the detailed bar chart
const delaySVG = d3.select("svg.delay");

// defining a container group
// which will contain everything within the SVG
// we can transform it to make things everything zoomable
const timeG = timeSVG.append("g").classed("container", true);
const delayG = delaySVG.append("g").classed("container", true);

// defining all the required variables as global
let flightsData,
	delayScaleX,
	delayScaleY,
	timeScaleX,
	timeScaleY,
	timeBrush,
	arrivalBrush,
	filters = {};

// setting width and height of the SVG elements
timeSVG.attr("width", size.w).attr("height", size.h);
delaySVG.attr("width", size.w).attr("height", size.h);

// loading our data
Promise.all([d3.csv("data/flights-filtered.csv")]).then(function (datasets) {
	// processing data a bit to calculate dates and change strings to numbers
	flightsData = datasets[0].map((row, i) => {
		row.date = new Date(row.date * 1000);
		row.delay = +row.delay;
		row.distance = +row.distance;
		row.id = i;

		return row;
	});
	console.log(flightsData);

	// map is exactly the same as forEach (won't return anything), but can have each value spit out

	drawTimeChart();
	drawDelayChart();

	timeBrush = d3
		.brushX()
		.extent([
			[0, 0],
			[size.w, size.h],
		])
		.on("end", function (event) {
			if (!event.selection) return;
			console.log(event.selection);
			let step = timeScaleX.step(); // step() get the width of each bands
			console.log(event.selection[0] / step);
			let lowerIndex = Math.floor(event.selection[0] / step);
			let lowerVal = timeScaleX.domain()[lowerIndex];
			console.log(timeScaleX.domain());

			let upperIndex = Math.floor(event.selection[1] / step);
			let upperVal;
			if (upperIndex > timeScaleX.domain().length - 1) {
				upperVal = timeScaleX.domain()[23];
			} else {
				upperVal = timeScaleX.domain()[upperIndex];
			}
			filters.time = [lowerVal, upperVal];
			console.log(filters.time);
			updateData();
		});
	timeSVG.call(timeBrush);

	arrivalBrush = d3
		.brushX()
		.extent([
			// specify the ractangle where I'm allowing the rectangle
			[0, 0], // origin
			[size.w, size.h], // width and height
		])
		.on("end", function (event) {
			// when you let go, the function will fire. can use "brush"
			console.log("brush", event.selection); // selection: array of two numbers (two exnumbers)
			let lowerVal = delayScaleX.invert(event.selection[0]);
			let upperVal = delayScaleX.invert(event.selection[1]);
			console.log(lowerVal, upperVal);
			// filter the data and update the chart
			filters.delay = [lowerVal, upperVal];
			updateData();
		});
	delaySVG.call(arrivalBrush);
});

function updateData() {
	let filteredData = flightsData;
	if (filters.delay) {
		filteredData = filteredData.filter(function (d) {
			return d.delay >= filters.delay[0] && d.delay <= filters.delay[1];
		});
	}
	if (filters.time) {
		filteredData = filteredData.filter(function (d) {
			return (
				d.date.getHours() >= filters.time[0] &&
				d.date.getHours() <= filters.time[1]
			);
		});
	}
	drawDelayChart(filteredData);
	drawTimeChart(filteredData);
}

// DRAW BAR CHART for time
function drawTimeChart(data = flightsData) {
	if (!timeScaleX) {
		timeScaleX = d3
			.scaleBand()
			.domain([...Array(24).keys()]) // Array(24) <- 24 empty slots. keys() gives us all the indexes
			.range([0, size.w])
			.padding(0.2);
	}

	let nestedData = d3.group(data, (d) => d.date.getHours());

	// let nestedData = d3.group(flightsData, (d) => d.date.getHours(), d => d.origin);

	nestedData = Array.from(nestedData);

	if (!timeScaleY) {
		timeScaleY = d3
			.scaleLinear()
			.domain([0, d3.max(nestedData, (d) => d[1].length)])
			.range([size.h, 0]);
	}

	timeG
		.selectAll("rect")
		.data(nestedData)
		.join("rect")
		.attr("width", timeScaleX.bandwidth())
		.attr("height", (d) => size.h - timeScaleY(d[1].length))
		.attr("x", (d) => timeScaleX(d[0]))
		.attr("y", (d) => timeScaleY(d[1].length));
}

// DRAW LINE CHART for delay
function drawDelayChart(data = flightsData) {
	let nestedData = d3.group(data, (d) => d.delay);
	nestedData = Array.from(nestedData);
	nestedData = nestedData.sort(function (a, b) {
		return a[0] - b[0];
	});

	if (!delayScaleY) {
		delayScaleY = d3
			.scaleLinear()
			.domain([0, d3.max(nestedData, (d) => d[1].length)])
			.range([size.h, 0]);
	}
	if (!delayScaleX) {
		delayScaleX = d3
			.scaleLinear()
			.domain([0, d3.max(data, (d) => d.delay)])
			.range([0, size.w]);
	}

	let pathFn = d3
		.line()
		.x((d) => delayScaleX(d[0]))
		.y((d) => delayScaleY(d[1].length));

	delayG
		.selectAll("path")
		.data([1])
		.join("path")
		.datum(nestedData)
		.attr("d", (d) => pathFn(d));
}

// LOADING TABLE
function loadTable(data = flightsData) {}
