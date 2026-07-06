# Axon Benchmark Suite

A repeatable suite that evaluates whether Axon is "worth using" across four
dimensions. All scripts are plain Node against the built compiler in `dist/`.

## Quick start

```bash
# From the repo root
npm ci && npx tsc          # build the compiler → dist/
node benchmark/run-all.js  # run every track, writes benchmark/results/*.json
```

Or run the whole thing reproducibly in Docker (pinned Node 20):

```bash
./benchmark/run-docker.sh
# or: docker compose -f benchmark/docker-compose.yml run --build --rm bench
```

Use `--build` (or the wrapper script) so the image includes all `track-*/run.js` files.
A cached `axon-bench` image from before the benchmark tracks landed will skip every track.

## Tracks

| Track | Question | Script |
|---|---|---|
| A — Correctness | Does the compiler actually work beyond the 3 files CI checks? | `track-a-correctness/run.js` |
| B — Compiler performance | How fast does it transpile, and does it scale linearly? | `track-b-compiler-perf/run.js` |
| C — Runtime performance | Does the generated JS pay a performance tax? | `track-c-runtime-perf/run.js` |
| D — AI-native + token/cost | Token economy + session cost to ship working code | `track-d-ai-native/run.js` |

Each track writes JSON to `benchmark/results/`. After all tracks finish,
`run-all.js` invokes `report/run.js` for `report.md` and `report.json`.

## Track D (token/cost + live sessions)

Track D has two layers:

| Layer | What it measures | When it runs |
|---|---|---|
| **D-static** | Output/logic/prompt token ratios (Axon vs TS) | Every `run-all.js` |
| **D-live** | Session cost: compile rate, fix iterations, tokens × price | `--live` flag only |

### D-static (always on)

Compares reference solution pairs using `js-tiktoken` (cl100k_base proxy):

- **Full output tokens** — source as written (Axon includes `@intent`, `@test`, etc.)
- **Logic-only tokens** — metadata/comments stripped
- **Simulated prompt tokens** — task spec + README excerpt (Axon only)

Pricing is configurable in `benchmark/config/pricing.json`.

### D-live (manual session transcripts)

Live evaluation reads agent session transcripts from
`benchmark/track-d-ai-native/live-sessions/{taskId}_{language}.json`.
No automated agent spawning — you populate these from your own AI runs.

**Workflow:**

1. Generate prompts (optional): `node benchmark/track-d-ai-native/run-live.js --generate-prompts`
2. Run your AI agent against each prompt in `live-prompts/`
3. Save transcript JSON:

```json
{
  "taskId": "inventory_stack",
  "language": "axon",
  "turns": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "```\n...source...\n```" }
  ]
}
```

4. Or use the collector: `node benchmark/track-d-ai-native/collect-live-session.js --task inventory_stack --language axon --source path/to/output.axn`
5. Evaluate: `node benchmark/track-d-ai-native/run.js --live`

Reference solutions in `solutions/` are **hidden answer keys** for harness
sanity only — they are not scored as AI writability.

## CI

- **Weekly schedule**: static suite (Tracks A–D static + harness sanity)
- **workflow_dispatch** with `run_live=true`: includes live session evaluation
  (requires `live-sessions/*.json` in the repo or mounted volume)

## Notes on measurement

- Token counts use cl100k_base (OpenAI-compatible proxy); Claude billing may differ ~5–10%.
- Timing tracks (B, C) report **relative** numbers within a fixed environment.
- Nothing in `src/` is modified by the suite.
