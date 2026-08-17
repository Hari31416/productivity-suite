import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HabitRoutineChain } from '@/modules/habits/components/HabitRoutineChain'
import { RoutineNextPromptModal } from '@/modules/habits/components/RoutineNextPromptModal'
import type { Habit, HabitLog, HabitRoutineStack } from '@/modules/habits/types'

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

describe('HabitRoutineChain Component', () => {
  const mockHabits: Habit[] = [
    {
      id: 'h1',
      title: 'Hydrate 500ml',
      color: '#3b82f6',
      icon: 'Droplets',
      frequencyType: 'daily',
      targetType: 'boolean',
      routineId: 'morning_routine',
      routineName: 'Morning Routine',
      routineOrder: 1,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
      archived: false
    },
    {
      id: 'h2',
      title: 'Full Body Stretch',
      color: '#10b981',
      icon: 'Activity',
      frequencyType: 'daily',
      targetType: 'timer',
      targetValue: 15,
      routineId: 'morning_routine',
      routineName: 'Morning Routine',
      routineOrder: 2,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
      archived: false
    },
    {
      id: 'h3',
      title: 'Mindfulness Meditation',
      color: '#8b5cf6',
      icon: 'Sparkles',
      frequencyType: 'daily',
      targetType: 'boolean',
      routineId: 'morning_routine',
      routineName: 'Morning Routine',
      routineOrder: 3,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
      archived: false
    }
  ]

  const mockRoutine: HabitRoutineStack = {
    id: 'morning_routine',
    name: 'Morning Routine',
    habits: mockHabits,
    completedTodayCount: 1,
    totalCount: 3,
    isFullyCompletedToday: false
  }

  const mockLogs: HabitLog[] = [
    {
      id: 'l1',
      habitId: 'h1',
      date: '2026-08-17',
      timestamp: '2026-08-17T08:00:00.000Z',
      completed: true,
      createdAt: '2026-08-17T08:00:00.000Z',
      updatedAt: '2026-08-17T08:00:00.000Z'
    }
  ]

  it('renders all routine steps in sequence order and highlights Next Up step', () => {
    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <HabitRoutineChain routine={mockRoutine} allLogs={mockLogs} selectedDate="2026-08-17" />
      </QueryClientProvider>
    )

    expect(screen.getByText('Morning Routine')).toBeInTheDocument()
    expect(screen.getByText(/3 sequence steps/i)).toBeInTheDocument()
    expect(screen.getByText('Hydrate 500ml')).toBeInTheDocument()
    expect(screen.getByText('Full Body Stretch')).toBeInTheDocument()
    expect(screen.getByText('Mindfulness Meditation')).toBeInTheDocument()

    // Step 2 is the next incomplete habit
    expect(screen.getByText('Next Up')).toBeInTheDocument()
  })

  it('triggers onSelectHabit when clicking on a habit step', () => {
    const queryClient = createTestQueryClient()
    const handleSelectHabit = vi.fn()

    render(
      <QueryClientProvider client={queryClient}>
        <HabitRoutineChain
          routine={mockRoutine}
          allLogs={mockLogs}
          selectedDate="2026-08-17"
          onSelectHabit={handleSelectHabit}
        />
      </QueryClientProvider>
    )

    fireEvent.click(screen.getByText('Full Body Stretch'))
    expect(handleSelectHabit).toHaveBeenCalledWith('h2')
  })
})

describe('RoutineNextPromptModal Component', () => {
  const habit1: Habit = {
    id: 'h1',
    title: 'Drink Water',
    color: '#3b82f6',
    frequencyType: 'daily',
    targetType: 'boolean',
    routineId: 'morning',
    routineName: 'Morning Routine',
    routineOrder: 1,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    archived: false
  }

  const habit2: Habit = {
    id: 'h2',
    title: 'Morning Yoga Stretch',
    color: '#10b981',
    frequencyType: 'daily',
    targetType: 'timer',
    targetValue: 20,
    routineId: 'morning',
    routineName: 'Morning Routine',
    routineOrder: 2,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    archived: false
  }

  it('renders prompt with next routine step details and action buttons', () => {
    const handleCheckIn = vi.fn()
    const handleLaunchTimer = vi.fn()
    const handleOpenChange = vi.fn()

    render(
      <RoutineNextPromptModal
        open={true}
        onOpenChange={handleOpenChange}
        completedHabit={habit1}
        nextHabit={habit2}
        routineName="Morning Routine"
        onCheckInNext={handleCheckIn}
        onLaunchTimerNext={handleLaunchTimer}
      />
    )

    expect(screen.getByText(/Continue Morning Routine/i)).toBeInTheDocument()
    expect(screen.getByText('Drink Water')).toBeInTheDocument()
    expect(screen.getByText('Morning Yoga Stretch')).toBeInTheDocument()
    expect(screen.getByText(/Start Timer/i)).toBeInTheDocument()

    fireEvent.click(screen.getByText(/Start Timer/i))
    expect(handleLaunchTimer).toHaveBeenCalledWith(habit2)
  })
})
