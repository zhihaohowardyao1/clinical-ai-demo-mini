---
title: Semantic Layer
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
    kicker: "AI Foundations",
    title: "Semantic Layer",
    summary:
      "The semantic layer translates synthetic clinical data into public-demo language. It gives the AI experience stable names for datasets, metrics, business terms, and example questions so a plain-language question can become an explainable answer without exposing visitors to raw source complexity.",
    pills: ["Vendor-neutral", "Synthetic-only", "Human-readable", "Supports routing + SQL"]
  })
);

root.append(
  createStatGrid([
    {label: "Semantic Files", value: "7"},
    {label: "Demo Domains", value: "4"},
    {label: "AI Views", value: "5"},
    {label: "Primary Use", value: "Question grounding"}
  ])
);

root.append(
  createCardGrid([
    {
      title: "What This Means For A Visitor",
      body:
        "A visitor does not need to know raw field names like TRTEMFL or ADLB. The semantic layer gives the AI experience readable concepts such as treatment arm, objective response rate, lab summary, and enrollment status."
    },
    {
      title: "What It Means For The Demo",
      body:
        "The same semantic contract supports dataset selection, query routing, generated SQL prompts, and interpretation text. That keeps the public demo coherent across pages instead of making each answer feel handcrafted."
    },
    {
      title: "Why It Is Safe To Show Publicly",
      body:
        "The definitions are grounded in synthetic study content only. They are realistic enough to explain the product, but they do not claim to represent real subjects, real outcomes, or production governance."
    }
  ])
);

root.append(
  createFlow([
    {
      title: "User question enters in natural language",
      body: "The demo receives a plain-language question such as ORR by arm, average age by sex, or mean Endpoint1 change at Visit2."
    },
    {
      title: "Business terms anchor the intent",
      body: "The semantic layer maps phrases like treatment arm, responder, or visit to stable project vocabulary."
    },
    {
      title: "Datasets and metrics narrow the query space",
      body: "The backend chooses a view and a small set of relevant metrics, columns, and example questions."
    },
    {
      title: "Explainable answer stays traceable",
      body: "The selected dataset, routing decision, generated SQL, result table, and interpretation all stay aligned to the same semantic contract."
    }
  ])
);

root.append(
  createTableSection({
    title: "Semantic Catalog",
    description: "These files work together to make the AI area understandable, routable, and demo-safe.",
    columns: ["File", "Role", "Public-Demo Value"],
    rows: [
      {File: "datasets.yaml", Role: "Logical catalog of available data assets", "Public-Demo Value": "Shows what each dataset represents and at what grain it can answer questions."},
      {File: "business_terms.yaml", Role: "Human-facing vocabulary", "Public-Demo Value": "Connects study language to technical fields without exposing visitors to raw source complexity."},
      {File: "metric_definitions.yaml", Role: "Reusable metric meanings", "Public-Demo Value": "Keeps ORR, enrolled count, age summaries, and other measures consistent across pages."},
      {File: "sql_expressions.yaml", Role: "Reference logic patterns", "Public-Demo Value": "Documents how readable concepts such as treatment arm or baseline flags map into query logic."},
      {File: "example_queries.yaml", Role: "Prompt-to-answer examples", "Public-Demo Value": "Helps the explorer stay understandable by showing the kinds of questions the demo is built to answer."},
      {File: "routing_rules.yaml", Role: "Intent routing guidance", "Public-Demo Value": "Supports the visible routing decision shown in the Study Explorer."},
      {File: "dynamic_instructions.yaml", Role: "Answer-style and safety rules", "Public-Demo Value": "Keeps generated answers public-demo friendly, bounded, and readable."}
    ]
  })
);

root.append(
  createTableSection({
    title: "Core Semantic Targets",
    description: "The current demo keeps scope intentionally narrow so the explainable flow is easy to understand.",
    columns: ["Domain", "Typical Questions", "Primary View", "Example Output"],
    rows: [
      {Domain: "Enrollment", "Typical Questions": "How many subjects are approved, pending, or randomized by site?", "Primary View": "enrollment_status_view", "Example Output": "Grouped status table"},
      {Domain: "Demographics", "Typical Questions": "What is average age by sex or treatment arm?", "Primary View": "subject_summary_view", "Example Output": "Grouped summary table"},
      {Domain: "Labs", "Typical Questions": "What is the average Endpoint1 change from baseline at Visit2?", "Primary View": "lab_long_view", "Example Output": "Visit-level summary"},
      {Domain: "Efficacy", "Typical Questions": "What is the synthetic ORR by treatment arm?", "Primary View": "efficacy_summary_view", "Example Output": "Rate summary or grouped table"}
    ]
  })
);

root.append(
  createCallout("What To Look For In The AI Demo", [
    "The selected dataset card shows which semantic target answered the question.",
    "The routing decision explains why the question landed in enrollment, demographics, labs, or efficacy.",
    "The SQL preview stays readable because the semantic layer narrows the allowed query space before generation."
  ])
);

display(root);
```

```js
display(renderPagePager("/ai/semantic-layer"));
```
