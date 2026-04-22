---
title: Master Dataset
---

```js
import {buildDemoDataFlowNote, isValidMasterData, loadStoredValue} from "./components/demoData.js";
import {renderPagePager} from "./components/pagePager.js";

const seededMasterData = await FileAttachment("./data/demo/masterData.json").json();
const masterState = loadStoredValue("masterData", seededMasterData);
const masterData = isValidMasterData(masterState.value) ? masterState.value : seededMasterData;

const adlbLongSeed = masterData.flatMap((row) => {
  const records = [];
  for (const key of Object.keys(row)) {
    const match = key.match(/^(Endpoint\d+)_(Visit\d+)$/);
    if (!match) continue;
    const value = row[key];
    if (value == null) continue;
    records.push({
      USUBJID: row.USUBJID,
      TRTEMFL: row.TRTEMFL,
      PARAMCD: match[1],
      VISIT: match[2],
      AVAL: value
    });
  }
  return records;
});

display(html`<p><small>${buildDemoDataFlowNote([
  {label: "masterData", source: masterState.source}
], {includeServerNote: false})}</small></p>`);
```

# Master Dataset

> The master data table represents a comprehensive collection of information derived from multiple simulated datasets, consolidated into a single, wide-format structure. In this format, each subject is represented by a unique row, ensuring that all data points pertaining to an individual are contained within a single entry.

<div class="hl">
<blockquote>
  <p><b>Wide format data (such as ADSL)</b> typically arranges variables in columns, with each row representing a subject.</p>
  <p><b>Long format data (such as ADLB)</b>, on the other hand, organizes data with repeated measures in multiple rows per subject.</p>
  <p>Wide format data makes it easier to grasp overall characteristics, while long format data is useful for analyzing changes over time and facilitating data manipulation.</p>
</blockquote>
</div>

> Wide format and long format can be transferred to each other. Below is an example to show how ADLB is changed from the original long format to a wide format dataset.

```js
Inputs.table(adlbLongSeed)
```

> Once all datasets are in wide format, they can be joined together to create a **master dataset** for further analysis.

```js
Inputs.table(masterData)
```

```js
display(renderPagePager("/Master-Dataset"));
```

<style>
.hl blockquote {
  padding: 1em;
  border-left: 5px solid #1E4865;
}

li {
  margin: 6px 0;
}

span[style*="rotate(90deg)"] {
  display: none !important;
}
</style>
