import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'

// Mock localStorage and sessionStorage
const createStorageMock = () => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => Object.keys(store)[index] || null
  }
}

Object.defineProperty(window, 'localStorage', {
  value: createStorageMock(),
  writable: true
})

Object.defineProperty(window, 'sessionStorage', {
  value: createStorageMock(),
  writable: true
})

// Mock matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  })
})

// Mock ResizeObserver for Recharts / Radix
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock URL createObjectURL and revokeObjectURL
if (
  typeof window.URL.createObjectURL === 'undefined' ||
  window.URL.createObjectURL.toString().includes('native')
) {
  Object.defineProperty(window.URL, 'createObjectURL', {
    value: () => 'blob:mock-url',
    writable: true
  })
}
if (typeof window.URL.revokeObjectURL === 'undefined') {
  Object.defineProperty(window.URL, 'revokeObjectURL', {
    value: () => {},
    writable: true
  })
}

// Mock navigator.storage
if (!navigator.storage) {
  Object.defineProperty(navigator, 'storage', {
    value: {
      estimate: async () => ({ usage: 1024 * 1024, quota: 1024 * 1024 * 100 }),
      persist: async () => true,
      persisted: async () => true
    },
    writable: true
  })
}
