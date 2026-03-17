"use client"

import DataTab from '@/components/tabs/DataTab'

export default function DataPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">Data &amp; Import / Export</h1>
      <p className="text-sm text-gray-300 max-w-2xl">
        Save and load your calculator data from local storage, session storage, a file, or (later) Google Drive.
        Changes here affect the calculator when you open it.
      </p>
      <DataTab />
    </div>
  )
}
