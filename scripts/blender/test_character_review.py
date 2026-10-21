"""Focused geometry contracts for the transparent character review, without rendering."""

import ast
from collections import Counter
import importlib.util
import math
from pathlib import Path
import sys
import unittest

import bpy

sys.dont_write_bytecode = True
SOURCE = Path(__file__).with_name("build_character_review.py")
SPEC = importlib.util.spec_from_file_location("character_review_under_test", SOURCE)
REVIEW = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(REVIEW)


def edge_uses(mesh):
    """Count polygon ownership of each undirected edge to detect open/disjoint shells."""
    counts = Counter()
    for polygon in mesh.polygons:
        indices = list(polygon.vertices)
        for first, last in zip(indices, indices[1:] + indices[:1]):
            counts[tuple(sorted((first, last)))] += 1
    return counts


class CharacterReviewTests(unittest.TestCase):
    """Check continuous authored meshes and the deliberate non-chibi proportions."""

    def setUp(self):
        """Clear only this disposable factory-startup Blender process."""
        bpy.ops.object.select_all(action="SELECT")
        bpy.ops.object.delete(use_global=False)

    def test_bent_sweep_is_one_closed_surface(self):
        """A bent sleeve is a single capped tube, not overlapping joint spheres."""
        mat = REVIEW.base.material("Test / sweep", "202A36")
        obj = REVIEW.sweep("Test / bent sleeve", [((0, 0, 0), 0.1, 0.08), ((0, 0.2, 0.1), 0.08, 0.07), ((0.1, 0.4, 0.1), 0.05, 0.04)], mat, None, segments=20)
        self.assertEqual(len(obj.data.vertices), 60)
        self.assertTrue(all(count == 2 for count in edge_uses(obj.data).values()))
        self.assertTrue(all(math.isfinite(value) for vertex in obj.data.vertices for value in vertex.co))

    def test_hair_is_one_connected_closed_evaluated_mesh(self):
        """The haircut must not regress to repeated primitive blobs or an open crown."""
        parent = REVIEW.base.empty("Test / head")
        mat = REVIEW.base.material("Test / hair", "28242A")
        hair = REVIEW.connected_crop({"hair": mat}, parent)
        self.assertEqual(list(parent.children), [hair])
        bpy.context.view_layer.update()
        evaluated = hair.evaluated_get(bpy.context.evaluated_depsgraph_get())
        mesh = evaluated.to_mesh()
        self.assertTrue(all(count == 2 for count in edge_uses(mesh).values()))
        mesh.calc_loop_triangles()
        self.assertLess(len(mesh.loop_triangles), 20000)
        self.assertTrue(all(math.isfinite(value) for vertex in mesh.vertices for value in vertex.co))
        evaluated.to_mesh_clear()

    def test_rebuilt_avatar_has_coherent_garments_and_compact_head(self):
        """Preserve the intended working assembly without the previous enlarged-head scale."""
        avatar = REVIEW.build_avatar(REVIEW.make_materials())
        names = {obj.name for obj in avatar.children_recursive}
        for name in ("Avatar / coherent hoodie", "Avatar / coherent seated joggers", "Avatar / connected sculpted crop", "Avatar / keyboard hand / shaped hand", "Avatar / mouse hand / shaped hand"):
            self.assertIn(name, names)
        head = bpy.data.objects["Avatar / rebuilt head"]
        self.assertEqual(tuple(head.scale), (1, 1, 1))
        self.assertEqual(sum(obj.name.startswith("Avatar / connected sculpted crop") for obj in avatar.children_recursive), 1)
        bpy.context.view_layer.update()
        graph = bpy.context.evaluated_depsgraph_get()
        shoes = sorted((obj for obj in avatar.children if obj.name.startswith("Avatar / shaped sneaker")), key=lambda obj: obj.name)
        cuffs = sorted((obj for obj in avatar.children if obj.name.startswith("Avatar / ankle cuff")), key=lambda obj: obj.name)
        for shoe, cuff in zip(shoes, cuffs):
            shoe_eval, cuff_eval = shoe.evaluated_get(graph), cuff.evaluated_get(graph)
            shoe_mesh, cuff_mesh = shoe_eval.to_mesh(), cuff_eval.to_mesh()
            self.assertGreaterEqual(max(vertex.co.z for vertex in shoe_mesh.vertices), min(vertex.co.z for vertex in cuff_mesh.vertices))
            shoe_eval.to_mesh_clear()
            cuff_eval.to_mesh_clear()

    def test_authoring_helpers_are_documented(self):
        """Keep the standalone review script's English contracts inspectable."""
        source = ast.parse(SOURCE.read_text(encoding="utf-8"))
        self.assertTrue(ast.get_docstring(source))
        for node in ast.walk(source):
            if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
                self.assertTrue(ast.get_docstring(node), node.name)


if __name__ == "__main__":
    result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(CharacterReviewTests))
    if not result.wasSuccessful():
        raise RuntimeError("Character-review geometry checks failed.")
