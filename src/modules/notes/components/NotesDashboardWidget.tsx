import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Pin, ArrowRight, Clock, Plus } from 'lucide-react'
import { useNotes } from '../hooks/useNotes'
import { cn } from '@/lib/utils'

export function NotesDashboardWidget() {
  const { data: notes = [], isLoading } = useNotes({ archived: false })

  const { pinnedNotes, recentNotes, totalCount } = useMemo(() => {
    const pinned = notes.filter((n) => n.pinned)
    const nonPinned = notes.filter((n) => !n.pinned)
    const recent = nonPinned.slice(0, 4)

    return {
      pinnedNotes: pinned.slice(0, 3),
      recentNotes: recent,
      totalCount: notes.length
    }
  }, [notes])

  const navigateToNotes = () => {
    window.location.hash = '#/notes'
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Quick Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
            Loading notes...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex h-full flex-col justify-between">
      <div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Notepad & Ideas</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs font-normal">
            {totalCount} {totalCount === 1 ? 'note' : 'notes'}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-3 pt-2">
          {notes.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-xs text-muted-foreground">No notes created yet.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-1.5 text-xs"
                onClick={navigateToNotes}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create First Note</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Pinned Notes */}
              {pinnedNotes.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    <Pin className="h-3 w-3 fill-primary text-primary" />
                    <span>Pinned Notes</span>
                  </div>
                  {pinnedNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={navigateToNotes}
                      className="flex cursor-pointer items-center justify-between rounded-md border border-primary/20 bg-primary/5 p-2 text-xs transition-colors hover:bg-primary/10"
                    >
                      <span className="truncate font-medium text-foreground">{note.title}</span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {note.wordCount} words
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent Notes */}
              {recentNotes.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Recent Updates</span>
                  </div>
                  {recentNotes.map((note) => {
                    const formattedDate = note.updatedAt
                      ? format(parseISO(note.updatedAt), 'MMM d')
                      : ''

                    return (
                      <div
                        key={note.id}
                        onClick={navigateToNotes}
                        className={cn(
                          'flex cursor-pointer flex-col gap-0.5 rounded-md border p-2 text-xs transition-colors hover:bg-muted/40'
                        )}
                        style={
                          note.color
                            ? { borderLeftColor: note.color, borderLeftWidth: '3px' }
                            : undefined
                        }
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-medium text-foreground">{note.title}</span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {formattedDate}
                          </span>
                        </div>
                        {note.content && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1 truncate">
                            {note.content.replace(/[#*`_\[\]]/g, '').trim()}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </div>

      <div className="p-4 pt-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between text-xs text-muted-foreground hover:text-foreground"
          onClick={navigateToNotes}
        >
          <span>Open Notepad</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  )
}
