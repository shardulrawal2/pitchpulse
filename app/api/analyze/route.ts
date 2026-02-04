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

interface Transcript {
  text: string
  words: Word[]
}

interface Chunk {
  start: number
  end: number
  text: string
}

interface ChunkAnalysis {
  sentiment: number
  energy: number
  clarity: number
  personaFit: number
  reason: string
}

const personaDescriptions: Record<string, string> = {
  angel: "Angel Investor focused on vision, passion, founder-market fit, and the founder's ability to inspire and lead. Values storytelling, authenticity, and potential over perfect metrics.",
  vc: "VC Partner focused on unit economics, scalability, market size, competitive moats, and path to profitability. Values data-driven arguments and clear financial metrics.",
  product: "Product-Led Investor focused on product differentiation, user experience, product-market fit, and viral potential. Values innovation, design thinking, and user-centric approach.",
}

// Keywords that indicate strong pitch elements by persona
const personaKeywords: Record<string, string[]> = {
  angel: ["vision", "passion", "dream", "mission", "team", "founder", "believe", "story", "journey", "impact", "change", "world"],
  vc: ["revenue", "growth", "margin", "market", "scale", "unit economics", "cac", "ltv", "arr", "mrr", "profit", "roi", "billion", "million"],
  product: ["user", "experience", "design", "feature", "innovation", "interface", "engagement", "retention", "viral", "adoption", "feedback", "intuitive"],
}

// Mock analysis that generates realistic scores based on text content
function mockAnalyzeChunk(chunk: Chunk, persona: string): ChunkAnalysis {
  const text = chunk.text.toLowerCase()
  const words = text.split(/\s+/)
  const keywords = personaKeywords[persona] || personaKeywords.angel

  // Calculate base scores from text characteristics
  const wordCount = words.length
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / wordCount
  const hasNumbers = /\d+/.test(text)
  const keywordMatches = keywords.filter(k => text.includes(k)).length

  // Sentiment: Based on positive language and keyword matches
  const sentiment = Math.min(0.9, 0.4 + (keywordMatches * 0.08) + (hasNumbers ? 0.1 : 0))

  // Energy: Based on variety and exclamations
  const hasExclamations = /!/.test(text)
  const energy = Math.min(0.9, 0.45 + (hasExclamations ? 0.15 : 0) + (wordCount > 30 ? 0.1 : 0) + Math.random() * 0.1)

  // Clarity: Based on average word length and sentence structure
  const clarity = Math.min(0.9, 0.5 + (avgWordLength < 6 ? 0.15 : -0.05) + (wordCount > 15 && wordCount < 50 ? 0.1 : 0) + Math.random() * 0.1)

  // Persona fit: Based on keyword matches
  const personaFit = Math.min(0.9, 0.35 + (keywordMatches * 0.1) + (hasNumbers && persona === "vc" ? 0.15 : 0))

  // Generate reason based on analysis
  let reason = ""
  if (keywordMatches > 2) {
    reason = `Strong alignment with ${persona} priorities. Good use of relevant terminology.`
  } else if (keywordMatches > 0) {
    reason = `Some relevant points for ${persona} investors, but could emphasize key metrics more.`
  } else {
    reason = `Consider adding more ${persona === "vc" ? "quantitative metrics" : persona === "product" ? "user-centric language" : "vision and passion"} to resonate better.`
  }

  return {
    sentiment: Math.round(sentiment * 100) / 100,
    energy: Math.round(energy * 100) / 100,
    clarity: Math.round(clarity * 100) / 100,
    personaFit: Math.round(personaFit * 100) / 100,
    reason,
  }
}

function parseJsonFromText(text: string): ChunkAnalysis | null {
  try {
    // Try to find JSON in the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      // Validate the structure
      if (
        typeof parsed.sentiment === "number" &&
        typeof parsed.energy === "number" &&
        typeof parsed.clarity === "number" &&
        typeof parsed.personaFit === "number" &&
        typeof parsed.reason === "string"
      ) {
        return {
          sentiment: Math.max(0, Math.min(1, parsed.sentiment)),
          energy: Math.max(0, Math.min(1, parsed.energy)),
          clarity: Math.max(0, Math.min(1, parsed.clarity)),
          personaFit: Math.max(0, Math.min(1, parsed.personaFit)),
          reason: parsed.reason,
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
    const { transcript, persona } = await request.json() as {
      transcript: Transcript
      persona: string
    }

    if (!transcript || !persona) {
      return NextResponse.json({ error: "Missing transcript or persona" }, { status: 400 })
    }

    // Create chunks (20 second segments)
    const chunks = createChunks(transcript)
    const personaDesc = personaDescriptions[persona] || personaDescriptions.angel

    // Process chunks sequentially with delay to avoid rate limiting
    const analyzedChunks = []
    for (let index = 0; index < chunks.length; index++) {
      const chunk = chunks[index]
      
      // Add delay between requests to avoid rate limiting (max 30 req/min = 2 sec between)
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, 2100))
      }
      
      const analysis = await analyzeChunk(chunk, personaDesc, persona)
      const engagementScore =
        0.3 * analysis.sentiment +
        0.2 * analysis.energy +
        0.3 * analysis.clarity +
        0.2 * analysis.personaFit

      analyzedChunks.push({
        index,
        ...chunk,
        ...analysis,
        engagementScore,
        weakMoment: engagementScore < 0.55,
      })
    }

    // Calculate overall score
    const overallScore =
      analyzedChunks.reduce((acc, c) => acc + c.engagementScore, 0) / analyzedChunks.length

    return NextResponse.json({
      chunks: analyzedChunks,
      overallScore,
    })
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 })
  }
}

function createChunks(transcript: Transcript): Chunk[] {
  const chunkDuration = 20000 // 20 seconds in ms
  const chunks: Chunk[] = []
  const words = transcript.words

  if (words.length === 0) {
    return [{ start: 0, end: 20000, text: transcript.text }]
  }

  let chunkStart = words[0].start
  let chunkWords: string[] = []

  for (const word of words) {
    if (word.start - chunkStart >= chunkDuration && chunkWords.length > 0) {
      chunks.push({
        start: chunkStart,
        end: word.start,
        text: chunkWords.join(" "),
      })
      chunkStart = word.start
      chunkWords = []
    }
    chunkWords.push(word.text)
  }

  // Add remaining words
  if (chunkWords.length > 0) {
    chunks.push({
      start: chunkStart,
      end: words[words.length - 1].end,
      text: chunkWords.join(" "),
    })
  }

  return chunks
}

async function analyzeChunk(
  chunk: Chunk,
  personaDesc: string,
  persona: string
): Promise<ChunkAnalysis> {
  try {
    const result = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: `You are an expert pitch coach analyzing startup pitches for investors. 
Evaluate the following pitch segment from the perspective of: ${personaDesc}

You MUST respond with ONLY a valid JSON object (no other text) in this exact format:
{
  "sentiment": <number between 0 and 1>,
  "energy": <number between 0 and 1>,
  "clarity": <number between 0 and 1>,
  "personaFit": <number between 0 and 1>,
  "reason": "<brief explanation>"
}`,
      prompt: `Analyze this pitch segment and return ONLY JSON:\n\n"${chunk.text}"`,
    })

    const parsed = parseJsonFromText(result.text)
    if (parsed) {
      return parsed
    }

    throw new Error("Failed to parse AI response")
  } catch (error) {
    // Fall back to mock analysis when AI is unavailable
    return mockAnalyzeChunk(chunk, persona)
  }
}
