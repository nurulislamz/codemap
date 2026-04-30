#!/usr/bin/env python3

import argparse
import asyncio
import json
import re
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin, urlparse, urlunparse


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run Crawl4AI crawls from the command line.")
    parser.add_argument("url", help="URL to crawl")
    parser.add_argument(
        "--format",
        choices=["markdown", "raw", "html", "text", "media"],
        default="markdown",
        help="Output mode (default: markdown)",
    )
    parser.add_argument("--deep", action="store_true", help="Enable Crawl4AI built-in deep crawling")
    parser.add_argument("--tree", action="store_true", help="Discover and crawl a roadmap URL tree")
    parser.add_argument("--max-depth", type=int, default=1, help="Maximum crawl depth (default: 1)")
    parser.add_argument("--max-pages", type=int, default=20, help="Maximum pages in a crawl")
    parser.add_argument(
        "--include-external",
        action="store_true",
        help="Allow following external links when deep crawling",
    )
    parser.add_argument(
        "--scope-prefix",
        help="Limit tree crawl to URLs under this path prefix (for example, /backend).",
    )
    parser.add_argument(
        "--scope-regex",
        help="Optional regex for roadmaps path filtering (applied to page paths).",
    )
    parser.add_argument(
        "--check-robots-txt",
        action="store_true",
        help="Respect robots.txt (off by default in Crawl4AI)",
    )
    parser.add_argument(
        "--wait-until",
        default="domcontentloaded",
        choices=["domcontentloaded", "networkidle", "load", "commit"],
        help="When to resolve page load before extraction",
    )
    parser.add_argument(
        "--wait-for-timeout",
        type=float,
        default=None,
        help="Extra milliseconds to wait after page conditions before extraction",
    )
    parser.add_argument(
        "--scan-full-page",
        action="store_true",
        help="Auto-scroll pages to load dynamic/lazy content",
    )
    parser.add_argument(
        "--scroll-delay",
        type=float,
        default=0.2,
        help="Seconds between full-page scroll steps",
    )
    parser.add_argument(
        "--css-selector",
        default=None,
        help="Only extract content from a specific CSS selector",
    )
    parser.add_argument("--remove-consent-popups", action="store_true", help="Try removing cookie/consent overlays")
    parser.add_argument("--remove-overlay-elements", action="store_true", help="Remove large overlays before extraction")
    parser.add_argument("--simulate-user", action="store_true", help="Enable basic human-like interaction simulation")
    parser.add_argument(
        "--js-code",
        action="append",
        help="JavaScript code to run before extracting a page (repeatable)",
    )
    parser.add_argument(
        "--js-code-before-wait",
        action="append",
        help="JavaScript code to run before wait conditions (repeatable)",
    )
    parser.add_argument(
        "--output-dir",
        default="scripts/scrape/crawl-output",
        help="Directory for per-page outputs in deep/tree modes",
    )
    parser.add_argument("--manifest", default=None, help="Tree mode manifest output path (JSON)")
    parser.add_argument(
        "--output",
        help="Single output file path for single-page crawls",
    )
    parser.add_argument("--verbose", action="store_true", help="Enable crawler verbosity")
    return parser.parse_args()


def get_content(result, fmt: str) -> str:
    if fmt == "markdown":
        return getattr(result, "markdown", None) or getattr(result, "fit_markdown", None) or ""
    if fmt == "raw":
        return getattr(result, "raw_markdown", None) or getattr(result, "raw_html", None) or ""
    if fmt == "html":
        return getattr(result, "html", None) or ""
    if fmt == "media":
        links = getattr(result, "media", None) or []
        return "\n".join(link.get("src", "") for link in links if isinstance(link, dict))
    return getattr(result, "text", None) or ""


def strip_cookie_banner(content: str) -> str:
    if "Customise Consent Preferences" not in content:
        return content
    marker = content.find("Customise Consent Preferences")
    heading_index = content.find("\n# ", marker)
    if heading_index == -1:
        return content
    return content[heading_index + 1 :].lstrip()


def sanitized_content(content: str, fmt: str) -> str:
    if fmt == "markdown":
        return strip_cookie_banner(content)
    return content


def get_format_suffix(fmt: str) -> str:
    return {"markdown": "md", "raw": "txt", "html": "html", "text": "txt", "media": "txt"}.get(fmt, "txt")


def parse_scope_prefix(seed_url: str, scope_prefix: str | None) -> str | None:
    if scope_prefix:
        cleaned = scope_prefix.rstrip("/")
        return cleaned if cleaned else "/"
    parsed_seed = urlparse(seed_url)
    segments = [segment for segment in parsed_seed.path.split("/") if segment]
    if not segments:
        return None
    top = segments[0]
    if top in {"roadmaps", "guides"}:
        return None
    return f"/{top}"


def normalize_url(raw_url: str, base_url: str | None = None) -> str:
    if base_url:
        raw_url = urljoin(base_url, raw_url)
    parsed = urlparse(raw_url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return ""
    path = parsed.path.rstrip("/") or "/"
    return urlunparse((parsed.scheme, parsed.netloc, path, "", "", ""))


def safe_filename(url: str, suffix: str, used: dict[str, int]) -> str:
    parsed = urlparse(url)
    base = parsed.netloc if parsed.netloc else "roadmap"
    raw = (parsed.path.strip("/") or "index").replace("/", "__")
    slug = re.sub(r"[^a-zA-Z0-9._-]", "-", f"{base}__{raw}")
    count = used.get(slug, 0)
    used[slug] = count + 1
    if count:
        slug = f"{slug}_{count}"
    return f"{slug}.{suffix}"


def in_tree_scope(url: str, prefix: str | None, pattern: re.Pattern[str] | None) -> bool:
    parsed = urlparse(url)
    if parsed.netloc != "roadmap.sh":
        return False
    path = parsed.path.rstrip("/") or "/"
    if pattern is not None and pattern.match(path) is None:
        return False
    if prefix is not None:
        if path != prefix and not path.startswith(f"{prefix}/"):
            return False
    return True


def extract_links(result, base_url: str | None = None) -> list[str]:
    links = []
    result_links = getattr(result, "links", None)
    if not isinstance(result_links, dict):
        return links
    for item in result_links.get("internal", []) or []:
        if isinstance(item, str):
            href = item
        elif isinstance(item, dict):
            href = item.get("href", "")
        else:
            continue
        normalized = normalize_url(href, base_url=base_url)
        if normalized:
            links.append(normalized)
    return links


def extract_title(result) -> str:
    markdown = getattr(result, "markdown", None) or ""
    for line in str(markdown).splitlines():
        stripped = line.strip()
        if stripped.startswith("# "):
            return stripped[2:].strip()
    html = str(getattr(result, "html", "") or "")
    match = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    return match.group(1).strip() if match else ""


def build_config(args: argparse.Namespace):
    from crawl4ai import CrawlerRunConfig

    return CrawlerRunConfig(
        deep_crawl_strategy=None,
        check_robots_txt=args.check_robots_txt,
        scan_full_page=args.scan_full_page,
        scroll_delay=args.scroll_delay,
        verbose=args.verbose,
        wait_until=args.wait_until,
        wait_for_timeout=args.wait_for_timeout,
        css_selector=args.css_selector,
        remove_consent_popups=args.remove_consent_popups,
        remove_overlay_elements=args.remove_overlay_elements,
        simulate_user=args.simulate_user,
        js_code=args.js_code,
        js_code_before_wait=args.js_code_before_wait,
    )


async def run_single(url: str, args: argparse.Namespace) -> tuple[str, str]:
    from crawl4ai import AsyncWebCrawler

    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(url=url, config=build_config(args))
        return url, sanitized_content(get_content(result, args.format), args.format)


async def run_deep(url: str, args: argparse.Namespace) -> Iterable[tuple[str, str]]:
    from crawl4ai import AsyncWebCrawler
    from crawl4ai.deep_crawling import BFSDeepCrawlStrategy

    strategy = BFSDeepCrawlStrategy(
        max_depth=args.max_depth,
        max_pages=args.max_pages,
        include_external=args.include_external,
    )

    config = build_config(args)
    config.deep_crawl_strategy = strategy

    async with AsyncWebCrawler() as crawler:
        results = await crawler.arun(url=url, config=config)
        crawled = results if isinstance(results, list) else [results]
        for result in crawled:
            yield result.url, sanitized_content(get_content(result, args.format), args.format)


async def run_tree(seed_url: str, args: argparse.Namespace) -> tuple[list[dict[str, object]], int]:
    from crawl4ai import AsyncWebCrawler

    scope_prefix = parse_scope_prefix(seed_url, args.scope_prefix)
    compiled_scope = re.compile(args.scope_regex) if args.scope_regex else None
    config = build_config(args)
    output_dir = Path(args.output_dir)
    suffix = get_format_suffix(args.format)
    filename_counts: dict[str, int] = {}
    manifest: list[dict[str, object]] = []
    seen: set[str] = set()
    queue: deque[tuple[str, int, str | None]] = deque([(normalize_url(seed_url), 0, None)])

    async with AsyncWebCrawler() as crawler:
        while queue and len(seen) < args.max_pages:
            current, depth, parent = queue.popleft()
            if not in_tree_scope(current, scope_prefix, compiled_scope):
                continue
            if current in seen:
                continue
            seen.add(current)
            try:
                result = await crawler.arun(url=current, config=config)
                content = sanitized_content(get_content(result, args.format), args.format)
                title = extract_title(result)
                filename = safe_filename(current, suffix, filename_counts)
                page_path = output_dir / filename
                write_output(page_path, current, content, args.format)
                manifest.append(
                    {
                        "url": current,
                        "depth": depth,
                        "parent": parent,
                        "title": title,
                        "status": "ok",
                        "path": str(page_path),
                        "extracted_at": datetime.now(timezone.utc).isoformat(),
                        "byte_count": len(content.encode("utf-8")),
                    }
                )
                if depth < args.max_depth:
                    for link in extract_links(result, base_url=current):
                        if in_tree_scope(link, scope_prefix, compiled_scope) and len(seen) + len(queue) < args.max_pages:
                            queue.append((link, depth + 1, current))
            except Exception as exc:  # pragma: no cover - runtime scrape exceptions
                manifest.append(
                    {
                        "url": current,
                        "depth": depth,
                        "status": "error",
                        "error": str(exc),
                        "extracted_at": datetime.now(timezone.utc).isoformat(),
                    }
                )

    return manifest, len(manifest)


def write_output(path: Path, url: str, content: str, fmt: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    if content:
        preview = content[:180].replace("\n", " ")
    else:
        preview = "<empty>"
    print(f"[saved] {url} -> {path} ({fmt})")
    print(f"[preview] {preview}")


def write_stdio(url: str, content: str) -> None:
    print(f"=== {url} ===")
    print(content)


async def main() -> None:
    try:
        args = parse_args()
        if args.tree:
            manifest, _ = await run_tree(args.url, args)
            manifest_path = Path(args.manifest or Path(args.output_dir) / "roadmap-tree.json")
            manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
            print(f"[manifest] {manifest_path} ({len(manifest)} items)")
        elif args.deep:
            output_dir = Path(args.output_dir)
            async for url, content in run_deep(args.url, args):
                filename = url.replace("://", "_").replace("/", "_") + ".txt"
                write_output(output_dir / filename, url, content, args.format)
        else:
            url, content = await run_single(args.url, args)
            if args.output:
                write_output(Path(args.output), url, content, args.format)
            else:
                write_stdio(url, content)
    except ModuleNotFoundError as exc:
        if "crawl4ai" in str(exc):
            raise RuntimeError(
                "crawl4ai is not installed. Run:\n"
                "  python3 -m venv .venv\n"
                "  source .venv/bin/activate\n"
                "  python3 -m pip install -r requirements-crawl4ai.txt\n"
            ) from exc
        raise


if __name__ == "__main__":
    asyncio.run(main())
