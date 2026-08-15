# Phase 5 - Unified Dashboard, Security, and Encrypted Backup

## Objectives

Construct the unified Dashboard home view aggregating daily widgets across all modules, and build the master-password-protected, AES-GCM encrypted, compressed backup and restore engine with storage diagnostic settings.

## Key Deliverables

- Unified Dashboard view integrating dynamic widget components from all modules.
- Quick action command palette for creating tasks, habits, and notes from any screen.
- Master password encryption engine using Web Crypto API (`AES-GCM` 256-bit with `PBKDF2`).
- Compressed archive packaging using `fflate` for multi-table JSON exports.
- Password-protected import, verification, and conflict-resolution restore workflow.
- Settings view with theme configuration, storage usage breakdown, and data management.

## Technical Implementation Details

### Unified Dashboard Architecture

`src/modules/dashboard/components/DashboardView.tsx`:
- Header banner showing current date, greeting, and overall daily productivity score.
- Dynamic widget container rendering registered module widgets (`HabitDashboardWidget`, `TaskDashboardWidget`, `NotesDashboardWidget`).
- Quick Actions Bar: Instant modal triggers for "+ Add Task", "+ Log Habit", and "+ New Note".

### Encrypted Compressed Backup Workflow

`src/core/crypto/backupService.ts`:

```typescript
export interface BackupMetadata {
  version: number
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

1. **Export Workflow**:
   - Query all records from Dexie IndexedDB tables.
   - Format records into separate JSON files (`habits.json`, `tasks.json`, `notes.json`, etc.).
   - Compress the JSON files into a binary zip stream using `fflate.zipSync`.
   - Prompt user for a master password.
   - Generate a 16-byte random salt and derive a 256-bit AES-GCM encryption key via `PBKDF2` (100,000 iterations of SHA-256).
   - Generate a 12-byte IV and encrypt the compressed binary payload.
   - Package `[16-byte salt] + [12-byte IV] + [ciphertext + auth tag]` into a `.enc` binary file and trigger download.

2. **Import and Restore Workflow**:
   - User selects an `.enc` backup file and inputs their master password.
   - Read salt and IV headers from the file, derive decryption key with PBKDF2.
   - Decrypt payload via AES-GCM (Web Crypto rejects invalid passwords with cryptographic auth tag failure).
   - Decompress binary stream with `fflate.unzipSync` and parse JSON table files.
   - Validate structure using Zod schemas.
   - Prompt user with restore mode: "Replace All Data" (atomic wipe and reload) or "Merge with Existing Data" (upsert by ID).

### Settings and Storage Diagnostics

- `src/modules/settings/components/SettingsView.tsx`:
  - Storage consumption breakdown (IndexedDB estimate via `navigator.storage.estimate()`).
  - Export Encrypted Backup modal with password confirmation.
  - Import Encrypted Backup modal with password input and decryption status indicator.
  - Theme mode selector (Light, Dark, System).

## Verification Checklist

- Dashboard displays live statistics from Habits, Tasks, and Notes.
- Exporting a backup with password `Password123` produces an encrypted `.enc` file.
- Importing the `.enc` file with an incorrect password triggers a clear decryption error message without altering local data.
- Importing with the correct password successfully decrypts, parses, and restores all tables.
- Storage estimate accurately reports local IndexedDB storage usage.
