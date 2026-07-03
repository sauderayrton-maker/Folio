/* ─────────────────────────────────────────────────────────────────────────
   Folio — tax-data.js
   All tax tables live here as data, stamped with the tax year they belong
   to (decision #12 in handoff.md). Update ritual: refresh every table below
   from CRA / IRS published figures, bump YEAR, note it in CHANGELOG.md.

   Everything is an ESTIMATE for planning: provincial/state rates are flat
   approximations of the mid brackets, credits/deductions are ignored, and
   all income is treated as employment income.
   ───────────────────────────────────────────────────────────────────────── */
(function () {
    "use strict";

    const YEAR = 2024;

    /* [name, flat approximation of provincial rate] */
    const CA_PROV = {
        AB: ["Alberta", 0.10], BC: ["British Columbia", 0.077], MB: ["Manitoba", 0.108],
        NB: ["New Brunswick", 0.094], NL: ["Newfoundland", 0.087], NS: ["Nova Scotia", 0.0879],
        NT: ["Northwest Territories", 0.059], NU: ["Nunavut", 0.04], ON: ["Ontario", 0.0505],
        PE: ["PEI", 0.0965], QC: ["Quebec", 0.14], SK: ["Saskatchewan", 0.105], YT: ["Yukon", 0.064],
    };

    /* [name, flat approximation of state rate] */
    const US_STATES = {
        AL: ["Alabama", 0.05], AK: ["Alaska", 0], AZ: ["Arizona", 0.025], AR: ["Arkansas", 0.049],
        CA: ["California", 0.093], CO: ["Colorado", 0.044], CT: ["Connecticut", 0.0699],
        DE: ["Delaware", 0.066], FL: ["Florida", 0], GA: ["Georgia", 0.0549],
        HI: ["Hawaii", 0.0825], ID: ["Idaho", 0.06], IL: ["Illinois", 0.0495],
        IN: ["Indiana", 0.0305], IA: ["Iowa", 0.057], KS: ["Kansas", 0.057],
        KY: ["Kentucky", 0.045], LA: ["Louisiana", 0.0425], ME: ["Maine", 0.0715],
        MD: ["Maryland", 0.0575], MA: ["Massachusetts", 0.05], MI: ["Michigan", 0.0425],
        MN: ["Minnesota", 0.0985], MS: ["Mississippi", 0.05], MO: ["Missouri", 0.0495],
        MT: ["Montana", 0.0675], NE: ["Nebraska", 0.0684], NV: ["Nevada", 0],
        NH: ["New Hampshire", 0], NJ: ["New Jersey", 0.1075], NM: ["New Mexico", 0.059],
        NY: ["New York", 0.0685], NC: ["North Carolina", 0.0475], ND: ["North Dakota", 0.025],
        OH: ["Ohio", 0.0399], OK: ["Oklahoma", 0.0475], OR: ["Oregon", 0.099],
        PA: ["Pennsylvania", 0.0307], RI: ["Rhode Island", 0.0599], SC: ["South Carolina", 0.065],
        SD: ["South Dakota", 0], TN: ["Tennessee", 0], TX: ["Texas", 0],
        UT: ["Utah", 0.0465], VT: ["Vermont", 0.0875], VA: ["Virginia", 0.0575],
        WA: ["Washington", 0], WV: ["West Virginia", 0.065], WI: ["Wisconsin", 0.0765],
        WY: ["Wyoming", 0], DC: ["Washington DC", 0.1075],
    };

    /* Progressive federal brackets: [upper limit, marginal rate] */
    const CA_FEDERAL = [
        [55867, 0.15], [111733, 0.205], [154906, 0.26], [220000, 0.29], [Infinity, 0.33],
    ];
    const US_FEDERAL = [
        [11600, 0.10], [47150, 0.12], [100525, 0.22], [191950, 0.24],
        [243725, 0.32], [609350, 0.35], [Infinity, 0.37],
    ];

    /* Canadian payroll deductions (employee side) */
    const CA_CPP = { rate: 0.0595, ympe: 68500, exemption: 3500, cpp2Rate: 0.04, yampe: 73200 };
    const CA_EI = { rate: 0.0166, mie: 63200 };

    /* US payroll: Social Security (capped) + Medicare */
    const US_FICA = { ssRate: 0.062, ssCap: 168600, medicareRate: 0.0145 };

    function calcBrackets(gross, brackets) {
        let tax = 0,
            prev = 0;
        for (const [limit, rate] of brackets) {
            if (gross <= prev) break;
            tax += (Math.min(gross, limit) - prev) * rate;
            prev = limit;
        }
        return tax;
    }

    /* breakdown(annualGross, {country, region}, manualRatePct) →
       { total, federal, regional, payroll, regionalName, payrollLabel } */
    function breakdown(gross, cfg, manualRate) {
        const zero = {
            total: 0, federal: 0, regional: 0, payroll: 0,
            regionalName: "", payrollLabel: "",
        };
        if (!gross || gross <= 0) return zero;

        if (cfg.country === "CA") {
            const federal = calcBrackets(gross, CA_FEDERAL);
            const prov = CA_PROV[cfg.region];
            const regional = gross * (prov ? prov[1] : 0);
            const cppBase =
                Math.max(0, Math.min(gross, CA_CPP.ympe) - CA_CPP.exemption) * CA_CPP.rate;
            const cpp2 =
                Math.max(0, Math.min(gross, CA_CPP.yampe) - CA_CPP.ympe) * CA_CPP.cpp2Rate;
            const ei = Math.min(gross, CA_EI.mie) * CA_EI.rate;
            const payroll = cppBase + cpp2 + ei;
            return {
                total: federal + regional + payroll,
                federal, regional, payroll,
                regionalName: prov ? prov[0] : "",
                payrollLabel: "CPP + EI",
            };
        }

        if (cfg.country === "US") {
            const federal = calcBrackets(gross, US_FEDERAL);
            const state = US_STATES[cfg.region];
            const regional = gross * (state ? state[1] : 0);
            const payroll =
                Math.min(gross, US_FICA.ssCap) * US_FICA.ssRate +
                gross * US_FICA.medicareRate;
            return {
                total: federal + regional + payroll,
                federal, regional, payroll,
                regionalName: state ? state[0] + " state" : "",
                payrollLabel: "FICA (SS + Medicare)",
            };
        }

        /* manual flat rate */
        const total = gross * ((parseFloat(manualRate) || 22) / 100);
        return { ...zero, total, federal: total };
    }

    window.FOLIO_TAX = { year: YEAR, CA_PROV, US_STATES, breakdown };
})();
