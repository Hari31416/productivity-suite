import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '@/core/db'
import { projectRepository } from '../projectRepository'
import { taskRepository } from '../taskRepository'
import type { Project } from '../../types'

describe('projectRepository', () => {
  beforeEach(async () => {
    await db.projects.clear()
    await db.tasks.clear()
    await db.subtasks.clear()
  })

  afterEach(async () => {
    await db.projects.clear()
    await db.tasks.clear()
    await db.subtasks.clear()
  })

  it('creates and retrieves projects', async () => {
    const projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'Design System',
      description: 'Component library design',
      color: '#8b5cf6',
      icon: 'Sparkles',
      archived: false
    }

    const created = await projectRepository.createProject(projectData)
    expect(created.id).toBeDefined()
    expect(created.name).toBe('Design System')
    expect(created.color).toBe('#8b5cf6')
    expect(created.icon).toBe('Sparkles')
    expect(created.createdAt).toBeDefined()

    const retrieved = await projectRepository.getProjectById(created.id)
    expect(retrieved).toBeDefined()
    expect(retrieved?.name).toBe('Design System')

    const all = await projectRepository.getAllProjects()
    expect(all).toHaveLength(1)
  })

  it('calculates active and completed task counts for projects', async () => {
    const project = await projectRepository.createProject({
      name: 'Web App',
      color: '#3b82f6',
      archived: false
    })

    await taskRepository.createTask({
      title: 'Task 1',
      projectId: project.id,
      priority: 'high',
      status: 'todo',
      tags: [],
      archived: false
    })

    await taskRepository.createTask({
      title: 'Task 2',
      projectId: project.id,
      priority: 'medium',
      status: 'done',
      tags: [],
      archived: false
    })

    await taskRepository.createTask({
      title: 'Task 3 (Archived)',
      projectId: project.id,
      priority: 'low',
      status: 'done',
      tags: [],
      archived: true
    })

    const projectsWithCounts = await projectRepository.getProjectsWithCounts()
    expect(projectsWithCounts).toHaveLength(1)
    expect(projectsWithCounts[0].taskCount).toBe(2) // only active
    expect(projectsWithCounts[0].completedTaskCount).toBe(1)
  })

  it('deletes project with task unlinking or cascade deletion', async () => {
    const project = await projectRepository.createProject({
      name: 'Mobile App',
      color: '#ec4899',
      archived: false
    })

    const task1 = await taskRepository.createTask({
      title: 'Unlinked task',
      projectId: project.id,
      priority: 'medium',
      status: 'todo',
      tags: [],
      archived: false
    })

    // Unlink on delete (deleteTasks: false)
    await projectRepository.deleteProject(project.id, false)
    const taskAfter = await taskRepository.getTaskById(task1.id)
    expect(taskAfter).toBeDefined()
    expect(taskAfter?.projectId).toBeUndefined()

    // Now test delete with cascade (deleteTasks: true)
    const project2 = await projectRepository.createProject({
      name: 'Another Project',
      color: '#10b981',
      archived: false
    })
    const task2 = await taskRepository.createTask(
      {
        title: 'Cascade task',
        projectId: project2.id,
        priority: 'low',
        status: 'todo',
        tags: [],
        archived: false
      },
      [{ title: 'Subtask item' }]
    )

    await projectRepository.deleteProject(project2.id, true)
    const task2After = await taskRepository.getTaskById(task2.id)
    expect(task2After).toBeUndefined()
    const subtasksAfter = await taskRepository.getSubtasksForTask(task2.id)
    expect(subtasksAfter).toHaveLength(0)
  })
})
