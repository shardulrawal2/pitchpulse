import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

interface WeakChunk {
  index: number
  start: number
  end: number
  text: string
  reason: string
}

interface Suggestion {
  rewrite: string
  slideTip: string
  coachingTip: string
}

const personaDescriptions: Record<string, string> = {
  angel: "Angel Investor focused on vision, passion, founder-market fit, and storytelling",
  vc: "VC Partner focused on unit economics, scalability, market size, and financial metrics",
  product: "Product-Led Investor focused on product differentiation, user experience, and innovation",
}

// Check if text is readable (not corrupted/gibberish)
function isReadableText(text: string): boolean {
  // Check for high ratio of special characters or random symbols
  const alphanumeric = text.replace(/[^a-zA-Z0-9\s]/g, "")
  const ratio = alphanumeric.length / text.length
  // Also check for very short words or random character sequences
  const words = text.split(/\s+/)
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length
  const hasRealWords = words.some(w => w.length > 2 && /^[a-zA-Z]+$/.test(w))
  
  return ratio > 0.7 && avgWordLength > 1.5 && hasRealWords
}

// Mock suggestions based on persona and content
function mockGetSuggestion(chunk: WeakChunk, persona: string): Suggestion {
  const text = chunk.text.toLowerCase()
  const wordCount = text.split(/\s+/).length
  const isReadable = isReadableText(chunk.text)

  // Generate contextual suggestions based on persona (without including corrupted text)
  const suggestions: Record<string, Suggestion> = {
    angel: {
      rewrite: isReadable 
        ? `Start with your personal "why" - what drove you to solve this problem? Share the moment that sparked your mission. Make it a story about the people you're helping.`
        : `[Transcription unclear] Restate your personal connection to the problem. Share a specific moment that made you commit to solving this.`,
      slideTip: "Add a founder photo or team slide. Include a quote from an early customer that shows the human impact of your solution.",
      coachingTip: "Slow down and make eye contact when delivering this section. Let your genuine passion show through your voice and body language.",
    },
    vc: {
      rewrite: isReadable
        ? `Quantify this section: "We've achieved [X metric] with [Y customers], representing [Z%] month-over-month growth. Our unit economics show [CAC] acquisition cost with [LTV] lifetime value..."`
        : `[Transcription unclear] Restructure with specific metrics: revenue numbers, growth percentages, customer counts, and unit economics (CAC/LTV).`,
      slideTip: "Replace text with a data visualization. Show your hockey stick growth chart or unit economics breakdown in a clean, scannable format.",
      coachingTip: "Lead with the numbers, then explain them. VCs process metrics quickly - give them the data point first, context second.",
    },
    product: {
      rewrite: isReadable
        ? `Focus on the user journey: "When users first encounter [problem], they typically [pain point]. Our solution provides [key feature] that results in [measurable improvement in user experience]..."`
        : `[Transcription unclear] Restructure around the user: describe the specific pain point, your solution's key feature, and the measurable UX improvement.`,
      slideTip: "Add a product screenshot or user flow diagram. Show, don't tell - let the UI demonstrate the value proposition.",
      coachingTip: "Consider a quick demo moment here. Even a 10-second screen recording can be more powerful than describing the feature.",
    },
  }

  const baseSuggestion = { ...suggestions[persona] } || { ...suggestions.angel }

  // Add context-specific adjustments
  if (wordCount < 20 && isReadable) {
    baseSuggestion.coachingTip += " This section feels rushed - expand with more detail and examples."
  }

  if (!isReadable) {
    baseSuggestion.coachingTip = "Note: The audio transcription for this segment was unclear. Consider re-recording or speaking more clearly in this section. " + baseSuggestion.coachingTip
  }

  if (chunk.reason.includes("metric") || chunk.reason.includes("quantitative")) {
    baseSuggestion.rewrite = `Add specific numbers followed by concrete metrics like percentages, dollar amounts, or user counts.`
  }

  return baseSuggestion
}

function parseJsonFromText(text: string): Suggestion | null {
  try {
    // Try to find JSON in the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      // Validate the structure
      if (
        typeof parsed.rewrite === "string" &&
        typeof parsed.slideTip === "string" &&
        typeof parsed.coachingTip === "string"
      ) {
        return {
          rewrite: parsed.rewrite,
          slideTip: parsed.slideTip,
          coachingTip: parsed.coachingTip,
        }
      }
    }
    return null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { weakChunks, persona } = await request.json() as {
      weakChunks: WeakChunk[]
      persona: string
    }

    if (!weakChunks || !persona) {
      return NextResponse.json({ error: "Missing weakChunks or persona" }, { status: 400 })
    }

    const personaDesc = personaDescriptions[persona] || personaDescriptions.angel

    // Process sequentially with delay to avoid rate limiting
    const suggestions = []
    for (let i = 0; i < weakChunks.length; i++) {
      const chunk = weakChunks[i]
      
      // Add delay between requests to avoid rate limiting
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 2100))
      }
      
      const suggestion = await getSuggestion(chunk, personaDesc, persona)
      suggestions.push({
        chunkIndex: chunk.index,
        ...suggestion,
      })
    }

    return NextResponse.json(suggestions)
  } catch (error) {
    console.error("Suggestion error:", error)
    return NextResponse.json({ error: "Suggestion generation failed" }, { status: 500 })
  }
}

async function getSuggestion(
  chunk: WeakChunk,
  personaDesc: string,
  persona: string
): Promise<Suggestion> {
  try {
    const result = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: `You are an expert pitch coach. The following pitch segment was identified as weak when presenting to a ${personaDesc}.

You MUST respond with ONLY a valid JSON object (no other text) in this exact format:
{
  "rewrite": "<an improved version of the pitch segment>",
  "slideTip": "<what to change on the supporting slide>",
  "coachingTip": "<delivery advice for the speaker>"
}`,
      prompt: `Improve this weak pitch segment and return ONLY JSON:\n\n"${chunk.text}"\n\nIssue identified: ${chunk.reason}`,
    })

    const parsed = parseJsonFromText(result.text)
    if (parsed) {
      return parsed
    }

    throw new Error("Failed to parse AI response")
  } catch (error) {
    // Fall back to mock suggestions when AI is unavailable
    return mockGetSuggestion(chunk, persona)
  }
}
