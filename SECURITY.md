# Security Policy

COSMQ is a database client. Reports involving credential handling, connection
string storage, query execution, local persistence, or database protocol
handling are treated as security-sensitive even when the impact is not
immediately obvious.

## Reporting a Vulnerability

Do not open a public GitHub issue for suspected vulnerabilities.

Use GitHub private vulnerability reporting:

https://github.com/arioberek/COSMQ/security/advisories/new

If that is not available, email the maintainer at contact@arielton.com with:

- A short description of the issue
- Steps to reproduce, if known
- Affected platform or app area (`apps/mobile`, `apps/landing`, CI, release)
- Potential impact
- Any proposed fix or mitigation

Please avoid sharing exploit details publicly until a fix is available.

## Response Expectations

The maintainer will acknowledge valid reports as soon as practical and may ask
for more details to confirm reachability and impact. Confirmed vulnerabilities
will be fixed privately when needed, then disclosed with appropriate credit
unless the reporter requests otherwise.

## Supported Versions

COSMQ is pre-1.0 and under active development. Security fixes target the
current `main` branch unless a published release requires a backport.

## Scope

In scope:

- Unsafe handling of database credentials or connection strings
- Query execution bugs that could expose unintended data
- Local storage issues that leak sensitive connection metadata
- Dependency or build pipeline vulnerabilities that affect distributed builds
- Landing-site issues that could compromise users or downloads

Out of scope:

- Social engineering
- Reports that require physical access to an unlocked developer machine
- Denial-of-service reports without a realistic user impact
- Vulnerabilities in third-party database servers unless COSMQ meaningfully
  worsens the exposure
