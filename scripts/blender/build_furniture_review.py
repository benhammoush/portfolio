"""Refine the furniture/props around the accepted character, for local still review.

The source .blend and website assets are never overwritten. Keep the character,
desk-level camera and transparent background. Remove the rejected parallettes.
Rebuild a simple black office chair and properly connected desk frame, then render
a full scene and a diagnostic detail view. No animation or runtime export is made.
"""

import argparse
import json
import math
from pathlib import Path
import sys

import bpy
from mathutils import Vector

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_intro_scene as base


def remove_tree(name):
    """Remove a selected assembly only, preserving unrelated scene data and the avatar."""
    root = bpy.data.objects[name]
    for obj in list(root.children_recursive) + [root]:
        bpy.data.objects.remove(obj, do_unlink=True)


def materials():
    """Use distinct matte fabric, polymer, ceramic, oak and powder-coated surfaces."""
    palette = {
        "fabric": ("2B3946", 0.88, 0), "shell": ("192730", 0.58, 0),
        "frame": ("223741", 0.48, 0.16), "rubber": ("17262E", 0.88, 0),
        "oak": ("DBAA56", 0.58, 0), "grip": ("DEB776", 0.62, 0),
        "ceramic": ("ECE5D0", 0.50, 0), "soil": ("3B332B", 0.94, 0),
        "leaf": ("59AB3D", 0.64, 0), "leaf_dark": ("28824A", 0.71, 0),
        "flask": ("2D9B65", 0.64, 0.06),
    }
    return {name: base.material("Furniture review / " + name, color, roughness, metallic) for name, (color, roughness, metallic) in palette.items()}


def panel(name, levels, mat, parent, shell=None):
    """Shape a rounded-rectangular cushion/shell, not an inflated elliptical volume.

    Levels specify z, half-width, half-depth and y center. Superellipse rings give
    broad faces and controlled edge radii; varying centers create lumbar curvature.
    """
    segments = 48
    vertices = []
    for z, width, depth, y in levels:
        for index in range(segments):
            angle = index * math.tau / segments
            x = math.copysign(abs(math.cos(angle)) ** 0.5, math.cos(angle)) * width
            offset = math.copysign(abs(math.sin(angle)) ** 0.5, math.sin(angle)) * depth
            vertices.append((x, y + offset, z))
    faces = [tuple(reversed(range(segments)))]
    for row in range(len(levels) - 1):
        for index in range(segments):
            a, b = row * segments + index, row * segments + (index + 1) % segments
            faces.append((a, b, b + segments, a + segments))
    faces.append(tuple((len(levels) - 1) * segments + index for index in range(segments)))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    base.finish(obj, name, mat, parent)
    if shell:
        mesh.materials.append(shell)
        for index, polygon in enumerate(mesh.polygons):
            polygon.material_index = 0 if index not in (0, len(faces) - 1) and math.sin(((index - 1) % segments + 0.5) * math.tau / segments) > 0 else 1
    smooth = obj.modifiers.new("Designed cushion edge continuity", "SUBSURF")
    smooth.levels = 1
    smooth.render_levels = 1
    return obj


def base_spoke(name, start, end, mat, parent):
    """Model a tapered, flattened chair-base arm with a consistent horizontal width."""
    start, end = Vector(start), Vector(end)
    tangent = (end - start).normalized()
    across = tangent.cross(Vector((0, 0, 1))).normalized()
    vertical = across.cross(tangent).normalized()
    vertices, faces = [], []
    for t, width in ((0, 0.027), (0.45, 0.026), (1, 0.019)):
        center = start.lerp(end, t)
        for index in range(8):
            angle = index * math.tau / 8
            vertices.append(center + across * width * math.cos(angle) + vertical * 0.011 * math.sin(angle))
    faces.append(tuple(reversed(range(8))))
    for row in range(2):
        for index in range(8):
            a, b = row * 8 + index, row * 8 + (index + 1) % 8
            faces.append((a, b, b + 8, a + 8))
    faces.append(tuple(range(16, 24)))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    base.finish(obj, name, mat, parent)
    bevel = obj.modifiers.new("Molded base edge", "BEVEL")
    bevel.width, bevel.segments = 0.003, 2
    obj.modifiers.new("Base face normals", "WEIGHTED_NORMAL")
    return obj


def chair(mats):
    """Make one simple curved-back office chair, without a headrest or wire-like arms."""
    root = base.empty("Chair", (0, -0.72, 0), (0, 0, -0.35))
    panel("Chair / shaped seat cushion", [
        (0.443, 0.19, 0.175, 0.02), (0.451, 0.218, 0.205, 0.02),
        (0.490, 0.225, 0.215, 0.02), (0.507, 0.205, 0.195, 0.02),
    ], mats["fabric"], root)
    panel("Chair / simple curved back", [
        (0.58, 0.145, 0.015, -0.171), (0.60, 0.180, 0.023, -0.169),
        (0.65, 0.193, 0.027, -0.172), (0.75, 0.200, 0.027, -0.182),
        (0.89, 0.200, 0.025, -0.214), (0.95, 0.181, 0.022, -0.230),
        (0.972, 0.145, 0.013, -0.233),
    ], mats["fabric"], root)
    base.box("Chair / seat mechanism", (0, 0.02, 0.427), (0.30, 0.32, 0.024), mats["shell"], 0.008, parent=root)
    base.cylinder_between("Chair / gas lift", (0, 0.02, 0.13), (0, 0.02, 0.43), 0.024, mats["frame"], root)
    for side in (-1, 1):
        bent_back_bracket(side * 0.11, mats["frame"], root)
        base.box("Chair / arm seat mount", (side * 0.22, 0.025, 0.455), (0.10, 0.065, 0.025), mats["shell"], 0.005, parent=root)
        base.box("Chair / fixed arm post", (side * 0.25, 0.025, 0.585), (0.035, 0.045, 0.24), mats["shell"], 0.008, parent=root)
        base.box("Chair / compact arm pad", (side * 0.25, 0.045, 0.72), (0.070, 0.22, 0.04), mats["rubber"], 0.012, parent=root)
    for index in range(5):
        angle = index * math.tau / 5
        center = Vector((0.30 * math.cos(angle), 0.02 + 0.30 * math.sin(angle), 0.035))
        endpoint = center + Vector((0, 0, 0.019))
        base_spoke("Chair / tapered base arm", (0, 0.02, 0.13), endpoint, mats["frame"], root)
        axis = Vector((-math.sin(angle), math.cos(angle), 0))
        base.cylinder_between("Chair / caster axle", center - axis * 0.032, center + axis * 0.032, 0.007, mats["frame"], root)
        for side in (-1, 1):
            wheel = center + side * axis * 0.022
            base.cylinder_between("Chair / twin wheel", wheel - axis * 0.009, wheel + axis * 0.009, 0.033, mats["rubber"], root)
    return root


def bent_back_bracket(x, mat, parent):
    """Join the seat mechanism to the back with a flat bent-steel support, not a floating panel."""
    centers = [Vector((x, -0.13, 0.435)), Vector((x, -0.205, 0.49)), Vector((x, -0.205, 0.68))]
    vertices, faces = [], []
    for index, center in enumerate(centers):
        tangent = (centers[min(index + 1, 2)] - centers[max(index - 1, 0)]).normalized()
        width = Vector((0.015, 0, 0))
        depth = tangent.cross(Vector((1, 0, 0))).normalized() * 0.009
        vertices.extend((center - width - depth, center + width - depth, center + width + depth, center - width + depth))
    faces.append((3, 2, 1, 0))
    for row in range(2):
        for index in range(4):
            a, b = row * 4 + index, row * 4 + (index + 1) % 4
            faces.append((a, b, b + 4, a + 4))
    faces.append((8, 9, 10, 11))
    mesh = bpy.data.meshes.new("Chair / bent back bracket")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new("Chair / bent back bracket", mesh)
    bpy.context.collection.objects.link(obj)
    base.finish(obj, obj.name, mat, parent)
    bevel = obj.modifiers.new("Bracket edge radius", "BEVEL")
    bevel.width, bevel.segments = 0.003, 3
    obj.modifiers.new("Bracket face normals", "WEIGHTED_NORMAL")
    return obj


def refine_desk(mats):
    """Keep the exact desktop height/footprint but replace the pill-like edge and heavy frame."""
    root = bpy.data.objects["Desk / computer setup"]
    for obj in list(root.children):
        if obj.name.startswith(("Desk /", "Monitor / foot", "Monitor / neck")):
            bpy.data.objects.remove(obj, do_unlink=True)
    base.box("Desk / oak top", (0, 0.2, 0.805), (2.2, 0.9, 0.045), mats["oak"], 0.008, parent=root)
    underside = 0.805 - 0.045 / 2
    column_bottom, column_top = 0.028, underside + 0.002
    for side in (-1, 1):
        for y in (-0.15, 0.54):
            base.box("Desk / slim steel column", (side * 0.94, y, (column_bottom + column_top) / 2), (0.04, 0.04, column_top - column_bottom), mats["frame"], 0.004, parent=root)
            base.box("Desk / rubber glide", (side * 0.94, y, 0.009), (0.044, 0.044, 0.018), mats["rubber"], 0.004, parent=root)
        base.box("Desk / lower sled", (side * 0.94, 0.195, 0.028), (0.04, 0.77, 0.030), mats["frame"], 0.004, parent=root)
        base.box("Desk / connected top rail", (side * 0.94, 0.195, underside - 0.035 / 2), (0.045, 0.77, 0.035), mats["frame"], 0.004, parent=root)
    base.box("Desk / rear cross member", (0, 0.53, 0.70), (1.88, 0.03, 0.035), mats["frame"], 0.004, parent=root)
    base.box("Monitor / foot", (0.26, 0.45, 0.835), (0.28, 0.21, 0.015), mats["shell"], 0.006, parent=root)
    base.box("Monitor / neck", (0.26, 0.51, 0.96), (0.038, 0.030, 0.24), mats["frame"], 0.005, parent=root)


def personal_props(mats):
    """Keep the plant and green flask; the owner explicitly removed the parallettes."""
    root = base.empty("Personal props")
    plant = base.empty("Plant / desk pot", (-0.89, 0.43, 0.83), parent=root)
    base.lathe("Plant / ceramic planter", (0, 0, 0), [(0, 0.078), (0.008, 0.085), (0.145, 0.111), (0.160, 0.111), (0.166, 0.102), (0.153, 0.100), (0.145, 0.095)], mats["ceramic"], plant)
    base.lathe("Plant / soil", (0, 0, 0.154), [(0, 0.096), (0.004, 0.096)], mats["soil"], plant)
    leaves = [(-0.13, -0.015, 0.265, -0.95), (0.13, 0.025, 0.30, 0.82),
              (-0.065, 0.035, 0.34, -0.45), (0.038, 0.06, 0.385, 0.20),
              (0.095, -0.025, 0.245, 1.12), (-0.025, -0.035, 0.30, -0.10)]
    for index, (x, y, z, lean) in enumerate(leaves):
        base.curve("Plant / curved stalk", [(0, 0, 0.16), (x * 0.25, y * 0.25, 0.23), (x, y, z)], 0.0035, mats["leaf_dark"], plant)
        leaf = base.loft("Plant / shaped leaf", [(0, 0.002, 0.002, 0, 0), (0.035, 0.033, 0.008, 0, 0.005), (0.095, 0.045, 0.011, 0, 0.012), (0.15, 0.026, 0.007, 0, 0.025), (0.18, 0.002, 0.002, 0, 0.036)], mats["leaf"] if index % 3 else mats["leaf_dark"], plant, segments=16, subdivision=1)
        leaf.location = (x, y, z)
        leaf.rotation_euler = (-0.15 + index * 0.045, lean, -0.10 + index * 0.035)
    flask = base.empty("Flask / green water flask", (0.83, -0.12, 0.829), parent=root)
    base.lathe("Flask / coated body", (0, 0, 0), [(0, 0.042), (0.006, 0.049), (0.025, 0.050), (0.168, 0.049), (0.191, 0.045), (0.211, 0.032), (0.218, 0.031)], mats["flask"], flask)
    base.lathe("Flask / screw lid", (0, 0, 0.216), [(0, 0.033), (0.005, 0.035), (0.024, 0.035), (0.028, 0.030)], mats["rubber"], flask)
    base.curve("Flask / carry loop", [(-0.023, 0, 0.238), (-0.022, 0, 0.275), (0.022, 0, 0.275), (0.023, 0, 0.238)], 0.004, mats["rubber"], flask)
    return root


def validate_furniture_scene():
    """Enforce the latest requested inventory, not the earlier scene's parallettes contract."""
    for name in ("Avatar / original posed study", "Desk / computer setup", "Chair", "Plant / desk pot", "Flask / green water flask"):
        if name not in bpy.data.objects:
            raise RuntimeError(f"Missing required assembly: {name}")
    if any(obj.name.startswith("Parallettes /") for obj in bpy.data.objects):
        raise RuntimeError("The revised scene must not contain parallettes.")


def main():
    """Replace only furniture/props in a new local file, then render transparent review PNGs."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    output = args.output.resolve()
    if output.exists():
        raise RuntimeError("Choose a new output directory; earlier reviews must remain intact.")
    bpy.ops.wm.open_mainfile(filepath=str(args.source.resolve()), use_scripts=False)
    avatar = bpy.data.objects["Avatar / original posed study"]
    character_signature = [(obj.name, tuple(obj.location), tuple(obj.scale), len(obj.data.vertices) if obj.type == "MESH" else 0) for obj in avatar.children_recursive]
    remove_tree("Chair")
    remove_tree("Personal props")
    mats = materials()
    chair(mats)
    refine_desk(mats)
    personal_props(mats)
    current_signature = [(obj.name, tuple(obj.location), tuple(obj.scale), len(obj.data.vertices) if obj.type == "MESH" else 0) for obj in avatar.children_recursive]
    if current_signature != character_signature:
        raise RuntimeError("Furniture pass changed the accepted character assembly.")
    validate_furniture_scene()
    scene = bpy.context.scene
    scene.render.film_transparent = True
    scene.render.image_settings.color_mode = "RGBA"
    scene.cycles.samples = 24
    scene.render.threads_mode = "FIXED"
    scene.render.threads = 6
    scene.render.resolution_x, scene.render.resolution_y = 1200, 900
    scene.render.resolution_percentage = 100
    output.mkdir(parents=True)
    scene.render.filepath = str(output / "scene-transparent.png")
    bpy.ops.wm.save_as_mainfile(filepath=str(output / "furniture-review.blend"))
    bpy.ops.render.render(write_still=True)
    # Diagnostic camera only: the saved scene retains the accepted rear view.
    scene.camera.location = (2.8, -3.8, 2.6)
    scene.camera.rotation_euler = (Vector((0, -0.1, 0.70)) - scene.camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera.data.type = "ORTHO"
    scene.camera.data.ortho_scale = 2.9
    scene.render.filepath = str(output / "furniture-detail.png")
    bpy.ops.render.render(write_still=True)
    (output / "review-manifest.json").write_text(json.dumps({
        "status": "Local furniture/prop review; not a runtime export or accepted final design",
        "character_changed": False, "background": "transparent", "ground": False,
        "camera_changed": False, "detail_camera": "diagnostic only",
        "props": ["plant", "green water flask"], "parallettes_removed": True,
        "chair": "simple black office chair; no headrest", "desk_supports": "connected top rails and columns",
        "external_assets": [], "runtime_changes": False,
    }, indent=2), encoding="utf-8")
    print("FURNITURE_REVIEW_COMPLETE " + str(output))


if __name__ == "__main__":
    main()
