"""Validate actual Draco-decoded, skinned hand surfaces, not just rig centerlines."""

import argparse
import sys
from pathlib import Path

import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from intro_animation import AnimationAuthor, TAPS, keyboard_phase


def evaluated_geometry(obj):
    """Copy the actual deformed surface in world space and release its temporary mesh."""
    evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh = evaluated.to_mesh()
    vertices = [obj.matrix_world @ vertex.co for vertex in mesh.vertices]
    faces = [tuple(face.vertices) for face in mesh.polygons]
    evaluated.to_mesh_clear()
    return vertices, faces


def main():
    """Import the exported asset, then test weighted contact and transfer clearance."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reference", required=True, type=Path)
    parser.add_argument("--model", required=True, type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    bpy.ops.wm.open_mainfile(filepath=str(args.reference.resolve()), use_scripts=False)
    author = AnimationAuthor(bpy.data.objects["Avatar / original posed study"])
    original = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(args.model.resolve()))
    imported = set(bpy.context.scene.objects) - original
    rig = next(obj for obj in imported if obj.type == "ARMATURE")
    start = rig.animation_data.action.frame_range[0]
    scene = bpy.context.scene
    scene.render.fps = 24

    def pose(t):
        """Evaluate the imported sampled animation, including its real skin weights."""
        frame = start + t * 24
        scene.frame_set(int(frame), subframe=frame - int(frame))
        bpy.context.view_layer.update()

    pose(0)
    skin = next(obj for obj in imported if obj.name.startswith("Web / Character review / skin.001"))
    rest_vertices, rest_faces = evaluated_geometry(skin)
    pads, right_indices = {}, set()
    for side in ("Keyboard", "Mouse"):
        local = [author.hand_inverse[side] @ point for point in rest_vertices]
        for finger, x in enumerate((-0.025, -0.008, 0.010, 0.026)):
            indices = [i for i, p in enumerate(local) if 0.078 < p.y < 0.105 and abs(p.x - x) < 0.006 and -0.025 < p.z < -0.008]
            assert indices, f"No decoded finger pad: {side} {finger}"
            pads[side, finger] = indices
        if side == "Mouse":
            right_indices = {i for i, p in enumerate(local) if -0.021 < p.y < 0.108 and abs(p.x) < 0.06 and abs(p.z) < 0.026}
    right_faces = [face for face in rest_faces if all(index in right_indices for index in face)]
    assert len(right_faces) > 100, "Missing exported hand surface"
    # The mouse remains at rest throughout the transfer intervals, so these
    # actual input-device surfaces can be cached for the collision checks.
    devices = []
    for obj in imported:
        if obj.type == "MESH" and obj.name.startswith("Web / Input review /"):
            vertices, faces = evaluated_geometry(obj)
            devices.append(BVHTree.FromPolygons(vertices, faces))
    assert len(devices) == 4
    gaps = []
    for event, (t, finger) in enumerate(TAPS):
        side = "Keyboard" if event % 2 == 0 else "Mouse"
        pose(t)
        vertices, _ = evaluated_geometry(skin)
        gap = min(vertices[index].z for index in pads[side, finger]) - author.key_top
        assert -0.001 < gap < 0.006, f"Decoded typing contact gap: {side} {finger} at {t}: {gap}"
        gaps.append(gap)
    transfers = 0
    for frame in range(24 * 24 + 1):
        t = frame / 24
        if 0.15 < keyboard_phase(t) < 0.85:
            pose(t)
            vertices, _ = evaluated_geometry(skin)
            hand = BVHTree.FromPolygons(vertices, right_faces)
            assert not any(hand.overlap(device) for device in devices), f"Hand intersects input device in transfer at {t}"
            transfers += 1
    # Validate cloth/pattern attachment on the actual decoded skin, not just
    # matching planner weights. The pole/base material must remain static.
    pose(0)
    field = next(obj for obj in imported if obj.name.startswith("Web / Flag review / Vietnam red"))
    star = next(obj for obj in imported if obj.name.startswith("Web / Flag review / Vietnam yellow"))
    stand = next(obj for obj in imported if obj.name.startswith("Web / Flag review / dark stand"))
    field_rest, _ = evaluated_geometry(field)
    star_rest, _ = evaluated_geometry(star)
    stand_rest, _ = evaluated_geometry(stand)
    seams = []
    for i, point in enumerate(star_rest):
        nearest = min(range(len(field_rest)), key=lambda j: (field_rest[j] - point).length_squared)
        if (field_rest[nearest] - point).length < 0.00015:
            seams.append((i, nearest))
    assert len(seams) >= 20, "Star must share a conforming cloth boundary"
    attached = [i for i, point in enumerate(field_rest) if abs((author.flag_inverse @ point).x) < 0.0001]
    assert attached, "Missing fixed cloth edge"
    motion = 0
    for t in (0.75, 2.4, 6, 11.5, 23.999):
        pose(t)
        vertices, faces = evaluated_geometry(field)
        star_vertices, _ = evaluated_geometry(star)
        stand_vertices, _ = evaluated_geometry(stand)
        assert max((a - b).length for a, b in zip(stand_rest, stand_vertices)) < 2e-5, "Pole/base moves in wind"
        assert max((vertices[i] - field_rest[i]).length for i in attached) < 3e-5, "Cloth detaches from pole"
        assert max(abs(a.z - b.z) for a, b in zip(field_rest, vertices)) < 0.04, "Cloth edge flaps excessively"
        assert max((star_vertices[i] - vertices[j]).length for i, j in seams) < 0.0002, "Star seam opens during travelling folds"
        motion = max(motion, max((a - b).length for a, b in zip(field_rest, vertices)))
    assert 0.012 < motion < 0.08, "Missing or excessive travelling flag motion"
    # Both soles use the same foot transforms as the uppers. Check the actual
    # decimated/decoded sole surface against its virtual support height.
    pose(0)
    sole = next(obj for obj in imported if obj.name.startswith("Web / Character review / sole"))
    sole_rest, _ = evaluated_geometry(sole)
    groups = {side: [i for i, point in enumerate(sole_rest) if ((author.inverse @ point).x < 0) == (side == "Left")]
              for side in ("Left", "Right")}
    floors = {side: min(sole_rest[i].z for i in indices) for side, indices in groups.items()}
    for side, floor in floors.items():
        authored = author.world @ Vector((0, 0, author.lower_body.floor[side]))
        assert abs(floor - authored.z) < 0.0005, "Decoded rest sole differs from authored support plane"
    foot_motion = {"Left": 0, "Right": 0}
    for t in (0, 2.8, 3.3, 4.3, 11.5, 12.2, 16.6, 19.4, 20.2, 21, 24):
        pose(t)
        points, _ = evaluated_geometry(sole)
        for side, indices in groups.items():
            clearance = min(points[i].z for i in indices) - floors[side]
            # The authored high-resolution sole is exactly supported; allow
            # 0.5mm for the existing web decimation/quantization approximation.
            assert -0.0005 < clearance < (0.010 if side == "Left" else 0.001), f"Decoded shoe loses support: {side} t={t} clearance={clearance}"
            foot_motion[side] = max(foot_motion[side], max((points[i] - sole_rest[i]).length for i in indices))
    assert foot_motion["Left"] > 0.025 and foot_motion["Right"] > 0.015, "Missing lower-body movement"
    print(f"EXPORTED_ANIMATION_CHECKS_PASSED {len(gaps)} decoded contact beats; {transfers} transfer surfaces; contact gap {min(gaps):.6f}..{max(gaps):.6f}m")
    print(f"EXPORTED_FLAG_CHECKS_PASSED fixed pole/cloth edge, {len(seams)} shared star seam vertices; sampled maximum flutter {motion:.6f}m")
    print(f"EXPORTED_FEET_CHECKS_PASSED supported soles; sampled movement {foot_motion}")


if __name__ == "__main__":
    main()
