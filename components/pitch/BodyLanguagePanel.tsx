"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Video, Eye, Hand, User, Smile } from "lucide-react"

interface BodyLanguageIssue {
  time: string
  issue: string
  advice: string
}

interface BodyLanguagePanelProps {
  feedback: BodyLanguageIssue[]
}

const issueIcons: Record<string, typeof Eye> = {
  "eye contact": Eye,
  "gesture": Hand,
  "posture": User,
  "facial": Smile,
}

function getIssueIcon(issue: string) {
  const lowerIssue = issue.toLowerCase()
  for (const [key, Icon] of Object.entries(issueIcons)) {
    if (lowerIssue.includes(key)) {
      return Icon
    }
  }
  return Video
}

function getIssueColor(issue: string): string {
  const lowerIssue = issue.toLowerCase()
  if (lowerIssue.includes("eye")) return "border-blue-500/30 bg-blue-500/20 text-blue-400"
  if (lowerIssue.includes("gesture") || lowerIssue.includes("hand")) return "border-purple-500/30 bg-purple-500/20 text-purple-400"
  if (lowerIssue.includes("posture")) return "border-orange-500/30 bg-orange-500/20 text-orange-400"
  if (lowerIssue.includes("facial") || lowerIssue.includes("expression")) return "border-pink-500/30 bg-pink-500/20 text-pink-400"
  return "border-muted-foreground/30 bg-muted/20 text-muted-foreground"
}

export function BodyLanguagePanel({ feedback }: BodyLanguagePanelProps) {
  if (!feedback || feedback.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Video className="h-5 w-5 text-primary" />
            Body Language Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-center">
            <p className="text-sm text-green-400">
              Great body language! No major issues detected.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Video className="h-5 w-5 text-primary" />
          Body Language Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {feedback.map((item, index) => {
          const Icon = getIssueIcon(item.issue)
          return (
            <div
              key={index}
              className="rounded-lg border border-border bg-secondary/20 p-4"
            >
              <div className="mb-2 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {item.time}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getIssueColor(item.issue)}`}
                    >
                      {item.issue}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground/80">{item.advice}</p>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
