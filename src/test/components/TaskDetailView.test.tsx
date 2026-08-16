import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TaskDetailView } from '@/modules/tasks/components/TaskDetailView'
import type { Task, Project } from '@/modules/tasks/types'
import type { Note } from '@/modules/notes/types'
import { db } from '@/core/db'

describe('TaskDetailView Component', () => {
  let queryClient: QueryClient

  const mockProject: Project = {
    id: 'proj-1',
    name: 'Frontend Modernization',
    color: '#3b82f6',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    archived: false
  }

  const mockTask: Task = {
    id: 'task-101',
    title: 'Implement Task Detail Workspace',
    description:
      '### Requirements\n\n- [x] Circular focus timer\n- [ ] Connected notes\n\n```ts\nconst ready = true;\n```',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2026-08-16',
    dueTime: '18:00',
    estimatedMinutes: 60,
    actualMinutes: 30,
    tags: ['feature', 'ui'],
    subtaskIds: [],
    projectId: 'proj-1',
    isRecurring: true,
    recurrence: {
      frequency: 'weekly',
      interval: 1,
      daysOfWeek: [1, 3, 5]
    },
    archived: false,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-16T12:00:00.000Z'
  }

  const mockNote: Note = {
    id: 'note-1',
    title: 'Architecture Blueprint',
    content:
      '# Notes for Task: Implement Task Detail Workspace\n\nDetails about UI layout for task-101',
    projectId: 'proj-1',
    tags: ['ui', 'specs', 'task-task-101'],
    wordCount: 10,
    pinned: false,
    archived: false,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z'
  }

  beforeEach(async () => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })
    await db.tasks.clear()
    await db.projects.clear()
    await db.notes.clear()
    await db.subtasks.clear()

    await db.projects.add(mockProject)
    await db.tasks.add(mockTask)
    await db.notes.add(mockNote)
  })

  it('renders hero header, status/priority controls, due date, and recurrence badges', async () => {
    const onBack = vi.fn()

    render(
      <QueryClientProvider client={queryClient}>
        <TaskDetailView task={mockTask} onBack={onBack} />
      </QueryClientProvider>
    )

    // Hero Header & Title
    expect(
      screen.getByRole('heading', { level: 1, name: 'Implement Task Detail Workspace' })
    ).toBeInTheDocument()

    // Status and Priority badges
    expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('High Priority').length).toBeGreaterThanOrEqual(1)

    // Project Name
    await waitFor(() => {
      expect(screen.getAllByText('Frontend Modernization').length).toBeGreaterThanOrEqual(1)
    })

    // Recurrence badge
    expect(screen.getAllByText(/weekly/i).length).toBeGreaterThanOrEqual(1)

    // Back button
    const backBtn = screen.getByRole('button', { name: /back to tasks/i })
    fireEvent.click(backBtn)
    expect(onBack).toHaveBeenCalled()
  })

  it('renders rich markdown description preview and toggles edit mode', async () => {
    const onBack = vi.fn()

    render(
      <QueryClientProvider client={queryClient}>
        <TaskDetailView task={mockTask} onBack={onBack} />
      </QueryClientProvider>
    )

    // Rendered markdown elements
    expect(screen.getByRole('heading', { level: 3, name: 'Requirements' })).toBeInTheDocument()
    expect(screen.getByText('Circular focus timer')).toBeInTheDocument()
    expect(screen.getByText('Connected notes')).toBeInTheDocument()

    // Click Edit description button
    const editBtn = screen.getByRole('button', { name: /edit description/i })
    fireEvent.click(editBtn)

    // In edit mode, textarea should be present
    const textarea = screen.getByPlaceholderText(/write detailed requirements/i)
    expect(textarea).toBeInTheDocument()

    // Cancel edit mode
    const cancelBtn = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelBtn)
    expect(screen.queryByPlaceholderText(/write detailed requirements/i)).not.toBeInTheDocument()
  })

  it('renders embedded TaskFocusTimer with time spent vs estimate tracking', async () => {
    const onBack = vi.fn()

    render(
      <QueryClientProvider client={queryClient}>
        <TaskDetailView task={mockTask} onBack={onBack} />
      </QueryClientProvider>
    )

    // Time Tracking Progress (30m / 1h = 50%)
    expect(screen.getByText('Time Tracking Progress')).toBeInTheDocument()
    expect(screen.getByText('(50%)')).toBeInTheDocument()
    expect(screen.getByText('30m remaining on estimate')).toBeInTheDocument()

    // Circular Timer
    expect(screen.getByText('Task Focus Timer')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start focus/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /25m pomodoro/i })).toBeInTheDocument()
  })

  it('renders connected notes referencing the task or matching project', async () => {
    const onBack = vi.fn()

    render(
      <QueryClientProvider client={queryClient}>
        <TaskDetailView task={mockTask} onBack={onBack} />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Connected Notes')).toBeInTheDocument()
      expect(screen.getByText('Architecture Blueprint')).toBeInTheDocument()
    })
  })
})
