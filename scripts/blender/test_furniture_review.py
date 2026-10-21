"""Focused geometry and placement checks for the transparent furniture review."""

import ast
from collections import Counter
import importlib.util
from pathlib import Path
import sys
import unittest

import bpy

sys.dont_write_bytecode = True
SOURCE = Path(__file__).with_name("build_furniture_review.py")
SPEC = importlib.util.spec_from_file_location("furniture_review_under_test", SOURCE)
REVIEW = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(REVIEW)


class FurnitureReviewTests(unittest.TestCase):
    """Check coherent furniture shapes, desktop fit and assembly ownership."""

    def setUp(self):
        """Clear only this disposable factory-startup scene."""
        bpy.ops.object.select_all(action="SELECT")
        bpy.ops.object.delete(use_global=False)

    def test_simple_chair_has_one_closed_back_and_no_headrest(self):
        """Use the requested ordinary office-chair silhouette, not the rejected headrest design."""
        REVIEW.chair(REVIEW.materials())
        back = bpy.data.objects["Chair / simple curved back"]
        uses = Counter()
        for polygon in back.data.polygons:
            vertices = list(polygon.vertices)
            for first, last in zip(vertices, vertices[1:] + vertices[:1]):
                uses[tuple(sorted((first, last)))] += 1
        self.assertTrue(all(count == 2 for count in uses.values()))
        self.assertLess(max(vertex.co.x for vertex in back.data.vertices) - min(vertex.co.x for vertex in back.data.vertices), 0.42)
        self.assertFalse(any("headrest" in obj.name.lower() for obj in bpy.data.objects))
        self.assertEqual(sum(obj.name.startswith("Chair / fixed arm post") for obj in bpy.data.objects), 2)
        self.assertEqual(sum(obj.name.startswith("Chair / twin wheel") for obj in bpy.data.objects), 10)

    def test_inventory_contains_only_plant_and_flask_without_parallettes(self):
        """The revised prop contract must remove both rejected bars completely."""
        root = REVIEW.personal_props(REVIEW.materials())
        self.assertEqual({obj.name for obj in root.children}, {"Plant / desk pot", "Flask / green water flask"})
        self.assertFalse(any(obj.name.startswith("Parallettes /") for obj in bpy.data.objects))
        for name in ("Avatar / original posed study", "Desk / computer setup", "Chair"):
            REVIEW.base.empty(name)
        REVIEW.validate_furniture_scene()
        REVIEW.base.empty("Parallettes / forbidden leftover")
        with self.assertRaisesRegex(RuntimeError, "must not contain parallettes"):
            REVIEW.validate_furniture_scene()

    def test_planter_has_an_open_rim_above_visible_soil(self):
        """Do not close the plant's soil over with a flat ceramic cap."""
        REVIEW.personal_props(REVIEW.materials())
        planter = bpy.data.objects["Plant / ceramic planter"]
        cap = planter.data.polygons[-1]
        cap_height = max(planter.data.vertices[index].co.z for index in cap.vertices)
        soil = bpy.data.objects["Plant / soil"]
        soil_height = soil.location.z + max(vertex.co.z for vertex in soil.data.vertices)
        self.assertLess(cap_height, soil_height)

    def test_desk_keeps_original_top_height(self):
        """Do not strand the accepted hands/keyboard above or below a changed desktop."""
        REVIEW.base.empty("Desk / computer setup")
        REVIEW.refine_desk(REVIEW.materials())
        top = bpy.data.objects["Desk / oak top"]
        self.assertAlmostEqual(top.location.z + max(vertex.co.z for vertex in top.data.vertices), 0.8275, places=5)

    def test_all_desk_columns_reach_tabletop_and_top_rails(self):
        """Regress the visible gap between the old columns and tabletop underside."""
        REVIEW.base.empty("Desk / computer setup")
        REVIEW.refine_desk(REVIEW.materials())
        top = bpy.data.objects["Desk / oak top"]
        underside = top.location.z + min(vertex.co.z for vertex in top.data.vertices)
        columns = [obj for obj in bpy.data.objects if obj.name.startswith("Desk / slim steel column")]
        rails = [obj for obj in bpy.data.objects if obj.name.startswith("Desk / connected top rail")]
        self.assertEqual(len(columns), 4)
        self.assertEqual(len(rails), 2)
        for column in columns:
            column_top = column.location.z + max(vertex.co.z for vertex in column.data.vertices)
            self.assertGreaterEqual(column_top, underside)
            self.assertLess(column_top - underside, 0.005)
            matching_rail = next(rail for rail in rails if abs(rail.location.x - column.location.x) < 0.001)
            self.assertAlmostEqual(matching_rail.location.z + max(vertex.co.z for vertex in matching_rail.data.vertices), underside, places=5)
            self.assertLessEqual(matching_rail.location.y + min(vertex.co.y for vertex in matching_rail.data.vertices), column.location.y)
            self.assertGreaterEqual(matching_rail.location.y + max(vertex.co.y for vertex in matching_rail.data.vertices), column.location.y)

    def test_removing_furniture_does_not_remove_avatar(self):
        """Keep the accepted character assembly separate from replaceable furniture."""
        avatar = REVIEW.base.empty("Avatar / original posed study")
        marker = REVIEW.base.empty("Avatar / marker", parent=avatar)
        REVIEW.chair(REVIEW.materials())
        REVIEW.remove_tree("Chair")
        self.assertIn(avatar.name, bpy.data.objects)
        self.assertEqual(marker.parent, avatar)

    def test_authoring_helpers_are_documented(self):
        """Keep the new standalone script's English contracts inspectable."""
        module = ast.parse(SOURCE.read_text(encoding="utf-8"))
        self.assertTrue(ast.get_docstring(module))
        for node in ast.walk(module):
            if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
                self.assertTrue(ast.get_docstring(node), node.name)


if __name__ == "__main__":
    result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(FurnitureReviewTests))
    if not result.wasSuccessful():
        raise RuntimeError("Furniture-review checks failed.")
