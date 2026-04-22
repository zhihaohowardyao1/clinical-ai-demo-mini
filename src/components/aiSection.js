function node(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text != null) el.textContent = text;
  return el;
}

let stylesAttached = false;

export function ensureAISectionStyles() {
  if (stylesAttached) return;
  stylesAttached = true;

  const style = document.createElement("style");
  style.textContent = `
    .ai-section-page {
      display: grid;
      gap: 1.25rem;
    }

    .ai-section-hero,
    .ai-section-card,
    .ai-section-callout,
    .ai-section-table,
    .ai-section-panel {
      border: 1px solid var(--theme-foreground-fainter);
      border-radius: 18px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 249, 252, 0.95));
      padding: 1.15rem 1.2rem;
    }

    .ai-section-kicker {
      margin: 0 0 0.35rem;
      font: 700 0.76rem/1.2 var(--sans-serif);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #5e6f80;
    }

    .ai-section-title {
      margin: 0;
      font: 700 clamp(1.85rem, 2.7vw, 2.7rem)/1.05 var(--serif);
      color: #26313d;
    }

    .ai-section-summary,
    .ai-section-subtle,
    .ai-section-card p,
    .ai-section-callout p {
      color: var(--theme-foreground-muted);
    }

    .ai-section-pill-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.55rem;
      margin-top: 0.95rem;
    }

    .ai-section-pill {
      display: inline-flex;
      align-items: center;
      padding: 0.45rem 0.7rem;
      border-radius: 999px;
      background: #edf3f8;
      border: 1px solid #d7e4ee;
      color: #34516a;
      font: 600 0.86rem/1 var(--sans-serif);
    }

    .ai-section-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    }

    .ai-section-card h2,
    .ai-section-card h3,
    .ai-section-panel h2,
    .ai-section-panel h3,
    .ai-section-callout h2,
    .ai-section-callout h3 {
      margin: 0 0 0.35rem;
      font: 700 1.02rem/1.2 var(--sans-serif);
      color: #26313d;
    }

    .ai-section-stat-grid {
      display: grid;
      gap: 0.8rem;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    }

    .ai-section-stat {
      padding: 0.95rem 1rem;
      border-radius: 16px;
      background: white;
      border: 1px solid #e0e7ef;
    }

    .ai-section-stat-label {
      display: block;
      margin-bottom: 0.35rem;
      color: #6b7886;
      font: 600 0.8rem/1.2 var(--sans-serif);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .ai-section-stat-value {
      display: block;
      color: #26313d;
      font: 700 1.5rem/1.05 var(--sans-serif);
    }

    .ai-section-flow {
      display: grid;
      gap: 0.8rem;
    }

    .ai-section-step {
      display: grid;
      gap: 0.5rem;
      grid-template-columns: 40px 1fr;
      align-items: start;
      padding: 0.9rem 1rem;
      border-radius: 16px;
      background: white;
      border: 1px solid #e0e7ef;
    }

    .ai-section-step-index {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      color: white;
      background: #1e4865;
      font: 700 0.98rem/1 var(--sans-serif);
    }

    .ai-section-step h3 {
      margin: 0 0 0.2rem;
      font: 700 1rem/1.2 var(--sans-serif);
    }

    .ai-section-step p {
      margin: 0;
    }

    .ai-section-table {
      overflow: auto;
    }

    .ai-section-table h2 {
      margin: 0 0 0.25rem;
      font: 700 1.04rem/1.2 var(--sans-serif);
      color: #26313d;
    }

    .ai-section-table p {
      margin: 0 0 0.9rem;
      color: var(--theme-foreground-muted);
    }

    .ai-section-table table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 14px;
      overflow: hidden;
    }

    .ai-section-table th,
    .ai-section-table td {
      padding: 0.72rem 0.8rem;
      border-bottom: 1px solid #e6edf3;
      text-align: left;
      vertical-align: top;
    }

    .ai-section-table th {
      background: #f5f8fb;
      color: #32495f;
      font: 700 0.86rem/1.2 var(--sans-serif);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .ai-section-callout {
      border-left: 6px solid #1e4865;
      background: linear-gradient(180deg, rgba(244, 249, 253, 0.98), rgba(255, 255, 255, 0.98));
    }

    .ai-section-list {
      margin: 0;
      padding-left: 1.15rem;
    }

    .ai-section-list li + li {
      margin-top: 0.45rem;
    }
  `;
  document.head.append(style);
}

export function createAIPageHero({kicker, title, summary, pills = []}) {
  ensureAISectionStyles();
  const hero = node("section", "ai-section-hero");
  if (kicker) hero.append(node("p", "ai-section-kicker", kicker));
  hero.append(node("h1", "ai-section-title", title));
  if (summary) hero.append(node("p", "ai-section-summary", summary));

  if (pills.length) {
    const row = node("div", "ai-section-pill-row");
    pills.forEach((pill) => row.append(node("span", "ai-section-pill", pill)));
    hero.append(row);
  }
  return hero;
}

export function createCardGrid(cards = []) {
  ensureAISectionStyles();
  const grid = node("section", "ai-section-grid");
  cards.forEach(({title, body}) => {
    const card = node("article", "ai-section-card");
    card.append(node("h2", "", title));
    if (typeof body === "string") {
      card.append(node("p", "", body));
    } else if (body instanceof Node) {
      card.append(body);
    } else if (Array.isArray(body)) {
      const list = node("ul", "ai-section-list");
      body.forEach((item) => list.append(node("li", "", item)));
      card.append(list);
    }
    grid.append(card);
  });
  return grid;
}

export function createStatGrid(stats = []) {
  ensureAISectionStyles();
  const grid = node("section", "ai-section-stat-grid");
  stats.forEach(({label, value}) => {
    const card = node("div", "ai-section-stat");
    card.append(node("span", "ai-section-stat-label", label));
    card.append(node("span", "ai-section-stat-value", value));
    grid.append(card);
  });
  return grid;
}

export function createFlow(steps = []) {
  ensureAISectionStyles();
  const wrap = node("section", "ai-section-flow");
  steps.forEach((step, index) => {
    const row = node("article", "ai-section-step");
    row.append(node("div", "ai-section-step-index", String(index + 1)));
    const body = node("div");
    body.append(node("h3", "", step.title));
    body.append(node("p", "", step.body));
    row.append(body);
    wrap.append(row);
  });
  return wrap;
}

export function createCallout(title, body) {
  ensureAISectionStyles();
  const card = node("section", "ai-section-callout");
  card.append(node("h2", "", title));
  if (Array.isArray(body)) {
    const list = node("ul", "ai-section-list");
    body.forEach((item) => list.append(node("li", "", item)));
    card.append(list);
  } else {
    card.append(node("p", "", body));
  }
  return card;
}

export function createTableSection({title, description, columns, rows}) {
  ensureAISectionStyles();
  const wrap = node("section", "ai-section-table");
  if (title) wrap.append(node("h2", "", title));
  if (description) wrap.append(node("p", "", description));

  const table = node("table");
  const thead = node("thead");
  const headRow = node("tr");
  columns.forEach((column) => headRow.append(node("th", "", column)));
  thead.append(headRow);
  table.append(thead);

  const tbody = node("tbody");
  rows.forEach((row) => {
    const tr = node("tr");
    columns.forEach((column) => {
      const td = node("td");
      td.textContent = row[column] == null ? "" : String(row[column]);
      tr.append(td);
    });
    tbody.append(tr);
  });
  table.append(tbody);
  wrap.append(table);
  return wrap;
}
