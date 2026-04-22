function mulberry32(seed) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(value) {
  const text = JSON.stringify(value);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomInt(rng, min, maxInclusive) {
  return Math.floor(rng() * (maxInclusive - min + 1)) + min;
}

function randomNormal(rng, mean = 0, std = 1) {
  const u = 1 - rng();
  const v = rng();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * std;
}

function randomBernoulli(rng, p) {
  return rng() < p ? 1 : 0;
}

function shuffle(rng, values) {
  const copy = values.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function multinomialDraw(rng, n, probs) {
  const normalized = probs.slice();
  const sum = normalized.reduce((acc, value) => acc + value, 0);
  for (let i = 0; i < normalized.length; i += 1) normalized[i] /= sum;

  const counts = Array(normalized.length).fill(0);
  for (let i = 0; i < n; i += 1) {
    const draw = rng();
    let cumulative = 0;
    for (let j = 0; j < normalized.length; j += 1) {
      cumulative += normalized[j];
      if (draw <= cumulative || j === normalized.length - 1) {
        counts[j] += 1;
        break;
      }
    }
  }
  return counts;
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function mean(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values) {
  if (!values.length) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
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

export const DEFAULT_ADSL_INPUTS = {
  enrollment: 100,
  sex: 0.55,
  age1: 40,
  age2: 80,
  height1: 140,
  height2: 190,
  weight1: 35,
  weight2: 105,
  flg1: 0.2,
  trt: 0.5
};

export const DEFAULT_ADLB_INPUTS = {
  endpoints: 2,
  visits: 4,
  retention: 0.9
};

export const DEMO_BROWSER_BUNDLE_KEYS = Object.freeze([
  "ADSL",
  "ADLB",
  "adslInputs",
  "adlbInputs",
  "ADLB_Long",
  "masterData"
]);

export function describeDemoSource(source) {
  return source === "localStorage" ? "browser demo bundle" : "bundled build-time seed";
}

export function buildDemoDataFlowNote(items, {includeServerNote = true} = {}) {
  const parts = items.map(({label, source}) => `${label}: ${describeDemoSource(source)}`);
  const detail = parts.join("; ");
  const serverNote = includeServerNote
    ? " The AI Study Explorer and API use the server-side DuckDB semantic views, so browser-only simulation changes do not automatically update AI answers."
    : "";
  return `${detail}.${serverNote}`;
}

export function loadStoredValue(key, fallback) {
  if (typeof window === "undefined" || !window.localStorage) {
    return {value: fallback, source: "bundled"};
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {value: fallback, source: "bundled"};
    return {value: JSON.parse(raw), source: "localStorage"};
  } catch {
    return {value: fallback, source: "bundled"};
  }
}

export function isValidAdslInputs(value) {
  return Boolean(
    value &&
      typeof value.enrollment === "number" &&
      typeof value.sex === "number" &&
      typeof value.age1 === "number" &&
      typeof value.age2 === "number" &&
      typeof value.height1 === "number" &&
      typeof value.height2 === "number" &&
      typeof value.weight1 === "number" &&
      typeof value.weight2 === "number" &&
      typeof value.flg1 === "number" &&
      typeof value.trt === "number"
  );
}

export function isValidAdlbInputs(value) {
  return Boolean(
    value &&
      typeof value.endpoints === "number" &&
      typeof value.visits === "number" &&
      typeof value.retention === "number"
  );
}

export function isValidMasterData(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return false;
  const sample = rows[0];
  const requiredFields = ["USUBJID", "SITE", "SEX", "RACE", "FLG1", "TRTEMFL"];
  if (requiredFields.some((field) => sample[field] == null)) return false;
  const endpointVisitFields = Object.keys(sample).filter((key) => key.includes("_Visit") && !key.endsWith("_CHG"));
  if (!endpointVisitFields.length) return false;
  const uniqueSites = new Set(rows.map((row) => row.SITE).filter((value) => typeof value === "string" && /^Site_\d+/.test(value)));
  for (const site of ["Site_1", "Site_2", "Site_3", "Site_4"]) {
    if (!uniqueSites.has(site)) return false;
  }
  return rows.every((row) => requiredFields.every((field) => row[field] != null));
}

export function persistDemoBundle(bundle) {
  if (typeof window === "undefined" || !window.localStorage) return false;
  const pairs = Object.entries(bundle);
  for (const [key, value] of pairs) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
  return true;
}

export function generateEnrollmentData({numSites, totalNumSubjects, enrollmentPercentage, seed = 2026}) {
  const rng = mulberry32(hashSeed({numSites, totalNumSubjects, enrollmentPercentage, seed}));
  const siteIds = Array.from({length: numSites}, (_, i) => `Site_${String(i + 1).padStart(3, "0")}`);
  const baseSubjects = Math.floor(totalNumSubjects / numSites);
  const remainder = totalNumSubjects % numSites;
  const start = new Date("2024-01-01T00:00:00Z");
  const end = new Date("2024-12-31T00:00:00Z");
  const rows = [];

  function randomDate(startDate, endDate) {
    const time = startDate.getTime() + rng() * (endDate.getTime() - startDate.getTime());
    return new Date(time);
  }

  function plusDays(date, maxDays) {
    const copy = new Date(date);
    copy.setUTCDate(copy.getUTCDate() + randomInt(rng, 1, maxDays));
    return copy;
  }

  for (let siteIndex = 0; siteIndex < siteIds.length; siteIndex += 1) {
    const site = siteIds[siteIndex];
    const count = baseSubjects + (siteIndex < remainder ? 1 : 0);
    const subjects = Array.from({length: count}, (_, i) => ({
      subjectNumber: i + 1,
      consentDate: randomDate(start, end)
    })).sort((a, b) => a.consentDate - b.consentDate);

    for (const subject of subjects) {
      const consentDate = subject.consentDate;
      const approvalDate = plusDays(consentDate, 60);
      const isEnrolled = rng() < enrollmentPercentage;
      const procedureDate = isEnrolled ? plusDays(approvalDate, 30) : null;
      const randomized = isEnrolled ? (rng() < 0.5 ? "Randomized" : "Roll-in") : null;

      rows.push({
        subjectId: `${site.split("_")[1]}_${String(subject.subjectNumber).padStart(3, "0")}`,
        site,
        consentDate: consentDate.toISOString().slice(0, 10),
        CSCApprovalDate: approvalDate.toISOString().slice(0, 10),
        status: isEnrolled ? "Enrolled" : "Screening Failure",
        procedureDate: procedureDate ? procedureDate.toISOString().slice(0, 10) : null,
        randomized
      });
    }
  }

  return rows;
}

export function summarizeEnrollment(data, currentMonth) {
  const decorated = data
    .map((row) => ({
      ...row,
      consentMonth: row.consentDate ? new Date(`${row.consentDate}T00:00:00Z`).getUTCMonth() + 1 : null,
      approvalMonth: row.CSCApprovalDate ? new Date(`${row.CSCApprovalDate}T00:00:00Z`).getUTCMonth() + 1 : null,
      procedureMonth: row.procedureDate ? new Date(`${row.procedureDate}T00:00:00Z`).getUTCMonth() + 1 : null
    }))
    .filter((row) => row.consentMonth <= currentMonth);

  const screening = decorated.filter((row) => row.approvalMonth > currentMonth);
  const approved = decorated.filter((row) => row.approvalMonth <= currentMonth);
  const screenFailure = approved.filter((row) => row.status === "Screening Failure");
  const pendingProcedure = approved.filter((row) => row.procedureMonth == null || row.procedureMonth > currentMonth);
  const randomized = approved.filter((row) => row.randomized === "Randomized" && row.procedureMonth <= currentMonth);
  const rollIn = approved.filter((row) => row.randomized === "Roll-in" && row.procedureMonth <= currentMonth);

  const flowCounts = [
    {label: "Consented", value: decorated.length},
    {label: "Screen In Process", value: screening.length},
    {label: "Approved", value: approved.length},
    {label: "Screen Failure", value: screenFailure.length},
    {label: "Pending Procedure", value: pendingProcedure.length},
    {label: "Randomized", value: randomized.length},
    {label: "Roll-in", value: rollIn.length}
  ];

  const groupedMap = new Map();
  for (const row of screening) {
    const key = `${row.site}|Screen In Process`;
    groupedMap.set(key, (groupedMap.get(key) ?? 0) + 1);
  }
  for (const row of screenFailure) {
    const key = `${row.site}|Screen Failure`;
    groupedMap.set(key, (groupedMap.get(key) ?? 0) + 1);
  }
  for (const row of pendingProcedure) {
    const key = `${row.site}|Pending Procedure`;
    groupedMap.set(key, (groupedMap.get(key) ?? 0) + 1);
  }
  for (const row of randomized) {
    const key = `${row.site}|Randomized`;
    groupedMap.set(key, (groupedMap.get(key) ?? 0) + 1);
  }
  for (const row of rollIn) {
    const key = `${row.site}|Roll-in`;
    groupedMap.set(key, (groupedMap.get(key) ?? 0) + 1);
  }

  const grouped = Array.from(groupedMap, ([key, count]) => {
    const [site, enrollmentStatus] = key.split("|");
    return {site, enrollmentStatus, count};
  }).sort((a, b) => a.site.localeCompare(b.site) || a.enrollmentStatus.localeCompare(b.enrollmentStatus));

  return {decorated, flowCounts, grouped};
}

export function generateADSL(adslInputs, seed = 2026) {
  const rng = mulberry32(hashSeed({adslInputs, seed}));
  const siteWeights = [0.2, 0.2, 0.3, 0.3];
  const siteLabels = ["Site_1", "Site_2", "Site_3", "Site_4"];
  const siteCounts = multinomialDraw(rng, adslInputs.enrollment, siteWeights);
  const sitePool = shuffle(
    rng,
    siteCounts.flatMap((count, index) => Array(count).fill(siteLabels[index]))
  );

  const raceWeights = [0.7, 0.2, 0.1];
  const raceLabels = ["WHITE", "AFRICAN AMERICAN", "AMERICAN INDIAN"];
  const raceCounts = multinomialDraw(rng, adslInputs.enrollment, raceWeights);
  const racePool = shuffle(
    rng,
    raceCounts.flatMap((count, index) => Array(count).fill(raceLabels[index]))
  );

  return Array.from({length: adslInputs.enrollment}, (_, index) => {
    const height = randomInt(rng, adslInputs.height1, adslInputs.height2);
    const weight = randomInt(rng, adslInputs.weight1, adslInputs.weight2);
    return {
      USUBJID: `Subject_${String(index + 1).padStart(3, "0")}`,
      SITE: sitePool[index],
      SEX: randomBernoulli(rng, adslInputs.sex) === 1 ? "Male" : "Female",
      AGE: randomInt(rng, adslInputs.age1, adslInputs.age2),
      RACE: racePool[index],
      HEIGHT: height,
      WEIGHT: weight,
      BMI: round(weight / (height / 100) ** 2, 1),
      FLG1: randomBernoulli(rng, adslInputs.flg1) === 1 ? "Yes" : "No",
      TRTEMFL: randomBernoulli(rng, adslInputs.trt) === 1 ? "A" : "B"
    };
  });
}

export function generateADLB(adlbInputs, adsl, seed = 2026) {
  const rng = mulberry32(hashSeed({adlbInputs, subjectCount: adsl.length, seed}));
  const visits = Array.from({length: adlbInputs.visits}, (_, i) => `Visit${i}`);
  const endpoints = Array.from({length: adlbInputs.endpoints}, (_, i) => `Endpoint${i + 1}`);
  const rows = [];

  for (const subject of adsl) {
    for (const endpoint of endpoints) {
      const baseMean = endpoint === "Endpoint1" ? 10 : 0;
      const baseline = round(randomNormal(rng, baseMean + (subject.TRTEMFL === "A" ? 0.5 : 0), 2.4), 2);
      let lastValue = baseline;

      for (let visitIndex = 0; visitIndex < visits.length; visitIndex += 1) {
        const visit = visits[visitIndex];
        if (visitIndex > 0 && rng() > adlbInputs.retention) continue;

        let value = baseline;
        if (visitIndex > 0) {
          const trtEffect = subject.TRTEMFL === "A" ? visitIndex * 1.6 : visitIndex * 0.7;
          const flgEffect = subject.FLG1 === "Yes" ? 0.8 : 0;
          value = round(lastValue + randomNormal(rng, trtEffect + flgEffect, 1.5), 2);
          lastValue = value;
        }

        rows.push({
          USUBJID: subject.USUBJID,
          SITE: subject.SITE,
          SEX: subject.SEX,
          AGE: subject.AGE,
          RACE: subject.RACE,
          HEIGHT: subject.HEIGHT,
          WEIGHT: subject.WEIGHT,
          BMI: subject.BMI,
          FLG1: subject.FLG1,
          TRTEMFL: subject.TRTEMFL,
          PARAMCD: endpoint,
          VISIT: visit,
          AVAL: value
        });
      }
    }
  }

  return rows;
}

export function buildADLBWide(adlbLong) {
  const grouped = new Map();
  for (const row of adlbLong) {
    if (!grouped.has(row.USUBJID)) grouped.set(row.USUBJID, {USUBJID: row.USUBJID});
    grouped.get(row.USUBJID)[`${row.PARAMCD}_${row.VISIT}`] = row.AVAL;
  }

  const wideRows = Array.from(grouped.values());
  const visitColumns = Object.keys(wideRows[0] ?? {}).filter((key) => key.includes("_Visit"));
  const endpoints = [...new Set(visitColumns.map((column) => column.split("_")[0]))];
  const visits = [...new Set(visitColumns.map((column) => column.split("_")[1]))].sort();
  const baselineVisit = visits[0];

  for (const row of wideRows) {
    for (const endpoint of endpoints) {
      const baselineKey = `${endpoint}_${baselineVisit}`;
      for (const visit of visits.slice(1)) {
        const visitKey = `${endpoint}_${visit}`;
        row[`${visitKey}_CHG`] =
          row[visitKey] == null || row[baselineKey] == null ? null : round(row[visitKey] - row[baselineKey], 2);
      }
    }
  }

  return wideRows;
}

export function buildMasterData(adsl, adlbWide) {
  const adslMap = new Map(adsl.map((row) => [row.USUBJID, row]));
  return adlbWide.map((row) => ({...adslMap.get(row.USUBJID), ...row}));
}

export function describeByVisit(masterData, endpoint, subgroupField) {
  if (!masterData?.length) return {visits: [], groups: []};
  const visitColumns = Object.keys(masterData[0]).filter((key) => key.startsWith(`${endpoint}_Visit`) && !key.endsWith("_CHG"));
  const visits = visitColumns.map((column) => column.split("_")[1]).sort();
  const subgroupValues = ["Total Cohort", ...new Set(masterData.map((row) => row[subgroupField]))];

  const groups = subgroupValues.map((groupName) => {
    const rows = groupName === "Total Cohort" ? masterData : masterData.filter((row) => row[subgroupField] === groupName);
    const plotRows = visits.flatMap((visit) =>
      rows
        .map((row) => ({visit, value: row[`${endpoint}_${visit}`], subject: row.USUBJID}))
        .filter((row) => row.value != null)
    );
    const summary = visits.map((visit) => {
      const column = `${endpoint}_${visit}`;
      const values = rows.map((row) => row[column]).filter((value) => value != null);
      return {
        visit,
        n: values.length,
        mean: values.length ? round(mean(values) ?? 0, 1) : null,
        sd: values.length ? round(deviation(values) ?? 0, 1) : null,
        median: values.length ? round(median(values) ?? 0, 1) : null,
        min: values.length ? round(Math.min(...values), 1) : null,
        max: values.length ? round(Math.max(...values), 1) : null
      };
    });

    const changeCharts = visits.slice(1).map((visit) => {
      const changeColumn = `${endpoint}_${visit}_CHG`;
      const baselineColumn = `${endpoint}_${visits[0]}`;
      const visitColumn = `${endpoint}_${visit}`;
      const sourceRows = rows.filter((row) => row[changeColumn] != null);
      const changeValues = sourceRows.map((row) => row[changeColumn]);
      const interval = confidence95(changeValues);
      const chartRows = sourceRows.flatMap((row) => [
        {visit: visits[0], value: row[baselineColumn], subject: row.USUBJID},
        {visit, value: row[visitColumn], subject: row.USUBJID}
      ]);

      return {
        visit,
        n: changeValues.length,
        meanChange: round(mean(changeValues) ?? 0, 1),
        lower: round(interval.lower ?? 0, 1),
        upper: round(interval.upper ?? 0, 1),
        changeValues,
        chartRows
      };
    });

    return {
      name: groupName,
      label: groupName === "Total Cohort" ? groupName : `${subgroupField} = ${groupName}`,
      plotRows,
      summary,
      changeCharts
    };
  });

  return {visits, groups};
}
