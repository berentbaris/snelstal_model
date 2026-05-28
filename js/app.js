/**
 * Snelstal Ammonia Emission Model — UI Logic
 * ============================================
 *
 * Handles: language switching, form validation, input collection,
 * pit mode toggling, calculation triggering, and results display.
 */

(function () {
    'use strict';

    // Current language ('nl' or 'en')
    let currentLang = localStorage.getItem('snelstal-lang') || 'nl';

    // DOM references (populated on DOMContentLoaded)
    let elements = {};

    // =====================================================================
    // Input field definitions (id, default, min, max, step, decimals)
    // =====================================================================

    const INPUT_FIELDS = [
        { id: 'numRuns',              default: 10,    min: 1,   max: 50,   step: 1,    decimals: 0 },
        { id: 'calcPeriod',           default: 30,    min: 1,   max: 365,  step: 1,    decimals: 0 },
        { id: 'numCows',              default: 100,   min: 1,   max: 500,  step: 1,    decimals: 0 },
        { id: 'urinationFreq',        default: 10,    min: 8,   max: 12,   step: 1,    decimals: 0 },
        { id: 'ureaNConc',            default: 5.00,  min: 0,   max: 20,   step: 0.01, decimals: 2 },
        { id: 'tanConc',              default: 3.50,  min: 0,   max: 100,  step: 0.01, decimals: 2 },
        { id: 'grazingHours',         default: 0,     min: 0,   max: 24,   step: 1,    decimals: 0 },
        { id: 'floorArea',            default: 350,   min: 1,   max: 5000, step: 1,    decimals: 0 },
        { id: 'floorTemp',            default: 10,    min: 0,   max: 40,   step: 0.1,  decimals: 1 },
        { id: 'floorAirSpeed',        default: 0.15,  min: 0,   max: 2,    step: 0.01, decimals: 2 },
        { id: 'poolArea',             default: 0.80,  min: 0,   max: 5,    step: 0.01, decimals: 2 },
        { id: 'poolDepth',            default: 0.48,  min: 0,   max: 5,    step: 0.01, decimals: 2 },
        { id: 'floorPH',              default: 9.40,  min: 1,   max: 10,   step: 0.01, decimals: 2 },
        { id: 'pitPercentage',        default: 100,   min: 1,   max: 100,  step: 1,    decimals: 0 },
        { id: 'pitArea',              default: 350,   min: 1,   max: 5000, step: 1,    decimals: 0 },
        { id: 'pitTemp',              default: 10,    min: 0,   max: 40,   step: 0.1,  decimals: 1 },
        { id: 'pitAirSpeed',          default: 0.05,  min: 0,   max: 2,    step: 0.01, decimals: 2 },
        { id: 'pitPH',                default: 8.40,  min: 1,   max: 10,   step: 0.01, decimals: 2 },
    ];

    // =====================================================================
    // Initialization
    // =====================================================================

    document.addEventListener('DOMContentLoaded', function () {
        cacheElements();
        setDefaults();
        applyLanguage(currentLang);
        setupEventListeners();
    });

    function cacheElements() {
        elements.langToggle = document.getElementById('langToggle');
        elements.btnCalculate = document.getElementById('btnCalculate');
        elements.resultsSection = document.getElementById('resultsSection');
        elements.pitModeDefault = document.getElementById('pitModeDefault');
        elements.pitModeSpecific = document.getElementById('pitModeSpecific');
        elements.pitSpecificFields = document.getElementById('pitSpecificFields');

        // Cache all translatable elements
        elements.translatables = document.querySelectorAll('[data-i18n]');

        // Cache result cells
        elements.resultFloorGH = document.getElementById('resultFloorGH');
        elements.resultFloorKCY = document.getElementById('resultFloorKCY');
        elements.resultPitGH = document.getElementById('resultPitGH');
        elements.resultPitKCY = document.getElementById('resultPitKCY');
        elements.resultTotalGH = document.getElementById('resultTotalGH');
        elements.resultTotalKCY = document.getElementById('resultTotalKCY');
    }

    function setDefaults() {
        INPUT_FIELDS.forEach(function (field) {
            const el = document.getElementById(field.id);
            if (el && el.value === '') {
                el.value = field.default.toFixed(field.decimals);
            }
        });
    }

    function setupEventListeners() {
        elements.langToggle.addEventListener('click', toggleLanguage);
        elements.btnCalculate.addEventListener('click', runCalculation);

        elements.pitModeDefault.addEventListener('change', updatePitMode);
        elements.pitModeSpecific.addEventListener('change', updatePitMode);

        // Allow Enter key to trigger calculation
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !elements.btnCalculate.disabled) {
                runCalculation();
            }
        });
    }

    // =====================================================================
    // Language switching
    // =====================================================================

    function toggleLanguage() {
        currentLang = (currentLang === 'nl') ? 'en' : 'nl';
        localStorage.setItem('snelstal-lang', currentLang);
        applyLanguage(currentLang);
    }

    function applyLanguage(lang) {
        const t = window.TRANSLATIONS[lang];

        elements.translatables.forEach(function (el) {
            const key = el.getAttribute('data-i18n');
            if (t[key]) {
                el.textContent = t[key];
            }
        });

        // Update document title
        document.title = t.title;
    }

    // =====================================================================
    // Pit mode toggle (Default vs. Specific)
    // =====================================================================

    function updatePitMode() {
        const isDefault = elements.pitModeDefault.checked;
        if (isDefault) {
            elements.pitSpecificFields.classList.add('disabled');
        } else {
            elements.pitSpecificFields.classList.remove('disabled');
        }
    }

    // =====================================================================
    // Collect inputs and run model
    // =====================================================================

    function getInputValue(id) {
        const el = document.getElementById(id);
        return parseFloat(el.value);
    }

    function runCalculation() {
        const btn = elements.btnCalculate;
        const t = window.TRANSLATIONS[currentLang];

        // Disable button during calculation
        btn.disabled = true;
        btn.textContent = t.buttonCalculating;

        // Collect parameters
        const isDefaultPit = elements.pitModeDefault.checked;

        const params = {
            numRuns:              Math.round(getInputValue('numRuns')),
            calculationPeriodDays: Math.round(getInputValue('calcPeriod')),
            numCows:              Math.round(getInputValue('numCows')),
            urinationFrequency:   getInputValue('urinationFreq'),
            ureaNConcentration:   getInputValue('ureaNConc'),
            tanConcentration:     getInputValue('tanConc'),
            grazingHours:         getInputValue('grazingHours'),
            floorArea:            getInputValue('floorArea'),
            floorTemperatureC:    getInputValue('floorTemp'),
            floorAirSpeed:        getInputValue('floorAirSpeed'),
            poolArea:             getInputValue('poolArea'),
            poolDepthM:           getInputValue('poolDepth') / 1000.0, // mm -> m
            floorPH:              getInputValue('floorPH'),
            pitPercentage:        getInputValue('pitPercentage'),
            pitArea:              isDefaultPit ? getInputValue('floorArea') : getInputValue('pitArea'),
            pitTemperatureC:      isDefaultPit ? getInputValue('floorTemp') : getInputValue('pitTemp'),
            pitAirSpeed:          isDefaultPit ? 0.05 : getInputValue('pitAirSpeed'),
            pitPH:                isDefaultPit ? 8.40 : getInputValue('pitPH'),
        };

        // Run calculation asynchronously to keep UI responsive
        setTimeout(function () {
            try {
                const result = window.SnelstalModel.runModel(params);
                displayResults(result);
            } catch (e) {
                console.error('Calculation error:', e);
                alert('Calculation error: ' + e.message);
            } finally {
                btn.disabled = false;
                btn.textContent = t.buttonCalculate;
            }
        }, 50);
    }

    // =====================================================================
    // Display results
    // =====================================================================

    function displayResults(result) {
        elements.resultFloorGH.textContent = result.floorGPerHr.toFixed(2);
        elements.resultFloorKCY.textContent = result.floorKgPerCowPerYear.toFixed(2);
        elements.resultPitGH.textContent = result.pitGPerHr.toFixed(2);
        elements.resultPitKCY.textContent = result.pitKgPerCowPerYear.toFixed(2);
        elements.resultTotalGH.textContent = result.totalGPerHr.toFixed(2);
        elements.resultTotalKCY.textContent = result.totalKgPerCowPerYear.toFixed(2);

        elements.resultsSection.classList.add('visible');
    }

})();
