"""Author an original desk/avatar still in Blender 4.5, without external assets.

Run with Blender's --background --factory-startup --python-exit-code 1 options.
Generated review files go to an explicitly supplied ignored output directory.
This is a modeled, posed still study; it is not yet a rig or a WebGL-ready asset.
"""

import argparse
import json
import math
import random
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def arguments():
    """Read only script arguments following Blender's -- separator."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--width", type=int, default=1600)
    parser.add_argument("--samples", type=int, default=40)
    parser.add_argument("--threads", type=int, default=8)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])
    args.output = args.output.resolve()
    if not 640 <= args.width <= 2400 or not 8 <= args.samples <= 128:
        parser.error("Use width 640..2400 and samples 8..128 for this still study.")
    if not 1 <= args.threads <= 16:
        parser.error("Use 1..16 CPU threads; do not consume an unbounded host workload.")
    return args


def linear_color(hex_color):
    """Convert an sRGB hex pigment to the linear values expected by shader sockets."""
    channels = [int(hex_color[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in channels) + (1,)


def material(name, color, roughness=0.5, metallic=0, cloth=False, wood=False, emission=0):
    """Make a locally authored material; procedural detail uses no image textures."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    shader = nodes.get("Principled BSDF")
    pigment = linear_color(color)
    shader.inputs["Base Color"].default_value = pigment
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    if emission:
        shader.inputs["Emission Color"].default_value = pigment
        shader.inputs["Emission Strength"].default_value = emission
    if cloth or wood:
        coordinates = nodes.new("ShaderNodeTexCoord")
        mapping = nodes.new("ShaderNodeVectorMath")
        mapping.operation = "MULTIPLY"
        mapping.inputs[1].default_value = (3, 80, 6) if wood else (160, 160, 160)
        noise = nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 3 if wood else 1
        noise.inputs["Detail"].default_value = 2
        bump = nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = 0.12 if wood else 0.08
        bump.inputs["Distance"].default_value = 0.008 if wood else 0.002
        links.new(coordinates.outputs["Generated"], mapping.inputs[0])
        links.new(mapping.outputs["Vector"], noise.inputs["Vector"])
        links.new(noise.outputs["Fac"], bump.inputs["Height"])
        links.new(bump.outputs["Normal"], shader.inputs["Normal"])
        if wood:
            grain = nodes.new("ShaderNodeValToRGB")
            grain.name = "Subtle warm wood grain"
            for stop, brightness in zip(grain.color_ramp.elements, (0.80, 1.10)):
                stop.color = tuple(min(1, channel * brightness) for channel in pigment[:3]) + (1,)
            links.new(noise.outputs["Fac"], grain.inputs["Fac"])
            links.new(grain.outputs["Color"], shader.inputs["Base Color"])
        if cloth:
            shader.inputs["Sheen Weight"].default_value = 0.18
            shader.inputs["Sheen Roughness"].default_value = 0.8
    return mat


def finish(obj, name, mat, parent=None):
    """Assign descriptive ownership, material and smooth shading to a new object."""
    obj.name = name
    if mat is not None:
        obj.data.materials.append(mat)
    if parent is not None:
        obj.parent = parent
    if obj.type == "MESH":
        for face in obj.data.polygons:
            face.use_smooth = True
    return obj


def empty(name, location=(0, 0, 0), rotation=(0, 0, 0), parent=None):
    """Create an explicit assembly root for later animation/export decisions."""
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = rotation
    obj.parent = parent
    return obj


def box(name, location, dimensions, mat, bevel=0.015, rotation=(0, 0, 0), parent=None):
    """Model a physically softened manufactured part with stable applied scale."""
    bpy.ops.mesh.primitive_cube_add(size=1)
    obj = bpy.context.object
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.location = location
    obj.rotation_euler = rotation
    if bevel:
        modifier = obj.modifiers.new("Manufactured edge radius", "BEVEL")
        modifier.width = min(bevel, min(dimensions) * 0.45)
        modifier.segments = 3
        normals = obj.modifiers.new("Face weighted normals", "WEIGHTED_NORMAL")
        normals.keep_sharp = True
    return finish(obj, name, mat, parent)


def ellipsoid(name, location, scale, mat, parent=None):
    """Add a smooth anatomical/detail volume, not a low-poly display primitive."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20)
    obj = bpy.context.object
    obj.location = location
    obj.scale = scale
    return finish(obj, name, mat, parent)


def loft(name, levels, mat, parent=None, segments=32, subdivision=1):
    """Join shaped elliptical cross-sections into one continuous organic mesh.

    Levels contain z, x/y radius and the x/y center. End caps are closed; rings
    change width and position to form the chin, torso and clothing silhouettes.
    """
    vertices = []
    for z, rx, ry, cx, cy in levels:
        vertices.extend((cx + rx * math.cos(i * math.tau / segments), cy + ry * math.sin(i * math.tau / segments), z) for i in range(segments))
    faces = [tuple(reversed(range(segments)))]
    for level in range(len(levels) - 1):
        for index in range(segments):
            a = level * segments + index
            b = level * segments + (index + 1) % segments
            faces.append((a, b, b + segments, a + segments))
    faces.append(tuple((len(levels) - 1) * segments + i for i in range(segments)))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    if subdivision:
        modifier = obj.modifiers.new("Sculpted surface continuity", "SUBSURF")
        modifier.levels = subdivision
        modifier.render_levels = subdivision
    return finish(obj, name, mat, parent)


def limb(name, start, end, start_radius, end_radius, mat, parent=None):
    """Loft a tapered, rounded limb along a bone direction, with closed joints."""
    start = Vector(start)
    vector = Vector(end) - start
    length = vector.length
    obj = loft(name, [
        (0, start_radius * 0.45, start_radius * 0.45, 0, 0),
        (length * 0.08, start_radius, start_radius * 0.9, 0, 0),
        (length * 0.4, start_radius * 0.96, start_radius * 0.87, 0, 0),
        (length * 0.82, end_radius, end_radius * 0.9, 0, 0),
        (length, end_radius * 0.55, end_radius * 0.55, 0, 0),
    ], mat, parent, segments=24, subdivision=1)
    obj.location = start
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = vector.to_track_quat("Z", "Y")
    return obj


def curve(name, points, radius, mat, parent=None, cyclic=False):
    """Author a rounded Bezier path for cables, seams, hair and plant stems."""
    data = bpy.data.curves.new(name, "CURVE")
    data.dimensions = "3D"
    data.resolution_u = 12
    data.bevel_depth = radius
    data.bevel_resolution = 3
    spline = data.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for point, position in zip(spline.bezier_points, points):
        point.co = position
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    spline.use_cyclic_u = cyclic
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    return finish(obj, name, mat, parent)


def blend_surfaces(name, parts, mat, parent, voxel_size=0.005):
    """Fuse overlapping posed volumes into one smooth, parent-local sculpt surface.

    This still-only remesh removes the disconnected toy-joint appearance; it is
    deliberately not a substitute for animation-ready retopology or a skin rig.
    """
    bpy.context.view_layer.update()
    graph = bpy.context.evaluated_depsgraph_get()
    vertices, faces = [], []
    for part in parts:
        evaluated = part.evaluated_get(graph)
        mesh = evaluated.to_mesh()
        transform = parent.matrix_world.inverted() @ part.matrix_world
        offset = len(vertices)
        vertices.extend(transform @ vertex.co for vertex in mesh.vertices)
        faces.extend(tuple(offset + index for index in face.vertices) for face in mesh.polygons)
        evaluated.to_mesh_clear()
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    finish(obj, name, mat, parent)
    remesh = obj.modifiers.new("Continuous sculpt volume", "REMESH")
    remesh.mode = "VOXEL"
    remesh.voxel_size = voxel_size
    remesh.use_smooth_shade = True
    smooth = obj.modifiers.new("Relax sculpt transitions", "SMOOTH")
    smooth.factor = 1.0
    smooth.iterations = 5
    for part in parts:
        bpy.data.objects.remove(part, do_unlink=True)
    return obj


def lathe(name, location, profile, mat, parent=None):
    """Revolve a radial profile into a flask, pot or softly turned wooden handle."""
    obj = loft(name, [(z, radius, radius, 0, 0) for z, radius in profile], mat, parent, segments=48, subdivision=1)
    obj.location = location
    return obj


def cylinder_between(name, start, end, radius, mat, parent=None):
    """Place a manufactured cylindrical part precisely between two endpoints."""
    start, end = Vector(start), Vector(end)
    vector = end - start
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=radius, depth=vector.length)
    obj = bpy.context.object
    obj.location = (start + end) / 2
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = vector.to_track_quat("Z", "Y")
    bevel = obj.modifiers.new("Soft rim", "BEVEL")
    bevel.width = min(radius * 0.2, 0.004)
    bevel.segments = 3
    return finish(obj, name, mat, parent)


def create_face(root, mats):
    """Build a stylized adult head with eyelids, nose, ears, hair and short stubble.

    Proportions are an original loose avatar, not a claim of an exact likeness.
    No personal photograph, texture or external model is loaded by this generator.
    """
    head = empty("Avatar / head pose", (0, 0.22, 1.365), (-0.08, 0, -0.05), root)
    loft("Face / shaped jaw and cranium", [
        (-0.185, 0.036, 0.045, 0, 0.018), (-0.15, 0.078, 0.072, 0, 0.016),
        (-0.1, 0.112, 0.093, 0, 0.006), (-0.03, 0.132, 0.105, 0, 0),
        (0.045, 0.13, 0.11, 0, -0.005), (0.11, 0.115, 0.1, 0, -0.009),
        (0.165, 0.08, 0.075, 0, -0.013), (0.19, 0.025, 0.027, 0, -0.014),
    ], mats["skin"], head, subdivision=2)
    for side in (-1, 1):
        ellipsoid("Ear / outer", (side * 0.132, -0.006, -0.027), (0.025, 0.022, 0.047), mats["skin"], head)
        ellipsoid("Ear / fold", (side * 0.149, 0.005, -0.026), (0.007, 0.012, 0.027), mats["skin_shadow"], head)
        x = side * 0.055
        ellipsoid("Eye / sclera", (x, 0.104, 0.021), (0.029, 0.012, 0.012), mats["eye"], head)
        ellipsoid("Eye / iris", (x + 0.003, 0.115, 0.02), (0.009, 0.003, 0.009), mats["iris"], head)
        ellipsoid("Eye / catchlight", (x + 0.006, 0.118, 0.025), (0.002, 0.001, 0.002), mats["eye"], head)
        curve("Eye / upper lid", [(x - 0.028, 0.107, 0.02), (x, 0.116, 0.033), (x + 0.028, 0.107, 0.02)], 0.0045, mats["skin_shadow"], head)
        curve("Eyebrow", [(x - 0.032, 0.098, 0.062), (x, 0.11, 0.069), (x + 0.028, 0.098, 0.061)], 0.007, mats["hair"], head)
    ellipsoid("Nose / bridge", (0, 0.112, -0.013), (0.019, 0.028, 0.047), mats["skin"], head)
    ellipsoid("Nose / tip", (0, 0.139, -0.037), (0.027, 0.025, 0.02), mats["skin"], head)
    curve("Mouth / relaxed", [(-0.037, 0.104, -0.09), (0, 0.119, -0.093), (0.037, 0.104, -0.09)], 0.0035, mats["lip"], head)
    curve("Short moustache", [(-0.034, 0.11, -0.075), (-0.014, 0.125, -0.073), (0, 0.126, -0.078), (0.015, 0.125, -0.073), (0.034, 0.11, -0.075)], 0.004, mats["hair"], head)
    rng = random.Random(19)
    for index in range(100):
        z = rng.uniform(-0.16, -0.075)
        x = rng.uniform(-0.092, 0.092)
        if z > -0.11 and abs(x) < 0.045:
            continue
        y = 0.09 * math.sqrt(max(0.1, 1 - (x / 0.12) ** 2)) + 0.014
        curve(f"Stubble / {index:03}", [(x, y, z), (x + 0.001, y + 0.002, z + 0.005)], 0.0009, mats["hair"], head)
    # A continuous scalp shell follows a shorter front hairline and lower back cut.
    vertices, faces = [], []
    segments, rings = 48, 9
    for ring in range(rings):
        for index in range(segments):
            theta = index * math.tau / segments
            boundary = 1.37 + 0.96 * (1 - math.sin(theta)) / 2
            phi = 0.035 + (boundary - 0.035) * ring / (rings - 1)
            z = 0.04 + 0.161 * math.cos(phi)
            taper = math.sqrt(max(0.01, 1 - (max(0, z - 0.04) / 0.165) ** 2))
            vertices.append((0.134 * taper * math.cos(theta), -0.007 + 0.114 * taper * math.sin(theta), z))
    faces.append(tuple(range(segments)))  # Close the crown; no exposed scalp hole.
    for ring in range(rings - 1):
        for index in range(segments):
            a = ring * segments + index
            b = ring * segments + (index + 1) % segments
            faces.append((a, b, b + segments, a + segments))
    mesh = bpy.data.meshes.new("Hair / continuous scalp")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    cap = bpy.data.objects.new("Hair / continuous scalp", mesh)
    bpy.context.collection.objects.link(cap)
    finish(cap, cap.name, mats["hair"], head)
    for index in range(11):
        x = -0.065 + index * 0.012
        crown = 0.04 + 0.161 * math.sqrt(max(0, 1 - (x / 0.134) ** 2))
        curve(f"Hair / short crop texture {index:02}", [(x, -0.029, crown - 0.005), (x + 0.006, 0.002, crown + 0.001), (x + 0.01, 0.032, crown - 0.009)], 0.002, mats["hair"], head)


def create_hand(name, position, mats, parent, mouse=False):
    """Pose a palm, four articulated fingers and a thumb on a keyboard or mouse."""
    root = empty(name, position, rotation=(0, 0, -0.10 if mouse else 0.12), parent=parent)
    root.scale = (0.85, 0.85, 0.85)
    ellipsoid(name + " / palm", (0, 0, 0), (0.051, 0.065, 0.025), mats["skin"], root)
    for index, (x, length) in enumerate([(-0.032, 0.064), (-0.011, 0.082), (0.011, 0.077), (0.032, 0.058)]):
        curve(name + f" / finger {index}", [(x, 0.035, 0.003), (x, 0.063, 0.01), (x, 0.035 + length, -0.009 if mouse else -0.013)], 0.009, mats["skin"], root)
        ellipsoid(name + f" / nail {index}", (x, 0.028 + length, -0.001), (0.006, 0.01, 0.002), mats["nail"], root)
    curve(name + " / thumb", [(0.043, -0.023, -0.002), (0.064, 0.003, -0.004), (0.069, 0.035, -0.012)], 0.012, mats["skin"], root)
    return root


def create_avatar(mats):
    """Author one adult seated pose with continuous clothing and anatomical forms."""
    root = empty("Avatar / original posed study", (0, -0.72, 0), (0, 0, -0.35))
    shirt_parts = [loft("Shirt / continuous torso", [
        (0.56, 0.14, 0.12, 0, 0), (0.59, 0.18, 0.135, 0, 0.01),
        (0.76, 0.19, 0.145, 0, 0.06), (0.98, 0.235, 0.15, 0, 0.13),
        (1.08, 0.24, 0.14, 0, 0.17), (1.14, 0.18, 0.1, 0, 0.19),
        (1.17, 0.078, 0.065, 0, 0.2),
    ], mats["shirt"], root, subdivision=2)]
    limb("Neck", (0, 0.2, 1.13), (0, 0.22, 1.25), 0.067, 0.062, mats["skin"], root)
    curve("Shirt / collar", [(0.075 * math.cos(i * math.tau / 24), 0.2 + 0.064 * math.sin(i * math.tau / 24), 1.165) for i in range(24)], 0.008, mats["shirt_rib"], root, cyclic=True)
    ellipsoid("Trousers / seated hips", (0, 0.01, 0.56), (0.19, 0.16, 0.12), mats["trousers"], root)
    for side in (-1, 1):
        shoulder = (side * 0.21, 0.17, 1.075)
        elbow = (side * 0.33, 0.43, 0.92)
        wrist = (-0.18, 0.62, 0.865) if side < 0 else (0.33, 0.68, 0.865)
        shirt_parts.append(limb("Hoodie / upper sleeve", shoulder, elbow, 0.113, 0.079, mats["shirt"], root))
        shirt_parts.append(ellipsoid("Hoodie / elbow fold", elbow, (0.076, 0.076, 0.07), mats["shirt"], root))
        shirt_parts.append(limb("Hoodie / forearm sleeve", elbow, wrist, 0.08, 0.047, mats["shirt"], root))
        cuff_start = Vector(wrist).lerp(Vector(elbow), 0.16)
        limb("Hoodie / ribbed cuff", cuff_start, Vector(wrist) + Vector((0, 0.014, 0)), 0.048, 0.043, mats["shirt_rib"], root)
        create_hand("Hand / keyboard" if side < 0 else "Hand / mouse", wrist, mats, root, mouse=side > 0)
        hip = (side * 0.12, 0.015, 0.57)
        knee = (side * 0.18, 0.48, 0.46)
        ankle = (side * 0.19, 0.45, 0.13)
        limb("Trousers / thigh", hip, knee, 0.109, 0.092, mats["trousers"], root)
        limb("Trousers / lower leg", knee, ankle, 0.091, 0.049, mats["trousers"], root)
        cylinder_between("Joggers / ankle cuff", (side * 0.19, 0.45, 0.135), (side * 0.19, 0.45, 0.18), 0.049, mats["shirt_rib"], root)
        cylinder_between("Sock", (side * 0.19, 0.45, 0.09), (side * 0.19, 0.45, 0.17), 0.048, mats["shirt_rib"], root)
        ellipsoid("Shoe / upper", (side * 0.19, 0.51, 0.063), (0.079, 0.135, 0.063), mats["shoe"], root)
        for row in range(3):
            curve("Shoe / lace", [(side * 0.19 - 0.03, 0.49 + row * 0.03, 0.117), (side * 0.19 + 0.03, 0.49 + row * 0.03, 0.117)], 0.002, mats["shoe_sole"], root)
    blend_surfaces("Shirt / blended shoulders and sleeves", shirt_parts, mats["shirt"], root)
    loft("Hoodie / draped hood", [(0.96, 0.025, 0.025, 0, -0.01), (1.01, 0.10, 0.055, 0, 0), (1.10, 0.13, 0.075, 0, 0.04), (1.16, 0.105, 0.065, 0, 0.10), (1.175, 0.08, 0.05, 0, 0.14)], mats["shirt"], root, subdivision=2)
    curve("Hoodie / hood rim", [(-0.09, 0.16, 1.17), (-0.12, 0.07, 1.135), (0, -0.026, 1.05), (0.12, 0.07, 1.135), (0.09, 0.16, 1.17)], 0.008, mats["shirt_rib"], root)
    curve("Hoodie / ribbed hem", [(0.17 * math.cos(i * math.tau / 32), 0.01 + 0.124 * math.sin(i * math.tau / 32), 0.605) for i in range(32)], 0.008, mats["shirt_rib"], root, cyclic=True)
    for side in (-1, 1):
        curve("Hoodie / lower back fabric fold", [(side * 0.14, -0.073, 0.66), (side * 0.095, -0.095, 0.69), (side * 0.045, -0.09, 0.72)], 0.003, mats["shirt"], root)
        curve("Joggers / outer seam", [(side * 0.211, 0.08, 0.58), (side * 0.26, 0.39, 0.48), (side * 0.244, 0.45, 0.30), (side * 0.231, 0.45, 0.18)], 0.0018, mats["shirt_rib"], root)
    for side in (-1, 1):
        curve("Hoodie / drawstring", [(side * 0.065, 0.24, 1.14), (side * 0.06, 0.285, 1.045), (side * 0.075, 0.28, 1.01)], 0.003, mats["shirt_rib"], root)
    for side in (-1, 1):
        curve("Shirt / subtle rear shoulder seam", [(side * 0.077, 0.16, 1.15), (side * 0.16, 0.075, 1.115), (side * 0.225, 0.075, 1.06)], 0.0018, mats["shirt_rib"], root)
    create_face(root, mats)
    return root


def create_chair(mats):
    """Build one upholstered working chair with supports, casters and arm rests."""
    root = empty("Chair", (0, -0.72, 0), (0, 0, -0.35))
    box("Chair / upholstered seat", (0, 0.03, 0.47), (0.48, 0.46, 0.085), mats["chair"], 0.04, parent=root)
    loft("Chair / contoured ergonomic back", [(0.55, 0.15, 0.034, 0, -0.20), (0.62, 0.22, 0.045, 0, -0.19), (0.75, 0.18, 0.052, 0, -0.18), (0.91, 0.23, 0.043, 0, -0.235), (1.04, 0.20, 0.037, 0, -0.26), (1.075, 0.17, 0.025, 0, -0.26)], mats["chair"], root, subdivision=2)
    curve("Chair / rear support spine", [(0, -0.15, 0.46), (0, -0.27, 0.65), (0, -0.29, 0.9), (0, -0.28, 1.13)], 0.022, mats["rubber"], root)
    box("Chair / adjustable headrest", (0, -0.265, 1.155), (0.27, 0.075, 0.115), mats["chair"], 0.035, (0.1, 0, 0), root)
    for side in (-1, 1):
        curve("Chair / tailored back edge", [(side * 0.125, -0.225, 0.58), (side * 0.176, -0.222, 0.65), (side * 0.15, -0.228, 0.76), (side * 0.193, -0.267, 0.92), (side * 0.165, -0.285, 1.027)], 0.0025, mats["rubber"], root)
        cylinder_between("Chair / lumbar frame", (side * 0.15, -0.24, 0.68), (0, -0.30, 0.75), 0.012, mats["rubber"], root)
    cylinder_between("Chair / adjustment dial", (0.24, -0.035, 0.43), (0.27, -0.035, 0.43), 0.025, mats["rubber"], root)
    cylinder_between("Chair / gas lift", (0, 0.03, 0.11), (0, 0.03, 0.44), 0.035, mats["metal"], root)
    for index in range(5):
        angle = index * math.tau / 5
        endpoint = (0.3 * math.cos(angle), 0.03 + 0.3 * math.sin(angle), 0.075)
        cylinder_between("Chair / base spoke", (0, 0.03, 0.12), endpoint, 0.018, mats["metal"], root)
        ellipsoid("Chair / caster", endpoint, (0.035, 0.04, 0.04), mats["rubber"], root)
    for side in (-1, 1):
        cylinder_between("Chair / arm support", (side * 0.26, 0.01, 0.49), (side * 0.29, 0.04, 0.77), 0.017, mats["metal"], root)
        box("Chair / arm pad", (side * 0.29, 0.06, 0.785), (0.07, 0.27, 0.04), mats["rubber"], 0.017, parent=root)
    return root


def create_desk(mats):
    """Author a wood-topped desk, complete computer, input devices and cable routing."""
    root = empty("Desk / computer setup")
    box("Desk / oak top", (0, 0.2, 0.8), (2.2, 0.9, 0.055), mats["wood"], 0.025, parent=root)
    for side in (-1, 1):
        for y in (-0.15, 0.54):
            box("Desk / frame leg", (side * 0.94, y, 0.397), (0.045, 0.045, 0.75), mats["metal"], 0.008, parent=root)
        box("Desk / lower frame", (side * 0.94, 0.195, 0.045), (0.05, 0.79, 0.045), mats["metal"], 0.009, parent=root)
    box("Desk / rear brace", (0, 0.53, 0.69), (1.9, 0.035, 0.045), mats["metal"], 0.007, parent=root)
    for x in (-0.94, 0.94):
        for y in (-0.15, 0.54):
            box("Desk / flush floor glide", (x, y, 0.019), (0.051, 0.051, 0.012), mats["rubber"], 0.004, parent=root)
    box("Monitor / foot", (0.26, 0.45, 0.844), (0.3, 0.24, 0.025), mats["monitor"], 0.012, parent=root)
    box("Monitor / neck", (0.26, 0.51, 0.96), (0.05, 0.04, 0.23), mats["metal"], 0.01, parent=root)
    screen = empty("Monitor / tilted display", (0.26, 0.48, 1.22), (-0.08, 0, 0.18), root)
    box("Monitor / shell", (0, 0, 0), (1.05, 0.049, 0.51), mats["monitor"], 0.018, parent=screen)
    box("Monitor / original schematic screen", (0, -0.026, 0.005), (0.995, 0.004, 0.451), mats["screen"], 0.002, parent=screen)
    box("Monitor / editor sidebar", (-0.435, -0.029, 0.005), (0.09, 0.002, 0.438), mats["screen_panel"], 0.001, parent=screen)
    box("Monitor / editor tab strip", (0.048, -0.030, 0.21), (0.89, 0.002, 0.019), mats["screen_panel"], 0.001, parent=screen)
    box("Monitor / status strip", (0, -0.030, -0.211), (0.99, 0.002, 0.012), mats["screen_panel"], 0.001, parent=screen)
    for index in range(3):
        box("Monitor / editor tab", (-0.31 + index * 0.16, -0.032, 0.21), (0.11, 0.001, 0.004), mats["screen_sage"] if index == 0 else mats["screen_blue"], 0, parent=screen)
    rng = random.Random(8)
    for row in range(13):
        z = 0.18 - row * 0.027
        box("Monitor / line number mark", (-0.375, -0.031, z), (0.008, 0.001, 0.004), mats["screen_blue"], 0, parent=screen)
        offset = 0.025 * (row % 3)
        for column in range(rng.randint(2, 4)):
            width = rng.uniform(0.035, 0.11)
            x = -0.34 + offset + column * 0.135
            box("Monitor / schematic editor mark", (x, -0.030, z), (width, 0.001, 0.006), mats[["screen_sage", "screen_blue", "screen_amber"][(column + row) % 3]], 0, parent=screen)
    ellipsoid("Monitor / status light", (0.46, -0.028, -0.237), (0.004, 0.001, 0.004), mats["screen_sage"], screen)
    keyboard = empty("Keyboard / typing position", (0.1, -0.08, 0.845), (0, 0, -0.35), root)
    box("Keyboard / case", (0, 0, 0), (0.47, 0.18, 0.025), mats["keyboard"], 0.012, parent=keyboard)
    for row in range(5):
        for column in range(14):
            if row == 0 and 4 <= column <= 8:
                continue
            box("Keyboard / keycap", (-0.208 + column * 0.032, -0.065 + row * 0.031, 0.018), (0.026, 0.025, 0.011), mats["key_accent"] if column in (0, 13) else mats["key"], 0.003, parent=keyboard)
            if row > 0 and 0 < column < 13:
                box("Keyboard / subtle key legend", (-0.212 + column * 0.032, -0.061 + row * 0.031, 0.0236), (0.005, 0.003, 0.0003), mats["mouse_pad"], 0, parent=keyboard)
    box("Keyboard / spacebar", (-0.015, -0.065, 0.018), (0.155, 0.025, 0.011), mats["key"], 0.004, parent=keyboard)
    box("Mouse / pad", (0.535, -0.155, 0.831), (0.24, 0.2, 0.004), mats["mouse_pad"], 0.02, parent=root)
    ellipsoid("Mouse / shell", (0.535, -0.155, 0.854), (0.035, 0.055, 0.022), mats["keyboard"], root)
    curve("Cable / display to rear edge", [(0.3, 0.51, 1.02), (0.3, 0.59, 0.94), (0.35, 0.62, 0.8), (0.73, 0.59, 0.69)], 0.004, mats["rubber"], root)
    box("Computer / compact enclosure", (0.72, 0.49, 0.865), (0.23, 0.17, 0.065), mats["keyboard"], 0.014, parent=root)
    for port in range(3):
        box("Computer / recessed port", (0.67 + port * 0.04, 0.403, 0.866), (0.025, 0.003, 0.008), mats["rubber"], 0.002, parent=root)
    return root


def leaf(name, base, direction, width, mat, parent):
    """Shape a pointed, bent leaf with a raised midrib and tapering silhouette."""
    base, direction = Vector(base), Vector(direction)
    sideways = direction.cross(Vector((0, 0, 1))).normalized()
    if sideways.length < 0.1:
        sideways = Vector((1, 0, 0))
    vertices, faces = [], []
    for step in range(9):
        t = step / 8
        center = base + direction * t + Vector((0, 0, 0.07 * math.sin(t * math.pi)))
        spread = width * math.sin(t * math.pi) ** 0.8
        vertices.extend([center - sideways * spread, center + Vector((0, 0, 0.008 * math.sin(t * math.pi))), center + sideways * spread])
    for step in range(8):
        a = step * 3
        faces.extend([(a, a + 3, a + 4, a + 1), (a + 1, a + 4, a + 5, a + 2)])
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    finish(obj, name, mat, parent)
    solidify = obj.modifiers.new("Leaf thickness", "SOLIDIFY")
    solidify.thickness = 0.001
    smooth = obj.modifiers.new("Leaf curvature", "SUBSURF")
    smooth.levels = 1


def create_personal_props(mats):
    """Include exactly the approved personal props: plant, green flask and parallettes."""
    root = empty("Personal props")
    plant = empty("Plant / desk pot", (-0.89, 0.43, 0.83), parent=root)
    lathe("Plant / ceramic pot", (0, 0, 0), [(0, 0.075), (0.015, 0.09), (0.15, 0.12), (0.17, 0.12), (0.175, 0.109)], mats["pot"], plant)
    lathe("Plant / soil", (0, 0, 0.164), [(0, 0.1), (0.005, 0.1)], mats["soil"], plant)
    rng = random.Random(21)
    for index in range(16):
        angle = index * 2.4
        height = rng.uniform(0.22, 0.43)
        x, y = math.cos(angle) * 0.15, math.sin(angle) * 0.15
        endpoint = (x * 0.5, y * 0.5, 0.17 + height * 0.55)
        curve("Plant / stem", [(0, 0, 0.17), (x * 0.2, y * 0.2, 0.17 + height * 0.4), endpoint], 0.0025, mats["leaf_dark"], plant)
        leaf("Plant / curved leaf", endpoint, (x, y, height * 0.35), 0.043, mats["leaf"] if index % 3 else mats["leaf_dark"], plant)
    flask = empty("Flask / green water flask", (0.83, -0.12, 0.829), parent=root)
    lathe("Flask / powder coated body", (0, 0, 0), [(0, 0.043), (0.008, 0.052), (0.19, 0.052), (0.213, 0.045), (0.218, 0.035)], mats["flask"], flask)
    lathe("Flask / lid", (0, 0, 0.216), [(0, 0.037), (0.025, 0.037), (0.029, 0.033)], mats["rubber"], flask)
    curve("Flask / carry loop", [(-0.025, 0, 0.235), (-0.024, 0, 0.28), (0.024, 0, 0.28), (0.025, 0, 0.235)], 0.005, mats["rubber"], flask)
    for side, x in enumerate((-0.82, -0.48)):
        assembly = empty(f"Parallettes / bar {side + 1}", (x, 0.025, 0.824), (0, 0, 0), root)
        for y in (-0.21, 0.21):
            box("Parallettes / rubber foot", (0, y, 0.022), (0.22, 0.065, 0.037), mats["rubber"], 0.012, parent=assembly)
            cylinder_between("Parallettes / support", (0, y, 0.03), (0, y, 0.17), 0.022, mats["metal"], assembly)
        cylinder_between("Parallettes / wooden grip", (0, -0.24, 0.18), (0, 0.24, 0.18), 0.028, mats["wood"], assembly)
    return root


def area_light(name, location, power, size, color, target):
    """Place a soft studio source aimed at the subject, with no enclosing room."""
    data = bpy.data.lights.new(name, "AREA")
    data.energy = power
    data.shape = "DISK"
    data.size = size
    data.color = color
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def validate_scene():
    """Fail before rendering if approved props or modeled assemblies are missing."""
    required = ["Avatar / original posed study", "Desk / computer setup", "Chair", "Plant / desk pot", "Flask / green water flask", "Parallettes / bar 1", "Parallettes / bar 2"]
    for name in required:
        if bpy.data.objects.get(name) is None:
            raise RuntimeError(f"Missing approved assembly: {name}")
    for obj in bpy.data.objects:
        if not all(math.isfinite(value) for value in (*obj.location, *obj.scale)):
            raise RuntimeError(f"Nonfinite object transform: {obj.name}")
    if bpy.data.images and any(image.source == "FILE" and image.filepath for image in bpy.data.images):
        raise RuntimeError("The original still must not depend on external image files.")


def main():
    """Build, validate, save and render the original still without editing the website."""
    args = arguments()
    args.output.mkdir(parents=True, exist_ok=True)
    target = args.output / "intro-scene.blend"
    if target.exists():
        raise RuntimeError("Output already exists; choose a new review directory rather than overwriting it.")
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    palette = {
        "skin": ("D6AC8A", 0.53, 0), "skin_shadow": ("B98166", 0.6, 0),
        "nail": ("DFBCA7", 0.4, 0), "lip": ("955E4B", 0.7, 0),
        "eye": ("ECEBE1", 0.3, 0), "iris": ("384A3B", 0.32, 0),
        "hair": ("262722", 0.7, 0), "hair_highlight": ("383A30", 0.64, 0),
        "shirt": ("181A1D", 0.8, 0), "shirt_rib": ("242629", 0.8, 0),
        "trousers": ("1C1D20", 0.86, 0), "shoe": ("D9DCD2", 0.7, 0),
        "shoe_sole": ("B2B8AA", 0.8, 0), "chair": ("202326", 0.85, 0),
        "metal": ("38413E", 0.4, 0.5), "rubber": ("252E2A", 0.7, 0),
        "wood": ("B68C58", 0.43, 0), "monitor": ("333D39", 0.45, 0.2),
        "keyboard": ("C8CCC3", 0.55, 0.12), "key": ("E7E7DE", 0.6, 0),
        "key_accent": ("8EA795", 0.6, 0), "mouse_pad": ("69796F", 0.95, 0),
        "screen": ("152C30", 0.5, 0), "screen_panel": ("253E40", 0.5, 0),
        "screen_sage": ("A9C5AA", 0.5, 0), "screen_blue": ("87B1C2", 0.5, 0),
        "screen_amber": ("D8AD78", 0.5, 0), "pot": ("D7D3C1", 0.4, 0),
        "soil": ("4A3D2F", 0.95, 0), "leaf": ("618957", 0.55, 0),
        "leaf_dark": ("355D3E", 0.6, 0), "flask": ("497657", 0.48, 0.25),
        "ground": ("F1F0E8", 0.9, 0),
    }
    mats = {name: material(name, color, roughness, metallic, cloth=name in {"shirt", "trousers", "chair"}, wood=name == "wood", emission=0.35 if name.startswith("screen") else 0) for name, (color, roughness, metallic) in palette.items()}
    create_desk(mats)
    create_chair(mats)
    create_avatar(mats)
    create_personal_props(mats)
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -0.004))
    finish(bpy.context.object, "Studio / invisible ground for contact shadows", mats["ground"])
    area_light("Studio / soft daylight", (-3, -4, 6), 760, 3.5, (1, 0.93, 0.82), (0, 0, 0.8))
    area_light("Studio / broad fill", (4, -1, 4), 240, 3.5, (0.86, 0.94, 1), (0, 0, 0.8))
    area_light("Studio / rear separation", (0, 4, 5), 480, 3, (1, 0.97, 0.89), (0, 0, 0.9))
    scene = bpy.context.scene
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = linear_color("E6EBE2")
    scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.25
    camera_data = bpy.data.cameras.new("Review camera")
    camera = bpy.data.objects.new("Review camera", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = (3.0, -6.2, 4.2)
    camera.rotation_euler = (Vector((0.25, -0.03, 0.7)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = 4.4
    camera_data.lens = 55
    scene.camera = camera
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = args.samples
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 6
    scene.render.threads_mode = "FIXED"
    scene.render.threads = args.threads
    scene.render.resolution_x = args.width
    scene.render.resolution_y = round(args.width * 0.75)
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.render.filepath = str(args.output / "intro-scene.png")
    validate_scene()
    manifest = {
        "status": "Original posed still study; not rigged, animated or optimized for the web",
        "blender": bpy.app.version_string,
        "external_assets": [],
        "objects": len(bpy.data.objects),
        "mesh_objects": sum(obj.type == "MESH" for obj in bpy.data.objects),
        "materials": len(bpy.data.materials),
        "approved_props": ["desk", "character", "chair", "computer", "plant", "green water flask", "pair of parallettes"],
        "render": {"width": args.width, "height": scene.render.resolution_y, "samples": args.samples, "device": "CPU", "threads": args.threads},
    }
    (args.output / "scene-manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    bpy.ops.wm.save_as_mainfile(filepath=str(target))
    bpy.ops.render.render(write_still=True)
    print("INTRO_SCENE_COMPLETE " + str(args.output / "intro-scene.png"))


if __name__ == "__main__":
    main()
