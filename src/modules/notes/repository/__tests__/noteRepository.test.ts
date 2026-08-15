import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '@/core/db'
import { noteRepository } from '../noteRepository'
import { tagRepository } from '../tagRepository'

describe('noteRepository', () => {
  beforeEach(async () => {
    await db.notes.clear()
    await db.tags.clear()
  })

  afterEach(async () => {
    await db.notes.clear()
    await db.tags.clear()
  })

  it('creates and retrieves notes', async () => {
    const created = await noteRepository.createNote({
      title: 'Design System Notes',
      content: '# Design System\nHere are some architectural rules.',
      tags: ['design', 'architecture'],
      pinned: true,
      color: '#3b82f6'
    })

    expect(created.id).toBeDefined()
    expect(created.title).toBe('Design System Notes')
    expect(created.wordCount).toBe(8)
    expect(created.pinned).toBe(true)
    expect(created.color).toBe('#3b82f6')
    expect(created.createdAt).toBeDefined()
    expect(created.updatedAt).toBeDefined()

    const retrieved = await noteRepository.getNoteById(created.id)
    expect(retrieved).toBeDefined()
    expect(retrieved?.title).toBe('Design System Notes')

    const all = await noteRepository.getAllNotes()
    expect(all).toHaveLength(1)
  })

  it('updates note content and recalculates word count', async () => {
    const note = await noteRepository.createNote({
      title: 'Original Title',
      content: 'Short content'
    })

    expect(note.wordCount).toBe(2)

    const updated = await noteRepository.updateNote(note.id, {
      title: 'Updated Title',
      content: 'This is a significantly longer content with seven words.'
    })

    expect(updated.title).toBe('Updated Title')
    expect(updated.content).toBe('This is a significantly longer content with seven words.')
    expect(updated.wordCount).toBe(9)
  })

  it('deletes note', async () => {
    const note = await noteRepository.createNote({
      title: 'To Delete',
      content: 'Will be deleted'
    })

    await noteRepository.deleteNote(note.id)
    const retrieved = await noteRepository.getNoteById(note.id)
    expect(retrieved).toBeUndefined()
  })

  it('toggles pin and archive states', async () => {
    const note = await noteRepository.createNote({
      title: 'Pin & Archive Test',
      content: 'Testing toggle functions',
      pinned: false,
      archived: false
    })

    const pinned = await noteRepository.togglePinNote(note.id)
    expect(pinned.pinned).toBe(true)

    const unpinned = await noteRepository.togglePinNote(note.id)
    expect(unpinned.pinned).toBe(false)

    const archived = await noteRepository.toggleArchiveNote(note.id)
    expect(archived.archived).toBe(true)

    const unarchived = await noteRepository.toggleArchiveNote(note.id)
    expect(unarchived.archived).toBe(false)
  })

  it('duplicates an existing note', async () => {
    const original = await noteRepository.createNote({
      title: 'Recipe',
      content: 'Mix flour and water',
      tags: ['cooking'],
      pinned: true
    })

    const copy = await noteRepository.duplicateNote(original.id)
    expect(copy.id).not.toBe(original.id)
    expect(copy.title).toBe('Recipe (Copy)')
    expect(copy.content).toBe(original.content)
    expect(copy.tags).toEqual(original.tags)
    expect(copy.pinned).toBe(false)
  })

  it('filters notes by search query across title, content, and tags', async () => {
    await noteRepository.createNote({
      title: 'React Architecture',
      content: 'State management with TanStack Query and Zustand',
      tags: ['frontend']
    })

    await noteRepository.createNote({
      title: 'Python Backend Services',
      content: 'FastAPI routing and SQLAlchemy models',
      tags: ['backend']
    })

    await noteRepository.createNote({
      title: 'DevOps Checklist',
      content: 'Docker containers and CI/CD pipelines',
      tags: ['docker', 'infra']
    })

    // Search by title
    const titleMatch = await noteRepository.getAllNotes({ searchQuery: 'React' })
    expect(titleMatch).toHaveLength(1)
    expect(titleMatch[0].title).toBe('React Architecture')

    // Search by content
    const contentMatch = await noteRepository.getAllNotes({ searchQuery: 'Zustand' })
    expect(contentMatch).toHaveLength(1)
    expect(contentMatch[0].title).toBe('React Architecture')

    // Search by tag
    const tagSearch = await noteRepository.getAllNotes({ searchQuery: 'docker' })
    expect(tagSearch).toHaveLength(1)
    expect(tagSearch[0].title).toBe('DevOps Checklist')
  })

  it('filters by specific tag and project', async () => {
    await noteRepository.createNote({
      title: 'Project A Note',
      content: 'Details for A',
      tags: ['meeting', 'alpha'],
      projectId: 'proj-1'
    })

    await noteRepository.createNote({
      title: 'Project B Note',
      content: 'Details for B',
      tags: ['meeting', 'beta'],
      projectId: 'proj-2'
    })

    const tagAlphaNotes = await noteRepository.getAllNotes({ tag: 'alpha' })
    expect(tagAlphaNotes).toHaveLength(1)
    expect(tagAlphaNotes[0].title).toBe('Project A Note')

    const proj2Notes = await noteRepository.getAllNotes({ projectId: 'proj-2' })
    expect(proj2Notes).toHaveLength(1)
    expect(proj2Notes[0].title).toBe('Project B Note')
  })

  it('sorts pinned notes first', async () => {
    await noteRepository.createNote({
      title: 'Unpinned Note',
      content: 'Second in order',
      pinned: false
    })

    await noteRepository.createNote({
      title: 'Pinned Note',
      content: 'First in order',
      pinned: true
    })

    const notes = await noteRepository.getAllNotes()
    expect(notes).toHaveLength(2)
    expect(notes[0].title).toBe('Pinned Note')
    expect(notes[1].title).toBe('Unpinned Note')
  })
})

describe('tagRepository', () => {
  beforeEach(async () => {
    await db.tags.clear()
  })

  afterEach(async () => {
    await db.tags.clear()
  })

  it('creates, retrieves, updates and deletes tags', async () => {
    const tag = await tagRepository.createTag({
      name: 'productivity',
      color: '#10b981'
    })

    expect(tag.id).toBeDefined()
    expect(tag.name).toBe('productivity')
    expect(tag.color).toBe('#10b981')

    const byName = await tagRepository.getTagByName('productivity')
    expect(byName).toBeDefined()
    expect(byName?.id).toBe(tag.id)

    const updated = await tagRepository.updateTag(tag.id, {
      name: 'deep-work',
      color: '#6366f1'
    })
    expect(updated.name).toBe('deep-work')
    expect(updated.color).toBe('#6366f1')

    await tagRepository.deleteTag(tag.id)
    const all = await tagRepository.getAllTags()
    expect(all).toHaveLength(0)
  })

  it('findOrCreateTag reuses existing tag or creates new', async () => {
    const tag1 = await tagRepository.findOrCreateTag('journal', '#ec4899')
    const tag2 = await tagRepository.findOrCreateTag('journal', '#000000')

    expect(tag1.id).toBe(tag2.id)
    expect(tag1.name).toBe('journal')
    expect(tag2.color).toBe('#ec4899')

    const all = await tagRepository.getAllTags()
    expect(all).toHaveLength(1)
  })
})
