"""Bake single SLG plot01 cell tiles for manual map placement (1x1 .. NxN repeats)."""

from __future__ import annotations

import json
from pathlib import Path

import UnityPy
from PIL import Image

from sinistra_bake_utils import (
    finalize_canvas,
    prepare_sprite,
    save_png_atomic,
    scale_image_to_world,
    sprite_pixels_per_unit,
)

ROOT = Path(__file__).resolve().parents[1]
PLOT01_BUNDLE = (
    ROOT / "DataMineRaw/Game of Vampires_ Twilight Sun_1.048.007_APKPure.zip"
    / "base_assets/assets/scenes/slg/terrainsatlas/plot01"
)
OUT_DIR = ROOT / "DataMineRaw/extracted/slg/plot_tiles"
MANIFEST_OUT = ROOT / "src/data/sinistraPlotTileManifest.json"

# One chunk ground micro-cell (100 world units / ~40 tilemap cells).
CELL_WORLD_SIZE = 100.0 / 40.0
PX_PER_UNIT = 50.0

# One representative sprite per biome (first match in plot01 bundle).
TILE_TYPES: list[tuple[str, str, str]] = [
    ("wild", "Wild / wasteland", "荒地"),
    ("snow", "Snow", "雪山"),
    ("volcano", "Volcano", "火山"),
    ("ocean", "Ocean / water", "海洋"),
    ("castle", "Castle / city", "王城"),
]


def load_plot01_sprites() -> list[tuple[str, Image.Image, float, float]]:
    env = UnityPy.load(str(PLOT01_BUNDLE))
    sprites: list[tuple[str, Image.Image, float, float]] = []
    for obj in env.objects:
        if obj.type.name != "Sprite":
            continue
        data = obj.read()
        name = data.m_Name
        try:
            img = prepare_sprite(data.image.convert("RGBA"))
        except Exception:
            continue
        rect = data.m_Rect
        ppu = sprite_pixels_per_unit(data)
        width_u = float(rect.width) / ppu
        height_u = float(rect.height) / ppu
        sprites.append((name, img, width_u, height_u))
    return sprites


def pick_sprite(sprites: list[tuple[str, Image.Image, float, float]], needle: str):
    for entry in sprites:
        if needle in entry[0]:
            return entry
    return None


def bake_cell_tile(key: str, label: str, sprite_entry) -> dict:
    name, img, width_u, height_u = sprite_entry
    baked = scale_image_to_world(img, CELL_WORLD_SIZE, CELL_WORLD_SIZE, PX_PER_UNIT)
    canvas = Image.new("RGBA", (baked.width, baked.height), (0, 0, 0, 0))
    canvas.paste(baked, (0, 0), baked)
    finalized = finalize_canvas(canvas)
    out_path = OUT_DIR / f"{key}.png"
    save_png_atomic(finalized, out_path)
    finalized.close()
    canvas.close()
    baked.close()

    return {
        "tileKey": key,
        "label": label,
        "sourceSprite": name,
        "imagePath": out_path.relative_to(ROOT).as_posix(),
        "cellWorldSize": CELL_WORLD_SIZE,
        "pixelWidth": int(CELL_WORLD_SIZE * PX_PER_UNIT),
        "pixelHeight": int(CELL_WORLD_SIZE * PX_PER_UNIT),
        "pixelsPerUnit": PX_PER_UNIT,
    }


def main() -> None:
    print("Loading plot01 sprites...", flush=True)
    sprites = load_plot01_sprites()
    print(f"  {len(sprites)} sprites", flush=True)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, dict] = {}

    for key, label, needle in TILE_TYPES:
        sprite_entry = pick_sprite(sprites, needle)
        if not sprite_entry:
            print(f"  skip (no sprite): {key} ({needle})")
            continue
        manifest[key] = bake_cell_tile(key, label, sprite_entry)
        print(f"  baked {key} <- {sprite_entry[0]}")

    MANIFEST_OUT.write_text(
        json.dumps(
            {
                "cellWorldSize": CELL_WORLD_SIZE,
                "pixelsPerUnit": PX_PER_UNIT,
                "bakedCount": len(manifest),
                "tiles": manifest,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Done: {len(manifest)} tile types -> {OUT_DIR}")
    print(f"Manifest -> {MANIFEST_OUT}")


if __name__ == "__main__":
    main()
