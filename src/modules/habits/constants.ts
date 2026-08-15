import type { HabitCategory } from './types'

export const DEFAULT_HABIT_CATEGORIES: HabitCategory[] = [
  { id: 'health', name: 'Health & Wellness', color: '#10b981' },
  { id: 'productivity', name: 'Productivity', color: '#3b82f6' },
  { id: 'fitness', name: 'Fitness & Sport', color: '#f97316' },
  { id: 'mindfulness', name: 'Mindfulness', color: '#8b5cf6' },
  { id: 'learning', name: 'Learning & Growth', color: '#ec4899' },
  { id: 'general', name: 'General Routine', color: '#64748b' }
]

export const PRESET_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f97316',
  '#8b5cf6',
  '#ec4899',
  '#eab308',
  '#06b6d4',
  '#64748b'
]
