"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Video, Eye, Hand, UserRound, BookOpen, Sparkles } from "lucide-react"

interface VideoFeedback {
  time: string
  issue: string
  advice: string
}

interface VideoFeedbackListProps {
  feedback: VideoFeedback[]
  onTimeClick?: (timeString: string) => void
}

// Map issues to icons
function getIssueIcon(issue: string) {
  const lowerIssue = issue.toLowerCase()
  if (lowerIssue.includes("eye") || lowerIssue.includes("contact")) {
    return <Eye className="h-4 w-4" />
  }
  if (lowerIssue.includes("hand") || lowerIssue.includes("gesture")) {
    return <Hand className="h-4 w-4" />
  }
  if (lowerIssue.includes("posture") || lowerIssue.includes("slouch")) {
    return <UserRound className="h-4 w-4" />
  }
  if (lowerIssue.includes("read") || lowerIssue.includes("notes")) {
    return <BookOpen className="h-4 w-4" />
  }
  return <Sparkles className="h-4 w-4" />
}

// Parse time string to get start seconds
function parseTimeToSeconds(timeString: string): number {
  const match = timeString.match(/(\d+)/)
  return match ? parseInt(match[1]) : 0
}

export function VideoFeedbackList({ feedback, onTimeClick }: VideoFeedbackListProps) {
  if (!feedback || feedback.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Video className="h-5 w-5 text-primary" />
            Video Delivery Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No video feedback available. Upload a video to get delivery analysis.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Video className="h-5 w-5 text-primary" />
          Video Delivery Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedback.map((item, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => onTimeClick?.(item.time)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-destructive/20 text-destructive">
                  {getIssueIcon(item.issue)}
                </div>
                <div>
                  <Badge variant="outline" className="mb-1 text-xs">
                    {item.time}
                  </Badge>
                  <p className="font-medium text-foreground capitalize">
                    {item.issue}
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground pl-11">
              <span className="text-primary font-medium">Tip:</span> {item.advice}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
