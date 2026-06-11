"""Report composite bake progress and what is viewable on the map."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROGRESS = ROOT / ".cache/sinistra-composite-bake-progress.json"
CHUNK_MANIFEST = ROOT / "src/data/sinistraChunkCompositeManifest.json"
FULL_MANIFEST = ROOT / "src/data/sinistraFullCompositeManifest.json"
SPRITE_MANIFEST = ROOT / "src/data/sinistraSpriteManifest.json"
PREFAB_MANIFEST = ROOT / "src/data/sinistraPrefabManifest.json"
CHUNK_GROUND = ROOT / "src/data/sinistraChunkGroundManifest.json"


def read_json(path: Path) -> dict:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    progress = read_json(PROGRESS)
    chunk = read_json(CHUNK_MANIFEST)
    full = read_json(FULL_MANIFEST)
    sprite = read_json(SPRITE_MANIFEST)
    prefab = read_json(PREFAB_MANIFEST)
    ground = read_json(CHUNK_GROUND)

    print("=== Viewable now on /sinistra ===")
    print(f"  1. Per-prefab:     {'READY' if prefab.get('bakedCount', 0) else 'needs bake'} ({prefab.get('bakedCount', 0)} prefabs)")
    print(f"     Chunk ground:   {ground.get('bakedCount', 0)} chunks (separate layer)")
    print(f"  2. Chunk composite: {chunk.get('bakedCount', 0)} chunks baked")
    print(f"  3. Full composite:  {'READY' if full.get('baked') else 'not baked'}")
    print(f"  4. Sprite manifest: {sprite.get('spriteCount', 0)} sprites")

    if progress:
        print("\n=== Active / last bake progress ===")
        print(f"  Status:   {progress.get('status', 'unknown')}")
        print(f"  Phase:    {progress.get('phase', '?')}")
        print(f"  Profile:  {progress.get('profile', '?')}")
        if progress.get("targetChunks"):
            print(
                f"  Chunks:   {progress.get('completedChunks', 0)}/{progress.get('targetChunks')} "
                f"({progress.get('percentComplete', 0)}%)"
            )
        if progress.get("currentChunk"):
            print(f"  Current:  {progress['currentChunk']}")
        if progress.get("elapsedSeconds") is not None:
            print(f"  Elapsed:  {progress['elapsedSeconds']}s")
        if progress.get("estimatedSecondsRemaining") is not None:
            eta = progress["estimatedSecondsRemaining"]
            print(f"  ETA:      ~{eta}s (~{eta / 60:.1f} min)")
        if progress.get("updatedAt"):
            print(f"  Updated:  {progress['updatedAt']}")
    else:
        print("\n=== Bake progress ===")
        print("  No active progress file. Run: npm run bake:sinistra-composite-preview")

    png_count = len(list((ROOT / "DataMineRaw/extracted/slg/chunk_composites").glob("*.png")))
    if png_count:
        print(f"\n  PNG files on disk: {png_count} (refresh /sinistra after manifest updates)")


if __name__ == "__main__":
    main()
