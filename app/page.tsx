"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Activity, Mic, Upload, Zap, Target, TrendingUp, History } from "lucide-react"
import { PitchHistory } from "@/components/pitch/PitchHistory"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold text-foreground">PitchPulse</span>
          </div>
          <Link href="/analyze">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <h1 className="text-balance text-5xl font-bold tracking-tight text-foreground md:text-6xl">
            Live Pitch Feedback
            <span className="block text-primary">Oscilloscope</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Upload your pitch video or record live. Get AI-powered analysis with real-time engagement scoring, weak moment detection, and actionable suggestions.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/analyze">
              <Button size="lg" className="gap-2">
                <Upload className="h-4 w-4" />
                Analyze Your Pitch
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid gap-8 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Mic className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-card-foreground">Upload or Record</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload a pitch video or record audio directly in your browser for instant analysis.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-card-foreground">Engagement Pulse</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Visualize engagement scores over time with an interactive oscilloscope-style graph.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-card-foreground">AI Suggestions</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get rewrites, slide tips, and coaching advice for weak moments in your pitch.
            </p>
          </div>
        </div>

        {/* Recent Pitches */}
        <div className="mt-24">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-foreground">Recent Pitches</h2>
            <Link href="/history">
              <Button variant="ghost" className="gap-2 bg-transparent">
                <History className="h-4 w-4" />
                View All
              </Button>
            </Link>
          </div>
          <p className="mt-2 text-muted-foreground">
            Your recent pitch analyses. Click to view details.
          </p>
          <div className="mt-6">
            <PitchHistory maxItems={3} showClearAll={false} />
          </div>
        </div>

        {/* Investor Personas */}
        <div className="mt-24">
          <h2 className="text-center text-3xl font-bold text-foreground">Choose Your Investor Persona</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
            Tailor your pitch analysis to the investor type you are targeting.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-chart-4/20">
                <Target className="h-8 w-8 text-chart-4" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-card-foreground">Angel Investor</h3>
              <p className="mt-2 text-sm text-muted-foreground">Focused on vision, passion, and founder-market fit.</p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-chart-2/20">
                <TrendingUp className="h-8 w-8 text-chart-2" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-card-foreground">VC Partner</h3>
              <p className="mt-2 text-sm text-muted-foreground">Focused on unit economics, scalability, and market size.</p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-card-foreground">Product-Led</h3>
              <p className="mt-2 text-sm text-muted-foreground">Focused on product differentiation and user experience.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-muted-foreground">
          PitchPulse - AI-Powered Pitch Feedback
        </div>
      </footer>
    </div>
  )
}
