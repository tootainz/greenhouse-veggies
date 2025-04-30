import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as C from "./constants.js";

//--------------------------------------------------------------------------------
// RENDERER CLASS
//
// This is a class that takes a Chart class object and renders it using d3.js
//--------------------------------------------------------------------------------

class Renderer {

//--------------------------------------------------------------------------------
// PROPERTIES

    #chart; // The main chart object
    #dropdown; // Reference to the dropdown object
    // Line generators for the different categories
    #amountLineGen = d3.line();
    #companyLineGen = d3.line();
    #areaLineGen = d3.line();
    #scales = { // Scales for the different categories
        year: null,
        amount: null,
        companies: null,
        area: null
    }

    #currentLayer = null; // Container for storing the current selected layer

//--------------------------------------------------------------------------------
// CONSTRUCTOR

    constructor(chart, dropdown) {
        this.#chart = chart;
        this.#dropdown = dropdown;

        // Define scales
        this.#scales.year = d3.scaleLinear()
            .domain(this.#chart.getExtents().year)
            .range([0,C.MAIN_GRAPH_WIDTH])

        this.#scales.amount = d3.scalePow()
            .domain(this.#chart.getExtents().amount)
            .range([C.MAIN_GRAPH_HEIGHT,0])
            .exponent(0.4)

        this.#scales.companies = d3.scaleLinear()
            .domain(this.#chart.getExtents().companies)
            .range([C.MAIN_GRAPH_HEIGHT,0])

        this.#scales.area = d3.scaleLinear()
            .domain(this.#chart.getExtents().area)
            .range([C.MAIN_GRAPH_HEIGHT,0])

        // Define line generators
        this.#amountLineGen
            .x( (d) => this.#scales.year(d["vuosi"]))
            .y( (d) => this.#scales.amount(d["Sato (1 000 kg)"]));

        this.#companyLineGen
            .x( (d) => this.#scales.year(d["vuosi"]))
            .y( (d) => this.#scales.companies(d["Yrityksiä (kpl)"]));

        this.#areaLineGen
            .x( (d) => this.#scales.year(d["vuosi"]))
            .y( (d) => this.#scales.area(d["Kasvihuoneala (1 000 m²)"]));
    }

//--------------------------------------------------------------------------------
// PRIVATE METHODS

    // Helper for checking which line generator to use
    #checkLineGen() {
        switch (this.#dropdown.node().value) {
            case "amount":
                return this.#amountLineGen;
            case "companies":
                return this.#companyLineGen;
            case "area":
                return this.#areaLineGen;
        }
    }

    // Helper for checking which way to sort the layers
    #checkSort() {
        switch (this.#dropdown.node().value) {
            case "amount":
                this.#chart.sortLayers("Sato (1 000 kg)")
                break;
            case "companies":
                this.#chart.sortLayers("Yrityksiä (kpl)")
                break;
            case "area":
                this.#chart.sortLayers("Kasvihuoneala (1 000 m²)")
                break;
        }
    }

    // Helper for checking which scale to use
    #checkScale() {
        switch (this.#dropdown.node().value) {
            case "amount":
                return this.#scales.amount;
            case "companies":
                return this.#scales.companies;
            case "area":
                return this.#scales.area;
        }
    }

    // Helper for getting current scale label
    #getScaleLabel(isPieces) {
        // isPieces is defined, give both lines
        if (isPieces !== undefined) {
            switch (this.#dropdown.node().value) {
                case "amount":
                    if (isPieces) {
                        return {
                            line0: "1000pcs",
                            line1: "0"
                        };
                    }
                    else {
                        return {
                            line0: "1000kg",
                            line1: "0"
                        };
                    }
                case "companies":
                    return {
                        line0: "Companies",
                        line1: ""
                    };
                case "area":
                    return {
                        line0: "1 000 m²",
                        line1: ""
                    };
            }
        }
        // No isPieces, give both lines
        else {
            switch (this.#dropdown.node().value) {
                case "amount":
                    return {
                        line0: "1000kg or",
                        line1: "1000pcs"
                    };
                case "companies":
                    return {
                        line0: "Companies",
                        line1: ""
                    };
                case "area":
                    return {
                        line0: "1 000 m²",
                        line1: ""
                    };
            }
        }
    }

    // The main method that does the heavy lifting for renderign the main chart.
    // Renders one layer of the chart
    #drawLayer(index, svg, offset) {

        const layer = this.#chart.getLayer(index); // The current layer to be rendered
        const green = [125, 100, 0]; // stores the base green value for the chart "gradient"
        const color = [green[0], green[1]-offset, green[2]+offset*5] // Calculates the actual green value for this layer
        const lineGen = this.#checkLineGen(); // Storage for the approppriate line generator

        // Remove any residual texts
        svg.select("#main")
            .selectAll("text")
            .remove();

        // Draw the line block
        svg.select("#main")
            
            .append("path")

            .attr("d", lineGen(layer.getData()) + `L${C.MAIN_GRAPH_WIDTH},${C.MAIN_GRAPH_HEIGHT}L0,${C.MAIN_GRAPH_HEIGHT}Z`)

            .attr("stroke", () => this.#currentLayer === layer ? "black" : "transparent")
            .attr("stroke-width", 2)
            .attr("fill", `hsla(${color[0]},${color[1]}%,${color[2]}%,0.9)`)
            .attr("transform", `translate(${offset*10} ${offset*10})`)

            .on("mouseover", (e) => { // assign hover functionality part 1

                const [x, y] = d3.pointer(e, svg.node()); // Needed apparently so that the mouse coordinates are translated properly

                // Set the outline and show the name
                d3.select(e.target)
                    .attr("stroke", "black")
                    .style("cursor", "pointer");
                svg.select("#main")
                    .append("text")
                    .attr("id", layer.getName())
                    .text(layer.getName())
                    .attr("x", x-15)
                    .attr("y", y-15)
                    .attr("fill", "black")
            })

            .on("mouseleave", (e) => { // assign hover functionality part 2
                // Reset everything
                d3.select(e.target)
                    .attr("stroke", () => this.#currentLayer === layer ? "black" : "transparent")
                d3.select("#main")
                    .selectAll("text").remove();
            })

            .on("click", (e) => { // assign click functionality for opening up the separate side graph
                const [x, y] = d3.pointer(e, d3.select("#svgBG").node()); // Needed apparently so that the mouse coordinates are translated properly
                this.#currentLayer = layer;
                this.expandLayer(layer, {x: x, y: y});
                this.drawLayers(d3.select("#svg1"));
            })
    }

//--------------------------------------------------------------------------------
// PUBLIC METHODS

    getCurrentLayer() {
        return this.#currentLayer;
    }

    resetCurrentLayer() {
        this.#currentLayer = null;
    }

    // Renders the selected layer to the side as a separate graph
    // This is a quite heavy method thatt does a lot of work
    expandLayer(layer) {

        // Clear SVG 2
        d3.select("#svg2").selectAll("path").remove();
        d3.select("#svg2").selectAll("line").remove();
        d3.selectAll("#layerHeader").remove();
        d3.select("#svg2").selectAll(".axisLabel").remove();

        // Calculate different scales
        const yScaleTemp = d3.scaleLinear()
            .domain(d3.extent(layer.getExtents().temps))
            .range([C.TEMP_GRAPH_HEIGHT, 0]);
        const yScaleAmount = d3.scaleLinear()
            .domain(d3.extent(layer.getExtents().amount))
            .range([C.VEG_GRAPH_HEIGHT, C.VEG_GRAPH_OFFSET]);
        const yScaleCompanies = d3.scaleLinear()
            .domain(d3.extent(layer.getExtents().companies))
            .range([C.VEG_GRAPH_HEIGHT, C.VEG_GRAPH_OFFSET]);
        const yScaleArea = d3.scaleLinear()
            .domain(d3.extent(layer.getExtents().area))
            .range([C.VEG_GRAPH_HEIGHT, C.VEG_GRAPH_OFFSET]);

        // X Scale is always the same years
        const xScale = d3.scaleLinear()
            .domain(d3.extent(layer.getExtents().year))
            .range([0, C.VEG_GRAPH_WIDTH-C.VEG_GRAPH_OFFSET]);

        // Line generator for the temperatures
        const lineGenTemp = d3.line()
            .x( (d) => xScale(Number(d.year)))
            .y( (d) => yScaleTemp(Number(d.temp)));

        // Line generator for the selected vegetable stat
        const lineGen = d3.line()
            .x( (d) => xScale(Number(d["vuosi"]))) // X is always the same

        let currentScale; // Y changes
            
        // Check the dropdown and change Y accordingly
        switch (this.#dropdown.node().value) {
            case "amount":
                lineGen
                    .y( (d) => yScaleAmount(Number(d["Sato (1 000 kg)"])));
                currentScale = yScaleAmount;
                break;
            case "companies":
                lineGen
                    .y( (d) => yScaleCompanies(Number(d["Yrityksiä (kpl)"])));
                currentScale = yScaleCompanies;
                break;
            case "area":
                lineGen
                    .y( (d) => yScaleArea(Number(d["Kasvihuoneala (1 000 m²)"])));
                currentScale = yScaleArea;
                break;
        }

        // Add the header text with this layers name
        d3.select("#rightContainer")
            .append("h2")
            .attr("id", "layerHeader")
            .text(layer.getName())
        
        // d3 axes
        const yAxis = d3.axisLeft(currentScale);
        const yAxisTemp = d3.axisLeft(yScaleTemp);
        const xAxis = d3.axisBottom(xScale);

        // Tick setting for the axes
        yAxisTemp.ticks(4)
        xAxis.ticks()
            .tickFormat( (d) => {
                return d;
        });

        // Apply the axes
        d3.select("#vegYAxis").call(yAxis);
        d3.select("#vegXAxis").call(xAxis);
        d3.select("#tempYAxis").call(yAxisTemp);

        // Add axis labels

        const layerName = layer.getName()
        const isPieces = layerName.endsWith("(potted)");
        const yLabel = this.#getScaleLabel(isPieces);

        // y label
        d3.select("#vegYAxis")
            .append("text")
            .classed("axisLabel", true)
            .text(yLabel.line0)
            .attr("fill", "white")
            .attr("transform", "translate(-5, 10)");

        // temp y label
        d3.select("#tempYAxis")
            .append("text")
            .classed("axisLabel", true)
            .attr("fill", "white")
            .text("°C")
            .attr("transform", "translate(-5, -10)");

        // x label
        d3.select("#vegXAxis")
            .append("text")
            .classed("axisLabel", true)
            .attr("fill", "white")
            .text("Year")
            .attr("transform", `translate(${C.VEG_GRAPH_WIDTH}, 16)`);

        // Assign classes for showing the graph and animation
        d3.select("#rightContainer")
            .classed("hiddenMove", false)

        d3.select("#leftContainer")
            .classed("centered", false)

        d3.select("#svgBG")
            .classed("hiddenMove", false)

        // Generate the vegetable graph
        d3.select("#vegMain")
            .append("path")
            .attr("d", lineGen(layer.getData()) + `V ${C.VEG_GRAPH_HEIGHT} h ${-(C.VEG_GRAPH_WIDTH-C.VEG_GRAPH_OFFSET)} z`)
            .classed("individualChart", true);

        const tempSelected = !d3.select("#tempChart").classed("hidden") // Is the temp graph visible

        // Generate the year lines
        d3.select("#yearLines")
            .selectAll(".yearLine")
            .data(layer.getData())
            .join("line")
            .classed("yearLine", true)
            .attr("x1", (d) => xScale(d["vuosi"]))
            .attr("y1", C.VEG_GRAPH_OFFSET)
            .attr("x2", (d) => xScale(d["vuosi"]))
            .attr("y2", () => tempSelected ? C.VEG_GRAPH_HEIGHT*2 : C.VEG_GRAPH_HEIGHT) // This is to adjust the height if temp is visible or not
            .attr("transform", "translate(45,0)")
        
        // Generate the temp graph
        d3.select("#tempMain")
            .append("path")
            .attr("d", lineGenTemp(layer.getTemps()))
            .classed("individualTempChart", true);
    }

    // The function that actually renders the main graph. Basically calls .drawLayer() for every layer in the graph
    drawLayers(svg) {

        // Clear the SVG
        svg.select("#main")
            .selectAll("path").remove()

        // Clear previous axis labels
        svg.select("#yAxis")
            .selectAll(".axisLabel")
            .remove();

        svg.select("#xAxis")
            .selectAll(".axisLabel")
            .remove();

        // Define axes
        const scale = this.#checkScale();
        const yAxis = d3.axisLeft(scale);
        const xAxis = d3.axisTop(this.#scales.year);

        // Tick settings for the axes
        xAxis.ticks()
            .tickFormat( (d) => {
                return d;
            });

        // Draw axes
        svg.select("#yAxis").call(yAxis);
        svg.select("#xAxis").call(xAxis);

        const yLabel = this.#getScaleLabel();

        // Add axis labels

        // First y line
        svg.select("#yAxis")
            .append("text")
            .classed("axisLabel", true)
            .text(yLabel.line0)
            .attr("fill", "black")
            .attr("transform", `translate(-5, ${C.MAIN_GRAPH_HEIGHT+20})`);

        // Second y line
        svg.select("#yAxis")
            .append("text")
            .classed("axisLabel", true)
            .text(yLabel.line1)
            .attr("fill", "black")
            .attr("transform", `translate(-5, ${C.MAIN_GRAPH_HEIGHT+30})`);

        // x axis
        svg.select("#xAxis")
            .append("text")
            .classed("axisLabel", true)
            .attr("fill", "black")
            .text("Year")
            .attr("transform", `translate(${C.MAIN_GRAPH_WIDTH+25}, -9)`);

        // Sort the layers
        this.#checkSort();

        // Render individual layers
        this.#chart.getLayers().forEach( (_, i) => {
            this.#drawLayer(i, svg, i+1)
        });
    }

}

//--------------------------------------------------------------------------------

export { Renderer };