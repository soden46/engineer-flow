# CALIBRATION-V7 FINAL CANDIDATE

**Candidate:** EXPLICIT_ROUTING_METADATA + CURATED_ROUTING_TERMS + NAME_MATCH_WEIGHT_1  
**Git branch:** v0.3.0  
**Git commit:** 81803a74283e44648c5c32c5384dbf1b7299c1f8  

---

## FROZEN STATE

CANDIDATE_FROZEN=YES

### Mechanism Components

- explicit bounded routing metadata
- internal rich knowledge excluded from ordinary lexical scoring
- legacy external fallback preserved
- name-match weight=1
- routing-term weight=1

### Implementation Files

| File | SHA-256 |
|------|---------|
| `tests/routing-calibration-v7.json` | `003F36FDCFA17236E24B89049E35B8F8F09F1D0639778B0B2C3E876AA361942B` |
| `tests/run-routing-calibration-v7.mjs` | `F7FE8C6CD0C12CAE328B037CB3B904BEF6BB4AED01DA95714FD6E9332F9AC05B` |
| `skills/engineer-flow/scripts/engineer-flow.mjs` | `F0ABD846B726CEC649455FB1E5B325442B60AEA2B47A277E1495A7E3844AD1ED` |

---

## FINAL CALIBRATION METRICS

| Metric | Value |
|--------|-------|
| MODE_ACCURACY | 0.8611 |
| PRIMARY_ACCURACY | 0.7500 |
| SUPPORT_ACCURACY | 0.8333 |
| EXACT_ROUTE_ACCURACY | 0.6667 |
| INTERNAL_PRIMARY_ACCURACY | 0.8125 |
| FALSE_FRONTEND_UI_ACTIVATION_COUNT | 0 |
| FALSE_TESTING_ACTIVATION_COUNT | 0 |
| FALSE_SECURITY_ACTIVATION_COUNT | 0 |
| FALSE_EXTERNAL_ACTIVATION_COUNT | 0 |
| MUST_NOT_SELECT_VIOLATIONS | 0 |
| GROUP_B_EXACT | 0.3333 |
| GROUP_B_WRONG_PRIMARY | 3 |

### Precision Metrics

- ROUTING_TERM_RECALL_MISS: 6
- PRIMARY_RANKING_MISS: 0
- SUPPORT_MISSING: 6
- SUPPORT_OVER_SELECTION: 2

---

## BENCHMARK ARTIFACTS PRESERVED

- `benchmark-results/calibration-v7-baseline.json`
- `benchmark-results/calibration-v7-curated-routing-terms.json`
- `benchmark-results/calibration-v7-explicit-routing-metadata.json`
- `benchmark-results/calibration-v7-targeted-term-refinement.json`
- `benchmark-results/calibration-v7-global-weight-rebalance.json`

No historical results were overwritten.

---

## KNOWN REMAINING DEVELOPMENT LIMITATIONS

- routing recall misses remain
- B1/B4/B5/C5 remain unresolved
- support composition remains imperfect
- calibration-v7 is development data and must not be treated as fresh evidence

---

## FREEZE RULES

NO_MORE_CALIBRATION_V7_TUNING=YES

Do not rerun calibration-v7 without explicit authorization.
Do not author heldout-v7 yet.
Next permitted experiment: at most ONE additional routing mechanism before final freeze.
