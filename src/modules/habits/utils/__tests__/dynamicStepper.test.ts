import { describe, it, expect } from 'vitest'
import { getDynamicStepConfig, getDynamicTimerConfig } from '../dynamicStepper'

describe('dynamicStepper utility', () => {
  it('handles small numeric targets (e.g. 8 glasses)', () => {
    const config = getDynamicStepConfig(8, 'glasses')
    expect(config.primaryStep).toBe(1)
    expect(config.quickAddValues).toContain(2)
  })

  it('handles medium numeric targets (e.g. 30 pages)', () => {
    const config = getDynamicStepConfig(30, 'pages')
    expect(config.primaryStep).toBe(1)
    expect(config.quickAddValues).toEqual([5, 10])
  })

  it('handles hydration ml targets dynamically (e.g. 2000 ml)', () => {
    const config = getDynamicStepConfig(2000, 'ml')
    expect(config.primaryStep).toBe(250)
    expect(config.quickAddValues).toEqual([250, 500, 1000])
  })

  it('handles large step targets (e.g. 10000 steps)', () => {
    const config = getDynamicStepConfig(10000, 'steps')
    expect(config.primaryStep).toBe(500)
    expect(config.quickAddValues).toEqual([1000, 2500, 5000])
  })

  it('handles calorie targets (e.g. 2200 kcal)', () => {
    const config = getDynamicStepConfig(2200, 'kcal')
    expect(config.primaryStep).toBe(100)
    expect(config.quickAddValues).toEqual([250, 500])
  })

  it('handles dynamic timer configs for 30m, 60m, 120m', () => {
    const config30 = getDynamicTimerConfig(30)
    expect(config30.primaryStep).toBe(5)
    expect(config30.quickAddValues).toEqual([5, 10, 15])

    const config60 = getDynamicTimerConfig(60)
    expect(config60.primaryStep).toBe(5)
    expect(config60.quickAddValues).toEqual([10, 15, 30])

    const config120 = getDynamicTimerConfig(120)
    expect(config120.primaryStep).toBe(15)
    expect(config120.quickAddValues).toEqual([15, 30, 60])
  })
})
