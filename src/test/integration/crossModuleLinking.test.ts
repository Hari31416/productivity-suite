import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/core/db'
import { noteRepository } from '@/modules/notes/repository/noteRepository'
import { taskRepository } from '@/modules/tasks/repository/taskRepository'
import { habitRepository } from '@/modules/habits/repository/habitRepository'

describe('Automated Testing: Cross-Module Bi-Directional Linking Workflow', () => {
  beforeEach(async () => {
    await db.notes.clear()
    await db.tasks.clear()
    await db.habits.clear()
  })

  it('correctly creates task and links note with linkedTaskId query support', async () => {
    // 1. Create a task
    const task = await taskRepository.createTask({
      title: 'Implement Deep Linking',
      priority: 'high',
      status: 'todo',
      tags: ['feature']
    })
    expect(task.id).toBeDefined()

    // 2. Create note linked to task
    const note = await noteRepository.createNote({
      title: `Notes: ${task.title}`,
      content: `# Implementation Notes\n\nTask: @[${task.title}](task:${task.id})\n\nDetailed breakdown...`,
      linkedTaskId: task.id,
      tags: ['task-note']
    })

    expect(note.id).toBeDefined()
    expect(note.linkedTaskId).toBe(task.id)

    // 3. Query notes filtering by linkedTaskId
    const linkedNotes = await noteRepository.getAllNotes({ linkedTaskId: task.id })
    expect(linkedNotes.length).toBe(1)
    expect(linkedNotes[0].id).toBe(note.id)
    expect(linkedNotes[0].linkedTaskId).toBe(task.id)

    // 4. Query notes for an unlinked task
    const unlinkedNotes = await noteRepository.getAllNotes({ linkedTaskId: 'non-existent-task-id' })
    expect(unlinkedNotes.length).toBe(0)
  })

  it('correctly creates habit and links reflection note with linkedHabitId query support', async () => {
    // 1. Create a habit
    const habit = await habitRepository.createHabit({
      title: 'Morning 5km Run',
      frequencyType: 'daily',
      targetType: 'boolean',
      categoryId: 'fitness',
      color: '#10B981'
    })
    expect(habit.id).toBeDefined()

    // 2. Create note linked to habit
    const note = await noteRepository.createNote({
      title: `Habit Reflection: ${habit.title}`,
      content: `# Daily Log\n\nHabit: #[${habit.title}](habit:${habit.id})\n\nPace was 5:20/km today.`,
      linkedHabitId: habit.id,
      tags: ['habit-reflection']
    })

    expect(note.id).toBeDefined()
    expect(note.linkedHabitId).toBe(habit.id)

    // 3. Query notes filtering by linkedHabitId
    const habitNotes = await noteRepository.getAllNotes({ linkedHabitId: habit.id })
    expect(habitNotes.length).toBe(1)
    expect(habitNotes[0].id).toBe(note.id)
    expect(habitNotes[0].linkedHabitId).toBe(habit.id)

    // 4. Update linked habit
    await noteRepository.updateNote(note.id, {
      title: 'Updated Reflection Title'
    })
    const reloaded = await noteRepository.getNoteById(note.id)
    expect(reloaded?.title).toBe('Updated Reflection Title')
    expect(reloaded?.linkedHabitId).toBe(habit.id)
  })
})
