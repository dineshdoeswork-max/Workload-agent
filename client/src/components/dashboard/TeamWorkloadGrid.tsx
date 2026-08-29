import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { User, CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronUp, Tag } from 'lucide-react'

export interface TaskItem {
  id: string
  title: string
  description?: string
  assigneeId: string
  projectId: string
  estimatedEffort: number
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  status: 'not_started' | 'in_progress' | 'blocked' | 'done'
  deadline: string
}

export interface PersonScore {
  memberId: string
  memberName: string
  role: string
  weeklyCapacityHours: number
  currentAllocatedHours: number
  loadRatio: number
  weightedLoadRatio: number
  bucket: 'Idle' | 'Underloaded' | 'Balanced' | 'Overloaded' | 'Critical'
  activeTasks: TaskItem[]
}

interface TeamWorkloadGridProps {
  scores: PersonScore[]
  skillsMap: Record<string, string[]>
}

export function TeamWorkloadGrid({ scores, skillsMap }: TeamWorkloadGridProps) {
  const [expandedMember, setExpandedMember] = useState<string | null>(null)

  const getBucketBadge = (bucket: PersonScore['bucket']) => {
    switch (bucket) {
      case 'Idle':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/30">Idle</span>
      case 'Underloaded':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">Underloaded</span>
      case 'Balanced':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Balanced</span>
      case 'Overloaded':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">Overloaded</span>
      case 'Critical':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">Critical</span>
    }
  }

  const getPriorityBadge = (priority: TaskItem['priority']) => {
    switch (priority) {
      case 'P0':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">P0</span>
      case 'P1':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">P1</span>
      case 'P2':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">P2</span>
      case 'P3':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">P3</span>
    }
  }

  const getStatusBadge = (status: TaskItem['status']) => {
    switch (status) {
      case 'done':
        return <span className="text-emerald-400 text-xs flex items-center gap-1"><CheckCircle2 className="size-3" /> done</span>
      case 'in_progress':
        return <span className="text-amber-400 text-xs flex items-center gap-1"><Clock className="size-3" /> in progress</span>
      case 'blocked':
        return <span className="text-rose-400 text-xs flex items-center gap-1"><AlertCircle className="size-3" /> blocked</span>
      case 'not_started':
        return <span className="text-slate-400 text-xs flex items-center gap-1"><Clock className="size-3" /> not started</span>
    }
  }

  const getMeterColor = (bucket: PersonScore['bucket']) => {
    switch (bucket) {
      case 'Idle':
        return 'bg-slate-500'
      case 'Underloaded':
        return 'bg-blue-500'
      case 'Balanced':
        return 'bg-emerald-500'
      case 'Overloaded':
        return 'bg-amber-500'
      case 'Critical':
        return 'bg-rose-500'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold tracking-tight">Team Workload Distribution</h3>
          <p className="text-xs text-muted-foreground">
            Current allocated hours derived strictly from active, non-completed tasks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scores.map((score) => {
          const isExpanded = expandedMember === score.memberId
          const skills = skillsMap[score.memberId] || []
          const percentage = Math.round(score.loadRatio * 100)

          return (
            <Card
              key={score.memberId}
              className={`bg-card/70 backdrop-blur transition-all duration-200 border-border/80 hover:border-primary/40 flex flex-col justify-between ${
                score.bucket === 'Critical' ? 'border-rose-500/30' : ''
              }`}
            >
              <div>
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm border border-border text-foreground">
                        {score.memberName.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm leading-tight text-foreground">
                          {score.memberName}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {score.role}
                        </p>
                      </div>
                    </div>
                    {getBucketBadge(score.bucket)}
                  </div>

                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded bg-muted/60 text-[11px] text-muted-foreground font-mono"
                        >
                          #{skill}
                        </span>
                      ))}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="p-5 pt-1 space-y-4">
                  {/* Load Progress Meter */}
                  <div className="space-y-1.5 bg-muted/30 p-3 rounded-lg border border-border/40">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-muted-foreground">Load Ratio</span>
                      <span className="text-foreground font-semibold">
                        {score.currentAllocatedHours}h / {score.weeklyCapacityHours}h ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getMeterColor(score.bucket)}`}
                        style={{ width: `${Math.min(100, Math.max(4, percentage))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
                      <span>Priority-weighted: {Math.round(score.weightedLoadRatio * 100)}%</span>
                      <span>
                        {score.weeklyCapacityHours - score.currentAllocatedHours > 0
                          ? `${score.weeklyCapacityHours - score.currentAllocatedHours}h free`
                          : `${score.currentAllocatedHours - score.weeklyCapacityHours}h overload`}
                      </span>
                    </div>
                  </div>

                  {/* Active Tasks list */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setExpandedMember(isExpanded ? null : score.memberId)}
                      className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                    >
                      <span className="font-semibold">
                        Active Tasks ({score.activeTasks.length})
                      </span>
                      {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="space-y-2 pt-1 border-t border-border/50 max-h-48 overflow-y-auto pr-1">
                        {score.activeTasks.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic py-1">
                            No active tasks — capacity fully available.
                          </p>
                        ) : (
                          score.activeTasks.map((t) => (
                            <div
                              key={t.id}
                              className="p-2.5 rounded bg-muted/40 border border-border/40 text-xs space-y-1.5"
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span className="font-medium text-foreground truncate max-w-[180px]">
                                  {t.title}
                                </span>
                                {getPriorityBadge(t.priority)}
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                <span>{t.estimatedEffort}h</span>
                                <span>Due {t.deadline}</span>
                                {getStatusBadge(t.status)}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
