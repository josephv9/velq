#!/usr/bin/env python3
"""Preflight and explicitly submit changed Velq canonical pages to IndexNow.

Dry-run (GET checks only) is the default. --submit is required for a POST.
Pass only pages added or materially updated in the release, not a sitemap.
The existing verification key is a published site-ownership token, not a secret.
Protocol: https://www.indexnow.org/documentation
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urljoin, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener


ORIGIN = "https://velqnutrition.com"
HOST = "velqnutrition.com"
ENDPOINT = "https://api.indexnow.org/indexnow"
KEY_FILE = Path(__file__).resolve().parents[1] / "assets/d1d335a0e252917f7c1345bb896190c265b2826baf993531.txt"
USER_AGENT = "VelqDiscoveryAudit/1.0 (+https://velqnutrition.com/contact/)"
MAX_PAGE_BYTES = 8 * 1024 * 1024


class CheckError(Exception):
    """A failed prerequisite; nothing should be submitted."""


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class RobotsPolicy:
    """Crawler allow/disallow groups, including wildcard and end-anchor rules.

    urllib.robotparser treats '*' in paths literally. These additional matching
    rules matter when preflighting URLs against real Google/Bing robots files.
    Specific user-agent groups take precedence; longest matching path wins and
    allow wins a tie. Both encoded and decoded paths are checked conservatively.
    """

    def __init__(self, text: str):
        self.groups: list[tuple[list[str], list[tuple[bool, str]]]] = []
        agents: list[str] = []
        rules: list[tuple[bool, str]] = []
        has_directive = False
        for raw_line in text.splitlines():
            line = raw_line.split("#", 1)[0].strip()
            if ":" not in line:
                continue
            field, value = (part.strip() for part in line.split(":", 1))
            field = field.lower()
            if field == "user-agent":
                if has_directive:
                    self.groups.append((agents, rules))
                    agents, rules, has_directive = [], [], False
                if value:
                    agents.append(value.lower())
            elif agents and field in ("allow", "disallow"):
                has_directive = True
                if value:
                    rules.append((field == "allow", value))
        if agents:
            self.groups.append((agents, rules))

    def can_fetch(self, user_agent: str, url: str) -> bool:
        user_agent = user_agent.lower()
        selected = []
        specificity = -1
        for agents, rules in self.groups:
            score = max((0 if agent == "*" else len(agent)
                         for agent in agents if agent == "*" or agent in user_agent), default=-1)
            if score > specificity:
                selected, specificity = list(rules), score
            elif score == specificity and score >= 0:
                selected.extend(rules)
        path = urlsplit(url).path or "/"
        for candidate in set((path, unquote(path))):
            matches = []
            for allow, raw_pattern in selected:
                pattern = unquote(raw_pattern)
                anchored = pattern.endswith("$")
                if anchored:
                    pattern = pattern[:-1]
                expression = "^" + re.escape(pattern).replace(r"\*", ".*") + ("$" if anchored else "")
                if re.search(expression, candidate):
                    matches.append((len(pattern.replace("*", "").encode("utf-8")), allow))
            if matches and not max(matches)[1]:
                return False
        return True


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def validate_url(value: str) -> str:
    """Accept explicit production canonical URLs without tracking parameters."""
    if not value or not value.isascii() or re.search(r"[\s\\<>\"{}|^`]", value):
        raise CheckError(f"Invalid URI characters: {value!r}")
    try:
        parts = urlsplit(value)
        port = parts.port
    except ValueError as exc:
        raise CheckError(f"Invalid URL: {value!r}") from exc
    if parts.scheme != "https" or parts.netloc != HOST or port is not None:
        raise CheckError(f"Only {ORIGIN}/ canonical URLs are allowed: {value}")
    if parts.query or parts.fragment or "?" in value or "#" in value:
        raise CheckError(f"Remove queries and fragments from canonical URLs: {value}")
    if not parts.path.startswith("/") or "//" in parts.path:
        raise CheckError(f"Use the explicit canonical path, including / for the homepage: {value}")
    decoded = unquote(parts.path)
    if any(segment in (".", "..") for segment in decoded.split("/")):
        raise CheckError(f"Relative path components are not allowed: {value}")
    if re.search(r"[\x00-\x20\x7f\\]", decoded) or re.search(r"%(?![0-9a-fA-F]{2})", value):
        raise CheckError(f"Malformed or unsafe encoded URI: {value}")
    return value


class PageMetadata(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.canonicals: list[str] = []
        self.robots: list[str] = []
        self.in_head = False
        self.saw_head = False

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "head":
            self.in_head = True
            self.saw_head = True
        if not self.in_head:
            return
        values = {key.lower(): value or "" for key, value in attrs}
        if tag.lower() == "link" and "canonical" in values.get("rel", "").lower().split():
            self.canonicals.append(values.get("href", ""))
        if tag.lower() == "meta" and values.get("name", "").lower() in ("robots", "bingbot"):
            self.robots.append(values.get("content", ""))

    def handle_endtag(self, tag):
        if tag.lower() == "head":
            self.in_head = False


def forbids_indexing(directives: list[str]) -> bool:
    # Conservatively reject an HTTP noindex directive, even when user-agent scoped.
    return any(re.search(r"(?:^|[\s,:;])(?:noindex|none)(?:$|[\s,;])", item, re.I) for item in directives)


def fetch(url: str, timeout: float, limit: int = MAX_PAGE_BYTES) -> tuple[int, dict, bytes]:
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
    try:
        with build_opener(NoRedirect()).open(request, timeout=timeout) as response:
            body = response.read(limit + 1)
            headers = {key.lower(): ", ".join(response.headers.get_all(key) or []) for key in response.headers.keys()}
            status = response.status
    except HTTPError as exc:
        return exc.code, {key.lower(): ", ".join(exc.headers.get_all(key) or []) for key in exc.headers.keys()}, exc.read(min(limit, 4096))
    except (URLError, TimeoutError, OSError) as exc:
        raise CheckError(f"GET failed for {url}: {exc}") from exc
    if len(body) > limit:
        raise CheckError(f"Response exceeds {limit} bytes: {url}")
    return status, headers, body


def verify_key(timeout: float) -> tuple[str, dict]:
    try:
        key = KEY_FILE.read_text(encoding="utf-8").strip()
    except (OSError, UnicodeError) as exc:
        raise CheckError(f"Cannot read the existing verification key: {exc}") from exc
    if not re.fullmatch(r"[A-Za-z0-9-]{8,128}", key):
        raise CheckError("The local IndexNow verification key has an invalid format.")
    key_location = f"{ORIGIN}/{key}.txt"
    status, headers, body = fetch(key_location, timeout, 1024)
    if status != 200:
        raise CheckError(f"Public key file returned HTTP {status}: {key_location}")
    try:
        matches = body.decode("utf-8").strip() == key
    except UnicodeError:
        matches = False
    if not matches or not headers.get("content-type", "").lower().startswith("text/plain"):
        raise CheckError("The public key must be a matching UTF-8 text/plain file.")
    return key, {"url": key_location, "http_status": status, "matches_local_key": True}


def get_robots(timeout: float) -> tuple[RobotsPolicy, dict]:
    url = f"{ORIGIN}/robots.txt"
    status, _, body = fetch(url, timeout, 512 * 1024)
    if status == 404:
        return RobotsPolicy(""), {"url": url, "http_status": status, "policy": "absent_allow"}
    if status != 200:
        raise CheckError(f"Cannot establish robots.txt policy: HTTP {status}")
    try:
        contents = body.decode("utf-8-sig")
    except UnicodeError as exc:
        raise CheckError("robots.txt is not UTF-8.") from exc
    if re.search(r"<(?:!doctype|html)\b", contents, re.I):
        raise CheckError("robots.txt returned HTML instead of crawler directives.")
    return RobotsPolicy(contents), {"url": url, "http_status": status, "policy": "checked_bingbot_and_generic"}


def inspect_page(url: str, robots: RobotsPolicy, timeout: float) -> dict:
    if not robots.can_fetch("bingbot", url) or not robots.can_fetch("*", url):
        raise CheckError(f"robots.txt blocks the URL: {url}")
    status, headers, body = fetch(url, timeout)
    if status != 200:
        raise CheckError(f"Canonical page must return 200 without redirects; got HTTP {status}: {url}")
    if "text/html" not in headers.get("content-type", "").lower():
        raise CheckError(f"Expected a canonical HTML page: {url}")
    try:
        html = body.decode("utf-8")
    except UnicodeError as exc:
        raise CheckError(f"Page is not UTF-8: {url}") from exc
    metadata = PageMetadata()
    metadata.feed(html)
    if not metadata.saw_head or len(metadata.canonicals) != 1 or not metadata.canonicals[0].strip():
        raise CheckError(f"Expected one HTML canonical link in the page head: {url}")
    canonical = urljoin(url, metadata.canonicals[0])
    if canonical != url:
        raise CheckError(f"Page canonical differs from input: {url} -> {canonical}")
    if forbids_indexing(metadata.robots + [headers.get("x-robots-tag", "")]):
        raise CheckError(f"Page has a noindex/none robots directive: {url}")
    return {"url": url, "http_status": status, "canonical": canonical, "robots_allowed": True, "noindex": False}


def response_outcome(status: int) -> str:
    return {
        200: "received",
        202: "received_key_validation_pending",
        400: "invalid_request",
        403: "key_invalid_or_unavailable",
        422: "host_url_or_key_mismatch",
        429: "rate_limited_no_automatic_retry",
    }.get(status, "unexpected_response_no_automatic_retry")


def submit_batch(urls: list[str], key: str, key_location: str, timeout: float) -> dict:
    payload = {"host": HOST, "key": key, "keyLocation": key_location, "urlList": urls}
    request = Request(ENDPOINT, data=json.dumps(payload).encode("utf-8"), method="POST",
                      headers={"Content-Type": "application/json; charset=utf-8", "User-Agent": USER_AGENT})
    try:
        with build_opener(NoRedirect()).open(request, timeout=timeout) as response:
            status, headers, body = response.status, response.headers, response.read(4096)
    except HTTPError as exc:
        status, headers, body = exc.code, exc.headers, exc.read(4096)
    except (URLError, TimeoutError, OSError) as exc:
        # A network failure after POST is ambiguous. Do not automatically retry.
        return {"urls": urls, "url_count": len(urls), "http_status": None,
                "outcome": "receipt_unknown_no_automatic_retry", "error": str(exc), "checked_at": now()}
    result = {"urls": urls, "url_count": len(urls), "http_status": status,
              "outcome": response_outcome(status), "checked_at": now()}
    if headers.get("Retry-After"):
        result["retry_after"] = headers["Retry-After"]
    if body:
        result["response_excerpt"] = body.decode("utf-8", errors="replace")
    return result


def write_receipt(receipt: dict, path: Path | None) -> None:
    receipt["completed_at"] = now()
    rendered = json.dumps(receipt, indent=2, ensure_ascii=False) + "\n"
    if path:
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = path.with_suffix(path.suffix + ".tmp")
        temporary.write_text(rendered, encoding="utf-8")
        temporary.replace(path)
    print(rendered, end="")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("urls", nargs="*", help="Explicit changed canonical page URLs")
    parser.add_argument("--urls-file", type=Path, help="UTF-8 text file: one changed URL per line; blank/# lines ignored")
    parser.add_argument("--submit", action="store_true", help="POST after every preflight passes (default: GET-only dry-run)")
    parser.add_argument("--receipt", type=Path, help="Also save the machine-readable JSON receipt to this path")
    parser.add_argument("--timeout", type=float, default=30, help="Per-request timeout in seconds (default: 30)")
    parser.add_argument("--batch-size", type=int, default=10000, help="URLs per POST, 1–10000 (default: 10000)")
    args = parser.parse_args(argv)
    if not 1 <= args.batch_size <= 10000 or not 0 < args.timeout <= 120:
        parser.error("--batch-size must be 1–10000; --timeout must be greater than 0 and at most 120.")
    receipt = {"schema_version": 1, "started_at": now(), "mode": "submit" if args.submit else "dry_run",
               "origin": ORIGIN, "endpoint": ENDPOINT, "preflight": [], "batches": [],
               "indexing_confirmed": False,
               "meaning": "IndexNow receipt is a notification result; it does not establish indexing, ranking, traffic or AI citations."}
    try:
        candidates = list(args.urls)
        if args.urls_file:
            candidates.extend(line.strip() for line in args.urls_file.read_text(encoding="utf-8").splitlines()
                              if line.strip() and not line.lstrip().startswith("#"))
        if not candidates:
            raise CheckError("Supply explicit changed URLs or --urls-file. Sitemap-wide submission is intentionally unsupported.")
        urls = list(dict.fromkeys(validate_url(value) for value in candidates))
        receipt["input_count"], receipt["unique_url_count"] = len(candidates), len(urls)
        key, receipt["key_verification"] = verify_key(args.timeout)
        robots, receipt["robots_check"] = get_robots(args.timeout)
        for url in urls:
            receipt["preflight"].append(inspect_page(url, robots, args.timeout))
        if not args.submit:
            receipt["outcome"] = "dry_run_preflight_passed_no_submission"
        else:
            receipt["outcome"] = "all_batches_received"
            for start in range(0, len(urls), args.batch_size):
                result = submit_batch(urls[start:start + args.batch_size], key, receipt["key_verification"]["url"], args.timeout)
                receipt["batches"].append(result)
                if result["http_status"] not in (200, 202):
                    receipt["outcome"] = "submission_incomplete_check_batch_receipts"
                    break
                if result["http_status"] == 202:
                    receipt["outcome"] = "received_with_key_validation_pending"
    except (CheckError, OSError, UnicodeError) as exc:
        receipt["outcome"] = "preflight_failed_no_submission"
        receipt["error"] = str(exc)
    write_receipt(receipt, args.receipt)
    return 0 if receipt["outcome"] in ("dry_run_preflight_passed_no_submission", "all_batches_received", "received_with_key_validation_pending") else 1


if __name__ == "__main__":
    sys.exit(main())
