# Routing Contract

Routing output must be strict JSON with finite numeric signals in `[0,1]`.

```json
{
  "task_family": "database",
  "task_subtype": "query-performance",
  "knowledge_need": 0.82,
  "confidence": 0.76,
  "risk": 0.55,
  "generic_sufficiency": 0.18,
  "cross_cutting_signal": 0.64,
  "specialist_marginal_value": 0.81,
  "mode": 2,
  "primary": {
    "name": "postgres-query-optimization",
    "source": "installed"
  },
  "support": {
    "name": "testing",
    "source": "bundled"
  }
}
```

## Gates

- If normalized signals are missing or invalid, retry schema formatting once when a model call is involved.
- If knowledge need is low or generic sufficiency is high, prefer mode 0.
- Classify task family first.
- Rank primary only among compatible non-meta candidates.
- Require a genuine cross-cutting signal before support selection.
- Select support only from compatible families.
- Enforce max specialist count of 2.

## Fallback

If no specialist is suitable, choose mode 0 or a bundled general fallback. Do not select a weak installed skill only because a keyword overlaps.
