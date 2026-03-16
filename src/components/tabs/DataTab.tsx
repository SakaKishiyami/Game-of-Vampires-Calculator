"use client"

import { useGameCalculator } from '@/context/GameCalculatorContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { importGameData, validateImportedData } from '@/utils/exportImport'

export default function DataTab() {
  const { exportGameData, importGameData: importData } = useGameCalculator()

  const handleExport = () => {
    exportGameData()
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    importGameData(file)
      .then((data) => {
        if (validateImportedData(data)) {
          importData(data)
          alert('Data imported successfully!')
        } else {
          alert('Invalid data format')
        }
      })
      .catch((error) => {
        alert('Failed to import data: ' + error.message)
      })

    // Reset input
    event.target.value = ''
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-600">
        <CardHeader>
          <CardTitle className="text-red-400">Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Export Data</h3>
            <p className="text-sm text-gray-300 mb-4">
              Export your game calculator data to a JSON file for backup or transfer.
            </p>
            <Button
              onClick={handleExport}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Export to JSON File
            </Button>
          </div>

          <div className="border-t border-gray-600 pt-4">
            <h3 className="text-lg font-semibold text-white mb-2">Import Data</h3>
            <p className="text-sm text-gray-300 mb-4">
              Import previously exported game calculator data from a JSON file.
            </p>
            <label className="block">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file-input"
              />
              <Button
                onClick={() => document.getElementById('import-file-input')?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                Import from JSON File
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
