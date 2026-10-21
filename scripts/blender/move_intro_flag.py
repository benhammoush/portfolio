"""Reposition only the desktop flag, preserving previous editable reviews."""

import argparse
import sys
from pathlib import Path

import bpy

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_finish_review import geometry_signature


def main():
    """Preserve the accepted source and all other objects in a new editable review."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--y", type=float, default=-0.10, help="Desktop depth; 0.40 restores the original placement.")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    if args.output.exists():
        raise RuntimeError("Choose a new review path; never overwrite earlier sources.")
    bpy.ops.wm.open_mainfile(filepath=str(args.source.resolve()), use_scripts=False)
    flag = bpy.data.objects["Flag / Vietnam desk flag"]
    protected = [obj for obj in bpy.context.scene.objects if obj not in {flag, *flag.children_recursive}]
    before = geometry_signature(protected)
    flag.location.y = args.y
    assert geometry_signature(protected) == before, "Unrelated assembly changed"
    assert abs(flag.location.z - 0.8275) < 1e-6, "Flag must remain on the desk"
    args.output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(args.output.resolve()))


if __name__ == "__main__":
    main()
