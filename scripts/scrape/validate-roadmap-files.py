#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from roadmap.validate import isolated_topic_slugs, validate_roadmap

DEFAULT_ROADMAP_DIR = "data/roadmap"


def main() -> None:
    args = parse_args()
    paths = roadmap_paths(args.paths, Path(args.roadmap_dir))
    failures: list[str] = []

    for path in paths:
        slug = path.name.removesuffix("-roadmap.json")
        roadmap = read_json(path)

        try:
            validate_roadmap(slug, roadmap)
        except ValueError as error:
            failures.append(f"{path}: {error}")
            continue

        isolated = isolated_topic_slugs(roadmap)
        if isolated:
            preview = ", ".join(isolated[: args.preview])
            suffix = "" if len(isolated) <= args.preview else f", ... +{len(isolated) - args.preview} more"
            failures.append(
                f"{path}: {len(isolated)} topics have no parent or child: {preview}{suffix}",
            )
            continue

        print(f"[ok] {path} ({len(roadmap['topics'])} topics)", flush=True)

    if failures:
        print("[fail] roadmap validation failed", file=sys.stderr)
        for failure in failures:
            print(f"[fail] {failure}", file=sys.stderr)
        sys.exit(1)

    print(f"[done] validated {len(paths)} roadmap files", flush=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate generated *-roadmap.json files.",
    )
    parser.add_argument("paths", nargs="*", help="Optional roadmap JSON files. Defaults to all files in --roadmap-dir.")
    parser.add_argument(
        "--roadmap-dir",
        default=DEFAULT_ROADMAP_DIR,
        help=f"Directory containing *-roadmap.json files. Defaults to {DEFAULT_ROADMAP_DIR}.",
    )
    parser.add_argument("--preview", type=int, default=12, help="Number of failing topic slugs to print per file.")
    return parser.parse_args()


def roadmap_paths(paths: list[str], roadmap_dir: Path) -> list[Path]:
    if paths:
        return [Path(path) for path in paths]

    return sorted(roadmap_dir.glob("*-roadmap.json"))


def read_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, dict):
        raise ValueError(f"{path}: expected JSON object")

    return data


if __name__ == "__main__":
    main()
