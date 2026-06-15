#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from roadmap.graph import build_roadmap_graph
from roadmap.source import discover_roadmap_slugs, fetch_roadmap_data, fetch_topic_content
from roadmap.validate import RoadmapReport, build_report, validate_roadmap

DEFAULT_OUTPUT_DIR = "data/roadmap"


def main() -> None:
    args = parse_args()
    output_dir = Path(args.output_dir)
    slugs = args.slugs or discover_roadmap_slugs()
    reports: list[RoadmapReport] = []

    print(f"[discover] {len(slugs)} candidate roadmaps", flush=True)

    for index, slug in enumerate(slugs, start=1):
        roadmap_data = fetch_roadmap_data(slug)
        if roadmap_data is None:
            print(f"[skip] {slug} is not a roadmap JSON payload", flush=True)
            continue

        content_by_node_id = {}
        if not args.skip_topic_content:
            nodes = roadmap_data.get("nodes")
            content_by_node_id = fetch_topic_content(
                slug=slug,
                nodes=nodes if isinstance(nodes, list) else [],
                concurrency=args.concurrency,
            )

        roadmap = build_roadmap_graph(
            roadmap_data,
            root_key=slug,
            topic_content_by_node_id=content_by_node_id,
        )
        path = write_roadmap(output_dir, slug, roadmap)
        validate_roadmap(slug, roadmap)
        report = build_report(slug, path, roadmap)
        reports.append(report)

        print(
            f"[roadmap] {index}/{len(slugs)} {slug} -> {path} "
            f"({report.topic_count} topics, {report.zero_resource_topic_count} empty)",
            flush=True,
        )

    print_report(reports)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scrape roadmap.sh roadmap JSON into one app-ready JSON file per roadmap.",
    )
    parser.add_argument("slugs", nargs="*", help="Optional roadmap slugs. Defaults to all roadmaps from /roadmaps.")
    parser.add_argument(
        "--output-dir",
        default=DEFAULT_OUTPUT_DIR,
        help=f"Directory for generated *-roadmap.json files. Defaults to {DEFAULT_OUTPUT_DIR}.",
    )
    parser.add_argument("--skip-topic-content", action="store_true", help="Skip per-topic content/resource requests.")
    parser.add_argument("--concurrency", type=int, default=12, help="Per-roadmap topic-content fetch concurrency.")
    return parser.parse_args()


def write_roadmap(output_dir: Path, slug: str, roadmap: dict[str, Any]) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{slug}-roadmap.json"
    output_path.write_text(json.dumps(roadmap, indent=2) + "\n", encoding="utf-8")
    return output_path


def print_report(reports: list[RoadmapReport]) -> None:
    print("[report] written roadmaps", flush=True)
    for report in reports:
        print(
            f"[report] {report.slug}: {report.topic_count} topics, "
            f"{report.zero_resource_topic_count} zero-resource topics, {report.path}",
            flush=True,
        )
        if report.python_iterators_resources is not None:
            print(
                f"[report] python/iterators resources: {report.python_iterators_resources}",
                flush=True,
            )

    print(f"[done] {len(reports)} roadmaps", flush=True)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        raise
    except Exception as error:
        print(error, file=sys.stderr)
        sys.exit(1)
