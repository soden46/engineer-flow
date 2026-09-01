# Benchmark Strategy

Engineer Flow should be evaluated as a framework-agnostic engineering orchestrator.

Historical Laravel routing experiments may inform development, but previously consumed heldout cases must not be reused as final benchmark evidence.

## Burned Heldouts

The following heldout datasets are permanently burned and must never be
executed again as fresh benchmark evidence:

- `tests/routing-heldout-v4.json` with runner `tests/run-routing-heldout-v4.mjs`
- `tests/routing-heldout-v5.json` with runner `tests/run-routing-heldout-v5.mjs`

Their committed result artifacts are historical evidence:

- `benchmark-results/heldout-v4-candidate-i.json`
- `benchmark-results/heldout-v5-candidate-j.json`

The heldout runners permanently refuse execution. Any future routing
mechanism research must use freshly authored heldout datasets.

## Development Validation

Validation should cover:

- internal generalized capability discovery
- user-installed external Agent Skill discovery
- generic task routing
- technology-specific external skill routing
- false-positive protection for generic keywords
- primary-only routing
- primary plus support routing
- maximum specialist count of 2
- duplicate skill handling
- malformed external skill metadata
- external skill precedence where specific evidence exists
- self-discovery exclusion
- mandatory post-development security
- large installed-skill inventories

## Routing Expectations

Generic engineering tasks should prefer generalized internal capabilities.

Technology-specific external skills should activate only when the task or project provides sufficiently specific evidence.

Security verification remains mandatory after development and does not count against the two development specialist slots.

## Future Benchmark

Create a fresh multi-framework benchmark before claiming broad routing performance.

Candidate task families should include:

- generic backend engineering
- APIs
- databases
- frontend engineering
- infrastructure and DevOps
- testing
- debugging
- performance
- security
- documentation
- AI and LLM engineering
- framework-specific tasks where external specialist skills are installed

Framework-specific benchmark examples may include Laravel, Odoo, Spring Boot, Flutter, React, Python ML tooling, and other ecosystems.

Final benchmark cases must have independently authored expected routing assertions.

Do not tune routing against the final heldout benchmark after evaluation begins.

## External Skill Scale Benchmark

### Methodology

- Temporary generated Agent Skills in an isolated fixture directory
- Scales: 100, 500, 1000 external skills
- 3 warmup runs
- 10 measured runs
- Median timing reported

### Scenarios

- `INTERNAL_ONLY`: task routes to an existing internal capability
- `EXPLICIT_EXTERNAL`: task explicitly names a generated external skill
- `PROJECT_EVIDENCE_EXTERNAL`: project manifest contains an identity term for a generated external skill
- `NO_RELEVANT_SPECIALIST`: irrelevant task text

### Checks

- Deterministic routing across measured runs
- Bounded retrieval diagnostics
- `specialist_count` never exceeds 2

### Frozen Result

`benchmark-results/external-skill-scale-v1.json`

### Limitations

- Synthetic skill corpus
- Machine-dependent timings
- Measures discovery and routing scalability
- Does not measure LLM token or cost outcomes
- A real-world agent benchmark is still needed for user-facing outcome claims