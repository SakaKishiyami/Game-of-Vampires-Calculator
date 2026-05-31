"""Bake sorted terrain composites for alternate render modes (additive — does not replace per-prefab bakes)."""

from __future__ import annotations

import argparse
import gc
import importlib.util
import json
import re
from pathlib import Path

from PIL import Image

from sinistra_bake_utils import SPRITE_DRAW_MODE_TILED, finalize_canvas, save_png_atomic

ROOT = Path(__file__).resolve().parents[1]
CHUNK_FILES = [
    ROOT / "DataMineRaw/Game of Vampires_ Twilight Sun_1.048.007_APKPure.zip/base_assets/formatted/MonoBehaviour/SLGMapChuck1.json",
    ROOT / "DataMineRaw/Game of Vampires_ Twilight Sun_1.048.007_APKPure.zip/base_assets/formatted/MonoBehaviour/SLGMapChuck2.json",
    ROOT / "DataMineRaw/Game of Vampires_ Twilight Sun_1.048.007_APKPure.zip/base_assets/formatted/MonoBehaviour/SLGMapChuck.json",
]

CHUNK_COMPOSITE_OUT = ROOT / "DataMineRaw/extracted/slg/chunk_composites"
FULL_COMPOSITE_OUT = ROOT / "DataMineRaw/extracted/slg/full_composite"
SPRITE_OUT = ROOT / "DataMineRaw/extracted/slg/terrain_sprites"

CHUNK_COMPOSITE_MANIFEST = ROOT / "src/data/sinistraChunkCompositeManifest.json"
FULL_COMPOSITE_MANIFEST = ROOT / "src/data/sinistraFullCompositeManifest.json"
SPRITE_MANIFEST = ROOT / "src/data/sinistraSpriteManifest.json"

PIXELS_PER_WORLD_UNIT = 100.0
WORLD_PADDING = 4.0
CHUNK_SIZE = 100.0


def load_prefab_bake_module():
    path = ROOT / "scripts/bake-sinistra-terrain-prefabs.py"
    spec = importlib.util.spec_from_file_location("sinistra_prefab_bake", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def format_chunk_coord(value: float) -> str:
    rounded = round(value * 1000) / 1000
    if abs(rounded - round(rounded)) < 1e-6:
        return str(int(round(rounded)))
    return str(rounded)


def chunk_key(position: dict, size: float = CHUNK_SIZE) -> str:
    return f"{format_chunk_coord(position['x'])}_{format_chunk_coord(position['y'])}_{int(size)}_{int(size)}"


def load_merged_chunks() -> tuple[list[dict], list[str]]:
    """Merge Chuck1+Chuck2; skip bare SLGMapChuck.json when Chuck1 exists."""
    sources: list[str] = []
    chunks: list[dict] = []
    has_chuck1 = CHUNK_FILES[0].exists()

    for chunk_file in CHUNK_FILES:
        if not chunk_file.exists():
            continue
        if chunk_file.name == "SLGMapChuck.json" and has_chuck1:
            continue
        data = json.loads(chunk_file.read_text(encoding="utf-8"))
        sources.append(chunk_file.name)
        for chunk in data.get("chucks", []):
            chunks.append(chunk)

    return chunks, sources


def offset_sprites(
    sprites: list[dict],
    offset_x: float,
    offset_y: float,
    prefab_name: str,
    anchor_x: float,
    anchor_y: float,
    instance_index: int,
) -> list[dict]:
    out: list[dict] = []
    for sprite in sprites:
        copy = dict(sprite)
        copy["wx"] = float(sprite["wx"]) + offset_x
        copy["wy"] = float(sprite["wy"]) + offset_y
        copy["prefab_name"] = prefab_name
        copy["anchor_x"] = anchor_x
        copy["anchor_y"] = anchor_y
        copy["instance_index"] = instance_index
        out.append(copy)
    return out


def sort_key(sprite: dict) -> tuple:
    return (
        sprite["sort_layer"],
        sprite["sort_order"],
        sprite["depth"],
        sprite["sibling"],
        sprite["comp"],
        sprite.get("instance_index", 0),
    )


def bake_canvas(sprites: list[dict], prefab_bake, *, pad: float = WORLD_PADDING) -> tuple[Image.Image, dict]:
    if not sprites:
        raise ValueError("No sprites to bake")

    corners: list[tuple[float, float]] = []
    for sprite in sprites:
        half_w = sprite["w"] / 2
        half_h = sprite["h"] / 2
        corners.extend(
            [
                (sprite["wx"] - half_w, sprite["wy"] - half_h),
                (sprite["wx"] + half_w, sprite["wy"] - half_h),
                (sprite["wx"] - half_w, sprite["wy"] + half_h),
                (sprite["wx"] + half_w, sprite["wy"] + half_h),
            ]
        )

    min_x = min(c[0] for c in corners)
    max_x = max(c[0] for c in corners)
    min_y = min(c[1] for c in corners)
    max_y = max(c[1] for c in corners)

    width_u = max_x - min_x + pad * 2
    height_u = max_y - min_y + pad * 2
    px_per_unit = PIXELS_PER_WORLD_UNIT
    canvas_w = max(1, int(width_u * px_per_unit))
    canvas_h = max(1, int(height_u * px_per_unit))
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))

    def world_to_px(wx: float, wy: float) -> tuple[int, int]:
        x = int((wx - min_x + pad) * px_per_unit)
        y = int((max_y - wy + pad) * px_per_unit)
        return x, y

    for sprite in prefab_bake.sort_sprites_for_paste(sprites):
        prefab_bake.paste_sprite(canvas, sprite, world_to_px, px_per_unit)

    meta = {
        "worldX": min_x - pad,
        "worldY": min_y - pad,
        "worldWidth": width_u,
        "worldHeight": height_u,
        "pixelWidth": canvas_w,
        "pixelHeight": canvas_h,
        "spriteCount": len(sprites),
    }
    return canvas, meta


def bake_chunk_composites(
    prefab_bake,
    by_id: dict,
    chunks: list[dict],
    profile: str,
) -> int:
    CHUNK_COMPOSITE_OUT.mkdir(parents=True, exist_ok=True)
    manifest_chunks: dict[str, dict] = {}
    baked = 0
    available_go_names = prefab_bake._all_go_names(by_id)
    instance_counter = 0

    for chunk in chunks:
        key = chunk_key(chunk["position"])
        chunk_sprites: list[dict] = []

        for terrain in chunk.get("terrains", []):
            name = terrain["name"]
            pos = terrain["position"]
            root_tr = prefab_bake.find_prefab_root(by_id, name)
            fallback_name = None
            if not root_tr:
                fallback_name = prefab_bake.find_variant_fallback(name, available_go_names)
                if fallback_name:
                    root_tr = prefab_bake.find_prefab_root(by_id, fallback_name)

            if not root_tr:
                continue

            all_sprites = prefab_bake.collect_sprites(root_tr, by_id)
            sprites = prefab_bake.filter_prefab_sprites(profile, all_sprites)
            chunk_sprites.extend(
                offset_sprites(
                    sprites,
                    float(pos["x"]),
                    float(pos["y"]),
                    name,
                    float(pos["x"]),
                    float(pos["y"]),
                    instance_counter,
                )
            )
            instance_counter += 1

        if not chunk_sprites:
            continue

        canvas, meta = bake_canvas(chunk_sprites, prefab_bake)
        out_path = CHUNK_COMPOSITE_OUT / f"{key}.png"
        baked_img = finalize_canvas(canvas)
        save_png_atomic(baked_img, out_path)
        baked_img.close()
        canvas.close()
        gc.collect()

        manifest_chunks[key] = {
            "chunkKey": key,
            "imagePath": out_path.relative_to(ROOT).as_posix(),
            **meta,
        }
        baked += 1
        if baked % 10 == 0:
            print(f"  chunk composites: {baked}...")

    CHUNK_COMPOSITE_MANIFEST.write_text(
        json.dumps(
            {
                "bakedCount": baked,
                "pixelsPerUnit": PIXELS_PER_WORLD_UNIT,
                "profile": profile,
                "description": "Per-chunk terrain composites (100×100) with Unity sprite sort order.",
                "chunks": manifest_chunks,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Chunk composites: {baked} -> {CHUNK_COMPOSITE_OUT}")
    print(f"Manifest -> {CHUNK_COMPOSITE_MANIFEST}")
    return baked


def collect_all_sprites(prefab_bake, by_id: dict, chunks: list[dict], profile: str) -> list[dict]:
    all_sprites: list[dict] = []
    available_go_names = prefab_bake._all_go_names(by_id)
    instance_counter = 0

    for chunk in chunks:
        for terrain in chunk.get("terrains", []):
            name = terrain["name"]
            pos = terrain["position"]
            root_tr = prefab_bake.find_prefab_root(by_id, name)
            if not root_tr:
                fallback_name = prefab_bake.find_variant_fallback(name, available_go_names)
                if fallback_name:
                    root_tr = prefab_bake.find_prefab_root(by_id, fallback_name)
            if not root_tr:
                continue

            sprites = prefab_bake.filter_prefab_sprites(
                profile,
                prefab_bake.collect_sprites(root_tr, by_id),
            )
            all_sprites.extend(
                offset_sprites(
                    sprites,
                    float(pos["x"]),
                    float(pos["y"]),
                    name,
                    float(pos["x"]),
                    float(pos["y"]),
                    instance_counter,
                )
            )
            instance_counter += 1

    all_sprites.sort(key=sort_key)
    return all_sprites


def bake_full_composite(prefab_bake, sprites: list[dict], profile: str) -> bool:
    if not sprites:
        print("Full composite: no sprites")
        return False

    FULL_COMPOSITE_OUT.mkdir(parents=True, exist_ok=True)
    canvas, meta = bake_canvas(sprites, prefab_bake)
    out_path = FULL_COMPOSITE_OUT / "full_map.png"
    baked_img = finalize_canvas(canvas)
    save_png_atomic(baked_img, out_path)
    baked_img.close()
    canvas.close()
    gc.collect()

    FULL_COMPOSITE_MANIFEST.write_text(
        json.dumps(
            {
                "baked": True,
                "pixelsPerUnit": PIXELS_PER_WORLD_UNIT,
                "profile": profile,
                "description": "Full-map terrain composite with Unity sprite sort order.",
                "imagePath": out_path.relative_to(ROOT).as_posix(),
                **meta,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Full composite -> {out_path}")
    print(f"Manifest -> {FULL_COMPOSITE_MANIFEST}")
    return True


def safe_sprite_filename(name: str) -> str:
    return re.sub(r"[^\w.-]+", "_", name).strip("_") or "sprite"


def bake_sprite_manifest(prefab_bake, sprites: list[dict], profile: str) -> int:
    if not sprites:
        print("Sprite manifest: no sprites")
        return 0

    SPRITE_OUT.mkdir(parents=True, exist_ok=True)
    image_cache: dict[str, str] = {}
    manifest_sprites: list[dict] = []

    for sprite in sprites:
        sprite_name = sprite["name"]
        if sprite_name not in image_cache:
            safe_name = safe_sprite_filename(sprite_name)
            out_path = SPRITE_OUT / f"{safe_name}.png"
            if not out_path.exists():
                img = sprite["image"]
                if sprite["draw_mode"] == SPRITE_DRAW_MODE_TILED:
                    tile_img = prefab_bake.scale_image_to_world(
                        img,
                        sprite["tile_w"],
                        sprite["tile_h"],
                        PIXELS_PER_WORLD_UNIT,
                    )
                    tile_img.save(out_path)
                else:
                    scaled = prefab_bake.scale_image_to_world(
                        img,
                        sprite["w"],
                        sprite["h"],
                        PIXELS_PER_WORLD_UNIT,
                    )
                    scaled.save(out_path)
            image_cache[sprite_name] = out_path.relative_to(ROOT).as_posix()

        manifest_sprites.append(
            {
                "name": sprite_name,
                "prefabName": sprite["prefab_name"],
                "anchorX": sprite["anchor_x"],
                "anchorY": sprite["anchor_y"],
                "wx": sprite["wx"],
                "wy": sprite["wy"],
                "w": sprite["w"],
                "h": sprite["h"],
                "tileW": sprite["tile_w"],
                "tileH": sprite["tile_h"],
                "drawMode": sprite["draw_mode"],
                "sortLayer": sprite["sort_layer"],
                "sortOrder": sprite["sort_order"],
                "imagePath": image_cache[sprite_name],
            }
        )

    SPRITE_MANIFEST.write_text(
        json.dumps(
            {
                "spriteCount": len(manifest_sprites),
                "pixelsPerUnit": PIXELS_PER_WORLD_UNIT,
                "profile": profile,
                "description": "Globally sorted terrain sprites for runtime draw-order-accurate rendering.",
                "sprites": manifest_sprites,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Sprite manifest: {len(manifest_sprites)} draws -> {SPRITE_MANIFEST}")
    return len(manifest_sprites)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Bake sorted terrain composites (additive — per-prefab bakes unchanged)",
    )
    parser.add_argument(
        "--profile",
        choices=["full", "edges"],
        default="full",
        help="Sprite filter profile (same as per-prefab bake)",
    )
    parser.add_argument(
        "--modes",
        default="chunk,full,manifest",
        help="Comma-separated: chunk, full, manifest (default: all three)",
    )
    args = parser.parse_args()
    modes = {part.strip() for part in args.modes.split(",") if part.strip()}

    prefab_bake = load_prefab_bake_module()
    print("Loading terrains + terrainsatlas bundles...")
    by_id = prefab_bake.load_merged_environment()
    chunks, sources = load_merged_chunks()
    print(f"Loaded {len(chunks)} chunks from {', '.join(sources)}")

    if "chunk" in modes:
        bake_chunk_composites(prefab_bake, by_id, chunks, args.profile)

    need_all_sprites = "full" in modes or "manifest" in modes
    all_sprites = collect_all_sprites(prefab_bake, by_id, chunks, args.profile) if need_all_sprites else []

    if "full" in modes:
        bake_full_composite(prefab_bake, all_sprites, args.profile)

    if "manifest" in modes:
        bake_sprite_manifest(prefab_bake, all_sprites, args.profile)


if __name__ == "__main__":
    main()
