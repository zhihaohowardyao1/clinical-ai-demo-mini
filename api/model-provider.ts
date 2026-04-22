export type SqlGenerationResult = {
  providerName: string;
  generatedSql: string;
  rationale: string;
  warnings: string[];
};

export type SqlGenerationContext = {
  question: string;
  prompt: string;
  target: {
    datasetId: string;
    viewName: string;
  };
  selectedExamples: Array<{user_question: string}>;
  semanticLayer: unknown;
};

export interface ModelProvider {
  generateSql(context: SqlGenerationContext): Promise<SqlGenerationResult>;
}

export type OnlineProviderConfig = {
  endpoint: string;
  apiKey?: string;
  model: string;
  retries?: number;
  timeoutMs?: number;
};

// Strict output contract expected from any live model provider.
export type StrictProviderOutput = {
  sql: string;
  rationale: string;
  warnings: string[];
};

// The backend runtime currently uses api/lib/provider.js so it can run directly
// under Node without a TypeScript build step. This file defines the canonical
// provider abstraction and the strict output shape that runtime adapters should follow.

export interface OnlineModelProvider extends ModelProvider {
  readonly config: OnlineProviderConfig;
}

export interface MockModelProvider extends ModelProvider {
  readonly providerName: "mock";
}

export type ProviderFactoryOptions = {
  mode: "mock" | "online";
  online?: OnlineProviderConfig;
};

export interface ProviderFactory {
  create(options: ProviderFactoryOptions): ModelProvider;
}
