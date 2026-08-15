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

export interface NoteFilter {
  searchQuery?: string
  tag?: string
  projectId?: string
  pinned?: boolean
  archived?: boolean
}

export interface CreateNoteInput {
  title?: string
  content: string
  tags?: string[]
  projectId?: string
  pinned?: boolean
  color?: string
  wordCount?: number
  archived?: boolean
}

export type UpdateNoteInput = Partial<Omit<Note, 'id' | 'createdAt'>>

export interface CreateTagInput {
  name: string
  color?: string
}

export type UpdateTagInput = Partial<Omit<Tag, 'id'>>
