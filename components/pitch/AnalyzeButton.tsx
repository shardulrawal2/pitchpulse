"use client"

import { Loader2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AnalyzeButtonProps {
  onClick: () => void
  disabled: boolean
  loading: boolean
}

export function AnalyzeButton({ onClick, disabled, loading }: AnalyzeButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      size="lg"
      className="w-full gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
          <Zap className="h-4 w-4" />
          Analyze Pitch
        </>
      )}
    </Button>
  )
}
