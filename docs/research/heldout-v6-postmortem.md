# HELDOUT-V6 POSTMORTEM

**Candidate:** v0.3.0-browser-ui-enrichment  
**Mechanism:** BROWSER_DRIVEN_UI_ENRICHMENT  
**Git branch:** v0.3.0  
**Git commit:** 81803a74283e44648c5c32c5384dbf1b7299c1f8  

---

## OBSERVED FACTS

### Burned Evidence Status

HELDOUT_V6_BURNED=YES  
HELDOUT_V6_USED_FOR_TUNING=NO  

`benchmark-results/heldout-v6-burned.json` exists and is treated as immutable evidence.  
The burned artifact was not modified, deleted, or overwritten.  
The runner was not re-executed.

### Top-Level Metrics

| Metric | Value |
|--------|-------|
| MODE_ACCURACY | 0.5417 |
| PRIMARY_ACCURACY | 0.6667 |
| SUPPORT_ACCURACY | 0.5000 |
| EXACT_ROUTE_ACCURACY | 0.3750 |
| FALSE_FRONTEND_UI_ACTIVATION_COUNT | 2 |
| FALSE_TESTING_ACTIVATION_COUNT | 5 |
| FALSE_EXTERNAL_ACTIVATION_COUNT | 0 |
| MAX_SPECIALISTS_OBSERVED | 2 |
| MAX_SPECIALISTS_INVARIANT | PASS |
| RESOLVER_CRASH_COUNT | 0 |
| ROBUSTNESS_PASS_RATE | 1.0 |

### Group Metrics

| Group | Scenarios | Mode | Primary | Support | Exact |
|-------|-----------|------|---------|---------|-------|
| A_BROWSER_UI_POSITIVE | 4 | 0.5 | 1.0 | 0.5 | 0.5 |
| B_UI_TESTING_COMPOSITION | 4 | 0.5 | 0.5 | 0.25 | 0.25 |
| C_BROWSER_TESTING | 3 | 1.0 | 1.0 | 1.0 | 1.0 |
| D_EXPLICIT_EXTERNAL_BROWSER | 3 | 0.3333 | 1.0 | 0.3333 | 0.3333 |
| E_BROWSER_CONFUSION_NEGATIVE | 4 | 0.5 | 0.25 | 0.5 | 0.25 |
| F_SCREENSHOT_CONFUSION_NEGATIVE | 3 | 0.3333 | 0.3333 | 0.3333 | 0.0 |
| G_V2_CONCERN_REGRESSION | 3 | 0.6667 | 0.6667 | 0.6667 | 0.3333 |

### All Failing Case IDs

- V6_A3_SCREENSHOT_REFERENCE_NAVIGATION
- V6_A4_VISUAL_COMPARISON_ITERATION
- V6_B2_RESPONSIVE_FORM_WITH_REGRESSION
- V6_B3_ACCESSIBILITY_TREE_WITH_E2E
- V6_B4_INTERACTIVE_SIDEBAR_WITH_NAV_TEST
- V6_D1_AGENT_BROWSER_EXPLICIT
- V6_D3_BROWSER_AUDIT_SPECIALIST_EXPLICIT
- V6_E1_BROWSER_USER_AGENT_API
- V6_E2_BROWSER_CACHE_HEADERS
- V6_E3_PLAYWRIGHT_DEPENDENCY_UPGRADE
- V6_F1_PDF_SCREENSHOT_EXPORT
- V6_F2_VISUALIZE_QUERY_PLAN
- V6_F3_REFERENCE_ARCHITECTURE_DOCS
- V6_G1_TRANSACTION_CONSISTENCY
- V6_G2_N_PLUS_ONE_QUERY_REGRESSION

### Expected vs Actual (Failing Cases)

| Case ID | Expected Primary | Actual Primary | Expected Support | Actual Support | Mode Expected | Mode Actual |
|---------|-----------------|----------------|------------------|----------------|---------------|-------------|
| V6_A3 | frontend-ui | frontend-ui | null | testing | 1 | 2 |
| V6_A4 | frontend-ui | frontend-ui | null | testing | 1 | 2 |
| V6_B2 | frontend-ui | testing | testing | null | 2 | 1 |
| V6_B3 | frontend-ui | frontend-ui | testing | null | 2 | 1 |
| V6_B4 | frontend-ui | testing | testing | frontend-ui | 2 | 2 |
| V6_D1 | agent-browser | agent-browser | null | frontend-ui | 1 | 2 |
| V6_D3 | browser-audit-specialist | browser-audit-specialist | null | frontend-ui | 1 | 2 |
| V6_E1 | api-integration | security | null | testing | 1 | 2 |
| V6_E2 | api-integration | testing | documentation | null | 2 | 1 |
| V6_E3 | dependency-tooling | testing | null | null | 1 | 1 |
| V6_F1 | data-processing | performance | null | null | 1 | 1 |
| V6_F2 | performance | performance | database | null | 2 | 1 |
| V6_F3 | documentation | architecture | architecture | null | 2 | 1 |
| V6_G1 | database | security | null | null | 1 | 1 |
| V6_G2 | performance | performance | database | null | 2 | 1 |

### Mode Mismatches

11 cases had mode mismatches. The dominant direction was over-selection of mode=2 when mode=1 was expected (7 cases), primarily driven by false support activations.

### False Activations

**False frontend-ui activations (2 cases):**
- V6_D1_AGENT_BROWSER_EXPLICIT
- V6_D3_BROWSER_AUDIT_SPECIALIST_EXPLICIT

Both cases involved explicit external browser specialists where the task text contained "browser", "screenshots", "visual", or "reference" — terms present in `frontend-ui`'s description and headings.

**False testing activations (5 cases):**
- V6_A3_SCREENSHOT_REFERENCE_NAVIGATION
- V6_A4_VISUAL_COMPARISON_ITERATION
- V6_E1_BROWSER_USER_AGENT_API
- V6_E2_BROWSER_CACHE_HEADERS
- V6_E3_PLAYWRIGHT_DEPENDENCY_UPGRADE

In all five cases, the task mentioned words like "visual", "responsive", "browser", "regression", or "test" that appear in `testing`'s description and headings, causing incidental activation.

**False external activations:** 0

### Must-Not-Select Violations

0 violations. The `must_not_select` constraint was not violated in any case.

### Failure Classes

| Failure Class | Count |
|---------------|-------|
| SUPPORT_SELECTION_MISS | 12 |
| MODE_SELECTION_MISS | 11 |
| PRIMARY_RETRIEVAL_MISS | 8 |
| FALSE_TESTING_ACTIVATION | 5 |
| FALSE_FRONTEND_UI_ACTIVATION | 2 |

---

## INFERENCES

1. **The routing vocabulary surface is too broad and too narrow simultaneously.**  
   It is too broad because it uses full skill descriptions and headings, which contain generic terms like "browser", "visual", "responsive", "test", "regression" that activate skills for unrelated tasks. It is too narrow because it excludes body text, where many skills place their most specific routing vocabulary.

2. **Support over-selection is a significant secondary bottleneck.**  
   12 of 15 failures involve support mismatches. The support threshold `second.score >= max(2, first.score * 0.60)` allows a second-ranked skill with as little as 2 points to be selected when the primary scores 3 or less. This frequently pulls in `testing` or `frontend-ui` as spurious support.

3. **Primary ranking misses are caused by vocabulary impoverishment, not just lexical noise.**  
   In cases like V6_E1, V6_E2, V6_F1, and V6_G1, the expected primary skill scores 0 or 1 because its routing surface lacks the specific terms needed to match the task. Competing skills win by default or through incidental description matches.

4. **Explicit-name routing works correctly when it fires.**  
   All 3 explicit external browser cases correctly routed the external skill to primary (D1, D2, D3 all got the right external primary). The failures in group D were purely support over-selection.

5. **The current resolver is robust and stable.**  
   MAX_SPECIALISTS_INVARIANT=PASS, RESOLVER_CRASH_COUNT=0, ROBUSTNESS_PASS_RATE=1.0. The failures are correctness issues, not stability issues.

---

## HYPOTHESES

### H1: ENGINEERING KNOWLEDGE SURFACE ≠ ROUTING RELEVANCE SURFACE

**Status: CONFIRMED**

The resolver's `skillTerms()` function currently extracts routing vocabulary from `name + description + headings` only. This is not the same as the full engineering knowledge surface, but more importantly, it is also NOT an optimal routing relevance surface.

**Evidence:**

1. **Body text exclusion impoverishes routing:**  
   - `api-integration` description was rewritten to "Design and implement APIs, external integrations, webhooks, clients, and service boundaries using technology-agnostic principles." The body still contains "retry", "timeout", "outbound", "http clients", but these are invisible to routing because `skillTerms()` ignores body text.  
   - Result: V6_E1 (task mentions "retry", "timeout", "outbound", "api") → api-integration scores **0**. Security scores 2 from "outbound" + "api" (via "## 10. API Security" heading).  
   - Result: V6_E2 (task mentions "API", "cache-control headers", "response contract", "clients") → api-integration scores **0**. Testing scores 2 from "browser" + "api".

2. **Description/heading breadth causes false positives:**  
   - `frontend-ui` description contains "browser, reference, screenshot, responsive, visual, state, and rendering principles". Any task mentioning these words can falsely activate frontend-ui.  
   - `testing` description contains "browser tests, Playwright tests, integration tests, end-to-end tests, visual checks, responsive checks". Any task mentioning "browser", "visual", "responsive", or "test" can falsely activate testing.  
   - Result: 2 false frontend-ui activations, 5 false testing activations.

3. **Specific routing vocabulary is buried in body text:**  
   - `database` body contains "atomic operations", "duplicate creation", "concurrent writes", "transactions", but task V6_G1 ("atomic under concurrent requests, prevent duplicate settlement records") gets database score **0** because none of these terms appear in name/description/headings.  
   - `data-processing` body contains "malformed records", "retries", "exports", "batch processing", but task V6_F1 ("generates screenshots of PDF invoices for audit exports, including retry handling for malformed documents") gets data-processing score **0**.

**Conclusion:** The current routing surface is a poor proxy for routing relevance. It is neither the full engineering knowledge (which would include body text) nor a curated routing vocabulary (which would include only terms that meaningfully distinguish the capability). The hypothesis is confirmed by repository evidence.

### H2: Support Over-Selection Is a Separate Bottleneck

**Status: CONFIRMED as secondary bottleneck**

**Evidence:**

1. The support threshold `second.score >= max(2, first.score * 0.60)` creates inconsistent behavior:
   - When primary scores 3 (e.g., frontend-ui on V6_A3), threshold = 2. A support skill with score 2 passes.
   - When primary scores 7 (e.g., performance on V6_F2), threshold = 4.2. A support skill with score 4 fails.

2. 12 of 15 failures involve support mismatches. In 7 cases, mode was over-selected from 1 to 2 because a spurious support skill met the threshold.

3. The false testing activations (5 cases) often trigger mode=2 when mode=1 was expected, because testing gets 2+ points from incidental description vocabulary.

**Conclusion:** Support over-selection is real and significant, but it is downstream of the primary routing vocabulary problem. Fixing the routing surface would reduce the incidental scores that trigger spurious support selection. The support threshold itself may also need adjustment, but that is a separate variable.

---

## REJECTED HYPOTHETICAL ROOT CAUSES

### Rejected: "Explicit-name normalization is broken"

**Evidence:** All 3 explicit external browser cases correctly routed the external skill to primary. The normalization tests (`tests/explicit-name-normalization.mjs`) pass. Dashed, underscored, colon-separated, and space-separated name variants all work correctly. The explicit-name bonus (+3) fires reliably.

### Rejected: "External skill ranking is broken"

**Evidence:** FALSE_EXTERNAL_ACTIVATION_COUNT=0. No external skill was activated when it should not have been. External skills with explicit name matches always won primary. The `externalSkillAnchored()` function and evidence affinity mechanism appear correct.

### Rejected: "Project evidence is contaminating routing"

**Evidence:** The `buildRetrievalContext()` function only uses project evidence to boost external skills that have matching identity terms. It does not affect internal skill scoring. In the burned scenarios, most failures occurred with no project evidence relevance (e.g., V6_E1 through V6_G3).

### Rejected: "The max-specialists limit is being violated"

**Evidence:** MAX_SPECIALISTS_INVARIANT=PASS. MAX_SPECIALISTS_OBSERVED=2. No crash or overflow occurred.

---

## NEXT EXPERIMENT

### Primary Bottleneck

**PRIMARY_BOTTLENECK = ROUTING_VOCABULARY_SURFACE_MISMATCH**

The resolver's routing vocabulary surface (`name + description + headings`) is neither the full engineering knowledge surface nor a curated routing relevance surface. This causes:
- Vocabulary impoverishment for skills whose specific routing terms live in body text (api-integration, database, data-processing)
- Vocabulary bleed for skills whose descriptions contain broad generic terms (frontend-ui, testing)

### Secondary Bottleneck

**SECONDARY_BOTTLENECK = SUPPORT_OVER_SELECTION**

The support selection threshold `second.score >= max(2, first.score * 0.60)` is too permissive for low-scoring primaries and too strict for high-scoring primaries. It allows spurious support activations when incidental description vocabulary gives a second skill 2+ points.

---

## RESEARCH CANDIDATES

### Candidate 1: Explicit Routing Metadata (Selected for First Experiment)

**Name:** EXPLICIT_ROUTING_METADATA  
**Mechanism:** Introduce an optional `routing_terms` field in each skill's frontmatter metadata. The resolver's `skillTerms()` function uses ONLY `routing_terms` + normalized skill name for scoring, completely decoupling routing vocabulary from the engineering knowledge description and body text. For skills without `routing_terms`, fall back to a bounded fallback: skill name + first sentence of description (max 40 words). External skills without `routing_terms` fall back to name + first 40 words of description.

**Why this is the strongest candidate:**
- Directly addresses the confirmed root cause: engineering knowledge surface ≠ routing relevance surface
- Provides a clean, bounded, framework-agnostic routing vocabulary
- Eliminates vocabulary bleed from rich descriptions while preserving routing precision
- Allows skill authors to curate exactly which terms are relevant for routing
- Compatible with existing explicit-name routing and external skills
- Backward compatible: skills without `routing_terms` get a safe fallback

**Variables changed:** SINGLE (routing vocabulary surface only)

### Candidate 2: Support Threshold Tightening

**Name:** SUPPORT_THRESHOLD_TIGHTENING  
**Mechanism:** Change the support threshold from `second.score >= max(2, first.score * 0.60)` to `second.score >= max(3, first.score * 0.75)`. This requires stronger evidence for support selection and reduces spurious support activations from incidental 2-point matches.

**Why this is a valid candidate:**
- Directly targets the secondary bottleneck
- Simple, single-variable change
- Would reduce false testing activations and false frontend-ui activations

**Why it is NOT the first experiment:**
- It does not address the primary bottleneck (routing vocabulary mismatch)
- Tightening the threshold without fixing the vocabulary surface would just suppress symptoms while leaving the root cause intact
- Could create new false negatives for legitimate support needs

### Candidate 3: Intent-Anchored Context Gating

**Name:** INTENT_ANCHORED_CONTEXT_GATING  
**Mechanism:** Use the top-2 intent anchors from internal skill scoring as a gating mechanism. A support specialist can only be selected if it is one of the top-2 intent anchors OR if its score exceeds a higher absolute threshold (e.g., 4). This prevents unrelated skills from being pulled in as support based on incidental vocabulary overlap.

**Why this is a valid candidate:**
- Adds a semantic constraint that support must be thematically related to the primary
- Reduces spurious support activations

**Why it is NOT the first experiment:**
- It changes multiple variables (intent anchor usage + support threshold)
- It does not address the primary routing vocabulary problem
- It may be too restrictive for legitimate cross-cutting concerns

---

## FIRST EXPERIMENT SELECTION

**Chosen mechanism:** EXPLICIT_ROUTING_METADATA (Candidate 1)

**Single variable changed:** Routing vocabulary surface only.

**What is NOT changed in this experiment:**
- Support threshold (remains `max(2, first.score * 0.60)`)
- Explicit-name normalization (unchanged)
- Project evidence retrieval (unchanged)
- External ranking (unchanged)
- Specialist limit (unchanged)

**Implementation plan (not executed in this task):**
1. Add `routing_terms` metadata field to all 16 internal core skills
2. Modify `skillTerms()` in `engineer-flow.mjs` to prefer `routing_terms` when present
3. For skills without `routing_terms`, use bounded fallback (name + first 40 words of description)
4. Run calibration-v7 to validate

**Migration considerations:**
- Each internal skill needs curated routing terms that distinguish it from others
- Terms should be technology-agnostic and avoid framework-specific vocabulary
- The 16 internal cores should have minimal overlap in their routing terms
- External skills without `routing_terms` continue to work via fallback

---

## FRESH CALIBRATION-V7 DESIGN

### Strategy

Design `calibration-v7` as a fresh dataset with newly authored scenarios. Do NOT reuse heldout-v4, heldout-v5, or heldout-v6 cases.

### Scenario Families

calibration-v7 must test the routing vocabulary decoupling mechanism across multiple internal concerns. Include potential confusion families involving:

1. **Security vocabulary leaking into unrelated tasks**
   - Task mentions "injection", "CSRF", "XSS", "authentication" but the actual work is about data migration
   - Expected: data-processing or database, NOT security

2. **Performance vocabulary leaking into unrelated tasks**
   - Task mentions "latency", "throughput", "memory" but the actual work is about logging configuration
   - Expected: infrastructure-devops or debugging, NOT performance

3. **Database vocabulary leaking into unrelated tasks**
   - Task mentions "query", "index", "schema" but the actual work is about API rate limiting
   - Expected: api-integration or infrastructure-devops, NOT database

4. **Testing vocabulary leaking into implementation tasks**
   - Task mentions "test", "assertion", "mock", "coverage" but the actual work is about building a new feature
   - Expected: code-quality-refactoring or the relevant domain skill, NOT testing

5. **Documentation vocabulary leaking into architecture/tasks**
   - Task mentions "document", "readme", "comment", "diagram" but the actual work is about refactoring module boundaries
   - Expected: architecture or code-quality-refactoring, NOT documentation

6. **UI/browser vocabulary leaking into non-UI tasks**
   - Task mentions "view", "screen", "render", "display" but the actual work is about CLI tool output formatting
   - Expected: data-processing or infrastructure-devops, NOT frontend-ui

7. **External explicit specialist routing**
   - Tasks explicitly naming external skills with various delimiter styles (dashes, underscores, colons, spaces)
   - Expected: external skill as primary, with no spurious internal support

8. **Cross-cutting support validation**
   - Tasks that legitimately require 2 specialists (e.g., "build the UI and add regression tests")
   - Expected: correct primary + correct support, mode=2

9. **Single-specialist precision**
   - Tasks that clearly need only one specialist
   - Expected: mode=1, no spurious support

10. **Regression coverage for pre-v0.3.0 routing behaviors**
    - Tasks involving database transactions, API contracts, concurrent requests, security reviews
    - Expected: database, api-integration, performance, security as appropriate

### Scenario Count Target

12-16 scenarios, covering at least 8 of the 10 families above.

### Evaluation Flow

```
fresh calibration-v7 authoring
→ candidate implementation (EXPLICIT_ROUTING_METADATA)
→ regression validation (existing test suite)
→ fresh heldout-v7 authoring
→ heldout-v7 execution (one-time, then burned)
```

---

## VALIDATION

This task does not change production routing behavior. The following validation was planned:

- `npm.cmd run validate`
- `npm.cmd run self-test`
- `npm.cmd run test:normalization`
- `npm.cmd run test:browser-ui-routing`
- `npm.cmd run benchmark:routing`
- `git diff --check`

The heldout-v6 runner was NOT executed. No burned artifacts were modified.
