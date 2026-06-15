from __future__ import annotations

import unittest

from roadmap.graph import build_roadmap_graph
from roadmap.validate import isolated_topic_slugs, validate_roadmap


class RoadmapGraphTest(unittest.TestCase):
    def test_builds_graph_and_drops_invalid_resources(self) -> None:
        roadmap = build_roadmap_graph(
            {
                "slug": "python",
                "title": {"page": "Python"},
                "description": "Python roadmap for @currentYear@.",
                "nodes": [
                    {"id": "root", "type": "title", "data": {"label": "Python"}, "position": {"x": 0, "y": 0}},
                    {"id": "iter", "type": "topic", "data": {"label": "Iterators"}, "position": {"x": 0, "y": 100}},
                    {"id": "bad", "type": "subtopic", "data": {"label": "Bad Link"}, "position": {"x": 0, "y": 200}},
                ],
                "edges": [
                    {"source": "root", "target": "iter", "data": {"edgeStyle": "solid"}},
                    {"source": "iter", "target": "bad", "data": {"edgeStyle": "solid"}},
                ],
            },
            root_key="python",
            topic_content_by_node_id={
                "iter": {
                    "description": "# Iterators\n\nIterators let Python objects produce values one at a time.",
                    "resources": [
                        {
                            "type": "official",
                            "title": "Python Official Documentation on Iterators",
                            "url": "https://docs.python.org/3/tutorial/classes.html#iterators",
                        },
                        {"type": "article", "title": "", "url": "https://example.com/missing-title"},
                    ],
                },
                "bad": {
                    "description": "Invalid resources are removed.",
                    "resources": [{"type": "article", "title": "Missing URL"}],
                },
            },
        )

        validate_roadmap("python", roadmap)

        self.assertEqual(roadmap["title"], "Python")
        self.assertEqual(roadmap["order"], ["iterators", "badLink"])
        self.assertEqual(roadmap["topics"]["iterators"]["summary"], "Iterators let Python objects produce values one at a time.")
        self.assertEqual(
            roadmap["topics"]["iterators"]["articles"],
            [
                {
                    "type": "official",
                    "title": "Python Official Documentation on Iterators",
                    "url": "https://docs.python.org/3/tutorial/classes.html#iterators",
                },
            ],
        )
        self.assertEqual(roadmap["topics"]["badLink"]["articles"], [])

    def test_finds_topics_without_parent_or_child(self) -> None:
        isolated = isolated_topic_slugs(
            {
                "topics": {
                    "root": {"parents": [], "children": ["child"]},
                    "child": {"parents": ["root"], "children": []},
                    "orphan": {"parents": [], "children": []},
                },
            },
        )

        self.assertEqual(isolated, ["orphan"])


if __name__ == "__main__":
    unittest.main()
