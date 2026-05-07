---
name: babysitter
description: Monitor an arioberek/COSMQ pull request, keep GitHub Actions checks green, and safely address human plus AI-agent review feedback before merge.
user-invocable: true
command: /babysit
repository: arioberek/COSMQ
---

# COSMQ PR Babysitter

## Objective

Babysit an `arioberek/COSMQ` pull request until one of these terminal outcomes
occurs:

- The PR is merged or closed.
- The current head SHA has all required checks green, no unresolved actionable
  review threads, and no unresolved error reports from AI/bot reviewers.
- User help is required because of permissions, missing credentials, repeated
  infrastructure failures, or an ambiguous product decision.

Do not stop merely because the watcher reports `idle` while checks, review
threads, or agent reports are still pending.

## Current Project Shape

COSMQ is an MIT-licensed open-source mobile database client with a landing site.

- Package manager: Bun workspaces, Turbo.
- Mobile app: Expo, React Native, expo-router, Tamagui under `apps/mobile`.
- Landing site: Astro, React, Tailwind under `apps/landing`.
- Release flow: Changesets through `.github/workflows/release.yml`.
- CI: GitHub Actions only. The PR CI workflow runs lint, typecheck, and build.
- Review automation: CodeRabbit is the primary AI reviewer. GitHub Copilot and
  other bot comments may also appear.
- Not currently present: CircleCI, Vercel previews, Macroscope, Codecov,
  Semgrep, coverage gates, or quality-gate artifacts.

## Inputs

Accept any of the following:

- No PR argument: infer the PR from the current branch with `--pr auto`.
- PR number.
- PR URL.

## Core Workflow

1. Start with the watcher in continuous mode unless the user explicitly asks for
   a one-shot snapshot.
2. Read each JSON snapshot from `scripts/gh_pr_watch.py`.
3. Prioritize actions in this order:
   - `process_review_comment`
   - `process_ai_agent_report`
   - `diagnose_ci_failure`
   - `wait_for_pending_checks`
4. If `reviewItems.items` or unresolved review threads are present, process
   review feedback in severity order: CRITICAL, HIGH, MEDIUM, LOW. New comments
   are higher priority than previous-round comments unless a previous comment is
   still unresolved.
5. If `botReports.problemReports` is non-empty, inspect each linked report
   before treating the PR as healthy. This includes CodeRabbit, GitHub Copilot,
   GitHub Actions, Dependabot, Renovate, and similar agents.
6. If GitHub Actions or another required check failed, open the failed check URL
   and classify it:
   - Biome lint or format failure.
   - TypeScript typecheck failure.
   - Turbo, Astro, or Expo build failure.
   - Missing changeset for non-trivial `apps/` or `packages/` changes.
   - External infrastructure or permissions failure.
7. Patch locally only when the fix is safe and scoped.
8. Re-run the smallest reliable local verification first, then the broader repo
   checks before pushing.
9. Commit and push after local verification passes.
10. Reply to GitHub review threads and bot reports only after the fix is pushed.
    Replies must say what was fixed and include the commit hash.
11. Restart or continue the watcher on the updated SHA after any push or rerun.

## Review Comment Handling

Use `references/review-response.md` when `reviewItems.items`,
`reviews.unresolvedThreads`, or `botReports.problemReports` include review
feedback that needs a fix, reply, or resolution.

At minimum:

- Treat CRITICAL and HIGH comments as blocking unless the user explicitly says
  otherwise.
- Use `reviewItems.summary.newActionableCount` to spot feedback posted after the
  current head commit.
- Reply after pushing with `Fixed in <hash>. <brief description>.`
- Resolve the matching thread after replying when GitHub permissions allow it.

## Watcher Commands

Run from the repository root.

### One-shot snapshot

```bash
python3 .claude/skills/babysitter/scripts/gh_pr_watch.py --pr auto --once
```

### Continuous watch

```bash
python3 .claude/skills/babysitter/scripts/gh_pr_watch.py --pr auto --watch
```

### Explicit PR target

```bash
python3 .claude/skills/babysitter/scripts/gh_pr_watch.py --pr <number-or-url> --once
```

### Attempt GitHub Actions Retry

```bash
python3 .claude/skills/babysitter/scripts/gh_pr_watch.py --pr <number-or-url> --retry-failed-now
```

## Local Verification Matrix

### Full repo baseline

```bash
bun install
bun run typecheck
bun run lint
bun run build
```

### Mobile only

```bash
bun --cwd apps/mobile run typecheck
```

### Landing only

```bash
bun --cwd apps/landing run build
```

### Format and lint

```bash
bunx biome check .
```

### Changeset hygiene

```bash
ls .changeset/*.md
bunx changeset status
```

## AI/Bot Report Policy

- Treat bot reports as blockers when they contain failures, errors,
  vulnerabilities, actionable comments, requested changes, regressions, or
  explicit "fix this" language.
- Treat bot reports as informational when they clearly say no issues were
  found, checks passed, or only describe a deployment URL.
- Always inspect the linked report body before acting. Many bots post summary
  comments while details live in inline review comments or check-run pages.
- Deduplicate repeated reports from the same bot on the same SHA; do not reply
  to the same stale report repeatedly.
- Fix correctness, security, reliability, and maintainability issues before
  stylistic issues.
- Do not change public API behavior, local credential handling, database
  protocol behavior, release configuration, or deployment configuration without
  explicit user approval.
- If a bot flags generated output, caches, `.expo`, `dist`, `.tamagui`, or
  local artifacts, first check whether the analysis scope is wrong before
  editing code.

## Review Thread Policy

- Treat unresolved human and bot review threads as first-class blockers.
- Always fetch both inline comments and PR-level review bodies; use
  `references/review-response.md` for reply and resolution mechanics.
- Deduplicate stale bot comments by checking whether the referenced diff and
  head SHA still match.
- If a comment is already fixed by the current head SHA, reply once with the
  commit or file reference and resolve it when permissions allow.
- If a comment is invalid or asks a question, reply once with the reason and
  leave the thread unresolved only if a human decision is needed.
- Do not reply repeatedly to your own prior replies if the watcher surfaces
  them again.
- Never use emojis in thread replies or commit messages.

## OSS Guardrails

- Never merge a PR. The maintainer (`@arioberek`) merges. The skill may push
  scoped fix commits and reply to threads only when the PR branch is owned by
  `arioberek`.
- Preserve contributor attribution. Do not rewrite, squash, or force-push over
  contributor commits; add new commits on top.
- If `pr.headRepositoryOwner` is not `arioberek`, downgrade to read-only mode:
  analyze, summarize, and advise. Do not push to forks the maintainer does not
  own.
- Respect changeset hygiene. Flag PRs missing a changeset for non-trivial app
  or package changes, but do not invent a version bump without maintainer
  direction.
- Flag changes touching `LICENSE`, package license fields, credential storage,
  database protocol implementations, release workflows, or new third-party code
  attribution for maintainer review.
- Do not change public API behavior, local credential handling, database
  protocol behavior, release configuration, or deployment configuration without
  explicit user approval.

## Stop Conditions

Stop only when one of these is true:

- PR is merged or closed.
- The user explicitly asks to stop and the current snapshot is healthy.
- User help is required.

Keep polling when:

- `actions` contains only `idle` but checks are queued, running, expected, or
  missing.
- CI is green but AI-agent reports still contain unresolved errors.
- Checks are green but review threads are unresolved.
- The PR remains open and branch protection, mergeability, or review state can
  still change.

## Escalation Format

When user help is required, report:

- PR number and current head SHA.
- Check summary, bot-report summary, and failed URLs.
- Unresolved review threads, bot reports, or failure URLs.
- What you tried locally.
- The smallest concrete decision or credential needed from the user.
