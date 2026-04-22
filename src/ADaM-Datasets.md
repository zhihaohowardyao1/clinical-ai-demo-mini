---
title: ADaM Datasets
---

```js
import {html} from "npm:htl";
import {
  buildDemoDataFlowNote,
  buildADLBWide,
  buildMasterData,
  DEFAULT_ADLB_INPUTS,
  DEFAULT_ADSL_INPUTS,
  generateADLB,
  generateADSL,
  isValidAdlbInputs,
  isValidAdslInputs,
  isValidMasterData,
  loadStoredValue,
  persistDemoBundle
} from "./components/demoData.js";
import {renderPagePager} from "./components/pagePager.js";
```

```js
const {SummaryTable} = await import("./components/summaryTable.js");
const adslSeedInputs = await FileAttachment("./data/demo/adslInputs.json").json();
const adlbSeedInputs = await FileAttachment("./data/demo/adlbInputs.json").json();
```

# ADaM Dataset

> CDISC standards are required for regulatory submissions to the FDA (CDER & CBER) for drugs and biologics. While CDRH does not mandate the use of CDISC standards, it strongly encourages manufacturers to adopt data and terminology standards in pre-clinical and post-market submissions to enhance consistency and improve data quality.

> The Data Simulation section enables the generation of multiple simulated datasets based on CDISC standards. These datasets are invaluable for early-phase exploratory analyses, model testing, and power calculations. Whether you are exploring patient subgroups, treatment efficacy, or biomarker correlations, simulated data provides the flexibility to investigate various scenarios without relying on real-world trial data, which may be limited or unavailable in early research phases.

```js
const storedAdslInputs = loadStoredValue("adslInputs", adslSeedInputs ?? DEFAULT_ADSL_INPUTS);
const storedAdlbInputs = loadStoredValue("adlbInputs", adlbSeedInputs ?? DEFAULT_ADLB_INPUTS);
const safeAdslInputs = isValidAdslInputs(storedAdslInputs.value) ? storedAdslInputs.value : adslSeedInputs ?? DEFAULT_ADSL_INPUTS;
const safeAdlbInputs = isValidAdlbInputs(storedAdlbInputs.value) ? storedAdlbInputs.value : adlbSeedInputs ?? DEFAULT_ADLB_INPUTS;
```

# ADSL

```js
const adslInputs = view(
  Inputs.form(
    {
      enrollment: Inputs.range([60, 200], {label: "Sample size (ITT)", step: 10, value: safeAdslInputs.enrollment}),
      sex: Inputs.range([0, 1], {label: "Male vs. Female", step: 0.05, value: safeAdslInputs.sex}),
      age1: Inputs.range([30, 50], {label: "Age Min", step: 1, value: safeAdslInputs.age1}),
      age2: Inputs.range([60, 90], {label: "Age Max", step: 1, value: safeAdslInputs.age2}),
      height1: Inputs.range([130, 150], {label: "Height Min", step: 1, value: safeAdslInputs.height1}),
      height2: Inputs.range([180, 200], {label: "Height Max", step: 1, value: safeAdslInputs.height2}),
      weight1: Inputs.range([30, 50], {label: "Weight Min", step: 5, value: safeAdslInputs.weight1}),
      weight2: Inputs.range([100, 120], {label: "Weight Max", step: 5, value: safeAdslInputs.weight2}),
      flg1: Inputs.range([0, 1], {label: "Flag1 Ratio", step: 0.1, value: safeAdslInputs.flg1}),
      trt: Inputs.range([0, 1], {label: "Treatment vs. Control", step: 0.1, value: safeAdslInputs.trt})
    },
    {
      template: (parts) => {
        const values = Object.values(parts);
        const left = values.filter((d, i) => i % 2 === 0);
        const right = values.filter((d, i) => i % 2 !== 0);
        return html`<div style="display:flex;gap:20px;justify-content:space-between;max-width:780px;">
          <div>${left}</div>
          <div>${right}</div>
        </div>`;
      }
    }
  )
);
```

```js
const ADSL = generateADSL(adslInputs);
```

```js
display(SummaryTable(ADSL, {label: "ADSL"}))
```

```js
Inputs.table(ADSL)
```

# ADLB

```js
const adlbInputs = view(
  Inputs.form({
    endpoints: Inputs.range([1, 4], {label: "Number of Endpoint", step: 1, value: safeAdlbInputs.endpoints}),
    visits: Inputs.range([2, 5], {label: "Number of Visit", step: 1, value: safeAdlbInputs.visits}),
    retention: Inputs.range([0.6, 1], {label: "Follow Up Retention Rate", step: 0.1, value: safeAdlbInputs.retention})
  })
);
```

```js
const ADLB = generateADLB(adlbInputs, ADSL);
const ADLB_Long = buildADLBWide(ADLB);
const masterData = buildMasterData(ADSL, ADLB_Long);
```

```js
if (typeof window !== "undefined" && window.localStorage) {
  const existingMasterData = loadStoredValue("masterData", null).value;
  if (!isValidMasterData(existingMasterData)) {
    persistDemoBundle({ADSL, ADLB, adslInputs, adlbInputs, ADLB_Long, masterData});
  }
}
```

```js
display(SummaryTable(ADLB, {label: "ADLB"}))
```

```js
Inputs.table(ADLB)
```

```js
display(html`<p><strong>Derived subject-level structures</strong></p>`)
```

```js
Inputs.table(ADLB_Long)
```

```js
Inputs.table(masterData)
```

```js
display(html`<p><small>${buildDemoDataFlowNote([
  {label: "ADSL controls", source: storedAdslInputs.source},
  {label: "ADLB controls", source: storedAdlbInputs.source}
])} Saving below updates the browser demo bundle keys used by the migrated analytics pages and the remaining legacy pages.</small></p>`)
```

```js
display(
  Inputs.button("Once all parameters are set, click to store datasets", {
    reduce: () => {
      persistDemoBundle({
        ADSL,
        ADLB,
        adslInputs,
        adlbInputs,
        ADLB_Long,
        masterData
      });
      return "saved";
    }
  })
)
```

```js
display(renderPagePager("/ADaM-Datasets"));
```
