# Branch Protection Checklist

These settings are configured in GitHub, not in committed files. Use this as
the maintainer checklist before opening COSMQ to broader contribution.

## Protect `main`

Repository settings -> Branches -> Branch protection rules -> Add rule:

- Branch name pattern: `main`
- Require a pull request before merging
- Require approvals: at least 1
- Dismiss stale pull request approvals when new commits are pushed
- Require review from Code Owners
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Required checks:
  - `Lint, typecheck, build`
- Require conversation resolution before merging
- Require linear history
- Do not allow force pushes
- Do not allow deletions

## Repository Options

Repository settings -> General:

- Enable auto-delete head branches after merge.
- Disable merge commits if the project wants squash-only history.

Repository settings -> Code security and analysis:

- Enable private vulnerability reporting.
- Enable Dependabot alerts.
- Enable Dependabot security updates.

Repository settings -> Actions:

- Allow GitHub Actions.
- Keep workflow permissions read-only by default.
- Require explicit permissions in workflows that need write access.

## Contributor Workflow

- External contributors should open pull requests from forks.
- Maintainer-authored automation may push fixup commits only to branches owned
  by `arioberek`.
- Contributors keep attribution for their work; avoid force-pushing over their
  commits or rewriting their branch history.
