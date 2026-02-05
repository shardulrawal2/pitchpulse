"use client"

import Link from "next/link"
import { Activity, ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PitchHistory } from "@/components/pitch/PitchHistory"

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold text-foreground">PitchPulse</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/analyze">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Analysis
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground">Pitch History</h1>
        <p className="mt-2 text-muted-foreground">
          View and revisit all your previous pitch analyses.
        </p>

        <div className="mt-8">
          <PitchHistory showClearAll />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-4xl px-6 text-center text-sm text-muted-foreground">
          PitchPulse - AI-Powered Pitch Feedback
        </div>
      </footer>
    </div>
  )
}
