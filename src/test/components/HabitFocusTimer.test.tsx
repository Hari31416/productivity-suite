import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HabitFocusTimer } from '@/modules/habits/components/HabitFocusTimer'
import type { Habit, HabitLog } from '@/modules/habits/types'

describe('HabitFocusTimer Component', () => {
  let queryClient: QueryClient

  const mockTimerHabit: Habit = {
    id: 'habit-timer-1',
    title: 'Mindful Meditation',
    color: '#8b5cf6',
    icon: 'Activity',
    categoryId: 'mindfulness',
    frequencyType: 'daily',
    targetType: 'timer',
    targetValue: 20,
    unit: 'mins',
    archived: false,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z'
  }

  const mockLogs: HabitLog[] = []

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })
  })

  it('renders circular timer with target minutes and toggles play/pause', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <HabitFocusTimer habit={mockTimerHabit} selectedDate="2026-08-16" logs={mockLogs} />
      </QueryClientProvider>
    )

    expect(screen.getByText('Focus Timer')).toBeInTheDocument()
    expect(screen.getByText(/20m target/i)).toBeInTheDocument()
    expect(screen.getByText('20:00')).toBeInTheDocument()

    const playBtn = screen.getByRole('button', { name: /start focus/i })
    fireEvent.click(playBtn)

    expect(screen.getByText(/pause/i)).toBeInTheDocument()

    // Advance time by 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(screen.getByText('19:55')).toBeInTheDocument()
  })

  it('allows adding minutes and resetting timer', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <HabitFocusTimer habit={mockTimerHabit} selectedDate="2026-08-16" logs={mockLogs} />
      </QueryClientProvider>
    )

    const add5mBtn = screen.getByRole('button', { name: /add 5 minutes/i })
    fireEvent.click(add5mBtn)

    expect(screen.getByText('25:00')).toBeInTheDocument()

    const resetBtn = screen.getByRole('button', { name: /reset timer/i })
    fireEvent.click(resetBtn)

    expect(screen.getByText('25:00')).toBeInTheDocument()
  })
})
