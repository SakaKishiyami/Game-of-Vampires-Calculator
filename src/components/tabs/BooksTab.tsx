"use client"

import { useGameCalculator } from '@/context/GameCalculatorContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getDisplayValue, getAttributeColor, getAttributeBg, bookCategoryOrder } from '@/utils/helpers'
import { bookBonuses } from '@/data/books'
import type { BooksState } from '@/data/books'
import { BookOpen, Flame, Heart, Brain, CloudMoon } from 'lucide-react'

export default function BooksTab() {
  const { books, setBooks } = useGameCalculator()

  const getCategoryIcon = (category: keyof BooksState) => {
    if (category === 'Balanced') return BookOpen
    if (category === 'Strength') return Flame
    if (category === 'Allure') return Heart
    if (category === 'Intellect') return Brain
    return CloudMoon
  }

  const getCategoryLabel = (category: keyof BooksState) => {
    if (category === 'Balanced') return 'Mystery Books'
    return `${category} Books`
  }

  return (
    <Card className="bg-gray-800/50 border-gray-600">
      <CardHeader>
        <CardTitle className="text-red-400">Books</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {bookCategoryOrder.map((rawCategory) => {
            const category = rawCategory as keyof BooksState
            const bookCollection = books[category]
            const Icon = getCategoryIcon(category)
            return (
              <Card key={category} className={`border bg-gray-900/60 ${getAttributeBg(category)}`}>
                <CardHeader className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-black/40 flex items-center justify-center">
                      <Icon className={`w-4 h-4 ${getAttributeColor(category)}`} />
                    </div>
                    <CardTitle className={`text-base font-semibold ${getAttributeColor(category)}`}>
                      {getCategoryLabel(category)}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-1">
                  <div className="space-y-2">
                    {Object.entries(bookCollection)
                      .sort((a, b) => {
                        const getNumber = (name: string) => {
                          const match = name.match(/(\d+)/)
                          return match ? parseInt(match[1]) : 0
                        }
                        return getNumber(a[0]) - getNumber(b[0])
                      })
                      .map(([bookName, count]) => (
                        <div key={bookName} className="space-y-1">
                          <Label className="text-xs text-gray-200">{bookName}</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={getDisplayValue(count)}
                              onChange={(e) => {
                                const value = e.target.value
                                if (value === '' || value === '-') {
                                  return
                                }
                                const newCount = parseInt(value) || 0
                                setBooks((prev) => ({
                                  ...prev,
                                  [category]: {
                                    ...prev[category],
                                    [bookName]: newCount,
                                  },
                                }))
                              }}
                              onBlur={(e) => {
                                const value = e.target.value
                                const newCount = value === '' ? 0 : parseInt(value) || 0
                                setBooks((prev) => ({
                                  ...prev,
                                  [category]: {
                                    ...prev[category],
                                    [bookName]: newCount,
                                  },
                                }))
                              }}
                              className="bg-gray-800 border-gray-600 text-white h-8 text-xs"
                            />
                            <div className="text-[11px] text-gray-400 whitespace-nowrap">
                              +{(count as number) * (bookBonuses[category as keyof typeof bookBonuses]?.[bookName as keyof typeof bookBonuses[typeof category]] || 0)}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
