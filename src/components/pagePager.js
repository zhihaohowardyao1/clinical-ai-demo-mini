import {html} from "npm:htl";

const orderedPages = [
  {path: "/", label: "Clinical Trial Analytics + AI Demo"},
  {path: "/Enrollment-Monitoring", label: "Enrollment Monitoring"},
  {path: "/ADaM-Datasets", label: "ADaM Datasets"},
  {path: "/Master-Dataset", label: "Master Dataset"},
  {path: "/Descriptive-Statistics", label: "Descriptive Statistics"},
  {path: "/Summerized-Information", label: "Summarized Information"},
  {path: "/Efficacy-Analyses", label: "Efficacy Analyses"},
  {path: "/Demographic-Table", label: "Demographic Table"},
  {path: "/Primary-Table", label: "Primary Table"},
  {path: "/Followup-Table", label: "Visit Completion Table"},
  {path: "/ai/ai-study-explorer", label: "AI Study Explorer"},
  {path: "/ai/semantic-layer", label: "Semantic Layer"},
  {path: "/ai/query-routing", label: "Query Routing"},
  {path: "/ai/evaluation", label: "Evaluation"},
  {path: "/ai/architecture", label: "Architecture"},
  {path: "/About-Author", label: "About the Author"}
];

function normalizePath(path) {
  return path === "/" ? "/" : path.replace(/\/+$/, "");
}

export function renderPagePager(currentPath) {
  const path = normalizePath(currentPath);
  const index = orderedPages.findIndex((page) => page.path === path);
  if (index < 0) return html``;

  const prev = orderedPages[index - 1];
  const next = orderedPages[index + 1];

  return html`<hr class="native-page-pager-separator">
  <nav class="native-page-pager" aria-label="Page navigation">
    ${prev ? html`<a class="pager-card" rel="prev" href="${prev.path}"><span>${prev.label}</span></a>` : html`<span></span>`}
    ${next ? html`<a class="pager-card" rel="next" href="${next.path}"><span>${next.label}</span></a>` : html`<span></span>`}
  </nav>
  <style>
  .native-page-pager-separator {
    margin: 2.5rem 0 1rem;
  }

  .native-page-pager {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 1rem;
    margin: 3rem 0 1rem;
    max-width: 640px;
  }

  .native-page-pager .pager-card {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--theme-foreground-fainter);
    border-radius: 8px;
    padding: 1rem;
    line-height: 1rem;
    text-decoration: none;
    min-height: 72px;
  }

  .native-page-pager .pager-card span {
    font-size: 14px;
  }

  .native-page-pager .pager-card:hover {
    border-color: var(--theme-foreground-focus);
  }

  .native-page-pager .pager-card:hover span {
    text-decoration: underline;
  }

  .native-page-pager .pager-card[rel="prev"] {
    align-items: flex-start;
  }

  .native-page-pager .pager-card[rel="next"] {
    align-items: flex-end;
  }

  .native-page-pager .pager-card::before {
    color: var(--theme-foreground-faint);
    margin-bottom: 0.35rem;
    font-size: 12px;
  }

  .native-page-pager .pager-card[rel="prev"]::before {
    content: "Previous page";
  }

  .native-page-pager .pager-card[rel="next"]::before {
    content: "Next page";
  }
  </style>`;
}
