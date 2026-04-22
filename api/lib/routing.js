const DOMAIN_TO_TARGET = {
  enrollment: {
    datasetId: "enrollment_events",
    viewName: "enrollment_status_view"
  },
  demographics: {
    datasetId: "adsl_subject_level",
    viewName: "subject_summary_view"
  },
  lab_summaries: {
    datasetId: "adlb_labs_long",
    viewName: "lab_long_view"
  },
  efficacy_summaries: {
    datasetId: "adrs_response",
    viewName: "efficacy_summary_view"
  }
};

const TOKEN_SPLIT_RE = /[^a-z0-9_]+/i;

export function tokenize(text) {
  return text
    .toLowerCase()
    .split(TOKEN_SPLIT_RE)
    .map((token) => token.trim())
    .filter(Boolean);
}

function scoreTermOverlap(question, terms = []) {
  const lower = question.toLowerCase();
  return terms.reduce((score, term) => (lower.includes(term.toLowerCase()) ? score + 1 : score), 0);
}

export function classifyQuestion(question, routingRulesDoc) {
  const lower = question.toLowerCase();

  if (/(screening|approval|approved|procedure|pending procedure|roll-in|randomized)/i.test(lower)) {
    return {
      domain: "enrollment",
      recommendedPage: "Enrollment-Monitoring",
      score: 997,
      reason: "Matched enrollment workflow terms such as screening, approval, procedure, roll-in, or randomized.",
      warnings: []
    };
  }

  if (/(orr|response|bestresp|pfs|survival|time to event|censor|adtte|adrs)/i.test(lower)) {
    return {
      domain: "efficacy_summaries",
      recommendedPage: "Efficacy-Analyses",
      score: 999,
      reason: "Matched efficacy-specific terms such as ORR, response, PFS, or time-to-event.",
      warnings: []
    };
  }

  if (/(visit|endpoint|aval|baseline|change from baseline|lab summary)/i.test(lower)) {
    return {
      domain: "lab_summaries",
      recommendedPage: "Descriptive-Statistics",
      recommendedPages: ["Descriptive-Statistics", "Summerized-Information", "Primary-Table"],
      score: 998,
      reason: "Matched lab-summary terms such as visit, endpoint, AVAL, or change from baseline.",
      warnings: []
    };
  }

  const rules = routingRulesDoc?.routing_rules ?? [];
  const ranked = rules
    .map((rule) => ({
      rule,
      score: scoreTermOverlap(question, rule.when?.any_terms ?? [])
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) {
    return {
      domain: "general_navigation",
      recommendedPage: "index",
      score: 0,
      reason: "No strong keyword match was found, so the question was routed to general navigation.",
      warnings: ["Routing confidence is low; fallback routing was used."]
    };
  }

  const winner = ranked[0].rule.route_to;
  return {
    domain: winner.domain,
    recommendedPage: winner.recommended_page ?? winner.recommended_pages?.[0] ?? "index",
    recommendedPages: winner.recommended_pages ?? [],
    score: ranked[0].score,
    reason: `Matched routing terms from the ${winner.domain} rule.`,
    warnings: ranked.length > 1 ? ["Multiple routing rules matched; the highest-scoring rule was selected."] : []
  };
}

export function selectTarget(question, routing) {
  if (routing.domain === "lab_summaries") {
    const lower = question.toLowerCase();
    if (/(change from baseline|baseline change)/i.test(lower)) {
      return {
        datasetId: "master_subject_analysis",
        viewName: "lab_long_view"
      };
    }
  }

  if (routing.domain === "efficacy_summaries") {
    const lower = question.toLowerCase();
    if (/(time|survival|pfs|event|censor)/i.test(lower)) {
      return {
        datasetId: "adtte_time_to_event",
        viewName: "time_to_event_view"
      };
    }

    return {
      datasetId: "adrs_response",
      viewName: "efficacy_summary_view"
    };
  }

  return DOMAIN_TO_TARGET[routing.domain] ?? {
    datasetId: "adsl_subject_level",
    viewName: "subject_summary_view"
  };
}

export function selectRelevantExamples(question, exampleQueriesDoc, domain, datasetId, limit = 3) {
  const examples = exampleQueriesDoc?.example_queries ?? [];
  return examples
    .map((example) => {
      let score = 0;
      if (example.domain === domain) score += 4;
      if ((example.semantic_targets?.datasets ?? []).includes(datasetId)) score += 3;
      score += scoreTermOverlap(question, tokenize(example.user_question));
      return {example, score};
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.example);
}
