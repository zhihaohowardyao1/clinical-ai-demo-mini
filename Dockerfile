FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip python3-venv build-essential \
  && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:${PATH}"

COPY package.json package-lock.json ./
RUN npm ci

COPY requirements.txt ./
RUN python3 -m pip install --no-cache-dir --upgrade pip setuptools wheel \
  && python3 -m pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python3 scripts/build_semantic_views.py \
  && npm run build \
  && npm prune --omit=dev

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV MODEL_PROVIDER=auto
ENV LIVE_PROVIDER_KIND=openai_compatible
ENV LLM_FALLBACK_TO_MOCK=true
ENV DUCKDB_PYTHON_BIN=/opt/venv/bin/python3

EXPOSE 3000

CMD ["npm", "start"]
