"""Focused tests for hood removal, branching foliage and a correct small Vietnam flag."""

import ast
from collections import Counter
import importlib.util
import math
from pathlib import Path
import sys
import unittest

import bpy

sys.dont_write_bytecode = True
SOURCE = Path(__file__).with_name("build_personal_details_review.py")
SPEC = importlib.util.spec_from_file_location("personal_details_under_test", SOURCE)
REVIEW = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(REVIEW)


class PersonalDetailsTests(unittest.TestCase):
    """Keep the requested personal changes independent of the accepted pose/furniture."""

    def setUp(self):
        """Clear only the disposable factory-startup test scene."""
        bpy.ops.object.select_all(action="SELECT")
        bpy.ops.object.delete(use_global=False)

    def test_hood_removal_keeps_body_and_crewneck(self):
        """Do not remove the sweatshirt body or pose while deleting its hanging hood."""
        root = REVIEW.base.empty("Avatar / original posed study")
        body = REVIEW.base.empty("Avatar / coherent hoodie", parent=root)
        REVIEW.base.empty("Avatar / draped fabric hood", parent=root)
        REVIEW.base.empty("Avatar / hood opening", parent=root)
        REVIEW.remove_hood()
        self.assertNotIn("Avatar / draped fabric hood", bpy.data.objects)
        self.assertIn("Avatar / crewneck collar", bpy.data.objects)
        self.assertEqual(body.parent, root)

    def test_plant_uses_alternate_branches_and_preserves_planter(self):
        """Leaves attach above the soil to a central stem, not a uniform soil-level fan."""
        root = REVIEW.base.empty("Plant / desk pot")
        pot = REVIEW.base.empty("Plant / ceramic planter", parent=root)
        REVIEW.base.empty("Plant / soil", parent=root)
        REVIEW.base.empty("Plant / rejected paddle", parent=root)
        REVIEW.rebuild_plant()
        self.assertEqual(pot.parent, root)
        self.assertNotIn("Plant / rejected paddle", bpy.data.objects)
        petioles = [obj for obj in root.children if obj.name.startswith("Plant / alternate petiole")]
        leaves = [obj for obj in root.children if obj.name.startswith("Plant / curved organic leaf")]
        self.assertEqual(len(leaves), 7)
        self.assertEqual(len(petioles), 7)
        heights = [obj.data.splines[0].bezier_points[0].co.z for obj in petioles]
        self.assertEqual(len(set(heights)), 7)
        self.assertGreater(min(heights), 0.20)

    def test_curved_leaf_is_closed_after_thickness(self):
        """Give the organic blade real volume and distinct top/underside surfaces."""
        root = REVIEW.base.empty("Test / stem")
        mat = REVIEW.base.material("Test / green", "438F4C")
        leaf = REVIEW.curved_leaf("Test / blade", (0, 0, 0), (0.12, 0.02, 0.1), (0, -1, 0.4), 0.04, mat, mat, root)
        bpy.context.view_layer.update()
        evaluated = leaf.evaluated_get(bpy.context.evaluated_depsgraph_get())
        mesh = evaluated.to_mesh()
        uses = Counter()
        for face in mesh.polygons:
            vertices = list(face.vertices)
            for first, last in zip(vertices, vertices[1:] + vertices[:1]):
                uses[tuple(sorted((first, last)))] += 1
        self.assertTrue(all(count == 2 for count in uses.values()))
        self.assertTrue(all(math.isfinite(value) for vertex in mesh.vertices for value in vertex.co))
        self.assertEqual(len(leaf.data.materials), 2)
        evaluated.to_mesh_clear()

    def test_vietnam_flag_ratio_star_and_desktop_fit(self):
        """Use a 2:3 red field with one centered upright five-point star per side."""
        REVIEW.base.empty("Personal props")
        root = REVIEW.vietnam_flag()
        field = bpy.data.objects["Flag / red field"]
        width = max(vertex.co.x for vertex in field.data.vertices) - min(vertex.co.x for vertex in field.data.vertices)
        height = max(vertex.co.z for vertex in field.data.vertices) - min(vertex.co.z for vertex in field.data.vertices)
        self.assertAlmostEqual(width / height, 1.5, places=5)
        star = bpy.data.objects["Flag / yellow star front"]
        self.assertEqual(len(star.data.vertices), 11)
        center = star.data.vertices[0].co
        self.assertAlmostEqual(center.x, width / 2, places=5)
        radii = [math.hypot(vertex.co.x - center.x, vertex.co.z - center.z) for vertex in list(star.data.vertices)[1:]]
        self.assertEqual(sum(radius > height * 0.2 for radius in radii), 5)
        self.assertAlmostEqual(star.data.vertices[1].co.z, center.z + height * 0.3, places=5)
        self.assertGreaterEqual(root.location.x, -1.1)
        self.assertLessEqual(root.location.x + width, 1.1)
        self.assertAlmostEqual(root.location.z, 0.8275, places=5)

    def test_review_helpers_are_documented(self):
        """Maintain English contracts for the new local authoring workflow."""
        module = ast.parse(SOURCE.read_text(encoding="utf-8"))
        for node in ast.walk(module):
            if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
                self.assertTrue(ast.get_docstring(node), node.name)


if __name__ == "__main__":
    result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(PersonalDetailsTests))
    if not result.wasSuccessful():
        raise RuntimeError("Personal-details checks failed.")
