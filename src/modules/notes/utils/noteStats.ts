export interface NoteStats {
  wordCount: number
  charCount: number
  readingTimeMinutes: number
}

export function calculateWordCount(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).filter(Boolean).length
}

export function calculateCharCount(text: string): number {
  return text.length
}

export function calculateReadingTime(wordCount: number, wordsPerMinute: number = 200): number {
  if (wordCount <= 0) return 0
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}

export function getNoteStats(content: string): NoteStats {
  const wordCount = calculateWordCount(content)
  const charCount = calculateCharCount(content)
  const readingTimeMinutes = calculateReadingTime(wordCount)

  return {
    wordCount,
    charCount,
    readingTimeMinutes
  }
}
