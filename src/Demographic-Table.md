---
title: Demographic Table
---

```js
import {buildDemoDataFlowNote, isValidMasterData, loadStoredValue} from "./components/demoData.js";
import {renderPagePager} from "./components/pagePager.js";
import {renderSubmissionTable} from "./components/submissionTables.js";

const seededMasterData = await FileAttachment("./data/demo/masterData.json").json();
const masterState = loadStoredValue("masterData", seededMasterData);
const masterData = isValidMasterData(masterState.value) ? masterState.value : seededMasterData;

const rows = masterData.map((row) => ({
  ...row,
  AGEGROUP: row.AGE < 60 ? "<60" : row.AGE < 75 ? "60-75" : ">75"
}));

function summarizeNumeric(field, arm) {
  const values = rows.filter((row) => row.TRTEMFL === arm).map((row) => Number(row[field])).filter(Number.isFinite);
  const sorted = values.slice().sort((a, b) => a - b);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const median = sorted.length % 2
    ? sorted[(sorted.length - 1) / 2]
    : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  const variance = values.length > 1
    ? values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1)
    : 0;
  const sd = Math.sqrt(variance);
  return {
    n: values.length,
    mean: mean.toFixed(2),
    median: median.toFixed(2),
    min: Math.min(...values).toFixed(2),
    max: Math.max(...values).toFixed(2),
    sd: sd.toFixed(2)
  };
}

function countCategory(field, arm, value) {
  return rows.filter((row) => row.TRTEMFL === arm && row[field] === value).length;
}

const armA = rows.filter((row) => row.TRTEMFL === "A").length;
const armB = rows.filter((row) => row.TRTEMFL === "B").length;

const tableRows = [
  {label: "", armA: "TRTEMFL=A", armB: "TRTEMFL=B", className: "row-section"},
  {label: "", armA: `(N=${armA})`, armB: `(N=${armB})`, className: "row-section"},
  {label: "AGE", armA: "", armB: "", className: "row-section"},
  (() => {
    const a = summarizeNumeric("AGE", "A");
    const b = summarizeNumeric("AGE", "B");
    return {label: "Mean (SD)", armA: `${a.mean} (${a.sd})`, armB: `${b.mean} (${b.sd})`, className: "row-sub"};
  })(),
  (() => {
    const a = summarizeNumeric("AGE", "A");
    const b = summarizeNumeric("AGE", "B");
    return {label: "Median", armA: a.median, armB: b.median, className: "row-sub"};
  })(),
  (() => {
    const a = summarizeNumeric("AGE", "A");
    const b = summarizeNumeric("AGE", "B");
    return {label: "Min - Max", armA: `${a.min} - ${a.max}`, armB: `${b.min} - ${b.max}`, className: "row-sub"};
  })(),
  {label: "AGEGROUP", armA: "", armB: "", className: "row-section"},
  ...["<60", "60-75", ">75"].map((value) => ({
    label: value,
    armA: countCategory("AGEGROUP", "A", value),
    armB: countCategory("AGEGROUP", "B", value),
    className: "row-sub"
  })),
  {label: "RACE", armA: "", armB: "", className: "row-section"},
  ...["WHITE", "AFRICAN AMERICAN", "AMERICAN INDIAN"].map((value) => ({
    label: value,
    armA: countCategory("RACE", "A", value),
    armB: countCategory("RACE", "B", value),
    className: "row-sub"
  })),
  ...["HEIGHT", "WEIGHT", "BMI"].flatMap((field) => {
    const a = summarizeNumeric(field, "A");
    const b = summarizeNumeric(field, "B");
    return [
      {label: field, armA: "", armB: "", className: "row-section"},
      {label: "Mean (SD)", armA: `${a.mean} (${a.sd})`, armB: `${b.mean} (${b.sd})`, className: "row-sub"},
      {label: "Median", armA: a.median, armB: b.median, className: "row-sub"},
      {label: "Min - Max", armA: `${a.min} - ${a.max}`, armB: `${b.min} - ${b.max}`, className: "row-sub"}
    ];
  })
];

display(html`<p><small>${buildDemoDataFlowNote([
  {label: "masterData", source: masterState.source}
], {includeServerNote: false})}</small></p>`);
```

# FDA Submission Tables

> The FDA Submission Tables section is designed to streamline the preparation of FDA submission packages by automating essential statistical summaries. These tables mirror the original demo’s output style while now rendering as native Observable pages.

> - Protocol: `CDISCDEMO01`
> - Population: `Intent-to-Treat`

### Demographic Table

```js
display(renderSubmissionTable({
  columns: [
    {key: "label", label: ""},
    {key: "armA", label: ""},
    {key: "armB", label: ""}
  ],
  rows: tableRows
}));
```

```js
display(renderPagePager("/Demographic-Table"));
```
