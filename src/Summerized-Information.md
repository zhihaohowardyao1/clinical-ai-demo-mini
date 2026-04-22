---
title: Summarized Information
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

function formatResult(row) {
  if (row.mean == null || row.lower_CI == null || row.upper_CI == null) return "";
  return `${row.mean.toFixed(1)} [${row.lower_CI.toFixed(1)}, ${row.upper_CI.toFixed(1)}]`;
}
```

```js
const commonVars = Object.keys(storedMasterData[0] || {}).filter((d) => !d.toUpperCase().includes("VISIT"));
const chgVars = Object.keys(storedMasterData[0] || {}).filter((d) => d.toUpperCase().includes("CHG"));
const allVars = [...commonVars, ...chgVars];

const eps = [...new Set(chgVars.map((d) => d.split("_")[0]))];
const vsts = [...new Set(chgVars.map((d) => d.split("_")[1]))].sort();
const subgroups = ["All", "SITE", "SEX", "FLG1", "TRTEMFL"];

const forestData = [];
for (const ep of eps) {
  for (const visit of vsts) {
    for (const subgroup of subgroups) {
      const subgroupCats = subgroup === "All"
        ? ["All"]
        : [...new Set(storedMasterData.map((d) => d[subgroup]).filter((d) => d != null && d !== ""))].sort();

      subgroupCats.forEach((subgrpCat, index) => {
        const curData = storedMasterData
          .filter((d) => (subgrpCat === "All" ? true : d[subgroup] === subgrpCat))
          .filter((d) => d[`${ep}_${visit}_CHG`] != null);
        const curArr = curData.map((d) => d[`${ep}_${visit}_CHG`]);
        const interval = confidence95(curArr);

        forestData.push({
          endpoint: ep,
          visit,
          subgroup,
          category: subgrpCat,
          label: subgroup === "All" ? subgroup : `${subgroup}=${subgrpCat}`,
          n: curArr.length,
          mean: curArr.length ? Math.round(mean(curArr) * 10) / 10 : null,
          upper_CI: interval.upper == null ? null : Math.round(interval.upper * 10) / 10,
          lower_CI: interval.lower == null ? null : Math.round(interval.lower * 10) / 10,
          numInGroup: index + 1,
          maxInGroup: subgroupCats.length
        });
      });
    }
  }
}

const forestDataShow = forestData.map(({numInGroup, maxInGroup, ...rest}) => rest);
```

# Summarized Information
(Forest Plot)

> **Forest plot** is essential for meta-analyses, enabling the display of estimated treatment effects across different studies or subgroups. It clearly shows the variability of treatment effects, confidence intervals, and overall impact, allowing you to assess consistency across trials and interpret results from a broader body of evidence.

---

# Aggregation

> The data is summarized by:
>
> - Endpoint
> - Visit
> - Subgroup

```js
Inputs.table(forestDataShow)
```

---

# Forest Plot

```js
const endpointSelected = view(Inputs.select(eps, {value: "Endpoint1", label: "Select Endpoint"}));
```

```js
const visitA = view(Inputs.select(vsts, {value: vsts[0], label: "Visit A"}));
const visitBOptions = vsts.filter((d) => d !== visitA);
const visitB = view(Inputs.select(visitBOptions, {value: visitBOptions[0], label: "Visit B"}));
```

```js
{
  const subgroupOrder = ["All", "SITE", "SEX", "FLG1", "TRTEMFL"];
  const dataFiltered = forestData
    .filter((d) => d.endpoint === endpointSelected)
    .filter((d) => d.visit === visitA || d.visit === visitB)
    .filter((d) => subgroupOrder.includes(d.subgroup))
    .map((d) => ({
      ...d,
      result: formatResult(d)
    }));
  const leftVisit = visitA;
  const rightVisit = visitB;
  const buildDisplayRows = (visit) => {
    const visitRows = dataFiltered.filter((d) => d.visit === visit);
    const rows = [];
    for (const subgroup of subgroupOrder) {
      const subgroupRows = visitRows
        .filter((d) => d.subgroup === subgroup)
        .sort((a, b) => {
          if (a.label === "All") return -1;
          if (b.label === "All") return 1;
          return a.label.localeCompare(b.label);
        });
      for (const row of subgroupRows) rows.push(row);
      if (subgroupRows.length) {
        rows.push({
          ...subgroupRows[subgroupRows.length - 1],
          label: `${subgroup} placeholder`,
          result: "",
          n: "",
          mean: null,
          lower_CI: null,
          upper_CI: null,
          isPlaceholder: true
        });
      }
    }
    return rows;
  };

  const leftRows = buildDisplayRows(leftVisit);
  const rightRows = buildDisplayRows(rightVisit);
  const rowKeys = [];
  for (const row of [...leftRows, ...rightRows]) {
    if (!rowKeys.includes(row.label)) rowKeys.push(row.label);
  }

  const rowHeight = 32;
  const width = 1080;
  const topPad = 58;
  const chartOffsetY = 22;
  const headerGap = 24;
  const bottomPad = 45;
  const plotTop = topPad + chartOffsetY;
  const rowStartY = plotTop + headerGap;
  const rowCount = rowKeys.length;
  const plotBottom = rowStartY + Math.max(0, rowCount - 1) * rowHeight + 18;
  const height = Math.max(260, plotBottom + bottomPad);
  const leftResultX = 70;
  const leftNX = 155;
  const labelX = 510;
  const plotLeft1 = 180;
  const plotWidth = 200;
  const plotLeft2 = 640;
  const rightNX = 870;
  const rightResultX = 960;
  const allRows = dataFiltered.filter((d) => d.mean != null && d.lower_CI != null && d.upper_CI != null);
  const xMin = d3.min(allRows, (d) => Math.min(0, d.lower_CI)) ?? -1;
  const xMax = d3.max(allRows, (d) => Math.max(0, d.upper_CI)) ?? 1;
  const color = "#2c78ad";
  const bandFill = "#f4f1de";
  const refLine = "#748d5d";
  const colorScale = d3.scaleOrdinal().domain([leftVisit, rightVisit]).range(["#2274a5", "#1b4965"]);
  const rowLabels = rowKeys.filter((label) => !label.endsWith("placeholder"));
  const yFor = (label) => rowStartY + rowKeys.indexOf(label) * rowHeight;
  const x1 = d3.scaleLinear().domain([xMin, xMax]).nice().range([plotLeft1, plotLeft1 + plotWidth]);
  const x2 = d3.scaleLinear().domain([xMin, xMax]).nice().range([plotLeft2, plotLeft2 + plotWidth]);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${width} ${height}`).style("max-width", "100%");
  const leftAll = leftRows.find((d) => d.label === "All");
  const rightAll = rightRows.find((d) => d.label === "All");
  const subgroupClass = (subgroup) => `subgroup-${subgroup.toLowerCase()}`;
  const highlightColor = "#d95d39";

  const highlightSubgroup = (subgroup) => {
    svg.selectAll(`.${subgroupClass(subgroup)}`)
      .each(function() {
        const el = d3.select(this);
        const tag = this.tagName.toLowerCase();
        if (tag === "text") {
          el.attr("fill", highlightColor);
        } else if (tag === "circle") {
          el.attr("fill", highlightColor);
        } else {
          el.attr("stroke", highlightColor);
        }
      });
  };

  const resetSubgroup = (subgroup) => {
    svg.selectAll(`.${subgroupClass(subgroup)}`)
      .each(function(d) {
        const el = d3.select(this);
        const tag = this.tagName.toLowerCase();
        if (tag === "text") {
          el.attr("fill", el.attr("data-base-fill") || "black");
        } else if (tag === "circle") {
          el.attr("fill", el.attr("data-base-fill") || colorScale(d?.visit));
        } else {
          el.attr("stroke", el.attr("data-base-stroke") || colorScale(d?.visit));
        }
      });
  };

  const attachHover = (selection) => selection
    .on("mouseover", (_, d) => highlightSubgroup(d.subgroup))
    .on("mouseout", (_, d) => resetSubgroup(d.subgroup));

  svg.append("line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", plotTop)
    .attr("y2", plotTop)
    .attr("stroke", "black")
    .attr("stroke-width", 2);

  svg.append("line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", plotBottom)
    .attr("y2", plotBottom)
    .attr("stroke", "black")
    .attr("stroke-width", 2);

  svg.append("text")
    .attr("x", leftResultX)
    .attr("y", plotTop - 8)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("font-size", 16)
    .text("Mean [95% CI]");

  svg.append("text")
    .attr("x", leftNX)
    .attr("y", plotTop - 8)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("font-size", 16)
    .text("N");

  svg.append("text")
    .attr("x", plotLeft1 + plotWidth / 2)
    .attr("y", plotTop - 8)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("font-size", 16)
    .text(leftVisit);

  svg.append("text")
    .attr("x", labelX)
    .attr("y", plotTop - 28)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("font-size", 16)
    .text("Subgroups by");

  svg.append("text")
    .attr("x", labelX)
    .attr("y", plotTop - 8)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("font-size", 16)
    .text("Baseline Characteristics");

  svg.append("text")
    .attr("x", plotLeft2 + plotWidth / 2)
    .attr("y", plotTop - 8)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("font-size", 16)
    .text(rightVisit);

  svg.append("text")
    .attr("x", rightNX)
    .attr("y", plotTop - 8)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("font-size", 16)
    .text("N");

  svg.append("text")
    .attr("x", rightResultX)
    .attr("y", plotTop - 8)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("font-size", 16)
    .text("Mean [95% CI]");

  svg.append("g")
    .attr("transform", `translate(0, ${plotBottom})`)
    .call(d3.axisBottom(x1).ticks(5))
    .style("font", "13px sans-serif");

  svg.append("g")
    .attr("transform", `translate(0, ${plotBottom})`)
    .call(d3.axisBottom(x2).ticks(5))
    .style("font", "13px sans-serif");

  svg.append("line")
    .attr("x1", x1(0))
    .attr("x2", x1(0))
    .attr("y1", plotTop)
    .attr("y2", plotBottom)
    .attr("stroke", "#a8a8a8")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4 4");

  svg.append("line")
    .attr("x1", x2(0))
    .attr("x2", x2(0))
    .attr("y1", plotTop)
    .attr("y2", plotBottom)
    .attr("stroke", "#a8a8a8")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4 4");

  if (leftAll && leftAll.lower_CI != null && leftAll.upper_CI != null && leftAll.mean != null) {
    svg.append("rect")
      .attr("x", x1(leftAll.lower_CI))
      .attr("y", plotTop)
      .attr("width", Math.max(1, x1(leftAll.upper_CI) - x1(leftAll.lower_CI)))
      .attr("height", plotBottom - plotTop)
      .attr("fill", bandFill)
      .style("opacity", 0.5);

    svg.append("line")
      .attr("x1", x1(leftAll.mean))
      .attr("x2", x1(leftAll.mean))
      .attr("y1", plotTop)
      .attr("y2", plotBottom)
      .attr("stroke", refLine)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4 4");
  }

  if (rightAll && rightAll.lower_CI != null && rightAll.upper_CI != null && rightAll.mean != null) {
    svg.append("rect")
      .attr("x", x2(rightAll.lower_CI))
      .attr("y", plotTop)
      .attr("width", Math.max(1, x2(rightAll.upper_CI) - x2(rightAll.lower_CI)))
      .attr("height", plotBottom - plotTop)
      .attr("fill", bandFill)
      .style("opacity", 0.5);

    svg.append("line")
      .attr("x1", x2(rightAll.mean))
      .attr("x2", x2(rightAll.mean))
      .attr("y1", plotTop)
      .attr("y2", plotBottom)
      .attr("stroke", refLine)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4 4");
  }

  for (const row of leftRows) {
    if (row.isPlaceholder) continue;
    const y = yFor(row.label);

    if (row.mean != null && row.lower_CI != null && row.upper_CI != null) {
      attachHover(svg.append("line").datum(row))
        .attr("class", subgroupClass(row.subgroup))
        .attr("data-base-stroke", colorScale(row.visit))
        .attr("x1", x1(row.lower_CI))
        .attr("x2", x1(row.upper_CI))
        .attr("y1", y)
        .attr("y2", y)
        .attr("stroke", colorScale(row.visit))
        .attr("stroke-width", 2);

      attachHover(svg.append("line").datum(row))
        .attr("class", subgroupClass(row.subgroup))
        .attr("data-base-stroke", colorScale(row.visit))
        .attr("x1", x1(row.lower_CI))
        .attr("x2", x1(row.lower_CI))
        .attr("y1", y - rowHeight * 0.2)
        .attr("y2", y + rowHeight * 0.2)
        .attr("stroke", colorScale(row.visit))
        .attr("stroke-width", 2);

      attachHover(svg.append("line").datum(row))
        .attr("class", subgroupClass(row.subgroup))
        .attr("data-base-stroke", colorScale(row.visit))
        .attr("x1", x1(row.upper_CI))
        .attr("x2", x1(row.upper_CI))
        .attr("y1", y - rowHeight * 0.2)
        .attr("y2", y + rowHeight * 0.2)
        .attr("stroke", colorScale(row.visit))
        .attr("stroke-width", 2);

      attachHover(svg.append("circle").datum(row))
        .attr("class", subgroupClass(row.subgroup))
        .attr("data-base-fill", colorScale(row.visit))
        .attr("cx", x1(row.mean))
        .attr("cy", y)
        .attr("r", d3.scaleLinear().domain([0, d3.max(leftRows, (d) => d.n || 0)]).range([3, 7])(row.n || 0))
        .attr("fill", colorScale(row.visit));
    }

    attachHover(svg.append("text").datum(row))
      .attr("class", subgroupClass(row.subgroup))
      .attr("data-base-fill", "black")
      .attr("x", leftResultX)
      .attr("y", y)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "central")
      .attr("font-size", 13)
      .text(row.result);

    attachHover(svg.append("text").datum(row))
      .attr("class", subgroupClass(row.subgroup))
      .attr("data-base-fill", "black")
      .attr("x", leftNX)
      .attr("y", y)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "central")
      .attr("font-size", 13)
      .text(row.n);
  }

  for (const row of rightRows) {
    if (row.isPlaceholder) continue;
    const y = yFor(row.label);

    if (row.mean != null && row.lower_CI != null && row.upper_CI != null) {
      attachHover(svg.append("line").datum(row))
        .attr("class", subgroupClass(row.subgroup))
        .attr("data-base-stroke", colorScale(row.visit))
        .attr("x1", x2(row.lower_CI))
        .attr("x2", x2(row.upper_CI))
        .attr("y1", y)
        .attr("y2", y)
        .attr("stroke", colorScale(row.visit))
        .attr("stroke-width", 2);

      attachHover(svg.append("line").datum(row))
        .attr("class", subgroupClass(row.subgroup))
        .attr("data-base-stroke", colorScale(row.visit))
        .attr("x1", x2(row.lower_CI))
        .attr("x2", x2(row.lower_CI))
        .attr("y1", y - rowHeight * 0.2)
        .attr("y2", y + rowHeight * 0.2)
        .attr("stroke", colorScale(row.visit))
        .attr("stroke-width", 2);

      attachHover(svg.append("line").datum(row))
        .attr("class", subgroupClass(row.subgroup))
        .attr("data-base-stroke", colorScale(row.visit))
        .attr("x1", x2(row.upper_CI))
        .attr("x2", x2(row.upper_CI))
        .attr("y1", y - rowHeight * 0.2)
        .attr("y2", y + rowHeight * 0.2)
        .attr("stroke", colorScale(row.visit))
        .attr("stroke-width", 2);

      attachHover(svg.append("circle").datum(row))
        .attr("class", subgroupClass(row.subgroup))
        .attr("data-base-fill", colorScale(row.visit))
        .attr("cx", x2(row.mean))
        .attr("cy", y)
        .attr("r", d3.scaleLinear().domain([0, d3.max(rightRows, (d) => d.n || 0)]).range([3, 7])(row.n || 0))
        .attr("fill", colorScale(row.visit));
    }

    attachHover(svg.append("text").datum(row))
      .attr("class", subgroupClass(row.subgroup))
      .attr("data-base-fill", "black")
      .attr("x", rightNX)
      .attr("y", y)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "central")
      .attr("font-size", 13)
      .text(row.n);

    attachHover(svg.append("text").datum(row))
      .attr("class", subgroupClass(row.subgroup))
      .attr("data-base-fill", "black")
      .attr("x", rightResultX)
      .attr("y", y)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "central")
      .attr("font-size", 13)
      .text(row.result);
  }

  for (const label of rowLabels) {
    const y = yFor(label);
    const row = leftRows.find((d) => d.label === label) ?? rightRows.find((d) => d.label === label);

    attachHover(svg.append("text").datum(row))
      .attr("class", subgroupClass(row.subgroup))
      .attr("data-base-fill", "black")
      .attr("x", labelX)
      .attr("y", y)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "central")
      .attr("font-size", 13)
      .attr("font-weight", "bold")
      .text(label);
  }

  const legendLineY = 14;
  const legendCapTop = 6;
  const legendCapBottom = 22;
  const legendTextY = 20;
  const legendBandY = 4;
  const legendBandHeight = 20;

  svg.append("line")
    .attr("x1", 580)
    .attr("x2", 610)
    .attr("y1", legendLineY)
    .attr("y2", legendLineY)
    .attr("stroke", colorScale(leftVisit))
    .attr("stroke-width", 2);

  svg.append("line")
    .attr("x1", 580)
    .attr("x2", 580)
    .attr("y1", legendCapTop)
    .attr("y2", legendCapBottom)
    .attr("stroke", colorScale(leftVisit))
    .attr("stroke-width", 2);

  svg.append("line")
    .attr("x1", 610)
    .attr("x2", 610)
    .attr("y1", legendCapTop)
    .attr("y2", legendCapBottom)
    .attr("stroke", colorScale(leftVisit))
    .attr("stroke-width", 2);

  svg.append("circle")
    .attr("cx", 595)
    .attr("cy", legendLineY)
    .attr("r", 4)
    .attr("fill", colorScale(leftVisit));

  svg.append("text")
    .attr("x", 620)
    .attr("y", legendTextY)
    .attr("font-size", 12)
    .attr("fill", "#6d6d6d")
    .text("Mean Δ + 95% CI");

  svg.append("rect")
    .attr("x", 760)
    .attr("y", legendBandY)
    .attr("width", 54)
    .attr("height", legendBandHeight)
    .attr("fill", bandFill);

  svg.append("line")
    .attr("x1", 787)
    .attr("x2", 787)
    .attr("y1", legendBandY)
    .attr("y2", legendBandY + legendBandHeight)
    .attr("stroke", refLine)
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4 4");

  svg.append("text")
    .attr("x", 826)
    .attr("y", legendTextY)
    .attr("font-size", 12)
    .attr("fill", "#6d6d6d")
    .text("Mean Δ + 95% CI for All Subjects");

  display(svg.node());
}
```

```js
display(renderPagePager("/Summerized-Information"));
```
