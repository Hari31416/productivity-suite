import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/core/theme/themeProvider'
import { CommandPalette } from '@/components/command/CommandPalette'

describe('Automated UI Testing: CommandPalette Component', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })

  it('renders command palette dialog when open, filters on search, and triggers action callbacks', () => {
    const onOpenChange = vi.fn()
    const onRouteChange = vi.fn()
    const onOpenTaskModal = vi.fn()
    const onOpenHabitModal = vi.fn()
    const onOpenNoteModal = vi.fn()

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <CommandPalette
            open={true}
            onOpenChange={onOpenChange}
            onRouteChange={onRouteChange}
            onOpenTaskModal={onOpenTaskModal}
            onOpenHabitModal={onOpenHabitModal}
            onOpenNoteModal={onOpenNoteModal}
          />
        </ThemeProvider>
      </QueryClientProvider>
    )

    // Palette search input should be visible
    const input = screen.getByPlaceholderText(/Type a command, jump to task/i)
    expect(input).toBeInTheDocument()

    // Default fast actions should be visible
    expect(screen.getByText('Create New Task')).toBeInTheDocument()
    expect(screen.getByText('Create New Habit')).toBeInTheDocument()
    expect(screen.getByText('Create New Note')).toBeInTheDocument()

    // Filter by searching
    fireEvent.change(input, { target: { value: 'habit' } })
    expect(screen.getByText('Create New Habit')).toBeInTheDocument()
    expect(screen.queryByText('Create New Task')).not.toBeInTheDocument()

    // Click filtered action
    fireEvent.click(screen.getByText('Create New Habit'))
    expect(onOpenHabitModal).toHaveBeenCalledTimes(1)
  })
})
