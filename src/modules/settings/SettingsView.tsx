import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/core/theme/useTheme'
import { Database, Moon, Sun, Laptop, ShieldCheck, HardDrive } from 'lucide-react'

export function SettingsView() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const dbStores = [
    { name: 'habits', description: 'Habit configurations, frequencies, and target types' },
    { name: 'habitLogs', description: 'Daily check-in logs, timer records, and completion entries' },
    { name: 'projects', description: 'Task projects and categorized workstreams' },
    { name: 'tasks', description: 'To-do items with priorities, statuses, and due dates' },
    { name: 'subtasks', description: 'Itemized subtasks nested within tasks' },
    { name: 'notes', description: 'Markdown documents with tags and pin status' },
    { name: 'tags', description: 'Global organization tags for notes and tasks' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings & Storage</h2>
        <p className="text-sm text-muted-foreground">
          Manage application preferences, storage inspection, and system configuration.
        </p>
      </div>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Appearance</CardTitle>
          <CardDescription>
            Choose your preferred color theme. Active mode: {resolvedTheme}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              className="flex flex-col h-20 items-center justify-center gap-2"
              onClick={() => setTheme('light')}
            >
              <Sun className="h-5 w-5" />
              <span className="text-xs">Light</span>
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              className="flex flex-col h-20 items-center justify-center gap-2"
              onClick={() => setTheme('dark')}
            >
              <Moon className="h-5 w-5" />
              <span className="text-xs">Dark</span>
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              className="flex flex-col h-20 items-center justify-center gap-2"
              onClick={() => setTheme('system')}
            >
              <Laptop className="h-5 w-5" />
              <span className="text-xs">System</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Database Schema & Storage Inspection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">Local Storage Architecture</CardTitle>
          </div>
          <CardDescription>
            IndexedDB database schema managed by Dexie.js (LocalProductivitySuiteDB v1).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border divide-y text-sm">
            {dbStores.map((store) => (
              <div key={store.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1">
                <div className="font-mono font-medium text-xs sm:text-sm text-primary">
                  {store.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {store.description}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span>All user data is stored strictly on this device with zero external network tracking.</span>
          </div>
        </CardContent>
      </Card>

      {/* Application Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">About Application</CardTitle>
          </div>
          <CardDescription>
            Local Productivity Suite - Phase 1 Foundation Architecture
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <p>Stack: React 18, TypeScript (Strict), Vite, Tailwind CSS, Dexie.js, Radix UI, TanStack Query, Zustand</p>
          <p>Storage Engine: IndexedDB with Repository Pattern</p>
          <p>Status: Phase 1 Scaffolding & Core Architecture Complete</p>
        </CardContent>
      </Card>
    </div>
  )
}
