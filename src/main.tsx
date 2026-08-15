import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/core/theme/themeProvider'
import { initializeModules } from '@/modules/init'
import App from '@/App'
import '@/index.css'

// Initialize modular registry before app mounts
initializeModules()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false
    }
  }
})

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
