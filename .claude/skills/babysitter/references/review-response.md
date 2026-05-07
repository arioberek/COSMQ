# Review Response Playbook

Use this when `reviewItems.items`, `reviews.unresolvedThreads`, or `botReports.problemReports` include review feedback that needs a fix, reply, or resolution.

## Review Surfaces

The watcher combines three sources:

- GraphQL review threads (`reviews.unresolvedThreads`) for current resolved/unresolved state.
- Inline pull-request review comments (`reviewItems.items` with `source` `pull_comment` or `review_comment`) for REST reply IDs.
- PR-level review bodies (`reviewItems.items` with `source` `review_body_section`) for CodeRabbit, Gemini, Cursor, Codex, Devin, and similar summary reports that may not have inline threads.

## Processing Order

1. Process comments by severity: CRITICAL, HIGH, MEDIUM, LOW.
2. Prioritize new comments over previous-round comments unless the older comment is still unresolved.
3. Treat CodeRabbit duplicate comments as higher priority than their visible severity because the issue survived a prior review.
4. Group related comments by file, root cause, duplicate marker, and "also applies to" ranges.
5. Read the affected code before patching, even when the bot provides a proposed fix or "Prompt for AI Agents".
6. Patch every range mentioned by the comment, including "also applies to" ranges and outside-diff sections.
7. Batch related fixes before pushing to avoid bot review loops.
8. Run the relevant local verification matrix.
9. Push the fix.
10. Reply with what changed and the commit hash, then resolve the thread when GitHub permits it.

## Reply Templates

Use short, professional replies without emojis:

- Fixed: `Fixed in <hash>. <brief description of the fix.>`
- Already fixed: `Already fixed in <hash-or-current-head>. <brief explanation and file/function reference.>`
- Won't fix: `Won't fix: <reason.>`
- By design: `By design: <reason.>`
- Deferred: `Deferred to <issue/task>. <why this is not safe to do in this PR.>`
- Acknowledged: `Acknowledged. <brief note.>`

## Inline Replies

Inline comments support direct replies. Use the numeric REST comment ID, not the GraphQL thread ID:

```bash
gh api repos/arioberek/COSMQ/pulls/<pr>/comments \
  --input - <<< '{"body":"Fixed in <hash>. <what changed>.","in_reply_to":<comment-id>}'
```

GraphQL review threads can be resolved after replying:

```bash
gh api graphql -f query='mutation($threadId:ID!){ resolveReviewThread(input:{threadId:$threadId}) { thread { id isResolved } } }' -F threadId=<thread-id>
```

## Review Body Comments

PR-level review body items, such as CodeRabbit outside-diff, duplicate, minor, and nitpick sections, do not have inline reply targets. Post one PR comment that references the section and file/range when available:

```bash
gh pr comment <pr> --body "Fixed in <hash>. Addresses CodeRabbit outside-diff feedback on <file-or-section>."
```

After handling all comments, submit a short progress review when useful:

```bash
gh pr review <pr> --comment --body "Addressed the current automated review comments in <hash>. Remaining blocker: <only-if-any>."
```

## Required Checks

- Always fetch both inline comments and PR-level review bodies; some bots put actionable comments only inside a review body or review-specific comments endpoint.
- Cross-check CodeRabbit "Actionable comments posted: N" against inline comments; use `reviewItems.reviewGaps` to find comments that required review-specific fallback fetching.
- Use CodeRabbit "Prompt for AI Agents" text as context when present, but still verify against the current code.
- Do not reply repeatedly to your own prior replies if the watcher surfaces them again.
- Do not use emojis in thread replies or commit messages.
