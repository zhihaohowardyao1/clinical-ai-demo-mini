---
title: Visit Completion Table
---

```js
import {buildDemoDataFlowNote, isValidMasterData, loadStoredValue} from "./components/demoData.js";
import {renderPagePager} from "./components/pagePager.js";
import {renderSubmissionTable} from "./components/submissionTables.js";

const seededMasterData = await FileAttachment("./data/demo/masterData.json").json();
const masterState = loadStoredValue("masterData", seededMasterData);
const masterData = isValidMasterData(masterState.value) ? masterState.value : seededMasterData;

const endpoint = "Endpoint1";
const visits = ["Visit0", "Visit1", "Visit2", "Visit3"];
const armA = masterData.filter((row) => row.TRTEMFL === "A").length;
const armB = masterData.filter((row) => row.TRTEMFL === "B").length;
const total = masterData.length;

function countCompleted(arm, visit) {
  return masterData.filter((row) => row.TRTEMFL === arm && row[`${endpoint}_${visit}`] != null).length;
}

const tableRows = [
  {label: "", armA: "TRTEMFL=A", armB: "TRTEMFL=B", total: "TOTAL", className: "row-section"},
  {label: "", armA: `(N=${armA})`, armB: `(N=${armB})`, total: `(N=${total})`, className: "row-section"},
  ...visits.map((visit) => {
    const countA = countCompleted("A", visit);
    const countB = countCompleted("B", visit);
    const combined = countA + countB;
    return {
      label: visit === "Visit0" ? "Baseline" : visit,
      armA: `${countA} (${((countA / armA) * 100).toFixed(1)}%)`,
      armB: `${countB} (${((countB / armB) * 100).toFixed(1)}%)`,
      total: `${combined} (${((combined / total) * 100).toFixed(1)}%)`,
      className: "row-sub"
    };
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

### Visit Completion Table

```js
display(renderSubmissionTable({
  columns: [
    {key: "label", label: ""},
    {key: "armA", label: ""},
    {key: "armB", label: ""},
    {key: "total", label: ""}
  ],
  rows: tableRows
}));
```

```js
display(renderPagePager("/Followup-Table"));
```
