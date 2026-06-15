from __future__ import annotations

import json
import re
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

from roadmap.graph import is_meaningful_roadmap_node, is_roadmap_data

ROADMAPS_URL = "https://roadmap.sh/roadmaps"
REQUEST_TIMEOUT_SECONDS = 12


def discover_roadmap_slugs() -> list[str]:
    html = fetch_text(ROADMAPS_URL)
    links = set(re.findall(r'href="/([^"?#]+)"', html))
    serialized_slugs = set(
        re.findall(r'\\"[0-9a-f]{24}\\",\\"([a-z0-9][a-z0-9-]*)\\",\\"[^\\"]+\\"', html),
    )
    candidates = sorted(links | serialized_slugs)
    candidates = [
        link
        for link in candidates
        if "/" not in link
        and not link.startswith("assets/")
        and not link.startswith("manifest/")
        and link not in {"about", "guides", "privacy", "roadmaps", "signup", "terms"}
    ]

    valid_slugs: list[str] = []
    with ThreadPoolExecutor(max_workers=16) as executor:
        future_by_slug = {
            executor.submit(fetch_json_or_none, f"https://roadmap.sh/{slug}.json"): slug
            for slug in candidates
        }

        for future in as_completed(future_by_slug):
            slug = future_by_slug[future]
            data = future.result()
            if is_roadmap_data(data):
                valid_slugs.append(slug)

    return sorted(valid_slugs)


def fetch_roadmap_data(slug: str) -> dict[str, Any] | None:
    roadmap_data = fetch_json_or_none(f"https://roadmap.sh/{slug}.json")
    return roadmap_data if is_roadmap_data(roadmap_data) else None


def fetch_topic_content(
    *,
    slug: str,
    nodes: list[dict[str, Any]],
    concurrency: int,
) -> dict[str, dict[str, Any]]:
    content_by_node_id: dict[str, dict[str, Any]] = {}
    topic_nodes = [
        node
        for node in nodes
        if is_meaningful_roadmap_node(node) and node.get("type") != "title"
    ]
    completed = 0

    def fetch_node_content(node: dict[str, Any]) -> tuple[str, dict[str, Any] | None]:
        node_id = str(node.get("id") or "")
        if not node_id:
            return node_id, None

        content = fetch_json_or_none(f"https://roadmap.sh/{slug}/{node_id}.json")
        if not isinstance(content, dict):
            return node_id, None

        resources = content.get("resources")
        return node_id, {
            "description": content.get("description") or "",
            "resources": resources if isinstance(resources, list) else [],
        }

    with ThreadPoolExecutor(max_workers=max(1, concurrency)) as executor:
        futures = [executor.submit(fetch_node_content, node) for node in topic_nodes]

        for future in as_completed(futures):
            node_id, content = future.result()
            completed += 1

            if content is not None:
                content_by_node_id[node_id] = content

            if completed % 25 == 0 or completed == len(topic_nodes):
                print(f"[{slug}] topic-content {completed}/{len(topic_nodes)}", flush=True)

    return content_by_node_id


def fetch_json_or_none(url: str) -> Any | None:
    try:
        data = fetch_bytes(url)
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError):
        return None

    try:
        return json.loads(data.decode("utf-8"))
    except json.JSONDecodeError:
        return None


def fetch_text(url: str) -> str:
    return fetch_bytes(url).decode("utf-8", errors="replace")


def fetch_bytes(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "codemap-roadmap-scraper/1.0"})
    with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
        return response.read()
