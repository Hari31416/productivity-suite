import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TaskCard } from '@/modules/tasks/components/TaskCard'
import type { Task } from '@/modules/tasks/types'

describe('Automated UI Testing: TaskCard Component', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })

  const mockTask: Task = {
    id: 'task-101',
    title: 'Review Unit Test Coverage',
    description: 'Ensure 100% pass rate on CI',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-08-15',
    tags: ['testing', 'quality'],
    subtaskIds: ['sub-1', 'sub-2'],
    createdAt: '2026-08-15T00:00:00.000Z',
    updatedAt: '2026-08-15T00:00:00.000Z',
    archived: false
  }

  it('renders task attributes, priority badge, tags, and handles status click', () => {
    const onEdit = vi.fn()

    render(
      <QueryClientProvider client={queryClient}>
        <TaskCard
          task={mockTask}
          onEdit={onEdit}
        />
      </QueryClientProvider>
    )

    // Check title, priority badge, and tags
    expect(screen.getByText('Review Unit Test Coverage')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByText('testing')).toBeInTheDocument()
    expect(screen.getByText('quality')).toBeInTheDocument()

    // Click checkbox to complete task
    const checkBtn = screen.getByRole('button', { name: /mark task complete/i })
    expect(checkBtn).toBeInTheDocument()
    fireEvent.click(checkBtn)
  })
})
