import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import yaml from "js-yaml";

const SEMANTIC_DIR = resolve(process.cwd(), "semantic");

const FILES = {
  datasets: "datasets.yaml",
  businessTerms: "business_terms.yaml",
  metricDefinitions: "metric_definitions.yaml",
  sqlExpressions: "sql_expressions.yaml",
  exampleQueries: "example_queries.yaml",
  routingRules: "routing_rules.yaml",
  dynamicInstructions: "dynamic_instructions.yaml"
};

async function loadYaml(filename) {
  const raw = await readFile(resolve(SEMANTIC_DIR, filename), "utf8");
  return yaml.load(raw);
}

export async function loadSemanticLayer() {
  const [
    datasets,
    businessTerms,
    metricDefinitions,
    sqlExpressions,
    exampleQueries,
    routingRules,
    dynamicInstructions
  ] = await Promise.all(Object.values(FILES).map(loadYaml));

  return {
    datasets,
    businessTerms,
    metricDefinitions,
    sqlExpressions,
    exampleQueries,
    routingRules,
    dynamicInstructions
  };
}
