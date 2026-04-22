---
title: Primary Table
---

```js
import {buildDemoDataFlowNote, isValidAdlbInputs, isValidMasterData, loadStoredValue} from "./components/demoData.js";
import {renderPagePager} from "./components/pagePager.js";
const seededMasterData = await FileAttachment("./data/demo/masterData.json").json();
const seededAdlbInputs = await FileAttachment("./data/demo/adlbInputs.json").json();
const masterState = loadStoredValue("masterData", seededMasterData);
const adlbInputsState = loadStoredValue("adlbInputs", seededAdlbInputs);
const data = isValidMasterData(masterState.value) ? masterState.value : seededMasterData;
const adlbInputs = isValidAdlbInputs(adlbInputsState.value) ? adlbInputsState.value : seededAdlbInputs;
const armA = data.filter((row) => row.TRTEMFL === "A").length;
const armB = data.filter((row) => row.TRTEMFL === "B").length;
```

```js
const endpoints = Array.from({length: adlbInputs.endpoints}, (_, i) => `Endpoint${i + 1}`);
const visits = Array.from({length: adlbInputs.visits}, (_, i) => `Visit${i}`);
```

```js

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted.length % 2
    ? sorted[(sorted.length - 1) / 2]
    : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
}

function deviation(values) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function groupedWide(rows, dimension, valueKey) {
  const grouped = new Map();
  for (const row of rows) {
    const key = row[dimension];
    const value = row[valueKey];
    if (value == null || Number.isNaN(Number(value))) continue;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(Number(value));
  }
  return new Map(Array.from(grouped, ([key, values]) => [
    key,
    {
      n: values.length,
      m: mean(values),
      md: median(values),
      sd: deviation(values),
      min: Math.min(...values),
      max: Math.max(...values),
      values
    }
  ]));
}

function emptySummary() {
  return {
    n: 0,
    m: 0,
    md: 0,
    sd: 0,
    min: 0,
    max: 0,
    values: []
  };
}

function formatMeanSd(summary) {
  return summary.n ? `${summary.m.toFixed(1)} (${summary.sd.toFixed(2)})` : "-";
}

function formatMedianMinMax(summary) {
  return summary.n ? `${summary.md.toFixed(1)} (${summary.min.toFixed(2)}; ${summary.max.toFixed(2)})` : "-";
}

function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const absX = Math.abs(x);
  const t = 1 / (1 + p * absX);
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX));
  return sign * y;
}

function normalCdf(x) {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function welchTTest(sample1, sample2) {
  if (!sample1.length || !sample2.length) {
    return {
      pValue: NaN,
      se: NaN,
      confidenceInterval: [NaN, NaN]
    };
  }
  const mean1 = mean(sample1);
  const mean2 = mean(sample2);
  const var1 = deviation(sample1) ** 2;
  const var2 = deviation(sample2) ** 2;
  const n1 = sample1.length;
  const n2 = sample2.length;
  const se = Math.sqrt((var1 / n1) + (var2 / n2));
  const t = se === 0 ? 0 : (mean1 - mean2) / se;
  const pValue = 2 * (1 - normalCdf(Math.abs(t)));
  const marginOfError = 1.96 * se;
  return {
    pValue,
    se,
    confidenceInterval: [mean1 - mean2 - marginOfError, mean1 - mean2 + marginOfError]
  };
}
```

```js
const tableRows = [
  {label: "", armA: "TRTEMFL=A", armB: "TRTEMFL=B", className: "row-section"},
  {label: "", armA: `(N=${armA})`, armB: `(N=${armB})`, className: "row-section"}
];

for (let i = 0; i < visits.length; i += 1) {
  const visit = visits[i];
  const baseSummary = groupedWide(data, "TRTEMFL", `${endpointInput}_${visit}`);
  const groupA = baseSummary.get("A") ?? emptySummary();
  const groupB = baseSummary.get("B") ?? emptySummary();

  tableRows.push({label: "", armA: "", armB: "", className: "row-section"});
  tableRows.push({label: visit === "Visit0" ? "Baseline" : visit, armA: "", armB: "", className: "row-section"});
  tableRows.push({label: "N", armA: groupA?.n ?? 0, armB: groupB?.n ?? 0, className: "row-sub"});
  tableRows.push({label: "Mean (SD)", armA: formatMeanSd(groupA), armB: formatMeanSd(groupB), className: "row-sub"});
  tableRows.push({label: "Median (Min; Max)", armA: formatMedianMinMax(groupA), armB: formatMedianMinMax(groupB), className: "row-sub"});

  if (visit !== "Visit0") {
    const chgSummary = groupedWide(data, "TRTEMFL", `${endpointInput}_${visit}_CHG`);
    const chgA = chgSummary.get("A") ?? emptySummary();
    const chgB = chgSummary.get("B") ?? emptySummary();
    const test = welchTTest(chgA.values, chgB.values);

    tableRows.push({label: `Change from Baseline (${visit})`, armA: "", armB: "", className: "row-section"});
    tableRows.push({label: "N", armA: chgA.n, armB: chgB.n, className: "row-sub"});
    tableRows.push({label: "Mean (SD)", armA: formatMeanSd(chgA), armB: formatMeanSd(chgB), className: "row-sub"});
    tableRows.push({label: "Median (Min; Max)", armA: formatMedianMinMax(chgA), armB: formatMedianMinMax(chgB), className: "row-sub"});
    tableRows.push({label: `p-value (${visit}: Trt B - Trt A)`, armA: "", armB: Number.isFinite(test.pValue) ? test.pValue.toFixed(3) : "-", className: "row-sub"});
    tableRows.push({label: "Diff of LS Means (SE)", armA: "", armB: Number.isFinite(test.se) ? `${(chgB.m - chgA.m).toFixed(1)} (${test.se.toFixed(2)})` : "-", className: "row-sub"});
    tableRows.push({label: "95% CI", armA: "", armB: test.confidenceInterval.every(Number.isFinite) ? `(${test.confidenceInterval.map((value) => value.toFixed(1)).join("; ")})` : "-", className: "row-sub"});
  }
}
```

```js
function renderPrimaryTable(rows) {
  const table = document.createElement("table");
  table.className = "primary-table";

  const tbody = document.createElement("tbody");
  for (const row of rows) {
    const tr = document.createElement("tr");
    tr.className = row.className || "";

    const td1 = document.createElement("td");
    td1.textContent = row.label ?? "";
    td1.className = "col-label";

    const td2 = document.createElement("td");
    td2.textContent = row.armA ?? "";
    td2.className = "col-arm";

    const td3 = document.createElement("td");
    td3.textContent = row.armB ?? "";
    td3.className = "col-arm";

    tr.append(td1, td2, td3);
    tbody.append(tr);
  }

  table.append(tbody);

  const shell = html`<div class="primary-table-shell"></div>`;
  shell.append(table);
  return shell;
}
```

# FDA Submission Tables

> The FDA Submission Tables section is designed to streamline the preparation of FDA submission packages by automating the generation of essential statistical tables. These tables are critical for new drug or medical device approval and must adhere to strict regulatory guidelines. This platform ensures that all submission tables align with the FDA's required format and content standards, ensuring compliance and accuracy in regulatory submissions.

- Protocol: `CDISCDEMO01`
- Population: `Intent-to-Treat`

### Primary Table

```js
const endpointInput = view(Inputs.select(endpoints, {value: "Endpoint1", label: "Select Endpoint:"}));
```

```js
display(renderPrimaryTable(tableRows));
```

```js
display(renderPagePager("/Primary-Table"));
```

<style>
.primary-table-shell {
  margin: 2rem 0 2rem;
}

.primary-table {
  width: 100%;
  border-collapse: collapse;
  font: 13px/1.2 var(--sans-serif);
}

.primary-table td {
  padding: 3px 6.5px 3px 0;
  border-bottom: 1px solid var(--theme-foreground-faintest);
  text-align: center;
  vertical-align: top;
}

.primary-table td.col-label {
  text-align: left;
  width: 38%;
}

.primary-table td.col-arm {
  width: 31%;
}

.primary-table tr.row-section td {
  font-weight: 700;
  background: transparent;
}

.primary-table tr.row-sub td.col-label {
  padding-left: 1.75rem;
}

h1 + blockquote {
  max-width: 760px;
  margin-top: 1.5rem;
  margin-bottom: 2.5rem;
}

h1 + blockquote p {
  max-width: none;
}

blockquote + ul {
  margin-top: 0;
  margin-bottom: 3rem;
  max-width: 760px;
}

h3 {
  margin-top: 3rem;
  margin-bottom: 1.25rem;
}

.observablehq--block:has(> form) {
  margin-top: 1.5rem;
  margin-bottom: 2rem;
}
</style>
