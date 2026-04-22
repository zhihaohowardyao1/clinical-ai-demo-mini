import {getProviderRuntimeConfig, getPublicRuntimeStatus} from "./runtimeConfig.js";

function parseVisit(question) {
  const match = question.match(/visit\s*([0-9]+)/i);
  return match ? `Visit${match[1]}` : null;
}

function parseEndpoint(question) {
  const match = question.match(/endpoint\s*([0-9]+)/i);
  return match ? `Endpoint${match[1]}` : null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractJsonObject(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Model output is empty.");
  }

  const trimmed = text.trim();
  const direct = JSON.parse(trimmed);
  return direct;
}

function normalizeStructuredOutput(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Provider output must be a JSON object.");
  }

  const sql = payload.sql?.trim?.();
  if (!sql) {
    throw new Error("Provider output must include a non-empty 'sql' field.");
  }

  const rationale = payload.rationale?.trim?.() || "No rationale provided.";
  const warnings = Array.isArray(payload.warnings)
    ? payload.warnings.map((warning) => String(warning))
    : [];

  return {sql, rationale, warnings};
}

function extractTextFromOnlineResponse(data) {
  return (
    data?.output_text ??
    data?.content?.[0]?.text ??
    data?.result?.text ??
    data?.result?.output_text ??
    data?.text ??
    null
  );
}

function getStructuredSchemaPrompt() {
  return [
    "Return JSON only.",
    'Schema: {"sql":"string","rationale":"string","warnings":["string"]}.',
    "The sql field must contain exactly one read-only SQL query."
  ].join(" ");
}

function mockSqlForTarget(question, target) {
  const lower = question.toLowerCase();
  const visit = parseVisit(question);
  const endpoint = parseEndpoint(question);

  switch (target.viewName) {
    case "enrollment_status_view":
      if (/(pending procedure)/i.test(lower)) {
        return `
          SELECT COUNT(*) AS pending_procedure_subject_count
          FROM enrollment_status_view
          WHERE enrollment_status = 'Pending Procedure'
        `;
      }
      if (/(screening|approval|timing)/i.test(lower)) {
        return `
          SELECT
            site_id,
            subject_id,
            consent_month,
            screening_month,
            procedure_month,
            approval_status,
            enrollment_status
          FROM enrollment_status_view
          ORDER BY site_id, screening_month, procedure_month, subject_id
        `;
      }
      if (/(treatment arm|by arm)/i.test(lower) && /(status|breakdown)/i.test(lower)) {
        return `
          SELECT treatment_arm, enrollment_status, COUNT(*) AS subject_count
          FROM enrollment_status_view
          GROUP BY treatment_arm, enrollment_status
          ORDER BY treatment_arm, enrollment_status
        `;
      }
      if (lower.includes("site")) {
        return `
          SELECT site_id, enrollment_status, COUNT(*) AS subject_count
          FROM enrollment_status_view
          GROUP BY site_id, enrollment_status
          ORDER BY site_id, enrollment_status
        `;
      }
      return `
        SELECT enrollment_status, COUNT(*) AS subject_count
        FROM enrollment_status_view
        GROUP BY enrollment_status
        ORDER BY subject_count DESC, enrollment_status
      `;

    case "subject_summary_view":
      if (/(female).*(rate)|(rate).*(female)/i.test(lower)) {
        return `
          SELECT
            treatment_arm,
            ROUND(100.0 * AVG(CASE WHEN sex = 'Female' THEN 1 ELSE 0 END), 2) AS female_subject_rate_percent,
            COUNT(*) AS subject_count
          FROM subject_summary_view
          GROUP BY treatment_arm
          ORDER BY treatment_arm
        `;
      }
      if (/(average|mean).*(age)/i.test(lower)) {
        return `
          SELECT treatment_arm, ROUND(AVG(age), 2) AS average_age, COUNT(*) AS subject_count
          FROM subject_summary_view
          GROUP BY treatment_arm
          ORDER BY treatment_arm
        `;
      }
      if (/(race).*(distribution)|(distribution).*(race)/i.test(lower)) {
        return `
          SELECT
            race,
            COUNT(*) AS subject_count,
            ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS subject_percent
          FROM subject_summary_view
          GROUP BY race
          ORDER BY subject_count DESC, race
        `;
      }
      if (/(bmi)/i.test(lower)) {
        return `
          SELECT
            treatment_arm,
            ROUND(AVG(bmi), 2) AS average_bmi,
            ROUND(MIN(bmi), 2) AS min_bmi,
            ROUND(MAX(bmi), 2) AS max_bmi,
            COUNT(*) AS subject_count
          FROM subject_summary_view
          GROUP BY treatment_arm
          ORDER BY treatment_arm
        `;
      }
      if (/(female|sex)/i.test(lower)) {
        return `
          SELECT treatment_arm, sex, COUNT(*) AS subject_count
          FROM subject_summary_view
          GROUP BY treatment_arm, sex
          ORDER BY treatment_arm, sex
        `;
      }
      return `
        SELECT treatment_arm, age_group, COUNT(*) AS subject_count
        FROM subject_summary_view
        GROUP BY treatment_arm, age_group
        ORDER BY treatment_arm, age_group
      `;

    case "lab_long_view": {
      const selectedVisit = visit ?? "Visit2";
      const selectedEndpoint = endpoint ?? "Endpoint1";
      if (/(across visits)/i.test(lower)) {
        return `
          SELECT treatment_arm, parameter_code, visit, ROUND(AVG(analysis_value), 2) AS average_analysis_value
          FROM lab_long_view
          WHERE parameter_code = '${endpoint ?? "Endpoint2"}'
          GROUP BY treatment_arm, parameter_code, visit
          ORDER BY parameter_code, visit, treatment_arm
        `;
      }
      if (/(values by arm|baseline .* exist)/i.test(lower)) {
        const detailVisit = lower.includes("baseline") ? "Visit0" : selectedVisit;
        return `
          SELECT subject_id, treatment_arm, parameter_code, visit, analysis_value
          FROM lab_long_view
          WHERE parameter_code = '${selectedEndpoint}'
            AND visit = '${detailVisit}'
          ORDER BY treatment_arm, subject_id
          LIMIT 20
        `;
      }
      if (lower.includes("change")) {
        return `
          SELECT treatment_arm, parameter_code, visit, ROUND(AVG(change_from_baseline), 2) AS average_change_from_baseline
          FROM lab_long_view
          WHERE parameter_code = '${selectedEndpoint}'
            AND visit = '${selectedVisit}'
          GROUP BY treatment_arm, parameter_code, visit
          ORDER BY treatment_arm
        `;
      }
      return `
        SELECT treatment_arm, parameter_code, visit, ROUND(AVG(analysis_value), 2) AS average_analysis_value
        FROM lab_long_view
        WHERE parameter_code = '${selectedEndpoint}'
          AND visit = '${selectedVisit}'
        GROUP BY treatment_arm, parameter_code, visit
        ORDER BY treatment_arm
      `;
    }

    case "efficacy_summary_view":
      if (/(flg1)/i.test(lower) && /(orr|response)/i.test(lower)) {
        return `
          SELECT
            flg1_flag,
            ROUND(AVG(responder_flag) * 100, 2) AS orr_percent,
            SUM(responder_flag) AS responder_count,
            COUNT(*) AS subject_count
          FROM efficacy_summary_view
          GROUP BY flg1_flag
          ORDER BY flg1_flag
        `;
      }
      if (/(orr|response rate|responder)/i.test(lower)) {
        return `
          SELECT
            treatment_arm,
            ROUND(AVG(responder_flag) * 100, 2) AS orr_percent,
            SUM(responder_flag) AS responder_count,
            COUNT(*) AS subject_count
          FROM efficacy_summary_view
          GROUP BY treatment_arm
          ORDER BY treatment_arm
        `;
      }
      return `
        SELECT treatment_arm, best_response, COUNT(*) AS subject_count
        FROM efficacy_summary_view
        GROUP BY treatment_arm, best_response
        ORDER BY treatment_arm, best_response
      `;

    case "time_to_event_view":
      if (/(censored)/i.test(lower) && /(how many|count)/i.test(lower)) {
        return `
          SELECT SUM(censor_flag) AS censored_subject_count
          FROM time_to_event_view
        `;
      }
      return `
        SELECT
          treatment_arm,
          ROUND(MEDIAN(time_to_event_months), 2) AS median_time_to_event_months,
          COUNT(*) AS subject_count
        FROM time_to_event_view
        GROUP BY treatment_arm
        ORDER BY treatment_arm
      `;

    default:
      return `SELECT * FROM ${target.viewName} LIMIT 20`;
  }
}

class MockProvider {
  constructor() {
    this.name = "mock";
  }

  async generateSql({question, target}) {
    return {
      providerName: this.name,
      generatedSql: mockSqlForTarget(question, target),
      rationale: "Mock provider generated deterministic demo SQL based on simple question heuristics.",
      warnings: ["Mock provider was used; SQL generation is heuristic and deterministic."]
    };
  }
}

class ProviderRuntimeError extends Error {
  constructor(message, {status = 503, code = "PROVIDER_ERROR", retryable = false} = {}) {
    super(message);
    this.name = "ProviderRuntimeError";
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

function getJsonSchemaDefinition() {
  return {
    name: "sql_plan",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["sql", "rationale", "warnings"],
      properties: {
        sql: {type: "string"},
        rationale: {type: "string"},
        warnings: {
          type: "array",
          items: {type: "string"}
        }
      }
    }
  };
}

function parseStructuredResponsePayload(data) {
  const directStructured =
    data?.output?.[0]?.content?.find?.((item) => item.type === "output_text" && item.text)?.text ??
    data?.choices?.[0]?.message?.content ??
    extractTextFromOnlineResponse(data);

  if (!directStructured) {
    throw new ProviderRuntimeError("Live provider response did not include parseable structured content.", {
      code: "PROVIDER_BAD_RESPONSE"
    });
  }

  return normalizeStructuredOutput(extractJsonObject(directStructured));
}

class OpenAICompatibleProvider {
  constructor({
    endpoint,
    apiKey,
    model,
    timeoutMs = 15000,
    retries = 2
  }) {
    this.name = "live";
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.model = model;
    this.timeoutMs = timeoutMs;
    this.retries = retries;
  }

  buildRequest(prompt) {
    const systemPrompt = getStructuredSchemaPrompt();
    const schema = getJsonSchemaDefinition();
    const lowerEndpoint = this.endpoint.toLowerCase();

    if (lowerEndpoint.includes("/chat/completions")) {
      return {
        body: {
          model: this.model,
          temperature: 0,
          messages: [
            {role: "system", content: systemPrompt},
            {role: "user", content: prompt}
          ],
          response_format: {
            type: "json_schema",
            json_schema: schema
          }
        }
      };
    }

    return {
      body: {
        model: this.model,
        input: [
          {role: "system", content: systemPrompt},
          {role: "user", content: prompt}
        ],
        response_format: {
          type: "json_schema",
          json_schema: schema
        }
      }
    };
  }

  async callRemote(prompt) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const request = this.buildRequest(prompt);
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? {Authorization: `Bearer ${this.apiKey}`} : {})
        },
        body: JSON.stringify(request.body),
        signal: controller.signal
      });

      if (!response.ok) {
        const text = await response.text();
        throw new ProviderRuntimeError(`Live provider error: ${response.status} ${text}`, {
          status: response.status >= 500 ? 503 : 502,
          code: "PROVIDER_HTTP_ERROR",
          retryable: response.status >= 500 || response.status === 429
        });
      }

      const data = await response.json();
      return parseStructuredResponsePayload(data);
    } catch (error) {
      if (error.name === "AbortError") {
        throw new ProviderRuntimeError(`Live provider timed out after ${this.timeoutMs}ms.`, {
          code: "PROVIDER_TIMEOUT",
          retryable: true
        });
      }

      if (error instanceof ProviderRuntimeError) {
        throw error;
      }

      throw new ProviderRuntimeError(error.message || "Live provider request failed.", {
        code: "PROVIDER_REQUEST_FAILED",
        retryable: true
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  async generateSql({prompt}) {
    let lastError = null;

    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      try {
        const structured = await this.callRemote(prompt);
        return {
          providerName: this.name,
          providerMode: "live",
          fallbackUsed: false,
          generatedSql: structured.sql,
          rationale: structured.rationale,
          warnings: structured.warnings
        };
      } catch (error) {
        lastError = error;
        if (attempt < this.retries && error.retryable) {
          await sleep((attempt + 1) * 400);
        } else {
          break;
        }
      }
    }

    throw lastError ?? new ProviderRuntimeError("Live provider failed.");
  }
}

class GenericJsonProvider extends OpenAICompatibleProvider {}

class FallbackProvider {
  constructor({primary, fallback, fallbackEnabled}) {
    this.primary = primary;
    this.fallback = fallback;
    this.fallbackEnabled = fallbackEnabled;
  }

  async generateSql(args) {
    try {
      return await this.primary.generateSql(args);
    } catch (error) {
      if (!this.fallbackEnabled) {
        throw error;
      }

      const fallbackResult = await this.fallback.generateSql(args);
      return {
        ...fallbackResult,
        providerMode: "mock",
        fallbackUsed: true,
        fallbackReason: error.message,
        warnings: [
          `Live provider was unavailable, so the demo used mock mode instead: ${error.message}`,
          ...(fallbackResult.warnings ?? [])
        ]
      };
    }
  }
}

function createLiveProvider(config) {
  const common = {
    endpoint: config.endpoint,
    apiKey: config.apiKey,
    model: config.model,
    retries: config.retries,
    timeoutMs: config.timeoutMs
  };

  if (config.liveProviderKind === "generic_json") {
    return new GenericJsonProvider(common);
  }

  return new OpenAICompatibleProvider(common);
}

function resolveRequestedMode(modeOverride, defaultMode, liveConfigured) {
  const override = typeof modeOverride === "string" ? modeOverride.toLowerCase() : null;
  const normalizedOverride = override === "online" ? "live" : override;
  if (normalizedOverride === "mock" || normalizedOverride === "live") {
    return normalizedOverride;
  }

  if (defaultMode === "mock") return "mock";
  if (defaultMode === "live") return "live";
  return liveConfigured ? "live" : "mock";
}

export function createModelProvider(options = {}) {
  const config = getProviderRuntimeConfig();
  const mock = new MockProvider();
  const requestedMode = resolveRequestedMode(options.modeOverride, config.defaultMode, config.liveConfigured);

  if (requestedMode === "mock") {
    return mock;
  }

  if (!config.liveConfigured) {
    if (config.fallbackToMock) {
      return new FallbackProvider({
        primary: {
          async generateSql() {
            throw new ProviderRuntimeError("Live provider is not configured.", {
              code: "PROVIDER_NOT_CONFIGURED"
            });
          }
        },
        fallback: mock,
        fallbackEnabled: true
      });
    }

    throw new ProviderRuntimeError("Live provider is not configured.", {
      code: "PROVIDER_NOT_CONFIGURED"
    });
  }

  return new FallbackProvider({
    primary: createLiveProvider(config),
    fallback: mock,
    fallbackEnabled: config.fallbackToMock
  });
}

export {ProviderRuntimeError, getPublicRuntimeStatus};
