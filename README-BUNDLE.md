# Minimal Public-Demo Deployment Bundle

This folder contains the smallest deployment-oriented subset of the project that still preserves the current public demo behavior.

## Included

- Observable source pages under `src/`
- AI pages and shared components
- API backend under `api/`
- semantic layer YAML files under `semantic/`
- DuckDB demo database under `db/`
- required build/query scripts
- deployment config files such as `Dockerfile`, `render.yaml`, and `.env.example`

## Intentionally excluded

- historical exported root HTML pages
- local build outputs such as `dist/`
- Observable cache artifacts
- most legacy HTML snapshots that are no longer required at runtime
- documentation-only files that are not needed to run the public demo

## Typical commands

```bash
npm install
python3 -m pip install -r requirements.txt
npm run build:data
npm run build
npm run dev
```

## Render deployment

Use this folder as the deployment root.

1. Push this folder to its own repo, or copy its contents into a clean deployment branch.
2. Create a new Render Web Service.
3. Select Docker deployment.
4. Use the included `render.yaml` and `Dockerfile`.
5. Set environment variables from `.env.example`.
6. Use `/api/health` as the health check path.

Recommended public-demo defaults:

```
MODEL_PROVIDER=auto
LIVE_PROVIDER_KIND=openai_compatible
LLM_FALLBACK_TO_MOCK=true
```
