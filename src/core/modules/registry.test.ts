import { describe, it, expect, beforeEach } from 'vitest'
import { moduleRegistry } from './registry'
import type { AppModuleManifest } from './types'

describe('ModuleRegistry', () => {
  beforeEach(() => {
    moduleRegistry.clear()
  })

  it('registers and retrieves a module manifest by id', () => {
    const manifest: AppModuleManifest = {
      id: 'habits',
      title: 'Habits',
      description: 'Habit tracking',
      iconName: 'Activity',
      route: '/habits',
      navOrder: 1,
      routes: [
        {
          path: '/habits',
          component: () => null
        }
      ]
    }

    moduleRegistry.register(manifest)
    expect(moduleRegistry.get('habits')).toEqual(manifest)
  })

  it('returns all modules sorted by navOrder', () => {
    const moduleA: AppModuleManifest = {
      id: 'settings',
      title: 'Settings',
      description: 'Preferences',
      iconName: 'Settings',
      route: '/settings',
      navOrder: 10,
      routes: []
    }

    const moduleB: AppModuleManifest = {
      id: 'tasks',
      title: 'Tasks',
      description: 'Task management',
      iconName: 'CheckSquare',
      route: '/tasks',
      navOrder: 2,
      routes: []
    }

    const moduleC: AppModuleManifest = {
      id: 'habits',
      title: 'Habits',
      description: 'Habit tracking',
      iconName: 'Activity',
      route: '/habits',
      navOrder: 1,
      routes: []
    }

    moduleRegistry.register(moduleA)
    moduleRegistry.register(moduleB)
    moduleRegistry.register(moduleC)

    const all = moduleRegistry.getAll()
    expect(all).toHaveLength(3)
    expect(all[0].id).toBe('habits')
    expect(all[1].id).toBe('tasks')
    expect(all[2].id).toBe('settings')
  })

  it('finds module by route', () => {
    const manifest: AppModuleManifest = {
      id: 'notes',
      title: 'Notes',
      description: 'Notepad',
      iconName: 'FileText',
      route: '/notes',
      navOrder: 3,
      routes: []
    }

    moduleRegistry.register(manifest)
    expect(moduleRegistry.getByRoute('/notes')).toEqual(manifest)
    expect(moduleRegistry.getByRoute('/notes/detail/123')).toEqual(manifest)
    expect(moduleRegistry.getByRoute('/notes?noteId=123')).toEqual(manifest)
    expect(moduleRegistry.getByRoute('#/notes?noteId=123')).toEqual(manifest)
    expect(moduleRegistry.getByRoute('/unknown')).toBeUndefined()

    const dashboardManifest: AppModuleManifest = {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Home',
      iconName: 'LayoutGrid',
      route: '/',
      navOrder: 0,
      routes: []
    }
    moduleRegistry.register(dashboardManifest)
    expect(moduleRegistry.getByRoute('/')).toEqual(dashboardManifest)
    expect(moduleRegistry.getByRoute('')).toEqual(dashboardManifest)
    expect(moduleRegistry.getByRoute('/?tab=overview')).toEqual(dashboardManifest)
  })

  it('unregisters a module correctly', () => {
    const manifest: AppModuleManifest = {
      id: 'test',
      title: 'Test',
      description: 'Test module',
      iconName: 'Activity',
      route: '/test',
      navOrder: 1,
      routes: []
    }

    moduleRegistry.register(manifest)
    expect(moduleRegistry.get('test')).toBeDefined()
    moduleRegistry.unregister('test')
    expect(moduleRegistry.get('test')).toBeUndefined()
  })
})
