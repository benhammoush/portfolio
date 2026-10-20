"""Give the flag a conforming cloth/star surface so travelling folds cannot hide its star."""

import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector
from mathutils.geometry import delaunay_2d_cdt

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_finish_review import geometry_signature
from flag_motion import WIDTH, HEIGHT, BOTTOM, rest_point


def inside(point, polygon):
    """Classify constrained triangle centres against the original five-point star."""
    result = False
    x, y = point
    for a, b in zip(polygon, polygon[1:] + polygon[:1]):
        if (a.y > y) != (b.y > y) and x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x:
            result = not result
    return result


def main():
    """Retessellate only the cloth and keep the original outline, colours and placement."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    if args.output.exists():
        raise RuntimeError("Choose a new review; preserve the previous source.")
    bpy.ops.wm.open_mainfile(filepath=str(args.source.resolve()), use_scripts=False)
    flag = bpy.data.objects["Flag / Vietnam desk flag"]
    old = [obj for obj in flag.children_recursive if obj.name.startswith(("Flag / red field", "Flag / yellow star"))]
    protected = [obj for obj in bpy.context.scene.objects if obj not in old]
    before = geometry_signature(protected)
    radius = HEIGHT * 0.30
    inner = radius * math.sin(math.pi / 10) / math.sin(3 * math.pi / 10)
    star = [Vector((WIDTH / 2 + math.sin(i * math.pi / 5) * (radius if i % 2 == 0 else inner),
                    BOTTOM + HEIGHT / 2 + math.cos(i * math.pi / 5) * (radius if i % 2 == 0 else inner))) for i in range(10)]
    points = [Vector(p) for p in ((0, BOTTOM), (WIDTH, BOTTOM), (WIDTH, BOTTOM + HEIGHT), (0, BOTTOM + HEIGHT))] + star
    edges = [(i, (i + 1) % 4) for i in range(4)] + [(4 + i, 4 + (i + 1) % 10) for i in range(10)]
    points += [Vector((WIDTH * x / 14, BOTTOM + HEIGHT * z / 8)) for x in range(15) for z in range(9)]
    vertices, _, faces, *_ = delaunay_2d_cdt(points, edges, [[0, 1, 2, 3]], 1, 1e-7)
    mesh = bpy.data.meshes.new("Flag / conforming cloth and star")
    mesh.from_pydata([rest_point(p.x / WIDTH, (p.y - BOTTOM) / HEIGHT) for p in vertices], [], faces)
    mesh.update()
    mesh.materials.append(bpy.data.materials["Flag review / Vietnam red"])
    mesh.materials.append(bpy.data.materials["Flag review / Vietnam yellow"])
    for face in mesh.polygons:
        center = sum((vertices[i] for i in face.vertices), Vector((0, 0))) / len(face.vertices)
        face.material_index = int(inside(center, star))
    assert 0 < sum(face.material_index for face in mesh.polygons) < len(mesh.polygons)
    for obj in old:
        bpy.data.objects.remove(obj, do_unlink=True)
    obj = bpy.data.objects.new("Flag / red field", mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent = flag
    for face in mesh.polygons:
        face.use_smooth = True
    solidify = obj.modifiers.new("Thin two-colour cloth", "SOLIDIFY")
    solidify.thickness, solidify.offset = 0.0006, 0
    solidify.material_offset = 0
    solidify.material_offset_rim = 0
    assert geometry_signature(protected) == before, "Unrelated assembly changed"
    args.output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(args.output.resolve()))
    print(f"CONFORMING_FLAG_COMPLETE {len(vertices)} vertices, {len(faces)} triangles, shared star boundary")


if __name__ == "__main__":
    main()
