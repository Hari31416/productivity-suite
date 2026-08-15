import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HabitCard } from '@/modules/habits/components/HabitCard'
import type { Habit } from '@/modules/habits/types'

describe('Automated UI Testing: HabitCard Component', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })

  const mockHabit: Habit = {
    id: 'habit-101',
    title: 'Evening Walk',
    description: '30 minutes walk in the park',
    color: '#10B981',
    frequencyType: 'daily',
    targetType: 'boolean',
    createdAt: '2026-08-15T00:00:00.000Z',
    updatedAt: '2026-08-15T00:00:00.000Z',
    archived: false
  }

  it('renders habit information and handles check-in click', () => {
    const onEdit = vi.fn()
    const onArchive = vi.fn()
    const onDelete = vi.fn()

    render(
      <QueryClientProvider client={queryClient}>
        <HabitCard
          habit={mockHabit}
          logs={[]}
          selectedDate="2026-08-15"
          onEdit={onEdit}
          onArchive={onArchive}
          onDelete={onDelete}
        />
      </QueryClientProvider>
    )

    // Check title and description render
    expect(screen.getByText('Evening Walk')).toBeInTheDocument()
    expect(screen.getByText('30 minutes walk in the park')).toBeInTheDocument()

    // Click toggle completion button
    const checkBtn = screen.getByRole('button', { name: /mark complete/i })
    expect(checkBtn).toBeInTheDocument()
    fireEvent.click(checkBtn)
  })

  it('renders numeric controls for numeric target habits and responds to clicks', () => {
    const numericHabit: Habit = {
      ...mockHabit,
      id: 'habit-num',
      title: 'Water Intake',
      targetType: 'numeric',
      targetValue: 8,
      unit: 'glasses'
    }

    render(
      <QueryClientProvider client={queryClient}>
        <HabitCard
          habit={numericHabit}
          logs={[]}
          selectedDate="2026-08-15"
          onEdit={vi.fn()}
          onArchive={vi.fn()}
          onDelete={vi.fn()}
        />
      </QueryClientProvider>
    )

    expect(screen.getByText('Water Intake')).toBeInTheDocument()
    expect(screen.getByText(/0 \/ 8 glasses/i)).toBeInTheDocument()

    // Click plus button to increment
    const plusBtn = screen.getByRole('button', { name: /increase value/i })
    expect(plusBtn).toBeInTheDocument()
    fireEvent.click(plusBtn)
  })
})
