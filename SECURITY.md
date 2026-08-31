# Security Policy

## Supported Versions

Current supported stable line: 0.2.x

Research branches and burned benchmark artifacts are not production releases.

## Reporting a Vulnerability

Do not disclose security vulnerabilities publicly through GitHub Issues before coordinated review.

Preferred reporting channel: GitHub private vulnerability reporting / Security Advisories.

If private vulnerability reporting is not available, contact the repository maintainer privately through the contact method already publicly available in the repository/profile.

## What to Include

- affected version / commit
- reproduction steps
- impact
- relevant configuration
- proof-of-concept when safe
- suggested remediation if available

## Scope

Security-sensitive surfaces include:

- security gate / pre-commit enforcement
- external skill discovery
- project evidence handling
- persistent memory / secret filtering
- installer / hook chaining
- command execution or path handling

Benchmark quality or routing regressions without a security impact should use normal issues. Routing accuracy alone is not necessarily a security vulnerability.

## Disclosure

Reasonable coordinated disclosure is preferred. No fixed response SLA is promised.
