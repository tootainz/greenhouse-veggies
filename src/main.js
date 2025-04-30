import { Layer } from './Layer.js';
import { Chart } from './Chart.js';
import { Renderer } from './Renderer.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as C from "./constants.js";
import * as data from "./dataService.js";

//--------------------------------------------------------------------------------
// GREENHOUSE VEGETABLE DATA IN FINLAND
//
// This is an application done as a fiunal course assignment on the course
// Design and Data in Aalto university, Feb 2025 by Joonatan Koponen.
//
// This application shows data from past years of all different kinds of vegetable
// species. You can compare different vegetables for three statistics:
// Amount produced, Amount of companies, Area used.
// You can also compare them to the past years average yearly temperature and see
// if there is any correlation.
//
// The functionality is basically as follows: It renders a main chart, that is a
// combined 3d chart of all the vegetables. You can select individual vegetables
// and inspect teh individual data and comapre it to the temperature data.
//
// The application tries to take a modular approach to the subject by utilizing
// object oriented design and separation into modules. I'm not sure if it is so
// successful. DOM modifications seem to get messy really easily.
//
//--------------------------------------------------------------------------------
// MAIN
//
// This main file basically generates the basic DOM and the Layer, Chart and
// Renderer objects. it does assign some functionality to some buttons.
//--------------------------------------------------------------------------------

//--------------------------------------------------------------------------------
// LAYERS AND CHART

// Generate Layer objects from data
const layers = [];
data.vegetables.forEach( (vegetable) => {
    layers.push(new Layer(vegetable[0]["laji"], vegetable));
});

// Generate main chart Object
const mainChart = new Chart(layers);

//--------------------------------------------------------------------------------
// DIVS
const left = d3.select("body")
    .append("div")
    .attr("id", "leftContainer")
    .classed("centered", true);

const right = d3.select("body")
    .append("div")
    .attr("id", "rightContainer")
    .classed("hiddenMove", true);

//--------------------------------------------------------------------------------
// SVG 1

// Create the mainsvg for the visualization
const svg = left
    .append("svg")
    .attr("id", "svg1")
    .attr("width", C.SVG_1_WIDTH)
    .attr("height", C.SVG_1_HEIGHT);

// Add groups for that svg
svg.append("g")
    .attr("id", "xAxis")
    .attr("transform", "translate(50,40)")

svg.append("g")
    .attr("id", "yAxis")
    .attr("transform", "translate(40,50)")

svg.append("g")
    .attr("id", "main")
    .attr("transform", "translate(40,40)")

//--------------------------------------------------------------------------------
// LEFT DROPDOWN

// Create the dropdown selection
const dropDownLabel = left
    .append("label")
    .attr("for", "dropDown")
    .attr("id", "dropDownLabel")
    .text("Data:")

const dropDown = left
    .append("select")
    .attr("name", "dropDown")
    .attr("id", "dropDown")

dropDown.append("option")
    .attr("value", "amount")
    .text("Amount of Vegetables")

dropDown.append("option")
    .attr("value", "companies")
    .text("Amount of Companies")

dropDown.append("option")
    .attr("value", "area")
    .text("Cultivation Area")

// Assign functionality
dropDown.on("change", () => {
    mainChartRenderer.drawLayers(svg);
    mainChartRenderer.expandLayer(mainChartRenderer.getCurrentLayer());
});

//--------------------------------------------------------------------------------
// SVG 2

// Create a second svg for the expanded graph
const svg2 = right
    .append("svg")
    .attr("id", "svg2")
    .attr("width", C.SVG_2_WIDTH)
    .attr("height", C.SVG_2_HEIGHT)

// Create group for the yearLines
const yearLines = svg2.append("g")
    .attr("id", "yearLines");

// Create group for the vegetable chart
const vegChart = svg2.append("g")
    .attr("id", "vegChart");

// And the appropriate subgroups
vegChart.append("g")
    .attr("id", "vegXAxis")
    .attr("transform", `translate(45, ${C.VEG_GRAPH_HEIGHT+5})`)

vegChart.append("g")
    .attr("id", "vegYAxis")
    .attr("transform", "translate(40,0)")

vegChart.append("g")
    .attr("id", "vegMain")
    .attr("transform", "translate(45,0)")

// Create group for the temperature chart
const tempChart = svg2.append("g")
    .attr("id", "tempChart")
    .attr("transform", `translate(0,${C.VEG_GRAPH_HEIGHT*1.2})`)
    .classed("hidden", true);

// And the appropriate subgroups
tempChart.append("g")
    .attr("id", "tempYAxis")
    .attr("transform", "translate(40,0)")

tempChart.append("g")
    .attr("id", "tempMain")
    .attr("transform", "translate(45,0)")

//--------------------------------------------------------------------------------
// BACKGROUND SVG

const svgBG = d3.select("body")
    .append("svg")
    .attr("id", "svgBG")
    .attr("width", C.SVG_BG_WIDTH)
    .attr("height", C.SVG_BG_HEIGHT)
    .classed("hiddenMove", true);

svgBG.append("path")
    .attr("d", `M 0 0 h ${C.SVG_BG_WIDTH} v ${C.SVG_BG_HEIGHT} h ${-C.SVG_BG_WIDTH*0.8} z`)
    .classed("backgroundRect", true)

//--------------------------------------------------------------------------------
// RIGHT BUTTONS

// Add description
right.append("p")
    .text("Yearly average temperature measured in Helsinki")
    .classed("tempDescription", true)
    .classed("hidden", true)
    .attr("id", "tempDescription");

// Create a third svg for the side graph background
right.append("button")
    .text("Close")
    .attr("id", "closeButton")
    .on("click", (d) => {
        left.classed("centered", true)
        right.classed("hiddenMove", true)
        svgBG.classed("hiddenMove", true)
        mainChartRenderer.resetCurrentLayer();
        mainChartRenderer.drawLayers(svg);
    })

// Add the close button
right.append("button")
    .text("Compare Temperatures")
    .classed("tempButton", true)
    .on("click", function () {
        if (tempChart.classed("hidden")) {
            tempChart.classed("hidden", false);
            d3.select(this).classed("selected", true);
            d3.select("#tempDescription").classed("hidden", false);
        }
        else {
            tempChart.classed("hidden", true);
            d3.select(this).classed("selected", false);
            d3.select("#tempDescription").classed("hidden", true);
        }
        mainChartRenderer.expandLayer(mainChartRenderer.getCurrentLayer());
    })

//--------------------------------------------------------------------------------
// RENDERER

// Generate renderer for the main chart
const mainChartRenderer = new Renderer(mainChart, dropDown);

// Render the visualization
mainChartRenderer.drawLayers(svg);