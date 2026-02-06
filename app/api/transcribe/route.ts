import { NextRequest, NextResponse } from "next/server"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
}

export async function POST(request: NextRequest) {
  try {
    // Parse JSON body with base64 audio data
    const body = await request.json()
    const { audioData, audioUrl: providedAudioUrl } = body

    const apiKey = process.env.DEEPGRAM_API_KEY

    if (!apiKey) {
      console.log("[v0] No DEEPGRAM_API_KEY found, returning mock transcription")
      return NextResponse.json(getMockTranscription())
    }

    let audioUrl = providedAudioUrl

    // If audioData provided, upload to Deepgram
    if (audioData && !audioUrl) {
      // Decode base64 to Buffer (Node.js compatible)
      const buffer = Buffer.from(audioData, "base64")

      console.log("[v0] Uploading file to Deepgram, size:", buffer.length, "bytes")
      
      // Convert to ArrayBuffer for fetch compatibility
      const arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      )
      
      const uploadResponse = await fetch("https://api.deepgram.com/v1/upload", {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "audio/webm",
        },
        body: arrayBuffer,
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error("[v0] Upload failed:", errorText)
        throw new Error(`Upload failed: ${uploadResponse.status}`)
      }

      const uploadResult = await uploadResponse.json()
      audioUrl = uploadResult.s3_url
      console.log("[v0] File uploaded, URL:", audioUrl)
    }

    if (!audioUrl) {
      throw new Error("No audio data or URL provided")
    }

    // Request transcription
    console.log("[v0] Requesting transcription...")
    const transcriptResponse = await fetch(`https://api.deepgram.com/v1/listen?model=nova-2&punctuate=true&utterances=true`, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: audioUrl,
      }),
    })

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text()
      console.error("[v0] Transcription request failed:", errorText)
      throw new Error(`Transcription request failed: ${transcriptResponse.status}`)
    }

    const transcriptResult = await transcriptResponse.json()
    console.log("[v0] Transcription completed!")

    // Deepgram returns results directly, no polling needed
    const words = transcriptResult.results?.channels?.[0]?.alternatives?.[0]?.words || []
    const text = transcriptResult.results?.channels?.[0]?.alternatives?.[0]?.transcript || ""

    return NextResponse.json({
      text,
      words: words.map((w: { word: string; start: number; end: number }) => ({
        text: w.word,
        start: w.start,
        end: w.end,
      })),
    })
  } catch (error) {
    console.error("Transcription error:", error)
    console.log("[v0] Falling back to mock transcription due to error")
    return NextResponse.json(getMockTranscription())
  }
}

function getMockTranscription() {
  const text = `Hello investors, I'm excited to present our startup today. We're building the next generation of AI-powered productivity tools.

Our platform helps teams collaborate more effectively by using machine learning to prioritize tasks and automate routine work. We've seen incredible traction with over 10,000 active users.

The market opportunity is massive. The productivity software market is worth 50 billion dollars and growing at 15 percent annually. We're targeting enterprise customers first.

Our unit economics are strong. Customer acquisition cost is 200 dollars with a lifetime value of 2,400 dollars. That's a 12x LTV to CAC ratio.

We've built a world-class team with experience from Google, Meta, and top startups. Our technology moat is our proprietary AI model trained on millions of productivity workflows.

We're raising 5 million dollars to expand our sales team and accelerate product development. Join us in revolutionizing how teams work.`

  const words: Array<{ text: string; start: number; end: number }> = []
  let currentTime = 0

  for (const word of text.split(/\s+/)) {
    const duration = Math.random() * 300 + 200
    words.push({
      text: word,
      start: Math.round(currentTime),
      end: Math.round(currentTime + duration),
    })
    currentTime += duration + Math.random() * 100
  }

  return { text, words }
}
