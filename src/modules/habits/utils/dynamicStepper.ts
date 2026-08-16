export interface DynamicStepConfig {
  primaryStep: number
  quickAddValues: number[]
}

/**
 * Calculates intelligent, proportional step sizes and quick-add button increments
 * based on the target value and unit of a habit.
 */
export function getDynamicStepConfig(targetValue: number = 1, unit?: string): DynamicStepConfig {
  const normalizedUnit = (unit || '').toLowerCase().trim()
  const target = Math.max(1, targetValue)

  // Specialized rules by unit
  if (
    normalizedUnit === 'ml' ||
    normalizedUnit === 'milliliters' ||
    normalizedUnit === 'l' ||
    normalizedUnit === 'liters'
  ) {
    if (target >= 1000) {
      return {
        primaryStep: 250,
        quickAddValues: [250, 500, 1000]
      }
    }
    if (target >= 200) {
      return {
        primaryStep: 50,
        quickAddValues: [100, 250]
      }
    }
  }

  if (normalizedUnit === 'steps' || normalizedUnit === 'step') {
    if (target >= 5000) {
      return {
        primaryStep: 500,
        quickAddValues: [1000, 2500, 5000]
      }
    }
    if (target >= 1000) {
      return {
        primaryStep: 200,
        quickAddValues: [500, 1000]
      }
    }
  }

  if (normalizedUnit === 'cal' || normalizedUnit === 'kcal' || normalizedUnit === 'calories') {
    if (target >= 1000) {
      return {
        primaryStep: 100,
        quickAddValues: [250, 500]
      }
    }
    return {
      primaryStep: 50,
      quickAddValues: [100, 200]
    }
  }

  // General numeric scale rules
  if (target <= 5) {
    return {
      primaryStep: 1,
      quickAddValues: [1, 2]
    }
  }

  if (target <= 15) {
    return {
      primaryStep: 1,
      quickAddValues: [2, 5]
    }
  }

  if (target <= 50) {
    return {
      primaryStep: 1,
      quickAddValues: [5, 10]
    }
  }

  if (target <= 150) {
    return {
      primaryStep: 5,
      quickAddValues: [10, 25]
    }
  }

  if (target <= 500) {
    return {
      primaryStep: 10,
      quickAddValues: [25, 50, 100]
    }
  }

  if (target <= 2500) {
    return {
      primaryStep: 50,
      quickAddValues: [100, 250, 500]
    }
  }

  if (target <= 10000) {
    return {
      primaryStep: 250,
      quickAddValues: [500, 1000, 2500]
    }
  }

  // Large targets (> 10000)
  const power = Math.pow(10, Math.floor(Math.log10(target)) - 1)
  const step1 = Math.round((target * 0.1) / power) * power || power
  const step2 = Math.round((target * 0.25) / power) * power || power * 2
  return {
    primaryStep: power,
    quickAddValues: [step1, step2]
  }
}

/**
 * Calculates dynamic timer increments based on target minutes
 */
export function getDynamicTimerConfig(targetMinutes: number = 30): DynamicStepConfig {
  const target = Math.max(1, targetMinutes)
  if (target <= 15) {
    return {
      primaryStep: 1,
      quickAddValues: [2, 5, 10]
    }
  }
  if (target <= 30) {
    return {
      primaryStep: 5,
      quickAddValues: [5, 10, 15]
    }
  }
  if (target <= 60) {
    return {
      primaryStep: 5,
      quickAddValues: [10, 15, 30]
    }
  }
  return {
    primaryStep: 15,
    quickAddValues: [15, 30, 60]
  }
}
