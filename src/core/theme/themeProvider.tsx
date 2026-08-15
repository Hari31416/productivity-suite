import React, { createContext, useEffect, useState, useMemo } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export interface ThemeContextValue {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const THEME_STORAGE_KEY = 'productivity-theme'

export interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = THEME_STORAGE_KEY
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme
    const stored = localStorage.getItem(storageKey)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
    return defaultTheme
  })

  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    return theme === 'system' ? systemTheme : theme
  }, [theme, systemTheme])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)
  }, [resolvedTheme])

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme)
    setThemeState(newTheme)
  }

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme
    }),
    [theme, resolvedTheme]
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
