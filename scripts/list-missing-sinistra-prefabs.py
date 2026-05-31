"""List terrain names referenced in SLGMapChuck JSON but missing from baked prefab PNGs."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MONO_DIR = ROOT / "DataMineRaw/Game of Vampires_ Twilight Sun_1.048.007_APKPure.zip/base_assets/formatted/MonoBehaviour"
CHUNK_FILES = [
    MONO_DIR / "SLGMapChuck1.json",
    MONO_DIR / "SLGMapChuck2.json",
    MONO_DIR / "SLGMapChuck.json",
]
MANIFEST = ROOT / "src/data/sinistraPrefabManifest.json"
OUT = ROOT / "src/data/sinistraMissingPrefabs.json"


def main() -> None:
    names: set[str] = set()
    sources: list[str] = []
    for chunk_file in CHUNK_FILES:
        if not chunk_file.exists():
            continue
        chunk = json.loads(chunk_file.read_text(encoding="utf-8"))
        file_names = {terrain["name"] for ch in chunk["chucks"] for terrain in ch.get("terrains", [])}
        names |= file_names
        sources.append(chunk_file.name)

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    baked = set(manifest.get("prefabs", {}))
    missing = sorted(names - baked)

    report = {
        "chunkSources": sources,
        "uniqueTerrainNamesInChunks": len(names),
        "bakedPrefabCount": len(baked),
        "missingBakeCount": len(missing),
        "missingBakeNames": missing,
        "reason": (
            "Bake script looks up each name as a GameObject in Unity terrains/terrainsatlas bundles. "
            "Missing names are referenced on the map JSON but have no matching prefab object in those exports."
        ),
    }

    OUT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Unique terrain names across chunks: {len(names)}")
    print(f"Baked prefabs in manifest: {len(baked)}")
    print(f"Missing: {len(missing)}")
    print(f"Wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
