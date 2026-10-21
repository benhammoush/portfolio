"""Derive a bushier pointed-leaf plant and square monitor; preserve the accepted source."""

import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_intro_scene as base
from build_finish_review import geometry_signature
from build_personal_details_review import curved_leaf


def rebuild_plant():
    """Keep the planter/soil; build five branching shoots with small lanceolate leaves."""
    plant = bpy.data.objects["Plant / desk pot"]
    for obj in list(plant.children_recursive):
        if obj.name not in {"Plant / ceramic planter", "Plant / soil"}:
            bpy.data.objects.remove(obj, do_unlink=True)
    names = ["leaf green", "leaf olive", "leaf deep green", "underside", "branching stem"]
    colors = ["24693D", "357E46", "195233", "285B37", "385C36"]
    materials = []
    for name, color in zip(names, colors):
        mat = bpy.data.materials["Plant review / " + name]
        # Same pigment conversion as the original material builder.
        shader = mat.node_tree.nodes.get("Principled BSDF")
        shader.inputs["Base Color"].default_value = base.linear_color(color)
        shader.inputs["Roughness"].default_value = 0.68
        materials.append(mat)
    greens, underside, stem = materials[:3], materials[3], materials[4]
    for branch in range(5):
        angle = branch * math.tau / 5 + 0.25
        radial = Vector((math.cos(angle), math.sin(angle), 0))
        tangent = Vector((-math.sin(angle), math.cos(angle), 0))
        origin = Vector((0, 0, 0.148))
        tip = radial * (0.065 + 0.009 * (branch % 2)) + Vector((0, 0, 0.345 + 0.017 * (branch % 3)))
        base.curve("Plant / bush branching shoot", [origin, origin.lerp(tip, 0.5), tip], 0.0028, stem, plant)
        for level in range(3):
            t = 0.40 + level * 0.23
            node = origin.lerp(tip, t)
            for side in (-1, 1):
                direction = (radial * 0.45 + tangent * side * 0.8).normalized()
                direction *= 0.085 - level * 0.009 + 0.004 * (branch % 2)
                direction.z = 0.033 + level * 0.005
                petiole = node + direction.normalized() * 0.013
                base.curve("Plant / bush leaf petiole", [node, petiole], 0.0014, stem, plant)
                curved_leaf("Plant / pointed clustered leaf", petiole, direction, (0, -0.25, 1), 0.015 - level * 0.0015, greens[(branch + level) % 3], underside, plant)
        curved_leaf("Plant / pointed shoot tip", tip, radial * 0.025 + Vector((0, 0, 0.064)), (0, -1, 0.5), 0.011, greens[branch % 3], underside, plant)


def main():
    """Save a new editable review with focused geometry guards, never overwrite inputs."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    if args.output.exists():
        raise RuntimeError("Choose a new output directory; preserve previous reviews.")
    bpy.ops.wm.open_mainfile(filepath=str(args.source.resolve()), use_scripts=False)
    plant = bpy.data.objects["Plant / desk pot"]
    monitor = bpy.data.objects["Monitor / tilted display"]
    changed = {monitor, *monitor.children_recursive, *plant.children_recursive}
    # Explicitly protect the pot and soil as well as every unrelated object.
    changed -= {bpy.data.objects["Plant / ceramic planter"], bpy.data.objects["Plant / soil"]}
    protected = [obj for obj in bpy.context.scene.objects if obj not in changed]
    before = geometry_signature(protected)
    display_before = geometry_signature(monitor.children_recursive)
    monitor.rotation_euler = (0, 0, 0)
    rebuild_plant()
    assert geometry_signature(protected) == before, "Unexpected unrelated geometry or transform change"
    display_after = geometry_signature(monitor.children_recursive)
    assert {name: value["vertices"] for name, value in display_before.items()} == {name: value["vertices"] for name, value in display_after.items()}, "Monitor mesh changed, not only orientation"
    assert all(abs(value) < 1e-7 for value in monitor.rotation_euler)
    leaves = [obj for obj in plant.children_recursive if obj.name.startswith("Plant / pointed")]
    assert len(leaves) == 35
    args.output.mkdir(parents=True)
    bpy.ops.wm.save_as_mainfile(filepath=str((args.output / "plant-monitor.blend").resolve()))
    (args.output / "review-manifest.json").write_text(json.dumps({
        "source_review": "personal-details-01", "status": "local visual trial, pending owner acceptance",
        "monitor_rotation": list(monitor.rotation_euler), "leaf_count": len(leaves),
        "protected_geometry_unchanged": True, "pot_and_soil_unchanged": True,
        "animation": False, "external_assets": [],
    }, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
