# Phase 5 - Unified Dashboard, Settings, and JSON Backup

## Objectives

Construct the unified Dashboard home view aggregating daily widgets across all modules, and build versioned JSON export/import with storage diagnostic settings. Encrypted backups are out of scope for now.

## Key Deliverables

- Unified Dashboard view integrating dynamic widget components from all modules.
- Quick action command palette for creating tasks, habits, and notes from any screen.
- Versioned JSON backup of all Dexie tables.
- Import with Zod validation and overwrite or merge restore.
- Settings view with theme configuration, storage usage breakdown, and data management.

## Technical Implementation Details

### Unified Dashboard Architecture

`src/modules/dashboard/components/DashboardView.tsx`:

- Header banner showing current date, greeting, and overall daily productivity score.
- Dynamic widget container rendering registered module widgets (`HabitDashboardWidget`, `TaskDashboardWidget`, `NotesDashboardWidget`).
- Quick Actions Bar: Instant modal triggers for "+ Add Task", "+ Log Habit", and "+ New Note".

### JSON Backup Workflow

`src/core/backup/backupService.ts`:

```typescript
export interface BackupMetadata {
  backupFormatVersion: number
  exportTimestamp: string
  appVersion: string
  tableCounts: Record<string, number>
}

export interface BackupArchiveData {
  metadata: BackupMetadata
  habits: Habit[]
  habitLogs: HabitLog[]
  projects: Project[]
  tasks: Task[]
  subtasks: Subtask[]
  notes: Note[]
  tags: Tag[]
}
```

1. **Export workflow**:
   - Query all records from Dexie IndexedDB tables.
   - Build a single JSON document with metadata and table arrays.
   - Trigger download of a `.json` file (for example `productivity-backup-YYYY-MM-DD.json`).

2. **Import and restore workflow**:
   - User selects a `.json` backup file.
   - Parse JSON and validate with Zod. Reject invalid or incompatible `backupFormatVersion` without writing to IndexedDB.
   - Prompt restore mode: "Replace All Data" (atomic wipe and reload) or "Merge with Existing Data" (upsert by id).

### Settings and Storage Diagnostics

- `src/modules/settings/components/SettingsView.tsx`:
  - Storage consumption breakdown (IndexedDB estimate via `navigator.storage.estimate()`).
  - Request persistent storage via `navigator.storage.persist()`.
  - Export JSON backup.
  - Import JSON backup with validation status and restore-mode prompt.
  - Theme mode selector (Light, Dark, System).

## Verification Checklist

- Dashboard displays live statistics from Habits, Tasks, and Notes.
- Exporting a backup produces a valid JSON file that includes metadata and all tables.
- Importing an invalid or truncated file shows an error and does not alter local data.
- Replace-all restore wipes existing rows and reloads imported data.
- Merge restore upserts by id without dropping unrelated existing rows.
- Storage estimate reports local IndexedDB usage.
