# Clinical Trial AI + Analytics Demo

This repository is a public-demo-ready clinical analytics application built on Observable Framework with a lightweight Node API, a vendor-neutral semantic layer, and DuckDB-backed AI query execution.

The deployed demo combines:

- analytics pages for enrollment, ADaM data, descriptive summaries, efficacy, and output tables
- an AI section with Study Explorer, Semantic Layer, Query Routing, Architecture, and Evaluation
- a server-side `POST /api/ask` path with live-provider support and safe mock fallback

## Tech stack

- Observable Framework for the site and page routing
- Node.js for local/dev/prod serving and API routes
- Python + DuckDB for semantic view execution
- YAML semantic layer files under `semantic/`

## Local run

### 1. Install dependencies

```bash
npm install
python3 -m pip install -r requirements.txt
```

### 2. Build the DuckDB demo database

```bash
npm run build:data
```

### 3. Build the site

```bash
npm run build
```

### 4. Start the local server

```bash
npm run dev
```

Open:

- `http://127.0.0.1:3001/`
- API health: `http://127.0.0.1:3001/api/health`

## Validation

Run the launch-readiness validation flow with:

```bash
npm run launch:validate
```

This covers build validation, key page checks, API health, SQL safety, and benchmark execution.

## Environment setup

Copy `.env.example` into a real deployment environment and set values there. Do not commit real secrets.

### Required for mock-only demo

No live model credentials are required.

Recommended defaults:

```bash
MODEL_PROVIDER=auto
LIVE_PROVIDER_KIND=openai_compatible
LLM_FALLBACK_TO_MOCK=true
```

### Required for live provider mode

Set these server-side only:

```bash
LLM_API_URL=https://your-provider-endpoint.example/v1/chat/completions
LLM_API_KEY=your_server_side_secret
LLM_MODEL=gpt-4.1-mini
```

Optional runtime overrides:

```bash
HOST=0.0.0.0
PORT=3000
DUCKDB_PATH=db/clinical_demo.duckdb
DUCKDB_PYTHON_BIN=python3
```

## Production build flow

For deployment, use:

```bash
npm run build:deploy
```

This rebuilds the DuckDB demo database from source assets and then builds the Observable site.

## Deployment

### Recommended model

Use a single containerized web service:

- Node serves the built site and API
- Python executes DuckDB queries
- the DuckDB database is built into the container image

This repository includes:

- [Dockerfile](./Dockerfile)
- [render.yaml](./render.yaml)

The Dockerfile is the primary deployment artifact. `render.yaml` is an optional convenience file for Render.

### Container startup

The production container runs:

```bash
npm start
```

### Health check

Use:

```bash
GET /api/health
```

This reports:

- runtime mode
- DuckDB runtime paths
- build/database/script presence checks

## Deployment docs

- [docs/deployment-architecture.md](./docs/deployment-architecture.md)
- [docs/deployment-steps.md](./docs/deployment-steps.md)
- [docs/post-deploy-smoke-test.md](./docs/post-deploy-smoke-test.md)

## Notes

- The AI demo remains safe if live credentials are missing because mock fallback is preserved.
- The analytics and AI sections are intentionally demo-safe and based on synthetic/sample data only.
