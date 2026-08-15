# Phase 6 - Mobile Responsiveness, Capacitor Readiness, and Testing

## Objectives

Optimize the suite for mobile viewports and Capacitor Android deployment, integrate local notification abstractions for habit reminders, ensure safe area compliance, and establish a comprehensive automated testing suite with Vitest.

## Key Deliverables

- Capacitor configuration (`capacitor.config.ts`) and Android packaging baseline.
- Mobile responsive layout tuning (safe area insets, 44px touch targets, mobile gesture support).
- Local notification service abstraction (Web Notification API with Capacitor plugin readiness).
- Zero-external-dependency asset bundling (all fonts, SVGs, and scripts local).
- Automated test suite covering streak calculations, interval engines, JSON backup validation, and Dexie repositories using Vitest.

## Technical Implementation Details

### Capacitor Configuration

`capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.localproductivity.suite',
  appName: 'Productivity Suite',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'beep.wav'
    }
  }
}

export default config
```

### Mobile Layout and Touch Optimization

- CSS Safe Area Insets applied globally in `src/index.css`:
  - `padding-top: env(safe-area-inset-top)` on sticky headers and top app bars.
  - `padding-bottom: env(safe-area-inset-bottom)` on mobile bottom navigation.
- Minimum 44x44px touch bounding boxes on all interactive elements:
  - Habit check-in buttons and interval dots.
  - Task checkbox toggles and action menus.
  - Bottom navigation icons and drawer triggers.

### Notification Service Abstraction

`src/core/notifications/notificationService.ts`:
- Web Mode: Uses standard browser `Notification` API with permission requests.
- Mobile/Capacitor Mode: Detects `Capacitor.isNativePlatform()` and invokes `@capacitor/local-notifications` to schedule alarms for sub-day habit intervals.

### Automated Testing Suite with Vitest

1. **Backup Tests** (`src/core/backup/__tests__/backupService.test.ts`):
   - Validates JSON export shape and Zod rejection of invalid payloads.
   - Confirms failed import does not write to IndexedDB.
   - Tests replace-all vs merge restore behavior.

2. **Habit Engine Tests** (`src/modules/habits/utils/__tests__/streakCalculator.test.ts`):
   - Current streak and longest streak calculations across dates and frequency types.
   - Sub-day interval slot generation and completion percentage computations.

3. **Task & Repository Tests** (`src/modules/tasks/repository/__tests__/taskRepository.test.ts`):
   - Task CRUD operations, subtask ordering, and status transitions against IndexedDB (using `fake-indexeddb`).

## Verification Checklist

- Automated test suite passes 100% via `pnpm test`.
- Production build succeeds via `pnpm build` with zero errors or warnings.
- Running inside simulated mobile viewports (e.g., iPhone 14 / Pixel 7 dimensions) shows no horizontal scrolling or clipped navigation bars.
- Exported distribution in `dist/` contains all assets locally with zero CDN external calls.
