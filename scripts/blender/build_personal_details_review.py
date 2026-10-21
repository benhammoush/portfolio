"""Make the approved crewneck/plant/Vietnam-flag changes as a new local review.

Preserve the working pose, haircut, footwear, chair, connected desk, camera and
transparent presentation. No runtime export, animation, publication or PR update.
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
from build_finish_review import geometry_signature


def remove_hood():
    """Remove only the hanging hood, retaining the black cotton body and crewneck rib."""
    hood = bpy.data.objects.get("Avatar / draped fabric hood")
    if hood is not None:
        bpy.data.objects.remove(hood, do_unlink=True)
    collar = bpy.data.objects.get("Avatar / hood opening")
    if collar is not None:
        collar.name = "Avatar / crewneck collar"


def curved_leaf(name, start, direction, normal, width, mat, underside, parent):
    """Shape a pointed, folded leaf blade with a gentle arch and a drooping tip.

    A raised midrib and curved edges supply volume without repeated paddle-like
    primitives, vein textures or tiny detail that would disappear on the website.
    """
    start, direction, normal = Vector(start), Vector(direction), Vector(normal).normalized()
    across = normal.cross(direction).normalized()
    normal = direction.normalized().cross(across).normalized()
    rows, columns = 10, 5
    vertices = [start]
    for row in range(1, rows):
        t = row / rows
        center = start + direction * t + Vector((0, 0.015 * math.sin(t * math.pi), -0.022 * t * t))
        spread = width * math.sin(t * math.pi) ** 0.75 * (0.92 + 0.08 * t)
        for column in range(columns):
            v = -1 + 2 * column / (columns - 1)
            ridge = normal * 0.006 * (1 - v * v) * math.sin(t * math.pi)
            vertices.append(center + across * v * spread + ridge)
    tip_index = len(vertices)
    vertices.append(start + direction + Vector((0, 0, -0.022)))
    faces = [(0, 1 + column, 2 + column) for column in range(columns - 1)]
    for row in range(rows - 2):
        for column in range(columns - 1):
            a, b = 1 + row * columns + column, 2 + row * columns + column
            faces.append((a, a + columns, b + columns, b))
    last = 1 + (rows - 2) * columns
    faces.extend((last + column, tip_index, last + column + 1) for column in range(columns - 1))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    base.finish(obj, name, mat, parent)
    mesh.materials.append(underside)
    solidify = obj.modifiers.new("Leaf body and darker underside", "SOLIDIFY")
    solidify.thickness = 0.0015
    solidify.material_offset = 1
    solidify.material_offset_rim = 1
    smooth = obj.modifiers.new("Broad leaf curvature", "SUBSURF")
    smooth.levels = 1
    smooth.render_levels = 1
    return obj


def rebuild_plant():
    """Keep the ceramic planter but replace the artificial fan with alternate branching foliage."""
    plant = bpy.data.objects["Plant / desk pot"]
    for obj in list(plant.children_recursive):
        if obj.name not in {"Plant / ceramic planter", "Plant / soil"}:
            bpy.data.objects.remove(obj, do_unlink=True)
    greens = [base.material("Plant review / leaf green", "438F4C", 0.58),
              base.material("Plant review / leaf olive", "56984B", 0.63),
              base.material("Plant review / leaf deep green", "327947", 0.62)]
    underside = base.material("Plant review / underside", "366B42", 0.76)
    stem = base.material("Plant review / branching stem", "4D7444", 0.80)
    base.curve("Plant / central branching stem", [(0, 0, 0.157), (0.012, 0.006, 0.25), (0.015, 0.013, 0.34), (0.005, 0.02, 0.43)], 0.004, stem, plant)
    leaves = [
        (0.215, (-0.14, -0.005, 0.025), (-0.15, -0.8, 0.5), 0.036),
        (0.255, (0.135, -0.045, 0.055), (0.2, -0.4, 0.9), 0.041),
        (0.295, (-0.115, 0.035, 0.10), (-0.15, -0.9, 0.2), 0.042),
        (0.330, (0.10, 0.045, 0.12), (0.1, 0.3, 0.9), 0.035),
        (0.365, (0.01, -0.12, 0.10), (-0.3, -0.7, 0.6), 0.038),
        (0.400, (-0.07, 0.075, 0.13), (0.15, -0.8, 0.6), 0.030),
        (0.425, (0.025, 0.015, 0.13), (-0.1, -1, 0.2), 0.025),
    ]
    for index, (z, direction, normal, width) in enumerate(leaves):
        u = (z - 0.16) / 0.27
        node = Vector((0.012 * math.sin(u * math.pi), 0.02 * u, z))
        direction = Vector(direction)
        petiole_end = node + Vector((direction.x * 0.22, direction.y * 0.22, 0.012))
        base.curve("Plant / alternate petiole", [node, node.lerp(petiole_end, 0.55) + Vector((0, 0, 0.007)), petiole_end], 0.0022, stem, plant)
        curved_leaf("Plant / curved organic leaf", petiole_end, direction, normal, width, greens[index % len(greens)], underside, plant)
    return plant


def flag_wave(x, width):
    """Keep a small static cloth wave rather than an animated or rigid thick flag block."""
    return -0.0025 * math.sin(x / width * math.tau) * (x / width)


def star_mesh(name, width, height, pole_height, mat, parent, front):
    """Author the centered upright five-point star on each side of Vietnam's 2:3 flag."""
    center_x, center_z = width / 2, pole_height - height / 2
    radius = height * 0.30
    inner = radius * math.sin(math.pi / 10) / math.sin(3 * math.pi / 10)
    offset = -0.0008 if front else 0.0008
    vertices = [(center_x, flag_wave(center_x, width) + offset, center_z)]
    for index in range(10):
        angle = index * math.pi / 5
        r = radius if index % 2 == 0 else inner
        x, z = center_x + math.sin(angle) * r, center_z + math.cos(angle) * r
        vertices.append((x, flag_wave(x, width) + offset, z))
    faces = [(0, 1 + (index + 1) % 10, 1 + index) if front else (0, 1 + index, 1 + (index + 1) % 10) for index in range(10)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return base.finish(obj, name, mat, parent)


def vietnam_flag():
    """Place a small red Vietnamese desktop flag with one yellow star beside the plant."""
    props = bpy.data.objects["Personal props"]
    root = base.empty("Flag / Vietnam desk flag", (-0.55, 0.40, 0.8275), parent=props)
    red = base.material("Flag review / Vietnam red", "DA251D", 0.82)
    yellow = base.material("Flag review / Vietnam yellow", "FFFF00", 0.76)
    stand = base.material("Flag review / dark stand", "26343E", 0.58, 0.16)
    base.lathe("Flag / small weighted base", (0, 0, 0), [(0, 0.022), (0.002, 0.027), (0.006, 0.027), (0.009, 0.020)], stand, root)
    base.cylinder_between("Flag / pole", (0, 0, 0.005), (0, 0, 0.30), 0.0025, stand, root)
    width, height, top = 0.18, 0.12, 0.285
    columns, rows = 9, 5
    vertices = [(width * column / (columns - 1), flag_wave(width * column / (columns - 1), width), top - height + height * row / (rows - 1)) for row in range(rows) for column in range(columns)]
    faces = []
    for row in range(rows - 1):
        for column in range(columns - 1):
            a = row * columns + column
            faces.append((a, a + 1, a + columns + 1, a + columns))
    mesh = bpy.data.meshes.new("Flag / red field")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new("Flag / red field", mesh)
    bpy.context.collection.objects.link(obj)
    base.finish(obj, obj.name, red, root)
    solidify = obj.modifiers.new("Thin cloth", "SOLIDIFY")
    solidify.thickness, solidify.offset = 0.0006, 0
    star_mesh("Flag / yellow star front", width, height, top, yellow, root, True)
    star_mesh("Flag / yellow star back", width, height, top, yellow, root, False)
    return root


def main():
    """Preserve the accepted assembly and produce new transparent stills for review only."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    output = args.output.resolve()
    if output.exists():
        raise RuntimeError("Choose a new output directory; do not overwrite earlier reviews.")
    bpy.ops.wm.open_mainfile(filepath=str(args.source.resolve()), use_scripts=False)
    avatar = bpy.data.objects["Avatar / original posed study"]
    protected = []
    for name in ("Chair", "Desk / computer setup", "Flask / green water flask"):
        root = bpy.data.objects[name]
        protected.extend([root, *root.children_recursive])
    protected.extend(obj for obj in [avatar, *avatar.children_recursive] if obj.name not in {"Avatar / draped fabric hood", "Avatar / hood opening"})
    before = geometry_signature(protected)
    remove_hood()
    rebuild_plant()
    vietnam_flag()
    if geometry_signature(protected) != before:
        raise RuntimeError("This pass changed protected character/furniture/props outside the requested edits.")
    if bpy.data.objects.get("Avatar / draped fabric hood"):
        raise RuntimeError("The sweatshirt must no longer have a hood.")
    scene = bpy.context.scene
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.resolution_x, scene.render.resolution_y = 1200, 900
    scene.render.resolution_percentage = 100
    scene.render.threads_mode, scene.render.threads = "FIXED", 6
    scene.cycles.samples = 24
    output.mkdir(parents=True)
    scene.render.filepath = str(output / "scene-transparent.png")
    bpy.ops.wm.save_as_mainfile(filepath=str(output / "personal-details.blend"))
    bpy.ops.render.render(write_still=True)
    scene.camera.location = (1.5, -3.4, 2.7)
    scene.camera.rotation_euler = (Vector((-0.2, 0, 0.95)) - scene.camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera.data.type, scene.camera.data.ortho_scale = "ORTHO", 2.55
    scene.render.filepath = str(output / "details-inspection.png")
    bpy.ops.render.render(write_still=True)
    (output / "review-manifest.json").write_text(json.dumps({
        "status": "Local personal-details review; no runtime replacement",
        "clothing": "black crewneck sweatshirt; hood removed",
        "plant": "branching central stem, alternate petioles and curved leaf blades",
        "flag": "small Vietnam flag, 2:3 ratio, centered upright yellow five-point star",
        "main_camera_changed": False, "protected_geometry_unchanged": True,
        "background": "transparent", "ground": False, "parallettes": False,
        "external_assets": [], "runtime_changes": False,
    }, indent=2), encoding="utf-8")
    print("PERSONAL_DETAILS_COMPLETE " + str(output))


if __name__ == "__main__":
    main()
