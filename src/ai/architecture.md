---
title: AI Architecture
---

```js
import {
  createAIPageHero,
  createCallout,
  createCardGrid,
  createFlow,
  createStatGrid,
  createTableSection,
  ensureAISectionStyles
} from "../components/aiSection.js";
import {renderPagePager} from "../components/pagePager.js";

ensureAISectionStyles();

const root = document.createElement("div");
root.className = "ai-section-page";

root.append(
  createAIPageHero({
    kicker: "System View",
    title: "Architecture",
    summary:
      "The AI area is built as a thin explainable layer on top of the synthetic clinical demo. It combines a visible front-end experience, a compact semantic contract, a swappable provider layer, and a read-only DuckDB execution path so visitors can understand how answers are produced without mistaking the demo for an open-ended copilot.",
    pills: ["Front-end first", "Provider-neutral", "Read-only SQL", "Demo-safe"]
  })
);

root.append(
  createStatGrid([
    {label: "Primary API", value: "POST /api/ask"},
    {label: "Data Engine", value: "DuckDB demo database"},
    {label: "Provider Modes", value: "Mock + live abstraction"},
    {label: "Safety Model", value: "Single-view read-only SQL"}
  ])
);

root.append(
  createFlow([
    {
      title: "Visitor interacts with a public-facing page",
      body: "The Study Explorer accepts a plain-language question and keeps the main explainable states visible on screen."
    },
    {
      title: "Backend resolves semantic context",
      body: "Routing rules, business terms, metric definitions, and example queries narrow the request to a supported domain and view."
    },
    {
      title: "Provider proposes SQL under strict rules",
      body: "A mock provider or online provider returns compact structured output. SQL is validated before execution."
    },
    {
      title: "DuckDB returns the result",
      body: "The selected demo view is queried, rows are returned, and the front end renders dataset, routing, SQL, results, interpretation, and warnings."
    }
  ])
);

root.append(
  createTableSection({
    title: "Architecture Layers",
    description: "Each layer is intentionally narrow so the public demo stays understandable and stable.",
    columns: ["Layer", "Current Role", "Public-Demo Benefit"],
    rows: [
      {Layer: "AI pages", "Current Role": "Present explainable analytics in a guided UI", "Public-Demo Benefit": "Visitors can inspect the system instead of treating it as a black box."},
      {Layer: "Semantic layer", "Current Role": "Define datasets, terms, metrics, and examples", "Public-Demo Benefit": "Makes the product understandable to non-experts."},
      {Layer: "Routing + prompt assembly", "Current Role": "Choose a domain, view, and compact context", "Public-Demo Benefit": "Reduces drift and keeps the routing reason visible."},
      {Layer: "Provider abstraction", "Current Role": "Support mock or online SQL generation", "Public-Demo Benefit": "The demo remains stable even without a live model path."},
      {Layer: "SQL validation", "Current Role": "Block unsafe or out-of-scope queries", "Public-Demo Benefit": "Shows clear safety boundaries during a public walkthrough."},
      {Layer: "DuckDB demo views", "Current Role": "Execute read-only queries against synthetic data", "Public-Demo Benefit": "Answers are grounded in a stable, inspectable dataset."}
    ]
  })
);

root.append(
  createCardGrid([
    {
      title: "Why The Mock Provider Still Matters",
      body:
        "The mock provider is not just a development convenience. It is a public-demo reliability feature. It guarantees the explorer can demonstrate routing, selected dataset, SQL, results, and interpretation even if a live provider is unavailable."
    },
    {
      title: "Why The Backend Stays Thin",
      body:
        "The current architecture favors a minimal API over a large orchestration layer. That keeps the product easy to explain and prevents the demo from looking more capable than it is."
    },
    {
      title: "Why SQL Stays Visible",
      body:
        "Showing the SQL makes the product more credible. It turns the AI section into an explainable analytics surface rather than a chat-only interface."
    }
  ])
);

root.append(
  createCallout("Boundaries That Stay Intentionally Visible", [
    "The current AI area does not expose a free-form agent or autonomous workflow.",
    "The backend only executes validated read-only SQL against the selected demo view.",
    "The architecture is designed for public clarity first, not for maximum backend complexity."
  ])
);

display(root);
```

```js
display(renderPagePager("/ai/architecture"));
```
