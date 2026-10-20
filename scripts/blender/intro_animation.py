"""Articulated export-only work cycle, preserving the approved modeling source.

Supported hands, independent finger taps, two-bone arm solutions and authored
minimum-jerk transitions replace palm bouncing and synchronized sine-wave sway.
"""

import math

import bpy
from mathutils import Matrix, Vector
from flag_motion import FlagMotion
from lower_body_motion import LowerBodyMotion

DURATION = 24
CLIP_NAME = "Intro natural working cycle"
FINGERS = ((-0.025, 0.042), (-0.008, 0.056), (0.010, 0.051), (0.026, 0.038))
TAPS = ((1.02, 3), (1.29, 2), (1.55, 1), (1.78, 3), (2.10, 2),
        (2.48, 0), (2.75, 2), (3.02, 3), (3.43, 1), (3.79, 2),
        (14.25, 2), (14.51, 3), (14.83, 1), (15.04, 2), (15.42, 0),
        (15.85, 3), (16.13, 2), (16.56, 1), (17.08, 3), (17.36, 2),
        (18.10, 1), (18.43, 3))
MOUSE_PATH = ((0, 0, 0, 0), (5.0, 0, 0, 0), (5.65, 0.029, -0.009, -0.025),
              (6.08, 0.029, -0.009, -0.025), (6.40, 0.025, -0.006, -0.018),
              (7.35, 0.025, -0.006, -0.018), (8.05, -0.015, 0.013, 0.020),
              (8.85, -0.015, 0.013, 0.020), (9.40, 0.004, 0.004, 0.006),
              (10.40, 0.004, 0.004, 0.006), (11.05, 0, 0, 0), (24, 0, 0, 0))


def smooth(low, high, value):
    """Smooth bounded skin weights without hard elbow/wrist transitions."""
    t = max(0, min(1, (value - low) / (high - low)))
    return t * t * (3 - 2 * t)


def ease(t):
    """Minimum jerk: zero first/second derivative at both ends of every hold."""
    t = max(0, min(1, t))
    return t * t * t * (10 + t * (-15 + 6 * t))


def track(points, t):
    """Interpolate authored scalar/vector waypoints without overshoot."""
    for a, b in zip(points, points[1:]):
        if t <= b[0]:
            u = ease((t - a[0]) / (b[0] - a[0]))
            return tuple(x + (y - x) * u for x, y in zip(a[1:], b[1:]))
    return tuple(points[-1][1:])


def tap_angle(t, contact, amplitude=0.14):
    """Lift one finger before contact; zero is the accepted supported rest pose."""
    return track(((contact - 0.22, 0), (contact - 0.085, amplitude),
                  (contact, 0), (contact + 0.065, 0)), t)[0] if contact - 0.22 < t < contact + 0.065 else 0


def keyboard_phase(t):
    """Right hand transfers between mouse and keyboard, instead of one-handed coding."""
    return track(((0, 0), (0.35, 0), (0.95, 1), (4.15, 1), (4.95, 0),
                  (12.95, 0), (13.95, 1), (18.85, 1), (19.75, 0), (24, 0)), t)[0]


def left_support(t):
    """Settle onto key height once; do not lift the whole palm on every keystroke."""
    return track(((0, 0), (0.3, 0), (0.8, 1), (20.5, 1), (22.5, 0), (24, 0)), t)[0]


def around(pivot, angle, axis):
    """Rigid deformation about its anatomical pivot, not about the mesh origin."""
    return Matrix.Translation(pivot) @ Matrix.Rotation(angle, 4, axis) @ Matrix.Translation(-Vector(pivot))


def segment_projection(point, a, b):
    """Return the segment coordinate and squared distance to its centerline."""
    direction = b - a
    t = max(0, min(1, (point - a).dot(direction) / direction.length_squared))
    return t, (point - a.lerp(b, t)).length_squared


def solve_elbow(shoulder, wrist, rest):
    """Two-bone IK with a stable rest-plane pole and invariant segment lengths."""
    s, e, w = rest
    upper, lower = (e - s).length, (w - e).length
    direction = wrist - shoulder
    distance = direction.length
    assert abs(upper - lower) + 1e-5 < distance < upper + lower - 1e-5, "Unreachable work gesture"
    direction.normalize()
    along = (upper * upper - lower * lower + distance * distance) / (2 * distance)
    height = math.sqrt(max(0, upper * upper - along * along))
    rest_axis = (w - s).normalized()
    pole = e - s - rest_axis * (e - s).dot(rest_axis)
    pole -= direction * pole.dot(direction)
    return shoulder + direction * along + pole.normalized() * height


def segment_deform(a, b, new_a, new_b):
    """Rigid upper/forearm transform mapping both segment endpoints exactly."""
    rotation = (b - a).rotation_difference(new_b - new_a).to_matrix().to_4x4()
    return Matrix.Translation(new_a) @ rotation @ Matrix.Translation(-a)


class AnimationAuthor:
    """Cache source-space anatomy and derive skin weights/poses without remodeling."""

    def __init__(self, avatar):
        self.avatar = avatar
        self.world = avatar.matrix_world.copy()
        self.inverse = self.world.inverted()
        self.hand = {side: bpy.data.objects[f"Avatar / {side.lower()} hand"].matrix_world.copy()
                     for side in ("Keyboard", "Mouse")}
        self.hand_inverse = {side: matrix.inverted() for side, matrix in self.hand.items()}
        keys = [obj for obj in bpy.data.objects["Keyboard / typing position"].children_recursive if obj.name.startswith("Keyboard / keycap")]
        self.key_top = max((obj.matrix_world @ Vector(corner)).z for obj in keys for corner in obj.bound_box)
        self.key_lift = {}
        self.tip_points = {}
        graph = bpy.context.evaluated_depsgraph_get()
        for side in self.hand:
            root = bpy.data.objects[f"Avatar / {side.lower()} hand"]
            obj = next(child for child in root.children_recursive if child.type == "MESH")
            evaluated = obj.evaluated_get(graph)
            mesh = evaluated.to_mesh()
            points = [obj.matrix_world @ vertex.co for vertex in mesh.vertices]
            bottom = min(p.z for p in points if (self.hand_inverse[side] @ p).y > 0.075)
            self.key_lift[side] = self.key_top - bottom + 0.0005
            for index, (x, _) in enumerate(FINGERS):
                self.tip_points[side, index] = min((p for p in points
                    if (self.hand_inverse[side] @ p).y > 0.075 and abs((self.hand_inverse[side] @ p).x - x) < 0.006), key=lambda p: p.z).copy()
            evaluated.to_mesh_clear()
        self.arm = {
            "Keyboard": tuple(Vector(p) for p in ((-0.185, 0.23, 0.977), (-0.27, 0.365, 0.88), (-0.15, 0.62, 0.864))),
            "Mouse": tuple(Vector(p) for p in ((0.185, 0.23, 0.977), (0.34, 0.345, 0.865), (0.322, 0.68, 0.864))),
        }
        self.mouse_center = bpy.data.objects["Mouse / shell"].matrix_world.translation.copy()
        keyboard = bpy.data.objects["Keyboard / typing position"].matrix_world
        self.keyboard_target = keyboard @ Vector((0.14, -0.025, 0.019))
        self.keyboard_target.z = self.hand["Mouse"].translation.z + self.key_lift["Mouse"]
        self.keyboard_yaw = keyboard.to_euler().z + 0.13 - self.hand["Mouse"].to_euler().z
        self.source_kind = {}
        self.bones = {"Rest": (Vector((0, 0, 0)), Vector((0, 0, 0.1))),
                      "Spine": (self.world @ Vector((0, 0.08, 0.65)), self.world @ Vector((0, 0.16, 1.08))),
                      "Head": (self.world @ Vector((0, 0.17, 1.11)), self.world @ Vector((0, 0.17, 1.30)))}
        for side, (s, e, w) in self.arm.items():
            assert ((self.world @ w) - self.hand[side].translation).length < 1e-5, "Hand/arm rest mismatch"
            for name, a, b in (("UpperArm", s, e), ("Forearm", e, w)):
                self.bones[side + name] = (self.world @ a, self.world @ b)
            self.bones[side + "Palm"] = (self.hand[side].translation, self.hand[side] @ Vector((0, 0.04, 0)))
            for index in range(4):
                x, length = FINGERS[index]
                for suffix, a, b in (("Base", (x, 0.040, 0), (x, 0.062, -0.003)),
                                     ("Tip", (x, 0.062, -0.003), (x, 0.043 + length, -0.015))):
                    self.bones[f"{side}Finger{index}{suffix}"] = (self.hand[side] @ Vector(a), self.hand[side] @ Vector(b))
        self.bones["MouseDevice"] = (self.mouse_center, self.mouse_center + Vector((0, 0, 0.05)))
        self.flag_world = bpy.data.objects["Flag / Vietnam desk flag"].matrix_world.copy()
        self.flag_inverse = self.flag_world.inverted()
        self.flag = FlagMotion(self.flag_world)
        self.lower_body = LowerBodyMotion(avatar)
        self.bones.update(self.flag.bones)
        self.bones.update(self.lower_body.bones)

    def weights_for_vertex(self, source, world):
        """Blend articulated sleeves/palms/fingers; unrelated objects stay fixed."""
        if source.name not in self.source_kind:
            names, obj = [], source
            while obj is not None:
                names.append(obj.name)
                obj = obj.parent
            kind = "Avatar" if self.avatar.name in names else "Rest"
            for side in self.hand:
                if any(name.startswith(f"Avatar / {side.lower()} hand") for name in names):
                    kind = side
            if source.name.startswith("Mouse / shell"):
                kind = "MouseDevice"
            if source.name.startswith(("Flag / red field", "Flag / yellow star")):
                kind = "FlagCloth"
            if source.name.startswith("Avatar / shaped sneaker"):
                kind = "Shoe"
            elif source.name.startswith(("Avatar / coherent seated joggers", "Avatar / ankle cuff")):
                kind = "Leg"
            self.source_kind[source.name] = kind
        kind = self.source_kind[source.name]
        if kind in ("Rest", "MouseDevice"):
            return {kind: 1.0}
        if kind == "FlagCloth":
            return self.flag.weights(world)
        if kind in ("Leg", "Shoe"):
            return self.lower_body.weights(self.inverse @ world, smooth, segment_projection, kind == "Shoe")
        if kind in self.hand:
            p = self.hand_inverse[kind] @ world
            index = min(range(4), key=lambda i: abs(p.x - FINGERS[i][0]))
            x = FINGERS[index][0]
            finger = smooth(0.033, 0.048, p.y) * (1 - smooth(0.008, 0.014, abs(p.x - x)))
            distal = smooth(0.056, 0.071, p.y)
            return {kind + "Palm": 1 - finger,
                    f"{kind}Finger{index}Base": finger * (1 - distal),
                    f"{kind}Finger{index}Tip": finger * distal}
        p = self.inverse @ world
        if p.z <= 0.65:
            return {"Rest": 1.0}
        head = smooth(1.08, 1.145, p.z)
        if head > 0:
            return {"Spine": 1 - head, "Head": head}
        body = smooth(0.65, 0.92, p.z)
        side = "Keyboard" if p.x < 0 else "Mouse"
        s, e, w = self.arm[side]
        upper_t, upper_distance = segment_projection(p, s, e)
        lower_t, lower_distance = segment_projection(p, e, w)
        upper, lower = (e - s).length, (w - e).length
        arc = upper_t * upper if upper_distance < lower_distance else upper + lower_t * lower
        forearm = smooth(upper - 0.045, upper + 0.045, arc)
        palm = smooth(upper + lower - 0.065, upper + lower - 0.010, arc)
        arm = smooth(0.205, 0.32, p.y) * smooth(0.05, 0.13, abs(p.x))
        return {"Rest": (1 - arm) * (1 - body), "Spine": (1 - arm) * body,
                side + "UpperArm": arm * (1 - forearm),
                side + "Forearm": arm * forearm * (1 - palm), side + "Palm": arm * forearm * palm}

    def deformations(self, t):
        """One grounded pose in world coordinates, with no geometry or camera edits."""
        result = {"Rest": Matrix.Identity(4)}
        lean, shift = track(((0, 0, 0), (0.65, 0, 0), (1.5, -0.012, 0.002),
                             (4.1, -0.012, 0.002), (5.0, 0, 0), (10.9, 0, 0),
                             (12.1, 0.025, -0.006), (13.0, 0.025, -0.006),
                             (14.3, -0.010, 0.001), (18.7, -0.010, 0.001),
                             (20.2, 0, 0), (21.0, 0.010, -0.002), (22.4, 0, 0), (24, 0, 0)), t)
        spine_local = Matrix.Translation((shift, 0, 0)) @ around((0, 0.08, 0.65), lean, "X")
        result["Spine"] = self.world @ spine_local @ self.inverse
        head_turn = track(((0, 0), (10.8, 0), (11.6, 0.045), (12.5, 0.045), (13.6, 0), (24, 0)), t)[0]
        result["Head"] = result["Spine"] @ self.world @ around((0, 0.17, 1.11), head_turn, "Z") @ self.inverse
        key_shift = track(((0, 0, 0), (0.6, 0, 0), (1.0, -0.002, 0.001),
                           (2.4, -0.002, 0.001), (3.1, 0.003, 0), (4.5, 0, 0),
                           (13.8, 0, 0), (14.2, 0.002, 0.001), (16.4, -0.002, 0),
                           (18.8, 0, 0), (24, 0, 0)), t)
        result["KeyboardPalm"] = Matrix.Translation(self.hand["Keyboard"].to_3x3() @ Vector((*key_shift, self.key_lift["Keyboard"] * left_support(t))))
        dx, dy, yaw = track(MOUSE_PATH, t)
        device = Matrix.Translation((dx, dy, 0)) @ around(self.mouse_center, yaw, "Z")
        result["MouseDevice"] = device
        u = keyboard_phase(t)
        wrist = self.hand["Mouse"].translation
        keyboard_deform = Matrix.Translation(self.keyboard_target - wrist) @ around(wrist, self.keyboard_yaw, "Z")
        rotation = device.to_quaternion().slerp(keyboard_deform.to_quaternion(), u).to_matrix().to_4x4()
        # Lift only during deliberate hand transfers. Both endpoints are supported;
        # the actual mouse remains on its mat when the hand releases it.
        position = (device @ wrist).lerp(self.keyboard_target, u) + Vector((0, 0, 0.04 * 4 * u * (1 - u)))
        result["MousePalm"] = Matrix.Translation(position) @ rotation @ Matrix.Translation(-wrist)
        for side, local_rest in self.arm.items():
            rest = tuple(self.world @ point for point in local_rest)
            s, e, w = rest
            new_s = result["Spine"] @ s
            new_w = result[side + "Palm"] @ w
            new_e = solve_elbow(new_s, new_w, rest)
            result[side + "UpperArm"] = segment_deform(s, e, new_s, new_e)
            result[side + "Forearm"] = segment_deform(e, w, new_e, new_w)
            for index in range(4):
                hand_parity = 0 if side == "Keyboard" else 1
                angle = sum(tap_angle(t, contact, 0.12 + index * 0.008)
                            for event, (contact, finger) in enumerate(TAPS)
                            if finger == index and event % 2 == hand_parity)
                if side == "Mouse":
                    angle *= u
                    if index == 0:
                        angle += (1 - u) * sum(tap_angle(t, contact, 0.035) for contact in (6.8, 7.05, 8.6, 9.9))
                x = FINGERS[index][0]
                base = around((x, 0.040, 0), angle, "X")
                tip = base @ around((x, 0.062, -0.003), angle * 0.55, "X")
                hand = result[side + "Palm"] @ self.hand[side]
                result[f"{side}Finger{index}Base"] = hand @ base @ self.hand_inverse[side]
                result[f"{side}Finger{index}Tip"] = hand @ tip @ self.hand_inverse[side]
        result.update(self.flag.deformations(t))
        result.update(self.lower_body.deformations(t, track, around, solve_elbow, segment_deform))
        return result

    def build_rig(self):
        """Bake anatomically coupled transforms into a standard glTF skin/clip."""
        data = bpy.data.armatures.new("Intro articulated working pose")
        rig = bpy.data.objects.new("Intro articulated working pose", data)
        bpy.context.scene.collection.objects.link(rig)
        bpy.context.view_layer.objects.active = rig
        rig.select_set(True)
        bpy.ops.object.mode_set(mode="EDIT")
        for name, (head, tail) in self.bones.items():
            bone = data.edit_bones.new(name)
            bone.head, bone.tail = head, tail
        bpy.ops.object.mode_set(mode="OBJECT")
        scene = bpy.context.scene
        scene.render.fps = 24
        scene.frame_start, scene.frame_end = 1, 1 + DURATION * 24
        for frame in range(scene.frame_start, scene.frame_end + 1):
            transforms = self.deformations((frame - 1) / 24)
            for name, deformation in transforms.items():
                if name == "Rest":
                    continue
                bone = rig.pose.bones[name]
                rest = bone.bone.matrix_local
                bone.rotation_mode = "QUATERNION"
                bone.matrix_basis = rest.inverted() @ deformation @ rest
                bone.keyframe_insert(data_path="location", frame=frame, group=name)
                bone.keyframe_insert(data_path="rotation_quaternion", frame=frame, group=name)
        rig.animation_data.action.name = CLIP_NAME
        scene.frame_set(1)
        return rig


def attach_weights(obj, weights, rig):
    """Skin only moving batches, with four normalized influences at most."""
    if not any(any(name != "Rest" and value > 0 for name, value in row.items()) for row in weights):
        return
    groups = {bone.name: obj.vertex_groups.new(name=bone.name) for bone in rig.data.bones}
    for index, row in enumerate(weights):
        active = sorted(((name, weight) for name, weight in row.items() if weight > 1e-6), key=lambda item: -item[1])[:4]
        total = sum(weight for _, weight in active)
        assert total > 0
        for name, weight in active:
            groups[name].add([index], weight / total, "REPLACE")
    modifier = obj.modifiers.new("Articulated working-pose rig", "ARMATURE")
    modifier.object = rig
    obj.parent = rig
