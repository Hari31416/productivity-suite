import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HabitDetailView } from '@/modules/habits/components/HabitDetailView'
import type { Habit, HabitLog } from '@/modules/habits/types'

describe('HabitDetailView Component', () => {
  let queryClient: QueryClient

  const mockHabit: Habit = {
    id: 'habit-101',
    title: 'Hydration Routine',
    description: 'Stay hydrated throughout the day',
    motivationNotes: 'Better energy and kidney health',
    color: '#0A7A64',
    icon: 'Activity',
    categoryId: 'health',
    frequencyType: 'daily',
    targetType: 'numeric',
    targetValue: 2000,
    unit: 'ml',
    reminderTimes: ['08:00', '12:00', '16:00'],
    pinned: false,
    archived: false,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z'
  }

  const mockLogs: HabitLog[] = [
    {
      id: 'log-1',
      habitId: 'habit-101',
      date: '2026-08-16',
      timestamp: '2026-08-16T08:30:00.000Z',
      value: 500,
      completed: false,
      createdAt: '2026-08-16T08:30:00.000Z',
      updatedAt: '2026-08-16T08:30:00.000Z'
    }
  ]

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })
  })

  it('renders hero header, streak cards, and dynamic stepper for numeric habits', () => {
    const onBack = vi.fn()

    render(
      <QueryClientProvider client={queryClient}>
        <HabitDetailView
          habit={mockHabit}
          logs={mockLogs}
          allLogs={mockLogs}
          selectedDate="2026-08-16"
          onBack={onBack}
        />
      </QueryClientProvider>
    )

    // Hero Header
    expect(screen.getByRole('heading', { level: 1, name: 'Hydration Routine' })).toBeInTheDocument()
    expect(screen.getAllByText('Daily Habit').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('2000 ml Target')).toBeInTheDocument()

    // Streak and Metric Cards
    expect(screen.getByText('Current Streak')).toBeInTheDocument()
    expect(screen.getByText('Best Streak')).toBeInTheDocument()
    expect(screen.getByText('All-Time Total')).toBeInTheDocument()

    // Dynamic Stepper buttons for 2000 ml: primaryStep is 250, quick chips +250, +500, +1000
    expect(screen.getByTitle('Add 250')).toBeInTheDocument()
    expect(screen.getByText('+250')).toBeInTheDocument()
    expect(screen.getByText('+500')).toBeInTheDocument()
    expect(screen.getByText('+1000')).toBeInTheDocument()

    // Motivation notes
    expect(screen.getByText('Better energy and kidney health')).toBeInTheDocument()

    // Reminders
    expect(screen.getByText('08:00')).toBeInTheDocument()
    expect(screen.getByText('12:00')).toBeInTheDocument()
    expect(screen.getByText('16:00')).toBeInTheDocument()

    // Focus Timer should NOT be rendered for numeric counter habits
    expect(screen.queryByRole('button', { name: /start focus/i })).not.toBeInTheDocument()

    // Back button
    const backBtn = screen.getByRole('button', { name: /back to habits/i })
    fireEvent.click(backBtn)
    expect(onBack).toHaveBeenCalled()
  })

  it('renders Focus Timer for timer habits', () => {
    const timerHabit: Habit = {
      ...mockHabit,
      id: 'habit-102',
      title: 'Mindful Meditation',
      targetType: 'timer',
      targetValue: 20,
      unit: 'minutes'
    }

    render(
      <QueryClientProvider client={queryClient}>
        <HabitDetailView
          habit={timerHabit}
          logs={[]}
          allLogs={[]}
          selectedDate="2026-08-16"
          onBack={vi.fn()}
        />
      </QueryClientProvider>
    )

    expect(screen.getByRole('button', { name: /start focus/i })).toBeInTheDocument()
    expect(screen.getByText('20:00')).toBeInTheDocument()
  })

  it('opens edit modal when edit button is clicked', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <HabitDetailView
          habit={mockHabit}
          logs={mockLogs}
          allLogs={mockLogs}
          selectedDate="2026-08-16"
          onBack={vi.fn()}
        />
      </QueryClientProvider>
    )

    const editBtn = screen.getByRole('button', { name: /edit/i })
    fireEvent.click(editBtn)

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Hydration Routine')).toBeInTheDocument()
    })
  })
})
