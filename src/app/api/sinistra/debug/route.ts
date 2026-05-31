import { NextResponse } from 'next/server'
import { loadSinistraDebugReport } from '@/lib/sinistra/loadSinistraDebugReport'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const report = loadSinistraDebugReport()
    return NextResponse.json(report)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
