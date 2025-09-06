import json

class SlgGachaConfig:
    def __init__(self, json_file_path: str):
        """
        Initialize by loading JSON data exported from Lua FlatBuffers
        """
        with open(json_file_path, 'r', encoding='utf-8') as f:
            self.sources = json.load(f)

        # Build a map for quick key lookup
        self.data_map = {entry['id']: entry for entry in self.sources}

    def get(self, key: int):
        """
        Get a single entry by its ID (like Lua's slgGachaConfig.Get)
        """
        entry = self.data_map.get(key)
        if not entry:
            print(f"[ERROR] slgGachaConfig: Could not find key {key}")
            return None
        return entry

    def all(self):
        """
        Return all entries (like iterating DatasLength + Datas in Lua)
        """
        return self.sources

# ---------------------------
# Example usage
# ---------------------------
if __name__ == "__main__":
    # Path to JSON file exported from Lua
    gacha_config = SlgGachaConfig("gacha.json")

    # Example: get entry by key
    key = 1001
    entry = gacha_config.get(key)
    if entry:
        print(f"Entry {key}: {entry}")

    # Example: iterate all entries
    for entry in gacha_config.all():
        print(f"ID: {entry['id']}, Name: {entry.get('name')}, Weight: {entry.get('weight')}")