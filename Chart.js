import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { Layer } from "./Layer.js";

//--------------------------------------------------------------------------------
// CHART CLASS
//
// This is a class that represents a collection of separate layer classes
//--------------------------------------------------------------------------------

class Chart {

//--------------------------------------------------------------------------------
// PROPERTIES

    #layers; // Array of Layer objects
    #extents = {  // Stores precalculated combined extents from all the layers
        year: [2014, 2023],
        amount: null,
        companies: null,
        area: null
    };

//--------------------------------------------------------------------------------
// CONSTRUCTOR

    constructor(layers) {
        this.#layers = layers

        // Helper for calculating the extents of all the layers of this graph
        // Combines all the extents of the layers into one array and takes its extent
        const combineExtents = (keyword) => {
            return d3.extent(
                this.#layers.reduce( (accumulator, layer) => {
                    return [...accumulator, ...layer.getExtents()[keyword]]
                }, [])
            );
        }

        // Assing extents values
        this.#extents.amount = combineExtents("amount");
        this.#extents.companies = combineExtents("companies");
        this.#extents.area = combineExtents("area");
    }

//--------------------------------------------------------------------------------
// METHODS

    // Sorts the layers by the given data member
    sortLayers(byWhich) {
        this.#layers.sort( (a,b) => {
            return Number(b.getData()[0][byWhich]) - Number(a.getData()[0][byWhich]);
        });
    }

    getExtents() {
        return this.#extents;
    }

    getLayer(index) {
        return this.#layers[index];
    }

    getLayers() {
        return this.#layers;
    }
}

//--------------------------------------------------------------------------------

export { Chart }