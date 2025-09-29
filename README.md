# Game of Vampires Calculator

A comprehensive React-based calculator for the Game of Vampires mobile game. This calculator helps players track and optimize their character's attributes, wardens, books, conclave seals, courtyard levels, and scarlet bonds.

## Features

- **Base Attributes**: Track Strength, Allure, Intellect, and Spirit
- **VIP & Lord Level**: Set your VIP level (1-12) and Lord progression
- **Conclave**: Manage seal levels for all attributes
- **Courtyard**: Track current level and points with projected level calculation
- **Books**: Comprehensive book collection tracking with bonuses
- **Wardens**: 
  - Special wardens (Nyx, Dracula)
  - Warden groups (Circus, Bloody Tyrants, Monster Noir, Wild Hunt)
  - Aura management
  - Individual warden stats
- **Scarlet Bond**: Bond management with affinity points and attribute bonuses
- **OCR Warden Import**: Upload screenshots of warden data for automatic parsing

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd game-calculator
```

2. Install dependencies:
```bash
npm install
```


3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Set Base Attributes**: Enter your current base attribute values
2. **Configure VIP/Lord Level**: Set your VIP level and Lord progression
3. **Manage Conclave**: Set seal levels for attribute bonuses
4. **Track Courtyard**: Enter current level and points to see projected level
5. **Add Books**: Input your book collection counts for attribute bonuses
6. **Configure Wardens**: 
   - Select special wardens
   - Set warden counts per group
   - Choose specific wardens
   - Configure auras
   - Set individual warden stats
7. **Manage Scarlet Bonds**: Set affinity points and attribute bonuses for bonds
8. **AI Inventory Analysis**: 
   - Go to the Inventory tab
   - Upload a screenshot of your game inventory
   - The AI will automatically detect items and their counts
   - View your inventory with proper item images and quantities

## Calculations

The calculator automatically computes:
- Total DOM (Dominance) from all sources
- Attribute boosts as percentages
- Projected courtyard levels
- Optimal upgrade paths for scarlet bonds

## Technology Stack

- **Framework**: Next.js 14 with React 18
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI primitives with custom styling
- **Language**: TypeScript for type safety

## Project Structure

```
game-calculator/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── GameCalculator.tsx
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── tabs.tsx
│   └── lib/
│       └── utils.ts
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License. 