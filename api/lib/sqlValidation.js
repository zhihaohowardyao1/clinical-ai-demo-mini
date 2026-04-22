import {containsOutOfScopeSqlTerms} from "./safety.js";

const BANNED_KEYWORDS = /\b(insert|update|delete|drop|alter|create|copy|attach|detach|pragma|call|export|import|vacuum|replace|truncate)\b/i;
const COMMENT_RE = /(--.*$)|\/\*[\s\S]*?\*\//gm;

function normalizeSql(sql) {
  return sql.replace(COMMENT_RE, " ").replace(/\s+/g, " ").trim();
}

function extractReferencedRelations(sql) {
  const relations = [];
  const re = /\b(from|join)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
  for (const match of sql.matchAll(re)) {
    relations.push(match[2]);
  }
  return relations;
}

export function validateGeneratedSql(sql, allowedView) {
  if (!sql || typeof sql !== "string") {
    throw new Error("Generated SQL is empty.");
  }

  const normalized = normalizeSql(sql);
  if (!normalized) {
    throw new Error("Generated SQL is empty after normalization.");
  }

  if (BANNED_KEYWORDS.test(normalized)) {
    throw new Error("Generated SQL contains a forbidden keyword.");
  }

  if (normalized.includes(";")) {
    throw new Error("Generated SQL must contain a single statement without semicolons.");
  }

  const startsWithSelect = /^(select|with)\b/i.test(normalized);
  if (!startsWithSelect) {
    throw new Error("Generated SQL must start with SELECT or WITH.");
  }

  if (containsOutOfScopeSqlTerms(normalized)) {
    throw new Error("Generated SQL referenced out-of-scope or restricted terms.");
  }

  if (/\bselect\s+\*/i.test(normalized)) {
    throw new Error("Generated SQL must select explicit columns rather than SELECT *.");
  }

  const relations = extractReferencedRelations(normalized);
  if (!relations.length || !relations.every((relation) => relation === allowedView)) {
    throw new Error(`Generated SQL must query only from the allowed view: ${allowedView}.`);
  }

  const safeSql = `SELECT * FROM (${normalized}) AS validated_result LIMIT 200`;
  return {normalizedSql: normalized, safeSql};
}
