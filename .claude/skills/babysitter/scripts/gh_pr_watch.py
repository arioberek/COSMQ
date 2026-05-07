#!/usr/bin/env python3
"""Watch a GitHub PR and emit COSMQ babysitter JSON snapshots."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any


PR_VIEW_FIELDS = ",".join(
    [
        "number",
        "url",
        "state",
        "title",
        "isDraft",
        "headRefName",
        "headRefOid",
        "headRepositoryOwner",
        "baseRefName",
        "mergeable",
        "mergeStateStatus",
        "reviewDecision",
        "statusCheckRollup",
        "commits",
        "updatedAt",
    ]
)


BOT_AUTHOR_PATTERNS = (
    "[bot]",
    "bot",
    "devin",
    "codex",
    "github-actions",
    "github-copilot",
    "copilot",
    "coderabbit",
    "code-rabbit",
    "gemini",
    "cursor",
    "macroscope",
    "vercel",
    "codecov",
    "renovate",
    "dependabot",
)

BOT_PROBLEM_TERMS = (
    "actionable",
    "blocked",
    "bug",
    "changes requested",
    "critical",
    "error",
    "fail",
    "failed",
    "failing",
    "fix",
    "high severity",
    "medium severity",
    "problem",
    "quality gate",
    "regression",
    "request changes",
    "security",
    "vulnerab",
)

BOT_SUCCESS_TERMS = (
    "all checks passed",
    "approved",
    "deployment completed",
    "looks good",
    "no issues found",
    "no problems found",
    "passed",
    "successfully deployed",
)

SEVERITY_RANK = {
    "CRITICAL": 0,
    "HIGH": 1,
    "MEDIUM": 2,
    "LOW": 3,
    "UNKNOWN": 4,
}

REVIEW_BODY_SECTION_PATTERNS = (
    ("outside", "outside diff range comments", "MEDIUM"),
    ("duplicate", "duplicate comments", "HIGH"),
    ("critical", "critical comments", "CRITICAL"),
    ("major", "major comments", "HIGH"),
    ("minor", "minor comments", "LOW"),
    ("nitpick", "nitpick comments", "LOW"),
)


@dataclass(frozen=True)
class CommandResult:
    returncode: int
    stdout: str
    stderr: str


class WatcherError(RuntimeError):
    """Raised when the watcher cannot collect required PR state."""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def parse_github_time(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def latest_commit_time(pr: dict[str, Any]) -> datetime | None:
    commits = pr.get("commits")
    if not isinstance(commits, list):
        return None
    times = [
        parsed
        for commit in commits
        if isinstance(commit, dict)
        for parsed in [parse_github_time(commit.get("committedDate"))]
        if parsed is not None
    ]
    return max(times) if times else None


def is_stale_for_head(created_at: Any, head_time: datetime | None) -> bool:
    created = parse_github_time(created_at)
    return bool(created and head_time and created < head_time)


def run_command(args: list[str], *, check: bool = True) -> CommandResult:
    result = subprocess.run(args, capture_output=True, text=True, check=False)
    command_result = CommandResult(result.returncode, result.stdout, result.stderr)
    if check and result.returncode != 0:
        message = result.stderr.strip() or result.stdout.strip() or "command failed"
        raise WatcherError(f"{' '.join(args)}: {message}")
    return command_result


def run_json(args: list[str], *, check: bool = True) -> Any:
    result = run_command(args, check=check)
    if result.returncode != 0 or not result.stdout.strip():
        return None
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as error:
        raise WatcherError(f"{' '.join(args)} returned invalid JSON: {error}") from error


def resolve_pr_target(target: str) -> str:
    if target == "auto":
        return ""
    match = re.search(r"/pull/(\d+)", target)
    if match:
        return match.group(1)
    return target


def gh_pr_view(target: str) -> dict[str, Any]:
    command = ["gh", "pr", "view"]
    resolved = resolve_pr_target(target)
    if resolved:
        command.append(resolved)
    command.extend(["--json", PR_VIEW_FIELDS])
    data = run_json(command)
    if not isinstance(data, dict):
        raise WatcherError("gh pr view did not return an object")
    return data


def gh_repo() -> dict[str, str]:
    data = run_json(["gh", "repo", "view", "--json", "owner,name"])
    if not isinstance(data, dict):
        raise WatcherError("gh repo view did not return an object")
    owner = data.get("owner")
    owner_login = owner.get("login") if isinstance(owner, dict) else None
    name = data.get("name")
    if not owner_login or not name:
        raise WatcherError("could not resolve GitHub owner/name")
    return {"owner": owner_login, "name": str(name)}


def flatten_nodes(value: Any) -> list[dict[str, Any]]:
    if isinstance(value, list):
        return [item for item in value if isinstance(item, dict)]
    if isinstance(value, dict):
        nodes = value.get("nodes")
        if isinstance(nodes, list):
            return [item for item in nodes if isinstance(item, dict)]
    return []


def normalize_state(raw_status: str | None, raw_conclusion: str | None) -> str:
    status = (raw_status or "").upper()
    conclusion = (raw_conclusion or "").upper()
    if conclusion in {"SUCCESS", "NEUTRAL", "SKIPPED"} or status == "SUCCESS":
        return "passing"
    if conclusion in {"FAILURE", "ERROR", "TIMED_OUT", "CANCELLED", "ACTION_REQUIRED"}:
        return "failing"
    if status in {"FAILURE", "ERROR"}:
        return "failing"
    if status in {"PENDING", "EXPECTED", "QUEUED", "REQUESTED", "WAITING", "IN_PROGRESS"}:
        return "pending"
    if conclusion:
        return conclusion.lower()
    if status:
        return status.lower()
    return "unknown"


def check_name(item: dict[str, Any]) -> str:
    for key in ("name", "context", "workflowName", "displayName"):
        value = item.get(key)
        if isinstance(value, str) and value:
            return value
    return "unknown"


def normalize_rollup_check(item: dict[str, Any]) -> dict[str, Any]:
    name = check_name(item)
    raw_status = item.get("status") or item.get("state")
    raw_conclusion = item.get("conclusion")
    url = item.get("detailsUrl") or item.get("targetUrl") or item.get("link")
    workflow = item.get("workflowName") or item.get("workflow")
    state = normalize_state(
        str(raw_status) if raw_status is not None else None,
        str(raw_conclusion) if raw_conclusion is not None else None,
    )
    return {
        "name": name,
        "state": state,
        "rawStatus": raw_status,
        "conclusion": raw_conclusion,
        "workflow": workflow,
        "url": url,
    }


def gh_pr_checks(pr_number: int) -> list[dict[str, Any]]:
    data = run_json(
        [
            "gh",
            "pr",
            "checks",
            str(pr_number),
            "--json",
            "name,state,bucket,link,description,workflow",
        ],
        check=False,
    )
    if not isinstance(data, list):
        return []
    checks: list[dict[str, Any]] = []
    for item in data:
        if not isinstance(item, dict):
            continue
        raw_state = item.get("state") or item.get("bucket")
        normalized = normalize_state(str(raw_state) if raw_state is not None else None, None)
        checks.append(
            {
                "name": str(item.get("name") or "unknown"),
                "state": normalized,
                "rawStatus": raw_state,
                "conclusion": item.get("bucket"),
                "workflow": item.get("workflow"),
                "url": item.get("link"),
                "description": item.get("description"),
            }
        )
    return checks


def collect_checks(pr: dict[str, Any]) -> dict[str, Any]:
    pr_number = int(pr["number"])
    checks = gh_pr_checks(pr_number)
    if not checks:
        rollup = flatten_nodes(pr.get("statusCheckRollup"))
        checks = [normalize_rollup_check(item) for item in rollup]

    passing = [item for item in checks if item["state"] == "passing"]
    failing = [item for item in checks if item["state"] == "failing"]
    pending = [item for item in checks if item["state"] == "pending"]
    skipped = [item for item in checks if item["state"] in {"skipped", "neutral"}]
    github_actions = [
        item
        for item in checks
        if item.get("workflow") or "github-actions" in item["name"].lower()
    ]
    agent_checks = [
        item
        for item in checks
        if any(pattern in item["name"].lower() for pattern in BOT_AUTHOR_PATTERNS)
    ]

    return {
        "summary": {
            "total": len(checks),
            "passing": len(passing),
            "pending": len(pending),
            "failing": len(failing),
            "skipped": len(skipped),
        },
        "checks": checks,
        "failing": failing,
        "pending": pending,
        "githubActions": github_actions,
        "agentChecks": agent_checks,
    }


def graphql_review_threads(owner: str, repo: str, pr_number: int) -> list[dict[str, Any]]:
    query = """
    query($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $number) {
          reviewThreads(first: 100) {
            nodes {
              id
              isResolved
              isOutdated
              path
              line
              comments(first: 20) {
                nodes {
                  id
                  body
                  url
                  createdAt
                  author {
                    login
                  }
                }
              }
            }
          }
        }
      }
    }
    """
    data = run_json(
        [
            "gh",
            "api",
            "graphql",
            "-f",
            f"query={query}",
            "-F",
            f"owner={owner}",
            "-F",
            f"repo={repo}",
            "-F",
            f"number={pr_number}",
        ],
        check=False,
    )
    try:
        nodes = data["data"]["repository"]["pullRequest"]["reviewThreads"]["nodes"]
    except (TypeError, KeyError):
        return []
    return [node for node in nodes if isinstance(node, dict)]


def summarize_review_threads(threads: list[dict[str, Any]]) -> dict[str, Any]:
    unresolved = [thread for thread in threads if not thread.get("isResolved")]
    summarized = []
    for thread in unresolved:
        comments = flatten_nodes(thread.get("comments"))
        last_comment = comments[-1] if comments else {}
        author = last_comment.get("author")
        login = author.get("login") if isinstance(author, dict) else None
        body = str(last_comment.get("body") or "")
        summarized.append(
            {
                "id": thread.get("id"),
                "path": thread.get("path"),
                "line": thread.get("line"),
                "isOutdated": thread.get("isOutdated"),
                "lastComment": {
                    "id": last_comment.get("id"),
                    "author": login,
                    "url": last_comment.get("url"),
                    "createdAt": last_comment.get("createdAt"),
                    "bodyPreview": body[:500],
                },
            }
        )
    return {
        "totalThreads": len(threads),
        "unresolvedCount": len(unresolved),
        "unresolvedThreads": summarized,
    }


def review_thread_state_by_url(threads: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    states: dict[str, dict[str, Any]] = {}
    for thread in threads:
        comments = flatten_nodes(thread.get("comments"))
        for comment in comments:
            url = comment.get("url")
            if not isinstance(url, str) or not url:
                continue
            states[url] = {
                "threadId": thread.get("id"),
                "isResolved": bool(thread.get("isResolved")),
                "isOutdated": bool(thread.get("isOutdated")),
            }
    return states


def gh_api(path: str) -> Any:
    return run_json(["gh", "api", path], check=False)


def collect_issue_comments(owner: str, repo: str, pr_number: int) -> list[dict[str, Any]]:
    data = gh_api(f"repos/{owner}/{repo}/issues/{pr_number}/comments?per_page=100")
    return data if isinstance(data, list) else []


def collect_reviews(owner: str, repo: str, pr_number: int) -> list[dict[str, Any]]:
    data = gh_api(f"repos/{owner}/{repo}/pulls/{pr_number}/reviews?per_page=100")
    return data if isinstance(data, list) else []


def collect_pull_review_comments(owner: str, repo: str, pr_number: int) -> list[dict[str, Any]]:
    data = gh_api(f"repos/{owner}/{repo}/pulls/{pr_number}/comments?per_page=100")
    return data if isinstance(data, list) else []


def collect_review_specific_comments(
    owner: str,
    repo: str,
    pr_number: int,
    reviews: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    comments: list[dict[str, Any]] = []
    gaps: list[dict[str, Any]] = []
    for review in reviews:
        review_id = review.get("id")
        if review_id is None:
            continue
        data = gh_api(
            f"repos/{owner}/{repo}/pulls/{pr_number}/reviews/{review_id}/comments?per_page=100"
        )
        if not isinstance(data, list):
            continue
        original_comments = [
            item
            for item in data
            if isinstance(item, dict) and item.get("in_reply_to_id") is None
        ]
        for item in original_comments:
            item["source_review_id"] = review_id
        comments.extend(original_comments)

        expected = actionable_comment_count(str(review.get("body") or ""))
        if expected is not None and len(original_comments) < expected:
            gaps.append(
                {
                    "reviewId": review_id,
                    "author": review_author(review),
                    "expectedActionableComments": expected,
                    "foundReviewSpecificOriginals": len(original_comments),
                    "url": review.get("html_url"),
                }
            )
    return comments, gaps


def review_author(review: dict[str, Any]) -> str | None:
    user = review.get("user")
    return user.get("login") if isinstance(user, dict) else None


def actionable_comment_count(body: str) -> int | None:
    match = re.search(r"Actionable comments posted:\s*(\d+)", body, re.IGNORECASE)
    if not match:
        return None
    return int(match.group(1))


def clean_preview(value: str, limit: int = 500) -> str:
    without_tags = re.sub(r"<[^>]+>", " ", value)
    collapsed = re.sub(r"\s+", " ", without_tags).strip()
    return collapsed[:limit]


def classify_severity(body: str) -> str:
    lowered = body.lower()
    if any(
        term in lowered
        for term in (
            "critical.svg",
            "critical severity",
            "_critical_",
            "_security_",
            "security",
            "vulnerability",
            "injection",
            "xss",
            "dangerous",
            "exploit",
        )
    ):
        return "CRITICAL"
    if any(
        term in lowered
        for term in (
            "high-priority.svg",
            "high severity",
            "_major_",
            "potential issue",
            "_bug_",
            "performance",
            "race condition",
            "error handling",
        )
    ):
        return "HIGH"
    if any(
        term in lowered
        for term in (
            "medium-priority.svg",
            "medium severity",
            "refactor suggestion",
            "_suggestion_",
            "dead code",
            "unreachable",
            "duplicate",
            "complexity",
        )
    ):
        return "MEDIUM"
    if any(
        term in lowered
        for term in (
            "low-priority.svg",
            "low severity",
            "_minor_",
            "_trivial_",
            "_info_",
            "nitpick",
            "optional",
            "style",
            "formatting",
            "naming",
        )
    ):
        return "LOW"
    return "UNKNOWN"


def classify_comment_type(body: str) -> str:
    lowered = body.lower()
    if "outside diff" in lowered:
        return "outside"
    if "duplicate comment" in lowered or "duplicate comments" in lowered:
        return "duplicate"
    if "nitpick" in lowered:
        return "nitpick"
    if "minor comment" in lowered:
        return "minor"
    return "inline"


def comment_status(created_at: Any, head_time: datetime | None) -> str:
    return "previous" if is_stale_for_head(created_at, head_time) else "new"


def numeric_id(value: Any) -> int | None:
    if isinstance(value, int):
        return value
    if isinstance(value, str) and value.isdigit():
        return int(value)
    return None


def review_comment_item(
    comment: dict[str, Any],
    *,
    source: str,
    head_time: datetime | None,
    thread_states: dict[str, dict[str, Any]],
) -> dict[str, Any] | None:
    if comment.get("in_reply_to_id") is not None:
        return None
    body = str(comment.get("body") or "")
    user = comment.get("user")
    author = user.get("login") if isinstance(user, dict) else None
    comment_id = numeric_id(comment.get("id"))
    path = comment.get("path")
    line = comment.get("line") or comment.get("original_line")
    url = comment.get("html_url")
    thread_state = thread_states.get(str(url)) if url else None
    severity = classify_severity(body)
    item_type = classify_comment_type(body)
    if item_type == "inline" and is_bot_author(author) and "duplicate" in body.lower():
        item_type = "duplicate"
    return {
        "id": comment_id or comment.get("id"),
        "source": source,
        "author": author,
        "severity": severity,
        "type": item_type,
        "status": comment_status(comment.get("created_at"), head_time),
        "path": path,
        "line": line,
        "createdAt": comment.get("created_at"),
        "url": url,
        "threadId": thread_state.get("threadId") if thread_state else None,
        "isThreadResolved": thread_state.get("isResolved") if thread_state else None,
        "isThreadOutdated": thread_state.get("isOutdated") if thread_state else None,
        "bodyPreview": clean_preview(body),
        "hasAiPrompt": "Prompt for AI Agents" in body,
        "hasProposedFix": bool(re.search(r"proposed fix|suggested fix|suggested direction", body, re.I)),
        "alsoAppliesTo": re.findall(r"Also applies to:\s*([^\n<]+)", body, flags=re.I),
        "replyTarget": {
            "kind": "inline",
            "commentId": comment_id,
            "api": "pulls/comments",
            "template": "Fixed in <hash>. <brief description of the fix.>",
        },
    }


def extract_review_body_sections(review: dict[str, Any], head_time: datetime | None) -> list[dict[str, Any]]:
    body = str(review.get("body") or "")
    if not body.strip():
        return []
    author = review_author(review)
    review_id = review.get("id")
    submitted_at = review.get("submitted_at")
    items: list[dict[str, Any]] = []
    summaries = re.findall(r"<summary>(.*?)</summary>", body, flags=re.IGNORECASE | re.DOTALL)
    for raw_summary in summaries:
        summary = clean_preview(raw_summary, 200)
        lowered = summary.lower()
        if "prompt for all review comments with ai agents" in lowered:
            continue
        if any(
            ignored in lowered
            for ignored in (
                "review info",
                "run configuration",
                "commits",
                "files ignored",
                "files selected",
                "files skipped",
            )
        ):
            continue

        matched: tuple[str, str] | None = None
        for section_type, phrase, default_severity in REVIEW_BODY_SECTION_PATTERNS:
            if phrase in lowered:
                matched = (section_type, default_severity)
                break
        if matched is None:
            continue

        section_type, default_severity = matched
        count_match = re.search(r"\((\d+)\)", summary)
        section_count = int(count_match.group(1)) if count_match else None
        duplicate_boost = section_type == "duplicate"
        severity = default_severity
        if duplicate_boost and SEVERITY_RANK[severity] > SEVERITY_RANK["HIGH"]:
            severity = "HIGH"
        items.append(
            {
                "id": f"review-{review_id}-{section_type}",
                "source": "review_body_section",
                "author": author,
                "severity": severity,
                "type": section_type,
                "status": comment_status(submitted_at, head_time),
                "path": None,
                "line": None,
                "createdAt": submitted_at,
                "url": review.get("html_url"),
                "bodyPreview": summary,
                "sectionCommentCount": section_count,
                "hasAiPrompt": "Prompt for AI Agents" in body,
                "hasProposedFix": bool(
                    re.search(r"proposed fix|suggested fix|suggested direction", body, re.I)
                ),
                "duplicateBoost": duplicate_boost,
                "replyTarget": {
                    "kind": "pr_comment",
                    "template": "Fixed in <hash>. Addresses <bot> <section> feedback on <file-or-section>.",
                },
            }
        )
    return items


def summarize_review_items(
    inline_comments: list[dict[str, Any]],
    review_specific_comments: list[dict[str, Any]],
    reviews: list[dict[str, Any]],
    review_gaps: list[dict[str, Any]],
    head_time: datetime | None,
    threads: list[dict[str, Any]],
) -> dict[str, Any]:
    by_id: dict[Any, dict[str, Any]] = {}
    thread_states = review_thread_state_by_url(threads)
    for comment in inline_comments:
        item = review_comment_item(
            comment,
            source="pull_comment",
            head_time=head_time,
            thread_states=thread_states,
        )
        if item is not None:
            by_id[item["id"]] = item
    for comment in review_specific_comments:
        item = review_comment_item(
            comment,
            source="review_comment",
            head_time=head_time,
            thread_states=thread_states,
        )
        if item is not None:
            by_id.setdefault(item["id"], item)

    body_items: list[dict[str, Any]] = []
    for review in reviews:
        body_items.extend(extract_review_body_sections(review, head_time))

    items = list(by_id.values()) + body_items
    items.sort(
        key=lambda item: (
            SEVERITY_RANK.get(str(item.get("severity")), SEVERITY_RANK["UNKNOWN"]),
            0 if item.get("status") == "new" else 1,
            str(item.get("path") or ""),
            str(item.get("line") or ""),
        )
    )

    by_severity: dict[str, int] = {key: 0 for key in SEVERITY_RANK}
    for item in items:
        severity = str(item.get("severity") or "UNKNOWN")
        by_severity[severity] = by_severity.get(severity, 0) + 1

    actionable = [
        item
        for item in items
        if item.get("severity") != "LOW" and item.get("isThreadResolved") is not True
    ]
    new_actionable = [item for item in actionable if item.get("status") == "new"]
    return {
        "summary": {
            "total": len(items),
            "new": len([item for item in items if item.get("status") == "new"]),
            "previous": len([item for item in items if item.get("status") == "previous"]),
            "actionableCount": len(actionable),
            "newActionableCount": len(new_actionable),
            "bySeverity": by_severity,
        },
        "reviewGaps": review_gaps,
        "items": items[:100],
    }


def is_bot_author(login: str | None) -> bool:
    lowered = (login or "").lower()
    return any(pattern in lowered for pattern in BOT_AUTHOR_PATTERNS)


def body_has_problem(body: str) -> bool:
    lowered = body.lower()
    has_problem = any(term in lowered for term in BOT_PROBLEM_TERMS)
    has_success = any(term in lowered for term in BOT_SUCCESS_TERMS)
    return has_problem and not (has_success and not any(term in lowered for term in ("failed", "error")))


def summarize_bot_reports(
    issue_comments: list[dict[str, Any]],
    reviews: list[dict[str, Any]],
    checks: dict[str, Any],
    head_time: datetime | None,
) -> dict[str, Any]:
    reports: list[dict[str, Any]] = []
    stale_reports: list[dict[str, Any]] = []

    for comment in issue_comments:
        user = comment.get("user")
        login = user.get("login") if isinstance(user, dict) else None
        body = str(comment.get("body") or "")
        if not is_bot_author(login):
            continue
        created_at = comment.get("created_at")
        if is_stale_for_head(created_at, head_time):
            stale_reports.append(
                {
                    "source": "issue_comment",
                    "author": login,
                    "url": comment.get("html_url"),
                    "createdAt": created_at,
                    "bodyPreview": body[:500],
                }
            )
            continue
        reports.append(
            {
                "source": "issue_comment",
                "author": login,
                "state": "problem" if body_has_problem(body) else "informational",
                "url": comment.get("html_url"),
                "createdAt": created_at,
                "bodyPreview": body[:500],
            }
        )

    for review in reviews:
        user = review.get("user")
        login = user.get("login") if isinstance(user, dict) else None
        body = str(review.get("body") or "")
        state = str(review.get("state") or "").upper()
        if not is_bot_author(login):
            continue
        submitted_at = review.get("submitted_at")
        if is_stale_for_head(submitted_at, head_time):
            stale_reports.append(
                {
                    "source": "review",
                    "author": login,
                    "reviewState": state,
                    "url": review.get("html_url"),
                    "createdAt": submitted_at,
                    "bodyPreview": body[:500],
                }
            )
            continue
        is_problem = state in {"CHANGES_REQUESTED", "REQUEST_CHANGES"} or body_has_problem(body)
        reports.append(
            {
                "source": "review",
                "author": login,
                "state": "problem" if is_problem else "informational",
                "reviewState": state,
                "url": review.get("html_url"),
                "createdAt": submitted_at,
                "bodyPreview": body[:500],
            }
        )

    for check in checks["agentChecks"]:
        if check.get("state") not in {"failing", "pending"}:
            continue
        reports.append(
            {
                "source": "check",
                "author": check.get("name"),
                "state": "problem" if check.get("state") == "failing" else "pending",
                "url": check.get("url"),
                "createdAt": None,
                "bodyPreview": str(check.get("description") or check.get("workflow") or "")[:500],
            }
        )

    problem_reports = [report for report in reports if report["state"] == "problem"]
    pending_reports = [report for report in reports if report["state"] == "pending"]
    return {
        "totalReports": len(reports),
        "problemCount": len(problem_reports),
        "pendingCount": len(pending_reports),
        "problemReports": problem_reports,
        "pendingReports": pending_reports,
        "staleCount": len(stale_reports),
        "staleReports": stale_reports[-20:],
        "reports": reports[-20:],
    }


def failed_check_categories(failing: list[dict[str, Any]]) -> list[str]:
    categories: list[str] = []
    for check in failing:
        name = str(check.get("name") or "").lower()
        description = str(check.get("description") or "").lower()
        url = str(check.get("url") or "").lower()
        text = f"{name} {description} {url}"
        if any(term in text for term in ("rate limit", "rate limited", "quota", "billing")):
            category = "infrastructure"
        elif "lint" in name or "biome" in name or "format" in name:
            category = "lint"
        elif "type" in name or "tsc" in name:
            category = "typecheck"
        elif "build" in name or "turbo" in name or "astro" in name or "expo" in name:
            category = "build"
        else:
            category = "infrastructure"
        if category not in categories:
            categories.append(category)
    return categories


def pr_diff_files(pr_number: int) -> list[str]:
    result = run_command(["gh", "pr", "diff", str(pr_number), "--name-only"], check=False)
    if result.returncode != 0:
        return []
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def collect_changeset_status(pr_number: int) -> dict[str, Any]:
    files = pr_diff_files(pr_number)
    changeset_files = [
        path
        for path in files
        if path.startswith(".changeset/") and path.endswith(".md") and path != ".changeset/README.md"
    ]
    release_surface_files = [
        path
        for path in files
        if path.startswith(("apps/", "packages/"))
        and not path.endswith((".md", ".mdx"))
        and "/__snapshots__/" not in path
    ]
    missing = bool(release_surface_files and not changeset_files)
    return {
        "changedFiles": files,
        "changesetFiles": changeset_files,
        "releaseSurfaceFiles": release_surface_files,
        "missing": missing,
    }


def has_user_help_blocker(checks: dict[str, Any], bot_reports: dict[str, Any]) -> bool:
    blocker_terms = (
        "rate limit",
        "rate limited",
        "quota",
        "billing",
        "permission",
        "unauthorized",
        "forbidden",
        "missing token",
    )
    for check in checks["failing"]:
        text = " ".join(
            str(check.get(key) or "").lower() for key in ("name", "description", "url", "workflow")
        )
        if any(term in text for term in blocker_terms):
            return True

    for report in bot_reports["problemReports"]:
        text = " ".join(
            str(report.get(key) or "").lower() for key in ("author", "bodyPreview", "url")
        )
        if any(term in text for term in blocker_terms):
            return True

    return False


def choose_actions(
    pr: dict[str, Any],
    checks: dict[str, Any],
    reviews: dict[str, Any],
    review_items: dict[str, Any],
    bot_reports: dict[str, Any],
) -> list[str]:
    if pr.get("state") in {"MERGED", "CLOSED"}:
        return ["terminal_pr_closed_or_merged"]

    actions: list[str] = []
    if reviews["unresolvedCount"] > 0 or review_items["summary"]["newActionableCount"] > 0:
        actions.append("process_review_comment")
    if bot_reports["problemCount"] > 0:
        actions.append("process_ai_agent_report")
    if checks["summary"]["failing"] > 0:
        actions.append("diagnose_ci_failure")

    if checks["summary"]["pending"] > 0 or bot_reports["pendingCount"] > 0:
        actions.append("wait_for_pending_checks")

    if not actions:
        actions.append("idle")
    return actions


def snapshot(target: str) -> dict[str, Any]:
    pr = gh_pr_view(target)
    repo = gh_repo()
    pr_number = int(pr["number"])
    checks = collect_checks(pr)
    review_threads = graphql_review_threads(repo["owner"], repo["name"], pr_number)
    reviews = summarize_review_threads(review_threads)
    issue_comments = collect_issue_comments(repo["owner"], repo["name"], pr_number)
    pr_reviews = collect_reviews(repo["owner"], repo["name"], pr_number)
    inline_review_comments = collect_pull_review_comments(repo["owner"], repo["name"], pr_number)
    review_specific_comments, review_gaps = collect_review_specific_comments(
        repo["owner"],
        repo["name"],
        pr_number,
        pr_reviews,
    )
    head_time = latest_commit_time(pr)
    review_items = summarize_review_items(
        inline_review_comments,
        review_specific_comments,
        pr_reviews,
        review_gaps,
        head_time,
        review_threads,
    )
    bot_reports = summarize_bot_reports(issue_comments, pr_reviews, checks, head_time)
    changeset_status = collect_changeset_status(pr_number)
    actions = choose_actions(pr, checks, reviews, review_items, bot_reports)
    failure_categories = failed_check_categories(checks["failing"])
    if changeset_status["missing"] and "changeset_missing" not in failure_categories:
        failure_categories.append("changeset_missing")
    if (
        changeset_status["missing"]
        and pr.get("state") not in {"MERGED", "CLOSED"}
        and "diagnose_ci_failure" not in actions
    ):
        actions.append("diagnose_ci_failure")
    terminal = pr.get("state") in {"MERGED", "CLOSED"}
    user_help_required = has_user_help_blocker(checks, bot_reports)
    if user_help_required and "escalate_user_help" not in actions:
        actions.append("escalate_user_help")

    return {
        "protocolVersion": 1,
        "generatedAt": utc_now(),
        "repository": f"{repo['owner']}/{repo['name']}",
        "pr": {
            "number": pr_number,
            "url": pr.get("url"),
            "state": pr.get("state"),
            "title": pr.get("title"),
            "isDraft": pr.get("isDraft"),
            "headRefName": pr.get("headRefName"),
            "headRefOid": pr.get("headRefOid"),
            "headRepositoryOwner": (
                pr.get("headRepositoryOwner", {}).get("login")
                if isinstance(pr.get("headRepositoryOwner"), dict)
                else pr.get("headRepositoryOwner")
            ),
            "headCommittedAt": head_time.isoformat().replace("+00:00", "Z") if head_time else None,
            "baseRefName": pr.get("baseRefName"),
            "mergeable": pr.get("mergeable"),
            "mergeStateStatus": pr.get("mergeStateStatus"),
            "reviewDecision": pr.get("reviewDecision"),
            "updatedAt": pr.get("updatedAt"),
        },
        "checks": checks,
        "reviews": reviews,
        "reviewItems": review_items,
        "botReports": bot_reports,
        "changeset": changeset_status,
        "failureCategories": failure_categories,
        "actions": actions,
        "terminal": terminal,
        "userHelpRequired": user_help_required,
    }


def retry_failed_github_actions(target: str) -> dict[str, Any]:
    pr = gh_pr_view(target)
    head_sha = str(pr.get("headRefOid") or "")
    branch = str(pr.get("headRefName") or "")
    if not head_sha or not branch:
        return {"retried": [], "errors": ["missing PR head SHA or branch"]}

    runs = run_json(
        [
            "gh",
            "run",
            "list",
            "--branch",
            branch,
            "--commit",
            head_sha,
            "--status",
            "completed",
            "--limit",
            "20",
            "--json",
            "databaseId,conclusion,workflowName,headSha,url",
        ],
        check=False,
    )
    if not isinstance(runs, list):
        return {"retried": [], "errors": ["could not list GitHub Actions runs"]}

    retried: list[dict[str, Any]] = []
    errors: list[str] = []
    for run in runs:
        if not isinstance(run, dict) or run.get("conclusion") != "failure":
            continue
        run_id = run.get("databaseId")
        if run_id is None:
            continue
        result = run_command(["gh", "run", "rerun", str(run_id), "--failed"], check=False)
        item = {
            "databaseId": run_id,
            "workflowName": run.get("workflowName"),
            "url": run.get("url"),
            "returncode": result.returncode,
        }
        if result.returncode == 0:
            retried.append(item)
        else:
            errors.append(result.stderr.strip() or result.stdout.strip() or f"failed to rerun {run_id}")
    return {"retried": retried, "errors": errors}


def emit(data: dict[str, Any]) -> None:
    print(json.dumps(data, sort_keys=True), flush=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Emit COSMQ PR babysitter JSON snapshots.")
    parser.add_argument("--pr", default="auto", help="PR number, PR URL, or auto for current branch.")
    parser.add_argument("--once", action="store_true", help="Emit one snapshot and exit.")
    parser.add_argument("--watch", action="store_true", help="Emit JSONL snapshots until interrupted.")
    parser.add_argument("--interval", type=int, default=60, help="Watch interval in seconds.")
    parser.add_argument(
        "--retry-failed-now",
        action="store_true",
        help="Attempt to rerun failed GitHub Actions runs for the PR head SHA.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        if args.retry_failed_now:
            emit({"generatedAt": utc_now(), "retryFailedNow": retry_failed_github_actions(args.pr)})
            return 0

        if args.once or not args.watch:
            emit(snapshot(args.pr))
            return 0

        interval = max(args.interval, 10)
        while True:
            emit(snapshot(args.pr))
            time.sleep(interval)
    except KeyboardInterrupt:
        return 130
    except WatcherError as error:
        emit({"generatedAt": utc_now(), "error": str(error), "userHelpRequired": True})
        return 1


if __name__ == "__main__":
    sys.exit(main())
