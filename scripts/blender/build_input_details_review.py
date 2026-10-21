"""Match the approved red/charcoal input-device palette and large black desk mat."""

import argparse
import sys
from pathlib import Path

import bpy

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_intro_scene as base
from build_finish_review import geometry_signature


def main():
    """Derive a new review without moving input contact points or unrelated props."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    if args.output.exists():
        raise RuntimeError("Choose a new review file; preserve earlier sources.")
    bpy.ops.wm.open_mainfile(filepath=str(args.source.resolve()), use_scripts=False)
    pad = bpy.data.objects["Mouse / pad"]
    protected = [obj for obj in bpy.context.scene.objects if obj != pad]
    before = geometry_signature(protected)
    shell = base.material("Input review / charcoal shell", "14171A", 0.68)
    graphite = base.material("Input review / graphite keys", "292C2F", 0.72)
    red = base.material("Input review / muted red keys", "AB3E35", 0.64)
    cloth = base.material("Input review / black desk mat", "111315", 0.94)
    keyboard = bpy.data.objects["Keyboard / typing position"]
    keycaps = [obj for obj in keyboard.children_recursive if obj.name.startswith("Keyboard / keycap")]
    assert len(keycaps) > 50
    for obj in keyboard.children_recursive:
        if obj.type != "MESH":
            continue
        if obj.name.startswith("Keyboard / keycap"):
            # The far/top row and rightmost column echo the reference without
            # importing photographs, logos, legends or a third-party layout.
            accent = obj.location.y > 0.045 or obj.location.x > 0.19
            mat = red if accent else graphite
        else:
            mat = graphite if obj.name.startswith("Keyboard / spacebar") else shell
        obj.data.materials.clear()
        obj.data.materials.append(mat)
    mouse = bpy.data.objects["Mouse / shell"]
    mouse.data.materials.clear()
    mouse.data.materials.append(shell)
    pad.data.materials.clear()
    pad.data.materials.append(cloth)
    pad.location = (0.23, -0.11, 0.831)
    pad.dimensions = (1.05, 0.46, 0.003)
    assert geometry_signature(protected) == before, "Unrelated geometry or input contact changed"
    assert pad.dimensions.x > 1 and pad.dimensions.y > 0.4
    args.output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(args.output.resolve()))


if __name__ == "__main__":
    main()
