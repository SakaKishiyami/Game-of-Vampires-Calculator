"""Overlap many ground overlay sprites progressively to reproduce fringe stacking."""

from __future__ import annotations

import sys
from collections import defaultdict
from pathlib import Path

import UnityPy
from PIL import Image

from sinistra_bake_utils import (
    SPRITE_DRAW_MODE_TILED,
    finalize_canvas,
    paste_centered,
    prepare_sprite,
    scale_image_to_world,
    sprite_pixels_per_unit,
)

ROOT = Path(__file__).resolve().parents[1]
ZIP = ROOT / "DataMineRaw/Game of Vampires_ Twilight Sun_1.048.007_APKPure.zip"
OUT = ROOT / "DataMineRaw/extracted/slg/debug/overlap_test"
PREFAB = sys.argv[1] if len(sys.argv) > 1 else "Bridge_CentralCastle_L"
PX = 100.0


def load_env() -> dict:
    by_id: dict = {}
    for bundle in (
        ZIP / "base_assets/assets/scenes/slg/terrains",
        ZIP / "base_assets/assets/scenes/slg/terrainsatlas",
    ):
        env = UnityPy.load(str(bundle))
        by_id.update({obj.path_id: obj for obj in env.objects})
    return by_id


def resolve(by_id: dict, ptr):
    return by_id.get(ptr.path_id) if ptr else None


def comp_from_pair(by_id: dict, pair):
    ptr = pair.component if hasattr(pair, "component") else pair
    return resolve(by_id, ptr)


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
    go = resolve(by_id, t.m_GameObject)
    if go:
        for comp_index, pair in enumerate(go.read().m_Component):
            c = comp_from_pair(by_id, pair)
            if c and c.type.name == "SpriteRenderer":
                sr = c.read()
                sp = resolve(by_id, sr.m_Sprite)
                if sp and sp.type.name == "Sprite":
                    sd = sp.read()
                    try:
                        img = prepare_sprite(sd.image.convert("RGBA"))
                    except Exception:
                        continue

                    draw_mode = int(getattr(sr, "m_DrawMode", 0) or 0)
                    rect = sd.m_Rect
                    ppu = sprite_pixels_per_unit(sd)
                    tile_w = float(rect.width) / ppu * scale_x
                    tile_h = float(rect.height) / ppu * scale_y
                    w_u, h_u = tile_w, tile_h
                    if draw_mode != 0 and hasattr(sr, "m_Size"):
                        size = sr.m_Size
                        w_u = float(size.x) * scale_x
                        h_u = float(size.y) * scale_y

                    sprites.append(
                        {
                            "name": sd.m_Name,
                            "wx": world_x,
                            "wy": world_y,
                            "w": w_u,
                            "h": h_u,
                            "image": img,
                            "draw_mode": draw_mode,
                            "sort_order": int(getattr(sr, "m_SortingOrder", 0) or 0),
                            "depth": depth,
                            "sibling": sibling,
                            "comp": comp_index,
                        }
                    )

    for child_index, child in enumerate(t.m_Children):
        c = resolve(by_id, child)
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


def find_root(by_id: dict, prefab_name: str):
    best_tr = None
    best_count = -1
    for obj in by_id.values():
        if obj.type.name != "GameObject" or obj.read().m_Name != prefab_name:
            continue
        tr = comp_from_pair(by_id, obj.read().m_Component[0])
        if not tr:
            continue
        count = len(collect_sprites(tr, by_id))
        if count > best_count:
            best_count = count
            best_tr = tr
    return best_tr


def bounds_for(layers: list[dict], pad: float = 4.0) -> tuple[float, float, float, float]:
    corners: list[tuple[float, float]] = []
    for sprite in layers:
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
    return min_x - pad, max_x + pad, min_y - pad, max_y + pad


def bake_layers(
    layers: list[dict],
    min_x: float,
    max_x: float,
    min_y: float,
    max_y: float,
    bg: tuple[int, int, int, int],
) -> Image.Image:
    width = max(1, int((max_x - min_x) * PX))
    height = max(1, int((max_y - min_y) * PX))
    canvas = Image.new("RGBA", (width, height), bg)

    def world_to_px(wx: float, wy: float) -> tuple[int, int]:
        x = int((wx - min_x) * PX)
        y = int((max_y - wy) * PX)
        return x, y

    for sprite in layers:
        cx, cy = world_to_px(sprite["wx"], sprite["wy"])
        img = scale_image_to_world(sprite["image"], sprite["w"], sprite["h"], PX)
        paste_centered(canvas, img, cx, cy)

    return finalize_canvas(canvas)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    by_id = load_env()
    root_tr = find_root(by_id, PREFAB)
    if not root_tr:
        raise SystemExit(f"Prefab not found: {PREFAB}")

    all_sprites = collect_sprites(root_tr, by_id)
    all_sprites.sort(key=lambda s: (s["sort_order"], s["depth"], s["sibling"], s["comp"]))
    overlays = [s for s in all_sprites if s["draw_mode"] != SPRITE_DRAW_MODE_TILED]
    fills = [s for s in all_sprites if s["draw_mode"] == SPRITE_DRAW_MODE_TILED]

    print(f"{PREFAB}: {len(all_sprites)} total, {len(overlays)} overlays, {len(fills)} tiled fills")

    min_x, max_x, min_y, max_y = bounds_for(overlays)

    def world_to_px(wx: float, wy: float) -> tuple[int, int]:
        x = int((wx - min_x) * PX)
        y = int((max_y - wy) * PX)
        return x, y

    counts = [1, 3, 5, 10, 20, 40, 80, len(overlays)]
    for count in counts:
        n = min(count, len(overlays))
        for bg_name, bg in [("black", (0, 0, 0, 255)), ("white", (255, 255, 255, 255))]:
            img = bake_layers(overlays[:n], min_x, max_x, min_y, max_y, bg)
            img.save(OUT / f"overlay_{n:03d}_on_{bg_name}.png")

    full_green = bake_layers(overlays, min_x, max_x, min_y, max_y, (40, 80, 40, 255))
    full_green.save(OUT / "overlay_ALL_on_green.png")

    baked_path = ROOT / "DataMineRaw/extracted/slg/terrain_prefabs" / f"{PREFAB}.png"
    if baked_path.exists():
        Image.open(baked_path).convert("RGBA").save(OUT / "actual_baked_prefab.png")

    cell = 50
    grid: dict[tuple[int, int], int] = defaultdict(int)
    for sprite in overlays:
        grid[(int(sprite["wx"] // cell), int(sprite["wy"] // cell))] += 1
    hot_x, hot_y = max(grid.items(), key=lambda item: item[1])[0]
    hx, hy = world_to_px(hot_x * cell + cell / 2, hot_y * cell + cell / 2)
    width = max(1, int((max_x - min_x) * PX))
    height = max(1, int((max_y - min_y) * PX))
    left = max(0, hx - 200)
    top = max(0, hy - 200)
    right = min(width, hx + 200)
    bottom = min(height, hy + 200)
    if right <= left or bottom <= top:
        left, top, right, bottom = 0, 0, min(width, 400), min(height, 400)
    crop_box = (left, top, right, bottom)

    for count in [5, 20, len(overlays)]:
        n = min(count, len(overlays))
        img = bake_layers(overlays[:n], min_x, max_x, min_y, max_y, (0, 0, 0, 255))
        img.crop(crop_box).save(OUT / f"zoom_hotspot_{n:03d}.png")

    print(f"Saved progressive overlap images -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
