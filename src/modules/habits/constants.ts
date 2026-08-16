import {
  Bed,
  Smile,
  Smartphone,
  PenTool,
  Droplets,
  Laptop,
  Dumbbell,
  BookOpen,
  Footprints,
  Cpu,
  Heart,
  Flame,
  Coffee,
  Target,
  Sun,
  Moon,
  Apple,
  Music,
  Activity,
  type LucideIcon
} from 'lucide-react'
import type { HabitCategory } from './types'

export const DEFAULT_HABIT_CATEGORIES: HabitCategory[] = [
  { id: 'health', name: 'Health & Wellness', color: '#10b981' },
  { id: 'productivity', name: 'Productivity', color: '#3b82f6' },
  { id: 'fitness', name: 'Fitness & Sport', color: '#f97316' },
  { id: 'mindfulness', name: 'Mindfulness', color: '#8b5cf6' },
  { id: 'learning', name: 'Learning & Growth', color: '#ec4899' },
  { id: 'creativity', name: 'Creativity & Arts', color: '#06b6d4' },
  { id: 'finance', name: 'Finance & Money', color: '#eab308' },
  { id: 'lifestyle', name: 'Lifestyle & Social', color: '#14b8a6' },
  { id: 'general', name: 'General Routine', color: '#64748b' }
]

export const PRESET_COLORS = [
  '#0A7A64',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#f97316',
  '#ec4899',
  '#eab308',
  '#06b6d4',
  '#64748b'
]

export interface HabitIconOption {
  name: string
  label: string
  icon: LucideIcon
}

export const HABIT_ICONS: HabitIconOption[] = [
  { name: 'Bed', label: 'Sleep & Rest', icon: Bed },
  { name: 'Smile', label: 'Peace & Mindfulness', icon: Smile },
  { name: 'Smartphone', label: 'Screen & Digital', icon: Smartphone },
  { name: 'PenTool', label: 'Journal & Writing', icon: PenTool },
  { name: 'Droplets', label: 'Hydration & Water', icon: Droplets },
  { name: 'Laptop', label: 'Work & Code', icon: Laptop },
  { name: 'Dumbbell', label: 'Gym & Fitness', icon: Dumbbell },
  { name: 'BookOpen', label: 'Reading & Learning', icon: BookOpen },
  { name: 'Footprints', label: 'Walking & Steps', icon: Footprints },
  { name: 'Cpu', label: 'Focus & Logic', icon: Cpu },
  { name: 'Heart', label: 'Health & Heart', icon: Heart },
  { name: 'Flame', label: 'Energy & Routine', icon: Flame },
  { name: 'Coffee', label: 'Morning Coffee', icon: Coffee },
  { name: 'Target', label: 'Goals & Focus', icon: Target },
  { name: 'Sun', label: 'Morning Routine', icon: Sun },
  { name: 'Moon', label: 'Night Routine', icon: Moon },
  { name: 'Apple', label: 'Nutrition & Food', icon: Apple },
  { name: 'Music', label: 'Music & Audio', icon: Music }
]

export function getHabitIconComponent(
  iconName?: string,
  habitTitle?: string,
  categoryId?: string
): LucideIcon {
  if (iconName) {
    const found = HABIT_ICONS.find((i) => i.name.toLowerCase() === iconName.toLowerCase())
    if (found) return found.icon
  }

  const text = `${habitTitle || ''} ${categoryId || ''}`.toLowerCase()
  if (text.includes('sleep') || text.includes('bed') || text.includes('rest')) return Bed
  if (
    text.includes('meditat') ||
    text.includes('mindful') ||
    text.includes('calm') ||
    text.includes('peace') ||
    text.includes('relax')
  )
    return Smile
  if (
    text.includes('phone') ||
    text.includes('screen') ||
    text.includes('social') ||
    text.includes('digital') ||
    text.includes('app')
  )
    return Smartphone
  if (
    text.includes('write') ||
    text.includes('journal') ||
    text.includes('pen') ||
    text.includes('note') ||
    text.includes('essay')
  )
    return PenTool
  if (text.includes('water') || text.includes('drink') || text.includes('hydrat')) return Droplets
  if (
    text.includes('code') ||
    text.includes('work') ||
    text.includes('laptop') ||
    text.includes('computer') ||
    text.includes('dev')
  )
    return Laptop
  if (
    text.includes('gym') ||
    text.includes('workout') ||
    text.includes('exercise') ||
    text.includes('lift') ||
    text.includes('dumb')
  )
    return Dumbbell
  if (
    text.includes('read') ||
    text.includes('book') ||
    text.includes('learn') ||
    text.includes('study')
  )
    return BookOpen
  if (
    text.includes('walk') ||
    text.includes('step') ||
    text.includes('run') ||
    text.includes('hike') ||
    text.includes('jog')
  )
    return Footprints
  if (
    text.includes('brain') ||
    text.includes('chess') ||
    text.includes('logic') ||
    text.includes('puzzle') ||
    text.includes('ai')
  )
    return Cpu
  if (text.includes('health') || text.includes('heart') || text.includes('diet')) return Heart
  if (text.includes('energy') || text.includes('fast') || text.includes('speed')) return Flame

  return Activity
}
