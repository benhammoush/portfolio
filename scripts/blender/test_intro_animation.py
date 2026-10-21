"""Focused offline animation invariants; run with Blender and an explicit source."""

import argparse
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from intro_animation import AnimationAuthor, DURATION, keyboard_phase, left_support
from flag_motion import surface, rest_point
from build_finish_review import geometry_signature


def matrix_error(a, b):
    """Maximum component error for rigid-transform and loop-closure checks."""
    return max(abs(a[row][column] - b[row][column]) for row in range(4) for column in range(4))


def main():
    """Check contact, segment length, independent taps, rest and baked transforms."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    bpy.ops.wm.open_mainfile(filepath=str(args.source.resolve()), use_scripts=False)
    sources = list(bpy.context.scene.objects)
    before = geometry_signature(sources)
    author = AnimationAuthor(bpy.data.objects["Avatar / original posed study"])
    identity = Matrix.Identity(4)
    for name in author.bones:
        assert matrix_error(author.deformations(0)[name], author.deformations(DURATION)[name]) < 2e-6, name
        if name.startswith("FlagWave"):
            h = 0.005
            first = (author.deformations(h)[name] - author.deformations(-h)[name]) * (0.5 / h)
            last = (author.deformations(DURATION + h)[name] - author.deformations(DURATION - h)[name]) * (0.5 / h)
            assert matrix_error(first, last) < 0.002, "Wind velocity jumps at loop seam"
        else:
            assert matrix_error(author.deformations(0)[name], identity) < 2e-6, name
            assert matrix_error(author.deformations(0.005)[name], author.deformations(DURATION - 0.005)[name]) < 2e-6
    for sample in range(DURATION * 48 + 1):
        poses = author.deformations(sample / 48)
        assert (surface(0, 0.5, sample / 48) - rest_point(0, 0.5)).length < 1e-7, "Flag attachment moves"
        for name, (pivot, _) in author.flag.bones.items():
            moved = poses[name] @ pivot
            assert (moved - pivot).length < 0.05, "Cloth wave exceeds desktop-flag scale"
        for side, points in author.lower_body.legs.items():
            hip, knee, ankle = (author.world @ point for point in points)
            thigh, calf, foot = (poses[side + part] for part in ("Thigh", "Calf", "Foot"))
            assert ((thigh @ hip) - hip).length < 2e-5, "Hip leaves seated position"
            assert ((thigh @ knee) - (calf @ knee)).length < 2e-5, "Knee disconnect"
            assert ((calf @ ankle) - (foot @ ankle)).length < 2e-5, "Ankle disconnect"
            assert abs(((thigh @ knee) - (thigh @ hip)).length - (knee - hip).length) < 2e-5
            assert abs(((calf @ ankle) - (calf @ knee)).length - (ankle - knee).length) < 2e-5
            bottom = min((foot @ author.world @ point).z for point in author.lower_body.shoes[side])
            floor = author.lower_body.floor[side]
            assert floor - 2e-6 <= bottom <= floor + 0.00901, "Foot penetrates/floats above support plane"
            if side == "Right":
                assert abs(bottom - floor) < 2e-6, "Rocker foot loses support"
        center = poses["MouseDevice"] @ author.mouse_center
        assert abs(center.z - author.mouse_center.z) < 2e-6, "Mouse floats off mat"
        assert (center - author.mouse_center).length < 0.04, "Mouse leaves working area"
        phase = keyboard_phase(sample / 48)
        if phase == 0:
            assert matrix_error(poses["MouseDevice"], poses["MousePalm"]) < 2e-6, "Mouse grip slides"
        if phase == 1:
            assert ((poses["MousePalm"] @ author.hand["Mouse"].translation) - author.keyboard_target).length < 2e-6, "Right hand misses keyboard"
        for side, points in author.arm.items():
            s, e, w = (author.world @ point for point in points)
            upper, lower = poses[side + "UpperArm"], poses[side + "Forearm"]
            assert ((upper @ s) - (poses["Spine"] @ s)).length < 2e-5, "Shoulder disconnect"
            assert ((upper @ e) - (lower @ e)).length < 2e-5, "Elbow disconnect"
            assert ((lower @ w) - (poses[side + "Palm"] @ w)).length < 2e-5, "Wrist disconnect"
            assert abs(((upper @ e) - (upper @ s)).length - (e - s).length) < 2e-5
            assert abs(((lower @ w) - (lower @ e)).length - (w - e).length) < 2e-5
            hand_origin = author.hand[side].translation
            lift = (poses[side + "Palm"] @ hand_origin).z - hand_origin.z
            if side == "Keyboard":
                assert abs(lift - author.key_lift[side] * left_support(sample / 48)) < 2e-6, "Typing palm bounces"
            elif phase == 0:
                assert abs(lift) < 2e-6, "Mouse grip floats"
            elif phase == 1:
                assert abs(lift - author.key_lift[side]) < 2e-6, "Right hand misses key height"
            else:
                assert -2e-6 <= lift <= 0.04 + author.key_lift[side] + 1e-5, "Hand-transfer arc leaves working area"
            if (side == "Keyboard" and left_support(sample / 48) == 1) or (side == "Mouse" and phase == 1):
                for finger in range(4):
                    tip = poses[f"{side}Finger{finger}Tip"] @ author.tip_points[side, finger]
                    assert tip.z >= author.key_top - 1e-5, "Typing fingertip sinks through keys"
    # One finger moves while its neighbours stay supported, rather than a whole-hand bob.
    poses = author.deformations(1.02 - 0.085)
    assert matrix_error(poses["KeyboardFinger3Tip"], poses["KeyboardPalm"]) > 0.02
    assert matrix_error(poses["KeyboardFinger0Tip"], poses["KeyboardPalm"]) < 2e-6
    for name in ("Mouse / pad", "Keyboard / case", "Plant / ceramic planter"):
        obj = bpy.data.objects[name]
        assert author.weights_for_vertex(obj, obj.matrix_world.translation) == {"Rest": 1.0}
    pole = bpy.data.objects["Flag / pole"]
    assert author.weights_for_vertex(pole, pole.matrix_world.translation) == {"Rest": 1.0}
    red = bpy.data.objects["Flag / red field"]
    attached = author.flag_world @ Vector((0, 0, 0.225))
    assert author.weights_for_vertex(red, attached).get("Rest") == 1
    point = author.flag_world @ Vector((0.10, 0, 0.225))
    front = point + author.flag_world.to_3x3() @ Vector((0, 0.0003, 0))
    back = point - author.flag_world.to_3x3() @ Vector((0, 0.0003, 0))
    assert author.weights_for_vertex(red, front) == author.weights_for_vertex(red, back), "Cloth sides separate"
    # Validate the actual baked bone poses, not only the motion planner math.
    rig = author.build_rig()
    for t in (0, 0.935, 5.75, 12, 16, 24):
        frame = round(t * 24) + 1
        bpy.context.scene.frame_set(frame)
        bpy.context.view_layer.update()
        expected = author.deformations((frame - 1) / 24)
        for bone in rig.pose.bones:
            assert matrix_error(bone.matrix, expected[bone.name] @ bone.bone.matrix_local) < 4e-5, bone.name
    bpy.context.scene.frame_set(1)
    assert geometry_signature(sources) == before, "Modeling source was altered"
    print(f"INTRO_ANIMATION_CHECKS_PASSED {len(author.bones)} bones; {DURATION}s; 1153 contact samples")


if __name__ == "__main__":
    main()
