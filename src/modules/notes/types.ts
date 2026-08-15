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
