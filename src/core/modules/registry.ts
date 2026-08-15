import type { AppModuleManifest } from './types'

class ModuleRegistry {
  private modules: Map<string, AppModuleManifest> = new Map()

  register(manifest: AppModuleManifest): void {
    this.modules.set(manifest.id, manifest)
  }

  unregister(id: string): void {
    this.modules.delete(id)
  }

  get(id: string): AppModuleManifest | undefined {
    return this.modules.get(id)
  }

  getByRoute(route: string): AppModuleManifest | undefined {
    const normalizedRoute = !route || route === '' ? '/' : route
    return Array.from(this.modules.values()).find(
      (manifest) =>
        manifest.route === normalizedRoute ||
        (manifest.route !== '/' && normalizedRoute.startsWith(`${manifest.route}/`))
    )
  }

  getAll(): AppModuleManifest[] {
    return Array.from(this.modules.values()).sort(
      (a, b) => a.navOrder - b.navOrder
    )
  }

  clear(): void {
    this.modules.clear()
  }
}

export const moduleRegistry = new ModuleRegistry()
