import { describe, it, expect } from 'vitest'
import { parseSmartTaskInput } from '../smartTaskParser'
import { format, addDays } from 'date-fns'

describe('smartTaskParser', () => {
  const mockProjects = [
    { id: 'proj-1', name: 'Work' },
    { id: 'proj-2', name: 'Personal Errands' }
  ]

  it('returns plain title when no tokens are present', () => {
    const res = parseSmartTaskInput('Buy groceries and milk', mockProjects)
    expect(res.title).toBe('Buy groceries and milk')
    expect(res.priority).toBeUndefined()
    expect(res.dueDate).toBeUndefined()
    expect(res.projectId).toBeUndefined()
    expect(res.tags).toEqual([])
  })

  it('parses priority token !urgent and !high', () => {
    const res1 = parseSmartTaskInput('Fix critical security bug !urgent', mockProjects)
    expect(res1.title).toBe('Fix critical security bug')
    expect(res1.priority).toBe('urgent')

    const res2 = parseSmartTaskInput('Submit report !high', mockProjects)
    expect(res2.title).toBe('Submit report')
    expect(res2.priority).toBe('high')
  })

  it('parses due date token @today and @tomorrow', () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd')

    const res1 = parseSmartTaskInput('Prepare slide deck @today', mockProjects)
    expect(res1.title).toBe('Prepare slide deck')
    expect(res1.dueDate).toBe(todayStr)

    const res2 = parseSmartTaskInput('Call dentist @tomorrow', mockProjects)
    expect(res2.title).toBe('Call dentist')
    expect(res2.dueDate).toBe(tomorrowStr)
  })

  it('parses ISO date string @2026-09-15', () => {
    const res = parseSmartTaskInput('File tax return @2026-09-15', mockProjects)
    expect(res.title).toBe('File tax return')
    expect(res.dueDate).toBe('2026-09-15')
  })

  it('matches projects with #project and tags with #tag', () => {
    const res = parseSmartTaskInput('Finish quarterly review #work #finance', mockProjects)
    expect(res.title).toBe('Finish quarterly review')
    expect(res.projectId).toBe('proj-1')
    expect(res.projectName).toBe('Work')
    expect(res.tags).toEqual(['finance'])
  })

  it('combines multiple tokens in a single string', () => {
    const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd')
    const res = parseSmartTaskInput('Design dashboard mockups !high @tomorrow #work #ui', mockProjects)
    expect(res.title).toBe('Design dashboard mockups')
    expect(res.priority).toBe('high')
    expect(res.dueDate).toBe(tomorrowStr)
    expect(res.projectId).toBe('proj-1')
    expect(res.tags).toEqual(['ui'])
  })

  it('handles empty input gracefully', () => {
    const res = parseSmartTaskInput('   ')
    expect(res.title).toBe('')
    expect(res.tags).toEqual([])
  })
})
