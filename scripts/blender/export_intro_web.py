"""Derive static web assets from the approved review-06 without changing its source.

Run in a disposable Blender background process with --disable-autoexec. The posed
model is merged by material and decimated; original modeling topology stays in the
review file. Procedural bump/grain is not a glTF texture bake: browser acceptance is
still required. No character animation, external textures or lights are exported.
"""

import argparse
import hashlib
import json
import shutil
import sys
from pathlib import Path

import bpy


def main():
    """Export an unanimated, material-batched GLB and transparent self-shadowed PNG."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--poster", type=Path, help="Reuse an already rendered poster from this same approved source/framing.")
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
    ground = bpy.data.objects["Studio / invisible ground for contact shadows"]
    # A Cycles shadow catcher includes environment compensation over the whole
    # image, which makes a visible gray rectangle on a different page background.
    # Keep self-shadowing in the transparent model render, not a flattened floor.
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
    graph = bpy.context.evaluated_depsgraph_get()
    sources = [obj for obj in scene.objects if obj.type in {"MESH", "CURVE"} and obj != ground]
    for source in sources:
        mesh = bpy.data.meshes.new_from_object(source.evaluated_get(graph))
        part = bpy.data.objects.new("Web / temporary part", mesh)
        scene.collection.objects.link(part)
        # Only simplify genuinely dense organic surfaces, not keys, leaves or seams.
        if len(mesh.polygons) > 400:
            decimate = part.modifiers.new("Still-only reduction", "DECIMATE")
            decimate.ratio = 0.30
            bpy.context.view_layer.update()
            reduced = bpy.data.meshes.new_from_object(part.evaluated_get(bpy.context.evaluated_depsgraph_get()))
            part.modifiers.clear()
            part.data = reduced
            bpy.data.meshes.remove(mesh)
            mesh = reduced
        material = source.data.materials[0]
        vertices, faces = batches.setdefault(material.name, ([], []))
        offset = len(vertices)
        vertices.extend(source.matrix_world @ vertex.co for vertex in mesh.vertices)
        faces.extend(tuple(offset + index for index in face.vertices) for face in mesh.polygons)
        bpy.data.objects.remove(part, do_unlink=True)
        bpy.data.meshes.remove(mesh)

    bpy.ops.object.select_all(action="DESELECT")
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
            shader.inputs["Sheen Tint"].default_value = (0.03, 0.03, 0.03, 1)
        mesh.materials.append(mat)
        for face in mesh.polygons:
            face.use_smooth = True
        obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=str(output / "intro-scene.glb"), export_format="GLB",
        use_selection=True, export_apply=True, export_yup=True,
        export_animations=False, export_cameras=False, export_lights=False,
        export_texcoords=False, export_extras=False,
    )
    manifest = {
        "source_review": "review-06", "animations": 0, "external_assets": [],
        "source_sha256": hashlib.sha256(args.source.read_bytes()).hexdigest(),
        "triangles": triangles, "material_batches": len(batches),
        "glb_bytes": (output / "intro-scene.glb").stat().st_size,
        "poster_bytes": (output / "intro-scene.png").stat().st_size,
        "limitations": "Static material-batched mesh; no rig. Procedural grain/bump not baked. Browser visual review required.",
    }
    (output / "intro-scene.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print("INTRO_WEB_EXPORT_COMPLETE " + json.dumps(manifest))


if __name__ == "__main__":
    main()
