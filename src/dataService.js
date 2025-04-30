import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as C from "./constants.js";

// ---------------------------------------------------------------------------------------------------
// DATA SERVICE
//
// This module handles importing the data from .csv files using d3.js. It also sorts and modifies
// the data so it is in a clean and proper format for the application.
// ---------------------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------------------
// VEGETABLES

const rawData = await d3.csv("./greenhouse-veggies/data/vegetables_greenhouse.csv");
const data = rawData
    .filter( (d) => d["laji"] !== "TOTAL VEGETABLES")
    .filter( (d) => d["laji"] !== "TOTAL POTTED VEGETABLES")
    .filter( (d) => d["laji"] !== "TOTAL BERRIES")
    .filter( (d) => d["laji"] !== "Special Tomatoes")

// loop through each entry and combine "mass" and "piece" amounts
data.forEach( (d) => {
    if (d["Sato (1 000 kg)"] === "..") {
        d["Sato (1 000 kg)"] = d["Sato (1 000 kpl)"];
    }
})

// loop through each entry and convert values of ".." to 0
data.forEach( (d) => {
    Object.entries(d).forEach(([key, value]) => {
        if (value == "..") {
            d[key] = 0;
        };
    });
})

// Generate groups from the different species of vegetables
const vegetables = d3.group(data, (d) => d["laji"] )

// ---------------------------------------------------------------------------------------------------
// TEMPS

const rawTempData = await d3.csv("../data/temps.csv");

// Filter only the same years that the vegetables data covers
const temps = rawTempData
    .filter( (d) => Number(d["Category"]) >= 2014 && Number(d["Category"]) <= 2023)
    .map( (d) => { // Refactor the data so its easier and cleaner to access
        return {
            year: d["Category"],
            temp: d["Helsinki Kaisaniemi"]
        };
    });

// ---------------------------------------------------------------------------------------------------

export { vegetables, temps }