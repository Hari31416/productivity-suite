import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  parseHashRoute,
  buildHashRoute,
  navigateHash,
  useHashRoute
} from '../hashRouter'

describe('hashRouter', () => {
  describe('parseHashRoute', () => {
    it('handles empty or root hash', () => {
      expect(parseHashRoute('')).toEqual({
        pathname: '/',
        queryParams: {},
        search: '',
        raw: ''
      })

      expect(parseHashRoute('#/')).toEqual({
        pathname: '/',
        queryParams: {},
        search: '',
        raw: '#/'
      })
    })

    it('parses simple route paths', () => {
      expect(parseHashRoute('#/tasks')).toEqual({
        pathname: '/tasks',
        queryParams: {},
        search: '',
        raw: '#/tasks'
      })

      expect(parseHashRoute('/habits')).toEqual({
        pathname: '/habits',
        queryParams: {},
        search: '',
        raw: '/habits'
      })
    })

    it('parses single and multiple query parameters', () => {
      const parsedTask = parseHashRoute('#/tasks?taskId=task-123')
      expect(parsedTask.pathname).toBe('/tasks')
      expect(parsedTask.queryParams).toEqual({ taskId: 'task-123' })
      expect(parsedTask.search).toBe('?taskId=task-123')

      const parsedHabit = parseHashRoute('#/habits?habitId=habit-456&date=2026-08-16')
      expect(parsedHabit.pathname).toBe('/habits')
      expect(parsedHabit.queryParams).toEqual({
        habitId: 'habit-456',
        date: '2026-08-16'
      })
      expect(parsedHabit.search).toBe('?habitId=habit-456&date=2026-08-16')
    })
  })

  describe('buildHashRoute', () => {
    it('builds simple hash paths', () => {
      expect(buildHashRoute('/tasks')).toBe('#/tasks')
      expect(buildHashRoute('habits')).toBe('#/habits')
    })

    it('builds hash paths with query params', () => {
      expect(buildHashRoute('/tasks', { taskId: 'abc' })).toBe('#/tasks?taskId=abc')
      expect(
        buildHashRoute('/habits', {
          habitId: 'xyz',
          intervalIndex: 2,
          empty: undefined,
          nullVal: null
        })
      ).toBe('#/habits?habitId=xyz&intervalIndex=2')
    })
  })

  describe('navigateHash and useHashRoute', () => {
    beforeEach(() => {
      window.location.hash = ''
    })

    afterEach(() => {
      window.location.hash = ''
    })

    it('navigates and updates window.location.hash', () => {
      navigateHash('/tasks', { taskId: 't-99' })
      expect(window.location.hash).toBe('#/tasks?taskId=t-99')
    })

    it('updates route state reactively on hashchange in useHashRoute', () => {
      const { result } = renderHook(() => useHashRoute())

      expect(result.current.pathname).toBe('/')

      act(() => {
        result.current.navigate('/tasks', { taskId: 't-100' })
      })

      expect(result.current.pathname).toBe('/tasks')
      expect(result.current.queryParams).toEqual({ taskId: 't-100' })

      act(() => {
        result.current.navigate('/habits', { habitId: 'h-200' })
      })

      expect(result.current.pathname).toBe('/habits')
      expect(result.current.queryParams).toEqual({ habitId: 'h-200' })
    })
  })
})
