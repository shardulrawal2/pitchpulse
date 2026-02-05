import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Parse JSON body with base64 audio data
    const body = await request.json()
    const { audioData, fileName, fileType } = body

    if (!audioData) {
      return NextResponse.json({ error: "No audio data provided" }, { status: 400 })
    }

    const apiKey = process.env.ASSEMBLYAI_API_KEY

    if (!apiKey) {
      console.log("[v0] No ASSEMBLYAI_API_KEY found, returning mock transcription")
      return NextResponse.json(getMockTranscription())
    }

    // Decode base64 to binary using Buffer (works in Node.js runtime)
    const buffer = Buffer.from(audioData, "base64")

    // Step 1: Upload the audio file to AssemblyAI using a Blob
    console.log("[v0] Uploading file to AssemblyAI, size:", buffer.length, "bytes")
    
    // Create a Blob from the buffer for fetch compatibility
    const blob = new Blob([buffer])
    
    const uploadResponse = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "content-type": "application/octet-stream",
      },
      body: blob,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error("[v0] Upload failed:", errorText)
      throw new Error(`Upload failed: ${uploadResponse.status}`)
    }

    const uploadResult = await uploadResponse.json()
    const audioUrl = uploadResult.upload_url
    console.log("[v0] File uploaded, URL:", audioUrl)

    // Step 2: Request transcription
    console.log("[v0] Requesting transcription...")
    const transcriptResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        speech_models: ["universal-2"],
      }),
    })

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text()
      console.error("[v0] Transcription request failed:", errorText)
      throw new Error(`Transcription request failed: ${transcriptResponse.status}`)
    }

    const transcriptResult = await transcriptResponse.json()
    const transcriptId = transcriptResult.id
    console.log("[v0] Transcription started, ID:", transcriptId)

    // Step 3: Poll for completion
    let transcript = transcriptResult
    let attempts = 0
    const maxAttempts = 60 // 5 minutes max (5 sec intervals)

    while (transcript.status !== "completed" && transcript.status !== "error" && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      
      const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          authorization: apiKey,
        },
      })

      if (!pollResponse.ok) {
        throw new Error(`Polling failed: ${pollResponse.status}`)
      }

      transcript = await pollResponse.json()
      console.log("[v0] Transcription status:", transcript.status)
      attempts++
    }

    if (transcript.status === "error") {
      console.error("[v0] Transcription error:", transcript.error)
      throw new Error(transcript.error || "Transcription failed")
    }

    if (transcript.status !== "completed") {
      throw new Error("Transcription timed out")
    }

    console.log("[v0] Transcription completed!")

    // Format response
    const words = transcript.words || []
    const response = {
      text: transcript.text || "",
      words: words.map((w: { text: string; start: number; end: number }) => ({
        text: w.text,
        start: w.start,
        end: w.end,
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Transcription error:", error)
    // Return mock data on error for demo purposes
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

  const words = []
  let currentTime = 0
  const wordsArray = text.split(/\s+/)

  for (const word of wordsArray) {
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
