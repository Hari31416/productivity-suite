import { describe, it, expect, vi } from 'vitest'
import { backButtonManager } from '../backButton'

describe('backButtonManager', () => {
  it('registers and invokes handlers in priority order', () => {
    const callOrder: string[] = []

    const unreg1 = backButtonManager.register(() => {
      callOrder.push('handler1')
      return true
    }, 10)

    const unreg2 = backButtonManager.register(() => {
      callOrder.push('handler2')
      return true
    }, 20)

    const handled = backButtonManager.handleBack()
    expect(handled).toBe(true)
    expect(callOrder).toEqual(['handler2'])

    unreg1()
    unreg2()
  })

  it('falls through if handler returns false', () => {
    const callOrder: string[] = []

    const unreg1 = backButtonManager.register(() => {
      callOrder.push('handler1')
      return true
    }, 10)

    const unreg2 = backButtonManager.register(() => {
      callOrder.push('handler2')
      return false
    }, 20)

    const handled = backButtonManager.handleBack()
    expect(handled).toBe(true)
    expect(callOrder).toEqual(['handler2', 'handler1'])

    unreg1()
    unreg2()
  })

  it('unregisters handler correctly', () => {
    const handler = vi.fn(() => true)
    const unregister = backButtonManager.register(handler, 10)

    unregister()
    backButtonManager.handleBack()
    expect(handler).not.toHaveBeenCalled()
  })
})
