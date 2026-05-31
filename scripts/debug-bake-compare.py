"""Compare overlap test vs exact bake pipeline to find what breaks the prefab."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "DataMineRaw/extracted/slg/debug/bake_compare"
PREFAB = sys.argv[1] if len(sys.argv) > 1 else "Bridge_CentralCastle_L"

# Load bake module without running main
spec = importlib.util.spec_from_file_location(
    "bake_prefabs",
    ROOT / "scripts/bake-sinistra-terrain-prefabs.py",
)
bake = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bake)


def pixel_diff(a: Image.Image, b: Image.Image) -> dict:
    aa = np.array(a.convert("RGBA"))
    bb = np.array(b.convert("RGBA"))
    if aa.shape != bb.shape:
        return {"same_shape": False, "a": aa.shape, "b": bb.shape}
    d = np.abs(aa.astype(int) - bb.astype(int))
    return {
        "same_shape": True,
        "max_diff": int(d.max()),
        "mean_diff": float(d.mean()),
        "pixels_identical": int((d.sum(axis=2) == 0).sum()),
        "pixels_total": aa.shape[0] * aa.shape[1],
    }


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    print(f"Loading bundles for {PREFAB}...")
    by_id = bake.load_merged_environment()
    root_tr = bake.find_prefab_root(by_id, PREFAB)
    if not root_tr:
        raise SystemExit(f"Prefab not found: {PREFAB}")

    all_sprites = bake.collect_sprites(root_tr, by_id)
    sorted_all = bake.sort_sprites_for_paste(all_sprites)
    overlays = [s for s in sorted_all if s["draw_mode"] != bake.SPRITE_DRAW_MODE_TILED]
    fills = [s for s in sorted_all if s["draw_mode"] == bake.SPRITE_DRAW_MODE_TILED]

    print(f"  {len(sorted_all)} layers: {len(fills)} tiled fills, {len(overlays)} overlays")

    def render(layers: list[dict], label: str) -> Image.Image:
        meta = bake.bake_prefab(f"__tmp_{label}", layers)
        path = bake.OUT_DIR / f"__tmp_{label}.png"
        img = Image.open(path).convert("RGBA")
        out = OUT / f"{label}.png"
        img.save(out)
        path.unlink(missing_ok=True)
        print(f"  wrote {out.relative_to(ROOT)} ({img.size})")
        return img

    # Exact full pipeline
    full = render(sorted_all, "exact_full_bake")

    # Overlays only (what overlap test approximates)
    overlays_only = render(overlays, "overlays_only_bake")

    # Tiled fills only
    fills_only = render(fills, "tiled_fills_only_bake")

    # Fills first then overlays (same as full, explicit)
    fills_then_overlays = render(fills + overlays, "fills_then_overlays")

    baked_path = ROOT / "DataMineRaw/extracted/slg/terrain_prefabs" / f"{PREFAB}.png"
    on_disk = Image.open(baked_path).convert("RGBA") if baked_path.exists() else None

    comparisons = [
        ("exact_full vs on_disk", full, on_disk),
        ("overlays_only vs exact_full", overlays_only, full),
        ("tiled_fills_only vs exact_full", fills_only, full),
        ("fills_then_overlays vs exact_full", fills_then_overlays, full),
    ]

    report_lines = [f"Prefab: {PREFAB}", ""]
    for name, a, b in comparisons:
        if b is None:
            report_lines.append(f"{name}: on_disk missing")
            continue
        if a.size != b.size:
            report_lines.append(f"{name}: SIZE MISMATCH {a.size} vs {b.size}")
            continue
        report_lines.append(f"{name}: {pixel_diff(a, b)}")

    report = "\n".join(report_lines)
    (OUT / "diff_report.txt").write_text(report, encoding="utf-8")
    print()
    print(report)

    # Visual: difference heatmap overlays_only vs full
    if overlays_only.size == full.size:
        aa = np.array(overlays_only.convert("RGBA"), dtype=int)
        bb = np.array(full.convert("RGBA"), dtype=int)
        diff = np.abs(aa - bb)
        mag = diff[:, :, :3].max(axis=2)
        heat = np.zeros((*mag.shape, 3), dtype=np.uint8)
        heat[:, :, 0] = np.clip(mag * 4, 0, 255)
        heat[:, :, 1] = np.clip(np.maximum(0, 128 - mag * 2), 0, 255)
        Image.fromarray(heat).save(OUT / "diff_heatmap_overlays_vs_full.png")

        # Where full differs: is it mostly alpha or rgb?
        alpha_diff = diff[:, :, 3]
        rgb_diff = diff[:, :, :3].max(axis=2)
        report_lines.append("")
        report_lines.append(f"overlays vs full: pixels with alpha diff>0: {(alpha_diff>0).sum()}")
        report_lines.append(f"overlays vs full: pixels with rgb diff>10: {(rgb_diff>10).sum()}")
        (OUT / "diff_report.txt").write_text("\n".join(report_lines), encoding="utf-8")


if __name__ == "__main__":
    main()
