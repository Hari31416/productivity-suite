import { db } from '@/core/db'
import { calculateWordCount } from '../utils/noteStats'
import type { Note, NoteFilter, CreateNoteInput, UpdateNoteInput } from '../types'

export const noteRepository = {
  async getAllNotes(filter?: NoteFilter): Promise<Note[]> {
    let collection = db.notes.toCollection()

    if (filter?.archived !== undefined) {
      collection = collection.filter((n) => n.archived === filter.archived)
    } else {
      collection = collection.filter((n) => !n.archived)
    }

    let notes = await collection.toArray()

    if (filter) {
      if (filter.projectId) {
        notes = notes.filter((n) => n.projectId === filter.projectId)
      }

      if (filter.pinned !== undefined) {
        notes = notes.filter((n) => n.pinned === filter.pinned)
      }

      if (filter.tag) {
        const tagFilter = filter.tag.toLowerCase()
        notes = notes.filter((n) =>
          n.tags?.some((t) => t.toLowerCase() === tagFilter)
        )
      }

      if (filter.searchQuery && filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase().trim()
        notes = notes.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q) ||
            n.tags?.some((t) => t.toLowerCase().includes(q))
        )
      }
    }

    return notes.sort((a, b) => {
      // Pinned notes first unless pinned is explicitly filtered
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  },

  async getNoteById(id: string): Promise<Note | undefined> {
    return db.notes.get(id)
  },

  async createNote(input: CreateNoteInput): Promise<Note> {
    const now = new Date().toISOString()
    const wordCount = input.wordCount ?? calculateWordCount(input.content)

    const note: Note = {
      id: crypto.randomUUID(),
      title: input.title !== undefined ? input.title.trim() || 'Untitled Note' : 'Untitled Note',
      content: input.content,
      tags: input.tags || [],
      projectId: input.projectId,
      pinned: input.pinned ?? false,
      color: input.color,
      wordCount,
      createdAt: now,
      updatedAt: now,
      archived: input.archived ?? false
    }

    await db.notes.add(note)
    return note
  },

  async updateNote(id: string, input: UpdateNoteInput): Promise<Note> {
    const existing = await db.notes.get(id)
    if (!existing) {
      throw new Error(`Note with id ${id} not found`)
    }

    const now = new Date().toISOString()
    const updatedContent = input.content !== undefined ? input.content : existing.content
    const updatedWordCount =
      input.wordCount !== undefined
        ? input.wordCount
        : input.content !== undefined
        ? calculateWordCount(input.content)
        : existing.wordCount

    const updatedNote: Note = {
      ...existing,
      ...input,
      title: input.title !== undefined ? input.title.trim() || 'Untitled Note' : existing.title,
      content: updatedContent,
      wordCount: updatedWordCount,
      updatedAt: now
    }

    await db.notes.put(updatedNote)
    return updatedNote
  },

  async deleteNote(id: string): Promise<void> {
    await db.notes.delete(id)
  },

  async togglePinNote(id: string): Promise<Note> {
    const note = await db.notes.get(id)
    if (!note) {
      throw new Error(`Note with id ${id} not found`)
    }
    return this.updateNote(id, { pinned: !note.pinned })
  },

  async toggleArchiveNote(id: string): Promise<Note> {
    const note = await db.notes.get(id)
    if (!note) {
      throw new Error(`Note with id ${id} not found`)
    }
    return this.updateNote(id, { archived: !note.archived })
  },

  async duplicateNote(id: string): Promise<Note> {
    const note = await db.notes.get(id)
    if (!note) {
      throw new Error(`Note with id ${id} not found`)
    }

    const now = new Date().toISOString()
    const duplicated: Note = {
      ...note,
      id: crypto.randomUUID(),
      title: `${note.title} (Copy)`,
      pinned: false,
      createdAt: now,
      updatedAt: now
    }

    await db.notes.add(duplicated)
    return duplicated
  },

  async getNotesByProject(projectId: string): Promise<Note[]> {
    return this.getAllNotes({ projectId })
  },

  async getNotesByTag(tag: string): Promise<Note[]> {
    return this.getAllNotes({ tag })
  },

  async getPinnedNotes(): Promise<Note[]> {
    return this.getAllNotes({ pinned: true })
  },

  async getRecentNotes(limit = 5): Promise<Note[]> {
    const notes = await this.getAllNotes()
    return notes.slice(0, limit)
  }
}
