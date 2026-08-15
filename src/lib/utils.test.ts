import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
  it('merges simple class names', () => {
    const result = cn('bg-red-500', 'text-white')
    expect(result).toBe('bg-red-500 text-white')
  })

  it('handles conditional classes properly', () => {
    const isPrimary = true
    const isSecondary = false
    const result = cn('base-class', isPrimary && 'is-primary', isSecondary && 'is-secondary')
    expect(result).toBe('base-class is-primary')
  })

  it('correctly resolves conflicting Tailwind classes using tailwind-merge', () => {
    const result = cn('p-4', 'p-6')
    expect(result).toBe('p-6')
  })

  it('handles null, undefined and boolean values cleanly', () => {
    const result = cn('btn', null, undefined, false, 0 && 'never')
    expect(result).toBe('btn')
  })
})
