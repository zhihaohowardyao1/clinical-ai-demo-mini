---
title: Enrollment Monitoring
---

```js
import * as d3 from "npm:d3";
import {generateEnrollmentData} from "./components/demoData.js";
import {renderPagePager} from "./components/pagePager.js";
```

# Enrollment Real-Time Monitoring

> Recruitment data in clinical trial enrollment is essential for tracking and managing the process of enrolling participants in a study. It includes key metrics such as the number of participants recruited, enrollment rates, site-specific recruitment performance, and etc. This data helps researchers assess the effectiveness of recruitment strategies, identify potential bottlenecks, and ensure diversity and compliance with study protocols. Accurate and timely recruitment data is crucial for meeting enrollment targets, minimizing delays, and ultimately ensuring the trial's success in generating reliable and generalizable results.

> The distribution of subjects across multiple sites is simulated, their statuses are assigned, and relevant dates for their participation in the trial are calculated.

---

**Setup Enrollment Data**

```js
const parInputs = view(
  Inputs.form({
    totalNumSubjects: Inputs.range([60, 200], {label: "Total Number of Subjects", step: 10, value: 100}),
    numSites: Inputs.range([4, 10], {label: "Number of Sites", step: 1, value: 6}),
    enrollmentPercentage: Inputs.range([0.3, 0.9], {label: "Enrollment Percentage", step: 0.1, value: 0.5})
  })
);
```

```js
const dataset = generateEnrollmentData({
  numSites: parInputs.numSites,
  totalNumSubjects: parInputs.totalNumSubjects,
  enrollmentPercentage: parInputs.enrollmentPercentage
});
```

```js
Inputs.table(dataset)
```

---

**Enrollment Flow Chart**

> This flow chart provides a real-time visualization of the clinical trial enrollment status, offering insights into participant progression through various stages. The interactive month slider at the top allows users to track enrollment trends over time, enabling month-by-month monitoring of recruitment dynamics. The diagram highlights key milestones, including consented participants, screening failures, active screenings, CSC approval, and eventual categorization into pending procedures, roll-in cases, or randomized groups. By visually mapping patient flow, this tool facilitates efficient trial management, helping stakeholders assess recruitment effectiveness and identify potential bottlenecks in the enrollment process.

```js
const curMonth = view(Inputs.range([1, 12], {label: "Current Month", step: 1, value: 9}));
```

```js
const data = dataset
  .map((d) => ({
    ...d,
    consentMonth: d.consentDate == null ? null : new Date(`${d.consentDate}T00:00:00Z`).getUTCMonth() + 1,
    CSCMonth: d.CSCApprovalDate == null ? null : new Date(`${d.CSCApprovalDate}T00:00:00Z`).getUTCMonth() + 1,
    procedureMonth: d.procedureDate == null ? null : new Date(`${d.procedureDate}T00:00:00Z`).getUTCMonth() + 1
  }))
  .filter((d) => d.consentMonth <= curMonth);

const SIP = data.filter((d) => d.CSCMonth > curMonth);
const Approved = data.filter((d) => d.CSCMonth <= curMonth);
const enrolled = Approved.filter((d) => d.status === "Enrolled");
const SF = Approved.filter((d) => d.status === "Screening Failure");
const pendingProcedure = Approved.filter((d) => d.procedureMonth == null || d.procedureMonth > curMonth);
const rand = enrolled.filter((d) => d.randomized === "Randomized" && d.procedureMonth <= curMonth);
const rollin = enrolled.filter((d) => d.randomized === "Roll-in" && d.procedureMonth <= curMonth);

const analysisData = {
  numConsent: data.length,
  numSIP: SIP.length,
  numApproved: Approved.length,
  numEnrolled: enrolled.length,
  numSF: SF.length,
  numPending: pendingProcedure.length,
  numRand: rand.length,
  numRollin: rollin.length,
  curData: [
    ...SIP.map((d) => ({...d, enrollmentStatus: "Screen in Process"})),
    ...SF.map((d) => ({...d, enrollmentStatus: "Screen Failure"})),
    ...pendingProcedure.map((d) => ({...d, enrollmentStatus: "Pending Procedure"})),
    ...rand.map((d) => ({...d, enrollmentStatus: "Randomized"})),
    ...rollin.map((d) => ({...d, enrollmentStatus: "Roll-in"}))
  ]
};

const groupedCounts = new Map();
for (const row of analysisData.curData) {
  const key = `${row.site}||${row.enrollmentStatus}`;
  groupedCounts.set(key, (groupedCounts.get(key) ?? 0) + 1);
}

const data1 = Array.from(groupedCounts, ([key, count]) => {
  const [site, enrollmentStatus] = key.split("||");
  return {site, enrollmentStatus, count};
});

const snapshotCounts = {
  Consented: analysisData.numConsent,
  "Screen In Process": analysisData.numSIP,
  Approved: analysisData.numApproved,
  "Screen Failure": analysisData.numSF,
  "Pending Procedure": analysisData.numPending,
  Randomized: analysisData.numRand,
  "Roll-in": analysisData.numRollin
};
```

```js
{
  const width = 1240;
  const height = 500;
  const svg = d3.create("svg").attr("width", width).attr("height", height);
  const counts = {
    consented: Number(snapshotCounts.Consented || 0),
    screening: Number(snapshotCounts["Screen In Process"] || 0),
    approved: Number(snapshotCounts.Approved || 0),
    screenFailure: Number(snapshotCounts["Screen Failure"] || 0),
    pending: Number(snapshotCounts["Pending Procedure"] || 0),
    rollin: Number(snapshotCounts["Roll-in"] || 0),
    randomized: Number(snapshotCounts.Randomized || 0)
  };

  const aggData = [
    {e: 1, c: "#00B0F0", x: 450, y: 50, t: `Consented\n n = ${counts.consented}`},
    {e: 1, c: "#00B0F0", x: 150, y: 170, t: `Active Screenings\n n = ${counts.screening}`},
    {e: 1, c: "#0070C0", x: 450, y: 250, t: `CSC Approved\n n = ${counts.approved}`},
    {f: 1, e: 0, c: "#F692A2", x: 870, y: 200, t: `Inclusion / Exclsion\nScreen Failure\n n = ${counts.screenFailure}`},
    {e: 1, c: "#00B0F0", x: 100, y: 400, t: `Pending Procedure\n n = ${counts.pending}`},
    {e: 1, c: "#0070C0", x: 350, y: 400, t: `Roll-in Cases\n n = ${counts.rollin}`},
    {e: 1, c: "#0070C0", x: 600, y: 400, t: `Randomized\n n = ${counts.randomized}`}
  ];

  aggData.forEach((d, i) => {
    svg.append("rect")
      .attr("x", d.x)
      .attr("y", d.y)
      .attr("width", 200)
      .attr("height", d.e === 2 ? 240 : d.e === 0 ? 80 : 60)
      .attr("class", `stepBox_${i}`)
      .attr("fill", d.c)
      .attr("stroke", d.c)
      .attr("stroke-width", 2);

    d.t.split("\n").forEach((k, j) => {
      svg.append("text")
        .attr("x", d.e === 2 ? d.x + 20 : d.x + 100)
        .attr("y", d.e === 2 ? d.y + 20 + j * 20 : d.y + 24 + j * 22)
        .text(k)
        .attr("class", `stepBox_${i}`)
        .attr("text-anchor", d.e === 2 ? "start" : "middle")
        .attr("fill", d.f === 1 ? "black" : "white")
        .style("font-size", d.e === 2 ? "13px" : "15px")
        .style("font-weight", "bold");
    });
  });

  const aggLineData = [
    {c: "0070C0", x1: aggData[0].x + 100, y1: aggData[0].y + 60, x2: aggData[2].x + 100, y2: aggData[2].y},
    {c: "A6A6A6", x1: aggData[1].x + 100, y1: aggData[1].y - 30, x2: aggData[0].x + 100, y2: aggData[0].y + 90},
    {c: "A6A6A6", x1: aggData[1].x + 100, y1: aggData[1].y - 30, x2: aggData[1].x + 100, y2: aggData[1].y},
    {o: 1, c: "F692A2", x1: aggData[3].x + 100, y1: aggData[3].y - 40, x2: aggData[0].x + 100, y2: aggData[0].y + 110},
    {c: "F692A2", x1: aggData[3].x + 100, y1: aggData[3].y - 40, x2: aggData[3].x + 100, y2: aggData[3].y},
    {o: 1, c: "0070C0", x1: aggData[2].x + 100, y1: aggData[2].y + 60, x2: aggData[2].x + 100, y2: aggData[2].y + 100},
    {o: 1, c: "0070C0", x1: aggData[4].x + 100, y1: aggData[4].y - 50, x2: aggData[6].x + 100, y2: aggData[6].y - 50},
    {c: "0070C0", x1: aggData[4].x + 100, y1: aggData[4].y - 50, x2: aggData[4].x + 100, y2: aggData[4].y},
    {c: "0070C0", x1: aggData[5].x + 100, y1: aggData[5].y - 50, x2: aggData[5].x + 100, y2: aggData[5].y},
    {c: "0070C0", x1: aggData[6].x + 100, y1: aggData[6].y - 50, x2: aggData[6].x + 100, y2: aggData[6].y}
  ];

  aggLineData.forEach((d) => {
    svg.append("path")
      .attr("d", d3.line()([[d.x1, d.y1], [d.x2, d.y2]]))
      .style("stroke-width", "3")
      .style("stroke", `#${d.c}`)
      .attr("marker-end", d.o === 1 ? null : `url(#arrow_${d.c})`)
      .style("stroke-dasharray", d.c === "A6A6A6" ? "5,5" : null)
      .attr("fill", "none");
  });

  svg.append("defs").append("marker")
    .attr("id", "arrow_F692A2")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 10)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .attr("fill", "#F692A2")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5");

  svg.append("defs").append("marker")
    .attr("id", "arrow_0070C0")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 10)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .attr("fill", "#0070C0")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5");

  display(svg.node());
}
```

---

**Enrollment Status by Site**

```js
const enrollDomain = ["Screen In Process", "Screen Failure", "Pending Procedure", "Randomized", "Roll-in"];
const colorRange = ["#FFC000", "#F596A6", "#1591ea", "#00008a", "#4052d6"];
const groupData = data1.filter((d) => enrollDomain.includes(d.enrollmentStatus));
const legend_domain = enrollDomain.map((status) => `${status} (${groupData.filter((row) => row.enrollmentStatus === status).reduce((sum, row) => sum + row.count, 0)})`);
const numToggle = view(Inputs.toggle({label: "Show Numbers", value: false}));
```

```js
Plot.legend({
  width: 660,
  color: {
    domain: legend_domain,
    range: colorRange
  }
})
```

```js
Plot.plot({
  marginLeft: 80,
  width: 1200,
  height: Math.max(240, [...new Set(groupData.map((d) => d.site))].length * 55),
  y: {
    label: null,
    padding: 0.6
  },
  x: {
    grid: true,
    label: null,
    tickFormat: (d) => (d > Math.floor(d) ? "" : `${d}`)
  },
  color: {
    domain: enrollDomain,
    range: colorRange
  },
  style: {
    fontSize: 14,
    fontWeight: "bold"
  },
  marks: [
    Plot.barX(groupData, {x: "count", y: "site", fill: "enrollmentStatus"}),
    Plot.textX(
      groupData,
      Plot.stackX({
        x: "count",
        text: "count",
        y: "site",
        fill: "white",
        fontSize: 14,
        fontWeight: "bold",
        opacity: numToggle ? 1 : 0
      })
    ),
    Plot.ruleX([0])
  ]
})
```

> This bar chart presents a site-wise breakdown of the clinical trial enrollment status, providing a visual summary of participant progress across multiple locations. Each site is represented by a horizontal bar segmented into different enrollment categories, including screening in process, screen failures, pending procedures, randomized participants, and roll-in cases. The color-coded legend at the top highlights the total count for each category, ensuring clarity in interpretation. Additionally, the “Show Numbers” toggle allows users to display or hide specific enrollment values for each site, offering flexibility in data visualization. This chart serves as an essential tool for tracking site performance and identifying trends in participant recruitment and progression.

---

```js
display(renderPagePager("/Enrollment-Monitoring"));
```
