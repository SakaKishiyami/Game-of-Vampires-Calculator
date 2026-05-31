"""Extract one terrain prefab recipe and diagnose transparent-edge halos.

Usage:
  python scripts/debug-prefab-alpha.py Bridge_CentralCastle_L
  python scripts/debug-prefab-alpha.py Grey_LeftDown_1

Writes to DataMineRaw/extracted/slg/debug/<prefab>_recipe.json
and diagnostic PNGs comparing the baked prefab on black / white / green backgrounds.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import UnityPy
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ZIP = ROOT / "DataMineRaw/Game of Vampires_ Twilight Sun_1.048.007_APKPure.zip"
TERRAINS = ZIP / "base_assets/assets/scenes/slg/terrains"
TERRAINS_ATLAS = ZIP / "base_assets/assets/scenes/slg/terrainsatlas"
BAKED_DIR = ROOT / "DataMineRaw/extracted/slg/terrain_prefabs"
OUT_DIR = ROOT / "DataMineRaw/extracted/slg/debug"


def load_env() -> dict:
    by_id: dict = {}
    for bundle in (TERRAINS, TERRAINS_ATLAS):
        env = UnityPy.load(str(bundle))
        by_id.update({obj.path_id: obj for obj in env.objects})
    return by_id


def resolve(by_id: dict, ptr):
    return by_id.get(ptr.path_id) if ptr else None


def comp_from_pair(by_id: dict, pair):
    ptr = pair.component if hasattr(pair, "component") else pair
    return resolve(by_id, ptr)


def find_root(by_id: dict, prefab_name: str):
    best_tr = None
    best_count = -1

    def count_sprites(tr_obj) -> int:
        total = 0
        t = tr_obj.read()
        go = resolve(by_id, t.m_GameObject)
        if go:
            for pair in go.read().m_Component:
                c = comp_from_pair(by_id, pair)
                if c and c.type.name == "SpriteRenderer":
                    total += 1
        for child in t.m_Children:
            c = resolve(by_id, child)
            if c and c.type.name == "Transform":
                total += count_sprites(c)
        return total

    for obj in by_id.values():
        if obj.type.name != "GameObject" or obj.read().m_Name != prefab_name:
            continue
        tr = comp_from_pair(by_id, obj.read().m_Component[0])
        if not tr:
            continue
        n = count_sprites(tr)
        if n > best_count:
            best_count = n
            best_tr = tr
    return best_tr


def collect_layers(
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

    layers: list[dict] = []
    go = resolve(by_id, t.m_GameObject)
    if go:
        gd = go.read()
        for comp_index, pair in enumerate(gd.m_Component):
            c = comp_from_pair(by_id, pair)
            if c and c.type.name == "SpriteRenderer":
                sr = c.read()
                sp = resolve(by_id, sr.m_Sprite)
                if sp and sp.type.name == "Sprite":
                    sd = sp.read()
                    rect = sd.m_Rect
                    ppu = float(getattr(sd, "m_PixelsPerUnit", None) or 100)
                    layers.append(
                        {
                            "goName": gd.m_Name,
                            "spriteName": sd.m_Name,
                            "worldX": round(world_x, 3),
                            "worldY": round(world_y, 3),
                            "scaleX": round(scale_x, 4),
                            "scaleY": round(scale_y, 4),
                            "spriteWpx": int(rect.width),
                            "spriteHpx": int(rect.height),
                            "ppu": ppu,
                            "drawMode": int(getattr(sr, "m_DrawMode", 0) or 0),
                            "drawModeLabel": "tiled" if int(getattr(sr, "m_DrawMode", 0) or 0) == 2 else "simple",
                            "sortOrder": int(getattr(sr, "m_SortingOrder", 0) or 0),
                            "depth": depth,
                            "sibling": sibling,
                            "comp": comp_index,
                        }
                    )

    for child_index, child in enumerate(t.m_Children):
        c = resolve(by_id, child)
        if c and c.type.name == "Transform":
            layers.extend(
                collect_layers(
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

    return layers


def sprite_alpha_report(by_id: dict, sprite_name: str) -> dict | None:
    for obj in by_id.values():
        if obj.type.name != "Sprite":
            continue
        sd = obj.read()
        if sd.m_Name != sprite_name:
            continue

        arr = np.array(sd.image.convert("RGBA"))
        alpha = arr[:, :, 3]
        rgb = arr[:, :, :3].astype(float)

        dirty = int(((alpha == 0) & (rgb.sum(axis=2) > 0)).sum())
        edge = (alpha > 0) & (alpha < 255)
        faint = (alpha > 0) & (alpha < 32)

        report: dict = {
            "spriteName": sprite_name,
            "sizePx": [int(arr.shape[1]), int(arr.shape[0])],
            "dirtyTransparentPixels": dirty,
            "semiTransparentEdgePixels": int(edge.sum()),
            "veryFaintPixelsAlphaLt32": int(faint.sum()),
        }

        if faint.sum() > 0:
            faint_rgb = rgb[faint] / 255.0
            faint_alpha = alpha[faint].astype(float) / 255.0
            opaque = alpha > 240
            if opaque.sum() > 100:
                interior = arr[:, :, :3][opaque].mean(axis=0)
                fringe = arr[:, :, :3][faint].mean(axis=0)
                af = alpha[faint].mean() / 255.0
                bg_est = (fringe - af * interior) / max(1.0 - af, 0.01)
                report["opaqueInteriorMeanRgb"] = [round(float(x), 1) for x in interior]
                report["estimatedFringeAuthoredAgainstRgb"] = [round(float(x), 1) for x in bg_est]
                report["faintPixelMeanAlpha"] = round(float(alpha[faint].mean()), 1)

        return report
    return None


def baked_halo_report(img: Image.Image) -> dict:
    arr = np.array(img.convert("RGBA"))
    alpha = arr[:, :, 3]
    rgb = arr[:, :, :3].astype(float)

    edge = (alpha > 0) & (alpha < 255)
    edge_alpha = alpha[edge].astype(float) / 255.0
    edge_rgb = rgb[edge]

    on_white = edge_alpha[:, None] * edge_rgb + (1.0 - edge_alpha[:, None]) * 255.0
    on_black = edge_alpha[:, None] * edge_rgb

    dark_on_white = int((on_white.mean(axis=1) < 200).sum())
    light_on_black = int((on_black.mean(axis=1) > 30).sum())

    return {
        "dirtyTransparentPixels": int(((alpha == 0) & (rgb.sum(axis=2) > 0)).sum()),
        "semiTransparentEdgePixels": int(edge.sum()),
        "edgePixelsDarkOnWhiteBackground": dark_on_white,
        "edgePixelsLightOnBlackBackground": light_on_black,
        "note": (
            "Same anti-aliased edge pixels look dark on white and light on black. "
            "This is expected with straight-alpha sprites unless fringe color matches the map background."
        ),
    }


def save_background_strip(img: Image.Image, out_path: Path) -> None:
    arr = np.array(img.convert("RGBA"))
    alpha = arr[:, :, 3]
    ys, xs = np.where(alpha > 10)
    if len(xs) == 0:
        img.save(out_path)
        return

    pad = 20
    x0 = max(0, int(xs.min()) - pad)
    y0 = max(0, int(ys.min()) - pad)
    x1 = min(img.width, int(xs.max()) + pad)
    y1 = min(img.height, int(ys.max()) + pad)
    crop = img.crop((x0, y0, x1, y1))

    def on_bg(color: tuple[int, int, int]) -> Image.Image:
        bg = Image.new("RGBA", crop.size, (*color, 255))
        return Image.alpha_composite(bg, crop)

    strip = Image.new("RGB", (crop.width * 3, crop.height))
    for index, color in enumerate([(0, 0, 0), (255, 255, 255), (40, 80, 40)]):
        strip.paste(on_bg(color).convert("RGB"), (index * crop.width, 0))
    strip.save(out_path)


def main() -> None:
    prefab_name = sys.argv[1] if len(sys.argv) > 1 else "Bridge_CentralCastle_L"
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Loading bundles for {prefab_name}...")
    by_id = load_env()
    root_tr = find_root(by_id, prefab_name)
    if not root_tr:
        raise SystemExit(f"Prefab not found in terrains bundle: {prefab_name}")

    layers = collect_layers(root_tr, by_id)
    layers.sort(
        key=lambda layer: (
            layer["sortOrder"],
            layer["depth"],
            layer["sibling"],
            layer["comp"],
        ),
    )

    unique_sprites = sorted({layer["spriteName"] for layer in layers})
    sprite_reports = []
    for sprite_name in unique_sprites[:12]:
        report = sprite_alpha_report(by_id, sprite_name)
        if report:
            sprite_reports.append(report)

    recipe_path = OUT_DIR / f"{prefab_name}_recipe.json"
    recipe_path.write_text(
        json.dumps(
            {
                "prefab": prefab_name,
                "layerCount": len(layers),
                "uniqueSpriteCount": len(unique_sprites),
                "layers": layers,
                "sourceSpriteAlphaReports": sprite_reports,
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    print(f"Recipe -> {recipe_path.relative_to(ROOT)} ({len(layers)} layers)")

    baked_path = BAKED_DIR / f"{prefab_name}.png"
    if baked_path.exists():
        baked = Image.open(baked_path)
        halo = baked_halo_report(baked)
        halo_path = OUT_DIR / f"{prefab_name}_halo_report.json"
        halo_path.write_text(json.dumps(halo, indent=2), encoding="utf-8")
        strip_path = OUT_DIR / f"{prefab_name}_on_black_white_green.png"
        save_background_strip(baked, strip_path)
        print(f"Halo report -> {halo_path.relative_to(ROOT)}")
        print(f"Background strip -> {strip_path.relative_to(ROOT)}")
        print(json.dumps(halo, indent=2))
    else:
        print(f"No baked PNG at {baked_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
