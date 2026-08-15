import { zip, strToU8 } from 'fflate'
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

export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export function exportNoteAsMarkdown(note: Note): void {
  const markdown = buildNoteMarkdownContent(note)
  const filename = `${sanitizeFilename(note.title)}.md`
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  triggerBrowserDownload(blob, filename)
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
  const blob = new Blob([zipData.buffer as ArrayBuffer], { type: 'application/zip' })
  triggerBrowserDownload(blob, archiveName)
}
