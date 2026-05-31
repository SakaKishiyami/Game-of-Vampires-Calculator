"""Bake SLG chunk interiors from groundtiles Tilemaps (Plot01 base tiles only)."""

from __future__ import annotations

import json
import re
from pathlib import Path

import UnityPy
from PIL import Image

from sinistra_bake_utils import (
    finalize_canvas,
    paste_at,
    prepare_sprite,
    save_png_atomic,
    scale_image_to_world,
    sprite_pixels_per_unit,
)

ROOT = Path(__file__).resolve().parents[1]
ZIP = ROOT / "DataMineRaw/Game of Vampires_ Twilight Sun_1.048.007_APKPure.zip"
GROUND_BUNDLE = ZIP / "base_assets/assets/scenes/slg/groundtiles"
PLOT01_BUNDLE = ZIP / "base_assets/assets/scenes/slg/terrainsatlas/plot01"
OUT_DIR = ROOT / "DataMineRaw/extracted/slg/chunk_grounds"
MANIFEST_OUT = ROOT / "src/data/sinistraChunkGroundManifest.json"

PX_PER_UNIT = 50.0
CHUNK_NAME_RE = re.compile(r"^(-?\d+)_(-?\d+)_(\d+)_(\d+)$")


def load_environments() -> dict:
    """groundtiles has Tilemaps; Plot01 sprites live in terrainsatlas/plot01."""
    by_id: dict = {}
    for bundle in (GROUND_BUNDLE, PLOT01_BUNDLE):
        env = UnityPy.load(str(bundle))
        by_id.update({obj.path_id: obj for obj in env.objects})
    return by_id


def sprite_from_ptr(by_id: dict, ptr) -> dict | None:
    if ptr is None:
        return None
    obj = by_id.get(ptr.path_id)
    if not obj or obj.type.name != "Sprite":
        return None
    data = obj.read()
    try:
        img = prepare_sprite(data.image.convert("RGBA"))
    except Exception:
        return None
    rect = data.m_Rect
    ppu = sprite_pixels_per_unit(data)
    return {
        "name": data.m_Name,
        "image": img,
        "width_u": float(rect.width) / ppu,
        "height_u": float(rect.height) / ppu,
    }


def bake_chunk(go_name: str, by_id: dict) -> dict | None:
    match = CHUNK_NAME_RE.match(go_name)
    if not match:
        return None

    cx, cy, cw, ch = (float(match.group(i)) for i in range(1, 5))

    tilemap = None
    for obj in by_id.values():
        if obj.type.name != "GameObject" or obj.read().m_Name != go_name:
            continue
        for pair in obj.read().m_Component:
            component = by_id.get(pair.component.path_id)
            if component and component.type.name == "Tilemap":
                tilemap = component.read()
                break
        break

    if not tilemap or not tilemap.m_Tiles:
        return None

    cells = [tile[0] for tile in tilemap.m_Tiles]
    min_cx = min(cell.x for cell in cells)
    max_cx = max(cell.x for cell in cells)
    min_cy = min(cell.y for cell in cells)
    max_cy = max(cell.y for cell in cells)
    span_x = max_cx - min_cx + 1
    span_y = max_cy - min_cy + 1
    cell_w_u = cw / span_x
    cell_h_u = ch / span_y

    sprite_by_index: list[dict | None] = []
    for ref in tilemap.m_TileSpriteArray:
        sprite_by_index.append(sprite_from_ptr(by_id, ref.m_Data))

    canvas_w = max(1, int(cw * PX_PER_UNIT))
    canvas_h = max(1, int(ch * PX_PER_UNIT))
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))

    for cell, tile in tilemap.m_Tiles:
        idx = tile.m_TileSpriteIndex
        if idx < 0 or idx >= len(sprite_by_index):
            continue
        sprite = sprite_by_index[idx]
        if not sprite:
            continue

        col = cell.x - min_cx
        row = cell.y - min_cy
        px_w = max(1, int(cell_w_u * PX_PER_UNIT))
        px_h = max(1, int(cell_h_u * PX_PER_UNIT))
        left = int(col * px_w)
        top = int(row * px_h)

        plot_img = scale_image_to_world(sprite["image"], cell_w_u, cell_h_u, PX_PER_UNIT)
        paste_at(canvas, plot_img, left, top)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    safe_name = go_name.replace(".", "_")
    out_path = OUT_DIR / f"{safe_name}.png"
    baked = finalize_canvas(canvas)
    save_png_atomic(baked, out_path)
    baked.close()
    canvas.close()

    return {
        "chunkKey": go_name,
        "imagePath": out_path.relative_to(ROOT).as_posix(),
        "worldX": cx,
        "worldY": cy,
        "worldWidth": cw,
        "worldHeight": ch,
        "tileCount": len(tilemap.m_Tiles),
        "pixelWidth": canvas_w,
        "pixelHeight": canvas_h,
    }


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Bake SLG chunk ground tiles from groundtiles Tilemaps")
    parser.add_argument(
        "--chunk",
        help="Bake only this chunk key (e.g. 385_90_100_100). Default: bake all chunks.",
    )
    args = parser.parse_args()

    print("Loading groundtiles + terrainsatlas/plot01...", flush=True)
    by_id = load_environments()

    chunk_names = sorted(
        obj.read().m_Name
        for obj in by_id.values()
        if obj.type.name == "GameObject" and CHUNK_NAME_RE.match(obj.read().m_Name)
    )
    if args.chunk:
        if args.chunk not in chunk_names:
            raise SystemExit(f"Chunk not found in groundtiles: {args.chunk}")
        chunk_names = [args.chunk]

    print(f"Baking {len(chunk_names)} chunk grounds (plot tiles only) at {int(PX_PER_UNIT)} px/unit...", flush=True)

    existing_manifest: dict = {}
    if MANIFEST_OUT.exists() and args.chunk:
        existing_manifest = json.loads(MANIFEST_OUT.read_text(encoding="utf-8")).get("chunks", {})

    manifest: dict[str, dict] = dict(existing_manifest) if args.chunk else {}
    baked = 0
    for name in chunk_names:
        meta = bake_chunk(name, by_id)
        if meta:
            manifest[name] = meta
            baked += 1
            print(f"  [{baked}/{len(chunk_names)}] {name}", flush=True)

    MANIFEST_OUT.write_text(
        json.dumps(
            {
                "bakedCount": len(manifest),
                "pixelsPerUnit": PX_PER_UNIT,
                "chunks": manifest,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Done: {baked}/{len(chunk_names)} -> {OUT_DIR}")
    print(f"Manifest -> {MANIFEST_OUT}")


if __name__ == "__main__":
    main()
