---
title: Descriptive Statistics
---

```js
import * as d3 from "npm:d3";
import {html} from "npm:htl";
import {buildDemoDataFlowNote, isValidMasterData, loadStoredValue} from "./components/demoData.js";
import {renderPagePager} from "./components/pagePager.js";
```

```js
const seededMasterData = await FileAttachment("./data/demo/masterData.json").json();
const storedMasterDataState = loadStoredValue("masterData", seededMasterData);
const storedMasterData = isValidMasterData(storedMasterDataState.value) ? storedMasterDataState.value : seededMasterData;
```

```js
display(html`<p><small>${buildDemoDataFlowNote([
  {label: "Master dataset", source: storedMasterDataState.source}
])}</small></p>`)
```

```js
function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function deviation(values) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function confidence95(values) {
  if (!values.length) return {lower: null, upper: null};
  const avg = mean(values);
  const sd = deviation(values);
  const margin = 1.96 * (sd / Math.sqrt(values.length || 1));
  return {lower: avg - margin, upper: avg + margin};
}

function erf(x) {
  const sign = Math.sign(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const absX = Math.abs(x);
  const t = 1 / (1 + p * absX);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

function cdf(x) {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

function approxPValue(values) {
  if (!values.length) return null;
  const avg = mean(values);
  const sd = deviation(values);
  if (!Number.isFinite(avg) || !Number.isFinite(sd) || sd === 0) return 1;
  const z = Math.abs(avg / (sd / Math.sqrt(values.length)));
  return 2 * (1 - cdf(z));
}

function pLabel(values) {
  const p = approxPValue(values);
  if (p == null) return "P = n/a";
  return p < 0.001 ? "P < 0.001" : `P = ${Math.round(p * 1000) / 1000}`;
}

function epanechnikov(bandwidth) {
  return (x) => Math.abs((x /= bandwidth)) <= 1 ? (0.75 * (1 - x * x)) / bandwidth : 0;
}

function kde(kernel, thresholds) {
  return (values) => thresholds.map((t) => [t, d3.mean(values, (d) => kernel(t - d)) || 0]);
}

function genViolin(data, visits) {
  const width = 400;
  const height = 400;
  const margin = {left: 40, bottom: 40, right: 20, top: 20};
  const svg = d3.create("svg").attr("width", width).attr("height", height);

  const x = d3.scaleBand()
    .domain([...new Set(data.map((d) => d.VISIT))])
    .range([margin.left, width - margin.right])
    .padding(0.05);

  const y = d3.scaleLinear()
    .domain([d3.min(data, (d) => d.VAL), d3.max(data, (d) => d.VAL)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const colors = d3.scaleOrdinal()
    .domain(visits)
    .range(["#9bc1bc", "#e07a5f", "#3d405b", "#81b29a", "#5a7da0"]);

  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickSizeOuter(0));

  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y));

  const thresholds = y.ticks(40);
  const density = kde(epanechnikov(12), thresholds);
  const violins = d3.rollup(
    data,
    (values) => {
      const nums = values.map((d) => d.VAL);
      const interval = confidence95(nums);
      return {
        f: density(nums),
        m: d3.mean(nums),
        u: interval.upper,
        l: interval.lower
      };
    },
    (d) => d.VISIT
  );

  let allNum = [];
  for (const value of violins.values()) allNum = allNum.concat(value.f.map((d) => d[1]));
  const maxDensity = d3.max(allNum) || 1;
  const xNum = d3.scaleLinear().domain([-maxDensity, maxDensity]).range([0, x.bandwidth()]);
  const area = d3.area()
    .x0((d) => xNum(-d[1]))
    .x1((d) => xNum(d[1]))
    .y((d) => y(d[0]))
    .curve(d3.curveNatural);

  const group = svg.append("g")
    .selectAll("g")
    .data([...violins])
    .join("g")
    .attr("transform", (d) => `translate(${x(d[0])}, 0)`);

  group.append("path")
    .style("fill", (d) => colors(d[0]))
    .datum((d) => d[1].f)
    .style("stroke", "none")
    .attr("d", area);

  group.append("circle")
    .attr("cx", xNum(0))
    .attr("cy", (d) => y(d[1].m))
    .attr("r", 6)
    .style("fill", "#fff");

  group.append("text")
    .attr("x", xNum(0))
    .attr("dx", 10)
    .attr("dy", 10)
    .attr("y", (d) => y(d[1].m))
    .text((d) => Math.round(d[1].m))
    .style("fill", "#fff")
    .style("font-size", "26px")
    .style("font-weight", "bold");

  group.append("line")
    .attr("x1", xNum(-maxDensity))
    .attr("x2", xNum(maxDensity))
    .attr("y1", (d) => y(d[1].u))
    .attr("y2", (d) => y(d[1].u))
    .style("stroke", "#fff")
    .style("stroke-width", 4);

  group.append("text")
    .attr("x", xNum(0))
    .attr("dx", -10)
    .attr("dy", -10)
    .attr("y", (d) => y(d[1].u))
    .text((d) => Math.round(d[1].u))
    .style("fill", "#fff")
    .style("font-size", "26px")
    .style("font-weight", "bold");

  group.append("line")
    .attr("x1", xNum(-maxDensity))
    .attr("x2", xNum(maxDensity))
    .attr("y1", (d) => y(d[1].l))
    .attr("y2", (d) => y(d[1].l))
    .style("stroke", "#fff")
    .style("stroke-width", 4);

  group.append("text")
    .attr("x", xNum(0))
    .attr("dx", -10)
    .attr("dy", 30)
    .attr("y", (d) => y(d[1].l))
    .text((d) => Math.round(d[1].l))
    .style("fill", "#fff")
    .style("font-size", "26px")
    .style("font-weight", "bold");

  group.append("line")
    .attr("x1", xNum(0))
    .attr("x2", xNum(0))
    .attr("y1", (d) => y(d[1].u))
    .attr("y2", (d) => y(d[1].l))
    .style("stroke", "#fff")
    .style("stroke-width", 4);

  return svg.node();
}
```

```js
const endpointsVisits = Object.keys(storedMasterData[0] || {}).filter((d) => d.includes("Visit"));
const endpoints = [...new Set(endpointsVisits.map((d) => d.split("_")[0]))];
const visits = [...new Set(endpointsVisits.map((d) => d.split("_")[1]))].filter((d) => !d.includes("CHG"));
```

# Descriptive Statistics  
(Total Cohort vs Subgroups)

<br>

> The Visualization section offers interactive tools designed to enhance the understanding of clinical trial results through graphical representation. These dynamic visualizations support descriptive statistics, comparative analyses, and efficacy evaluations, making it easier to communicate complex data insights effectively.

---

# Summary Table

```js
const endpointSelected = view(Inputs.select(endpoints, {value: "Endpoint1", label: "Select Endpoint:"}));
```

```js
const subgroupSelected = view(Inputs.select(["SITE", "SEX", "RACE", "FLG1", "TRTEMFL"], {value: "SITE", label: "Select Subgroup:"}));
```

```js
const subgroupValues = subgroupSelected === "SITE"
  ? ["Site_1", "Site_2", "Site_3", "Site_4"]
  : [...new Set(storedMasterData.map((d) => d[subgroupSelected]).filter((d) => d != null && d !== ""))].sort();
```

```js
const subgroupValueSelected = view(Inputs.select(["All", ...subgroupValues], {value: "All", label: "Select Group Value:"}));
```

```js
const curSubgrpCat = [
  "Total Cohort",
  ...(subgroupValueSelected === "All" ? subgroupValues : [subgroupValueSelected])
];
```

```js
for (const subgroup of curSubgrpCat) {
  const rows = [];
  const curData = storedMasterData.filter((d) => (subgroup === "Total Cohort" ? true : d[subgroupSelected] === subgroup));
  const cohort = subgroup === "Total Cohort" ? subgroup : `${subgroupSelected} = ${subgroup}`;

  for (const visit of visits) {
    const curArr = curData.map((d) => d[`${endpointSelected}_${visit}`]).filter((d) => d != null);
    rows.push({
      VISIT: visit,
      N: curArr.length,
      MEAN: curArr.length ? Math.round(d3.mean(curArr) * 10) / 10 : null,
      SD: curArr.length ? Math.round((d3.deviation(curArr) || 0) * 10) / 10 : null,
      MEDIAN: curArr.length ? Math.round(d3.median(curArr) * 10) / 10 : null,
      MIN: curArr.length ? Math.round(d3.min(curArr) * 10) / 10 : null,
      MAX: curArr.length ? Math.round(d3.max(curArr) * 10) / 10 : null
    });
  }

  display(html`<hr><h5>${cohort}</h5>`);
  display(Inputs.table(rows));
}
```

---

# Distribution

> **Violin plots** features of both box plots and density traces, allowing you to visualize the distribution of continuous variables across different groups. It is especially useful for analyzing the spread and central tendency of key outcomes like patient biomarkers, treatment responses, or lab measurements. This tool helps identify differences in distributions and potential outliers.

> The plots below demostrate the distributions of total cohort and subgroups. The mean change and 95% CI of V1/V2 vs Baseline are also presented.

```js
for (const subgroup of curSubgrpCat) {
  const title = subgroup === "Total Cohort" ? subgroup : `${subgroupSelected} = ${subgroup}`;
  display(html`<hr><div style="flex:100%"><b><small>${title}</small></b></div>`);

  const container = document.createElement("div");
  container.className = "grid grid-cols-2";

  for (const visit of visits.slice(1)) {
    const curEndpoint = `${endpointSelected}_${visit}`;
    const curEndpointBaseline = `${endpointSelected}_${visits[0]}`;
    const curEndpointChange = `${endpointSelected}_${visit}_CHG`;
    const curEndpointDataSubgrp = subgroup === "Total Cohort"
      ? storedMasterData.filter((d) => d[curEndpointChange] != null)
      : storedMasterData.filter((d) => d[curEndpointChange] != null && d[subgroupSelected] === subgroup);

    const violinRows = [];
    curEndpointDataSubgrp.forEach((row) => {
      violinRows.push({SUBJID: row.USUBJID, VISIT: visits[0], VAL: row[curEndpointBaseline]});
    });
    curEndpointDataSubgrp.forEach((row) => {
      violinRows.push({SUBJID: row.USUBJID, VISIT: visit, VAL: row[curEndpoint]});
    });

    const changeValues = curEndpointDataSubgrp.map((d) => d[curEndpointChange]).filter((d) => d != null);
    const interval = confidence95(changeValues);

    const card = document.createElement("div");
    card.className = "card";
    card.style.padding = "0.75rem";
    card.style.marginBottom = "1rem";

    const center = document.createElement("center");
    const small = document.createElement("small");
    const nDiv = document.createElement("div");
    nDiv.textContent = `N = ${curEndpointDataSubgrp.length}`;
    const pDiv = document.createElement("div");
    pDiv.textContent = pLabel(changeValues);
    const ciDiv = document.createElement("div");
    ciDiv.innerHTML = `Mean Change 95% CI <br> ${Math.round((mean(changeValues) || 0) * 10) / 10} [${Math.round((interval.lower || 0) * 10) / 10}, ${Math.round((interval.upper || 0) * 10) / 10}]`;

    small.append(nDiv, pDiv);
    center.append(small);
    if (violinRows.length) center.append(genViolin(violinRows, visits));
    center.append(ciDiv);
    card.append(center);
    container.append(card);
  }

  display(container);
}
```

---

```js
display(renderPagePager("/Descriptive-Statistics"));
```
