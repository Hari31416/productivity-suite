import { describe, it, expect } from 'vitest'
import { unzipSync } from 'fflate'
import { sanitizeFilename, buildNoteMarkdownContent, generateZipArchive } from '../noteExporter'
import type { Note } from '../../types'

describe('noteExporter utility', () => {
  const sampleNote: Note = {
    id: 'note-1',
    title: 'Architecture Blueprint: V2 / Final?',
    content: '## Overview\nThis is a system architecture note.',
    tags: ['design', 'backend'],
    pinned: true,
    archived: false,
    wordCount: 8,
    createdAt: '2026-08-15T10:00:00.000Z',
    updatedAt: '2026-08-15T12:00:00.000Z'
  }

  it('sanitizes filename by replacing forbidden filesystem characters', () => {
    expect(sanitizeFilename('Normal Title')).toBe('Normal Title')
    expect(sanitizeFilename('Doc: Chapter 1 / Draft? *Final*')).toBe(
      'Doc- Chapter 1 - Draft- -Final-'
    )
    expect(sanitizeFilename('   ')).toBe('untitled')
    expect(sanitizeFilename('File<with>pipes|and"quotes"')).toBe('File-with-pipes-and-quotes-')
  })

  it('builds formatted markdown content with frontmatter', () => {
    const md = buildNoteMarkdownContent(sampleNote)

    expect(md).toContain('---')
    expect(md).toContain('title: "Architecture Blueprint: V2 / Final?"')
    expect(md).toContain('tags: ["design", "backend"]')
    expect(md).toContain('pinned: true')
    expect(md).toContain('## Overview')
    expect(md).toContain('This is a system architecture note.')
  })

  it('generates a valid zip archive with individual markdown files', async () => {
    const note1: Note = {
      id: '1',
      title: 'Meeting Notes',
      content: 'Discussion with team',
      tags: ['meeting'],
      pinned: false,
      archived: false,
      wordCount: 3,
      createdAt: '2026-08-15T09:00:00Z',
      updatedAt: '2026-08-15T09:30:00Z'
    }

    const note2: Note = {
      id: '2',
      title: 'Meeting Notes', // Duplicate title test
      content: 'Another discussion',
      tags: ['team'],
      pinned: false,
      archived: false,
      wordCount: 2,
      createdAt: '2026-08-15T10:00:00Z',
      updatedAt: '2026-08-15T10:30:00Z'
    }

    const zipData = await generateZipArchive([note1, note2])
    expect(zipData).toBeInstanceOf(Uint8Array)
    expect(zipData.length).toBeGreaterThan(0)

    // Verify unzipping returns both files
    const unzipped = unzipSync(zipData)
    const fileNames = Object.keys(unzipped)

    expect(fileNames).toContain('Meeting Notes.md')
    expect(fileNames).toContain('Meeting Notes (1).md')
  })
})
