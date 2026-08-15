import { db } from '@/core/db'
import type { Tag, CreateTagInput, UpdateTagInput } from '../types'

const DEFAULT_TAG_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#64748b'
]

export const tagRepository = {
  async getAllTags(): Promise<Tag[]> {
    const tags = await db.tags.toArray()
    return tags.sort((a, b) => a.name.localeCompare(b.name))
  },

  async getTagById(id: string): Promise<Tag | undefined> {
    return db.tags.get(id)
  },

  async getTagByName(name: string): Promise<Tag | undefined> {
    const trimmed = name.trim().toLowerCase()
    return db.tags.filter((t) => t.name.toLowerCase() === trimmed).first()
  },

  async createTag(input: CreateTagInput): Promise<Tag> {
    const trimmedName = input.name.trim()
    if (!trimmedName) {
      throw new Error('Tag name cannot be empty')
    }

    const existing = await this.getTagByName(trimmedName)
    if (existing) {
      return existing
    }

    const randomColor =
      input.color ||
      DEFAULT_TAG_COLORS[Math.floor(Math.random() * DEFAULT_TAG_COLORS.length)]

    const tag: Tag = {
      id: crypto.randomUUID(),
      name: trimmedName,
      color: randomColor
    }

    await db.tags.add(tag)
    return tag
  },

  async updateTag(id: string, input: UpdateTagInput): Promise<Tag> {
    const existing = await db.tags.get(id)
    if (!existing) {
      throw new Error(`Tag with id ${id} not found`)
    }

    const updatedTag: Tag = {
      ...existing,
      ...input,
      name: input.name !== undefined ? input.name.trim() || existing.name : existing.name
    }

    await db.tags.put(updatedTag)
    return updatedTag
  },

  async deleteTag(id: string): Promise<void> {
    await db.tags.delete(id)
  },

  async findOrCreateTag(name: string, color?: string): Promise<Tag> {
    const existing = await this.getTagByName(name)
    if (existing) {
      return existing
    }
    return this.createTag({ name, color: color || '#3b82f6' })
  }
}
