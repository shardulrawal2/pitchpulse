"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Clock, Target, TrendingUp, Zap, Trash2, AlertTriangle, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  getPitchHistory,
  deletePitchFromHistory,
  clearPitchHistory,
  type PitchHistoryItem,
} from "@/lib/pitch-history"

const personaLabels: Record<string, { name: string; icon: typeof Target }> = {
  angel: { name: "Angel", icon: Target },
  vc: { name: "VC", icon: TrendingUp },
  product: { name: "Product", icon: Zap },
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return "Today"
  } else if (diffDays === 1) {
    return "Yesterday"
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
    })
  }
}

function getScoreColor(score: number): string {
  if (score >= 0.75) return "text-chart-2"
  if (score >= 0.55) return "text-chart-4"
  return "text-destructive"
}

interface PitchHistoryProps {
  maxItems?: number
  showClearAll?: boolean
}

export function PitchHistory({ maxItems, showClearAll = true }: PitchHistoryProps) {
  const router = useRouter()
  const [history, setHistory] = useState<PitchHistoryItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setHistory(getPitchHistory())
    setIsLoaded(true)
  }, [])

  const handleViewPitch = (item: PitchHistoryItem) => {
    // Store the results in sessionStorage and navigate to result page
    sessionStorage.setItem("pitchResults", item.results)
    router.push("/result")
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deletePitchFromHistory(id)
    setHistory(getPitchHistory())
  }

  const handleClearAll = () => {
    clearPitchHistory()
    setHistory([])
  }

  if (!isLoaded) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <Clock className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">No pitch history yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Analyze your first pitch to see it here
        </p>
      </div>
    )
  }

  const displayHistory = maxItems ? history.slice(0, maxItems) : history

  return (
    <div className="space-y-4">
      {showClearAll && history.length > 0 && (
        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Clear All History?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {history.length} pitch analyses from your history. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearAll}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
      
      <div className="space-y-3">
        {displayHistory.map((item) => {
          const PersonaIcon = personaLabels[item.persona]?.icon || Target
          
          return (
            <button
              key={item.id}
              onClick={() => handleViewPitch(item)}
              className="group relative flex w-full items-start gap-4 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-card/80"
            >
              {/* Score indicator */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                <span className={`text-lg font-bold ${getScoreColor(item.overallScore)}`}>
                  {(item.overallScore * 100).toFixed(0)}
                </span>
              </div>
              
              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate font-medium text-card-foreground">
                    {item.title}
                  </h3>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(item.date)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </div>
                
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                  {item.transcriptPreview}
                </p>
                
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <PersonaIcon className="h-3 w-3" />
                    <span>{personaLabels[item.persona]?.name || item.persona}</span>
                  </div>
                  
                  {item.weakMomentsCount > 0 && (
                    <span className="text-xs text-destructive">
                      {item.weakMomentsCount} weak moment{item.weakMomentsCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Delete button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this pitch?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove this pitch analysis from your history.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => handleDelete(item.id, e)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </button>
          )
        })}
      </div>
      
      {maxItems && history.length > maxItems && (
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => router.push("/history")}
        >
          View all {history.length} pitches
        </Button>
      )}
    </div>
  )
}
