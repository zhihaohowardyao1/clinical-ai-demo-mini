function cell(tag, text, className = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text != null) element.textContent = String(text);
  return element;
}

function ensureStyles() {
  if (document.getElementById("submission-table-styles")) return;
  const style = document.createElement("style");
  style.id = "submission-table-styles";
  style.textContent = `
    .submission-table-shell {
      margin: 1rem 0 2rem;
      overflow-x: auto;
    }
    .submission-table {
      width: 100%;
      border-collapse: collapse;
      font-family: var(--sans-serif);
      font-size: 0.95rem;
    }
    .submission-table th,
    .submission-table td {
      padding: 0.5rem 0.7rem;
      border-bottom: 1px solid var(--theme-foreground-fainter);
      vertical-align: middle;
      text-align: center;
    }
    .submission-table thead th {
      font-weight: 700;
      background: rgba(0, 0, 0, 0.03);
    }
    .submission-table td:first-child,
    .submission-table th:first-child {
      text-align: left;
    }
    .submission-table .row-section td {
      font-weight: 700;
      background: rgba(0, 0, 0, 0.02);
    }
    .submission-table .row-sub td:first-child {
      padding-left: 1.2rem;
    }
    .submission-table .cell-muted {
      color: var(--theme-foreground-muted);
    }
    .submission-table .cell-accent {
      color: #ff6b00;
      font-weight: 600;
    }
    .submission-note {
      color: var(--theme-foreground-muted);
      font-size: 0.92rem;
      margin: 0.5rem 0 1rem;
    }
  `;
  document.head.append(style);
}

export function renderSubmissionTable({columns, rows}) {
  ensureStyles();
  const shell = cell("div", null, "submission-table-shell");
  const table = cell("table", null, "submission-table");
  const thead = cell("thead");
  const headerRow = cell("tr");

  for (const column of columns) {
    headerRow.append(cell("th", column.label));
  }
  thead.append(headerRow);

  const tbody = cell("tbody");
  for (const row of rows) {
    const tr = cell("tr", null, row.className || "");
    for (const column of columns) {
      const td = cell("td", row[column.key], row[`${column.key}Class`] || "");
      tr.append(td);
    }
    tbody.append(tr);
  }

  table.append(thead, tbody);
  shell.append(table);
  return shell;
}
