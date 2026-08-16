import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/core/db'
import { taskRepository } from '@/modules/tasks/repository/taskRepository'
import { projectRepository } from '@/modules/tasks/repository/projectRepository'

describe('Automated Testing: To-Do & Task Management End-to-End Workflow', () => {
  beforeEach(async () => {
    await db.tasks.clear()
    await db.subtasks.clear()
    await db.projects.clear()
  })

  it('completes the full project and task lifecycle with subtasks and status transitions', async () => {
    // 1. Create a Project
    const project = await projectRepository.createProject({
      name: 'Productivity Suite Release',
      description: 'Milestone 1 ship targets',
      color: '#10B981',
      icon: 'Folder'
    })

    expect(project.id).toBeDefined()
    expect(project.name).toBe('Productivity Suite Release')

    // 2. Create Tasks with different priorities and due dates under this project
    const urgentTask = await taskRepository.createTask({
      title: 'Release Architecture Review',
      projectId: project.id,
      priority: 'urgent',
      dueDate: '2026-08-15',
      tags: ['release', 'architecture'],
      estimatedMinutes: 60
    })

    const mediumTask = await taskRepository.createTask({
      title: 'Write User Documentation',
      projectId: project.id,
      priority: 'medium',
      dueDate: '2026-08-20',
      tags: ['docs']
    })

    expect(urgentTask.id).toBeDefined()
    expect(urgentTask.status).toBe('todo')
    expect(mediumTask.id).toBeDefined()

    // 3. Add subtasks to urgentTask
    const subtask1 = await taskRepository.createSubtask(urgentTask.id, 'Check Dexie schema indexes')
    const subtask2 = await taskRepository.createSubtask(
      urgentTask.id,
      'Verify Zod backup validation'
    )
    await taskRepository.createSubtask(urgentTask.id, 'Test offline PWA mode')

    const subtasks = await taskRepository.getSubtasksForTask(urgentTask.id)
    expect(subtasks).toHaveLength(3)
    expect(subtasks[0].completed).toBe(false)

    // 4. Complete 2 of the 3 subtasks
    await taskRepository.updateSubtask(subtask1.id, { completed: true })
    await taskRepository.updateSubtask(subtask2.id, { completed: true })

    const updatedSubtasks = await taskRepository.getSubtasksForTask(urgentTask.id)
    const completedCount = updatedSubtasks.filter((s) => s.completed).length
    expect(completedCount).toBe(2)

    // 5. Transition Task Status through Kanban lifecycle: todo -> in_progress -> blocked -> done
    let updatedTask = await taskRepository.updateTaskStatus(urgentTask.id, 'in_progress')
    expect(updatedTask?.status).toBe('in_progress')

    updatedTask = await taskRepository.updateTaskStatus(urgentTask.id, 'blocked')
    expect(updatedTask?.status).toBe('blocked')

    updatedTask = await taskRepository.updateTaskStatus(urgentTask.id, 'done')
    expect(updatedTask?.status).toBe('done')
    expect(updatedTask?.completedAt).toBeDefined()

    // 6. Test project stats computation
    const projectsWithStats = await projectRepository.getProjectsWithCounts()
    const suiteProject = projectsWithStats.find((p) => p.id === project.id)
    expect(suiteProject?.taskCount).toBe(2)
    expect(suiteProject?.completedTaskCount).toBe(1)

    // 7. Test query filters (by status, priority, date range)
    const activeTasks = await taskRepository.getAllTasks({ status: 'todo' })
    expect(activeTasks).toHaveLength(1)
    expect(activeTasks[0].title).toBe('Write User Documentation')

    const urgentTasks = await taskRepository.getAllTasks({ priority: 'urgent' })
    expect(urgentTasks).toHaveLength(1)
    expect(urgentTasks[0].title).toBe('Release Architecture Review')

    const dateRangeTasks = await taskRepository.getTasksByDateRange('2026-08-14', '2026-08-16')
    expect(dateRangeTasks).toHaveLength(1)
    expect(dateRangeTasks[0].id).toBe(urgentTask.id)

    // 8. Delete task and ensure cascading subtask cleanup
    await taskRepository.deleteTask(urgentTask.id)
    const remainingSubtasks = await taskRepository.getSubtasksForTask(urgentTask.id)
    expect(remainingSubtasks).toHaveLength(0)

    // 9. Delete project
    await projectRepository.deleteProject(project.id)
    const deletedProject = await projectRepository.getProjectById(project.id)
    expect(deletedProject).toBeUndefined()
  })
})
