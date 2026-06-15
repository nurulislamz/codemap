from __future__ import annotations

import re
import time
from typing import Any

IGNORED_ROADMAP_NODE_LABELS = {
    "At this point, you should know enough to get a job. Gain hands-on practice by building projects.",
    "Click to visit the roadmap",
    "Find the detailed version of this roadmap along with other similar roadmaps",
    "Have a look at the following relevant tracks",
    "Learn one language and build lots of projects before moving on",
    "roadmap.sh",
    "Visit Beginner Friendly Version",
    "You may never need most of these, just know what they are and when to use them",
}
ROADMAP_TOPIC_NODE_TYPES = {"button", "checklist", "label", "paragraph", "subtopic", "topic"}


def build_roadmap_graph(
    roadmap: dict[str, Any],
    *,
    root_key: str,
    topic_content_by_node_id: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    title = roadmap.get("title")
    root_title = root_key
    if isinstance(title, dict):
        root_title = title.get("page") or title.get("card") or root_key
    elif isinstance(title, str):
        root_title = title

    meaningful_nodes = [node for node in roadmap.get("nodes", []) if is_meaningful_roadmap_node(node)]
    topic_nodes = sorted(
        [node for node in meaningful_nodes if node.get("type") != "title"],
        key=lambda node: (
            (node.get("position") or {}).get("y") or 0,
            (node.get("position") or {}).get("x") or 0,
        ),
    )

    node_id_to_key: dict[str, str] = {}
    used_keys: dict[str, int] = {}
    for node in meaningful_nodes:
        node_id = str(node.get("id") or "")
        if not node_id:
            continue

        if node.get("type") == "title":
            node_id_to_key[node_id] = root_key
            continue

        label = (node.get("data") or {}).get("label") or node_id
        node_id_to_key[node_id] = unique_key(to_camel_case(str(label)), used_keys)

    topics: dict[str, dict[str, Any]] = {}
    fallback_order: list[str] = []
    topic_layouts: dict[str, dict[str, Any]] = {}

    for index, node in enumerate(topic_nodes, start=1):
        node_id = str(node.get("id") or "")
        key = node_id_to_key.get(node_id)
        if not key:
            continue

        content = topic_content_by_node_id.get(node_id, {})
        resources = content.get("resources") if isinstance(content.get("resources"), list) else []
        video = first_valid_video(resources)

        fallback_order.append(key)
        topics[key] = {
            "title": clean_text(str((node.get("data") or {}).get("label") or key)),
            "sourceId": node_id,
            "type": node.get("type") or "",
            "order": index,
            "summary": summary_from_markdown(str(content.get("description") or "")),
            "video": video,
            "articles": valid_article_resources(resources),
            "parents": [],
            "children": [],
        }
        topic_layouts[key] = layout_from_roadmap_node(node)

    raw_edges = roadmap.get("edges") if isinstance(roadmap.get("edges"), list) else []
    raw_graph = build_raw_edge_graph(raw_edges)
    edges = collapse_roadmap_edges(raw_edges, raw_graph, node_id_to_key)
    assign_implied_edges(topics, edges, topic_layouts)
    order = build_topic_order(root_key, topics, edges, fallback_order)

    for edge in edges:
        if edge["from"] in topics and edge["to"] not in topics[edge["from"]]["children"]:
            topics[edge["from"]]["children"].append(edge["to"])
        if edge["to"] in topics and edge["from"] not in topics[edge["to"]]["parents"]:
            topics[edge["to"]]["parents"].append(edge["from"])

    for index, key in enumerate(order, start=1):
        if key in topics:
            topics[key]["order"] = index

    summary = str(roadmap.get("description") or "").replace("@currentYear@", str(time.localtime().tm_year))
    return remove_empty_button_topics(
        {
            "title": root_title,
            "summary": clean_text(summary),
            "url": f"https://roadmap.sh/{roadmap.get('slug') or root_key}",
            "order": order,
            "topics": topics,
            "edges": edges,
        },
    )


def is_meaningful_roadmap_node(node: Any) -> bool:
    if not isinstance(node, dict):
        return False

    label = clean_text(str((node.get("data") or {}).get("label") or ""))
    if not label:
        return False
    if label in {"vertical node", "horizontal node"}:
        return False
    if label in IGNORED_ROADMAP_NODE_LABELS:
        return False
    return node.get("type") == "title" or node.get("type") in ROADMAP_TOPIC_NODE_TYPES


def first_valid_video(resources: list[Any]) -> dict[str, str] | None:
    for resource in resources:
        if not isinstance(resource, dict) or resource.get("type") != "video":
            continue

        title = str(resource.get("title") or "")
        url = str(resource.get("url") or "")
        if title and url:
            return {"title": title, "url": url}

    return None


def valid_article_resources(resources: list[Any]) -> list[dict[str, str]]:
    articles: list[dict[str, str]] = []
    for resource in resources:
        if not isinstance(resource, dict) or resource.get("type") == "video":
            continue

        title = str(resource.get("title") or "")
        url = str(resource.get("url") or "")
        if not title or not url:
            continue

        articles.append(
            {
                "type": str(resource.get("type") or "article"),
                "title": title,
                "url": url,
            },
        )

    return articles


def layout_from_roadmap_node(node: dict[str, Any]) -> dict[str, Any]:
    position = node.get("position") or {}
    measured = node.get("measured") or {}
    style = node.get("style") or {}
    data = node.get("data") or {}
    return {
        "x": position.get("x") or 0,
        "y": position.get("y") or 0,
        "width": numeric_size(measured.get("width") or node.get("width") or style.get("width")),
        "height": numeric_size(measured.get("height") or node.get("height") or style.get("height")),
        "hasLegend": bool(data.get("legend")),
    }


def numeric_size(value: Any) -> float:
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        match = re.match(r"^-?\d+(?:\.\d+)?", value)
        return float(match.group(0)) if match else 0
    return 0


def assign_implied_edges(
    topics: dict[str, dict[str, Any]],
    edges: list[dict[str, str]],
    topic_layouts: dict[str, dict[str, Any]],
) -> None:
    entries = [
        {"slug": slug, "topic": topic, "layout": topic_layouts.get(slug)}
        for slug, topic in topics.items()
        if topic_layouts.get(slug) is not None
    ]
    seen = {f"{edge['from']}->{edge['to']}" for edge in edges}
    explicit_parents = {edge["to"] for edge in edges}
    explicit_children = {edge["from"] for edge in edges}
    orphan_topics = [
        entry
        for entry in entries
        if entry["slug"] not in explicit_parents
        and entry["slug"] not in explicit_children
        and entry["topic"].get("type") != "topic"
        and (entry["topic"].get("video") is not None or len(entry["topic"].get("articles") or []) > 0)
    ]
    candidate_parents = [
        entry
        for entry in entries
        if is_visual_group_parent(entry["topic"], entry["layout"])
    ]

    for orphan in orphan_topics:
        best_parent = None
        best_score = float("inf")

        for candidate in candidate_parents:
            if candidate["slug"] == orphan["slug"]:
                continue

            match = visual_group_match(candidate["topic"], candidate["layout"], orphan["layout"])
            if match is None or match["score"] >= best_score:
                continue

            best_parent = candidate
            best_score = match["score"]

        if best_parent is None:
            continue

        edge_key = f"{best_parent['slug']}->{orphan['slug']}"
        if edge_key in seen:
            continue

        seen.add(edge_key)
        edges.append({"from": best_parent["slug"], "to": orphan["slug"], "style": "solid"})
        best_parent["topic"]["children"].append(orphan["slug"])
        orphan["topic"]["parents"].append(best_parent["slug"])


def is_visual_group_parent(topic: dict[str, Any], layout: dict[str, Any] | None) -> bool:
    if not layout:
        return False
    if topic.get("type") in {"topic", "label", "paragraph"}:
        return True
    return topic.get("type") == "subtopic" and not layout.get("hasLegend") and layout.get("width", 0) >= 220


def visual_group_match(
    candidate: dict[str, Any],
    candidate_layout: dict[str, Any],
    child_layout: dict[str, Any] | None,
) -> dict[str, Any] | None:
    if not child_layout:
        return None

    x_gap = abs(candidate_layout.get("x", 0) - child_layout.get("x", 0))
    y_gap = abs(candidate_layout.get("y", 0) - child_layout.get("y", 0))
    is_above = candidate_layout.get("y", 0) < child_layout.get("y", 0)
    candidate_type = candidate.get("type")

    if candidate_type == "label":
        if not is_above or x_gap > 170 or y_gap > 175:
            return None
        return {"isAbove": is_above, "score": y_gap + x_gap}

    if candidate_type == "paragraph":
        if not is_above or x_gap > 210 or y_gap > 280:
            return None
        return {"isAbove": is_above, "score": y_gap + x_gap}

    if candidate_type == "subtopic":
        if not is_above or x_gap > 230 or y_gap > 380:
            return None
        return {"isAbove": is_above, "score": y_gap + x_gap}

    if candidate_type != "topic":
        return None

    has_close_column = x_gap <= 260
    has_same_row_relationship = y_gap <= 90 and x_gap <= 520
    if is_above and y_gap > 240:
        return None
    if not is_above and y_gap > 280:
        return None
    if not has_close_column and not has_same_row_relationship:
        return None

    return {"isAbove": is_above, "score": y_gap + x_gap * 1.5}


def build_raw_edge_graph(edges: list[dict[str, Any]]) -> dict[str, dict[str, list[str]]]:
    outgoing: dict[str, list[str]] = {}
    incoming: dict[str, list[str]] = {}

    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")
        if not isinstance(source, str) or not isinstance(target, str):
            continue

        outgoing.setdefault(source, []).append(target)
        incoming.setdefault(target, []).append(source)

    return {"outgoing": outgoing, "incoming": incoming}


def collapse_roadmap_edges(
    raw_edges: list[dict[str, Any]],
    graph: dict[str, dict[str, list[str]]],
    node_id_to_key: dict[str, str],
) -> list[dict[str, str]]:
    edges: list[dict[str, str]] = []
    seen: set[str] = set()

    for raw_edge in raw_edges:
        source = raw_edge.get("source")
        target = raw_edge.get("target")
        if not isinstance(source, str) or not isinstance(target, str):
            continue

        sources = find_nearest_mapped_nodes(source, graph["incoming"], node_id_to_key)
        targets = find_nearest_mapped_nodes(target, graph["outgoing"], node_id_to_key)
        style = "dashed" if (raw_edge.get("data") or {}).get("edgeStyle") == "dashed" else "solid"

        for from_key in sources:
            for to_key in targets:
                if from_key == to_key:
                    continue

                edge_key = f"{from_key}->{to_key}"
                if edge_key in seen:
                    continue

                seen.add(edge_key)
                edges.append({"from": from_key, "to": to_key, "style": style})

    return edges


def build_topic_order(
    root_key: str,
    topics: dict[str, dict[str, Any]],
    edges: list[dict[str, str]],
    fallback_order: list[str],
) -> list[str]:
    children_by_key: dict[str, list[str]] = {}
    for edge in edges:
        children_by_key.setdefault(edge["from"], []).append(edge["to"])

    visited: set[str] = set()
    order: list[str] = []

    def visit(key: str) -> None:
        for child in children_by_key.get(key, []):
            if child not in topics or child in visited:
                continue

            visited.add(child)
            order.append(child)
            visit(child)

    visit(root_key)

    for key in fallback_order:
        if key in visited:
            continue

        visited.add(key)
        order.append(key)

    return order


def find_nearest_mapped_nodes(
    start_node_id: str,
    next_nodes_by_node_id: dict[str, list[str]],
    node_id_to_key: dict[str, str],
) -> list[str]:
    mapped_start = node_id_to_key.get(start_node_id)
    if mapped_start:
        return [mapped_start]

    found: list[str] = []
    seen = {start_node_id}
    queue = list(next_nodes_by_node_id.get(start_node_id, []))

    while queue:
        node_id = queue.pop(0)
        if node_id in seen:
            continue

        seen.add(node_id)
        mapped = node_id_to_key.get(node_id)
        if mapped:
            found.append(mapped)
            continue

        queue.extend(next_nodes_by_node_id.get(node_id, []))

    return found


def remove_empty_button_topics(roadmap: dict[str, Any]) -> dict[str, Any]:
    to_remove: set[str] = set()

    for slug in roadmap["order"]:
        topic = roadmap["topics"].get(slug)
        if not topic:
            continue

        has_resources = bool(topic.get("video")) or len(topic.get("articles") or []) > 0
        has_relations = len(topic.get("parents") or []) > 0 or len(topic.get("children") or []) > 0
        if topic.get("type") not in {"topic", "checklist"} and not has_resources and not has_relations:
            to_remove.add(slug)

    if not to_remove:
        return roadmap

    topics: dict[str, Any] = {}
    for slug in roadmap["order"]:
        if slug in to_remove:
            continue
        topic = roadmap["topics"].get(slug)
        if not topic:
            continue

        topics[slug] = {
            **topic,
            "parents": [parent for parent in topic.get("parents", []) if parent not in to_remove],
            "children": [child for child in topic.get("children", []) if child not in to_remove],
        }

    return {
        **roadmap,
        "order": [slug for slug in roadmap["order"] if slug not in to_remove],
        "topics": topics,
        "edges": [
            edge
            for edge in roadmap["edges"]
            if edge["from"] not in to_remove and edge["to"] not in to_remove
        ],
    }


def summary_from_markdown(markdown: str) -> str:
    lines = [line for line in markdown.splitlines() if not line.strip().startswith("#")]
    paragraphs = collect_paragraphs(lines)
    return paragraphs[0] if paragraphs else ""


def collect_paragraphs(lines: list[str]) -> list[str]:
    paragraphs: list[str] = []
    current: list[str] = []

    for line in lines:
        cleaned = clean_text(line)
        if not cleaned:
            if current:
                paragraphs.append(" ".join(current))
                current = []
            continue

        if cleaned.startswith("## ") or cleaned.startswith("[]("):
            continue
        current.append(cleaned)

    if current:
        paragraphs.append(" ".join(current))

    return paragraphs


def unique_key(base_key: str, used_keys: dict[str, int]) -> str:
    key = base_key or "topic"
    count = used_keys.get(key, 0)
    used_keys[key] = count + 1
    return key if count == 0 else f"{key}{count + 1}"


def to_camel_case(value: str) -> str:
    words = [
        word
        for word in re.split(r"[^a-zA-Z0-9]+", clean_text(value).replace("'", "").replace("â€™", ""))
        if word
    ]
    result = []
    for index, word in enumerate(words):
        lower = word.lower()
        result.append(lower if index == 0 else lower[:1].upper() + lower[1:])
    return "".join(result)


def clean_text(value: str) -> str:
    value = re.sub(r"!\[([^\]]*)\]\([^)]+\)", r"\1", value)
    value = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", value)
    value = re.sub(r"#+\s*", "", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def is_roadmap_data(value: Any) -> bool:
    return (
        isinstance(value, dict)
        and isinstance(value.get("slug"), str)
        and isinstance(value.get("nodes"), list)
        and isinstance(value.get("edges"), list)
    )
