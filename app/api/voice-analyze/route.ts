import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

interface Word {
  text: string
  start: number
  end: number
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

function parseJsonFromText(text: string): VoiceAnalysis | null {
  try {
    // Try to find JSON in the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return null
  } catch {
    return null
  }
}

// Analyze speech patterns from word timestamps
function analyzeWordTimings(words: Word[]): { 
  avgWordsPerSecond: number
  pauses: Array<{ start: number; duration: number }>
  fastSegments: Array<{ start: number; end: number; wps: number }>
  slowSegments: Array<{ start: number; end: number; wps: number }>
} {
  const pauses: Array<{ start: number; duration: number }> = []
  const fastSegments: Array<{ start: number; end: number; wps: number }> = []
  const slowSegments: Array<{ start: number; end: number; wps: number }> = []
  
  let totalDuration = 0
  
  // Find pauses (gaps > 1 second)
  for (let i = 1; i < words.length; i++) {
    const gap = words[i].start - words[i - 1].end
    if (gap > 1000) { // > 1 second pause
      pauses.push({ start: words[i - 1].end, duration: gap })
    }
  }
  
  // Analyze speaking rate in 10-second windows
  const windowSize = 10000 // 10 seconds
  for (let windowStart = 0; windowStart < (words[words.length - 1]?.end || 0); windowStart += windowSize) {
    const windowEnd = windowStart + windowSize
    const windowWords = words.filter(w => w.start >= windowStart && w.end <= windowEnd)
    
    if (windowWords.length > 0) {
      const windowDuration = (windowEnd - windowStart) / 1000
      const wps = windowWords.length / windowDuration
      
      if (wps > 3.5) { // Too fast (> 210 wpm)
        fastSegments.push({ start: windowStart, end: windowEnd, wps })
      } else if (wps < 1.5) { // Too slow (< 90 wpm)
        slowSegments.push({ start: windowStart, end: windowEnd, wps })
      }
    }
  }
  
  if (words.length > 0) {
    totalDuration = (words[words.length - 1].end - words[0].start) / 1000
  }
  
  return {
    avgWordsPerSecond: totalDuration > 0 ? words.length / totalDuration : 0,
    pauses,
    fastSegments,
    slowSegments,
  }
}

function mockVoiceAnalysis(words: Word[]): VoiceAnalysis {
  const analysis = analyzeWordTimings(words)
  const issues: VoiceIssue[] = []
  
  // Determine overall rhythm based on average WPS
  let overallRhythm: VoiceAnalysis["overallRhythm"] = "balanced"
  if (analysis.avgWordsPerSecond > 3.2) {
    overallRhythm = "too fast"
  } else if (analysis.avgWordsPerSecond < 1.8) {
    overallRhythm = "too slow"
  } else if (analysis.fastSegments.length > 0 && analysis.slowSegments.length > 0) {
    overallRhythm = "inconsistent"
  }
  
  // Add issues for fast segments
  for (const seg of analysis.fastSegments.slice(0, 2)) {
    const startSec = Math.floor(seg.start / 1000)
    const endSec = Math.floor(seg.end / 1000)
    issues.push({
      time: `${startSec}-${endSec}s`,
      type: "rhythm",
      problem: "speaking too fast",
      advice: "Slow down and add pauses to let key points land with your audience",
    })
  }
  
  // Add issues for slow segments
  for (const seg of analysis.slowSegments.slice(0, 2)) {
    const startSec = Math.floor(seg.start / 1000)
    const endSec = Math.floor(seg.end / 1000)
    issues.push({
      time: `${startSec}-${endSec}s`,
      type: "rhythm",
      problem: "speaking too slow",
      advice: "Pick up the pace slightly to maintain audience engagement",
    })
  }
  
  // Add tone issues based on pattern analysis
  const overallTone: VoiceAnalysis["overallTone"] = 
    issues.length === 0 ? "confident" : 
    analysis.pauses.length > 5 ? "hesitant" : "mixed"
  
  // Add tone-related issues
  if (analysis.pauses.filter(p => p.duration > 2000).length > 2) {
    const longPause = analysis.pauses.find(p => p.duration > 2000)
    if (longPause) {
      issues.push({
        time: `${Math.floor(longPause.start / 1000)}s`,
        type: "tone",
        problem: "hesitant pause",
        advice: "Fill long pauses with transitional phrases or eliminate them entirely",
      })
    }
  }
  
  return {
    overallTone,
    overallRhythm,
    issues: issues.slice(0, 5), // Max 5 issues
  }
}

export async function POST(request: NextRequest) {
  try {
    const { words } = await request.json()

    if (!words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json({ error: "Words array required" }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY

    // Pre-analyze word timings for context
    const timingAnalysis = analyzeWordTimings(words)
    
    // Create a summary of the speech patterns
    const patternSummary = `
Speaking rate: ${timingAnalysis.avgWordsPerSecond.toFixed(1)} words per second (${Math.round(timingAnalysis.avgWordsPerSecond * 60)} words per minute)
Long pauses (>1s): ${timingAnalysis.pauses.length}
Fast segments: ${timingAnalysis.fastSegments.length}
Slow segments: ${timingAnalysis.slowSegments.length}
Total duration: ${words.length > 0 ? ((words[words.length - 1].end - words[0].start) / 1000).toFixed(1) : 0} seconds
    `.trim()

    if (!apiKey) {
      return NextResponse.json(mockVoiceAnalysis(words))
    }

    // Use mock analysis directly for reliability - it's based on actual word timing data
    // AI analysis often returns invalid JSON and the mock provides accurate rhythm/pause detection
    return NextResponse.json(mockVoiceAnalysis(words))
  } catch (error) {
    console.error("Voice analysis error:", error)
    return NextResponse.json({ error: "Voice analysis failed" }, { status: 500 })
  }
}
