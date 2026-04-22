const OUT_OF_SCOPE_PATTERNS = [
  {
    pattern: /\b(adverse events?|serious adverse events?|safety events?|toxicit(?:y|ies)|ae|sae)\b/i,
    reason: "The current demo does not include an adverse event or safety dataset."
  },
  {
    pattern: /\b(dose|doses|dosing|exposure|exposures|concomitant medications?|medications?)\b/i,
    reason: "The current demo does not model dosing, exposure, or medication detail."
  },
  {
    pattern: /\b(address(?:es)?|emails?|phones?|ssn|social security|dob|date of birth|identifiers?)\b/i,
    reason: "The demo is synthetic and does not support personally identifying information."
  },
  {
    pattern: /\b(costs?|revenue|billing|claims?|payments?)\b/i,
    reason: "The current demo is limited to synthetic enrollment, demographics, labs, and efficacy."
  },
  {
    pattern: /\b(protocol deviations?|medical histories|medical history|comorbidit(?:y|ies)|eligibility criteria|eligibility criterion)\b/i,
    reason: "That topic is outside the current synthetic demo scope."
  }
];

const SQL_OUT_OF_SCOPE_PATTERNS = [
  /\bduckdb_tables\b/i,
  /\binformation_schema\b/i,
  /\bpg_catalog\b/i,
  /\bsqlite_master\b/i,
  /\bpatient_name\b/i,
  /\bemail\b/i,
  /\bphone\b/i,
  /\baddress\b/i,
  /\badverse_event\b/i,
  /\bmedication\b/i,
  /\bdose\b/i
];

export function detectOutOfScopeQuestion(question) {
  for (const rule of OUT_OF_SCOPE_PATTERNS) {
    if (rule.pattern.test(question)) {
      return {
        outOfScope: true,
        reason: rule.reason
      };
    }
  }

  return {
    outOfScope: false,
    reason: null
  };
}

export function containsOutOfScopeSqlTerms(sql) {
  return SQL_OUT_OF_SCOPE_PATTERNS.some((pattern) => pattern.test(sql));
}
