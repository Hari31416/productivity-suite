import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HabitWeekOverview } from '@/modules/habits/components/HabitWeekOverview'
import type { Habit, HabitLog } from '@/modules/habits/types'

describe('HabitWeekOverview Component', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })

  const mockHabits: Habit[] = [
    {
      id: 'habit-1',
      title: 'Morning Yoga',
      color: '#10B981',
      categoryId: 'fitness',
      frequencyType: 'daily',
      targetType: 'boolean',
      createdAt: '2026-08-10T00:00:00.000Z',
      updatedAt: '2026-08-10T00:00:00.000Z',
      archived: false
    },
    {
      id: 'habit-2',
      title: 'Read Books',
      color: '#8B5CF6',
      categoryId: 'learning',
      frequencyType: 'daily',
      targetType: 'numeric',
      targetValue: 20,
      unit: 'pages',
      createdAt: '2026-08-10T00:00:00.000Z',
      updatedAt: '2026-08-10T00:00:00.000Z',
      archived: false
    }
  ]

  const mockLogs: HabitLog[] = [
    {
      id: 'log-1',
      habitId: 'habit-1',
      date: '2026-08-10',
      timestamp: '2026-08-10T08:00:00.000Z',
      completed: true,
      createdAt: '2026-08-10T08:00:00.000Z',
      updatedAt: '2026-08-10T08:00:00.000Z'
    }
  ]

  it('renders week overview matrix table with habits and dates', () => {
    const onSelectDate = vi.fn()
    const onEditHabit = vi.fn()

    render(
      <QueryClientProvider client={queryClient}>
        <HabitWeekOverview
          habits={mockHabits}
          logs={mockLogs}
          selectedDate="2026-08-10"
          onSelectDate={onSelectDate}
          onEditHabit={onEditHabit}
        />
      </QueryClientProvider>
    )

    // Verify sub-view toggle buttons
    expect(screen.getByRole('button', { name: /log habits/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /weekly progress chart/i })).toBeInTheDocument()

    // Verify table headers
    expect(screen.getByText('Date')).toBeInTheDocument()
    expect(screen.getByText('Progress Bar')).toBeInTheDocument()
    expect(screen.getByText('Morning Yoga')).toBeInTheDocument()
    expect(screen.getByText('Read Books')).toBeInTheDocument()

    // Verify summary row
    expect(screen.getByText(/AVERAGE \/ TOTAL/i)).toBeInTheDocument()
  })

  it('switches between matrix grid and weekly progress chart', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <HabitWeekOverview
          habits={mockHabits}
          logs={mockLogs}
          selectedDate="2026-08-10"
          onSelectDate={vi.fn()}
        />
      </QueryClientProvider>
    )

    // Click on Weekly Progress Chart button
    const chartBtn = screen.getByRole('button', { name: /weekly progress chart/i })
    fireEvent.click(chartBtn)

    // Verify chart section appears
    expect(screen.getByText(/Daily Completion Trend/i)).toBeInTheDocument()
    expect(screen.getByText(/Week Performance/i)).toBeInTheDocument()

    // Switch back to Log Habits
    const matrixBtn = screen.getByRole('button', { name: /log habits/i })
    fireEvent.click(matrixBtn)
    expect(screen.getByText('Progress Bar')).toBeInTheDocument()
  })

  it('handles cell toggle clicks', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <HabitWeekOverview
          habits={mockHabits}
          logs={mockLogs}
          selectedDate="2026-08-10"
          onSelectDate={vi.fn()}
        />
      </QueryClientProvider>
    )

    const toggleButtons = screen.getAllByRole('button', { name: /mark/i })
    expect(toggleButtons.length).toBeGreaterThan(0)
    fireEvent.click(toggleButtons[0])
  })
})
