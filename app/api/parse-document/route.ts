import { NextRequest, NextResponse } from "next/server"
import mammoth from "mammoth"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const extension = file.name.split('.').pop()?.toLowerCase()
    const arrayBuffer = await file.arrayBuffer()
    
    let text = ""

    if (extension === 'txt') {
      // Plain text - just decode
      text = new TextDecoder().decode(arrayBuffer)
    } else if (extension === 'docx') {
      // Use mammoth to extract text from Word documents
      const result = await mammoth.extractRawText({ arrayBuffer })
      text = result.value
    } else if (extension === 'doc') {
      // Older .doc format - mammoth may work but with limitations
      try {
        const result = await mammoth.extractRawText({ arrayBuffer })
        text = result.value
      } catch {
        return NextResponse.json({ 
          error: "Could not parse .doc file. Please convert to .docx or paste text directly." 
        }, { status: 400 })
      }
    } else if (extension === 'pdf') {
      // PDF parsing requires pdf-parse or similar
      // For now, return an error asking user to paste text
      return NextResponse.json({ 
        error: "PDF parsing not supported yet. Please paste your pitch text directly or use a .txt/.docx file." 
      }, { status: 400 })
    } else {
      return NextResponse.json({ 
        error: `Unsupported file type: .${extension}` 
      }, { status: 400 })
    }

    // Clean up the text
    text = text.trim()
    
    if (!text || text.length < 10) {
      return NextResponse.json({ 
        error: "Could not extract text from document. Please paste your pitch text directly." 
      }, { status: 400 })
    }

    return NextResponse.json({ text })
  } catch (error) {
    console.error("Document parsing error:", error)
    return NextResponse.json({ 
      error: "Failed to parse document. Please paste your pitch text directly." 
    }, { status: 500 })
  }
}
