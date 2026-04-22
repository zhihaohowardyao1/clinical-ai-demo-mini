const VIEW_METADATA = {
  subject_summary_view: {
    purpose: "Subject-level demographic and baseline summary",
    columns: ["subject_id", "site_id", "treatment_arm", "sex", "age", "age_group", "race", "bmi", "flg1_flag", "flg2_flag"]
  },
  enrollment_status_view: {
    purpose: "Enrollment workflow and current status summary",
    columns: ["subject_id", "site_id", "treatment_arm", "consent_month", "screening_month", "procedure_month", "enrollment_status", "randomization_status"]
  },
  lab_long_view: {
    purpose: "Long-format visit and parameter measurements",
    columns: ["subject_id", "site_id", "treatment_arm", "visit", "visit_number", "parameter_code", "analysis_value", "baseline_aval", "change_from_baseline"]
  },
  efficacy_summary_view: {
    purpose: "Best-response and responder summary",
    columns: ["subject_id", "treatment_arm", "site_id", "flg1_flag", "flg2_flag", "parameter_code", "best_response", "response_group", "responder_flag"]
  },
  time_to_event_view: {
    purpose: "Time-to-event summary for synthetic efficacy outputs",
    columns: ["subject_id", "treatment_arm", "site_id", "flg1_flag", "flg2_flag", "endpoint_code", "time_to_event_months", "censor_flag", "event_observed_flag"]
  }
};

export function getViewMetadata(viewName) {
  return VIEW_METADATA[viewName] ?? {purpose: "Unknown", columns: []};
}

export function buildModelPrompt({question, target, selectedExamples, semanticLayer}) {
  const metadata = getViewMetadata(target.viewName);
  const businessTerms = semanticLayer.businessTerms?.business_terms ?? [];
  const metrics = semanticLayer.metricDefinitions?.metrics ?? [];

  return [
    "You are generating SQL for a synthetic clinical trial demo.",
    "Return exactly one read-only SQL query.",
    "Use only the selected view shown below.",
    "Do not use INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, COPY, ATTACH, DETACH, PRAGMA, or multiple statements.",
    "",
    `Question: ${question}`,
    `Selected dataset: ${target.datasetId}`,
    `Selected view: ${target.viewName}`,
    `View purpose: ${metadata.purpose}`,
    `Example columns: ${metadata.columns.join(", ")}`,
    "",
    "Relevant business terms:",
    ...businessTerms.slice(0, 10).map((term) => `- ${term.term}: ${term.description}`),
    "",
    "Relevant metrics:",
    ...metrics.slice(0, 10).map((metric) => `- ${metric.id}: ${metric.description}`),
    "",
    "Relevant example queries:",
    ...selectedExamples.map((example) => `- ${example.user_question}`),
    "",
    "SQL requirements:",
    `- Query only from ${target.viewName}`,
    "- Prefer simple aggregations and grouping when the question is summary-oriented",
    "- Include readable aliases when helpful",
    "- Limit the result to a practical number of rows if the query is detailed"
  ].join("\n");
}
