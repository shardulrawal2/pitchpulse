"use client"

import React from "react"

import { useRef, useState, useCallback } from "react"
import { Upload, X, FileVideo, Mic, Square, FileText, FileType } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

interface VideoUploadProps {
  onFileSelect: (file: File) => void
  onTextSelect: (text: string) => void
  selectedFile: File | null
  selectedText: string
  onClear: () => void
}

export function VideoUpload({ 
  onFileSelect, 
  onTextSelect, 
  selectedFile, 
  selectedText, 
  onClear 
}: VideoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textFileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [textInput, setTextInput] = useState("")
  const chunksRef = useRef<Blob[]>([])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.type.startsWith("video/") || file.type.startsWith("audio/"))) {
      onFileSelect(file)
    }
  }, [onFileSelect])

  const handleTextFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleTextFileRead(file)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  const handleTextFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleTextFileRead(file)
    }
  }

  const [isParsingDocument, setIsParsingDocument] = useState(false)

  const handleTextFileRead = async (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase()
    
    // For plain text files, read directly
    if (extension === 'txt') {
      const text = await file.text()
      onTextSelect(text)
      setTextInput(text)
      return
    }
    
    // For .docx, .doc, and .pdf files, use the server-side parser
    if (extension === 'docx' || extension === 'doc' || extension === 'pdf') {
      setIsParsingDocument(true)
      try {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch('/api/parse-document', {
          method: 'POST',
          body: formData,
        })
        
        const result = await response.json()
        
        if (!response.ok) {
          alert(result.error || "Could not parse document. Please paste your pitch text directly.")
          return
        }
        
        onTextSelect(result.text)
        setTextInput(result.text)
      } catch (error) {
        console.error("Document parsing error:", error)
        alert("Could not parse document. Please paste your pitch text directly.")
      } finally {
        setIsParsingDocument(false)
      }
      return
    }
    
    // For other files, try to read as plain text
    try {
      const text = await file.text()
      onTextSelect(text)
      setTextInput(text)
    } catch {
      alert("Could not read file. Please paste your pitch text directly.")
    }
  }

  const handleTextInputChange = (value: string) => {
    setTextInput(value)
    if (value.trim().length > 0) {
      onTextSelect(value)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        const file = new File([blob], "recording.webm", { type: "audio/webm" })
        onFileSelect(file)
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      alert("Could not access microphone. Please check permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      setMediaRecorder(null)
      setIsRecording(false)
    }
  }

  // Show selected file state
  if (selectedFile) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileVideo className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-card-foreground">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClear}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  // Show selected text state
  if (selectedText) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-card-foreground">Pitch Transcript</p>
              <p className="text-sm text-muted-foreground">
                {selectedText.split(/\s+/).length} words
              </p>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                {selectedText.substring(0, 200)}...
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClear} className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Tabs defaultValue="media" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="media" className="gap-2">
          <FileVideo className="h-4 w-4" />
          Video / Audio
        </TabsTrigger>
        <TabsTrigger value="text" className="gap-2">
          <FileText className="h-4 w-4" />
          Text / Document
        </TabsTrigger>
      </TabsList>

      <TabsContent value="media" className="space-y-4 mt-4">
        <div
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-border"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Drag and drop your video or audio file here
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,audio/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => fileInputRef.current?.click()}
          >
            Browse Files
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <div className="flex justify-center">
          {isRecording ? (
            <Button variant="destructive" onClick={stopRecording} className="gap-2">
              <Square className="h-4 w-4" />
              Stop Recording
            </Button>
          ) : (
            <Button variant="secondary" onClick={startRecording} className="gap-2">
              <Mic className="h-4 w-4" />
              Record Audio
            </Button>
          )}
        </div>
        {isRecording && (
          <p className="text-center text-sm text-destructive animate-pulse">
            Recording in progress...
          </p>
        )}
      </TabsContent>

      <TabsContent value="text" className="space-y-4 mt-4">
        <div
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-border"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleTextFileDrop}
        >
          <FileType className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Drag and drop your text file here
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supports .txt, .pdf, .doc, .docx files
          </p>
          <input
            ref={textFileInputRef}
            type="file"
            accept=".txt,.pdf,.doc,.docx,text/plain,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleTextFileChange}
            className="hidden"
          />
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => textFileInputRef.current?.click()}
            disabled={isParsingDocument}
          >
            {isParsingDocument ? "Parsing..." : "Browse Documents"}
          </Button>
        </div>
        
        {isParsingDocument && (
          <p className="text-center text-sm text-primary animate-pulse">
            Extracting text from document...
          </p>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or paste directly</span>
          </div>
        </div>

        <Textarea
          placeholder="Paste your pitch transcript here..."
          value={textInput}
          onChange={(e) => handleTextInputChange(e.target.value)}
          className="min-h-[200px] resize-none"
        />
        <p className="text-xs text-muted-foreground text-center">
          {textInput.split(/\s+/).filter(Boolean).length} words
        </p>
      </TabsContent>
    </Tabs>
  )
}
