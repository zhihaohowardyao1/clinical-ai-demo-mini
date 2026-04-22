---
title: Query Routing
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
    kicker: "Explainable Decisioning",
    title: "Query Routing",
    summary:
      "This page shows how the demo decides where a question belongs before any SQL is generated. Routing stays visible on purpose so a public audience can see that the system is not answering by magic: it classifies the question, selects a supported domain, and stays inside a narrow semantic boundary.",
    pills: ["Visible reasoning", "Domain-bounded", "Supports safety", "Feeds generated SQL"]
  })
);

root.append(
  createStatGrid([
    {label: "Supported Domains", value: "4"},
    {label: "Blocked Topics", value: "PII + unsupported clinical topics"},
    {label: "Routing Output", value: "Domain + dataset + view"},
    {label: "Primary UX", value: "Shown in Study Explorer"}
  ])
);

root.append(
  createFlow([
    {
      title: "Recognize the question type",
      body: "The router distinguishes enrollment, demographics, labs, efficacy, and explicitly unsupported requests."
    },
    {
      title: "Choose the best semantic target",
      body: "The selected intent is matched to the most useful view, such as subject_summary_view, lab_long_view, or efficacy_summary_view."
    },
    {
      title: "Collect the smallest useful context",
      body: "Relevant business terms, metrics, and example queries are passed forward so prompt construction stays compact and understandable."
    },
    {
      title: "Expose the decision to the visitor",
      body: "The Study Explorer shows the routing reason and selected dataset so the output remains inspectable rather than opaque."
    }
  ])
);

root.append(
  createCardGrid([
    {
      title: "Why The Routing Card Matters",
      body:
        "The routing card is one of the clearest public-demo trust signals. It tells the visitor what class of question the system thinks it received and gives context before the SQL appears."
    },
    {
      title: "Why The System Blocks Some Questions",
      body:
        "Out-of-scope topics are rejected early so the demo stays faithful to synthetic enrollment, demographics, lab summaries, and efficacy summaries. The product shows its boundary instead of pretending to answer everything."
    },
    {
      title: "Why This Improves Answer Quality",
      body:
        "Routing keeps prompt construction compact and reduces accidental drift. The backend does not ask the provider to reason across the whole project at once."
    }
  ])
);

root.append(
  createTableSection({
    title: "Routing Examples",
    description: "These examples mirror the kinds of public-demo questions that appear in the Study Explorer.",
    columns: ["Question Pattern", "Routed Domain", "Selected View", "Visible Output"],
    rows: [
      {"Question Pattern": "How many subjects are approved, pending, or randomized by site?", "Routed Domain": "Enrollment", "Selected View": "enrollment_status_view", "Visible Output": "Routing card + grouped result table"},
      {"Question Pattern": "Show average age by sex in the synthetic cohort.", "Routed Domain": "Demographics", "Selected View": "subject_summary_view", "Visible Output": "Selected dataset card + grouped summary"},
      {"Question Pattern": "What is the average Endpoint1 change from baseline at Visit2?", "Routed Domain": "Labs", "Selected View": "lab_long_view", "Visible Output": "Generated SQL + visit-level summary"},
      {"Question Pattern": "What is the synthetic ORR by treatment arm?", "Routed Domain": "Efficacy", "Selected View": "efficacy_summary_view", "Visible Output": "Result table + interpretation"},
      {"Question Pattern": "Show adverse events by seriousness.", "Routed Domain": "Out of scope", "Selected View": "None", "Visible Output": "Blocked response + warning"}
    ]
  })
);

root.append(
  createCallout("How Routing Connects To Explainable Analytics", [
    "Selected dataset: chosen after routing narrows the semantic target.",
    "Routing decision: displayed directly in the Study Explorer.",
    "Generated SQL: constrained to the routed view instead of open-ended query generation.",
    "Interpretation: written after the result table, so the explanation stays tied to the actual answer."
  ])
);

display(root);
```

```js
display(renderPagePager("/ai/query-routing"));
```
