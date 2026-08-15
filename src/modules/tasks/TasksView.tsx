import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckSquare, Plus, Clock, AlertCircle, CheckCircle } from 'lucide-react'

export function TasksView() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks & Projects</h2>
          <p className="text-sm text-muted-foreground">
            Manage your daily tasks, subtasks, and prioritized projects.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">To Do</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Tasks waiting to start</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Finished tasks</p>
          </CardContent>
        </Card>
      </div>

      <Card className="p-8 text-center">
        <CardHeader>
          <CardTitle>No tasks available</CardTitle>
          <CardDescription>
            Create tasks with due dates, priorities, and subtasks to stay organized.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Create Task</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
