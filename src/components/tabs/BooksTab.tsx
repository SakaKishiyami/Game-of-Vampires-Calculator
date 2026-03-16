"use client"

import { useGameCalculator } from '@/context/GameCalculatorContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getDisplayValue, getAttributeColor, getAttributeBg, bookCategoryOrder } from '@/utils/helpers'
import { bookBonuses } from '@/data/books'
import type { BooksState } from '@/data/books'

export default function BooksTab() {
  const { books, setBooks } = useGameCalculator()

  return (
    <Card className="bg-gray-800/50 border-gray-600">
      <CardHeader>
        <CardTitle className="text-red-400">Books</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {bookCategoryOrder.map((category) => {
            const bookCollection = books[category as keyof BooksState]
            return (
              <Card key={category} className={`${getAttributeBg(category)} border`}>
                <CardHeader>
                  <CardTitle className={`${getAttributeColor(category)} font-semibold`}>{category} Books</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(bookCollection)
                      .sort((a, b) => {
                        const getNumber = (name: string) => {
                          const match = name.match(/(\d+)/)
                          return match ? parseInt(match[1]) : 0
                        }
                        return getNumber(a[0]) - getNumber(b[0])
                      })
                      .map(([bookName, count]) => (
                        <div key={bookName}>
                          <Label className="text-white text-sm">{bookName}</Label>
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
                                  ...prev[category as keyof BooksState],
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
                                  ...prev[category as keyof BooksState],
                                  [bookName]: newCount,
                                },
                              }))
                            }}
                            className="mt-1 bg-gray-700 border-gray-600 text-white"
                          />
                          <div className="text-xs text-gray-400 mt-1">
                            Bonus: +{(count as number) * (bookBonuses[category as keyof typeof bookBonuses]?.[bookName as keyof typeof bookBonuses[typeof category]] || 0)}
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
