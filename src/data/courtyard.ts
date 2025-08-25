// Courtyard level data based on the provided table
// cost = points needed to upgrade, points = attribute increase amount
// For singles: flat value, for dual: x2, for all: x4

export const courtyardLevels = [
  { level: 1, cost: 10, points: 500 },
  { level: 2, cost: 10, points: 500 },
  { level: 3, cost: 10, points: 500 },
  { level: 4, cost: 10, points: 500 },
  { level: 5, cost: 15, points: 1000 }, // Dual: x2
  { level: 6, cost: 15, points: 1000 }, // Dual: x2
  { level: 7, cost: 20, points: 4000 }, // All: x4
  { level: 8, cost: 20, points: 1000 },
  { level: 9, cost: 20, points: 1000 },
  { level: 10, cost: 20, points: 1000 },
  { level: 11, cost: 20, points: 1000 },
  { level: 12, cost: 30, points: 2000 }, // Dual: x2
  { level: 13, cost: 30, points: 2000 }, // Dual: x2
  { level: 14, cost: 40, points: 8000 }, // All: x4
  { level: 15, cost: 30, points: 1500 },
  { level: 16, cost: 30, points: 1500 },
  { level: 17, cost: 30, points: 1500 },
  { level: 18, cost: 30, points: 1500 },
  { level: 19, cost: 45, points: 3000 }, // Dual: x2
  { level: 20, cost: 45, points: 3000 }, // Dual: x2
  { level: 21, cost: 60, points: 12000 }, // All: x4
  { level: 22, cost: 40, points: 2000 },
  { level: 23, cost: 40, points: 2000 },
  { level: 24, cost: 40, points: 2000 },
  { level: 25, cost: 40, points: 2000 },
  { level: 26, cost: 60, points: 4000 }, // Dual: x2
  { level: 27, cost: 60, points: 4000 }, // Dual: x2
  { level: 28, cost: 80, points: 16000 }, // All: x4
  { level: 29, cost: 50, points: 2500 },
  { level: 30, cost: 50, points: 2500 },
  { level: 31, cost: 50, points: 2500 },
  { level: 32, cost: 50, points: 2500 },
  { level: 33, cost: 75, points: 5000 }, // Dual: x2
  { level: 34, cost: 75, points: 5000 }, // Dual: x2
  { level: 35, cost: 100, points: 20000 }, // All: x4
  { level: 36, cost: 60, points: 3000 },
  { level: 37, cost: 60, points: 3000 },
  { level: 38, cost: 60, points: 3000 },
  { level: 39, cost: 60, points: 3000 },
  { level: 40, cost: 90, points: 6000 }, // Dual: x2
  { level: 41, cost: 90, points: 6000 }, // Dual: x2
  { level: 42, cost: 120, points: 24000 }, // All: x4
  { level: 43, cost: 70, points: 3500 },
  { level: 44, cost: 70, points: 3500 },
  { level: 45, cost: 70, points: 3500 },
  { level: 46, cost: 70, points: 3500 },
  { level: 47, cost: 105, points: 7000 }, // Dual: x2
  { level: 48, cost: 105, points: 7000 }, // Dual: x2
  { level: 49, cost: 140, points: 28000 }, // All: x4
  { level: 50, cost: 80, points: 4000 },
  { level: 51, cost: 80, points: 4000 },
  { level: 52, cost: 80, points: 4000 },
  { level: 53, cost: 80, points: 4000 },
  { level: 54, cost: 120, points: 8000 }, // Dual: x2
  { level: 55, cost: 120, points: 8000 }, // Dual: x2
  { level: 56, cost: 160, points: 32000 }, // All: x4
  { level: 57, cost: 90, points: 4500 },
  { level: 58, cost: 90, points: 4500 },
  { level: 59, cost: 90, points: 4500 },
  { level: 60, cost: 90, points: 4500 },
  { level: 61, cost: 135, points: 9000 }, // Dual: x2
  { level: 62, cost: 135, points: 9000 }, // Dual: x2
  { level: 63, cost: 180, points: 36000 }, // All: x4
  { level: 64, cost: 100, points: 5000 },
  { level: 65, cost: 100, points: 5000 },
  { level: 66, cost: 100, points: 5000 },
  { level: 67, cost: 100, points: 5000 },
  { level: 68, cost: 150, points: 10000 }, // Dual: x2
  { level: 69, cost: 150, points: 10000 }, // Dual: x2
  { level: 70, cost: 200, points: 40000 }, // All: x4
  { level: 71, cost: 110, points: 6000 },
  { level: 72, cost: 110, points: 6000 },
  { level: 73, cost: 110, points: 6000 },
  { level: 74, cost: 110, points: 6000 },
  { level: 75, cost: 165, points: 12000 }, // Dual: x2
  { level: 76, cost: 165, points: 12000 }, // Dual: x2
  { level: 77, cost: 220, points: 48000 }, // All: x4
  { level: 78, cost: 120, points: 7000 },
  { level: 79, cost: 120, points: 7000 },
  { level: 80, cost: 120, points: 7000 },
  { level: 81, cost: 120, points: 7000 },
  { level: 82, cost: 180, points: 14000 }, // Dual: x2
  { level: 83, cost: 180, points: 14000 }, // Dual: x2
  { level: 84, cost: 240, points: 56000 }, // All: x4
  { level: 85, cost: 130, points: 8000 },
  { level: 86, cost: 130, points: 8000 },
  { level: 87, cost: 130, points: 8000 },
  { level: 88, cost: 130, points: 8000 },
  { level: 89, cost: 195, points: 16000 }, // Dual: x2
  { level: 90, cost: 195, points: 16000 }, // Dual: x2
  { level: 91, cost: 260, points: 64000 }, // All: x4
  { level: 92, cost: 140, points: 9000 },
  { level: 93, cost: 140, points: 9000 },
  { level: 94, cost: 140, points: 9000 },
  { level: 95, cost: 140, points: 9000 },
  { level: 96, cost: 210, points: 18000 }, // Dual: x2
  { level: 97, cost: 210, points: 18000 }, // Dual: x2
  { level: 98, cost: 280, points: 72000 }, // All: x4
  { level: 99, cost: 150, points: 10000 },
  { level: 100, cost: 150, points: 10000 },
  { level: 101, cost: 150, points: 10000 },
  { level: 102, cost: 150, points: 10000 },
  { level: 103, cost: 225, points: 20000 }, // Dual: x2
  { level: 104, cost: 225, points: 20000 }, // Dual: x2
  { level: 105, cost: 300, points: 40000 }, // All: x4
  { level: 106, cost: 160, points: 11000 },
  { level: 107, cost: 160, points: 11000 },
  { level: 108, cost: 160, points: 11000 },
  { level: 109, cost: 160, points: 11000 },
  { level: 110, cost: 240, points: 22000 }, // Dual: x2
  { level: 111, cost: 240, points: 22000 }, // Dual: x2
  { level: 112, cost: 320, points: 44000 }, // All: x4
  { level: 113, cost: 170, points: 12000 },
  { level: 114, cost: 170, points: 12000 },
  { level: 115, cost: 170, points: 12000 },
  { level: 116, cost: 170, points: 12000 },
  { level: 117, cost: 255, points: 24000 }, // Dual: x2
  { level: 118, cost: 255, points: 24000 }, // Dual: x2
  { level: 119, cost: 340, points: 48000 }, // All: x4
  { level: 120, cost: 180, points: 13000 },
  { level: 121, cost: 180, points: 13000 },
  { level: 122, cost: 180, points: 13000 },
  { level: 123, cost: 180, points: 13000 },
  { level: 124, cost: 270, points: 26000 }, // Dual: x2
  { level: 125, cost: 270, points: 26000 }, // Dual: x2
  { level: 126, cost: 360, points: 52000 }, // All: x4
  { level: 127, cost: 190, points: 14000 },
  { level: 128, cost: 190, points: 14000 },
  { level: 129, cost: 190, points: 14000 },
  { level: 130, cost: 190, points: 14000 },
  { level: 131, cost: 285, points: 28000 }, // Dual: x2
  { level: 132, cost: 285, points: 28000 }, // Dual: x2
  { level: 133, cost: 380, points: 56000 }, // All: x4
  { level: 134, cost: 200, points: 15000 },
  { level: 135, cost: 200, points: 15000 },
  { level: 136, cost: 200, points: 15000 },
  { level: 137, cost: 200, points: 15000 },
  { level: 138, cost: 300, points: 30000 }, // Dual: x2
  { level: 139, cost: 300, points: 30000 }, // Dual: x2
  { level: 140, cost: 400, points: 60000 }, // All: x4
  { level: 141, cost: 210, points: 16000 },
  { level: 142, cost: 210, points: 16000 },
  { level: 143, cost: 210, points: 16000 },
  { level: 144, cost: 210, points: 16000 },
  { level: 145, cost: 315, points: 32000 }, // Dual: x2
  { level: 146, cost: 315, points: 32000 }, // Dual: x2
  { level: 147, cost: 420, points: 64000 }, // All: x4
  { level: 148, cost: 220, points: 17000 },
  { level: 149, cost: 220, points: 17000 },
  { level: 150, cost: 220, points: 17000 },
  { level: 151, cost: 220, points: 17000 },
  { level: 152, cost: 330, points: 34000 }, // Dual: x2
  { level: 153, cost: 330, points: 34000 }, // Dual: x2
  { level: 154, cost: 440, points: 68000 }, // All: x4
  { level: 155, cost: 230, points: 18000 },
  { level: 156, cost: 230, points: 18000 },
  { level: 157, cost: 230, points: 18000 },
  { level: 158, cost: 230, points: 18000 },
  { level: 159, cost: 345, points: 36000 }, // Dual: x2
  { level: 160, cost: 345, points: 36000 }, // Dual: x2
  { level: 161, cost: 460, points: 72000 }, // All: x4
  { level: 162, cost: 240, points: 19000 },
  { level: 163, cost: 240, points: 19000 },
  { level: 164, cost: 240, points: 19000 },
  { level: 165, cost: 240, points: 19000 },
  { level: 166, cost: 360, points: 38000 }, // Dual: x2
  { level: 167, cost: 360, points: 38000 }, // Dual: x2
  { level: 168, cost: 480, points: 76000 }, // All: x4
  { level: 169, cost: 250, points: 20000 },
  { level: 170, cost: 250, points: 20000 },
  { level: 171, cost: 250, points: 20000 },
  { level: 172, cost: 250, points: 20000 },
  { level: 173, cost: 375, points: 40000 }, // Dual: x2
  { level: 174, cost: 375, points: 40000 }, // Dual: x2
  { level: 175, cost: 500, points: 80000 }, // All: x4
  { level: 176, cost: 260, points: 21000 },
  { level: 177, cost: 260, points: 21000 },
  { level: 178, cost: 260, points: 21000 },
  { level: 179, cost: 260, points: 21000 },
  { level: 180, cost: 390, points: 42000 }, // Dual: x2
  { level: 181, cost: 390, points: 42000 }, // Dual: x2
  { level: 182, cost: 520, points: 84000 }, // All: x4
  { level: 183, cost: 270, points: 22000 },
  { level: 184, cost: 270, points: 22000 },
  { level: 185, cost: 270, points: 22000 },
  { level: 186, cost: 270, points: 22000 },
  { level: 187, cost: 405, points: 44000 }, // Dual: x2
  { level: 188, cost: 405, points: 44000 }, // Dual: x2
  { level: 189, cost: 540, points: 88000 }, // All: x4
  { level: 190, cost: 280, points: 23000 },
  { level: 191, cost: 280, points: 23000 },
  { level: 192, cost: 280, points: 23000 },
  { level: 193, cost: 280, points: 23000 },
  { level: 194, cost: 420, points: 46000 }, // Dual: x2
  { level: 195, cost: 420, points: 46000 }, // Dual: x2
  { level: 196, cost: 560, points: 92000 }, // All: x4
  { level: 197, cost: 290, points: 24000 },
  { level: 198, cost: 290, points: 24000 },
  { level: 199, cost: 290, points: 24000 },
  { level: 200, cost: 290, points: 24000 },
  { level: 201, cost: 435, points: 48000 }, // Dual: x2
  { level: 202, cost: 435, points: 48000 }, // Dual: x2
  { level: 203, cost: 580, points: 96000 }, // All: x4
  { level: 204, cost: 300, points: 25000 },
  { level: 205, cost: 300, points: 25000 },
  { level: 206, cost: 300, points: 25000 },
  { level: 207, cost: 300, points: 25000 },
  { level: 208, cost: 450, points: 50000 }, // Dual: x2
  { level: 209, cost: 450, points: 50000 }, // Dual: x2
  { level: 210, cost: 600, points: 100000 }, // All: x4
  { level: 211, cost: 310, points: 26000 },
  { level: 212, cost: 310, points: 26000 },
  { level: 213, cost: 310, points: 26000 },
  { level: 214, cost: 310, points: 26000 },
  { level: 215, cost: 465, points: 52000 }, // Dual: x2
  { level: 216, cost: 465, points: 52000 }, // Dual: x2
  { level: 217, cost: 620, points: 104000 }, // All: x4
  { level: 218, cost: 320, points: 27000 },
  { level: 219, cost: 320, points: 27000 },
  { level: 220, cost: 320, points: 27000 },
  { level: 221, cost: 320, points: 27000 },
  { level: 222, cost: 480, points: 54000 }, // Dual: x2
  { level: 223, cost: 480, points: 54000 }, // Dual: x2
  { level: 224, cost: 640, points: 108000 }, // All: x4
  { level: 225, cost: 330, points: 28000 },
  { level: 226, cost: 330, points: 28000 },
  { level: 227, cost: 330, points: 28000 },
  { level: 228, cost: 330, points: 28000 },
  { level: 229, cost: 495, points: 56000 }, // Dual: x2
  { level: 230, cost: 495, points: 56000 }, // Dual: x2
  { level: 231, cost: 660, points: 112000 }, // All: x4
  { level: 232, cost: 340, points: 29000 },
  { level: 233, cost: 340, points: 29000 },
  { level: 234, cost: 340, points: 29000 },
  { level: 235, cost: 340, points: 29000 },
  { level: 236, cost: 510, points: 58000 }, // Dual: x2
  { level: 237, cost: 510, points: 58000 }, // Dual: x2
  { level: 238, cost: 680, points: 116000 }, // All: x4
  { level: 239, cost: 350, points: 30000 },
  { level: 240, cost: 350, points: 30000 },
  { level: 241, cost: 350, points: 30000 },
  { level: 242, cost: 350, points: 30000 },
  { level: 243, cost: 525, points: 60000 }, // Dual: x2
  { level: 244, cost: 525, points: 60000 }, // Dual: x2
  { level: 245, cost: 700, points: 120000 }, // All: x4
  { level: 246, cost: 360, points: 31000 },
  { level: 247, cost: 360, points: 31000 },
  { level: 248, cost: 360, points: 31000 },
  { level: 249, cost: 360, points: 31000 },
  { level: 250, cost: 540, points: 62000 }, // Dual: x2
  { level: 251, cost: 540, points: 62000 }, // Dual: x2
  { level: 252, cost: 720, points: 124000 }, // All: x4
  { level: 253, cost: 370, points: 32000 },
  { level: 254, cost: 370, points: 32000 },
  { level: 255, cost: 370, points: 32000 },
  { level: 256, cost: 370, points: 32000 },
  { level: 257, cost: 555, points: 64000 }, // Dual: x2
  { level: 258, cost: 555, points: 64000 }, // Dual: x2
  { level: 259, cost: 740, points: 128000 }, // All: x4
  { level: 260, cost: 380, points: 33000 },
  { level: 261, cost: 380, points: 33000 },
  { level: 262, cost: 380, points: 33000 },
  { level: 263, cost: 380, points: 33000 },
  { level: 264, cost: 570, points: 66000 }, // Dual: x2
  { level: 265, cost: 570, points: 66000 }, // Dual: x2
  { level: 266, cost: 760, points: 132000 }, // All: x4
  { level: 267, cost: 390, points: 34000 },
  { level: 268, cost: 390, points: 34000 },
  { level: 269, cost: 390, points: 34000 },
  { level: 270, cost: 390, points: 34000 },
  { level: 271, cost: 585, points: 68000 }, // Dual: x2
  { level: 272, cost: 585, points: 68000 }, // Dual: x2
  { level: 273, cost: 780, points: 136000 }, // All: x4
  { level: 274, cost: 400, points: 35000 },
  { level: 275, cost: 400, points: 35000 },
  { level: 276, cost: 400, points: 35000 },
  { level: 277, cost: 400, points: 35000 },
  { level: 278, cost: 600, points: 70000 }, // Dual: x2
  { level: 279, cost: 600, points: 70000 }, // Dual: x2
  { level: 280, cost: 800, points: 140000 }, // All: x4
  { level: 281, cost: 410, points: 36000 },
  { level: 282, cost: 410, points: 36000 },
  { level: 283, cost: 410, points: 36000 },
  { level: 284, cost: 410, points: 36000 },
  { level: 285, cost: 615, points: 72000 }, // Dual: x2
  { level: 286, cost: 615, points: 72000 }, // Dual: x2
  { level: 287, cost: 820, points: 144000 }, // All: x4
  { level: 288, cost: 420, points: 37000 },
  { level: 289, cost: 420, points: 37000 },
  { level: 290, cost: 420, points: 37000 },
  { level: 291, cost: 420, points: 37000 },
];