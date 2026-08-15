import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Plus, Pin, Tag } from 'lucide-react'

export function NotesView() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notepad</h2>
          <p className="text-sm text-muted-foreground">
            Rich markdown notes with tags, pinning, and instant search.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          <span>New Note</span>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Saved local documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pinned Notes</CardTitle>
            <Pin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Important quick notes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tags</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Categorized topics</p>
          </CardContent>
        </Card>
      </div>

      <Card className="p-8 text-center">
        <CardHeader>
          <CardTitle>No notes found</CardTitle>
          <CardDescription>
            Create markdown notes with real-time local persistence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Create Note</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
