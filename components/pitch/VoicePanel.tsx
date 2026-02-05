"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, Volume2, Clock, AlertTriangle } from "lucide-react"

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

interface VoicePanelProps {
  analysis: VoiceAnalysis
}

const toneColors: Record<string, string> = {
  confident: "bg-green-500/20 text-green-400 border-green-500/30",
  expressive: "bg-primary/20 text-primary border-primary/30",
  mixed: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  hesitant: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  monotone: "bg-red-500/20 text-red-400 border-red-500/30",
}

const rhythmColors: Record<string, string> = {
  balanced: "bg-green-500/20 text-green-400 border-green-500/30",
  "too fast": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "too slow": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  inconsistent: "bg-red-500/20 text-red-400 border-red-500/30",
}

export function VoicePanel({ analysis }: VoicePanelProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Mic className="h-5 w-5 text-primary" />
          Voice Delivery Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Volume2 className="h-4 w-4" />
              Overall Tone
            </div>
            <Badge
              variant="outline"
              className={`text-sm capitalize ${toneColors[analysis.overallTone] || ""}`}
            >
              {analysis.overallTone}
            </Badge>
          </div>
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Overall Rhythm
            </div>
            <Badge
              variant="outline"
              className={`text-sm capitalize ${rhythmColors[analysis.overallRhythm] || ""}`}
            >
              {analysis.overallRhythm}
            </Badge>
          </div>
        </div>

        {/* Issues */}
        {analysis.issues.length > 0 && (
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Areas for Improvement
            </h4>
            <div className="space-y-2">
              {analysis.issues.map((issue, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border bg-secondary/20 p-3"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {issue.time}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize ${
                        issue.type === "tone"
                          ? "border-purple-500/30 bg-purple-500/20 text-purple-400"
                          : "border-blue-500/30 bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {issue.type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {issue.problem}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80">{issue.advice}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.issues.length === 0 && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-center">
            <p className="text-sm text-green-400">
              Great voice delivery! No major issues detected.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
