from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class RoadmapReport:
    slug: str
    path: Path
    topic_count: int
    zero_resource_topic_count: int
    python_iterators_resources: int | None


def validate_roadmap(slug: str, roadmap: dict[str, Any]) -> None:
    for field in ("title", "summary", "url", "order", "topics", "edges"):
        if field not in roadmap:
            raise ValueError(f"{slug}: missing roadmap field {field}")

    if not isinstance(roadmap["order"], list):
        raise ValueError(f"{slug}: order must be a list")
    if not isinstance(roadmap["topics"], dict):
        raise ValueError(f"{slug}: topics must be an object")

    for topic_slug in roadmap["order"]:
        if topic_slug not in roadmap["topics"]:
            raise ValueError(f"{slug}: order references missing topic {topic_slug}")

    for topic_slug, topic in roadmap["topics"].items():
        validate_topic(slug, topic_slug, topic)

    if slug == "python":
        iterators = roadmap["topics"].get("iterators")
        if not isinstance(iterators, dict):
            raise ValueError("python: missing iterators topic")
        if resource_count(iterators) == 0:
            raise ValueError("python: iterators topic has no resources")


def isolated_topic_slugs(roadmap: dict[str, Any]) -> list[str]:
    topics = roadmap.get("topics")
    if not isinstance(topics, dict):
        return []

    isolated: list[str] = []
    for topic_slug, topic in topics.items():
        if not isinstance(topic, dict):
            isolated.append(str(topic_slug))
            continue

        parents = topic.get("parents")
        children = topic.get("children")
        has_parent = isinstance(parents, list) and len(parents) > 0
        has_child = isinstance(children, list) and len(children) > 0
        if not has_parent and not has_child:
            isolated.append(str(topic_slug))

    return isolated


def build_report(slug: str, path: Path, roadmap: dict[str, Any]) -> RoadmapReport:
    topics = roadmap["topics"]
    zero_resource_topic_count = sum(1 for topic in topics.values() if resource_count(topic) == 0)
    iterators = topics.get("iterators") if slug == "python" else None
    return RoadmapReport(
        slug=slug,
        path=path,
        topic_count=len(roadmap["order"]),
        zero_resource_topic_count=zero_resource_topic_count,
        python_iterators_resources=resource_count(iterators) if isinstance(iterators, dict) else None,
    )


def validate_topic(slug: str, topic_slug: str, topic: Any) -> None:
    if not isinstance(topic, dict):
        raise ValueError(f"{slug}/{topic_slug}: topic must be an object")

    for field in ("title", "sourceId", "type", "order", "summary", "video", "articles", "parents", "children"):
        if field not in topic:
            raise ValueError(f"{slug}/{topic_slug}: missing topic field {field}")

    if not isinstance(topic["articles"], list):
        raise ValueError(f"{slug}/{topic_slug}: articles must be a list")
    if not isinstance(topic["parents"], list):
        raise ValueError(f"{slug}/{topic_slug}: parents must be a list")
    if not isinstance(topic["children"], list):
        raise ValueError(f"{slug}/{topic_slug}: children must be a list")

    for resource in topic["articles"]:
        validate_resource(slug, topic_slug, resource)
    if topic["video"] is not None:
        validate_resource(slug, topic_slug, topic["video"])


def validate_resource(slug: str, topic_slug: str, resource: Any) -> None:
    if not isinstance(resource, dict):
        raise ValueError(f"{slug}/{topic_slug}: resource must be an object")

    if not resource.get("title") or not resource.get("url"):
        raise ValueError(f"{slug}/{topic_slug}: resource missing title or url")


def resource_count(topic: dict[str, Any]) -> int:
    return int(topic.get("video") is not None) + len(topic.get("articles") or [])
