import struct

class FlatBufferReader:
    def __init__(self, buf: bytes):
        self.buf = buf

    def get_int32(self, pos):
        """Read a little-endian int32 at position"""
        return struct.unpack_from('<i', self.buf, pos)[0]

    def get_uint32(self, pos):
        """Read little-endian uint32 at position"""
        return struct.unpack_from('<I', self.buf, pos)[0]

    def get_string(self, pos):
        """Read a FlatBuffers string at position"""
        # First 4 bytes = string length
        str_len = self.get_int32(pos)
        start = pos + 4
        end = start + str_len
        return self.buf[start:end].decode('utf-8')

    def indirect(self, pos):
        """Read an offset stored at pos and return absolute position"""
        offset = self.get_int32(pos)
        return pos + offset

    def vector_len(self, pos):
        """Read length of FlatBuffers vector"""
        return self.get_int32(pos)

    def vector_elem(self, vector_pos, index):
        """Get position of the i-th element in vector"""
        # vector data starts 4 bytes after vector length
        return vector_pos + 4 + index * 4

# -------------------------
# Gacha config parser
# -------------------------
class SlgGachaConfig:
    def __init__(self, bytes_file_path):
        with open(bytes_file_path, 'rb') as f:
            self.buf = f.read()
        self.reader = FlatBufferReader(self.buf)
        self.root_pos = self.reader.get_uint32(0)  # FlatBuffers root starts at first 4 bytes
        self.data_map = {}
        self.load_datas()

    def load_datas(self):
        """Load all Gacha entries into a list and cache by ID"""
        # For simplicity, assume vector is at offset 4 (like Lua code)
        vector_offset_pos = self.root_pos + 4
        vector_pos = self.reader.indirect(vector_offset_pos)
        length = self.reader.vector_len(vector_pos)
        self.entries = []
        for i in range(length):
            elem_pos = self.reader.indirect(self.reader.vector_elem(vector_pos, i))
            entry = self.read_gacha(elem_pos)
            self.entries.append(entry)
            self.data_map[entry['id']] = entry

    def read_gacha(self, pos):
        """Read a single Gacha object at buffer pos"""
        # Assuming fields are at offsets: 4=id, 6=name, 8=weight
        # You may need to adjust offsets based on your actual binary
        id_field = self.reader.get_int32(pos + 4)
        # name string pointer
        name_pos = self.reader.indirect(pos + 6)
        name = self.reader.get_string(name_pos)
        weight = self.reader.get_int32(pos + 8)
        return {'id': id_field, 'name': name, 'weight': weight}

    def get(self, key):
        """Get entry by ID"""
        return self.data_map.get(key)

    def all(self):
        """Return all entries"""
        return self.entries

# -------------------------
# Example usage
# -------------------------
if __name__ == "__main__":
    gacha = SlgGachaConfig("C:/Users/Katie/CS/AS2/C/HW9/game-calculator/src/data/Slg_Gacha_fui.bytes")
    print("All entries:")
    for entry in gacha.all():
        print(entry)

    print("\nLookup ID=1001:")
    e = gacha.get(1001)
    print(e)
