import { describe, it, expect } from 'vitest'
import {
  calculateWordCount,
  calculateCharCount,
  calculateReadingTime,
  getNoteStats
} from '../noteStats'

describe('noteStats utility', () => {
  it('calculates word count accurately', () => {
    expect(calculateWordCount('')).toBe(0)
    expect(calculateWordCount('   ')).toBe(0)
    expect(calculateWordCount('Hello world')).toBe(2)
    expect(calculateWordCount('First line\nSecond line\n\nThird line with  spaces')).toBe(8)
  })

  it('calculates character count accurately', () => {
    expect(calculateCharCount('')).toBe(0)
    expect(calculateCharCount('abc')).toBe(3)
    expect(calculateCharCount('123 456\n')).toBe(8)
  })

  it('calculates estimated reading time based on 200 wpm', () => {
    expect(calculateReadingTime(0)).toBe(0)
    expect(calculateReadingTime(50)).toBe(1)
    expect(calculateReadingTime(200)).toBe(1)
    expect(calculateReadingTime(201)).toBe(2)
    expect(calculateReadingTime(600)).toBe(3)
  })

  it('returns combined stats object', () => {
    const text = 'This is a sample markdown note with ten words in total.'
    const stats = getNoteStats(text)

    expect(stats.wordCount).toBe(11)
    expect(stats.charCount).toBe(text.length)
    expect(stats.readingTimeMinutes).toBe(1)
  })
})
