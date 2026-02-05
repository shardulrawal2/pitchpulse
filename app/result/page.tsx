"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Activity, ArrowLeft, Target, TrendingUp, Zap, Download, Copy, Check, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PulseGraph } from "@/components/pitch/PulseGraph"
import { WeakMomentCard } from "@/components/pitch/WeakMomentCard"
import { VoicePanel } from "@/components/pitch/VoicePanel"
import { BodyLanguagePanel } from "@/components/pitch/BodyLanguagePanel"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Chunk {
  index: number
  start: number
  end: number
  text: string
  sentiment: number
  energy: number
  clarity: number
  personaFit: number
  engagementScore: number
  weakMoment: boolean
  reason: string
}

interface Suggestion {
  chunkIndex: number
  rewrite: string
  slideTip: string
  coachingTip: string
}

interface VideoFeedback {
  time: string
  issue: string
  advice: string
}

interface VoiceIssue {
  time: string
  type: "tone" | "rhythm"
  problem: string
  advice: string
}

interface VoiceAnalysis {
  overallTone: "confident" | "hesitant" | "monotone" | "expressive" | "mixed"
  overallRhythm: "too fast" | "too slow" | "balanced" | "inconsistent"
  issues: VoiceIssue[]
}

interface Results {
  transcript: { text: string; words: Array<{ text: string; start: number; end: number }> }
  analysis: { chunks: Chunk[]; overallScore: number }
  suggestions: Suggestion[]
  voiceAnalysis?: VoiceAnalysis
  videoFeedback?: VideoFeedback[]
  persona: string
  inputType?: string
}

const personaLabels: Record<string, { name: string; icon: typeof Target }> = {
  angel: { name: "Angel Investor", icon: Target },
  vc: { name: "VC Partner", icon: TrendingUp },
  product: { name: "Product-Led", icon: Zap },
}

export default function ResultPage() {
  const router = useRouter()
  const [results, setResults] = useState<Results | null>(null)
  const [activeWeakMoment, setActiveWeakMoment] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem("pitchResults")
    if (!stored) {
      router.push("/analyze")
      return
    }
    setResults(JSON.parse(stored))
  }, [router])

  const handlePointClick = useCallback((index: number) => {
    const chunk = results?.analysis.chunks[index]
    if (chunk?.weakMoment) {
      setActiveWeakMoment(index)
      const element = document.getElementById(`weak-moment-${index}`)
      element?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [results])

  const generateRevisedPitch = useCallback(() => {
    if (!results) return ""

    const { analysis, suggestions } = results
    
    // Build the revised pitch by going through all chunks
    // Replace weak moments with suggested rewrites
    const revisedParts: string[] = []
    
    for (const chunk of analysis.chunks) {
      if (chunk.weakMoment) {
        // Find the suggestion for this weak moment
        const suggestion = suggestions.find(s => s.chunkIndex === chunk.index)
        if (suggestion && suggestion.rewrite) {
          // Clean up the rewrite - remove bracketed placeholders if they look like templates
          let rewrite = suggestion.rewrite
          // If the rewrite starts with template markers, use it as-is but note it
          if (rewrite.includes("[") && rewrite.includes("]")) {
            rewrite = `[IMPROVE: ${rewrite}]`
          }
          revisedParts.push(rewrite)
        } else {
          // No suggestion available, keep original but mark it
          revisedParts.push(`[NEEDS IMPROVEMENT: ${chunk.text}]`)
        }
      } else {
        // Keep strong segments as-is
        revisedParts.push(chunk.text)
      }
    }
    
    return revisedParts.join(" ")
  }, [results])

  const generateAnalysisReport = useCallback(() => {
    if (!results) return ""

    const { transcript, analysis, suggestions, persona } = results
    const weakMoments = analysis.chunks.filter(c => c.weakMoment)
    
    let report = `PITCHPULSE ANALYSIS REPORT
${"=".repeat(50)}

Date: ${new Date().toLocaleDateString()}
Investor Persona: ${personaLabels[persona]?.name || persona}
Overall Score: ${(analysis.overallScore * 100).toFixed(0)}%

${"=".repeat(50)}
TRANSCRIPT
${"=".repeat(50)}

${transcript.text}

${"=".repeat(50)}
ENGAGEMENT ANALYSIS
${"=".repeat(50)}

`

    analysis.chunks.forEach((chunk, i) => {
      const timeStart = Math.floor(chunk.start / 1000)
      const timeEnd = Math.floor(chunk.end / 1000)
      report += `Segment ${i + 1} [${formatTime(timeStart)} - ${formatTime(timeEnd)}]
Score: ${(chunk.engagementScore * 100).toFixed(0)}%${chunk.weakMoment ? " ⚠️ WEAK MOMENT" : ""}
Text: "${chunk.text.substring(0, 100)}${chunk.text.length > 100 ? "..." : ""}"

  • Sentiment: ${(chunk.sentiment * 100).toFixed(0)}%
  • Energy: ${(chunk.energy * 100).toFixed(0)}%
  • Clarity: ${(chunk.clarity * 100).toFixed(0)}%
  • Persona Fit: ${(chunk.personaFit * 100).toFixed(0)}%
${chunk.weakMoment ? `  • Reason: ${chunk.reason}` : ""}

`
    })

    if (weakMoments.length > 0) {
      report += `${"=".repeat(50)}
SUGGESTIONS FOR WEAK MOMENTS
${"=".repeat(50)}

`
      weakMoments.forEach((chunk) => {
        const suggestion = suggestions.find(s => s.chunkIndex === chunk.index)
        const timeStart = Math.floor(chunk.start / 1000)
        
        report += `WEAK MOMENT at ${formatTime(timeStart)}
Original: "${chunk.text}"

`
        if (suggestion) {
          report += `Suggested Rewrite:
"${suggestion.rewrite}"

Slide Tip: ${suggestion.slideTip}

Coaching Tip: ${suggestion.coachingTip}

---

`
        }
      })
    }

    report += `${"=".repeat(50)}
SUMMARY
${"=".repeat(50)}

Total Segments Analyzed: ${analysis.chunks.length}
Weak Moments Identified: ${weakMoments.length}
Average Engagement: ${(analysis.overallScore * 100).toFixed(0)}%

Generated by PitchPulse - AI-Powered Pitch Feedback
`

    return report
  }, [results])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleDownloadTxt = () => {
    const report = generateAnalysisReport()
    const blob = new Blob([report], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pitchpulse-analysis-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadJson = () => {
    if (!results) return
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pitchpulse-analysis-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopyToClipboard = async () => {
    const report = generateAnalysisReport()
    try {
      await navigator.clipboard.writeText(report)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert("Failed to copy to clipboard")
    }
  }

  if (!results) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading results...</div>
      </div>
    )
  }

  const { analysis, suggestions, persona } = results
  const weakMoments = analysis.chunks.filter((c) => c.weakMoment)
  const PersonaIcon = personaLabels[persona]?.icon || Target

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold text-foreground">PitchPulse</span>
          </Link>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownloadTxt}>
                  Download as .txt
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadJson}>
                  Download as .json
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyToClipboard}>
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy to clipboard
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/history">
              <Button variant="ghost" className="gap-2 bg-transparent">
                <History className="h-4 w-4" />
                History
              </Button>
            </Link>
            <Link href="/analyze">
              <Button variant="ghost" className="gap-2 bg-transparent">
                <ArrowLeft className="h-4 w-4" />
                New Analysis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Summary Section */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Overall Score */}
          <div className="rounded-lg border border-border bg-card p-6">
            <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
            <p className="mt-2 text-4xl font-bold text-card-foreground">
              {(analysis.overallScore * 100).toFixed(0)}%
            </p>
            <div className="mt-2 h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${analysis.overallScore * 100}%` }}
              />
            </div>
          </div>

          {/* Persona */}
          <div className="rounded-lg border border-border bg-card p-6">
            <p className="text-sm font-medium text-muted-foreground">Investor Persona</p>
            <div className="mt-2 flex items-center gap-2">
              <PersonaIcon className="h-6 w-6 text-primary" />
              <p className="text-lg font-semibold text-card-foreground">
                {personaLabels[persona]?.name || persona}
              </p>
            </div>
          </div>

          {/* Weak Moments Count */}
          <div className="rounded-lg border border-border bg-card p-6">
            <p className="text-sm font-medium text-muted-foreground">Weak Moments</p>
            <p className="mt-2 text-4xl font-bold text-destructive">{weakMoments.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {weakMoments.length === 0
                ? "Great job! No weak moments detected."
                : "Click red dots on the graph for details"}
            </p>
          </div>
        </div>

        {/* Pulse Graph */}
        <div className="mt-10">
          <h2 className="mb-4 text-xl font-semibold text-foreground">Engagement Pulse</h2>
          <PulseGraph chunks={analysis.chunks} onPointClick={handlePointClick} />
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Red dots indicate weak moments (score below 55%). Click to see suggestions.
          </p>
        </div>

        {/* Weak Moments */}
        {weakMoments.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              Weak Moments & Suggestions
            </h2>
            <div className="space-y-6">
              {weakMoments.map((chunk) => (
                <WeakMomentCard
                  key={chunk.index}
                  chunk={chunk}
                  suggestion={suggestions.find((s) => s.chunkIndex === chunk.index)}
                  isActive={activeWeakMoment === chunk.index}
                />
              ))}
            </div>
          </div>
        )}

        {/* Voice & Body Language Analysis Panels */}
        {(results.voiceAnalysis || (results.videoFeedback && results.videoFeedback.length > 0)) && (
          <div className="mt-10">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              Delivery Analysis
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {results.voiceAnalysis && (
                <VoicePanel analysis={results.voiceAnalysis} />
              )}
              {results.videoFeedback && results.videoFeedback.length > 0 && (
                <BodyLanguagePanel feedback={results.videoFeedback} />
              )}
            </div>
          </div>
        )}

        {/* Revised Pitch */}
        {suggestions.length > 0 && (
          <div className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Revised Pitch</h2>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={async () => {
                  const revisedText = generateRevisedPitch()
                  try {
                    await navigator.clipboard.writeText(revisedText)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  } catch {
                    alert("Failed to copy")
                  }
                }}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-6">
              <p className="mb-4 text-sm text-muted-foreground">
                This is your pitch with all weak moments replaced by AI-suggested improvements:
              </p>
              <p className="whitespace-pre-wrap text-sm text-card-foreground leading-relaxed">
                {generateRevisedPitch()}
              </p>
            </div>
          </div>
        )}

        {/* Full Transcript */}
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Original Transcript</h2>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(results.transcript.text)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                } catch {
                  alert("Failed to copy")
                }
              }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <p className="whitespace-pre-wrap text-sm text-card-foreground">
              {results.transcript.text}
            </p>
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
