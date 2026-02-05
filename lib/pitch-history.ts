export interface PitchHistoryItem {
  id: string
  title: string
  date: string
  persona: string
  overallScore: number
  weakMomentsCount: number
  transcriptPreview: string
  results: string // Stringified results for storage
}

const HISTORY_KEY = "pitchHistory"
const MAX_HISTORY_ITEMS = 50

export function generatePitchTitle(transcript: string): string {
  // Extract first meaningful sentence or phrase
  const cleaned = transcript.trim().replace(/\s+/g, " ")
  const firstSentence = cleaned.split(/[.!?]/)[0]
  
  if (firstSentence.length <= 50) {
    return firstSentence || "Untitled Pitch"
  }
  
  return firstSentence.substring(0, 47) + "..."
}

export function getPitchHistory(): PitchHistoryItem[] {
  if (typeof window === "undefined") return []
  
  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function savePitchToHistory(
  results: {
    transcript: { text: string }
    analysis: { overallScore: number; chunks: Array<{ weakMoment: boolean }> }
    persona: string
  }
): PitchHistoryItem {
  const history = getPitchHistory()
  
  const newItem: PitchHistoryItem = {
    id: `pitch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: generatePitchTitle(results.transcript.text),
    date: new Date().toISOString(),
    persona: results.persona,
    overallScore: results.analysis.overallScore,
    weakMomentsCount: results.analysis.chunks.filter(c => c.weakMoment).length,
    transcriptPreview: results.transcript.text.substring(0, 150) + (results.transcript.text.length > 150 ? "..." : ""),
    results: JSON.stringify(results),
  }
  
  // Add to beginning of array and limit size
  const updated = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS)
  
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  } catch {
    // Storage might be full, try removing oldest items
    const reduced = updated.slice(0, 20)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(reduced))
  }
  
  return newItem
}

export function getPitchById(id: string): PitchHistoryItem | null {
  const history = getPitchHistory()
  return history.find(item => item.id === id) || null
}

export function deletePitchFromHistory(id: string): void {
  const history = getPitchHistory()
  const updated = history.filter(item => item.id !== id)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
}

export function clearPitchHistory(): void {
  localStorage.removeItem(HISTORY_KEY)
}
