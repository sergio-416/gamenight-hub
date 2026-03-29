# Security Policy

## Supported Versions

GameNight Hub is in **pre-release development** (`0.x`). There are no stable releases yet.

| Branch                  | Supported |
| ----------------------- | --------- |
| `main` (latest commit)  | Yes       |
| Anything else            | No        |

Only the latest commit on `main` receives security fixes. There is no backporting to older commits or tags during pre-release.

## Reporting a Vulnerability

**Please do not open a public issue for security vulnerabilities.**

Use [GitHub Private Vulnerability Reporting](https://github.com/sergio-416/gamenight-hub/security/advisories/new) to submit your report. This ensures the details stay confidential until a fix is available.

### What to include

- Description of the vulnerability and its potential impact
- Steps to reproduce or a proof of concept
- Affected component(s) (frontend, backend API, infrastructure, dependencies)
- Your suggested severity (Critical / High / Medium / Low)

### What to expect

| Step                                   | Timeline                                  |
| -------------------------------------- | ----------------------------------------- |
| Acknowledgement of your report         | Within **48 hours**                       |
| Initial triage and severity assessment | Within **7 days**                         |
| Fix development and verification       | Best effort, varies by severity           |
| Public disclosure (coordinated)        | Up to **90 days** from report             |

If we cannot meet these timelines, we will communicate the reason and a revised estimate within the advisory thread.

## Scope

### In scope

- Authentication and authorization flaws (Firebase auth bypass, JWT manipulation, guard bypasses)
- Injection vulnerabilities (SQL injection, XSS, command injection)
- Sensitive data exposure (API keys, credentials, PII leaks)
- Server-side request forgery (SSRF)
- Broken access control between user roles
- Dependency vulnerabilities with a demonstrated exploit path
- Infrastructure misconfigurations (Nginx, Docker, TLS)

### Out of scope

- Denial of service (DoS/DDoS) against the production host
- Rate limiting thresholds being "too generous" (these are intentional)
- Social engineering or phishing attacks
- Vulnerabilities in third-party services we depend on (Firebase, Resend, BoardGameGeek API) -- report those to the respective vendors
- Reports from automated scanners without a demonstrated impact
- Findings that require physical access to the server

## Current Security Measures

- **Static analysis**: CodeQL runs on every push to `main`, every PR, and on a weekly schedule (JavaScript/TypeScript + GitHub Actions)
- **Dependency monitoring**: Dependabot is configured for automated version updates across Bun packages, GitHub Actions, Docker base images, and Docker Compose service images
- **HTTP hardening**: Helmet with strict security headers (`X-Frame-Options`, `X-Content-Type-Options`, HSTS)
- **Rate limiting**: Global and per-endpoint throttling via `@nestjs/throttler`; Nginx `limit_req` at the reverse proxy layer
- **Transport security**: TLS 1.2/1.3 only, HSTS enabled, OCSP stapling
- **Authentication**: Firebase Admin SDK for server-side token verification; passwordless magic link flow (no passwords stored)
- **Input validation**: Zod schemas for environment variables and request payloads
- **Infrastructure**: Docker containers running as non-root, Nginx reverse proxy with `server_tokens off`
- **CORS**: Restricted to the configured frontend origin only

## Disclosure Policy

We follow **coordinated disclosure**:

1. Reporter submits via GitHub Private Vulnerability Reporting.
2. We acknowledge receipt and begin triage.
3. We develop and verify a fix.
4. We publish a [GitHub Security Advisory](https://github.com/sergio-416/gamenight-hub/security/advisories) with full details and credit the reporter (unless they prefer anonymity).
5. The fix is deployed and the advisory is made public.

The default disclosure window is **90 days** from the initial report. If a fix requires more time, we will negotiate an extension with the reporter. We will not request extensions beyond **120 days** except in extraordinary circumstances.

We will **credit reporters** by name (or handle) in the advisory unless they opt out.

## Security Updates

During pre-release, security patches are applied directly to `main` and deployed. There are no versioned releases to track yet.

When the project reaches stable releases (`1.0.0+`), security fixes will be communicated through:

- [GitHub Security Advisories](https://github.com/sergio-416/gamenight-hub/security/advisories)
- Release notes on tagged versions

To be notified of security advisories, **watch** this repository and enable notifications for security alerts.

## Sensitive Data

All secrets (Firebase credentials, database passwords, API keys) are managed through environment variables and are **never committed to the repository**. The backend validates required environment variables at startup via Zod schema validation -- the process exits immediately if any are missing or malformed.

If you believe you have found a committed secret, please report it immediately through the vulnerability reporting process above.
