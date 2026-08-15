# Phase 4 - Notepad Module

## Objectives

Implement the Notepad module featuring a responsive Markdown editor with live preview, syntax formatting, full-text instant search, tagging, pinning, project association, and export capabilities.

## Key Deliverables

- Note and Tag domain schema, repository layer, and TanStack Query hooks.
- Markdown editor with side-by-side live preview, reading mode, and editing canvas.
- Note organization tools: pinned notes, color labeling, tag manager, and project linkage.
- Real-time word count, character count, and estimated reading time statistics.
- Client-side full-text search across titles and note contents.
- Single-note Markdown file export and bulk Markdown archive download.
- Notepad dashboard widget for the unified home view.

## Technical Implementation Details

### Domain Schema and Models

`src/modules/notes/types.ts`:

```typescript
export interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  projectId?: string
  pinned: boolean
  color?: string
  wordCount: number
  createdAt: string
  updatedAt: string
  archived: boolean
}

export interface Tag {
  id: string
  name: string
  color: string
}
```

### Markdown Engine and Editor

- `src/modules/notes/components/MarkdownEditor.tsx`:
  - Split-pane layout with source Markdown input on the left and rendered preview on the right.
  - Toolbar with quick Markdown formatting buttons (Headings, Bold, Italic, Code, Lists, Quotes, Tables).
  - Mode toggle: Edit only, Split view, Preview only.
  - Auto-save with debouncing to prevent excessive IndexedDB write bursts.

### Note Management and Search

- `src/modules/notes/components/NoteCard.tsx`: Grid and list view cards with pinned badge, snippet preview, tag pills, and last modified date.
- `src/modules/notes/components/NotesView.tsx`: Main view with sidebar search filter, tag selector, pinned notes shelf, and new note trigger.
- `src/modules/notes/components/NotesDashboardWidget.tsx`: Compact home overview card showing pinned and recent notes.

### Export Utilities

- `src/modules/notes/utils/noteExporter.ts`:
  - `exportNoteAsMarkdown(note)`: Generates and triggers browser download of `<title>.md`.
  - `exportAllNotesAsZip(notes)`: Generates a compressed archive containing all notes as individual `.md` files via `fflate`.

## Verification Checklist

- Creating and editing notes persists to IndexedDB with debounced auto-save.
- Markdown formatting (headers, bold, lists, tables, fenced code blocks) renders accurately in live preview.
- Pinned notes appear at the top of the note list.
- Searching for text keywords filters notes by both title and content instantly.
- Single-note download exports a valid `.md` file; bulk export creates a valid `.zip` archive.
