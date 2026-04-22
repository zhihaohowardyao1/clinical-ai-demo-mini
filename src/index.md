---
title: Clinical Trial Analytics + AI Demo
---

```js
import {buildDemoDataFlowNote, persistDemoBundle} from "./components/demoData.js";
import {renderPagePager} from "./components/pagePager.js";

const seededADSL = await FileAttachment("./data/demo/ADSL.json").json();
const seededADLB = await FileAttachment("./data/demo/ADLB.json").json();
const seededAdslInputs = await FileAttachment("./data/demo/adslInputs.json").json();
const seededAdlbInputs = await FileAttachment("./data/demo/adlbInputs.json").json();
const seededMasterData = await FileAttachment("./data/demo/masterData.json").json();

if (typeof window !== "undefined" && window.localStorage) {
  for (const [key, value] of Object.entries({
    ADSL: seededADSL,
    ADLB: seededADLB,
    adslInputs: seededAdslInputs,
    adlbInputs: seededAdlbInputs,
    masterData: seededMasterData
  })) {
    if (!window.localStorage.getItem(key)) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  }
}

display(html`<div class="hero">
  <p class="hero-kicker">Public Demo</p>
  <h1>Clinical Trial Analytics + AI Demo</h1>
  <h2>Explore a complete synthetic clinical workflow: simulate ADaM-style data, review analytical outputs, inspect submission-style tables, and ask explainable AI questions backed by a semantic layer and read-only DuckDB views.</h2>
</div>`);

display(html`<hr>`);

display(html`<section class="workflow">
  <div class="workflow-intro">
    <h2>How to navigate the demo</h2>
    <p>Start with the simulated study data, move into exploratory analysis and regulatory-style outputs, then open the AI section to see how the same synthetic study can be queried through a semantic layer, visible routing, generated SQL, and a result table.</p>
  </div>
  <div class="workflow-grid">
    <a class="workflow-card" href="/Enrollment-Monitoring">
      <span class="workflow-step">1. Enrollment workflow</span>
      <strong>Monitor recruitment status over time</strong>
      <p>Simulate how subjects move from consent through screening, approval, pending procedure, roll-in, and randomization.</p>
    </a>
    <a class="workflow-card" href="/ADaM-Datasets">
      <span class="workflow-step">2. Data simulation</span>
      <strong>Generate synthetic ADaM-style datasets</strong>
      <p>Review subject-level and longitudinal structures that feed the downstream analytics and output tables.</p>
    </a>
    <a class="workflow-card" href="/Descriptive-Statistics">
      <span class="workflow-step">3. Clinical analysis</span>
      <strong>Inspect descriptive, summary, and efficacy views</strong>
      <p>Move from exploratory statistics to forest plots, Kaplan-Meier views, ORR summaries, and submission-ready tables.</p>
    </a>
    <a class="workflow-card" href="/ai/ai-study-explorer">
      <span class="workflow-step">4. Explainable AI</span>
      <strong>See how questions become answers</strong>
      <p>Follow the selected dataset, routing decision, generated SQL, result table, interpretation, and safety notes in one place.</p>
    </a>
  </div>
</section>`);

display(html`<hr>`);

display(html`<section class="landing-note">
  <h2>What makes this demo different</h2>
  <p>The project intentionally keeps the analytical story visible. The AI experience does not replace the analytics workflow; it sits on top of the same synthetic study narrative and shows how semantic definitions, routing rules, generated SQL, and safety checks support a trustworthy answer.</p>
  <p><small>${buildDemoDataFlowNote([
    {label: "ADSL", source: "bundled"},
    {label: "ADLB", source: "bundled"},
    {label: "masterData", source: "bundled"}
  ], {includeServerNote: true})}</small></p>
</section>`);

display(renderPagePager("/"));
```

<style>
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--sans-serif);
  margin: 4rem 0 4rem;
  text-wrap: balance;
  text-align: center;
}

.hero-kicker {
  margin: 0 0 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--theme-foreground-muted);
}

.hero h1 {
  margin: 1rem 0;
  padding: 1rem 0;
  max-width: none;
  font-size: 14vw;
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(30deg, var(--theme-foreground-focus), currentColor);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero h2 {
  margin: 0;
  max-width: 42em;
  font-size: 20px;
  font-style: initial;
  font-weight: 500;
  line-height: 1.5;
  color: var(--theme-foreground-muted);
}

.hero-copy {
  margin-top: 3rem;
}

.workflow {
  display: grid;
  gap: 1.25rem;
  margin: 2rem 0 3rem;
}

.workflow-intro h2,
.landing-note h2 {
  margin-bottom: 0.35rem;
}

.workflow-intro p,
.landing-note p {
  max-width: 60rem;
  color: var(--theme-foreground-muted);
}

.workflow-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.workflow-card {
  display: grid;
  gap: 0.55rem;
  padding: 1.1rem 1.15rem;
  border: 1px solid var(--theme-foreground-fainter);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(247,249,252,0.92));
  text-decoration: none;
  color: inherit;
}

.workflow-card:hover {
  border-color: var(--theme-foreground-focus);
  text-decoration: none;
}

.workflow-step {
  color: #5b7186;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.workflow-card strong {
  font-size: 1.02rem;
}

.workflow-card p {
  margin: 0;
  color: var(--theme-foreground-muted);
}

.landing-note {
  margin: 2rem 0 1rem;
}

@media (min-width: 640px) {
  .hero h1 {
    font-size: 90px;
  }
}
</style>
