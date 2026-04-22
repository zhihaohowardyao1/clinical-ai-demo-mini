function makeNode(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function renderKeyValues(container, items) {
  container.innerHTML = "";
  for (const [label, value] of items) {
    const row = makeNode("div", "ai-explorer-kv");
    row.append(makeNode("span", "ai-explorer-kv-label", label));
    row.append(makeNode("span", "ai-explorer-kv-value", value ?? "n/a"));
    container.append(row);
  }
}

function renderCode(container, text) {
  container.innerHTML = "";
  const pre = makeNode("pre", "ai-explorer-code");
  const code = makeNode("code");
  code.textContent = text || "No SQL generated.";
  pre.append(code);
  container.append(pre);
}

function renderWarnings(container, warnings) {
  container.innerHTML = "";
  if (!warnings?.length) {
    container.append(makeNode("p", "ai-explorer-muted", "No warnings or fallback notes returned."));
    return;
  }
  const list = makeNode("ul", "ai-explorer-list");
  for (const warning of warnings) {
    list.append(makeNode("li", "", warning));
  }
  container.append(list);
}

function renderTable(container, columns, rows) {
  container.innerHTML = "";
  if (!columns?.length || !rows?.length) {
    container.append(makeNode("p", "ai-explorer-muted", "No rows returned."));
    return;
  }

  const wrap = makeNode("div", "ai-explorer-table-wrap");
  const table = makeNode("table", "ai-explorer-table");
  const thead = makeNode("thead");
  const headRow = makeNode("tr");
  for (const column of columns) {
    headRow.append(makeNode("th", "", column));
  }
  thead.append(headRow);
  table.append(thead);

  const tbody = makeNode("tbody");
  for (const row of rows) {
    const tr = makeNode("tr");
    for (const column of columns) {
      const td = makeNode("td");
      const value = row[column];
      td.textContent = value == null ? "" : String(value);
      tr.append(td);
    }
    tbody.append(tr);
  }
  table.append(tbody);
  wrap.append(table);
  container.append(wrap);
}

function createCard(title, description) {
  const card = makeNode("section", "ai-explorer-card");
  const header = makeNode("div", "ai-explorer-card-header");
  header.append(makeNode("h2", "ai-explorer-card-title", title));
  if (description) {
    header.append(makeNode("p", "ai-explorer-card-description", description));
  }
  const body = makeNode("div", "ai-explorer-card-body");
  card.append(header, body);
  return {card, body};
}

export function createAIStudyExplorer({apiPath = "/api/ask"} = {}) {
  const root = makeNode("div", "ai-explorer");

  const intro = makeNode("section", "ai-explorer-hero");
  intro.append(makeNode("p", "ai-explorer-kicker", "Explainable Analytics"));
  intro.append(makeNode("h1", "ai-explorer-title", "AI Study Explorer"));
  intro.append(
    makeNode(
      "p",
      "ai-explorer-description",
      "Ask a study question and inspect exactly how the demo answers it. The page keeps the selected dataset, routing decision, generated SQL, result table, interpretation, and fallback notes visible so a public audience can follow the full analytical path."
    )
  );
  const pillRow = makeNode("div", "ai-explorer-pill-row");
  ["Synthetic study data", "Visible routing", "Visible SQL", "Safe fallback"].forEach((pill) => {
    pillRow.append(makeNode("span", "ai-explorer-pill", pill));
  });
  intro.append(pillRow);

  const snapshot = makeNode("section", "ai-explorer-snapshot");
  function createSnapshotCard(label, value) {
    const card = makeNode("div", "ai-explorer-snapshot-card");
    const labelEl = makeNode("span", "ai-explorer-snapshot-label", label);
    const valueEl = makeNode("span", "ai-explorer-snapshot-value", value);
    card.append(labelEl, valueEl);
    snapshot.append(card);
    return valueEl;
  }
  createSnapshotCard("Coverage", "Enrollment, demographics, labs, efficacy");
  createSnapshotCard("Data engine", "Read-only DuckDB semantic views");
  const modeValue = createSnapshotCard("Execution mode", "Runtime default");

  const controls = makeNode("section", "ai-explorer-controls");
  const controlHeader = makeNode("div", "ai-explorer-controls-header");
  controlHeader.append(makeNode("h2", "ai-explorer-section-title", "1. Ask a Question"));
  controlHeader.append(
    makeNode(
      "p",
      "ai-explorer-card-description",
      "Try a question grounded in the synthetic study. The strongest public-demo questions ask about enrollment status, demographic summaries, lab trends, or efficacy summaries."
    )
  );

  const textarea = document.createElement("textarea");
  textarea.className = "ai-explorer-textarea";
  textarea.rows = 4;
  textarea.value = "What is the synthetic ORR by treatment arm?";

  const exampleRow = makeNode("div", "ai-explorer-example-row");
  [
    "What is the synthetic ORR by treatment arm?",
    "Show average age by sex in the synthetic cohort.",
    "What is the average Endpoint1 change from baseline at Visit2?",
    "How many subjects are approved, pending, or randomized by site?"
  ].forEach((example) => {
    const button = makeNode("button", "ai-explorer-example", example);
    button.type = "button";
    button.addEventListener("click", () => {
      textarea.value = example;
    });
    exampleRow.append(button);
  });

  const actionRow = makeNode("div", "ai-explorer-actions");
  const askButton = makeNode("button", "ai-explorer-button ai-explorer-button-primary", "Run Study Explorer");
  askButton.type = "button";

  const mockLabel = makeNode("label", "ai-explorer-toggle");
  const mockCheckbox = document.createElement("input");
  mockCheckbox.type = "checkbox";
  mockCheckbox.checked = false;
  mockLabel.append(mockCheckbox, makeNode("span", "", "Force mock mode"));

  const techLabel = makeNode("label", "ai-explorer-toggle");
  const techCheckbox = document.createElement("input");
  techCheckbox.type = "checkbox";
  techCheckbox.checked = true;
  techLabel.append(techCheckbox, makeNode("span", "", "Show technical details"));

  const statusLine = makeNode(
    "p",
    "ai-explorer-muted",
    "With Force mock mode off, the explorer follows the server runtime mode. In a public demo, that usually means auto mode: use a live provider when configured, otherwise continue in mock mode with safe fallback. The explorer queries server-side semantic views rather than browser-only simulation overrides."
  );

  actionRow.append(askButton, mockLabel, techLabel);
  controls.append(controlHeader, textarea, exampleRow, actionRow, statusLine);

  const routing = createCard("2. Routing Decision", "How the question was classified before SQL generation.");
  const dataset = createCard("3. Selected Dataset / View", "Which semantic target the backend chose for execution.");
  const sql = createCard("4. Generated SQL Preview", "Read-only SQL after provider generation and validation.");
  const results = createCard("5. Result Table", "Rows returned from the DuckDB demo database.");
  const interpretation = createCard("6. Interpretation", "A concise explanation of what the returned result means.");
  const warnings = createCard("7. Warnings / Fallback Notes", "Fallback behavior, provider notes, or safety hints.");

  const techSection = makeNode("div", "ai-explorer-technical");
  techSection.append(routing.card, dataset.card, sql.card);

  const errorBox = makeNode("div", "ai-explorer-error");
  errorBox.hidden = true;

  root.append(intro, snapshot, controls, errorBox, techSection, results.card, interpretation.card, warnings.card);

  function setBusy(isBusy) {
    askButton.disabled = isBusy;
    askButton.textContent = isBusy ? "Running..." : "Run Study Explorer";
  }

  function setTechnicalVisibility() {
    techSection.hidden = !techCheckbox.checked;
  }

  function updateModeStatus(payload) {
    const runtime = payload?.runtime ?? {};
    const providerMode = payload?.provider_mode ?? (runtime.live_configured ? "live" : "mock");
    const liveConfigured = Boolean(runtime.live_configured);
    const fallbackUsed = Boolean(payload?.provider_fallback);

    if (providerMode === "live" && !fallbackUsed) {
      modeValue.textContent = liveConfigured
        ? `Live mode · ${runtime.live_model ?? payload.provider_name ?? "configured provider"}`
        : "Live requested";
      return;
    }

    if (fallbackUsed) {
      modeValue.textContent = "Mock fallback after live provider issue";
      return;
    }

    modeValue.textContent = liveConfigured
      ? "Mock mode (manually selected)"
      : runtime.default_mode === "auto"
        ? "Auto mode resolved to mock"
        : "Mock mode (live provider not configured)";
  }

  async function runQuery() {
    const question = textarea.value.trim();
    if (!question) return;

    errorBox.hidden = true;
    errorBox.textContent = "";
    setBusy(true);

    try {
      const response = await fetch(apiPath, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          question,
          provider_mode: mockCheckbox.checked ? "mock" : "auto"
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "The study explorer request failed.");
      }

      renderKeyValues(routing.body, [
        ["Routing Reason", payload.routing_reason],
        ["Question", question]
      ]);

      renderKeyValues(dataset.body, [
        ["Selected Dataset", payload.selected_dataset],
        ["Selected View", payload.selected_view || "n/a"]
      ]);

      renderCode(sql.body, payload.generated_sql);
      renderTable(results.body, payload.columns, payload.rows);
      updateModeStatus(payload);
      interpretation.body.innerHTML = "";
      interpretation.body.append(
        makeNode(
          "p",
          "",
          payload.answer_text || "No interpretation text was returned."
        )
      );
      renderWarnings(warnings.body, payload.warnings);
    } catch (error) {
      errorBox.hidden = false;
      errorBox.textContent = error.message;
      updateModeStatus({provider_mode: "mock", provider_fallback: true, runtime: {live_configured: false}});
      interpretation.body.innerHTML = "";
      interpretation.body.append(
        makeNode(
          "p",
          "",
          "The explorer could not return a result. Try mock mode, simplify the question, or choose one of the example prompts."
        )
      );
      results.body.innerHTML = "";
      results.body.append(makeNode("p", "ai-explorer-muted", "No result table available."));
      renderWarnings(warnings.body, [error.message]);
    } finally {
      setBusy(false);
    }
  }

  askButton.addEventListener("click", runQuery);
  techCheckbox.addEventListener("change", setTechnicalVisibility);
  setTechnicalVisibility();

  root.append(
    Object.assign(document.createElement("style"), {
      textContent: `
        .ai-explorer {
          display: grid;
          gap: 1.25rem;
        }

        .ai-explorer-hero,
        .ai-explorer-controls,
        .ai-explorer-card,
        .ai-explorer-error {
          border: 1px solid var(--theme-foreground-fainter);
          border-radius: 16px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 249, 252, 0.92));
          padding: 1.2rem 1.3rem;
        }

        .ai-explorer-kicker {
          margin: 0 0 0.35rem;
          font: 600 0.78rem/1.2 var(--sans-serif);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--theme-foreground-muted);
        }

        .ai-explorer-title,
        .ai-explorer-card-title,
        .ai-explorer-section-title {
          margin: 0;
        }

        .ai-explorer-description,
        .ai-explorer-card-description,
        .ai-explorer-muted {
          color: var(--theme-foreground-muted);
        }

        .ai-explorer-pill-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem;
          margin-top: 0.9rem;
        }

        .ai-explorer-pill {
          display: inline-flex;
          align-items: center;
          padding: 0.44rem 0.72rem;
          border-radius: 999px;
          border: 1px solid #d7e4ee;
          background: #edf3f8;
          color: #34516a;
          font: 600 0.82rem/1 var(--sans-serif);
        }

        .ai-explorer-snapshot {
          display: grid;
          gap: 0.85rem;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        }

        .ai-explorer-snapshot-card {
          border: 1px solid var(--theme-foreground-fainter);
          border-radius: 16px;
          background: white;
          padding: 0.95rem 1rem;
        }

        .ai-explorer-snapshot-label {
          display: block;
          margin-bottom: 0.35rem;
          color: #6b7886;
          font: 600 0.78rem/1.2 var(--sans-serif);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .ai-explorer-snapshot-value {
          display: block;
          color: #26313d;
          font: 600 0.95rem/1.35 var(--sans-serif);
        }

        .ai-explorer-textarea {
          width: 100%;
          resize: vertical;
          min-height: 110px;
          padding: 0.9rem 1rem;
          font: inherit;
          border-radius: 14px;
          border: 1px solid var(--theme-foreground-fainter);
          background: white;
          box-sizing: border-box;
        }

        .ai-explorer-example-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem;
          margin-top: 0.9rem;
        }

        .ai-explorer-example {
          border: 1px solid #d7e4ee;
          border-radius: 999px;
          background: white;
          color: #37516a;
          font: 600 0.8rem/1.2 var(--sans-serif);
          padding: 0.48rem 0.72rem;
          cursor: pointer;
        }

        .ai-explorer-example:hover {
          background: #f2f7fb;
        }

        .ai-explorer-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem 1rem;
          align-items: center;
          margin-top: 1rem;
        }

        .ai-explorer-button {
          border: 0;
          border-radius: 999px;
          padding: 0.8rem 1.15rem;
          font: 600 0.95rem var(--sans-serif);
          cursor: pointer;
        }

        .ai-explorer-button-primary {
          color: white;
          background: #1e4865;
        }

        .ai-explorer-button:disabled {
          opacity: 0.65;
          cursor: wait;
        }

        .ai-explorer-toggle {
          display: inline-flex;
          gap: 0.5rem;
          align-items: center;
          font: 500 0.92rem var(--sans-serif);
        }

        .ai-explorer-technical {
          display: grid;
          gap: 1rem;
        }

        .ai-explorer-card-header {
          display: grid;
          gap: 0.35rem;
          margin-bottom: 0.75rem;
        }

        .ai-explorer-kv {
          display: grid;
          grid-template-columns: minmax(140px, 220px) 1fr;
          gap: 0.6rem;
          padding: 0.55rem 0;
          border-bottom: 1px solid var(--theme-foreground-fainter);
        }

        .ai-explorer-kv:last-child {
          border-bottom: 0;
        }

        .ai-explorer-kv-label {
          font-weight: 600;
        }

        .ai-explorer-code {
          margin: 0;
          padding: 0.9rem 1rem;
          border-radius: 14px;
          overflow-x: auto;
          background: #f6f8fb;
          border: 1px solid var(--theme-foreground-fainter);
          font-size: 0.9rem;
        }

        .ai-explorer-table-wrap {
          overflow: auto;
          border: 1px solid var(--theme-foreground-fainter);
          border-radius: 14px;
          background: white;
        }

        .ai-explorer-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.92rem;
        }

        .ai-explorer-table th,
        .ai-explorer-table td {
          padding: 0.7rem 0.8rem;
          border-bottom: 1px solid var(--theme-foreground-fainter);
          text-align: left;
          vertical-align: top;
          white-space: nowrap;
        }

        .ai-explorer-table th {
          background: #f6f8fb;
          position: sticky;
          top: 0;
        }

        .ai-explorer-list {
          margin: 0;
          padding-left: 1.2rem;
        }

        .ai-explorer-error {
          color: #8b1e3f;
          background: rgba(248, 232, 237, 0.95);
          border-color: rgba(139, 30, 63, 0.18);
        }
      `
    })
  );

  void runQuery();
  return root;
}
