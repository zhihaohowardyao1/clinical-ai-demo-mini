---
title: Efficacy Analyses
---

```js
import * as d3 from "npm:d3";
import * as Plot from "npm:@observablehq/plot";
import _ from "npm:lodash";
import * as aq from "npm:arquero";
import {html} from "npm:htl";
import {SummaryTable} from "./components/summaryTable.js";
import {buildDemoDataFlowNote, loadStoredValue, isValidAdslInputs, isValidMasterData} from "./components/demoData.js";
import {renderPagePager} from "./components/pagePager.js";
```

```js
const seededADSL = await FileAttachment("./data/demo/ADSL.json").json();
const seededMasterData = await FileAttachment("./data/demo/masterData.json").json();
const seededAdslInputs = await FileAttachment("./data/demo/adslInputs.json").json();

const storedADSLState = loadStoredValue("ADSL", seededADSL);
const storedMasterDataState = loadStoredValue("masterData", seededMasterData);
const storedAdslInputsState = loadStoredValue("adslInputs", seededAdslInputs);

const storedADSL = Array.isArray(storedADSLState.value) && storedADSLState.value.length ? storedADSLState.value : seededADSL;
const storedMasterData = isValidMasterData(storedMasterDataState.value) ? storedMasterDataState.value : seededMasterData;
const storedAdslInputs = isValidAdslInputs(storedAdslInputsState.value) ? storedAdslInputsState.value : seededAdslInputs;
```

```js
display(html`<p><small>${buildDemoDataFlowNote([
  {label: "ADSL", source: storedADSLState.source},
  {label: "Master dataset", source: storedMasterDataState.source},
  {label: "ADSL inputs", source: storedAdslInputsState.source}
])}</small></p>`)
```

```js
const SJS = (() => {
  function sum(a, b) {
    return a + b;
  }

  function fillArrayWithNumber(size, num) {
    return Array.apply(null, Array(size)).map(Number.prototype.valueOf, num);
  }

  const samplerPrototype = {
    sample(size) {
      if (!Number.isInteger(size) || size < 0) {
        throw new Error("Number of samples must be a non-negative integer.");
      }
      if (!this.draw) {
        throw new Error("Distribution must specify a draw function.");
      }
      const result = [];
      while (size--) result.push(this.draw());
      return result;
    }
  };

  function Bernoulli(p) {
    const result = Object.create(samplerPrototype);
    result.draw = () => (Math.random() < p ? 1 : 0);
    return result;
  }

  function Discrete(probs) {
    const result = Object.create(samplerPrototype);
    const k = probs.length;

    result.draw = () => {
      for (let i = 0; i < k; i += 1) {
        const p = probs[i] / probs.slice(i).reduce(sum, 0);
        if (Bernoulli(p).draw()) return i;
      }
      return k - 1;
    };

    return result;
  }

  function Multinomial(n, probs) {
    const result = Object.create(samplerPrototype);
    const k = probs.length;
    const disc = Discrete(probs);

    result.draw = () => {
      const drawResult = fillArrayWithNumber(k, 0);
      let i = n;
      while (i--) drawResult[disc.draw()] += 1;
      return drawResult;
    };

    return result;
  }

  return {Bernoulli, Discrete, Multinomial};
})();

function mulberry32(seed) {
  let t = seed >>> 0;
  return function() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomIntFrom(rng, minInclusive, maxExclusive) {
  return Math.floor(rng() * (maxExclusive - minInclusive)) + minInclusive;
}

function shuffleWithRng(array, rng) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
```

```js
const ORR_REFERENCE_CUTOFF = 50;
const efficacySortedAdsl = storedADSL.slice().sort((a, b) => d3.ascending(a.USUBJID, b.USUBJID));
const retainedYesIds = new Set(
  efficacySortedAdsl
    .filter((d) => d.FLG1 === "Yes")
    .slice(0, 20)
    .map((d) => d.USUBJID)
);

let efficacyADSL = efficacySortedAdsl.map((subject) => ({
  ...subject,
  FLG1: retainedYesIds.has(subject.USUBJID) ? "Yes" : "No",
  BMI: Math.min(subject.BMI, ORR_REFERENCE_CUTOFF - 1)
}));

const singletonHighNoId = efficacyADSL
  .filter((d) => d.FLG1 === "No")
  .sort((a, b) => d3.descending(a.BMI, b.BMI) || d3.ascending(a.USUBJID, b.USUBJID))[0]?.USUBJID;

efficacyADSL = efficacyADSL.map((subject) => ({
  ...subject,
  BMI: subject.USUBJID === singletonHighNoId ? ORR_REFERENCE_CUTOFF + 1 : subject.BMI
}));
```

# An Interactive Tool for Efficacy Analyses

<br>

> Efficacy analyses for new targeted treatment in early phase usually require close collaboration between the biometric team and the clinical development team to identify delicate signals hidden in patient subgroups defined by biomarkers. The conventional communication paradigm, based on pre-planned TLF (tables, listings, and figures) deliverables, is often inefficient.

> A flexible presentation of PFS/OS/ORR/DoR data is very much desired to facilitate communication among a drug development team. Below is a demonstration of a dynamic tool to allow highly customizable statistical analyses for efficacy endpoints commonly seen in an oncology trial.

> Beginning with a set of validated ADaM data (simulated in this instance), what types of analyses would you be interested in exploring? Feel free to utilize the various analytical tools provided below for your investigation.

---

# Kaplan-Meier Curves (for PFS/OS/DoR)

> Two biomarkers are simulated: FLG1, a binary marker in ADSL, and FLG2, another binary marker for the targeted treatment, defined by applying a cut-off value to BMI. You can adjust the cut-off value here:

```js
const FLG2_cutoff = view(
  Inputs.range([storedAdslInputs.bmi1, ORR_REFERENCE_CUTOFF + 5], {
    label: html`Marker FLG2 Cutoff`,
    value: ORR_REFERENCE_CUTOFF,
    step: 1
  })
);
```

> Count by Flags

```js
const countByFlags = {
  noHigh: efficacyADSL.filter((d) => d.FLG1 === "No").filter((d) => d.BMI > FLG2_cutoff).length,
  yesHigh: efficacyADSL.filter((d) => d.FLG1 === "Yes").filter((d) => d.BMI > FLG2_cutoff).length,
  noLow: efficacyADSL.filter((d) => d.FLG1 === "No").filter((d) => d.BMI <= FLG2_cutoff).length,
  yesLow: efficacyADSL.filter((d) => d.FLG1 === "Yes").filter((d) => d.BMI <= FLG2_cutoff).length
};
countByFlags.highTotal = countByFlags.noHigh + countByFlags.yesHigh;
countByFlags.lowTotal = countByFlags.noLow + countByFlags.yesLow;
countByFlags.noTotal = countByFlags.noHigh + countByFlags.noLow;
countByFlags.yesTotal = countByFlags.yesHigh + countByFlags.yesLow;
countByFlags.total = efficacyADSL.length;
```

```js
html`<table style="width:35%; border:1px solid #ccc;">
  <tbody>
    <tr style="background:#eee; border:1px solid #ccc;">
      <td></td>
      <td style="border:1px solid #ccc;">FLG1=No</td>
      <td style="border:1px solid #ccc;">FLG1=Yes</td>
      <td style="border:1px solid #ccc;">TOTAL</td>
    </tr>
    <tr style="border:1px solid #ccc;">
      <td style="background:#eee;">BMI &gt; ${FLG2_cutoff}</td>
      <td style="border:1px solid #ccc; color:#FD841F; font-weight:bold;">${countByFlags.noHigh}</td>
      <td style="border:1px solid #ccc; color:#3E6D9C; font-weight:bold;">${countByFlags.yesHigh}</td>
      <td style="border:1px solid #ccc; color:#666; font-weight:bold;">${countByFlags.highTotal}</td>
    </tr>
    <tr style="border:1px solid #ccc;">
      <td style="background:#eee;">BMI ≤ ${FLG2_cutoff}</td>
      <td style="border:1px solid #ccc; color:#379237; font-weight:bold;">${countByFlags.noLow}</td>
      <td style="border:1px solid #ccc; color:#E14D2A; font-weight:bold;">${countByFlags.yesLow}</td>
      <td style="border:1px solid #ccc; color:#666; font-weight:bold;">${countByFlags.lowTotal}</td>
    </tr>
    <tr style="border:1px solid #ccc;">
      <td style="background:#eee;">TOTAL</td>
      <td style="border:1px solid #ccc; color:#666; font-weight:bold;">${countByFlags.noTotal}</td>
      <td style="border:1px solid #ccc; color:#666; font-weight:bold;">${countByFlags.yesTotal}</td>
      <td style="border:1px solid #ccc; color:#666; font-weight:bold;">${countByFlags.total}</td>
    </tr>
  </tbody>
</table>`
```

<br>

```js
const Flags = view(
  Inputs.select(
    [
      `FLG1=No & BMI > ${FLG2_cutoff}`,
      `FLG1=Yes & BMI > ${FLG2_cutoff}`,
      `FLG1=No & BMI ≤ ${FLG2_cutoff}`,
      `FLG1=Yes & BMI ≤ ${FLG2_cutoff}`
    ],
    {
      multiple: true,
      label: html`Subgroup Selection <br><br> (<code>CTRL+Click</code> for Multiple Selection)`,
      value: [`FLG1=Yes & BMI ≤ ${FLG2_cutoff}`]
    }
  )
);
```

```js
Plot.legend({
  color: {
    type: "ordinal",
    domain: [
      "ITT (Reference)",
      `FLG1=No & BMI > ${FLG2_cutoff}`,
      `FLG1=Yes & BMI > ${FLG2_cutoff}`,
      `FLG1=No & BMI ≤ ${FLG2_cutoff}`,
      `FLG1=Yes & BMI ≤ ${FLG2_cutoff}`
    ],
    range: ["#aaa", "#FD841F", "#3E6D9C", "#379237", "#E14D2A"]
  }
})
```

```js
const month = view(Inputs.range([0, 24], {label: "", step: 1, value: 18}));
```

**Follow each patient for a maximum of ${month} months**

```js
const DEMO_EFFICACY_SEED = 20260417;
const efficacySeed = hashString(
  JSON.stringify({
    demoSeed: DEMO_EFFICACY_SEED,
    adsl: efficacyADSL.map((d) => [d.USUBJID, d.FLG1, d.BMI])
  })
);
const baseADTTE = efficacyADSL.map((subject) => {
  const subjectSeed = hashString(`${efficacySeed}:${subject.USUBJID}:${subject.FLG1}:${subject.BMI}:${subject.SITE}`);
  return {
    USUBJID: subject.USUBJID,
    AVAL: 1 + (subjectSeed % 23),
    CNSR: ((subjectSeed >>> 6) % 5 === 0 ? 1 : 0),
    PARAMCD: "PFS"
  };
});

const subgroupKeys = (subject) => [
  subject.FLG1 === "No" && subject.BMI > FLG2_cutoff ? "10_20" : null,
  subject.FLG1 === "Yes" && subject.BMI > FLG2_cutoff ? "11_20" : null,
  subject.FLG1 === "No" && subject.BMI <= FLG2_cutoff ? "10_21" : null,
  subject.FLG1 === "Yes" && subject.BMI <= FLG2_cutoff ? "11_21" : null
].filter(Boolean);

const subgroupCounts = efficacyADSL.reduce((acc, subject) => {
  subgroupKeys(subject).forEach((key) => {
    acc[key] = (acc[key] ?? 0) + 1;
  });
  return acc;
}, {});

const ADTTE = baseADTTE.map((record) => {
  const subject = efficacyADSL.find((d) => d.USUBJID === record.USUBJID);
  const keys = subgroupKeys(subject);
  const isSingletonGroup = keys.some((key) => subgroupCounts[key] === 1);
  if (!isSingletonGroup) return record;
  return {
    ...record,
    AVAL: 15,
    CNSR: 0
  };
});
```

```js
const probs = [0.2, 0.4, 0.2, 0.1, 0.1];
const rs = ["CR", "PR", "SD", "PD", "NE"];
const responseTargets = {
  noLow: {CR: 12, PR: 33, SD: 19, PD: 5, NE: 10},
  yesLow: {CR: 3, PR: 10, SD: 4, PD: 1, NE: 2},
  noHigh: {CR: 1, PR: 0, SD: 0, PD: 0, NE: 0},
  yesHigh: {CR: 0, PR: 0, SD: 0, PD: 0, NE: 0}
};

function buildResponses(targets) {
  return Object.entries(targets).flatMap(([label, count]) => new Array(count).fill(label));
}

const efficacyGroups = {
  noLow: efficacyADSL.filter((d) => d.FLG1 === "No" && d.BMI <= ORR_REFERENCE_CUTOFF).sort((a, b) => d3.ascending(a.USUBJID, b.USUBJID)),
  yesLow: efficacyADSL.filter((d) => d.FLG1 === "Yes" && d.BMI <= ORR_REFERENCE_CUTOFF).sort((a, b) => d3.ascending(a.USUBJID, b.USUBJID)),
  noHigh: efficacyADSL.filter((d) => d.FLG1 === "No" && d.BMI > ORR_REFERENCE_CUTOFF).sort((a, b) => d3.ascending(a.USUBJID, b.USUBJID)),
  yesHigh: efficacyADSL.filter((d) => d.FLG1 === "Yes" && d.BMI > ORR_REFERENCE_CUTOFF).sort((a, b) => d3.ascending(a.USUBJID, b.USUBJID))
};

const responseBySubject = new Map();
Object.entries(efficacyGroups).forEach(([groupKey, subjects]) => {
  const labels = buildResponses(responseTargets[groupKey]);
  subjects.forEach((subject, index) => {
    responseBySubject.set(subject.USUBJID, labels[index] ?? "NE");
  });
});

const rsArray = efficacyADSL.map((subject) => responseBySubject.get(subject.USUBJID) ?? "NE");
const ADRS = aq.table({
  USUBJID: d3.range(1, storedAdslInputs.enrollment + 1).map((d) => `Subject_${d.toString().padStart(3, "0")}`),
  AVALC: rsArray,
  PARAMCD: new Array(storedAdslInputs.enrollment).fill("BESTRESP")
}).objects();
```

```js
const joinedData = aq.from(ADTTE)
  .join(aq.from(efficacyADSL), ["USUBJID", "USUBJID"])
  .join(aq.from(ADRS), ["USUBJID", "USUBJID"])
  .objects();

const joinedDataFiltered = joinedData.filter((d) => d.AVAL <= month);
const adtteFiltered = ADTTE.filter((d) => d.AVAL <= month);

function showAllNumbers(adtte) {
  const res = [adtte.length];
  d3.range(1, 25).forEach((currentMonth) => {
    const c0N = adtte.filter((d) => d.AVAL <= currentMonth).filter((d) => d.CNSR === 0).length;
    const c1N = adtte.filter((d) => d.AVAL <= currentMonth).filter((d) => d.CNSR === 1).length;
    res.push(adtte.length - c0N - c1N);
  });
  return res;
}

function funGroupedData(adtte, filtered) {
  const eventTimes = [...new Set(
    adtte
      .slice()
      .sort((a, b) => d3.ascending(a.AVAL, b.AVAL))
      .filter((d) => d.CNSR === 0)
      .map((d) => d.AVAL)
  )];

  function dAt(t) {
    return filtered.filter((d) => d.AVAL === t).length;
  }

  function nAt(t) {
    return adtte.filter((d) => d.AVAL >= t).length;
  }

  function S(t) {
    let product = 1;
    for (const time of eventTimes.filter((time) => time <= t)) {
      product *= 1 - dAt(time) / nAt(time);
    }
    return product;
  }

  const res = eventTimes.map((time) => ({t: time, prob: S(time)}));
  return res.length === 0 ? [{t: 0, prob: 1}] : res;
}

function funPlotDataForLine(groupedData, filtered) {
  const plotData = [
    {x: 0, y: 1},
    {x: groupedData[0].t, y: 1}
  ];

  for (let i = 0; i < groupedData.length - 1; i += 1) {
    plotData.push(
      {x: groupedData[i].t, y: groupedData[i].prob},
      {x: groupedData[i + 1].t, y: groupedData[i].prob}
    );
  }

  plotData.push({x: groupedData[groupedData.length - 1].t, y: groupedData[groupedData.length - 1].prob});

  const dataTimes = filtered.map((datum) => datum.AVAL).sort(d3.ascending);
  const finalT = dataTimes[dataTimes.length - 1];
  const timesFromGroupedData = plotData.map((datum) => datum.x);
  const finalY = plotData[plotData.length - 1].y;

  if (finalT != null && !timesFromGroupedData.includes(finalT)) {
    plotData.push({x: finalT, y: finalY});
  }

  return plotData;
}

function funPlotDataForTicks(groupedData, filtered) {
  const censoredEventTimes = filtered
    .slice()
    .sort((a, b) => d3.ascending(a.AVAL, b.AVAL))
    .filter((d) => d.CNSR === 1)
    .map((d) => d.AVAL);
  const plotData = [];

  for (const censoredEventTime of censoredEventTimes) {
    let y = 1;
    for (let i = 0; i < groupedData.length; i += 1) {
      if (groupedData[i].t < censoredEventTime) y = groupedData[i].prob;
    }
    plotData.push({x: censoredEventTime, y, text: "+"});
  }

  return plotData;
}

function genObj() {
  const data_10_20 = joinedData.filter((d) => d.FLG1 === "No" && d.BMI > FLG2_cutoff);
  const data_11_20 = joinedData.filter((d) => d.FLG1 === "Yes" && d.BMI > FLG2_cutoff);
  const data_10_21 = joinedData.filter((d) => d.FLG1 === "No" && d.BMI <= FLG2_cutoff);
  const data_11_21 = joinedData.filter((d) => d.FLG1 === "Yes" && d.BMI <= FLG2_cutoff);

  const data_10_20Filtered = joinedDataFiltered.filter((d) => d.FLG1 === "No" && d.BMI > FLG2_cutoff);
  const data_11_20Filtered = joinedDataFiltered.filter((d) => d.FLG1 === "Yes" && d.BMI > FLG2_cutoff);
  const data_10_21Filtered = joinedDataFiltered.filter((d) => d.FLG1 === "No" && d.BMI <= FLG2_cutoff);
  const data_11_21Filtered = joinedDataFiltered.filter((d) => d.FLG1 === "Yes" && d.BMI <= FLG2_cutoff);

  const groupedData = funGroupedData(ADTTE, adtteFiltered);
  const groupedData_10_20 = funGroupedData(data_10_20, data_10_20Filtered);
  const groupedData_11_20 = funGroupedData(data_11_20, data_11_20Filtered);
  const groupedData_10_21 = funGroupedData(data_10_21, data_10_21Filtered);
  const groupedData_11_21 = funGroupedData(data_11_21, data_11_21Filtered);

  return {
    data_10_20,
    data_11_20,
    data_10_21,
    data_11_21,
    data_10_20Filtered,
    data_11_20Filtered,
    data_10_21Filtered,
    data_11_21Filtered,
    groupedData,
    groupedData_10_20,
    groupedData_11_20,
    groupedData_10_21,
    groupedData_11_21,
    plotDataForLine: funPlotDataForLine(groupedData, adtteFiltered),
    plotDataForLine_10_20: funPlotDataForLine(groupedData_10_20, data_10_20Filtered),
    plotDataForLine_11_20: funPlotDataForLine(groupedData_11_20, data_11_20Filtered),
    plotDataForLine_10_21: funPlotDataForLine(groupedData_10_21, data_10_21Filtered),
    plotDataForLine_11_21: funPlotDataForLine(groupedData_11_21, data_11_21Filtered),
    plotDataForTicks: funPlotDataForTicks(groupedData, adtteFiltered),
    plotDataForTicks_10_20: funPlotDataForTicks(groupedData_10_20, data_10_20Filtered),
    plotDataForTicks_11_20: funPlotDataForTicks(groupedData_11_20, data_11_20Filtered),
    plotDataForTicks_10_21: funPlotDataForTicks(groupedData_10_21, data_10_21Filtered),
    plotDataForTicks_11_21: funPlotDataForTicks(groupedData_11_21, data_11_21Filtered)
  };
}

const obj = genObj();

function getMedian(data) {
  const dataFiltered = data.slice().filter((d) => d.t <= month);
  const belowMedian = dataFiltered.filter((d) => d.prob < 0.5);
  const median = belowMedian.length === 0 ? "NA" : belowMedian.sort((a, b) => a.t - b.t)[0].t;
  const hrMedian = belowMedian.length === 0
    ? (dataFiltered.length === 0 ? 1 : d3.max(dataFiltered, (d) => d.t))
    : belowMedian.sort((a, b) => a.t - b.t)[0].t;
  return {median, hrMedian};
}

function pick(objMap, keys) {
  return Object.keys(objMap)
    .filter((k) => keys.includes(k))
    .reduce((res, k) => Object.assign(res, {[k]: objMap[k]}), {});
}

function dict() {
  const flagOptions = [
    `FLG1=No & BMI > ${FLG2_cutoff}`,
    `FLG1=Yes & BMI > ${FLG2_cutoff}`,
    `FLG1=No & BMI ≤ ${FLG2_cutoff}`,
    `FLG1=Yes & BMI ≤ ${FLG2_cutoff}`
  ];
  const backing = ["groupedData_10_20", "groupedData_11_20", "groupedData_10_21", "groupedData_11_21"];
  const result = {};
  flagOptions.forEach((d, i) => {
    result[d] = backing[i];
  });
  return result;
}

function median_hr() {
  const ref = getMedian(obj.groupedData).median;
  const refhr = getMedian(obj.groupedData).hrMedian;
  const medians = [ref];
  const medianHRs = [refhr];

  Object.values(pick(dict(), Flags)).forEach((d) => {
    medians.push(getMedian(obj[d]).median);
    medianHRs.push(getMedian(obj[d]).hrMedian);
  });

  const hazardRatios = [];
  medians.slice(1).forEach((d) => {
    hazardRatios.push(ref === "NA" || d === "NA" ? "NA" : (ref / d).toFixed(2));
  });

  const hrValues = [];
  medianHRs.slice(1).forEach((d) => {
    hrValues.push((refhr / d).toFixed(2));
  });

  return {median: medians, HR: hrValues};
}
```

```js
function plot1() {
  const data = joinedData.map((d) => ({
    ...d,
    flag:
      d.FLG1 === "No" && d.BMI > FLG2_cutoff ? `FLG1=No & BMI > ${FLG2_cutoff}` :
      d.FLG1 === "Yes" && d.BMI > FLG2_cutoff ? `FLG1=Yes & BMI > ${FLG2_cutoff}` :
      d.FLG1 === "No" && d.BMI <= FLG2_cutoff ? `FLG1=No & BMI ≤ ${FLG2_cutoff}` :
      d.FLG1 === "Yes" && d.BMI <= FLG2_cutoff ? `FLG1=Yes & BMI ≤ ${FLG2_cutoff}` : "ALL"
  }));

  const minAVALID = data.sort((a, b) => a.AVAL - b.AVAL)[0].USUBJID;

  return Plot.plot({
    marginLeft: 10,
    marginRight: 10,
    height: data.length * 10,
    width: 400,
    y: {label: null, tickSize: 0, margin: 10, axis: null},
    x: {label: "Month →", grid: true, domain: [0, 24], ticks: 8},
    marks: [
      Plot.ruleY(data, {
        x: "AVAL",
        y: "USUBJID",
        stroke: (d) => Flags.includes(`FLG1=Yes & BMI ≤ ${FLG2_cutoff}`) && d.FLG1 === "Yes" && d.BMI <= FLG2_cutoff
          ? "#E14D2A"
          : Flags.includes(`FLG1=No & BMI > ${FLG2_cutoff}`) && d.FLG1 === "No" && d.BMI > FLG2_cutoff
          ? "#FD841F"
          : Flags.includes(`FLG1=Yes & BMI > ${FLG2_cutoff}`) && d.FLG1 === "Yes" && d.BMI > FLG2_cutoff
          ? "#3E6D9C"
          : Flags.includes(`FLG1=No & BMI ≤ ${FLG2_cutoff}`) && d.FLG1 === "No" && d.BMI <= FLG2_cutoff
          ? "#379237"
          : "#aaa",
        strokeWidth: 3,
        strokeDasharray: (d) => (d.CNSR === 1 ? [3, 3] : [0, 0]),
        sort: {y: "x"}
      }),
      Plot.dot(data.filter((d) => d.CNSR !== 1), {
        x: "AVAL",
        y: "USUBJID",
        fill: (d) => Flags.includes(`FLG1=Yes & BMI ≤ ${FLG2_cutoff}`) && d.FLG1 === "Yes" && d.BMI <= FLG2_cutoff
          ? "#E14D2A"
          : Flags.includes(`FLG1=No & BMI > ${FLG2_cutoff}`) && d.FLG1 === "No" && d.BMI > FLG2_cutoff
          ? "#FD841F"
          : Flags.includes(`FLG1=Yes & BMI > ${FLG2_cutoff}`) && d.FLG1 === "Yes" && d.BMI > FLG2_cutoff
          ? "#3E6D9C"
          : Flags.includes(`FLG1=No & BMI ≤ ${FLG2_cutoff}`) && d.FLG1 === "No" && d.BMI <= FLG2_cutoff
          ? "#379237"
          : "#aaa",
        r: 3
      }),
      Plot.text(data, {
        x: "AVAL",
        y: "USUBJID",
        text: (d) => (d.CNSR === 1 ? "X" : ""),
        fill: "black",
        fontWeight: "bold",
        fontSize: 10
      }),
      Plot.text([[19, minAVALID]], {
        text: ["X Censoring"],
        fill: "#666",
        fontWeight: "bold",
        textAnchor: "start",
        fontSize: 12
      }),
      Plot.text([[19, minAVALID]], {
        text: ["● Event"],
        dy: 10,
        fill: "#666",
        fontWeight: "bold",
        textAnchor: "start",
        fontSize: 12
      }),
      Plot.ruleX([0, 24]),
      Plot.ruleX([month], {stroke: "#333", strokeDasharray: [3, 3]})
    ]
  });
}

function plot2() {
  return Plot.plot({
    marginLeft: 30,
    marginRight: 20,
    height: ADTTE.length * 10,
    width: 700,
    y: {label: "↑ Probability of event free beyond time T", margin: 10, domain: [0, 1]},
    x: {label: "Month →", grid: true, domain: [0, 24], ticks: 8},
    marks: [
      Plot.ruleX([month], {stroke: "#333", strokeDasharray: [3, 3]}),
      Plot.ruleY([0.5], {stroke: "#333", strokeDasharray: [3, 3]}),
      Plot.line(obj.plotDataForLine, {x: "x", y: "y", stroke: "#aaa"}),
      Plot.text(obj.plotDataForTicks, {x: "x", y: "y", text: "text", fontSize: 24, dy: -1, fill: "blue"}),
      Plot.line(obj.plotDataForLine_11_21, {x: "x", y: "y", stroke: Flags.includes(`FLG1=Yes & BMI ≤ ${FLG2_cutoff}`) ? "#E14D2A" : null}),
      Plot.text(obj.plotDataForTicks_11_21, {x: "x", y: "y", text: "text", fontSize: 24, dy: -1, fill: Flags.includes(`FLG1=Yes & BMI ≤ ${FLG2_cutoff}`) ? "blue" : null}),
      Plot.line(obj.plotDataForLine_10_20, {x: "x", y: "y", stroke: Flags.includes(`FLG1=No & BMI > ${FLG2_cutoff}`) ? "#FD841F" : null}),
      Plot.text(obj.plotDataForTicks_10_20, {x: "x", y: "y", text: "text", fontSize: 24, dy: -1, fill: Flags.includes(`FLG1=No & BMI > ${FLG2_cutoff}`) ? "blue" : null}),
      Plot.line(obj.plotDataForLine_11_20, {x: "x", y: "y", stroke: Flags.includes(`FLG1=Yes & BMI > ${FLG2_cutoff}`) ? "#3E6D9C" : null}),
      Plot.text(obj.plotDataForTicks_11_20, {x: "x", y: "y", text: "text", fontSize: 24, dy: -1, fill: Flags.includes(`FLG1=Yes & BMI > ${FLG2_cutoff}`) ? "blue" : null}),
      Plot.line(obj.plotDataForLine_10_21, {x: "x", y: "y", stroke: Flags.includes(`FLG1=No & BMI ≤ ${FLG2_cutoff}`) ? "#379237" : null}),
      Plot.text(obj.plotDataForTicks_10_21, {x: "x", y: "y", text: "text", fontSize: 24, dy: -1, fill: Flags.includes(`FLG1=No & BMI ≤ ${FLG2_cutoff}`) ? "blue" : null})
    ]
  });
}

const plot_comb = html`
<div style="overflow-x:auto">
  <div style="display:flex; flex-direction:column;">
    <div style="display:flex; position:relative; top:0px;">
      ${[plot2(), plot1()]}
    </div>
  </div>
</div>`;
```

```js
display(plot_comb)
```

<br>

**Number of subjects still at risk**

```js
function table2() {
  const table = d3.create("table").attr("id", "table2");
  const tbody = table.append("tbody");

  const addRow = (row, styles = {}) => {
    tbody.append("tr")
      .selectAll("td")
      .data(row)
      .join("td")
      .text((d) => d)
      .style("text-align", "center")
      .style("color", styles.color ?? null)
      .style("display", styles.display ?? null);
  };

  addRow(["Month", ...d3.range(0, month + 1)]);
  addRow(["ITT (Reference)", ...showAllNumbers(ADTTE)].filter((d, i) => i - 1 <= month), {color: "#aaa"});
  addRow([`FLG1=No & BMI > ${FLG2_cutoff}`, ...showAllNumbers(obj.data_10_20)].filter((d, i) => i - 1 <= month), {display: Flags.includes(`FLG1=No & BMI > ${FLG2_cutoff}`) ? null : "none", color: "#FD841F"});
  addRow([`FLG1=Yes & BMI > ${FLG2_cutoff}`, ...showAllNumbers(obj.data_11_20)].filter((d, i) => i - 1 <= month), {display: Flags.includes(`FLG1=Yes & BMI > ${FLG2_cutoff}`) ? null : "none", color: "#3E6D9C"});
  addRow([`FLG1=No & BMI ≤ ${FLG2_cutoff}`, ...showAllNumbers(obj.data_10_21)].filter((d, i) => i - 1 <= month), {display: Flags.includes(`FLG1=No & BMI ≤ ${FLG2_cutoff}`) ? null : "none", color: "#379237"});
  addRow([`FLG1=Yes & BMI ≤ ${FLG2_cutoff}`, ...showAllNumbers(obj.data_11_21)].filter((d, i) => i - 1 <= month), {display: Flags.includes(`FLG1=Yes & BMI ≤ ${FLG2_cutoff}`) ? null : "none", color: "#E14D2A"});

  return table.node();
}

display(table2())
```

```js
function showNumbers(adtte, data_11_21, data_10_20, data_11_20, data_10_21, currentMonth) {
  function statsFor(data) {
    const c0 = data.filter((d) => d.AVAL <= currentMonth).filter((d) => d.CNSR === 0);
    const c1 = data.filter((d) => d.AVAL <= currentMonth).filter((d) => d.CNSR === 1);
    const c0N = c0.length;
    const c1N = c1.length;
    const sn = data.length - c0N - c1N;
    const st = ((data.length - c0N - c1N) / (data.length - c1N)).toFixed(3);
    return {c0, c1, c0N, c1N, sn, st, enrollment: data.length};
  }

  return {
    ref: statsFor(adtte),
    stat_11_21: statsFor(data_11_21),
    stat_10_20: statsFor(data_10_20),
    stat_11_20: statsFor(data_11_20),
    stat_10_21: statsFor(data_10_21)
  };
}

const objNumbers = showNumbers(ADTTE, obj.data_11_21, obj.data_10_20, obj.data_11_20, obj.data_10_21, month);
```

<br>

**Median and Hazard Ratio**

```js
function table4() {
  const activeFlags = Object.keys(pick(dict(), Flags));
  const colors = {
    [`FLG1=No & BMI > ${FLG2_cutoff}`]: "#FD841F",
    [`FLG1=Yes & BMI > ${FLG2_cutoff}`]: "#3E6D9C",
    [`FLG1=No & BMI ≤ ${FLG2_cutoff}`]: "#379237",
    [`FLG1=Yes & BMI ≤ ${FLG2_cutoff}`]: "#E14D2A"
  };
  const stats = median_hr();
  const columns = [
    {label: "", color: null},
    {label: "ITT (Reference)", color: "#aaa"},
    ...activeFlags.map((flag) => ({label: flag, color: colors[flag] ?? null}))
  ];
  const rows = [
    ["Median", ...stats.median],
    ["Hazard Ratio", "-", ...stats.HR]
  ];
  const gridTemplateColumns = `22% repeat(${columns.length - 1}, minmax(150px, 1fr))`;

  return html`<div class="eff-table4">
    <div class="eff-table4-grid eff-table4-head" style=${`grid-template-columns:${gridTemplateColumns};`}>
      ${columns.map((column) => html`<div class="eff-cell eff-head-cell" style=${column.color ? `color:${column.color};` : ""}>${column.label}</div>`)}
    </div>
    ${rows.map((row) => html`<div class="eff-table4-grid eff-table4-row" style=${`grid-template-columns:${gridTemplateColumns};`}>
      ${row.map((value, index) => html`<div class="eff-cell ${index === 0 ? "eff-row-label" : ""}">${value}</div>`)}
    </div>`)}
  </div>`;
}

display(table4())
```

<br>

**Event and Censored**

```js
function table3() {
  const activeRows = [
    {
      label: "ITT (Reference)",
      color: "#aaa",
      values: [
        objNumbers.ref.c0N,
        objNumbers.ref.c0.map((d) => d.USUBJID.replace("Subject_", "")).join(", "),
        objNumbers.ref.c1N,
        objNumbers.ref.c1.map((d) => d.USUBJID.replace("Subject_", "")).join(", ")
      ]
    },
    ...(Flags.includes(`FLG1=No & BMI > ${FLG2_cutoff}`) ? [{
      label: `FLG1=No & BMI > ${FLG2_cutoff}`,
      color: "#FD841F",
      values: [
        objNumbers.stat_10_20.c0N,
        objNumbers.stat_10_20.c0.map((d) => d.USUBJID.replace("Subject_", "")).join(", "),
        objNumbers.stat_10_20.c1N,
        objNumbers.stat_10_20.c1.map((d) => d.USUBJID.replace("Subject_", "")).join(", ")
      ]
    }] : []),
    ...(Flags.includes(`FLG1=Yes & BMI > ${FLG2_cutoff}`) ? [{
      label: `FLG1=Yes & BMI > ${FLG2_cutoff}`,
      color: "#3E6D9C",
      values: [
        objNumbers.stat_11_20.c0N,
        objNumbers.stat_11_20.c0.map((d) => d.USUBJID.replace("Subject_", "")).join(", "),
        objNumbers.stat_11_20.c1N,
        objNumbers.stat_11_20.c1.map((d) => d.USUBJID.replace("Subject_", "")).join(", ")
      ]
    }] : []),
    ...(Flags.includes(`FLG1=No & BMI ≤ ${FLG2_cutoff}`) ? [{
      label: `FLG1=No & BMI ≤ ${FLG2_cutoff}`,
      color: "#379237",
      values: [
        objNumbers.stat_10_21.c0N,
        objNumbers.stat_10_21.c0.map((d) => d.USUBJID.replace("Subject_", "")).join(", "),
        objNumbers.stat_10_21.c1N,
        objNumbers.stat_10_21.c1.map((d) => d.USUBJID.replace("Subject_", "")).join(", ")
      ]
    }] : []),
    ...(Flags.includes(`FLG1=Yes & BMI ≤ ${FLG2_cutoff}`) ? [{
      label: `FLG1=Yes & BMI ≤ ${FLG2_cutoff}`,
      color: "#E14D2A",
      values: [
        objNumbers.stat_11_21.c0N,
        objNumbers.stat_11_21.c0.map((d) => d.USUBJID.replace("Subject_", "")).join(", "),
        objNumbers.stat_11_21.c1N,
        objNumbers.stat_11_21.c1.map((d) => d.USUBJID.replace("Subject_", "")).join(", ")
      ]
    }] : [])
  ];
  const headers = ["", "Number of Events", "Event Subjects", "Number of Censored", "Censored Subjects"];
  const gridTemplateColumns = "18% 10% 34% 10% 28%";

  return html`<div class="eff-table3">
    <div class="eff-table3-grid eff-table3-head" style=${`grid-template-columns:${gridTemplateColumns};`}>
      ${headers.map((header, index) => html`<div class="eff-cell eff-head-cell ${index === 0 ? "eff-row-label" : ""}">${header}</div>`)}
    </div>
    ${activeRows.map((row) => html`<div class="eff-table3-grid eff-table3-row" style=${`grid-template-columns:${gridTemplateColumns}; color:${row.color};`}>
      <div class="eff-cell eff-row-label">${row.label}</div>
      <div class="eff-cell eff-number-cell">${row.values[0]}</div>
      <div class="eff-cell eff-list-cell">${row.values[1]}</div>
      <div class="eff-cell eff-number-cell">${row.values[2]}</div>
      <div class="eff-cell eff-list-cell">${row.values[3]}</div>
    </div>`)}
  </div>`;
}

display(table3())
```

<br>

---

# **Objective Response Rate (ORR)**

> The bar chart displays the ORR results for each subgroup based on The Response Evaluation Criteria in Solid Tumors (RECIST), including Complete Response (CR), Partial Response (PR), Stable Disease (SD), Progressive Disease (PD), and Not Evaluable (NE). The chart also presents the count and rate of ORR, calculated as the sum of complete and partial responses.

<div class="hl">

> Since the chart is dynamic, it can be applied to any subgroup analysis, providing flexibility for both the biometrics and clinical development teams to efficiently explore and interpret data across different patient populations..

</div>

```js
function dataLong() {
  const data = joinedData.map((d) => ({
    ...d,
    GROUP:
      d.FLG1 === "No" && d.BMI > FLG2_cutoff ? `FLG1=No & BMI > ${FLG2_cutoff}` :
      d.FLG1 === "Yes" && d.BMI > FLG2_cutoff ? `FLG1=Yes & BMI > ${FLG2_cutoff}` :
      d.FLG1 === "No" && d.BMI <= FLG2_cutoff ? `FLG1=No & BMI ≤ ${FLG2_cutoff}` :
      d.FLG1 === "Yes" && d.BMI <= FLG2_cutoff ? `FLG1=Yes & BMI ≤ ${FLG2_cutoff}` : "Other"
  }));

  const data1 = aq.from(data)
    .groupby(["GROUP", "AVALC"])
    .rollup({numRS: aq.op.count()})
    .join(
      aq.from(data)
        .groupby(["GROUP"])
        .rollup({numGrp: aq.op.count()}),
      ["GROUP", "GROUP"]
    )
    .orderby([aq.desc("GROUP"), "AVALC"])
    .objects();

  const data2 = aq.from(data1.filter((d) => ["CR", "PR"].includes(d.AVALC)))
    .groupby(["GROUP"])
    .derive({numORR: aq.op.sum("numRS")})
    .objects()
    .map((d) => ({...d, rateORR: (d.numORR / d.numGrp).toFixed(2)}));

  return _.uniqWith(
    aq.from(data1)
      .join(aq.from(data2).select(["GROUP", "numORR", "rateORR"]), ["GROUP", "GROUP"])
      .objects(),
    _.isEqual
  );
}

function plot3() {
  const long = dataLong();
  return Plot.plot({
    height: 500,
    width: 700,
    x: {axis: null, domain: ["CR", "PR", "SD", "PD", "NE"]},
    y: {
      grid: true,
      domain: [0, d3.max(long, (d) => d.numORR) + Math.floor(storedAdslInputs.enrollment * 0.04)],
      label: "↑ Response"
    },
    color: {
      domain: ["CR", "PR", "SD", "PD", "NE"],
      range: ["#59a14f", "#4e79a7", "#76b7b2", "#e15759", "#f28e2c"],
      legend: true
    },
    fx: {
      domain: d3.groupSort(long, (v) => d3.sum(v, (d) => -d.numGrp), (d) => d.GROUP),
      label: null
    },
    marks: [
      Plot.barY(long, {x: "AVALC", y: "numRS", fill: "AVALC", title: "AVALC", opacity: 0.8, fx: "GROUP"}),
      Plot.text(long, {x: "AVALC", y: "numRS", text: (d) => `${d.numRS}/${d.numGrp}`, dy: -6, fill: "#333", fx: "GROUP"}),
      Plot.ruleX(long, {x: "AVALC", y: (d) => (d.AVALC === "PR" ? d.numORR : 0), dx: 14, stroke: "#999", fx: "GROUP"}),
      Plot.ruleX(long, {x: "AVALC", y: (d) => (d.AVALC === "CR" ? d.numORR : 0), dx: -15, stroke: "#999", fx: "GROUP"}),
      Plot.text(long, {x: (d) => (d.AVALC === "PR" ? d.AVALC : null), y: (d) => (d.AVALC === "PR" ? d.numORR + 1.5 : 0), dx: 10, dy: -4, fill: "#333", text: (d) => `ORR = ${d.rateORR}`, textAnchor: "end", fx: "GROUP"}),
      Plot.text(long, {x: (d) => (d.AVALC === "PR" ? d.AVALC : null), y: (d) => (d.AVALC === "PR" ? d.numORR + 0.9 : 0), dx: 2, dy: 2, fill: "#333", text: (d) => `(${d.numORR} / ${d.numGrp})`, textAnchor: "end", fx: "GROUP"}),
      Plot.ruleY([0])
    ]
  });
}

display(plot3())
```

---

# Two More Simulated ADaM Datasets

<br>

### ADTTE

```js
ADTTE
```

- **USUBJID**: dynamic ITT with default sample size = ${storedAdslInputs.enrollment}
- **AVAL**: integer samples from a uniform distribution `1 ≤ x ≤ 24`
- **CNSR**: samples from a binomial distribution `(n = 1, p = 0.2)`
- **PARAMCD**: flag for endpoint

```js
Inputs.table(ADTTE)
```

```js
SummaryTable(ADTTE, {label: "ADTTE"})
```

<br>

### ADRS

- **USUBJID**: dynamic ITT with default sample size = ${storedAdslInputs.enrollment}
- **AVALC**: `"SD", "CR", "PR", "PD", "NE"` simulated by using multinomial distribution with `prob = [0.2, 0.4, 0.2, 0.1, 0.1]`
- **PARAMCD**: flag for response criteria

```js
ADRS
```

```js
Inputs.table(ADRS)
```

```js
SummaryTable(ADRS, {label: "ADRS"})
```

<style>
.hl blockquote {
  padding: 1em;
  border-left: 5px solid #1E4865;
}

.summaryTable td:first-child {
  text-align: left;
}

th, tr, td {
  text-align: center;
}

#table2 {
  width: min(960px, 100%);
  border-collapse: collapse;
  margin: 0 0 24px;
}

#table2 td {
  padding: 8px 14px;
  vertical-align: middle;
}

#table2 td {
  white-space: nowrap;
}

#table2 td:first-child {
  text-align: left;
}

.eff-table3,
.eff-table4 {
  width: min(960px, 100%);
  margin: 0 0 28px;
  font: inherit;
}

.eff-table3-grid,
.eff-table4-grid {
  display: grid;
  align-items: center;
  width: 100%;
}

.eff-table3-head,
.eff-table4-head,
.eff-table3-row,
.eff-table4-row {
  border-bottom: 1px solid #d9d9d9;
}

.eff-cell {
  padding: 8px 14px;
  text-align: center;
  line-height: 1.15;
}

.eff-head-cell {
  font-weight: 600;
}

.eff-row-label {
  text-align: left;
}

.eff-number-cell {
  white-space: nowrap;
}

.eff-list-cell {
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
  line-height: 1.18;
}

span[style*="rotate(90deg)"] {
  display: none !important;
}
</style>

```js
display(renderPagePager("/Efficacy-Analyses"));
```
