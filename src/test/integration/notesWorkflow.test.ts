import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/core/db'
import { noteRepository } from '@/modules/notes/repository/noteRepository'
import { tagRepository } from '@/modules/notes/repository/tagRepository'
import { getNoteStats } from '@/modules/notes/utils/noteStats'
import { buildNoteMarkdownContent, generateZipArchive } from '@/modules/notes/utils/noteExporter'

describe('Automated Testing: Notepad End-to-End Workflow', () => {
  beforeEach(async () => {
    await db.notes.clear()
    await db.tags.clear()
  })

  it('completes the full note authoring, markdown parsing, tagging, and export workflow', async () => {
    // 1. Create tags
    const tag1 = await tagRepository.createTag({ name: 'Architecture', color: '#6366F1' })
    const tag2 = await tagRepository.createTag({ name: 'Design', color: '#EC4899' })

    expect(tag1.name).toBe('Architecture')
    expect(tag2.name).toBe('Design')

    // 2. Create Note with Markdown content
    const markdownContent = `# System Architecture

## Overview
The **Local Productivity Suite** runs offline.

### Key Components
- IndexedDB via Dexie
- Modular Feature Registry
- TanStack Query

| Table | Index | Description |
| --- | --- | --- |
| habits | id, categoryId | Stores habit configs |
| tasks | id, projectId | Stores task list |

\`\`\`typescript
const db = new AppDatabase()
\`\`\`
`

    const note = await noteRepository.createNote({
      title: 'Architecture Blueprint',
      content: markdownContent,
      tags: ['Architecture', 'Design'],
      color: '#4F46E5',
      pinned: true
    })

    expect(note.id).toBeDefined()
    expect(note.pinned).toBe(true)
    expect(note.tags).toContain('Architecture')
    expect(note.wordCount).toBeGreaterThan(20)

    // 3. Test note statistics calculation
    const stats = getNoteStats(markdownContent)
    expect(stats.wordCount).toBe(66)
    expect(stats.charCount).toBeGreaterThan(150)
    expect(stats.readingTimeMinutes).toBe(1)

    // 4. Create second note
    const note2 = await noteRepository.createNote({
      title: 'Meeting Minutes',
      content: 'Discussed release schedule for Phase 6.',
      tags: ['Design'],
      pinned: false
    })

    // 5. Full-text search queries
    const searchArch = await noteRepository.getAllNotes({ searchQuery: 'Architecture' })
    expect(searchArch).toHaveLength(1)
    expect(searchArch[0].id).toBe(note.id)

    const searchPhase = await noteRepository.getAllNotes({ searchQuery: 'Phase 6' })
    expect(searchPhase).toHaveLength(1)
    expect(searchPhase[0].id).toBe(note2.id)

    // Tag filtering
    const tagFiltered = await noteRepository.getAllNotes({ tag: 'Design' })
    expect(tagFiltered).toHaveLength(2)

    // Pinned filtering / order
    const allNotes = await noteRepository.getAllNotes()
    expect(allNotes[0].pinned).toBe(true)

    // 6. Test Single Note Markdown formatting export
    const singleExportContent = buildNoteMarkdownContent(note)
    expect(singleExportContent).toContain('title: "Architecture Blueprint"')
    expect(singleExportContent).toContain(markdownContent)

    // 7. Test Bulk Zip Archive Generation
    const zipBytes = await generateZipArchive([note, note2])
    expect(zipBytes).toBeDefined()
    expect(zipBytes.length).toBeGreaterThan(100)

    // 8. Test note duplication
    const duplicate = await noteRepository.duplicateNote(note.id)
    expect(duplicate).toBeDefined()
    expect(duplicate?.title).toBe('Architecture Blueprint (Copy)')
    expect(duplicate?.content).toBe(markdownContent)

    // 9. Soft delete / archive
    await noteRepository.toggleArchiveNote(note.id)
    const activeNotes = await noteRepository.getAllNotes()
    expect(activeNotes.some((n) => n.id === note.id)).toBe(false)
  })
})
