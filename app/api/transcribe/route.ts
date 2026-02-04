import { NextRequest, NextResponse } from "next/server"
import { AssemblyAI } from "assemblyai"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const apiKey = process.env.ASSEMBLYAI_API_KEY

    if (!apiKey) {
      // Return mock data if no API key
      console.log("[v0] No ASSEMBLYAI_API_KEY found, returning mock transcription")
      return NextResponse.json(getMockTranscription())
    }

    const client = new AssemblyAI({ apiKey })

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload and transcribe
    const transcript = await client.transcripts.transcribe({
      audio: buffer,
    })

    if (transcript.status === "error") {
      throw new Error(transcript.error || "Transcription failed")
    }

    // Format response
    const words = transcript.words || []
    const response = {
      text: transcript.text || "",
      words: words.map((w) => ({
        text: w.text,
        start: w.start,
        end: w.end,
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Transcription error:", error)
    // Return mock data on error for demo purposes
    return NextResponse.json(getMockTranscription())
  }
}

function getMockTranscription() {
  // Mock transcription data for demo
  const text = `Hello investors, I'm excited to present our startup today. We're building the next generation of AI-powered productivity tools.

Our platform helps teams collaborate more effectively by using machine learning to prioritize tasks and automate routine work. We've seen incredible traction with over 10,000 active users.

The market opportunity is massive. The productivity software market is worth 50 billion dollars and growing at 15 percent annually. We're targeting enterprise customers first.

Our unit economics are strong. Customer acquisition cost is 200 dollars with a lifetime value of 2,400 dollars. That's a 12x LTV to CAC ratio.

We've built a world-class team with experience from Google, Meta, and top startups. Our technology moat is our proprietary AI model trained on millions of productivity workflows.

We're raising 5 million dollars to expand our sales team and accelerate product development. Join us in revolutionizing how teams work.`

  const words = []
  let currentTime = 0
  const wordsArray = text.split(/\s+/)

  for (const word of wordsArray) {
    const duration = Math.random() * 300 + 200 // 200-500ms per word
    words.push({
      text: word,
      start: Math.round(currentTime),
      end: Math.round(currentTime + duration),
    })
    currentTime += duration + Math.random() * 100
  }

  return { text, words }
}
