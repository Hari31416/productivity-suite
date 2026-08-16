import { useState, useEffect, useCallback } from 'react'

export interface ParsedHashRoute {
  pathname: string
  queryParams: Record<string, string>
  search: string
  raw: string
}

export function parseHashRoute(hashOrRoute: string): ParsedHashRoute {
  if (!hashOrRoute) {
    return {
      pathname: '/',
      queryParams: {},
      search: '',
      raw: ''
    }
  }

  // Remove leading '#' if present and trim whitespace
  const clean = hashOrRoute.trim().replace(/^#+/, '')
  if (!clean || clean === '/') {
    return {
      pathname: '/',
      queryParams: {},
      search: '',
      raw: hashOrRoute
    }
  }

  const [rawPath, rawSearch] = clean.split('?')
  const pathname = rawPath.startsWith('/') ? rawPath : `/${rawPath}`
  const search = rawSearch ? `?${rawSearch}` : ''
  const queryParams: Record<string, string> = {}

  if (rawSearch) {
    const searchParams = new URLSearchParams(rawSearch)
    searchParams.forEach((val, key) => {
      queryParams[key] = val
    })
  }

  return {
    pathname: pathname || '/',
    queryParams,
    search,
    raw: hashOrRoute
  }
}

export function buildHashRoute(
  pathname: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  if (!params) {
    return `#${normalizedPath}`
  }

  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  }

  const queryString = searchParams.toString()
  return queryString ? `#${normalizedPath}?${queryString}` : `#${normalizedPath}`
}

export function navigateHash(
  route: string,
  params?: Record<string, string | number | boolean | undefined | null>,
  replace = false
): void {
  if (typeof window === 'undefined') return

  const targetHash = buildHashRoute(route, params)
  if (replace) {
    const url = `${window.location.pathname}${window.location.search}${targetHash}`
    window.history.replaceState(null, '', url)
  } else {
    window.location.hash = targetHash
  }
  try {
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } catch {
    // Event fallback
  }
}

export function useHashRoute(): ParsedHashRoute & {
  navigate: typeof navigateHash
} {
  const [route, setRoute] = useState<ParsedHashRoute>(() => {
    if (typeof window !== 'undefined') {
      return parseHashRoute(window.location.hash)
    }
    return parseHashRoute('/')
  })

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHashRoute(window.location.hash))
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  const navigate = useCallback(
    (
      newRoute: string,
      params?: Record<string, string | number | boolean | undefined | null>,
      replace = false
    ) => {
      navigateHash(newRoute, params, replace)
    },
    []
  )

  return {
    ...route,
    navigate
  }
}
