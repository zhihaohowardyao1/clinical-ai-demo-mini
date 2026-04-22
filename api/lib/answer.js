function buildEmptyResultExplanation({question, selectedDataset, selectedView}) {
  return [
    `No rows were returned for the question "${question}" using ${selectedDataset}.`,
    `The current demo only supports synthetic data from ${selectedView}.`,
    "Try narrowing the request to a known treatment arm, visit, endpoint, or summary concept that exists in the demo."
  ].join(" ");
}

export function buildAnswerText({question, selectedDataset, selectedView, queryResult}) {
  const {rows = [], columns = []} = queryResult;
  if (!rows.length) {
    return buildEmptyResultExplanation({question, selectedDataset, selectedView});
  }

  const preview = rows
    .slice(0, 2)
    .map((row) =>
      columns
        .slice(0, 4)
        .map((column) => `${column}=${row[column]}`)
        .join(", ")
    )
    .join(" | ");

  return `Returned ${rows.length} row(s) from ${selectedDataset}. Preview: ${preview}.`;
}
