import { useEffect } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

type BackHandler = () => boolean | void

interface HandlerEntry {
  id: string
  priority: number
  handler: BackHandler
}

class BackButtonManager {
  private handlers: HandlerEntry[] = []

  register(handler: BackHandler, priority = 0): () => void {
    const id = Math.random().toString(36).substring(2, 9)
    this.handlers.push({ id, priority, handler })
    this.handlers.sort((a, b) => b.priority - a.priority)
    return () => {
      this.handlers = this.handlers.filter((h) => h.id !== id)
    }
  }

  handleBack(): boolean {
    for (const entry of [...this.handlers]) {
      const handled = entry.handler()
      if (handled !== false) {
        return true
      }
    }

    // Check if any Radix UI dialog, sheet, or overlay is currently active in the DOM
    const openModals = document.querySelectorAll(
      '[role="dialog"][data-state="open"], [data-radix-portal] [data-state="open"]'
    )
    if (openModals.length > 0) {
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        which: 27,
        bubbles: true,
        cancelable: true
      })
      document.dispatchEvent(escapeEvent)
      return true
    }

    return false
  }
}

export type FallbackBackAction = 'strip-query' | 'go-home' | 'exit'

export function resolveFallbackBack(pathname: string, hasQueryParams: boolean): FallbackBackAction {
  if (hasQueryParams) {
    return 'strip-query'
  }
  if (pathname !== '/') {
    return 'go-home'
  }
  return 'exit'
}

export const backButtonManager = new BackButtonManager()

export function useBackButton(handler: BackHandler, active = true, priority = 0) {
  useEffect(() => {
    if (!active) return
    return backButtonManager.register(handler, priority)
  }, [active, handler, priority])
}

export function setupBackButton(onNavigateBack?: () => boolean | void): () => void {
  let removeListener: (() => void) | undefined

  if (Capacitor.isPluginAvailable('App')) {
    CapacitorApp.addListener('backButton', () => {
      if (backButtonManager.handleBack()) {
        return
      }
      if (onNavigateBack && onNavigateBack() !== false) {
        return
      }
      CapacitorApp.exitApp()
    }).then((handle) => {
      removeListener = () => {
        handle.remove()
      }
    })
  }

  const handleDocumentBack = (e: Event) => {
    e.preventDefault()
    if (backButtonManager.handleBack()) {
      return
    }
    if (onNavigateBack && onNavigateBack() !== false) {
      return
    }
  }

  document.addEventListener('backbutton', handleDocumentBack)

  return () => {
    if (removeListener) removeListener()
    document.removeEventListener('backbutton', handleDocumentBack)
  }
}
