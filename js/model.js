/**
 * Snelstal Ammonia Emission Model — Calculation Engine
 * =====================================================
 *
 * Pure calculation functions matching the Python snelstal_model.py
 * and the original emissie.exe (Monteny 1998, WUR Farm Technology Group).
 *
 * No UI code — this module exports functions only.
 */

// =====================================================================
// Physical / chemical constants
// =====================================================================

const MW_NH3_OVER_N = 17.0 / 14.0; // 1.2142857...
const VMAX_UREASE = 0.0027;         // max hydrolysis rate [g-N/l/s]
const KM_UREASE = 0.056;            // half-saturation constant [g-N/l]
const TIME_STEP = 60;               // seconds per time step
const MINUTES_PER_DAY = 1440;
const STARTUP_DAYS = 1;
const HOURS_PER_YEAR = 8760.0;

// =====================================================================
// Core physical functions
// =====================================================================

/**
 * NH3 fraction of TAN (pH and temperature dependent).
 * Ka(T) = 8.1e-11 * 1.07^(T_K - 293)
 * f = 1 / (1 + 10^(-pH) / Ka)
 */
function fractionNH3(temperatureC, pH) {
    const tKelvin = temperatureC + 273.0;
    const ka = 8.1e-11 * Math.pow(1.07, tKelvin - 293.0);
    const hPlus = Math.pow(10.0, -pH);
    return 1.0 / (1.0 + hPlus / ka);
}

/**
 * Dimensionless Henry's law constant (c_liq / c_gas).
 * Kh(T) = 1384.0 * 1.053^(293.0 - T_K)
 */
function henryConstant(temperatureC) {
    const tKelvin = temperatureC + 273.0;
    return 1384.0 * Math.pow(1.053, 293.0 - tKelvin);
}

/**
 * Convective mass transfer coefficient [m/s] (Haslam correlation).
 * k_mt = 48.389 * v^0.8 * T_K^(-1.4)
 */
function massTransferCoefficient(temperatureC, airSpeed) {
    const tKelvin = temperatureC + 273.0;
    return 48.389 * Math.pow(airSpeed, 0.8) * Math.pow(tKelvin, -1.4);
}

// =====================================================================
// Pit emission (analytical, deterministic)
// =====================================================================

/**
 * Calculate pit emission [g NH3 / hour].
 */
function pitEmissionGPerHr(tanConcentration, pitArea, pitTemperatureC,
                            pitAirSpeed, pitPH, pitPercentage) {
    const f = fractionNH3(pitTemperatureC, pitPH);
    const kh = henryConstant(pitTemperatureC);
    const kMt = massTransferCoefficient(pitTemperatureC, pitAirSpeed);

    const eRaw = tanConcentration * pitArea * f * kMt / kh * MW_NH3_OVER_N;
    return eRaw * 3600000.0 * (pitPercentage / 100.0);
}

// =====================================================================
// Floor emission (Monte Carlo with pool overlap)
// =====================================================================

/**
 * Simple seeded pseudo-random number generator (Mulberry32).
 * Returns a function that produces values in [0, 1).
 */
function createRng(seed) {
    let s = seed | 0;
    return function () {
        s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Generate a random integer in [0, max) using the RNG.
 */
function randInt(rng, max) {
    return Math.floor(rng() * max);
}

/**
 * Pre-compute cumulative NH3-N emission [g-N] for each minute of pool age.
 * Returns Float64Array where cumulative[i] = total g-N emitted after i minutes.
 */
function precomputePoolProfile(ureaN, poolArea, poolDepthM,
                                temperatureC, airSpeed, pH) {
    const maxSteps = 2880;
    const f = fractionNH3(temperatureC, pH);
    const kh = henryConstant(temperatureC);
    const kMt = massTransferCoefficient(temperatureC, airSpeed);
    const poolVolL = poolArea * poolDepthM * 1000.0;

    const cumulative = new Float64Array(maxSteps + 1);
    let ureaNConc = ureaN;
    let tan = 0.0;

    for (let step = 0; step < maxSteps; step++) {
        // Urea hydrolysis (Michaelis-Menten)
        if (ureaNConc > 1e-15) {
            const rate = VMAX_UREASE * ureaNConc / (KM_UREASE + ureaNConc);
            const deltaUrea = Math.min(rate * TIME_STEP, ureaNConc);
            ureaNConc -= deltaUrea;
            tan += deltaUrea;
        }

        // NH3 volatilization
        if (tan > 1e-15) {
            const emissionRate = kMt * poolArea * f * tan * 1000.0 / kh;
            const emissionStep = emissionRate * TIME_STEP;
            const deltaTan = Math.min(emissionStep / poolVolL, tan);
            tan -= deltaTan;
            cumulative[step + 1] = cumulative[step] + deltaTan * poolVolL;
        } else {
            cumulative[step + 1] = cumulative[step];
        }

        // Early stop if depleted
        if (ureaNConc < 1e-15 && tan < 1e-15) {
            const finalVal = cumulative[step + 1];
            for (let i = step + 2; i <= maxSteps; i++) {
                cumulative[i] = finalVal;
            }
            break;
        }
    }

    return cumulative;
}

/**
 * Run a single Monte Carlo realization of floor emission.
 * Returns floor emission in g NH3 / hour.
 */
function floorEmissionSingleRun(params, rng, poolProfile) {
    const indoorFraction = (24.0 - params.grazingHours) / 24.0;
    const urinationsPerDay = params.numCows * params.urinationFrequency * indoorFraction;
    const nSlots = Math.max(1, Math.floor(params.floorArea / params.poolArea));
    const totalDays = STARTUP_DAYS + params.calculationPeriodDays;
    const totalMinutes = totalDays * MINUTES_PER_DAY;
    const startupEndMinute = STARTUP_DAYS * MINUTES_PER_DAY;
    const maxAge = poolProfile.length - 1;

    // Generate and sort urination events
    const totalEvents = Math.round(urinationsPerDay * totalDays);
    const events = new Array(totalEvents);
    for (let i = 0; i < totalEvents; i++) {
        events[i] = { minute: randInt(rng, totalMinutes), slot: randInt(rng, nSlots) };
    }
    events.sort((a, b) => a.minute - b.minute);

    // Track when each slot's pool was created
    const slotBirth = new Map();
    let totalEmissionGN = 0.0;

    for (let i = 0; i < totalEvents; i++) {
        const { minute, slot } = events[i];

        // Finalize old pool at this slot
        if (slotBirth.has(slot)) {
            const oldBirth = slotBirth.get(slot);
            const poolAge = Math.min(minute - oldBirth, maxAge);

            if (oldBirth >= startupEndMinute) {
                totalEmissionGN += poolProfile[poolAge];
            } else if (minute > startupEndMinute) {
                const ageAtStartup = Math.min(startupEndMinute - oldBirth, maxAge);
                totalEmissionGN += poolProfile[poolAge] - poolProfile[ageAtStartup];
            }
        }

        slotBirth.set(slot, minute);
    }

    // Finalize remaining pools
    for (const [slot, birth] of slotBirth) {
        const age = Math.min(totalMinutes - birth, maxAge);
        if (birth >= startupEndMinute) {
            totalEmissionGN += poolProfile[age];
        } else if (birth + age > startupEndMinute) {
            const ageAtStartup = Math.min(startupEndMinute - birth, maxAge);
            totalEmissionGN += poolProfile[age] - poolProfile[ageAtStartup];
        }
    }

    const examinedHours = params.calculationPeriodDays * 24.0;
    return totalEmissionGN * MW_NH3_OVER_N / examinedHours;
}

// =====================================================================
// Main entry point
// =====================================================================

/**
 * Run the full Snelstal emission model.
 *
 * @param {Object} params - Model parameters
 * @param {Function} onProgress - Optional callback(runIndex, totalRuns) for UI updates
 * @returns {Object} { floorGPerHr, pitGPerHr, totalGPerHr,
 *                      floorKgPerCowPerYear, pitKgPerCowPerYear, totalKgPerCowPerYear }
 */
function runModel(params, onProgress) {
    // Pit emission (deterministic)
    const pitGPerHr = pitEmissionGPerHr(
        params.tanConcentration,
        params.pitArea,
        params.pitTemperatureC,
        params.pitAirSpeed,
        params.pitPH,
        params.pitPercentage
    );

    // Pre-compute pool profile (shared across all MC runs)
    const poolProfile = precomputePoolProfile(
        params.ureaNConcentration,
        params.poolArea,
        params.poolDepthM,
        params.floorTemperatureC,
        params.floorAirSpeed,
        params.floorPH
    );

    // Floor emission: average over MC runs
    let floorSum = 0.0;
    let masterSeed = 42;

    for (let run = 0; run < params.numRuns; run++) {
        const rng = createRng(masterSeed + run * 7919);
        const floorGHr = floorEmissionSingleRun(params, rng, poolProfile);
        floorSum += floorGHr;

        if (onProgress) {
            onProgress(run + 1, params.numRuns);
        }
    }

    const floorGPerHr = floorSum / params.numRuns;
    const totalGPerHr = floorGPerHr + pitGPerHr;
    const n = params.numCows;

    return {
        floorGPerHr: floorGPerHr,
        pitGPerHr: pitGPerHr,
        totalGPerHr: totalGPerHr,
        floorKgPerCowPerYear: floorGPerHr * HOURS_PER_YEAR / 1000.0 / n,
        pitKgPerCowPerYear: pitGPerHr * HOURS_PER_YEAR / 1000.0 / n,
        totalKgPerCowPerYear: totalGPerHr * HOURS_PER_YEAR / 1000.0 / n,
    };
}

// Export for use in app.js
if (typeof window !== 'undefined') {
    window.SnelstalModel = {
        runModel,
        fractionNH3,
        henryConstant,
        massTransferCoefficient,
        pitEmissionGPerHr,
    };
}
