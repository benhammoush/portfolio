"""Focused Blender-side contract checks for the original still generator.

Run in a disposable --factory-startup background process, never an open artist file.
The suite uses only temporary test data and does not render or overwrite reviews.
"""

import ast
import importlib.util
import math
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import bpy

sys.dont_write_bytecode = True
SOURCE = Path(__file__).with_name("build_intro_scene.py")
SPEC = importlib.util.spec_from_file_location("intro_scene_under_test", SOURCE)
INTRO = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(INTRO)


class IntroSceneTests(unittest.TestCase):
    """Check path safety, authored geometry and the stated asset inventory boundary."""

    def setUp(self):
        """Reset only this disposable Blender process between independent fixtures."""
        self.temp_root = Path("test-results/intro-scene").resolve()
        self.temp_root.mkdir(parents=True, exist_ok=True)
        bpy.ops.object.select_all(action="SELECT")
        bpy.ops.object.delete(use_global=False)
        for image in list(bpy.data.images):
            bpy.data.images.remove(image)

    def test_linear_color_endpoints(self):
        """Preserve black/white and use an actual sRGB-to-linear midtone conversion."""
        self.assertEqual(INTRO.linear_color("000000"), (0, 0, 0, 1))
        self.assertEqual(INTRO.linear_color("FFFFFF"), (1, 1, 1, 1))
        self.assertAlmostEqual(INTRO.linear_color("808080")[0], 0.21586, places=4)

    def test_output_path_is_absolute(self):
        """Prevent Blender from interpreting an output relative to a different base."""
        with patch.object(sys, "argv", ["blender", "--", "--output", "test-results/intro-scene/path-fixture"]):
            args = INTRO.arguments()
        self.assertTrue(args.output.is_absolute())
        self.assertEqual(args.output, Path("test-results/intro-scene/path-fixture").resolve())

    def test_polished_materials_are_procedural(self):
        """Wood color grain and fabric sheen stay self-contained without textures."""
        wood = INTRO.material("Test / grain", "B68C58", wood=True)
        grain = wood.node_tree.nodes.get("Subtle warm wood grain")
        self.assertIsNotNone(grain)
        self.assertTrue(wood.node_tree.nodes["Principled BSDF"].inputs["Base Color"].is_linked)
        cloth = INTRO.material("Test / cloth", "181A1D", cloth=True)
        self.assertAlmostEqual(cloth.node_tree.nodes["Principled BSDF"].inputs["Sheen Weight"].default_value, 0.18, places=5)
        self.assertFalse(any(node.type == "TEX_IMAGE" for mat in (wood, cloth) for node in mat.node_tree.nodes))

    def test_invalid_render_limits(self):
        """Reject accidental excessive render dimensions before scene mutation."""
        with patch.object(sys, "argv", ["blender", "--", "--output", "test-results/intro-scene/path-fixture", "--width", "9000"]):
            with self.assertRaises(SystemExit):
                INTRO.arguments()

    def test_loft_is_closed_and_finite(self):
        """The organic-body helper creates rings and caps rather than loose surfaces."""
        mat = INTRO.material("Test / body", "AABBCC")
        body = INTRO.loft("Test / loft", [(0, 0.1, 0.1, 0, 0), (0.2, 0.08, 0.1, 0, 0.03)], mat, segments=16)
        self.assertEqual(len(body.data.vertices), 32)
        self.assertEqual(len(body.data.polygons), 18)
        self.assertTrue(all(math.isfinite(value) for vertex in body.data.vertices for value in vertex.co))

    def test_inventory_and_texture_boundary(self):
        """Require the actual desk/avatar/prop roots and reject external file textures."""
        with self.assertRaisesRegex(RuntimeError, "Missing approved assembly"):
            INTRO.validate_scene()
        for name in ["Avatar / original posed study", "Desk / computer setup", "Chair", "Plant / desk pot", "Flask / green water flask", "Parallettes / bar 1", "Parallettes / bar 2"]:
            INTRO.empty(name)
        INTRO.validate_scene()
        image = bpy.data.images.new("Test / disallowed file texture", 1, 1)
        image.source = "FILE"
        image.filepath = "not-an-approved-image.png"
        with self.assertRaisesRegex(RuntimeError, "external image"):
            INTRO.validate_scene()

    def test_blended_surfaces_keep_parent_local_geometry(self):
        """Fuse sculpt parts without baking the avatar's world pose into them twice."""
        root = INTRO.empty("Test / posed parent", (2, -3, 1), (0, 0, 0.5))
        mat = INTRO.material("Test / sculpt", "AABBCC")
        parts = [INTRO.ellipsoid("Test / volume", (x, 0, 0), (0.1, 0.1, 0.1), mat, root) for x in (0, 0.08)]
        names = [part.name for part in parts]
        sculpt = INTRO.blend_surfaces("Test / fused", parts, mat, root, voxel_size=0.01)
        self.assertEqual(sculpt.parent, root)
        self.assertTrue(all(name not in bpy.data.objects for name in names))
        bpy.context.view_layer.update()
        evaluated = sculpt.evaluated_get(bpy.context.evaluated_depsgraph_get())
        mesh = evaluated.to_mesh()
        self.assertGreater(len(mesh.vertices), 0)
        self.assertTrue(all(abs(vertex.co.x) < 0.2 and abs(vertex.co.y) < 0.12 for vertex in mesh.vertices))
        evaluated.to_mesh_clear()

    def test_parallettes_fit_on_desktop(self):
        """Keep both relocated bars inside the desktop and their feet on its top."""
        mat = INTRO.material("Test / props", "AABBCC")
        mats = dict.fromkeys(["pot", "soil", "leaf_dark", "leaf", "flask", "rubber", "metal", "wood"], mat)
        INTRO.create_personal_props(mats)
        bpy.context.view_layer.update()
        for index in (1, 2):
            bar = bpy.data.objects[f"Parallettes / bar {index}"]
            self.assertAlmostEqual(bar.location.z + 0.022 - 0.037 / 2, 0.8275)
            self.assertLess(abs(bar.location.x) + 0.11, 1.1)
            self.assertGreater(bar.location.y - 0.24, -0.25)
            self.assertLess(bar.location.y + 0.24, 0.65)

    def test_existing_review_is_not_overwritten(self):
        """Stop before scene deletion or writing when a prior blend review exists."""
        marker = INTRO.empty("Test / scene must survive refusal")
        with tempfile.TemporaryDirectory(prefix="intro-scene-test-", dir=self.temp_root) as directory:
            target = Path(directory) / "intro-scene.blend"
            target.write_bytes(b"existing-review-fixture")
            with patch.object(sys, "argv", ["blender", "--", "--output", directory]):
                with self.assertRaisesRegex(RuntimeError, "Output already exists"):
                    INTRO.main()
            self.assertEqual(target.read_bytes(), b"existing-review-fixture")
        self.assertIn(marker.name, bpy.data.objects)

    def test_named_helpers_are_documented(self):
        """Keep the standalone authoring script's contracts understandable in English."""
        module = ast.parse(SOURCE.read_text(encoding="utf-8"))
        self.assertTrue(ast.get_docstring(module))
        for node in ast.walk(module):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                self.assertTrue(ast.get_docstring(node), f"Missing documentation: {node.name}")


if __name__ == "__main__":
    result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(IntroSceneTests))
    if not result.wasSuccessful():
        raise RuntimeError("Intro-scene checks failed; do not accept generated outputs.")
