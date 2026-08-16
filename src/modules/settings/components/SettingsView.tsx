import { useState, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useTheme } from '@/core/theme/useTheme'
import { db } from '@/core/db'
import { seedInitialData } from '@/core/db/seed'
import {
  exportBackup,
  validateBackupJson,
  restoreBackup
} from '@/core/backup/backupService'
import type { BackupArchiveData, RestoreMode } from '@/core/backup/types'
import {
  Database,
  Moon,
  Sun,
  Laptop,
  ShieldCheck,
  HardDrive,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Lock,
  Globe,
  Bell,
  BellRing,
  BellOff,
  Sparkles
} from 'lucide-react'

import {
  getNotificationPermission,
  requestNotificationPermission,
  sendLocalNotification,
  type NotificationPermissionStatus
} from '@/core/notifications/notificationService'

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney'
]

export function SettingsView() {
  const queryClient = useQueryClient()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Storage states
  const [storageEstimate, setStorageEstimate] = useState<{
    usage: number
    quota: number
  } | null>(null)
  const [isPersisted, setIsPersisted] = useState<boolean | null>(null)
  const [isPersisting, setIsPersisting] = useState(false)

  // Table counts
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({})

  // Timezone
  const [timezone, setTimezone] = useState<string>(() => {
    return (
      localStorage.getItem('productivity_timezone') ||
      'Asia/Kolkata'
    )
  })

  // Notification states
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermissionStatus>(() => getNotificationPermission())
  const [notificationFeedback, setNotificationFeedback] = useState<string | null>(null)
  const [isTestingNotification, setIsTestingNotification] = useState(false)

  // Backup & Restore states
  const [isExporting, setIsExporting] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importedBackup, setImportedBackup] = useState<BackupArchiveData | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [selectedRestoreMode, setSelectedRestoreMode] = useState<RestoreMode>('replace')
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null)
  const [isSeeding, setIsSeeding] = useState(false)

  // Clear data safety modal
  const [clearDataModalOpen, setClearDataModalOpen] = useState(false)
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('')
  const [isClearing, setIsClearing] = useState(false)

  const handleSeedSampleData = async () => {
    setIsSeeding(true)
    setRestoreSuccess(null)
    try {
      await seedInitialData(db)
      await queryClient.invalidateQueries()
      await refreshStorageDiagnostics()
      setRestoreSuccess('Showcase sample data loaded successfully.')
    } catch {
      setValidationError('Failed to load sample data.')
    } finally {
      setIsSeeding(false)
    }
  }


  // Fetch storage diagnostics & table counts
  const refreshStorageDiagnostics = async () => {
    if (typeof navigator !== 'undefined' && navigator.storage) {
      if (navigator.storage.estimate) {
        try {
          const est = await navigator.storage.estimate()
          setStorageEstimate({
            usage: est.usage || 0,
            quota: est.quota || 0
          })
        } catch {
          // Ignore
        }
      }

      if (navigator.storage.persisted) {
        try {
          const persisted = await navigator.storage.persisted()
          setIsPersisted(persisted)
        } catch {
          // Ignore
        }
      }
    }

    try {
      const [habits, habitLogs, projects, tasks, subtasks, notes, tags] =
        await Promise.all([
          db.habits.count(),
          db.habitLogs.count(),
          db.projects.count(),
          db.tasks.count(),
          db.subtasks.count(),
          db.notes.count(),
          db.tags.count()
        ])

      setTableCounts({
        habits,
        habitLogs,
        projects,
        tasks,
        subtasks,
        notes,
        tags
      })
    } catch {
      // Ignore
    }
  }

  useEffect(() => {
    refreshStorageDiagnostics()
  }, [])

  // Handle persistent storage request
  const handleRequestPersistence = async () => {
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      setIsPersisting(true)
      try {
        const persisted = await navigator.storage.persist()
        setIsPersisted(persisted)
      } finally {
        setIsPersisting(false)
      }
    }
  }

  // Timezone change
  const handleTimezoneChange = (val: string) => {
    setTimezone(val)
    localStorage.setItem('productivity_timezone', val)
  }

  // Notification handlers
  const handleRequestNotificationPermission = async () => {
    const status = await requestNotificationPermission()
    setNotificationPermission(status)
    if (status === 'granted') {
      setNotificationFeedback('Notification permissions granted successfully.')
    } else if (status === 'denied') {
      setNotificationFeedback('Notification permissions were blocked by your browser.')
    } else if (status === 'unsupported') {
      setNotificationFeedback('Notifications are not supported in this environment.')
    }
  }

  const handleTestNotification = async () => {
    setIsTestingNotification(true)
    setNotificationFeedback(null)
    try {
      const sent = await sendLocalNotification({
        title: 'Productivity Suite',
        body: 'Local notification test successful. Habit & interval reminders are operational.'
      })
      if (sent) {
        setNotificationFeedback('Test notification sent successfully.')
      } else {
        setNotificationFeedback(
          'Failed to trigger notification. Please check browser permission settings.'
        )
      }
      setNotificationPermission(getNotificationPermission())
    } finally {
      setIsTestingNotification(false)
    }
  }

  // Backup Export
  const handleExport = async () => {
    setIsExporting(true)
    try {
      await exportBackup()
    } finally {
      setIsExporting(false)
    }
  }

  // File import handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setValidationError(null)
    setImportedBackup(null)
    setRestoreSuccess(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const result = validateBackupJson(content)
      if (result.success) {
        setImportedBackup(result.data)
        setValidationError(null)
        setImportModalOpen(true)
      } else {
        setValidationError(result.error)
        setImportedBackup(null)
        setImportModalOpen(true)
      }
    }
    reader.readAsText(file)

    // Reset input so same file can be re-selected if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Execute restore
  const handleExecuteRestore = async () => {
    if (!importedBackup) return
    setIsRestoring(true)
    try {
      await restoreBackup(importedBackup, selectedRestoreMode)
      await queryClient.invalidateQueries()
      await refreshStorageDiagnostics()
      setRestoreSuccess(
        `Successfully restored ${selectedRestoreMode === 'replace' ? 'all' : 'merged'} data from backup.`
      )
      setImportedBackup(null)
    } catch (err) {
      setValidationError(
        `Restore failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      )
    } finally {
      setIsRestoring(false)
    }
  }

  // Execute wipe all data
  const handleClearAllData = async () => {
    if (deleteConfirmationInput !== 'DELETE') return
    setIsClearing(true)
    try {
      await db.transaction(
        'rw',
        [
          db.habits,
          db.habitLogs,
          db.projects,
          db.tasks,
          db.subtasks,
          db.notes,
          db.tags
        ],
        async () => {
          await Promise.all([
            db.habits.clear(),
            db.habitLogs.clear(),
            db.projects.clear(),
            db.tasks.clear(),
            db.subtasks.clear(),
            db.notes.clear(),
            db.tags.clear()
          ])
        }
      )
      await queryClient.invalidateQueries()
      await refreshStorageDiagnostics()
      setClearDataModalOpen(false)
      setDeleteConfirmationInput('')
    } finally {
      setIsClearing(false)
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Appearance & Theme</CardTitle>
          <CardDescription>
            Choose your preferred color theme. Currently active: <span className="font-semibold text-foreground capitalize">{resolvedTheme}</span>
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

      {/* Regional & Timezone Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">Timezone & Regional</CardTitle>
          </div>
          <CardDescription>
            Configure your timezone preference for habit day boundaries and task due times.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-w-md space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Current Timezone
          </label>
          <Select value={timezone} onValueChange={handleTimezoneChange}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {COMMON_TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Notifications & Reminders */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">Notifications & Reminders</CardTitle>
          </div>
          <CardDescription>
            Configure local reminders for habit intervals, sub-day check-ins, and scheduled tasks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-muted/10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">Permission Status</span>
                {notificationPermission === 'granted' && (
                  <Badge variant="secondary" className="gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Granted
                  </Badge>
                )}
                {notificationPermission === 'denied' && (
                  <Badge variant="destructive" className="gap-1">
                    <BellOff className="h-3.5 w-3.5" />
                    Denied
                  </Badge>
                )}
                {notificationPermission === 'default' && (
                  <Badge variant="outline" className="gap-1 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Prompt Required
                  </Badge>
                )}
                {notificationPermission === 'unsupported' && (
                  <Badge variant="outline" className="gap-1 text-muted-foreground">
                    <BellOff className="h-3.5 w-3.5" />
                    Unsupported
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {notificationPermission === 'granted'
                  ? 'Local notifications and habit alarms are enabled.'
                  : notificationPermission === 'denied'
                    ? 'Notifications are blocked in your browser settings. Unblock to receive reminders.'
                    : notificationPermission === 'default'
                      ? 'Click Request Permission below to allow habit alerts and time-slot alarms.'
                      : 'The current environment does not support HTML5 or native local notifications.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
                <Button
                  size="sm"
                  onClick={handleRequestNotificationPermission}
                  className="text-xs gap-1.5 min-h-[44px]"
                >
                  <BellRing className="h-4 w-4" />
                  <span>Request Permission</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestNotification}
                disabled={isTestingNotification}
                className="text-xs gap-1.5 min-h-[44px]"
              >
                <Bell className="h-4 w-4" />
                <span>{isTestingNotification ? 'Sending...' : 'Send Test Notification'}</span>
              </Button>
            </div>
          </div>

          {notificationFeedback && (
            <div className="p-3 rounded-lg bg-muted/40 border text-xs text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <span>{notificationFeedback}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* JSON Backup & Restore */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">Backup & Restore</CardTitle>
          </div>
          <CardDescription>
            Export all application tables into a structured, validated JSON file or restore previous archives.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {restoreSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{restoreSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border p-4 flex flex-col justify-between space-y-3 bg-muted/20">
              <div>
                <h4 className="text-sm font-semibold mb-1">Export Complete Backup</h4>
                <p className="text-xs text-muted-foreground">
                  Serializes all 7 IndexedDB tables into a versioned JSON backup format.
                </p>
              </div>
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="gap-2 w-full text-xs"
              >
                <Download className="h-4 w-4" />
                <span>{isExporting ? 'Exporting...' : 'Export Backup (.json)'}</span>
              </Button>
            </div>

            <div className="rounded-xl border p-4 flex flex-col justify-between space-y-3 bg-muted/20">
              <div>
                <h4 className="text-sm font-semibold mb-1">Import & Restore</h4>
                <p className="text-xs text-muted-foreground">
                  Validate and restore JSON backups with Replace or Merge strategy.
                </p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 w-full text-xs"
              >
                <Upload className="h-4 w-4" />
                <span>Select Backup File</span>
              </Button>
            </div>

            <div className="rounded-xl border p-4 flex flex-col justify-between space-y-3 bg-muted/20 sm:col-span-2">
              <div>
                <h4 className="text-sm font-semibold mb-1">Load Showcase Sample Data</h4>
                <p className="text-xs text-muted-foreground">
                  Populate starter habits (Hydration, Reading), tasks, projects, and guides to explore the app.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={handleSeedSampleData}
                disabled={isSeeding}
                className="gap-2 w-full text-xs font-semibold"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span>{isSeeding ? 'Loading Sample Data...' : 'Load Sample Data'}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Storage Diagnostics & Database Inspector */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">Local Storage Diagnostics</CardTitle>
            </div>
            <CardDescription>
              IndexedDB (LocalProductivitySuiteDB v1) consumption and persistence status.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshStorageDiagnostics}
            className="gap-1 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Storage usage gauge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border p-4 bg-muted/10 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Storage Usage Estimate</span>
                <span className="font-mono text-foreground">
                  {storageEstimate ? formatBytes(storageEstimate.usage) : 'Estimating...'}
                </span>
              </div>
              {storageEstimate && storageEstimate.quota > 0 && (
                <div className="text-[11px] text-muted-foreground">
                  Quota: {formatBytes(storageEstimate.quota)} (
                  {((storageEstimate.usage / storageEstimate.quota) * 100).toFixed(2)}% used)
                </div>
              )}
            </div>

            <div className="rounded-xl border p-4 bg-muted/10 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold">Persistent Storage</div>
                <div className="text-[11px] text-muted-foreground">
                  {isPersisted
                    ? 'Storage is persisted and protected from eviction.'
                    : 'Best-effort browser storage (can be evicted if disk is full).'}
                </div>
              </div>
              {isPersisted ? (
                <Badge variant="secondary" className="gap-1 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Persisted
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRequestPersistence}
                  disabled={isPersisting}
                  className="text-xs gap-1"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>{isPersisting ? 'Requesting...' : 'Request Persist'}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Table record counts */}
          <div className="rounded-xl border divide-y text-xs">
            <div className="flex items-center justify-between p-3 bg-muted/30 font-semibold">
              <span>Database Table</span>
              <span>Total Records</span>
            </div>
            {Object.entries(tableCounts).map(([tableName, count]) => (
              <div key={tableName} className="flex items-center justify-between p-3">
                <span className="font-mono text-primary">{tableName}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Zero telemetry or third-party tracking. All data is exclusively stored offline.</span>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone: Clear Data */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle className="text-base font-semibold">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Permanently clear all records from all 7 Dexie IndexedDB tables.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            This action cannot be undone. Please ensure you have exported a JSON backup beforehand.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setDeleteConfirmationInput('')
              setClearDataModalOpen(true)
            }}
            className="gap-1.5 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear All Data</span>
          </Button>
        </CardFooter>
      </Card>

      {/* Import / Validation Modal */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Restore from Backup</DialogTitle>
            <DialogDescription>
              Validate archive schema and choose restore strategy.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {validationError ? (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Validation Error
                </div>
                <p className="font-mono text-[11px] break-all">{validationError}</p>
              </div>
            ) : importedBackup ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Valid Backup Archive
                  </div>
                  <div className="text-[11px] grid grid-cols-2 gap-1 pt-1 text-foreground/80">
                    <div>Format Version: {importedBackup.metadata.formatVersion}</div>
                    <div>App Version: {importedBackup.metadata.appVersion}</div>
                    <div className="col-span-2">
                      Exported: {new Date(importedBackup.metadata.exportTimestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-3 bg-muted/20">
                  <div className="font-semibold mb-1">Archive Contents:</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground text-[11px]">
                    <div>Habits: {importedBackup.habits.length}</div>
                    <div>Habit Logs: {importedBackup.habitLogs.length}</div>
                    <div>Projects: {importedBackup.projects.length}</div>
                    <div>Tasks: {importedBackup.tasks.length}</div>
                    <div>Subtasks: {importedBackup.subtasks.length}</div>
                    <div>Notes: {importedBackup.notes.length}</div>
                    <div>Tags: {importedBackup.tags.length}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-semibold block">Select Restore Strategy:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRestoreMode('replace')}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        selectedRestoreMode === 'replace'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      <div className="font-semibold text-xs mb-0.5">Replace All Data</div>
                      <div className="text-[10px] opacity-80 leading-tight">
                        Wipes existing database and reloads archive.
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRestoreMode('merge')}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        selectedRestoreMode === 'merge'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      <div className="font-semibold text-xs mb-0.5">Merge with Existing</div>
                      <div className="text-[10px] opacity-80 leading-tight">
                        Upserts by ID without deleting other records.
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setImportModalOpen(false)}
            >
              Cancel
            </Button>
            {importedBackup && (
              <Button
                onClick={async () => {
                  await handleExecuteRestore()
                  setImportModalOpen(false)
                }}
                disabled={isRestoring}
              >
                {isRestoring ? 'Restoring...' : `Proceed with ${selectedRestoreMode === 'replace' ? 'Replace' : 'Merge'}`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Safety Confirmation Dialog for Clear Data */}
      <Dialog open={clearDataModalOpen} onOpenChange={setClearDataModalOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Confirm Database Wipe
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all habits, logs, projects, tasks, subtasks, notes, and tags from this browser.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <p className="text-muted-foreground">
              Please type <span className="font-mono font-bold text-destructive">DELETE</span> below to confirm.
            </p>
            <Input
              placeholder="Type DELETE"
              value={deleteConfirmationInput}
              onChange={(e) => setDeleteConfirmationInput(e.target.value)}
              className="font-mono"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setClearDataModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmationInput !== 'DELETE' || isClearing}
              onClick={handleClearAllData}
            >
              {isClearing ? 'Clearing...' : 'Permanently Delete All Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
