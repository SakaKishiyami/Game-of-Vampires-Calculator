"use client"

import { useGameCalculator } from '@/context/GameCalculatorContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getAttributeColor, getAttributeBg, bookCategoryOrder, nonNegativeIntInputProps } from '@/utils/helpers'
import { bookBonuses } from '@/data/books'
import type { BooksState } from '@/data/books'
import { BookOpen, Flame, Heart, Brain, CloudMoon } from 'lucide-react'

const bookImageMap: Record<string, Record<string, string>> = {
  Strength: {
    "Warfare I": "Strength1",
    "Warfare II": "Strength2",
    "Warfare III": "Strength3",
    "Warfare IV": "Strength4",
    "Warfare V": "Strength6",
    "Combat I": "Strength15(1)",
    "Combat II": "Strength15(2)",
  },
  Allure: {
    "Glamor I": "Allure1",
    "Glamor II": "Allure2",
    "Glamor III": "Allure3",
    "Glamor IV": "Allure4",
    "Glamor V": "Allure5",
    "Beauty I": "Allure15(1)",
    "Beauty II": "Allure15(2)",
  },
  Intellect: {
    "Alchemy I": "Intellect1",
    "Alchemy II": "Intellect2",
    "Alchemy III": "Intellect3",
    "Alchemy IV": "Intellect4",
    "Alchemy V": "Intellect5",
    "History I": "Intellect15(1)",
    "History II": "Intellect15(2)",
  },
  Spirit: {
    "Occult I": "Spirit1",
    "Occult II": "Spirit2",
    "Occult III": "Spirit3",
    "Occult IV": "Spirit4",
    "Occult V": "Spirit5",
    "Mysticism I": "Spirit15(1)",
    "Mysticism II": "Spirit15(2)",
  },
  Balanced: {
    "Encyclopedia A-E": "Mystery1",
    "Encyclopedia A-J": "Mystery2",
    "Encyclopedia A-O": "Mystery3",
    "Encyclopedia A-T": "Mystery4",
    "Encyclopedia A-Z": "Mystery5",
    "Arcana I": "Mystery15(1)",
    "Arcana II": "Mystery15(2)",
  },
}

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

  const getBookImage = (category: string, bookName: string) => {
    const assetName = bookImageMap[category]?.[bookName]
    if (!assetName) return null
    return `/InventoryAssets/WardenItems/${assetName}.PNG`
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
                  <div className="space-y-1.5">
                    {Object.entries(bookCollection)
                      .sort((a, b) => {
                        const getNumber = (name: string) => {
                          const match = name.match(/(\d+)/)
                          return match ? parseInt(match[1]) : 0
                        }
                        return getNumber(a[0]) - getNumber(b[0])
                      })
                      .map(([bookName, count]) => {
                        const imgSrc = getBookImage(category, bookName)
                        return (
                          <div key={bookName} className="flex items-center gap-2">
                            {imgSrc && (
                              <img
                                src={imgSrc}
                                alt={bookName}
                                className="w-8 h-8 object-contain flex-shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] text-gray-300 leading-tight truncate">{bookName}</div>
                              <div className="flex items-center gap-1.5">
                                <Input
                                  className="bg-gray-800 border-gray-600 text-white h-7 text-xs w-16"
                                  {...nonNegativeIntInputProps(count as number, (newCount) =>
                                    setBooks((prev) => ({
                                      ...prev,
                                      [category]: {
                                        ...prev[category],
                                        [bookName]: newCount,
                                      },
                                    }))
                                  )}
                                />
                                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                  +{(count as number) * (bookBonuses[category as keyof typeof bookBonuses]?.[bookName as keyof typeof bookBonuses[typeof category]] || 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
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
