function toLowerString(value, fallback = "") {
  return typeof value === "string" ? value.trim().toLowerCase() : fallback;
}

function parseBoolean(value, fallback) {
  if (value == null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeMode(value) {
  const mode = toLowerString(value, "auto");
  if (mode === "online") return "live";
  return ["auto", "mock", "live"].includes(mode) ? mode : "auto";
}

function normalizeProviderKind(value) {
  const kind = toLowerString(value, "openai_compatible");
  return ["openai_compatible", "generic_json"].includes(kind) ? kind : "openai_compatible";
}

export function getProviderRuntimeConfig() {
  const defaultMode = normalizeMode(process.env.MODEL_PROVIDER);
  const liveProviderKind = normalizeProviderKind(process.env.LIVE_PROVIDER_KIND);
  const endpoint = process.env.LLM_API_URL?.trim?.() || "";
  const apiKey = process.env.LLM_API_KEY?.trim?.() || process.env.OPENAI_API_KEY?.trim?.() || "";
  const model = process.env.LLM_MODEL?.trim?.() || process.env.OPENAI_MODEL?.trim?.() || "gpt-4.1-mini";
  const retries = parseNumber(process.env.LLM_MAX_RETRIES, 2);
  const timeoutMs = parseNumber(process.env.LLM_TIMEOUT_MS, 15000);
  const fallbackToMock = parseBoolean(process.env.LLM_FALLBACK_TO_MOCK, true);

  const liveConfigured = Boolean(endpoint && model);

  return {
    defaultMode,
    liveProviderKind,
    endpoint,
    apiKey,
    model,
    retries,
    timeoutMs,
    fallbackToMock,
    liveConfigured
  };
}

export function getPublicRuntimeStatus() {
  const config = getProviderRuntimeConfig();
  return {
    default_mode: config.defaultMode,
    live_configured: config.liveConfigured,
    live_provider_kind: config.liveProviderKind,
    fallback_to_mock: config.fallbackToMock,
    live_model: config.liveConfigured ? config.model : null
  };
}
