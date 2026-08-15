import type { ComponentType } from 'react'

export interface ModuleRoute {
  path: string
  component: ComponentType
  exact?: boolean
}

export interface AppModuleManifest {
  id: string
  title: string
  description: string
  iconName: string
  route: string
  navOrder: number
  primaryColor?: string
  dashboardWidget?: ComponentType
  routes: ModuleRoute[]
}
