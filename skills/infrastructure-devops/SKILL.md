---
name: infrastructure-devops
description: Design and maintain deployment, runtime, CI/CD, containers, workers, scheduling, and operational infrastructure using platform-agnostic principles.
---

# infrastructure-devops

Use this skill for deployment, CI/CD, containers, scheduling, workers, runtime configuration, health checks, and operational automation.

## Principles

Prefer reproducible and observable deployment processes.

Separate configuration from application source where appropriate.

Automated workflows should fail clearly and avoid silently publishing broken artifacts.

Consider:

- build reproducibility
- health checks
- restart behavior
- rollout strategy
- rollback strategy
- resource limits
- secret handling
- logs
- monitoring

Background and scheduled workloads should define:

- ownership
- retries
- duplicate execution behavior
- concurrency
- failure handling

Do not assume local development behavior represents production behavior.

## Adaptation

Use project evidence to determine the actual language, framework, runtime, and existing conventions.

If a matching technology adapter exists, use it only to translate these principles into native mechanisms.

Do not allow an adapter to redefine the engineering concern or weaken the core requirement.