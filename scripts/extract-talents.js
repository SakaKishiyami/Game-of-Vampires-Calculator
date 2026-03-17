const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const calcPath = path.join(root, 'src/components/GameCalculator.tsx');
const outPath = path.join(root, 'src/components/tabs/TalentsTab.tsx');
const lines = fs.readFileSync(calcPath, 'utf8').split('\n');
const start = 4403; // 0-based, line 4404
const end = 4986;
const inner = lines.slice(start, end).join('\n');
const header = `"use client"

import { useGameCalculator } from '@/context/GameCalculatorContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getDisplayValue, getAttributeColor } from '@/utils/helpers'
import { domIncreasePerStarData } from '@/data/talent_stars'

export default function TalentsTab() {
  const { talents, setTalents, syncTalentsToInventory } = useGameCalculator()
  return (
`;
const footer = `
  )
}
`;
fs.writeFileSync(outPath, header + inner + footer);
console.log('Wrote TalentsTab.tsx');
