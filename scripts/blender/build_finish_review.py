"""Apply the four approved local refinements without changing furniture or the website.

Refine the seated arms/hand contact, black-material separation, single-mesh haircut
and sneaker silhouette. Read the accepted simple-chair scene without embedded
scripts, preserve its non-avatar geometry, and render transparent review stills.
"""

import argparse
from array import array
import hashlib
import json
from pathlib import Path
import sys

import bpy
from mathutils import Vector

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_character_review as character


def geometry_signature(objects):
    """Fingerprint protected transforms and mesh coordinates, allowing material changes only."""
    result = {}
    bpy.context.view_layer.update()
    for obj in objects:
        coordinates = array("f", (value for vertex in obj.data.vertices for value in vertex.co)) if obj.type == "MESH" else array("f")
        if obj.type == "CURVE":
            coordinates = array("f", (value for spline in obj.data.splines for point in spline.bezier_points for value in (*point.co, *point.handle_left, *point.handle_right, point.radius, point.tilt)))
        result[obj.name] = {
            "transform": tuple(value for row in obj.matrix_local for value in row),
            "vertices": hashlib.sha256(coordinates.tobytes()).hexdigest(),
        }
    return result


def separate_black_materials():
    """Distinguish cotton, upholstery, coated steel and rubber without making black silver."""
    changes = {
        "Furniture review / fabric": ("2D3741", 0.80, 0),
        "Furniture review / frame": ("26343E", 0.40, 0.28),
        "Furniture review / shell": ("18232B", 0.54, 0),
        "Furniture review / rubber": ("17232B", 0.92, 0),
    }
    for name, (color, roughness, metallic) in changes.items():
        mat = bpy.data.materials.get(name)
        if mat is None:
            raise RuntimeError(f"Expected accepted furniture material: {name}")
        shader = mat.node_tree.nodes.get("Principled BSDF")
        shader.inputs["Base Color"].default_value = character.base.linear_color(color)
        shader.inputs["Roughness"].default_value = roughness
        shader.inputs["Metallic"].default_value = metallic
        shader.inputs["Sheen Weight"].default_value = 0.035 if name.endswith("fabric") else 0
        shader.inputs["Sheen Tint"].default_value = character.base.linear_color("45535E")


def avatar_counts(avatar):
    """Measure evaluated review geometry, without declaring an accepted runtime budget."""
    graph = bpy.context.evaluated_depsgraph_get()
    meshes, triangles = 0, 0
    for obj in avatar.children_recursive:
        if obj.type not in {"MESH", "CURVE"}:
            continue
        evaluated = obj.evaluated_get(graph)
        mesh = evaluated.to_mesh()
        mesh.calc_loop_triangles()
        meshes += 1
        triangles += len(mesh.loop_triangles)
        evaluated.to_mesh_clear()
    return {"evaluated_parts": meshes, "evaluated_triangles": triangles, "runtime_optimized": False}


def main():
    """Write a new local review; never overwrite accepted sources or committed assets."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    output = args.output.resolve()
    if output.exists():
        raise RuntimeError("Choose a new output directory; earlier reviews must remain intact.")
    bpy.ops.wm.open_mainfile(filepath=str(args.source.resolve()), use_scripts=False)
    protected = []
    for name in ("Chair", "Desk / computer setup", "Personal props"):
        root = bpy.data.objects[name]
        protected.extend([root, *root.children_recursive])
    before = geometry_signature(protected)
    old = bpy.data.objects["Avatar / original posed study"]
    for obj in list(old.children_recursive) + [old]:
        bpy.data.objects.remove(obj, do_unlink=True)
    avatar = character.build_avatar(character.make_materials(finishing=True), finishing=True)
    separate_black_materials()
    if geometry_signature(protected) != before:
        raise RuntimeError("This pass must not change the approved furniture/prop geometry or placement.")
    if any(obj.name.startswith("Parallettes /") for obj in bpy.data.objects):
        raise RuntimeError("The latest accepted scene contains no parallettes.")
    if bpy.data.objects.get("Studio / invisible ground for contact shadows"):
        raise RuntimeError("The review must not contain a ground plane.")
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
    counts = avatar_counts(avatar)
    bpy.ops.wm.save_as_mainfile(filepath=str(output / "four-refinements.blend"))
    bpy.ops.render.render(write_still=True)
    for obj in bpy.data.objects:
        if obj.type in {"MESH", "CURVE"} and obj not in avatar.children_recursive:
            obj.hide_render = True
    # Diagnostic angle reveals both the relaxed arms and the integral sneaker soles.
    scene.camera.location = (2.1, 2.5, 1.60)
    scene.camera.rotation_euler = (Vector((0, -0.35, 0.79)) - scene.camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera.data.type, scene.camera.data.ortho_scale = "ORTHO", 1.70
    scene.render.resolution_y = 1200
    scene.render.filepath = str(output / "character-detail.png")
    bpy.ops.render.render(write_still=True)
    (output / "review-manifest.json").write_text(json.dumps({
        "status": "Local four-refinement review; not a rig or replacement runtime asset",
        "changes": ["relaxed working arms and mouse contact", "distinct black surface materials", "asymmetric connected haircut", "shaped sneakers with integral sole bands"],
        "protected_furniture_geometry": True, "main_camera_changed": False,
        "background": "transparent", "ground": False, "parallettes": False,
        "avatar_geometry": counts, "external_assets": [], "runtime_changes": False,
    }, indent=2), encoding="utf-8")
    print("FOUR_REFINEMENTS_COMPLETE " + str(output))


if __name__ == "__main__":
    main()
