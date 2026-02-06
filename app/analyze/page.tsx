"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Activity, ArrowLeft, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VideoUpload } from "@/components/pitch/VideoUpload"
import { PersonaSelector, type Persona } from "@/components/pitch/PersonaSelector"
import { AnalyzeButton } from "@/components/pitch/AnalyzeButton"
import { savePitchToHistory } from "@/lib/pitch-history"

export default function AnalyzePage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [textInput, setTextInput] = useState("")
  const [persona, setPersona] = useState<Persona>("angel")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState("")

  const handleClear = () => {
    setFile(null)
    setTextInput("")
  }

  const handleAnalyze = async () => {
    if (!file && !textInput) return

    setLoading(true)

    try {
      let transcription: { text: string; words: Array<{ text: string; start: number; end: number }> }

      if (textInput) {
        // Use text input directly - create synthetic word timestamps
        setProgress("Processing text...")
        const words = textInput.split(/\s+/).filter(Boolean)
        const wordsPerSecond = 2.5 // Average speaking rate
        transcription = {
          text: textInput,
          words: words.map((word, i) => ({
            text: word,
            start: Math.floor(i / wordsPerSecond) * 1000,
            end: Math.floor((i + 1) / wordsPerSecond) * 1000,
          })),
        }
      } else if (file) {
        // Transcribe audio/video file
        const fileSizeMB = file.size / (1024 * 1024)
        
        // Check file size - warn if over 40MB
        if (fileSizeMB > 40) {
          const proceed = confirm(`This file is ${fileSizeMB.toFixed(1)}MB. Files over 45MB cannot be processed due to platform limits. Continue?`)
          if (!proceed) {
            setLoading(false)
            return
          }
        }
        
        setProgress(`Uploading and transcribing (${fileSizeMB.toFixed(1)}MB)...`)
        
        // Convert file to base64 using FileReader (handles large files properly)
        const audioData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result as string
            // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
            const base64 = result.split(",")[1]
            resolve(base64)
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        const transcribeRes = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioData,
            fileName: file.name,
            fileType: file.type,
          }),
        })

        if (!transcribeRes.ok) {
          throw new Error("Transcription failed")
        }

        transcription = await transcribeRes.json()
      } else {
        throw new Error("No input provided")
      }

      setProgress("Analyzing engagement...")

      // Step 2: Analyze
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcription,
          persona,
        }),
      })

      if (!analyzeRes.ok) {
        throw new Error("Analysis failed")
      }

      const analysis = await analyzeRes.json()
      setProgress("Generating suggestions...")

      // Step 3: Get suggestions for weak moments
      const weakChunks = analysis.chunks.filter((c: { weakMoment: boolean }) => c.weakMoment)
      
      let suggestions: Array<{
        chunkIndex: number
        rewrite: string
        slideTip: string
        coachingTip: string
      }> = []
      
      if (weakChunks.length > 0) {
        const suggestRes = await fetch("/api/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weakChunks,
            persona,
          }),
        })

        if (suggestRes.ok) {
          suggestions = await suggestRes.json()
        }
      }

      // Step 4: Voice analysis (tonality & rhythm)
      setProgress("Analyzing voice delivery...")
      let voiceAnalysis = null
      
      try {
        const voiceRes = await fetch("/api/voice-analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            words: transcription.words,
          }),
        })
        
        if (voiceRes.ok) {
          voiceAnalysis = await voiceRes.json()
        }
      } catch (err) {
        console.error("Voice analysis error:", err)
      }

      // Step 5: Video analysis (only for video files)
      let videoFeedback: Array<{ time: string; issue: string; advice: string }> = []
      
      if (file && (file.type.startsWith("video/") || file.name.match(/\.(mp4|webm|mov|avi)$/i))) {
        setProgress("Analyzing body language...")
        try {
          // Estimate video duration from transcript
          const lastWord = transcription.words[transcription.words.length - 1]
          const durationSeconds = lastWord ? Math.ceil(lastWord.end / 1000) : 60
          
          const videoRes = await fetch("/api/video-analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              durationSeconds,
            }),
          })
          
          if (videoRes.ok) {
            videoFeedback = await videoRes.json()
          }
        } catch (err) {
          console.error("Video analysis error:", err)
        }
      }

      // Store results and navigate
      const results = {
        transcript: transcription,
        analysis,
        suggestions,
        voiceAnalysis,
        videoFeedback,
        persona,
        inputType: textInput ? "text" : "media",
      }
      
      // Save to history
      savePitchToHistory(results)
      
      sessionStorage.setItem("pitchResults", JSON.stringify(results))
      router.push("/result")
    } catch (error) {
      console.error("Analysis error:", error)
      alert("Failed to analyze pitch. Please try again.")
    } finally {
      setLoading(false)
      setProgress("")
    }
  }

  const hasInput = !!file || !!textInput

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold text-foreground">PitchPulse</span>
          </Link>
          <Link href="/history">
            <Button variant="ghost" className="gap-2 bg-transparent">
              <History className="h-4 w-4" />
              History
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="gap-2 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground">Analyze Your Pitch</h1>
        <p className="mt-2 text-muted-foreground">
          Upload a video, record audio, or paste your pitch transcript. Then select your target investor persona.
        </p>

        {/* Upload Section */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">1. Add Your Pitch</h2>
          <div className="mt-4">
            <VideoUpload
              onFileSelect={setFile}
              onTextSelect={setTextInput}
              selectedFile={file}
              selectedText={textInput}
              onClear={handleClear}
            />
          </div>
        </div>

        {/* Persona Selection */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">2. Choose Investor Persona</h2>
          <div className="mt-4">
            <PersonaSelector selected={persona} onSelect={setPersona} />
          </div>
        </div>

        {/* Analyze Button */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">3. Start Analysis</h2>
          <div className="mt-4">
            <AnalyzeButton
              onClick={handleAnalyze}
              disabled={!hasInput}
              loading={loading}
            />
            {progress && (
              <p className="mt-4 text-center text-sm text-muted-foreground">{progress}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
