"""Rebuild the avatar for a transparent, web-oriented visual-review checkpoint.

Read a previous local desk-scene .blend without executing embedded scripts. Keep
the desk, chair and personal props, replace the avatar with deliberately shaped
surfaces, remove the ground, and render a rear scene plus a diagnostic portrait.
This produces local review artifacts, not a rig or a replacement runtime asset.
"""

import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.dont_write_bytecode = True
import build_intro_scene as base


def sweep(name, sections, mat, parent, segments=20, subdivision=1):
    """Join shaped cross-sections along a bent centerline, without ball joints.

    Each section supplies a center and two cross-sectional radii. Projected local
    frames maintain the width direction; subdivision relaxes the authored contour.
    """
    centers = [Vector(section[0]) for section in sections]
    vertices, faces = [], []
    for index, (center, (_, width, depth)) in enumerate(zip(centers, sections)):
        tangent = (centers[min(index + 1, len(centers) - 1)] - centers[max(index - 1, 0)]).normalized()
        preferred = Vector((1, 0, 0))
        horizontal = preferred - tangent * tangent.dot(preferred)
        if horizontal.length < 0.2:
            preferred = Vector((0, 1, 0))
            horizontal = preferred - tangent * tangent.dot(preferred)
        horizontal.normalize()
        vertical = tangent.cross(horizontal).normalized()
        for column in range(segments):
            angle = column * math.tau / segments
            vertices.append(center + horizontal * width * math.cos(angle) + vertical * depth * math.sin(angle))
    faces.append(tuple(reversed(range(segments))))
    for row in range(len(sections) - 1):
        for column in range(segments):
            a = row * segments + column
            b = row * segments + (column + 1) % segments
            faces.append((a, b, b + segments, a + segments))
    faces.append(tuple((len(sections) - 1) * segments + index for index in range(segments)))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    if subdivision:
        modifier = obj.modifiers.new("Authored contour smoothing", "SUBSURF")
        modifier.levels = subdivision
        modifier.render_levels = subdivision
    return base.finish(obj, name, mat, parent)


def make_materials(finishing=False):
    """Separate cotton, skin, hair and rubber without fine procedural texture noise."""
    palette = {
        "skin": ("DBA373", 0.65), "skin_fold": ("AD7554", 0.75),
        "hair": ("28242A", 0.72), "eye": ("302A2B", 0.6),
        "hoodie": ("202A36", 0.86), "rib": ("18222D", 0.92),
        "hood_inside": ("131D27", 0.95), "joggers": ("19232E", 0.88),
        "shoe": ("DFE9E5", 0.7),
    }
    if finishing:
        palette.update({"hoodie": ("20262E", 0.94), "joggers": ("192029", 0.91), "hair": ("28242A", 0.67), "sole": ("AEBCC0", 0.86)})
    mats = {name: base.material("Character review / " + name, color, roughness) for name, (color, roughness) in palette.items()}
    if finishing:
        shader = mats["hoodie"].node_tree.nodes.get("Principled BSDF")
        shader.inputs["Sheen Weight"].default_value = 0.10
        shader.inputs["Sheen Tint"].default_value = base.linear_color("566170")
        shader.inputs["Sheen Roughness"].default_value = 0.85
    return mats


def hand(name, position, yaw, mouse, mats, parent):
    """Author a tapered palm and gently flexed fingers as one static hand surface."""
    root = base.empty(name, position, rotation=(0, 0, yaw), parent=parent)
    pieces = [sweep(name + " / palm", [
        ((0, -0.015, 0), 0.024, 0.016), ((0, 0.008, 0.001), 0.033, 0.018),
        ((0, 0.042, 0.001), 0.036, 0.017), ((0, 0.057, -0.003), 0.031, 0.013),
    ], mats["skin"], root)]
    for index, (x, length) in enumerate(((-0.025, 0.042), (-0.008, 0.056), (0.010, 0.051), (0.026, 0.038))):
        pieces.append(sweep(name + f" / finger {index}", [
            ((x, 0.040, 0), 0.0085, 0.010), ((x, 0.062, 0.004 if mouse else -0.003), 0.008, 0.009),
            ((x, 0.040 + length * 0.85, -0.009), 0.0065, 0.007),
            ((x, 0.043 + length, -0.015), 0.003, 0.003),
        ], mats["skin"], root, segments=12))
    side = -1 if mouse else 1
    pieces.append(sweep(name + " / thumb", [
        ((side * 0.023, 0.005, -0.003), 0.012, 0.012),
        ((side * 0.043, 0.023, -0.008), 0.011, 0.009),
        ((side * 0.045, 0.046, -0.013), 0.005, 0.006),
    ], mats["skin"], root, segments=12))
    base.blend_surfaces(name + " / shaped hand", pieces, mats["skin"], root, voxel_size=0.002)
    return root


def profile_radius(z):
    """Interpolate the head profile so the haircut follows the skull, not a hat."""
    profile = [(-0.13, 0.037, 0.041), (-0.10, 0.073, 0.062), (-0.055, 0.100, 0.083),
               (0, 0.114, 0.096), (0.055, 0.113, 0.098), (0.11, 0.095, 0.087),
               (0.15, 0.060, 0.058), (0.178, 0.0, 0.0)]
    for first, last in zip(profile, profile[1:]):
        if first[0] <= z <= last[0]:
            t = (z - first[0]) / (last[0] - first[0])
            return (first[1] * (1 - t) + last[1] * t, first[2] * (1 - t) + last[2] * t)
    return (0, 0) if z > profile[-1][0] else profile[0][1:]


def connected_crop(mats, parent, finishing=False):
    """Sculpt one connected short crop with irregular flowing locks, not beads.

    Broad overlapping displacement fields form the lock flow. They are stretched
    over the crown and do not create rows, separate spheres or strand geometry.
    """
    segments, rings = 64, 16
    vertices = [(0.003, -0.005, 0.1878)]
    locks = []
    for index in range(28):
        angle = index * 2.399963 + 0.4
        height = 0.25 + 1.7 * math.sqrt((index + 0.5) / 28)
        locks.append((angle, height, 0.012 + 0.006 * math.sin(index * 1.7) ** 2, 0.28 + 0.08 * math.cos(index * 1.3) ** 2, 0.22 + 0.13 * math.sin(index * 0.9) ** 2))
    if finishing:
        locks = [(-2.6, 1.4, 0.010, 0.35, 0.24), (-1.8, 1.15, 0.013, 0.35, 0.25),
                 (-0.8, 1.5, 0.011, 0.37, 0.22), (-0.1, 0.72, 0.014, 0.45, 0.23),
                 (1.0, 1.1, 0.021, 0.30, 0.30), (2.0, 0.9, 0.016, 0.45, 0.23),
                 (2.7, 1.3, 0.012, 0.40, 0.25), (2.9, 0.4, 0.011, 0.50, 0.17)]
    for row in range(1, rings + 1):
        u = row / rings
        for column in range(segments):
            theta = column * math.tau / segments
            boundary = 0.008 + 0.070 * math.sin(theta) + 0.011 * math.sin(5 * theta + 0.6) + 0.005 * math.sin(9 * theta - 0.8)
            if finishing:
                fringe = math.atan2(math.sin(theta - 1.05), math.cos(theta - 1.05))
                boundary = 0.008 + 0.065 * math.sin(theta) + 0.008 * math.sin(5 * theta + 0.6) + 0.003 * math.sin(9 * theta - 0.8) - 0.006 * math.exp(-(fringe / 0.28) ** 2)
            end_phi = math.acos(max(-1, min(1, (boundary - 0.035) / 0.15)))
            phi = end_phi * u
            z = 0.035 + 0.15 * math.cos(phi)
            rx, ry = profile_radius(min(z - 0.008, 0.176))
            if finishing and z > 0.08:
                # The linear skull-profile interpolation made a pointed cap.
                # A convex crown gives the short locks a rounded underlying form.
                weight = min(1, (z - 0.08) / 0.04)
                rx = rx * (1 - weight) + 0.120 * math.sin(phi) * weight
                ry = ry * (1 - weight) + 0.102 * math.sin(phi) * weight
            normal = Vector((math.sin(phi) * math.cos(theta), math.sin(phi) * math.sin(theta), math.cos(phi)))
            displacement = 0.003
            for angle, height, amplitude, width, length in locks:
                delta = math.atan2(math.sin(theta - angle), math.cos(theta - angle))
                flow = delta - 0.35 * (phi - height)
                displacement += amplitude * math.exp(-(flow / width) ** 2 - ((phi - height) / length) ** 2)
                if finishing:
                    displacement -= amplitude * 0.15 * math.exp(-((flow - width * 0.85) / (width * 0.35)) ** 2 - ((phi - height) / length) ** 2)
            if finishing:
                displacement = max(0.001, displacement)
            displacement *= (0.2 + 0.8 * math.sin(u * math.pi / 2)) * (1 - 0.75 * max(0, (u - 0.85) / 0.15))
            center = Vector(((rx + 0.001) * math.cos(theta), -0.005 + (ry + 0.001) * math.sin(theta), z))
            vertices.append(center + normal * displacement)
    if finishing:
        vertices[0] = (0, -0.005, 0.185)
    faces = []
    for column in range(segments):
        faces.append((0, 1 + column, 1 + (column + 1) % segments))
    for row in range(rings - 1):
        for column in range(segments):
            a = 1 + row * segments + column
            b = 1 + row * segments + (column + 1) % segments
            faces.append((a, a + segments, b + segments, b))
    mesh = bpy.data.meshes.new("Avatar / connected sculpted crop")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new("Avatar / connected sculpted crop", mesh)
    bpy.context.collection.objects.link(obj)
    base.finish(obj, obj.name, mats["hair"], parent)
    thickness = obj.modifiers.new("Turned hairline edge", "SOLIDIFY")
    thickness.thickness = 0.0025
    smooth = obj.modifiers.new("Broad lock surface continuity", "SUBSURF")
    smooth.levels = 1
    smooth.render_levels = 1
    return obj


def head_and_neck(mats, parent, finishing=False):
    """Shape a compact adult head, short neck and restrained cartoon facial features."""
    base.loft("Avatar / neck", [(1.075, 0.050, 0.046, 0, 0.16), (1.12, 0.053, 0.048, 0, 0.18), (1.18, 0.050, 0.046, 0, 0.205)], mats["skin"], parent)
    head = base.empty("Avatar / rebuilt head", (0, 0.21, 1.255), (-0.035, 0, -0.025), parent)
    base.loft("Avatar / shaped adult head", [
        (-0.13, 0.037, 0.041, 0, 0.018), (-0.10, 0.073, 0.062, 0, 0.018),
        (-0.055, 0.100, 0.083, 0, 0.008), (0, 0.114, 0.096, 0, 0),
        (0.055, 0.113, 0.098, 0, -0.005), (0.11, 0.095, 0.087, 0, -0.005),
        (0.15, 0.060, 0.058, 0, -0.005), (0.17, 0.012, 0.014, 0, -0.005),
    ], mats["skin"], head, subdivision=2)
    for side in (-1, 1):
        base.ellipsoid("Avatar / shaped ear", (side * 0.111, -0.002, -0.026), (0.017, 0.015, 0.029), mats["skin"], head)
        x = side * 0.044
        base.ellipsoid("Avatar / quiet eye", (x, 0.089, 0.018), (0.012, 0.003, 0.006), mats["eye"], head)
        base.curve("Avatar / eyebrow", [(x - 0.018, 0.085, 0.046), (x, 0.092, 0.050), (x + 0.017, 0.086, 0.047)], 0.003, mats["hair"], head)
    base.loft("Avatar / shaped nose", [(-0.034, 0.012, 0.008, 0, 0.094), (-0.025, 0.016, 0.012, 0, 0.104), (0.005, 0.009, 0.009, 0, 0.098), (0.025, 0.004, 0.003, 0, 0.090)], mats["skin"], head)
    base.curve("Avatar / mouth", [(-0.024, 0.082, -0.075), (0, 0.091, -0.078), (0.024, 0.082, -0.075)], 0.0018, mats["skin_fold"], head)
    connected_crop(mats, head, finishing=finishing)


def arm_pose(side, finishing=False):
    """Keep input contact while relaxing the elbows and aligning the mouse palm with its device."""
    wrist = Vector((-0.15, 0.62, 0.864) if side < 0 else (0.33, 0.68, 0.864))
    elbow = Vector((side * 0.255, 0.40, 0.91))
    yaw = 0.13 if side < 0 else -0.12
    if finishing:
        elbow = Vector((-0.27, 0.365, 0.88) if side < 0 else (0.34, 0.345, 0.865))
        if side > 0:
            wrist.x = 0.322
            yaw = 0.35
    return wrist, elbow, yaw


def shaped_sneaker(side, offset, mats, parent):
    """Model a heel, instep and toe with an integral sole band, not a separate foot block."""
    sections = [(0.35, 0.045, 0.012, 0.100), (0.375, 0.054, 0.008, 0.114),
                (0.43, 0.061, 0.007, 0.121), (0.49, 0.065, 0.007, 0.103),
                (0.56, 0.060, 0.007, 0.070), (0.61, 0.047, 0.010, 0.052),
                (0.63, 0.022, 0.015, 0.036)]
    vertices, faces, material_ids = [], [], []
    for y, width, low, high in sections:
        sole = min(low + 0.012, high - 0.009)
        cross = [(0, high), (0.5, high * 0.98), (0.87, low + (high - low) * 0.85),
                 (1, low + (high - low) * 0.58), (1, sole + 0.004), (0.99, sole),
                 (0.94, low), (0.5, low), (0, low), (-0.5, low), (-0.94, low),
                 (-0.99, sole), (-1, sole + 0.004), (-1, low + (high - low) * 0.58),
                 (-0.87, low + (high - low) * 0.85), (-0.5, high * 0.98)]
        vertices.extend((side * 0.17 + x * width, y + offset, z) for x, z in cross)
    segments = 16
    faces.append(tuple(reversed(range(segments))))
    material_ids.append(0)
    for row in range(len(sections) - 1):
        for index in range(segments):
            a, b = row * segments + index, row * segments + (index + 1) % segments
            faces.append((a, b, b + segments, a + segments))
            material_ids.append(1 if 5 <= index <= 10 else 0)
    faces.append(tuple((len(sections) - 1) * segments + index for index in range(segments)))
    material_ids.append(0)
    mesh = bpy.data.meshes.new("Avatar / shaped sneaker")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new("Avatar / shaped sneaker", mesh)
    bpy.context.collection.objects.link(obj)
    base.finish(obj, obj.name, mats["shoe"], parent)
    mesh.materials.append(mats["sole"])
    for face, material_id in zip(mesh.polygons, material_ids):
        face.material_index = material_id
    smooth = obj.modifiers.new("Sneaker edge continuity", "SUBSURF")
    smooth.levels = 1
    smooth.render_levels = 1
    return obj


def build_avatar(mats, finishing=False):
    """Build purposeful garment/anatomical silhouettes in the existing working pose."""
    root = base.empty("Avatar / original posed study", (0, -0.72, 0), (0, 0, -0.35))
    pieces = [base.loft("Avatar / hoodie torso", [
        (0.53, 0.15, 0.115, 0, 0.01), (0.56, 0.17, 0.122, 0, 0.015),
        (0.65, 0.17, 0.120, 0, 0.04), (0.82, 0.19, 0.128, 0, 0.085),
        (0.98, 0.213, 0.128, 0, 0.13), (1.035, 0.205, 0.110, 0, 0.15),
        (1.075, 0.14, 0.077, 0, 0.16), (1.095, 0.065, 0.051, 0, 0.17),
    ], mats["hoodie"], root, subdivision=2)]
    pants = [base.loft("Avatar / seated jogger hips", [(0.46, 0.12, 0.10, 0, 0.035), (0.49, 0.17, 0.13, 0, 0.035), (0.57, 0.17, 0.12, 0, 0.02), (0.61, 0.14, 0.10, 0, 0.02)], mats["joggers"], root)]
    for side in (-1, 1):
        wrist, elbow, yaw = arm_pose(side, finishing)
        shoulder = Vector((side * 0.185, 0.23, 0.985 - (0.008 if finishing else 0)))
        upper_mid = shoulder.lerp(elbow, 0.48) if finishing else Vector((side * 0.23, 0.31, 0.945))
        pieces.append(sweep("Avatar / continuous tailored sleeve", [
            ((side * 0.11, 0.15, 1.015), 0.075, 0.068),
            (shoulder, 0.068, 0.063),
            (upper_mid, 0.061, 0.056),
            (elbow, 0.056, 0.052),
            (elbow.lerp(wrist, 0.32), 0.055, 0.048),
            (elbow.lerp(wrist, 0.72), 0.045, 0.039),
            (wrist, 0.037, 0.032),
        ], mats["hoodie"], root))
        sweep("Avatar / cotton cuff", [(elbow.lerp(wrist, 0.87), 0.041, 0.036), (wrist, 0.037, 0.032)], mats["rib"], root)
        hand("Avatar / keyboard hand" if side < 0 else "Avatar / mouse hand", wrist, yaw, side > 0, mats, root)
        offset = 0.02 if side > 0 else 0
        pants.append(sweep("Avatar / continuous bent jogger leg", [
            ((side * 0.095, 0.04, 0.545), 0.091, 0.085),
            ((side * 0.13, 0.22 + offset, 0.52), 0.090, 0.078),
            ((side * 0.16, 0.42 + offset, 0.45), 0.080, 0.070),
            ((side * 0.165, 0.45 + offset, 0.38), 0.068, 0.062),
            ((side * 0.17, 0.43 + offset, 0.25), 0.059, 0.054),
            ((side * 0.17, 0.42 + offset, 0.135), 0.045, 0.042),
        ], mats["joggers"], root))
        sweep("Avatar / ankle cuff", [
            ((side * 0.17, 0.42 + offset, 0.175), 0.046, 0.044),
            ((side * 0.17, 0.42 + offset, 0.158), 0.046, 0.044),
            ((side * 0.17, 0.42 + offset, 0.120), 0.045, 0.041),
            ((side * 0.17, 0.42 + offset, 0.095), 0.043, 0.040),
        ], mats["rib"], root)
        if finishing:
            shaped_sneaker(side, offset, mats, root)
        else:
            sweep("Avatar / shaped sneaker", [
                ((side * 0.17, 0.35 + offset, 0.060), 0.042, 0.038),
                ((side * 0.17, 0.39 + offset, 0.065), 0.055, 0.047),
                ((side * 0.17, 0.47 + offset, 0.058), 0.068, 0.050),
                ((side * 0.17, 0.56 + offset, 0.040), 0.061, 0.031),
                ((side * 0.17, 0.62 + offset, 0.032), 0.030, 0.022),
            ], mats["shoe"], root)
    base.blend_surfaces("Avatar / coherent hoodie", pieces, mats["hoodie"], root, voxel_size=0.005)
    base.blend_surfaces("Avatar / coherent seated joggers", pants, mats["joggers"], root, voxel_size=0.005)
    base.loft("Avatar / draped fabric hood", [
        (0.90, 0.020, 0.010, 0, 0.005), (0.94, 0.065, 0.027, 0, -0.005),
        (1.00, 0.103, 0.039, 0, 0.028), (1.065, 0.105, 0.045, 0, 0.080),
        (1.10, 0.075, 0.039, 0, 0.14), (1.11, 0.056, 0.030, 0, 0.165),
    ], mats["hoodie"], root, subdivision=2)
    base.curve("Avatar / hood opening", [(0.064 * math.cos(index * math.tau / 32), 0.17 + 0.062 * math.sin(index * math.tau / 32), 1.095) for index in range(32)], 0.004, mats["rib"], root, cyclic=True)
    head_and_neck(mats, root, finishing=finishing)
    return root


def main():
    """Produce transparent local review artifacts while preserving source/runtime files."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--width", type=int, default=1200)
    parser.add_argument("--samples", type=int, default=24)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    if not 640 <= args.width <= 1600 or not 8 <= args.samples <= 64:
        parser.error("Use width 640..1600 and samples 8..64 for this bounded review.")
    output = args.output.resolve()
    if output.exists():
        raise RuntimeError("Choose a new review directory; do not overwrite earlier artifacts.")
    bpy.ops.wm.open_mainfile(filepath=str(args.source.resolve()), use_scripts=False)
    old = bpy.data.objects["Avatar / original posed study"]
    for obj in list(old.children_recursive) + [old]:
        bpy.data.objects.remove(obj, do_unlink=True)
    ground = bpy.data.objects.get("Studio / invisible ground for contact shadows")
    if ground:
        bpy.data.objects.remove(ground, do_unlink=True)
    avatar = build_avatar(make_materials())
    scene = bpy.context.scene
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.resolution_x = args.width
    scene.render.resolution_y = round(args.width * 0.75)
    scene.render.resolution_percentage = 100
    scene.render.threads_mode = "FIXED"
    scene.render.threads = 6
    scene.cycles.samples = args.samples
    scene.camera.location = (0.10, -5.0, 0.84)
    scene.camera.rotation_euler = (Vector((0.10, 0, 0.80)) - scene.camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera.data.type = "PERSP"
    scene.camera.data.lens = 60
    output.mkdir(parents=True)
    scene.render.filepath = str(output / "scene-transparent.png")
    bpy.ops.wm.save_as_mainfile(filepath=str(output / "character-review.blend"))
    bpy.ops.render.render(write_still=True)
    # Diagnostic framing is not a change to the requested website composition.
    for obj in bpy.data.objects:
        if obj.type in {"MESH", "CURVE"} and obj not in avatar.children_recursive:
            obj.hide_render = True
    scene.camera.location = (2.1, 2.5, 1.65)
    scene.camera.rotation_euler = (Vector((0, -0.35, 1.06)) - scene.camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera.data.type = "ORTHO"
    scene.camera.data.ortho_scale = 1.16
    scene.render.resolution_y = args.width
    scene.render.filepath = str(output / "character-closeup.png")
    bpy.ops.render.render(write_still=True)
    report = {
        "status": "Local unrigged visual review; not a replacement web asset or accepted design",
        "background": "transparent", "ground": False, "cast_ground_shadows": False,
        "camera": "desk-level rear; closeup is diagnostic only",
        "hair": "one connected sculpted mesh; no repeated sphere clumps",
        "avatar_meshes": sum(obj.type == "MESH" for obj in avatar.children_recursive),
        "external_assets": [], "runtime_changes": False,
    }
    (output / "review-manifest.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print("CHARACTER_REVIEW_COMPLETE " + str(output))


if __name__ == "__main__":
    main()
