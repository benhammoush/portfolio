"""Occasional seated foot adjustments with supported shoes and coupled knees."""

import bpy
from mathutils import Matrix, Vector


class LowerBodyMotion:
    """Keep the pelvis fixed; derive thigh/calf movement from grounded shoe poses."""

    def __init__(self, avatar):
        self.world = avatar.matrix_world.copy()
        self.inverse = self.world.inverted()
        self.legs, self.shoes, self.bones = {}, {}, {}
        graph = bpy.context.evaluated_depsgraph_get()
        for obj in avatar.children_recursive:
            if obj.name.startswith("Avatar / shaped sneaker"):
                evaluated = obj.evaluated_get(graph)
                mesh = evaluated.to_mesh()
                points = [self.inverse @ obj.matrix_world @ vertex.co for vertex in mesh.vertices]
                side = "Left" if sum(point.x for point in points) < 0 else "Right"
                self.shoes[side] = points
                evaluated.to_mesh_clear()
        assert set(self.shoes) == {"Left", "Right"}
        self.floor = {side: min(point.z for point in points) for side, points in self.shoes.items()}
        for side, sign, offset in (("Left", -1, 0), ("Right", 1, 0.02)):
            hip = Vector((sign * 0.095, 0.04, 0.545))
            knee = Vector((sign * 0.165, 0.435 + offset, 0.42))
            ankle = Vector((sign * 0.17, 0.42 + offset, 0.135))
            self.legs[side] = (hip, knee, ankle)
            for name, a, b in (("Thigh", hip, knee), ("Calf", knee, ankle)):
                self.bones[side + name] = (self.world @ a, self.world @ b)
            self.bones[side + "Foot"] = (self.world @ ankle, self.world @ Vector((sign * 0.17, 0.59 + offset, 0.04)))

    def feet(self, t, track, around):
        """One heel rock during typing; a separate small left-foot reposition later."""
        roll = track(((0, 0), (1.7, 0), (2.8, -0.12), (3.3, -0.12), (4.3, 0),
                      (15.7, 0), (16.6, -0.08), (17.1, -0.08), (18.0, 0), (24, 0)), t)[0]
        shift = track(((0, 0), (10.8, 0), (12.2, 1), (19.4, 1), (21.0, 0), (24, 0)), t)[0]
        local = {
            "Right": around((0.17, 0.58, self.floor["Right"]), roll, "X"),
            "Left": Matrix.Translation((-0.026 * shift, -0.028 * shift, 0)) @
                    around((-0.17, 0.49, self.floor["Left"]), 0.07 * shift, "Z"),
        }
        for side in local:
            # Fit to actual evaluated soles, not an assumed primitive bounding box.
            bottom = min((local[side] @ point).z for point in self.shoes[side])
            clearance = 0.009 * 4 * shift * (1 - shift) if side == "Left" else 0
            local[side] = Matrix.Translation((0, 0, self.floor[side] - bottom + clearance)) @ local[side]
        return {side: self.world @ pose @ self.inverse for side, pose in local.items()}

    def deformations(self, t, track, around, solve_joint, segment_deform):
        """Preserve limb lengths and ankle continuity while the hips stay seated."""
        result = {}
        for side, foot in self.feet(t, track, around).items():
            rest = tuple(self.world @ point for point in self.legs[side])
            hip, knee, ankle = rest
            moved_ankle = foot @ ankle
            moved_knee = solve_joint(hip, moved_ankle, rest)
            result[side + "Thigh"] = segment_deform(hip, knee, hip, moved_knee)
            result[side + "Calf"] = segment_deform(knee, ankle, moved_knee, moved_ankle)
            result[side + "Foot"] = foot
        return result

    def weights(self, point, smooth, projection, shoe=False):
        """Blend the merged joggers through knee/ankle without moving the seated hips."""
        side = "Left" if point.x < 0 else "Right"
        if shoe:
            return {side + "Foot": 1.0}
        hip, knee, ankle = self.legs[side]
        a, da = projection(point, hip, knee)
        b, db = projection(point, knee, ankle)
        upper, lower = (knee - hip).length, (ankle - knee).length
        arc = a * upper if da < db else upper + b * lower
        shin = smooth(upper - 0.05, upper + 0.05, arc)
        foot = smooth(upper + lower - 0.075, upper + lower - 0.015, arc)
        leg = smooth(0.09, 0.22, point.y) * smooth(0.035, 0.085, abs(point.x))
        return {"Rest": 1 - leg, side + "Thigh": leg * (1 - shin),
                side + "Calf": leg * shin * (1 - foot), side + "Foot": leg * shin * foot}
