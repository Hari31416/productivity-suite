import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HabitMonthlyCalendar } from '@/modules/habits/components/HabitMonthlyCalendar'
import type { Habit, HabitLog } from '@/modules/habits/types'

describe('HabitMonthlyCalendar Component', () => {
  let queryClient: QueryClient

  const mockHabit: Habit = {
    id: 'habit-cal-1',
    title: 'Daily Reading',
    color: '#3b82f6',
    icon: 'Activity',
    categoryId: 'learning',
    frequencyType: 'daily',
    targetType: 'numeric',
    targetValue: 20,
    unit: 'pages',
    archived: false,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z'
  }

  const mockLogs: HabitLog[] = [
    {
      id: 'log-1',
      habitId: 'habit-cal-1',
      date: '2026-08-10',
      timestamp: '2026-08-10T10:00:00.000Z',
      value: 20,
      completed: true,
      createdAt: '2026-08-10T10:00:00.000Z',
      updatedAt: '2026-08-10T10:00:00.000Z'
    },
    {
      id: 'log-2',
      habitId: 'habit-cal-1',
      date: '2026-08-11',
      timestamp: '2026-08-11T10:00:00.000Z',
      value: 20,
      completed: true,
      createdAt: '2026-08-11T10:00:00.000Z',
      updatedAt: '2026-08-11T10:00:00.000Z'
    }
  ]

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })
  })

  it('renders monthly summary metrics, weekday headers, and calendar days', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <HabitMonthlyCalendar habit={mockHabit} logs={mockLogs} />
      </QueryClientProvider>
    )

    expect(screen.getByText('Monthly History & Visual Calendar')).toBeInTheDocument()
    expect(screen.getByText('Monthly Completion')).toBeInTheDocument()
    expect(screen.getByText('Best Month Streak')).toBeInTheDocument()
    expect(screen.getByText('Total Logged')).toBeInTheDocument()

    // Weekday headers
    expect(screen.getByText('Mon')).toBeInTheDocument()
    expect(screen.getByText('Sun')).toBeInTheDocument()
  })
})
