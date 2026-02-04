import { AlertTriangle, Lightbulb, MessageSquare, Presentation } from "lucide-react"

interface Suggestion {
  chunkIndex: number
  rewrite: string
  slideTip: string
  coachingTip: string
}

interface WeakMomentCardProps {
  chunk: {
    index: number
    start: number
    end: number
    text: string
    engagementScore: number
    reason: string
  }
  suggestion?: Suggestion
  isActive: boolean
}

export function WeakMomentCard({ chunk, suggestion, isActive }: WeakMomentCardProps) {
  const startTime = Math.round(chunk.start / 1000)
  const endTime = Math.round(chunk.end / 1000)

  return (
    <div
      className={`rounded-lg border-2 bg-card p-6 transition-all ${
        isActive ? "border-destructive" : "border-border"
      }`}
      id={`weak-moment-${chunk.index}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/20">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-card-foreground">Weak Moment</h3>
            <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {startTime}s - {endTime}s
            </span>
          </div>
          <p className="mt-1 text-sm text-destructive">
            Score: {(chunk.engagementScore * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Original Text */}
      <div className="mt-4">
        <p className="text-sm font-medium text-muted-foreground">Original:</p>
        <p className="mt-1 text-sm text-card-foreground italic">&quot;{chunk.text}&quot;</p>
      </div>

      {/* Analysis Reason */}
      <div className="mt-4">
        <p className="text-sm font-medium text-muted-foreground">Issue:</p>
        <p className="mt-1 text-sm text-card-foreground">{chunk.reason}</p>
      </div>

      {/* Suggestions */}
      {suggestion && (
        <div className="mt-6 space-y-4 border-t border-border pt-4">
          {/* Rewrite */}
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/20">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-card-foreground">Suggested Rewrite</p>
              <p className="mt-1 text-sm text-muted-foreground">{suggestion.rewrite}</p>
            </div>
          </div>

          {/* Slide Tip */}
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-chart-4/20">
              <Presentation className="h-4 w-4 text-chart-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-card-foreground">Slide Tip</p>
              <p className="mt-1 text-sm text-muted-foreground">{suggestion.slideTip}</p>
            </div>
          </div>

          {/* Coaching Tip */}
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-chart-2/20">
              <Lightbulb className="h-4 w-4 text-chart-2" />
            </div>
            <div>
              <p className="text-sm font-medium text-card-foreground">Coaching Tip</p>
              <p className="mt-1 text-sm text-muted-foreground">{suggestion.coachingTip}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
