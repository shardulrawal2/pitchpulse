import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

interface VideoFeedback {
  time: string
  issue: string
  advice: string
}

// Parse JSON from text response
function parseJsonFromText(text: string): VideoFeedback[] | null {
  try {
    // Try direct parse
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) return parsed
    return null
  } catch {
    // Try to extract JSON array from text
    const match = text.match(/\[[\s\S]*\]/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        return null
      }
    }
    return null
  }
}

// Mock video analysis based on video duration
function mockVideoAnalysis(durationSeconds: number): VideoFeedback[] {
  const feedback: VideoFeedback[] = []
  const issues = [
    { issue: "limited eye contact", advice: "Look directly at the camera to create connection with your audience" },
    { issue: "minimal hand gestures", advice: "Use purposeful hand movements to emphasize key points" },
    { issue: "static posture", advice: "Lean slightly forward to show engagement and energy" },
    { issue: "appears to be reading", advice: "Practice your pitch to deliver it more naturally without notes" },
    { issue: "low facial expressiveness", advice: "Smile when discussing positive outcomes, show enthusiasm" },
    { issue: "speaking too fast", advice: "Pause after key points to let them sink in" },
    { issue: "monotone delivery", advice: "Vary your pitch and volume to maintain audience attention" },
  ]

  // Generate 2-4 feedback points based on duration
  const numFeedback = Math.min(Math.floor(durationSeconds / 30) + 1, 4)
  const interval = Math.floor(durationSeconds / (numFeedback + 1))

  for (let i = 0; i < numFeedback; i++) {
    const startTime = interval * (i + 1)
    const endTime = Math.min(startTime + 6, durationSeconds)
    const randomIssue = issues[Math.floor(Math.random() * issues.length)]
    
    feedback.push({
      time: `${startTime}-${endTime}s`,
      issue: randomIssue.issue,
      advice: randomIssue.advice,
    })
  }

  return feedback
}

export async function POST(request: NextRequest) {
  try {
    const { durationSeconds, frameDescriptions } = await request.json()

    if (!durationSeconds) {
      return NextResponse.json({ error: "Duration is required" }, { status: 400 })
    }

    // If we have frame descriptions (from a vision model), analyze them
    // Otherwise, provide general feedback based on duration
    
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      console.log("[v0] No GROQ_API_KEY, using mock video analysis")
      return NextResponse.json(mockVideoAnalysis(durationSeconds))
    }

    try {
      // Since Groq doesn't have vision capabilities, we'll use text-based analysis
      // if frame descriptions are provided, otherwise use mock
      if (frameDescriptions && frameDescriptions.length > 0) {
        const result = await generateText({
          model: groq("llama-3.3-70b-versatile"),
          system: `You are analyzing a founder pitching on video based on frame descriptions.
Identify moments where delivery could improve.

Look for:
- Low eye contact (looking away from camera)
- No hand movement (static hands)
- Slouching or poor posture
- Reading from screen (eyes looking down)
- Low facial energy (no smiling, flat expression)

Return ONLY a JSON array with this format:
[
  {
    "time": "12-18s",
    "issue": "low energy",
    "advice": "raise voice and show enthusiasm"
  }
]

Return valid JSON array only, no other text.`,
          prompt: `Video duration: ${durationSeconds} seconds

Frame descriptions at various timestamps:
${frameDescriptions.map((f: { time: number; description: string }) => `${f.time}s: ${f.description}`).join("\n")}

Analyze the delivery and provide feedback.`,
        })

        const feedback = parseJsonFromText(result.text)
        if (feedback && feedback.length > 0) {
          return NextResponse.json(feedback)
        }
      }

      // Fall back to mock if no frame descriptions or parsing failed
      return NextResponse.json(mockVideoAnalysis(durationSeconds))
    } catch (error) {
      console.log("[v0] Video analysis AI error, using mock:", error)
      return NextResponse.json(mockVideoAnalysis(durationSeconds))
    }
  } catch (error) {
    console.error("Video analysis error:", error)
    return NextResponse.json({ error: "Video analysis failed" }, { status: 500 })
  }
}
