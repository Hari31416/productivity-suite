import * as React from 'react'
import {
  Activity,
  CheckSquare,
  FileText,
  Settings,
  LayoutDashboard,
  Calendar,
  Layers,
  Folder,
  Tag,
  Clock,
  Circle,
  HelpCircle,
  type LucideProps
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  Activity,
  CheckSquare,
  FileText,
  Settings,
  LayoutDashboard,
  Calendar,
  Layers,
  Folder,
  Tag,
  Clock,
  Circle
}

export interface DynamicIconProps extends LucideProps {
  name: string
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const IconComponent = iconMap[name] || HelpCircle
  return <IconComponent {...props} />
}
