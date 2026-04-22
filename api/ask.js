import crypto from "node:crypto";
import {buildAnswerText} from "./lib/answer.js";
import {executeSqlAgainstDemoDb} from "./lib/duckdb.js";
import {createLogger} from "./lib/logger.js";
import {buildModelPrompt} from "./lib/prompt.js";
import {createModelProvider, getPublicRuntimeStatus, ProviderRuntimeError} from "./lib/provider.js";
import {classifyQuestion, selectRelevantExamples, selectTarget} from "./lib/routing.js";
import {detectOutOfScopeQuestion} from "./lib/safety.js";
import {loadSemanticLayer} from "./lib/semanticLayer.js";
import {validateGeneratedSql} from "./lib/sqlValidation.js";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {"Content-Type": "application/json; charset=utf-8"}
  });
}

function buildOutOfScopeResponse(question, reason) {
  const runtime = getPublicRuntimeStatus();
  return {
    answer_text: `The question "${question}" is outside the scope of this demo. ${reason} Try asking about enrollment, demographics, lab summaries, or efficacy summaries instead.`,
    routing_domain: "out_of_scope",
    selected_dataset: null,
    selected_view: null,
    routing_reason: "The question was blocked by the public demo safety and scope layer.",
    generated_sql: null,
    columns: [],
    rows: [],
    warnings: [reason],
    provider_mode: runtime.live_configured && runtime.default_mode !== "mock" ? "live" : "mock",
    provider_name: null,
    provider_fallback: false,
    runtime
  };
}

async function parseQuestion(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new Error("Request body must be valid JSON.");
  }

  const question = body?.question?.trim?.();
  if (!question) {
    throw new Error("Field 'question' is required.");
  }
  return {
    question,
    providerMode: ["mock", "live", "auto", "online"].includes(body?.provider_mode)
      ? body.provider_mode
      : undefined
  };
}

function buildErrorStatus(error) {
  if (error instanceof ProviderRuntimeError) {
    return error.status ?? 503;
  }
  if (/required|valid json|method not allowed/i.test(error.message)) {
    return 400;
  }
  if (/Generated SQL|forbidden|allowed view|single statement|SELECT \*/i.test(error.message)) {
    return 422;
  }
  return 500;
}

export async function handleAsk(request) {
  const requestId = crypto.randomUUID();
  const logger = createLogger(requestId);

  if (request.method !== "POST") {
    return jsonResponse({error: "Method not allowed."}, 405);
  }

  try {
    const runtime = getPublicRuntimeStatus();
    const {question, providerMode} = await parseQuestion(request);
    logger.info("Received question", {question});

    const scopeCheck = detectOutOfScopeQuestion(question);
    if (scopeCheck.outOfScope) {
      logger.warn("Question rejected as out of scope", {reason: scopeCheck.reason});
      return jsonResponse(buildOutOfScopeResponse(question, scopeCheck.reason), 200);
    }

    const semanticLayer = await loadSemanticLayer();
    const routing = classifyQuestion(question, semanticLayer.routingRules);
    const target = selectTarget(question, routing);
    const selectedExamples = selectRelevantExamples(
      question,
      semanticLayer.exampleQueries,
      routing.domain,
      target.datasetId
    );

    logger.info("Routing complete", {
      domain: routing.domain,
      datasetId: target.datasetId,
      viewName: target.viewName
    });

    const prompt = buildModelPrompt({
      question,
      target,
      selectedExamples,
      semanticLayer
    });

    const provider = createModelProvider({modeOverride: providerMode});
    const generation = await provider.generateSql({
      question,
      prompt,
      target,
      selectedExamples,
      semanticLayer
    });

    logger.info("SQL generated", {
      provider: generation.providerName,
      generatedSql: generation.generatedSql
    });

    const validated = validateGeneratedSql(generation.generatedSql, target.viewName);
    const queryResult = await executeSqlAgainstDemoDb(validated.safeSql);

    logger.info("SQL executed", {
      columnCount: queryResult.columns?.length ?? 0,
      rowCount: queryResult.rows?.length ?? 0
    });

    const warnings = [
      ...(routing.warnings ?? []),
      ...(generation.warnings ?? []),
      ...(queryResult.warnings ?? [])
    ];

    if (!queryResult.rows?.length) {
      warnings.push("No rows were returned. The user may need a narrower question or a supported demo concept.");
    }

    return jsonResponse({
      answer_text: buildAnswerText({
        question,
        selectedDataset: target.datasetId,
        selectedView: target.viewName,
        queryResult
      }),
      routing_domain: routing.domain,
      selected_dataset: target.datasetId,
      selected_view: target.viewName,
      routing_reason: routing.reason,
      generated_sql: validated.normalizedSql,
      columns: queryResult.columns ?? [],
      rows: queryResult.rows ?? [],
      warnings,
      provider_mode: generation.providerMode ?? "mock",
      provider_name: generation.providerName ?? null,
      provider_fallback: Boolean(generation.fallbackUsed),
      provider_fallback_reason: generation.fallbackReason ?? null,
      runtime
    });
  } catch (error) {
    logger.error("Request failed", {error: error.message});
    const runtime = getPublicRuntimeStatus();
    return jsonResponse(
      {
        error: error.message,
        answer_text: null,
        routing_domain: null,
        selected_dataset: null,
        routing_reason: null,
        generated_sql: null,
        columns: [],
        rows: [],
        warnings: ["The request could not be completed."],
        provider_mode: runtime.live_configured && runtime.default_mode !== "mock" ? "live" : "mock",
        provider_name: null,
        provider_fallback: false,
        provider_fallback_reason: null,
        runtime
      },
      buildErrorStatus(error)
    );
  }
}

export default async function handler(request) {
  return handleAsk(request);
}
