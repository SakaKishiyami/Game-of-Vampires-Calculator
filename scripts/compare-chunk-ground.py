"""Compare chunk ground bakes against SLGMapChuck*.json chunk keys."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "src/data/sinistraChunkGroundManifest.json"
MONO = ROOT / "DataMineRaw/Game of Vampires_ Twilight Sun_1.048.007_APKPure.zip/base_assets/formatted/MonoBehaviour"
CHUNK_FILES = [
    MONO / "SLGMapChuck1.json",
    MONO / "SLGMapChuck2.json",
    MONO / "SLGMapChuck.json",
]


def format_coord(value: float) -> str:
    rounded = round(value * 1000) / 1000
    if abs(rounded - round(rounded)) < 1e-6:
        return str(int(round(rounded)))
    return str(rounded)


def chunk_key(position: dict, size: int = 100) -> str:
    return f"{format_coord(position['x'])}_{format_coord(position['y'])}_{size}_{size}"


def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    baked = set(manifest.get("chunks", {}).keys())
    chuck: set[str] = set()
    terrain_count = 0
    sources: list[str] = []
    has_chuck1 = CHUNK_FILES[0].exists()

    for chunk_file in CHUNK_FILES:
        if not chunk_file.exists():
            continue
        if chunk_file.name == "SLGMapChuck.json" and has_chuck1:
            continue
        sources.append(chunk_file.name)
        data = json.loads(chunk_file.read_text(encoding="utf-8"))
        for chunk in data.get("chucks", []):
            chuck.add(chunk_key(chunk["position"]))
            terrain_count += len(chunk.get("terrains", []))

    missing = sorted(chuck - baked)
    extra = sorted(baked - chuck)

    print(f"baked chunk grounds: {len(baked)}")
    print(f"chuck JSON chunks: {len(chuck)} (from {', '.join(sources) or 'none'})")
    print(f"terrain entries: {terrain_count}")
    print(f"chuck WITHOUT ground bake: {len(missing)}")
    if missing:
        print(f"  sample: {missing[:8]}")
    print(f"ground bakes NOT in chuck: {len(extra)}")
    if extra:
        print(f"  sample: {extra[:8]}")


if __name__ == "__main__":
    main()
