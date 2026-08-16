import { zip, strToU8 } from 'fflate'
import { saveAndExportTextFile, saveAndExportBinaryFile } from '@/core/utils/fileExporter'
import type { Note } from '../types'

export function sanitizeFilename(name: string): string {
  const sanitized = name.replace(/[/\\?%*:|"<>]/g, '-').trim()
  return sanitized || 'untitled'
}

export function buildNoteMarkdownContent(note: Note): string {
  const lines: string[] = []

  // Frontmatter with metadata
  lines.push('---')
  lines.push(`title: "${note.title.replace(/"/g, '\\"')}"`)
  lines.push(`createdAt: "${note.createdAt}"`)
  lines.push(`updatedAt: "${note.updatedAt}"`)
  if (note.tags && note.tags.length > 0) {
    lines.push(`tags: [${note.tags.map((t) => `"${t}"`).join(', ')}]`)
  }
  if (note.pinned) {
    lines.push('pinned: true')
  }
  if (note.archived) {
    lines.push('archived: true')
  }
  lines.push('---')
  lines.push('')

  if (note.title && !note.content.trim().startsWith('# ')) {
    lines.push(`# ${note.title}`)
    lines.push('')
  }

  lines.push(note.content)

  return lines.join('\n')
}

export async function exportNoteAsMarkdown(note: Note): Promise<void> {
  const markdown = buildNoteMarkdownContent(note)
  const filename = `${sanitizeFilename(note.title)}.md`
  await saveAndExportTextFile(markdown, filename, 'text/markdown;charset=utf-8')
}

export function generateZipArchive(notes: Note[]): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const files: Record<string, Uint8Array> = {}
    const usedNames = new Set<string>()

    for (const note of notes) {
      const baseName = sanitizeFilename(note.title)
      let filename = `${baseName}.md`
      let counter = 1
      while (usedNames.has(filename.toLowerCase())) {
        filename = `${baseName} (${counter}).md`
        counter++
      }
      usedNames.add(filename.toLowerCase())

      const content = buildNoteMarkdownContent(note)
      files[filename] = strToU8(content)
    }

    zip(files, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

export async function exportAllNotesAsZip(
  notes: Note[],
  archiveName = 'notes-backup.zip'
): Promise<void> {
  const zipData = await generateZipArchive(notes)
  await saveAndExportBinaryFile(zipData, archiveName, 'application/zip')
}
