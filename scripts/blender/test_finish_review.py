"""Focused contracts for posture, material separation, connected hair and integrated shoes."""

import ast
from collections import Counter
import importlib.util
import math
from pathlib import Path
import sys
import unittest

import bpy
from mathutils import Euler, Vector

sys.dont_write_bytecode = True
SOURCE = Path(__file__).with_name("build_finish_review.py")
SPEC = importlib.util.spec_from_file_location("finish_review_under_test", SOURCE)
REVIEW = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(REVIEW)


def closed_edges(mesh):
    """Check that every mesh edge has exactly two incident polygons."""
    uses = Counter()
    for face in mesh.polygons:
        vertices = list(face.vertices)
        for first, last in zip(vertices, vertices[1:] + vertices[:1]):
            uses[tuple(sorted((first, last)))] += 1
    return bool(uses) and all(count == 2 for count in uses.values())


class FinishReviewTests(unittest.TestCase):
    """Keep the requested four changes bounded and inspectable in a disposable scene."""

    def setUp(self):
        """Clear factory-startup test geometry/materials, never an artist's open file."""
        bpy.ops.object.select_all(action="SELECT")
        bpy.ops.object.delete(use_global=False)
        for mat in list(bpy.data.materials):
            bpy.data.materials.remove(mat)

    def test_mouse_arm_bends_and_palm_aligns_with_mouse(self):
        """Relax the nearly straight mouse arm without losing its device contact."""
        old_wrist, old_elbow, _ = REVIEW.character.arm_pose(1)
        wrist, elbow, yaw = REVIEW.character.arm_pose(1, finishing=True)
        old_bend = (old_elbow - Vector((0.185, 0.23, 0.985))).angle(old_wrist - old_elbow)
        new_bend = (elbow - Vector((0.185, 0.23, 0.977))).angle(wrist - elbow)
        self.assertGreater(new_bend, old_bend + math.radians(20))
        pose = Euler((0, 0, -0.35)).to_matrix()
        palm = pose @ wrist + Vector((0, -0.72, 0)) + pose @ (Euler((0, 0, yaw)).to_matrix() @ Vector((0, 0.04, 0)))
        self.assertLess((palm - Vector((0.535, -0.155, 0.864))).length, 0.01)

    def test_black_surfaces_have_distinct_roughness(self):
        """Separate black cotton, upholstery, steel and rubber without white sheen."""
        for name in ("fabric", "frame", "shell", "rubber"):
            REVIEW.character.base.material("Furniture review / " + name, "222B33")
        REVIEW.separate_black_materials()
        mats = REVIEW.character.make_materials(finishing=True)
        hoodie = mats["hoodie"].node_tree.nodes["Principled BSDF"]
        frame = bpy.data.materials["Furniture review / frame"].node_tree.nodes["Principled BSDF"]
        fabric = bpy.data.materials["Furniture review / fabric"].node_tree.nodes["Principled BSDF"]
        self.assertGreater(hoodie.inputs["Roughness"].default_value, fabric.inputs["Roughness"].default_value)
        self.assertGreater(fabric.inputs["Roughness"].default_value, frame.inputs["Roughness"].default_value)
        self.assertLess(max(hoodie.inputs["Sheen Tint"].default_value[:3]), 0.3)

    def test_refined_hair_is_still_one_closed_mesh(self):
        """Asymmetric locks must not introduce detached blobs, an open crown or invalid vertices."""
        root = REVIEW.character.base.empty("Test / head")
        hair = REVIEW.character.connected_crop(REVIEW.character.make_materials(finishing=True), root, finishing=True)
        self.assertEqual(list(root.children), [hair])
        bpy.context.view_layer.update()
        evaluated = hair.evaluated_get(bpy.context.evaluated_depsgraph_get())
        mesh = evaluated.to_mesh()
        self.assertTrue(closed_edges(mesh))
        self.assertTrue(all(math.isfinite(value) for vertex in mesh.vertices for value in vertex.co))
        evaluated.to_mesh_clear()

    def test_sneaker_is_one_closed_mesh_with_integral_sole_faces(self):
        """A subtle sole band belongs to the shoe mesh, not a separate block under the feet."""
        root = REVIEW.character.base.empty("Test / ankle")
        shoe = REVIEW.character.shaped_sneaker(1, 0.02, REVIEW.character.make_materials(finishing=True), root)
        self.assertEqual(list(root.children), [shoe])
        self.assertTrue(closed_edges(shoe.data))
        self.assertEqual(len(shoe.data.materials), 2)
        self.assertEqual({face.material_index for face in shoe.data.polygons}, {0, 1})
        self.assertGreaterEqual(min(vertex.co.z for vertex in shoe.data.vertices), 0)

    def test_furniture_signature_ignores_materials_but_detects_geometry_changes(self):
        """The source furniture can be recolored, not moved or remodeled in this pass."""
        mat = REVIEW.character.base.material("Test / surface", "222B33")
        obj = REVIEW.character.base.box("Test / protected furniture", (0, 0, 0), (1, 1, 1), mat)
        before = REVIEW.geometry_signature([obj])
        mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.9
        self.assertEqual(before, REVIEW.geometry_signature([obj]))
        obj.data.vertices[0].co.x += 0.01
        self.assertNotEqual(before, REVIEW.geometry_signature([obj]))

    def test_finished_shoes_still_overlap_ankle_cuffs(self):
        """Keep the shaped footwear attached to the accepted seated legs."""
        avatar = REVIEW.character.build_avatar(REVIEW.character.make_materials(finishing=True), finishing=True)
        bpy.context.view_layer.update()
        graph = bpy.context.evaluated_depsgraph_get()
        shoes = sorted((obj for obj in avatar.children if obj.name.startswith("Avatar / shaped sneaker")), key=lambda obj: obj.name)
        cuffs = sorted((obj for obj in avatar.children if obj.name.startswith("Avatar / ankle cuff")), key=lambda obj: obj.name)
        self.assertEqual(len(shoes), 2)
        for shoe, cuff in zip(shoes, cuffs):
            shoe_eval, cuff_eval = shoe.evaluated_get(graph), cuff.evaluated_get(graph)
            shoe_mesh, cuff_mesh = shoe_eval.to_mesh(), cuff_eval.to_mesh()
            self.assertGreaterEqual(max(vertex.co.z for vertex in shoe_mesh.vertices), min(vertex.co.z for vertex in cuff_mesh.vertices))
            shoe_eval.to_mesh_clear()
            cuff_eval.to_mesh_clear()

    def test_review_helpers_are_documented(self):
        """Maintain useful English documentation on the standalone finishing workflow."""
        module = ast.parse(SOURCE.read_text(encoding="utf-8"))
        for node in ast.walk(module):
            if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
                self.assertTrue(ast.get_docstring(node), node.name)


if __name__ == "__main__":
    result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(FinishReviewTests))
    if not result.wasSuccessful():
        raise RuntimeError("Four-refinement checks failed.")
