"""Shared helpers for Sinistra terrain PNG bakes.

Offline bake only — no Unity runtime. UnityPy extracts sprite RGBA from APK
bundles; we flatten SpriteRenderer layers to PNGs for browser SVG <image> tags.

Baseline pipeline: raw sprites, alpha_composite layering, zero transparent rgb.
"""

from __future__ import annotations

import time
from pathlib import Path

import numpy as np
from PIL import Image

SPRITE_DRAW_MODE_TILED = 2


def is_prefab_tiled_fill(sprite: dict) -> bool:
    """True for Unity SpriteRenderer tiled fills (chunk-style ground/water under edge art)."""
    return int(sprite.get("draw_mode", 0) or 0) == SPRITE_DRAW_MODE_TILED


def filter_prefab_sprites(profile: str, sprites: list[dict]) -> list[dict]:
    """Return sprites to include for a bake profile."""
    if profile == "full":
        return sprites
    if profile == "edges":
        return [sprite for sprite in sprites if not is_prefab_tiled_fill(sprite)]
    raise ValueError(f"Unknown prefab bake profile: {profile}")


def sprite_pixels_per_unit(sprite_data) -> float:
    return float(getattr(sprite_data, "m_PixelsPerUnit", None) or 100)


def prepare_sprite(img: Image.Image) -> Image.Image:
    """UnityPy RGBA as-is — no per-sprite alpha processing."""
    return img.convert("RGBA")


def scale_image_to_world(
    img: Image.Image,
    world_w: float,
    world_h: float,
    px_per_unit: float,
) -> Image.Image:
    target_w = max(1, int(world_w * px_per_unit))
    target_h = max(1, int(world_h * px_per_unit))
    img = img.convert("RGBA")
    if img.width == target_w and img.height == target_h:
        return img
    return img.resize((target_w, target_h), Image.Resampling.NEAREST)


def paste_at(canvas: Image.Image, img: Image.Image, left: int, top: int) -> None:
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    overlay.paste(img, (left, top))
    composed = Image.alpha_composite(canvas, overlay)
    canvas.paste(composed, (0, 0))


def paste_centered(canvas: Image.Image, img: Image.Image, center_x: int, center_y: int) -> None:
    paste_at(canvas, img, int(center_x - img.width / 2), int(center_y - img.height / 2))


def finalize_canvas(canvas: Image.Image) -> Image.Image:
    arr = np.array(canvas.convert("RGBA"), copy=True)
    arr[arr[:, :, 3] == 0, :3] = 0
    return Image.fromarray(arr, "RGBA")


def save_png_atomic(img: Image.Image, out_path: Path, *, retries: int = 5) -> None:
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = out_path.with_name(f"{out_path.stem}.tmp{out_path.suffix}")

    last_error: OSError | None = None
    for attempt in range(retries):
        try:
            img.save(tmp_path, format="PNG")
            if out_path.exists():
                out_path.unlink()
            tmp_path.replace(out_path)
            return
        except OSError as exc:
            last_error = exc
            if tmp_path.exists():
                try:
                    tmp_path.unlink()
                except OSError:
                    pass
            time.sleep(0.3 * (attempt + 1))

    if last_error is not None:
        raise last_error
    raise OSError(f"Failed to save {out_path}")
