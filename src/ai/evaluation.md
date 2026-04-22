---
title: Evaluation
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

const benchmarks = await FileAttachment("../data/eval/benchmark-questions.json").json();
const totalCases = benchmarks.length;
const grouped = Array.from(
  benchmarks.reduce((map, item) => {
    const key = item.expected_intent;
    map.set(key, (map.get(key) ?? 0) + 1);
    return map;
  }, new Map())
).map(([intent, count]) => ({Domain: intent.replaceAll("_", " "), Questions: count}));
const showcaseRows = benchmarks.slice(0, 8).map((item) => ({
  ID: item.id,
  Question: item.question,
  Intent: item.expected_intent,
  Dataset: item.expected_dataset,
  Shape: item.expected_answer_shape
}));

ensureAISectionStyles();

const root = document.createElement("div");
root.className = "ai-section-page";

root.append(
  createAIPageHero({
    kicker: "Quality + Safety",
    title: "Evaluation",
    summary:
      "The public demo is intentionally constrained and tested. Evaluation focuses on whether the system routes questions correctly, selects the right dataset, preserves safe SQL boundaries, and returns an answer shape that matches the question in a way a visitor can understand.",
    pills: ["22 benchmark questions", "Safety-aware", "Dataset selection tested", "Public-demo bounded"]
  })
);

root.append(
  createStatGrid([
    {label: "Benchmark Questions", value: String(totalCases)},
    {label: "Routing Coverage", value: "Enrollment to efficacy"},
    {label: "Blocked Classes", value: "Safety + privacy + unsupported"},
    {label: "Primary Goal", value: "Trustworthy demo behavior"}
  ])
);

root.append(
  createFlow([
    {
      title: "Benchmark a realistic public-demo question",
      body: "Questions cover enrollment, demographics, labs, efficacy, and intentionally unsupported requests."
    },
    {
      title: "Check routing and dataset selection",
      body: "The system is scored on whether it lands in the expected domain and chooses a compatible dataset or view."
    },
    {
      title: "Check answer shape and failure mode",
      body: "The result should come back as a grouped table, single summary, blocked response, or other expected public-demo pattern."
    },
    {
      title: "Keep safety visible",
      body: "Unsafe or out-of-scope requests are blocked early, and empty-result behavior returns a helpful explanation rather than a confusing blank state."
    }
  ])
);

root.append(
  createCardGrid([
    {
      title: "What This Evaluation Is Good At",
      body:
        "It is strong at checking whether the demo stays within its lane: correct routing, correct dataset selection, readable answer shapes, and safe handling of unsupported questions."
    },
    {
      title: "What It Does Not Claim Yet",
      body:
        "It is not a production-grade model evaluation suite. The benchmark is curated and intentionally small because the goal is public-demo reliability, not exhaustive scientific coverage."
    },
    {
      title: "Why This Matters In A Demo",
      body:
        "Evaluation is part of the product story. The AI section is stronger when visitors can see that questions are tested, bounded, and scored before wider rollout."
    }
  ])
);

root.append(
  createTableSection({
    title: "Coverage By Domain",
    description: "The benchmark set spans supported domains and blocked cases.",
    columns: ["Domain", "Questions"],
    rows: grouped
  })
);

root.append(
  createTableSection({
    title: "Benchmark Examples",
    description: "Representative checks from the current public-demo benchmark set.",
    columns: ["ID", "Question", "Intent", "Dataset", "Shape"],
    rows: showcaseRows
  })
);

root.append(
  createCallout("What A Visitor Should Notice", [
    "The Study Explorer shows the routing decision, selected dataset, generated SQL, result table, interpretation, and warnings.",
    "The evaluation layer tests those same pieces instead of treating the answer text alone as success.",
    "The system is designed to fail safely when a question is outside the supported public-demo scope."
  ])
);

display(root);
```

```js
display(renderPagePager("/ai/evaluation"));
```
