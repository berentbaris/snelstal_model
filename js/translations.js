/**
 * Snelstal Model — Translation strings (Dutch / English)
 *
 * Dutch labels match the original tt24.glade exactly.
 * English labels match tt24.glade.en.
 */

const TRANSLATIONS = {
    nl: {
        title: "AmmoniakEmissie Model V2.0",
        subtitle: "Snelstal — Emissiemodel voor melkveestallen",

        // General section
        sectionGeneral: "Algemeen",
        labelRuns: "Aantal berekeningen [#]:",
        labelPeriod: "Rekenperiode [dagen]:",

        // Animals section
        sectionAnimals: "Dieren",
        labelCows: "Aantal dieren [#]:",
        labelFrequency: "Urineer frequentie [loz/dag]:",
        labelUrea: "Ureum concentratie [g-N/l]:",
        labelTAN: "Mestsamenstelling [g-N/l]:",
        labelGrazing: "Beweiding [uur/dag]:",

        // Floor section
        sectionFloor: "Vloer",
        labelFloorArea: "Oppervlak [m²]:",
        labelFloorTemp: "Temperatuur [°C]:",
        labelFloorAirSpeed: "Luchtsnelheid [m/s]:",
        labelPoolArea: "Plas oppervlak [m²]:",
        labelPoolDepth: "Plas dikte [mm]:",
        labelFloorPH: "pH:",

        // Pit section
        sectionPit: "Kelder",
        labelDefaultPit: "Standaard kelder:",
        labelSpecificPit: "Specifieke kelder:",
        labelPitPercentage: "Percentage kelderemissie van standaard [%]:",
        labelPitArea: "Oppervlak [m²]:",
        labelPitTemp: "Temperatuur [°C]:",
        labelPitAirSpeed: "Luchtsnelheid [m/s]:",
        labelPitPH: "pH:",

        // Button and results
        buttonCalculate: "Bereken",
        buttonCalculating: "Berekenen...",

        resultHeader: "Resultaten",
        resultGramPerHour: "gram/uur",
        resultKgPerCowPerYear: "kg/koe/jaar",
        resultFloor: "Vloer:",
        resultPit: "Kelder:",
        resultTotal: "Totaal:",
        resultNote: "(Emissie van ammoniak (NH₃) als gemiddelde van alle berekeningen)",

        // Footer
        footer1: "AmmoniakEmissie Model V2.0 — Farm Technology Group — WUR",
        footer2: "Het model is slechts getest voor een beperkt aantal praktijksituaties.",
        footer3: "Gebaseerd op Snelstal (Monteny, 1998)",

        // Language toggle
        langToggle: "English",
    },

    en: {
        title: "AmmoniaEmission Model V2.0",
        subtitle: "Snelstal — Emission model for dairy cow houses",

        // General section
        sectionGeneral: "General",
        labelRuns: "Runs:",
        labelPeriod: "Calculation period:",

        // Animals section
        sectionAnimals: "Dairy cows",
        labelCows: "Number of dairy cows:",
        labelFrequency: "Urination frequency:",
        labelUrea: "Initial urea-N concentration:",
        labelTAN: "TAN concentration slurry in pit:",
        labelGrazing: "Grazing time:",

        // Floor section
        sectionFloor: "Floor",
        labelFloorArea: "Total walking area:",
        labelFloorTemp: "Temperature at floor level:",
        labelFloorAirSpeed: "Windspeed at floor level:",
        labelPoolArea: "Area of a single urine pool:",
        labelPoolDepth: "Dept of a single urine pool:",
        labelFloorPH: "pH of a urine pool:",

        // Pit section
        sectionPit: "Pit",
        labelDefaultPit: "Default pit:",
        labelSpecificPit: "Specific pit:",
        labelPitPercentage: "Percentage standard pit:",
        labelPitArea: "Total area of slurry pit:",
        labelPitTemp: "Temperature inside slurry pit:",
        labelPitAirSpeed: "Windspeed inside slurry pit:",
        labelPitPH: "pH of slurry pit:",

        // Button and results
        buttonCalculate: "Calculate",
        buttonCalculating: "Calculating...",

        resultHeader: "Results",
        resultGramPerHour: "gram/hour",
        resultKgPerCowPerYear: "kg/cow/year",
        resultFloor: "Floor:",
        resultPit: "Pit:",
        resultTotal: "Total:",
        resultNote: "(Ammonia (NH₃) emission averaged across all calculation runs)",

        // Footer
        footer1: "AmmoniaEmission Model V2.0 — Farm Technology Group — WUR",
        footer2: "The model has only been tested for a limited number of practical situations.",
        footer3: "Based on Snelstal (Monteny, 1998)",

        // Language toggle
        langToggle: "Nederlands",
    },
};

if (typeof window !== 'undefined') {
    window.TRANSLATIONS = TRANSLATIONS;
}
