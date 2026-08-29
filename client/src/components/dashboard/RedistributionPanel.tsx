import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, Check, CheckCircle2, RotateCw } from 'lucide-react'

export interface SuggestionItem {
  taskId: string
  taskTitle: string
  effortHours: number
  fromMemberId: string
  fromMemberName: string
  toMemberId: string
  toMemberName: string
  rationale: string
  fromStatusBefore: string
  fromStatusAfter: string
  toStatusBefore: string
  toStatusAfter: string
}

interface RedistributionPanelProps {
  suggestions: SuggestionItem[]
  onApplyReassignment: (taskId: string, newAssigneeId: string) => Promise<void>
}

export function RedistributionPanel({
  suggestions,
  onApplyReassignment,
}: RedistributionPanelProps) {
  const [applyingTaskId, setApplyingTaskId] = useState<string | null>(null)
  const [appliedTasks, setAppliedTasks] = useState<Set<string>>(new Set())

  const handleApply = async (suggestion: SuggestionItem) => {
    setApplyingTaskId(suggestion.taskId)
    try {
      await onApplyReassignment(suggestion.taskId, suggestion.toMemberId)
      setAppliedTasks((prev) => new Set(prev).add(suggestion.taskId))
    } catch (err) {
      console.error("Failed to apply suggestion", err)
    } finally {
      setApplyingTaskId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold tracking-tight">AI Redistribution Suggestions</h3>
          <p className="text-xs text-muted-foreground">
            Feasibility-improving task reassignments based on skill overlap and idle bandwidth.
          </p>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <Card className="bg-card/50 border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No redistributions currently required — all active workloads are within target capacity.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {suggestions.map((suggestion) => {
            const isApplied = appliedTasks.has(suggestion.taskId)
            const isApplying = applyingTaskId === suggestion.taskId

            return (
              <Card
                key={suggestion.taskId}
                className={`bg-card/70 backdrop-blur border-border/80 hover:border-primary/40 transition-all ${
                  isApplied ? 'opacity-60 border-emerald-500/30' : ''
                }`}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {suggestion.taskTitle}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-primary/10 text-primary border border-primary/20">
                          {suggestion.effortHours}h
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {suggestion.rationale}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleApply(suggestion)}
                      disabled={isApplied || isApplying}
                      className="rounded-full px-4 shrink-0"
                      variant={isApplied ? "outline" : "default"}
                    >
                      {isApplying ? (
                        <>
                          <RotateCw className="mr-1.5 size-3.5 animate-spin" /> Applying...
                        </>
                      ) : isApplied ? (
                        <>
                          <Check className="mr-1.5 size-3.5 text-emerald-400" /> Reassigned
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-1.5 size-3.5" /> Apply Reassignment
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Transfer Pipeline Graphic */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50 text-xs">
                    <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                        Transfer From
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">
                          {suggestion.fromMemberName}
                        </span>
                        <span className="text-muted-foreground text-[11px]">
                          {suggestion.fromStatusBefore} &rarr; {suggestion.fromStatusAfter}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        Transfer To
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">
                          {suggestion.toMemberName}
                        </span>
                        <span className="text-muted-foreground text-[11px]">
                          {suggestion.toStatusBefore} &rarr; {suggestion.toStatusAfter}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
