# Phase 2 - Habit Tracker Module

## Objectives

Implement the Habit Tracker module with support for daily check-ins, sub-day recurring intervals (e.g., every 3 hours, multi-time daily logging), numeric counters, streak calculations, and Recharts-based visual analytics and heatmaps.

## Key Deliverables

- Habit Tracker domain schema, repository layer, and TanStack Query hooks.
- Sub-day interval engine with customizable time windows and interval calculations.
- Current streak, best streak, and aggregate completion rate algorithms.
- Daily interactive check-in grid with one-click toggles and interval progress indicators.
- Habit creation, editing, and archive management modals.
- Analytics dashboard featuring monthly consistency heatmaps and weekly trend charts using Recharts.
- Habit dashboard widget for the unified home view.

## Technical Implementation Details

### Domain Schema and Models

`src/modules/habits/types.ts`:

```typescript
export type HabitFrequencyType =
  | 'daily'
  | 'weekly'
  | 'custom_days'
  | 'subday_interval'
  | 'times_per_day'

export type HabitTargetType = 'boolean' | 'numeric' | 'timer'

export interface Habit {
  id: string
  title: string
  description?: string
  color: string
  icon?: string
  categoryId?: string
  frequencyType: HabitFrequencyType
  targetDaysOfWeek?: number[]
  targetCountPerWeek?: number
  intervalHours?: number
  timesPerDay?: number
  timeWindow?: {
    startTime: string
    endTime: string
  }
  targetType: HabitTargetType
  targetValue?: number
  unit?: string
  createdAt: string
  updatedAt: string
  archived: boolean
}

export interface HabitLog {
  id: string
  habitId: string
  date: string
  timestamp: string
  intervalIndex?: number
  completed: boolean
  value?: number
  durationSeconds?: number
  note?: string
  createdAt: string
  updatedAt: string
}
```

### Sub-Day Interval Calculation Engine

`src/modules/habits/utils/intervalCalculator.ts`:
- Generates expected daily intervals based on `timeWindow` (e.g., 08:00 to 20:00) and `intervalHours` (e.g., every 3 hours produces slots at 08:00, 11:00, 14:00, 17:00, 20:00).
- Maps `HabitLog` entries to active interval slots for granular sub-day progress tracking.

### Streak and Aggregation Logic

`src/modules/habits/utils/streakCalculator.ts`:
- Calculates current continuous streak accounting for frequency type (daily vs custom weekdays vs interval completion).
- Calculates historical best streak and 30-day percentage consistency score.
- Generates aggregate heatmaps representing daily completion ratios (0.0 to 1.0) over calendar months.

### Component Structure

- `src/modules/habits/components/HabitsView.tsx`: Main view containing daily checklist, date selector, and analytics switch.
- `src/modules/habits/components/HabitCard.tsx`: Individual habit row with quick-check button, interval progress dots, and streak pill.
- `src/modules/habits/components/HabitFormModal.tsx`: Creation/edit dialog with frequency picker, interval config, and color selector.
- `src/modules/habits/components/HabitAnalytics.tsx`: Monthly consistency heatmap and completion trend charts with Recharts.
- `src/modules/habits/components/HabitDashboardWidget.tsx`: Compact home overview card showing today's completion progress.

## Verification Checklist

- Creating a daily habit persists to IndexedDB and renders in the daily tracker.
- Creating a sub-day interval habit (e.g., every 3 hours from 9 AM to 9 PM) generates the correct number of interval checkboxes.
- Checking off habits increments the streak counter accurately.
- Marking numerical habits (e.g., 8 glasses of water) updates progress bar toward target value.
- Recharts analytics view renders monthly heatmap with correct color shading for completion density.
