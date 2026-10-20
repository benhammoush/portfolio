"""A pinned, height-varying travelling cloth field for the small desktop flag."""

import math

from mathutils import Matrix, Vector

WIDTH, HEIGHT, BOTTOM = 0.18, 0.12, 0.165
COLUMNS, ROWS = 5, 3


def rest_point(u, v):
    """Match the authored static cloth wave and original 2:3 dimensions."""
    return Vector((WIDTH * u, -0.0025 * math.sin(u * math.tau) * u, BOTTOM + HEIGHT * v))


def surface(u, v, t):
    """Wind travels outwards, with different top/bottom folds and a loose free edge.

    Every temporal period divides 24s. The fabric stays attached at u=0; the
    free edge curls/sags instead of moving the whole flag as a rigid panel.
    """
    phase = math.tau * (t / 2.4 - 1.25 * u) + 0.65 * v
    gust = 0.85 + 0.15 * math.sin(math.tau * t / 8)
    depth = u ** 1.2 * (0.018 * gust * math.sin(phase) +
                       0.003 * math.sin(math.tau * t / 1.2 - 2.4 * math.tau * u + 0.9 * v))
    lift = u ** 1.7 * (0.007 * math.sin(phase - 0.7) +
                      0.002 * math.sin(math.tau * t / 3 - 4 * u + v)) - 0.004 * u * u
    shorten = -0.014 * u * u * (0.65 + 0.35 * math.sin(phase + 0.4))
    return rest_point(u, v) + Vector((shorten, depth, lift))


def frame(point_function, u, v):
    """A local tangent frame rotates skinned normals along with the cloth folds."""
    h = 0.0001
    x = (point_function(u + h, v) - point_function(u - h, v)).normalized()
    z = point_function(u, v + h) - point_function(u, v - h)
    z = (z - x * z.dot(x)).normalized()
    y = z.cross(x).normalized()
    return Matrix((x, y, z)).transposed().to_4x4()


class FlagMotion:
    """Fifteen cloth controls; bilinear four-weight skinning keeps the pole fixed."""

    def __init__(self, world):
        self.world, self.inverse = world.copy(), world.inverted()
        self.bones = {}
        for column in range(1, COLUMNS + 1):
            for row in range(ROWS):
                point = world @ rest_point(column / COLUMNS, row / (ROWS - 1))
                self.bones[self.name(column, row)] = (point, point + Vector((0, 0, 0.025)))

    @staticmethod
    def name(column, row):
        """The entire pinned column uses the fixed Rest bone."""
        return "Rest" if column == 0 else f"FlagWave{(column - 1) * ROWS + row + 1}"

    def weights(self, world):
        """Use exactly the same surface weights for both colours and both sides."""
        p = self.inverse @ world
        x = max(0, min(COLUMNS, p.x / WIDTH * COLUMNS))
        z = max(0, min(ROWS - 1, (p.z - BOTTOM) / HEIGHT * (ROWS - 1)))
        column, row = min(COLUMNS - 1, int(x)), min(ROWS - 2, int(z))
        u, v = x - column, z - row
        result = {}
        for c, cw in ((column, 1 - u), (column + 1, u)):
            for r, rw in ((row, 1 - v), (row + 1, v)):
                name = self.name(c, r)
                result[name] = result.get(name, 0) + cw * rw
        return result

    def deformations(self, t):
        """Rigid local frames provide continuous folds and changing light response."""
        result = {}
        for column in range(1, COLUMNS + 1):
            for row in range(ROWS):
                u, v = column / COLUMNS, row / (ROWS - 1)
                target = surface(u, v, t)
                rotation = frame(lambda x, y: surface(x, y, t), u, v) @ frame(rest_point, u, v).inverted()
                deformation = Matrix.Translation(target) @ rotation @ Matrix.Translation(-rest_point(u, v))
                result[self.name(column, row)] = self.world @ deformation @ self.inverse
        return result
