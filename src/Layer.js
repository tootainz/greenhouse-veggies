import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as data from "./dataService.js";

//--------------------------------------------------------------------------------
// LAYER CLASS
//
// This is a class that represents a single chart, a layer in the bigger chart collection
//--------------------------------------------------------------------------------

class Layer {

//--------------------------------------------------------------------------------
// PROPERTIES

    #data; // Associated data array
    #temps = data.temps; // Stores the yarly average temps, same for all instances
    #name;
    #extents = { // Stores precalculated extents for selected data members from the data. Makes it easier to render later
        year: [2014, 2023],
        amount: null,
        companies: null,
        area: null,
        temps: d3.extent(
            this.#temps
                .map( (d) => Number(d.temp))
        )
    };

//--------------------------------------------------------------------------------
// CONSTRUCTOR

    constructor(name, data) {
        this.#name = name;
        this.#data = data;

        // Helper for calculating the extents
        const calcExtents = (propertyName) => {
            return d3.extent(
                this.#data
                    .filter( (entry) => entry[propertyName] !== "..")
                    .map( (entry) => Number(entry[propertyName]))
            );
        }

        // Assigning extents values
        this.#extents.amount = calcExtents("Sato (1 000 kg)");
        this.#extents.companies = calcExtents("Yrityksiä (kpl)");
        this.#extents.area= calcExtents("Kasvihuoneala (1 000 m²)");
    }

//--------------------------------------------------------------------------------
// METHODS

    getData() {
        return this.#data;
    }

    getTemps() {
        return this.#temps;
    }

    getName() {
        return this.#name;
    }

    getExtents() {
        return this.#extents;
    }

}

//--------------------------------------------------------------------------------

export { Layer }