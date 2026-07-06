# Reproducible environment for the Axon benchmark suite.
# Pins Node + OS so correctness/AI-writability results are deterministic and
# provides an isolation boundary around the AI-generated (Track D) and
# adversarial (Track A) code that the suite executes.
#
# Build context is the REPO ROOT (so we can copy src/ and examples/):
#   docker build -f benchmark/Dockerfile -t axon-bench .
#   docker run --rm -v "$PWD/benchmark/results:/app/benchmark/results" axon-bench

FROM node:20-bookworm-slim

WORKDIR /app

# Install deps first for layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the compiler sources + config and build.
COPY tsconfig.json ./
COPY src/ ./src/
RUN npx tsc

# Copy examples (needed by Tracks A–C) and the benchmark suite.
COPY examples/ ./examples/
COPY README.md ./README.md
COPY benchmark/ ./benchmark/
# dist/stdlib.js reads demo/axon.stdlib.js at runtime — ship a copy from fixtures.
RUN mkdir -p demo && cp benchmark/fixtures/axon.stdlib.js demo/axon.stdlib.js

# Results are written here; mount a volume to extract them.
VOLUME ["/app/benchmark/results"]

CMD ["node", "benchmark/run-all.js"]
