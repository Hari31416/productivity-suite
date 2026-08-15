import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, Plus, Flame, CheckCircle2 } from 'lucide-react'

export function HabitsView() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Habit Tracker</h2>
          <p className="text-sm text-muted-foreground">
            Track daily, weekly, and interval habits with streak analytics.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          <span>New Habit</span>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Habits</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Configured habits in local database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">
              Completed check-ins today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 days</div>
            <p className="text-xs text-muted-foreground">
              Current best streak record
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="p-8 text-center">
        <CardHeader>
          <CardTitle>No habits created yet</CardTitle>
          <CardDescription>
            Get started by adding your first daily or weekly habit routine.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Create Habit</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
