"""Bake SLG terrain prefabs (multi-sprite compositions) to PNGs for the map viewer."""

from __future__ import annotations

import argparse
import gc
import json
import re
from pathlib import Path

import UnityPy
from PIL import Image

from sinistra_bake_utils import (
    SPRITE_DRAW_MODE_TILED,
    filter_prefab_sprites,
    finalize_canvas,
    paste_at,
    paste_centered,
    prepare_sprite,
    save_png_atomic,
    scale_image_to_world,
    sprite_pixels_per_unit,
)

ROOT = Path(__file__).resolve().parents[1]
ZIP = ROOT / "DataMineRaw/Game of Vampires_ Twilight Sun_1.048.007_APKPure.zip"
SLG_SCENE_DIR = ZIP / "base_assets/assets/scenes/slg"
TERRAINS_BUNDLE = SLG_SCENE_DIR / "terrains"
TERRAINS_ATLAS_BUNDLE = SLG_SCENE_DIR / "terrainsatlas"
MONO_DIR = ZIP / "base_assets/formatted/MonoBehaviour"
CHUNK_FILES = [
    MONO_DIR / "SLGMapChuck1.json",
    MONO_DIR / "SLGMapChuck2.json",
    MONO_DIR / "SLGMapChuck.json",
]
OUT_DIR = ROOT / "DataMineRaw/extracted/slg/terrain_prefabs"
MANIFEST_OUT = ROOT / "src/data/sinistraPrefabManifest.json"

BAKE_PROFILES: dict[str, dict] = {
    "full": {
        "out_dir": OUT_DIR,
        "manifest_out": MANIFEST_OUT,
        "description": "All prefab sprites including tiled ground and water plot fills.",
    },
    "edges": {
        "out_dir": ROOT / "DataMineRaw/extracted/slg/terrain_prefabs_edges",
        "manifest_out": ROOT / "src/data/sinistraPrefabManifestEdges.json",
        "description": "Edge/decorative sprites only; excludes tiled plot fills (ground, sand, water).",
    },
}

PIXELS_PER_WORLD_UNIT = 100.0
WORLD_PADDING = 4.0


def resolve_ptr(by_id: dict, ptr):
    if ptr is None:
        return None
    return by_id.get(ptr.path_id)


def comp_from_pair(by_id: dict, pair):
    ptr = pair.component if hasattr(pair, "component") else pair
    return resolve_ptr(by_id, ptr)


def sprite_tile_cell_size(sprite_data, scale_x: float, scale_y: float) -> tuple[float, float]:
    """World size of one repeat cell (texture rect), before tiled m_Size stretching."""
    rect = sprite_data.m_Rect
    ppu = sprite_pixels_per_unit(sprite_data)
    return float(rect.width) / ppu * scale_x, float(rect.height) / ppu * scale_y


def sprite_draw_size(sr, sprite_data, scale_x: float, scale_y: float) -> tuple[float, float]:
    """World-space width/height of a SpriteRenderer quad (2D, no rotation)."""
    draw_mode = int(getattr(sr, "m_DrawMode", 0) or 0)
    if draw_mode != 0 and hasattr(sr, "m_Size"):
        size = sr.m_Size
        return float(size.x) * scale_x, float(size.y) * scale_y

    return sprite_tile_cell_size(sprite_data, scale_x, scale_y)


def collect_sprites(
    tr_obj,
    by_id: dict,
    parent_x: float = 0.0,
    parent_y: float = 0.0,
    parent_scale_x: float = 1.0,
    parent_scale_y: float = 1.0,
    depth: int = 0,
    sibling: int = 0,
) -> list[dict]:
    t = tr_obj.read()
    lp = t.m_LocalPosition
    ls = t.m_LocalScale

    world_x = parent_x + float(lp.x) * parent_scale_x
    world_y = parent_y + float(lp.y) * parent_scale_y
    scale_x = parent_scale_x * abs(float(ls.x))
    scale_y = parent_scale_y * abs(float(ls.y))

    sprites: list[dict] = []

    go = resolve_ptr(by_id, t.m_GameObject)
    if go:
        for comp_index, pair in enumerate(go.read().m_Component):
            c = comp_from_pair(by_id, pair)
            if c and c.type.name == "SpriteRenderer":
                sr = c.read()
                sp = resolve_ptr(by_id, sr.m_Sprite)
                if sp and sp.type.name == "Sprite":
                    sd = sp.read()
                    try:
                        img = prepare_sprite(sd.image.convert("RGBA"))
                    except Exception:
                        continue

                    draw_mode = int(getattr(sr, "m_DrawMode", 0) or 0)
                    w_u, h_u = sprite_draw_size(sr, sd, scale_x, scale_y)
                    tile_w_u, tile_h_u = sprite_tile_cell_size(sd, scale_x, scale_y)
                    sprites.append(
                        {
                            "name": sd.m_Name,
                            "wx": world_x,
                            "wy": world_y,
                            "w": w_u,
                            "h": h_u,
                            "tile_w": tile_w_u,
                            "tile_h": tile_h_u,
                            "img_w": img.width,
                            "img_h": img.height,
                            "image": img,
                            "draw_mode": draw_mode,
                            "sort_order": int(getattr(sr, "m_SortingOrder", 0) or 0),
                            "sort_layer": int(getattr(sr, "m_SortingLayerID", 0) or 0),
                            "depth": depth,
                            "sibling": sibling,
                            "comp": comp_index,
                        }
                    )

    for child_index, child in enumerate(t.m_Children):
        c = resolve_ptr(by_id, child)
        if c and c.type.name == "Transform":
            sprites.extend(
                collect_sprites(
                    c,
                    by_id,
                    world_x,
                    world_y,
                    scale_x,
                    scale_y,
                    depth + 1,
                    child_index,
                ),
            )

    return sprites


def sort_sprites_for_paste(sprites: list[dict]) -> list[dict]:
    """Back to front: low sorting order / early hierarchy first."""
    return sorted(
        sprites,
        key=lambda sprite: (
            sprite["sort_layer"],
            sprite["sort_order"],
            sprite["depth"],
            sprite["sibling"],
            sprite["comp"],
        ),
    )


def paste_sprite(
    canvas: Image.Image,
    sprite: dict,
    world_to_px,
    px_per_unit: float,
) -> None:
    cx, cy = world_to_px(sprite["wx"], sprite["wy"])
    world_w_px = max(1, int(sprite["w"] * px_per_unit))
    world_h_px = max(1, int(sprite["h"] * px_per_unit))

    if sprite["draw_mode"] == SPRITE_DRAW_MODE_TILED:
        tile_img = scale_image_to_world(
            sprite["image"],
            sprite["tile_w"],
            sprite["tile_h"],
            px_per_unit,
        )
        tile_w = tile_img.width
        tile_h = tile_img.height
        left = cx - world_w_px // 2
        top = cy - world_h_px // 2
        y = top
        while y < top + world_h_px:
            x = left
            row_h = min(tile_h, top + world_h_px - y)
            while x < left + world_w_px:
                col_w = min(tile_w, left + world_w_px - x)
                if col_w == tile_w and row_h == tile_h:
                    paste_at(canvas, tile_img, x, y)
                else:
                    piece = tile_img.crop((0, 0, col_w, row_h))
                    paste_at(canvas, piece, x, y)
                x += tile_w
            y += tile_h
        return

    img = scale_image_to_world(sprite["image"], sprite["w"], sprite["h"], px_per_unit)
    paste_centered(canvas, img, cx, cy)


def bake_prefab(
    name: str,
    sprites: list[dict],
    out_dir: Path,
    *,
    bounds_sprites: list[dict] | None = None,
) -> dict | None:
    if not sprites:
        return None

    bounds_sprites = bounds_sprites if bounds_sprites is not None else sprites
    corners: list[tuple[float, float]] = []
    for s in bounds_sprites:
        half_w = s["w"] / 2
        half_h = s["h"] / 2
        corners.extend(
            [
                (s["wx"] - half_w, s["wy"] - half_h),
                (s["wx"] + half_w, s["wy"] - half_h),
                (s["wx"] - half_w, s["wy"] + half_h),
                (s["wx"] + half_w, s["wy"] + half_h),
            ]
        )

    min_x = min(c[0] for c in corners)
    max_x = max(c[0] for c in corners)
    min_y = min(c[1] for c in corners)
    max_y = max(c[1] for c in corners)

    pad = WORLD_PADDING
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

    for sprite in sort_sprites_for_paste(sprites):
        paste_sprite(canvas, sprite, world_to_px, px_per_unit)

    safe_name = name.replace("/", "_").replace("\\", "_")
    out_path = out_dir / f"{safe_name}.png"
    baked_img = finalize_canvas(canvas)
    save_png_atomic(baked_img, out_path)
    baked_img.close()
    canvas.close()
    gc.collect()

    return {
        "prefabName": name,
        "imagePath": out_path.relative_to(ROOT).as_posix(),
        "width": width_u,
        "height": height_u,
        "originOffsetX": -min_x + pad,
        "originOffsetY": max_y + pad,
        "pixelWidth": canvas_w,
        "pixelHeight": canvas_h,
        "pixelsPerUnit": px_per_unit,
        "spriteCount": len(sprites),
    }


def find_prefab_root(by_id: dict, name: str):
    """Pick the GameObject with the most collected sprites when names collide."""
    best_tr = None
    best_count = -1

    for obj in by_id.values():
        if obj.type.name != "GameObject" or obj.read().m_Name != name:
            continue

        gd = obj.read()
        root_tr = comp_from_pair(by_id, gd.m_Component[0])
        if not root_tr:
            continue

        count = len(collect_sprites(root_tr, by_id))
        if count > best_count:
            best_count = count
            best_tr = root_tr

    return best_tr


def _all_go_names(by_id: dict) -> set[str]:
    names = set()
    for obj in by_id.values():
        if obj.type.name == "GameObject":
            try:
                names.add(obj.read().m_Name)
            except Exception:
                pass
    return names


def find_variant_fallback(name: str, available: set[str]) -> str | None:
    """
    If `name` ends with `_N`, try other `_N` suffixes of the same base.
    Returns the first available variant name, or None.
    """
    m = re.match(r"^(.+?)_(\d+)$", name)
    if not m:
        return None
    base = m.group(1)
    for n in range(1, 10):
        candidate = f"{base}_{n}"
        if candidate != name and candidate in available:
            return candidate
    return None


def load_merged_environment() -> dict:
    """SpriteRenderer sprites reference textures in terrainsatlas — both bundles are required."""
    by_id: dict = {}
    for label, bundle in [("terrains", TERRAINS_BUNDLE), ("terrainsatlas", TERRAINS_ATLAS_BUNDLE)]:
        print(f"  Loading {label}...")
        env = UnityPy.load(str(bundle))
        by_id.update({o.path_id: o for o in env.objects})
    return by_id


def bake_profile(profile: str, by_id: dict, terrain_names_sorted: list[str], chunk_sources: list[str]) -> int:
    config = BAKE_PROFILES[profile]
    out_dir: Path = config["out_dir"]
    manifest_out: Path = config["manifest_out"]

    print(
        f"\n=== Profile: {profile} ===\n{config['description']}\n"
        f"Output -> {out_dir.relative_to(ROOT)}",
        flush=True,
    )

    out_dir.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, dict] = {}
    baked = 0
    available_go_names = _all_go_names(by_id)

    for name in terrain_names_sorted:
        root_tr = find_prefab_root(by_id, name)
        fallback_name = None

        if not root_tr:
            fallback_name = find_variant_fallback(name, available_go_names)
            if fallback_name:
                root_tr = find_prefab_root(by_id, fallback_name)

        if not root_tr:
            print(f"  skip (no prefab): {name}")
            continue

        all_sprites = collect_sprites(root_tr, by_id)
        sprites = filter_prefab_sprites(profile, all_sprites)
        bounds_sprites = all_sprites if profile == "edges" else None
        meta = bake_prefab(name, sprites, out_dir, bounds_sprites=bounds_sprites)
        if meta:
            meta["bakeProfile"] = profile
            meta["sourceSpriteCount"] = len(all_sprites)
            if fallback_name:
                meta["fallbackFrom"] = fallback_name
            manifest[name] = meta
            baked += 1
            if baked % 20 == 0:
                print(f"  baked {baked}...")
        elif sprites:
            print(f"  skip (bake failed): {name} ({len(sprites)} sprites)")
        elif all_sprites:
            print(f"  skip (no sprites after {profile} filter): {name}")
        else:
            print(f"  skip (no sprites): {name}")

    manifest_out.parent.mkdir(parents=True, exist_ok=True)
    manifest_out.write_text(
        json.dumps(
            {
                "profile": profile,
                "description": config["description"],
                "chunkSource": "SLGMapChuck1.json",
                "chunkSources": chunk_sources,
                "bakedCount": baked,
                "pixelsPerUnit": PIXELS_PER_WORLD_UNIT,
                "prefabs": manifest,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Done [{profile}]: {baked}/{len(terrain_names_sorted)} prefabs -> {out_dir}")
    print(f"Manifest -> {manifest_out}")
    return baked


def main() -> None:
    parser = argparse.ArgumentParser(description="Bake SLG terrain prefabs to PNGs")
    parser.add_argument(
        "--profile",
        choices=[*BAKE_PROFILES.keys(), "all"],
        default="all",
        help="Bake profile: full (default game art), edges (no tiled ground/water), or all",
    )
    args = parser.parse_args()
    profiles = list(BAKE_PROFILES.keys()) if args.profile == "all" else [args.profile]

    print("Loading terrains + terrainsatlas bundles (may take a minute)...")
    by_id = load_merged_environment()

    terrain_names: set[str] = set()
    chunk_sources: list[str] = []
    for chunk_file in CHUNK_FILES:
        if not chunk_file.exists():
            continue
        chunk = json.loads(chunk_file.read_text(encoding="utf-8"))
        terrain_names.update(t["name"] for ch in chunk["chucks"] for t in ch.get("terrains", []))
        chunk_sources.append(chunk_file.name)

    terrain_names_sorted = sorted(terrain_names)
    print(
        f"Baking {len(terrain_names_sorted)} unique terrain prefabs "
        f"at {int(PIXELS_PER_WORLD_UNIT)} px/world-unit "
        f"from {', '.join(chunk_sources)}...",
        flush=True,
    )

    for profile in profiles:
        bake_profile(profile, by_id, terrain_names_sorted, chunk_sources)


if __name__ == "__main__":
    main()
