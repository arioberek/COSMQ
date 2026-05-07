# Contributing to COSMQ

Thanks for your interest in COSMQ. This is a small open-source project, and contributions of any size are welcome — typo fixes, bug reports, new database driver support, or design polish.

This guide covers the practical parts: setting up the repo, the workflow we use, and what to expect from review.

## Code of Conduct

By participating in this project you agree to abide by the [Code of Conduct](./CODE_OF_CONDUCT.md). In short: be kind, assume good intent, and keep discussions on the technical merits.

## Reporting issues

- **Bugs** — open an issue using the "Bug report" template. Include device, OS, COSMQ version, the database type involved, and the reproduction steps.
- **Feature requests** — use the "Feature request" template. Describe the problem first, then the proposed solution.
- **Security vulnerabilities** — do **not** open a public issue. See [SECURITY.md](./SECURITY.md) for the disclosure process.

## Development setup

### Requirements

- [Bun](https://bun.sh) `1.2.0` or newer
- Node.js `>=18` (Bun ships its own runtime, but some Expo tooling still calls into Node)
- For mobile development:
  - macOS + Xcode for iOS
  - Android Studio for Android
  - An iOS simulator or Android emulator, or a physical device with the [Expo Go](https://expo.dev/go) app installed

### First-time setup

```sh
git clone https://github.com/arioberek/COSMQ.git
cd COSMQ
bun install
```

### Running the apps

```sh
# Mobile app (Expo dev server)
bun run dev:mobile

# Landing site (Astro)
bun --cwd apps/landing run dev
```

Once the Expo dev server is up, press `i` to open iOS, `a` for Android, or scan the QR code with Expo Go.

### Test databases

The mobile app talks to whatever PostgreSQL, MySQL, MongoDB, or SQLite instance you point it at. For local development, any of these work:

- A managed dev database (Neon, Supabase, PlanetScale, MongoDB Atlas free tier).
- A locally installed database (`brew install postgresql mysql mongodb-community` on macOS, or your distro's package manager on Linux).
- A SQLite file the app creates on-device.

There is no bundled `docker-compose.yml`; if you'd like to add one, that's a welcome contribution.

## Workflow

### Branches

Branch off `main` and follow this naming convention:

- `feat/<short-description>` — new features
- `fix/<short-description>` — bug fixes
- `refactor/<short-description>` — non-behavior-changing refactors
- `polish/<short-description>` — UI polish, animations, micro-interactions
- `docs/<short-description>` — documentation only

### Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/) with a scope:

```
feat(mobile): add MongoDB authentication support
fix(landing): correct logo alignment on mobile breakpoints
refactor(mobile): extract query history into its own store
docs: add SECURITY policy
```

Common scopes: `mobile`, `landing`, `repo`, `ci`, `docs`.

### Before opening a PR

Run these locally:

```sh
bun run lint          # Biome
bun run typecheck     # tsc --noEmit
bun run build         # turbo build
```

If your change affects user-visible behavior in `apps/mobile` or `apps/landing`, add a changeset:

```sh
bun run changeset
```

Pick `patch` for fixes, `minor` for backward-compatible features, and `major` only for breaking changes. Skip the changeset for repo-only changes (CI, docs, internal tooling).

### Pull request

Open the PR against `main`. The PR template will prompt you for a summary, the type of change, screenshots if it's a UI change, and a testing checklist.

Expect the following automated review:

1. **CI** runs lint, typecheck, and build. Required to be green before merge.
2. **CodeRabbit** posts an inline review with suggestions. Address blocking comments; nitpicks are optional.
3. **Maintainer review.** A maintainer (`@arioberek`) reviews architecture, design coherence, and whether the change fits the project's direction.
4. **Babysitter** — for active PRs, the maintainer may run `/babysit` (an in-house Claude Code skill) which monitors checks and helps resolve review comments. You'll see fixup commits authored by `claude[bot]` if so.

Squash-and-merge is the default. Your commit messages don't need to be polished — the maintainer will rewrite the merge commit if needed. What matters is that the PR title is in the Conventional Commits format.

## Coding conventions

- **Formatting** — Biome handles it. `bun run format` to apply, `bun run format:check` to verify.
- **Linting** — Biome again. `bun run lint` should be clean. Warnings are allowed; errors are not.
- **Types** — strict TypeScript everywhere. Avoid `any`; prefer `unknown` and narrow it explicitly.
- **No tests yet** — the project has no test suite. Adding one is welcome but is itself a meaningful contribution; coordinate with the maintainer first to pick a framework (Vitest is the likely choice).
- **Comments** — let well-named identifiers do the explaining. Reserve comments for the *why*, not the *what*.

## Project structure

```
apps/
  mobile/      Expo + React Native app (Tamagui, Zustand, expo-router)
  landing/     Astro marketing site (React + Tailwind)
packages/
  tsconfig/    Shared TypeScript config
.changeset/    Pending version bumps (one .md file per change)
.github/       Workflows, issue and PR templates, CODEOWNERS
docs/          Operational docs for maintainers
```

Database protocol implementations live under `apps/mobile/lib/protocols/{postgres,mysql,mongodb,sqlite,mock}/`.

## Questions

If something in this guide is unclear, that's a documentation bug — please open an issue or a PR to fix it.
