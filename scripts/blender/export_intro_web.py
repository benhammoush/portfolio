"""Derive static web assets from the approved review-06 without changing its source.

Run in a disposable Blender background process with --disable-autoexec. The posed
model is merged by material and decimated; original modeling topology stays in the
review file. Procedural bump/grain is not a glTF texture bake: browser acceptance is
still required. Animation is opt-in; no external textures or lights are exported.
"""

import argparse
import hashlib
import json
import shutil
import sys
from pathlib import Path

import bpy


def main():
    """Export a material-batched GLB and transparent self-shadowed PNG."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--poster", type=Path, help="Reuse an already rendered poster from this same approved source/framing.")
    parser.add_argument("--review", default="review-06", help="Owner-approved source review identifier.")
    parser.add_argument("--draco", action="store_true", help="Compress the same evaluated meshes; do not reduce triangles further.")
    parser.add_argument("--intro-animation", action="store_true", help="Add the approved subtle working-pose rig to the derived web model.")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    for name in ("intro-scene.glb", "intro-scene.png", "intro-scene.json"):
        if (output / name).exists():
            raise RuntimeError(f"Refusing to overwrite existing asset: {name}")
    bpy.ops.wm.open_mainfile(filepath=str(args.source.resolve()), use_scripts=False)
    scene = bpy.context.scene
    # Keep the accepted lighting and framing angle; remove unused outer whitespace.
    scene.render.film_transparent = True
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.camera.data.ortho_scale = 3.5
    scene.cycles.samples = 24
    scene.render.threads_mode = "FIXED"
    scene.render.threads = 6
    ground = bpy.data.objects.get("Studio / invisible ground for contact shadows")
    # A Cycles shadow catcher includes environment compensation over the whole
    # image, which makes a visible gray rectangle on a different page background.
    # Keep self-shadowing in the transparent model render, not a flattened floor.
    if ground:
        ground.hide_render = True
    scene.render.filepath = str(output / "intro-scene.png")
    if args.poster:
        shutil.copyfile(args.poster.resolve(), output / "intro-scene.png")
    else:
        bpy.ops.render.render(write_still=True)

    for obj in scene.objects:
        if obj.type == "CURVE":
            obj.data.resolution_u = 4
            obj.data.bevel_resolution = 1
    bpy.context.view_layer.update()
    batches = {}
    batch_weights = {}
    if args.intro_animation:
        sys.dont_write_bytecode = True
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from intro_animation import AnimationAuthor, attach_weights
        avatar = bpy.data.objects["Avatar / original posed study"]
        animation = AnimationAuthor(avatar)
    graph = bpy.context.evaluated_depsgraph_get()
    sources = [obj for obj in scene.objects if obj.type in {"MESH", "CURVE"} and obj != ground and not obj.hide_render]
    for source in sources:
        mesh = bpy.data.meshes.new_from_object(source.evaluated_get(graph))
        part = bpy.data.objects.new("Web / temporary part", mesh)
        scene.collection.objects.link(part)
        # Only simplify genuinely dense organic surfaces, not keys, leaves or seams.
        if len(mesh.polygons) > 400 and not source.name.startswith("Flag / red field"):
            decimate = part.modifiers.new("Still-only reduction", "DECIMATE")
            decimate.ratio = 0.30
            bpy.context.view_layer.update()
            reduced = bpy.data.meshes.new_from_object(part.evaluated_get(bpy.context.evaluated_depsgraph_get()))
            part.modifiers.clear()
            part.data = reduced
            bpy.data.meshes.remove(mesh)
            mesh = reduced
        # Preserve per-face materials: leaf undersides and integral sneaker soles
        # must not silently become the first material on their source object.
        mappings = {}
        for face in mesh.polygons:
            material = source.data.materials[face.material_index]
            vertices, faces = batches.setdefault(material.name, ([], []))
            mapping = mappings.setdefault(material.name, {})
            indices = []
            for index in face.vertices:
                if index not in mapping:
                    mapping[index] = len(vertices)
                    world = source.matrix_world @ mesh.vertices[index].co
                    vertices.append(world)
                    if args.intro_animation:
                        batch_weights.setdefault(material.name, []).append(animation.weights_for_vertex(source, world))
                indices.append(mapping[index])
            faces.append(tuple(indices))
        bpy.data.objects.remove(part, do_unlink=True)
        bpy.data.meshes.remove(mesh)

    bpy.ops.object.select_all(action="DESELECT")
    rig = animation.build_rig() if args.intro_animation else None
    triangles = 0
    for name, (vertices, faces) in batches.items():
        mesh = bpy.data.meshes.new("Web / " + name)
        mesh.from_pydata(vertices, [], faces)
        mesh.update()
        mesh.calc_loop_triangles()
        triangles += len(mesh.loop_triangles)
        obj = bpy.data.objects.new("Web / " + name, mesh)
        scene.collection.objects.link(obj)
        mat = bpy.data.materials[name].copy()
        mat.name = "Web / " + name
        shader = mat.node_tree.nodes.get("Principled BSDF")
        # Explicitly use the source's base pigment rather than silently exporting a
        # nonportable procedural graph. Texture baking remains a later quality step.
        for socket in ("Base Color", "Normal"):
            for link in list(shader.inputs[socket].links):
                mat.node_tree.links.remove(link)
        if shader.inputs["Sheen Weight"].default_value:
            # The exporter maps tint to KHR sheen color without multiplying the
            # Blender weight. White tint otherwise turns black clothes silver.
            weight = shader.inputs["Sheen Weight"].default_value
            tint = shader.inputs["Sheen Tint"].default_value
            shader.inputs["Sheen Tint"].default_value = tuple(min(0.03, channel * weight) for channel in tint[:3]) + (1,)
        mesh.materials.append(mat)
        for face in mesh.polygons:
            face.use_smooth = True
        obj.select_set(True)
        if rig:
            attach_weights(obj, batch_weights[name], rig)
    bpy.ops.export_scene.gltf(
        filepath=str(output / "intro-scene.glb"), export_format="GLB",
        use_selection=True, export_apply=True, export_yup=True,
        export_animations=args.intro_animation, export_cameras=False, export_lights=False,
        export_force_sampling=True, export_frame_range=True,
        export_anim_slide_to_zero=True,
        export_texcoords=False, export_extras=False,
        export_draco_mesh_compression_enable=args.draco,
        export_draco_mesh_compression_level=6,
        export_draco_position_quantization=16,
        export_draco_normal_quantization=14,
    )
    manifest = {
        "source_review": args.review, "animations": 1 if args.intro_animation else 0, "external_assets": [],
        "inventory": {"hood": "Avatar / draped fabric hood" in bpy.data.objects, "parallettes": any(obj.name.startswith("Parallettes /") for obj in bpy.data.objects), "vietnam_flag": "Flag / Vietnam desk flag" in bpy.data.objects},
        "source_sha256": hashlib.sha256(args.source.read_bytes()).hexdigest(),
        "triangles": triangles, "material_batches": len(batches),
        "compression": {"codec": "draco" if args.draco else "none", "position_bits": 16 if args.draco else None, "normal_bits": 14 if args.draco else None},
        "glb_bytes": (output / "intro-scene.glb").stat().st_size,
        "poster_bytes": (output / "intro-scene.png").stat().st_size,
        "limitations": "Material-batched mesh; optional small working-pose rig. Procedural grain/bump not baked. Browser visual review required.",
    }
    (output / "intro-scene.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print("INTRO_WEB_EXPORT_COMPLETE " + json.dumps(manifest))


if __name__ == "__main__":
    main()
