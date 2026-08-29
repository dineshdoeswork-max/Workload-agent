import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Activity, AlertTriangle, Users, Clock, Sparkles } from 'lucide-react'

export interface TeamSummaryData {
  totalCapacityHours: number
  totalAllocatedHours: number
  utilizationPercent: number
  bucketCounts: {
    Idle: number
    Underloaded: number
    Balanced: number
    Overloaded: number
    Critical: number
  }
  idlePool: { memberId: string; memberName: string; freeHours: number }[]
  riskCountsBySeverity: {
    Low: number
    Medium: number
    High: number
  }
  topRecommendedActions: string[]
}

interface KpiStripProps {
  summary: TeamSummaryData
}

export function KpiStrip({ summary }: KpiStripProps) {
  const totalFreeHours = summary.idlePool.reduce((sum, p) => sum + p.freeHours, 0)
  const totalRisks =
    summary.riskCountsBySeverity.Low +
    summary.riskCountsBySeverity.Medium +
    summary.riskCountsBySeverity.High

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/70 backdrop-blur border-border/80 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 w-full bg-primary" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Team Utilization
              </span>
              <Activity className="size-4 text-primary" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">
                {summary.utilizationPercent}%
              </span>
              <span className="text-xs text-muted-foreground">
                ({summary.totalAllocatedHours}h / {summary.totalCapacityHours}h)
              </span>
            </div>
            <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  summary.utilizationPercent > 100
                    ? 'bg-rose-500'
                    : summary.utilizationPercent > 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, summary.utilizationPercent)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur border-border/80 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 w-full bg-rose-500" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Critical Overload
              </span>
              <Users className="size-4 text-rose-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-rose-400">
                {summary.bucketCounts.Critical + summary.bucketCounts.Overloaded}
              </span>
              <span className="text-xs text-muted-foreground">members</span>
            </div>
            <div className="mt-3 flex gap-1.5 text-xs">
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-medium">
                {summary.bucketCounts.Critical} Critical
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">
                {summary.bucketCounts.Overloaded} Overloaded
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur border-border/80 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 w-full bg-emerald-500" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Idle &amp; Free Bandwidth
              </span>
              <Clock className="size-4 text-emerald-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-emerald-400">
                {totalFreeHours}h
              </span>
              <span className="text-xs text-muted-foreground">available</span>
            </div>
            <div className="mt-3 flex gap-1.5 text-xs">
              <span className="px-2 py-0.5 rounded bg-slate-500/10 text-slate-300 font-medium">
                {summary.bucketCounts.Idle} Idle
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">
                {summary.bucketCounts.Underloaded} Underloaded
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur border-border/80 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 w-full bg-amber-500" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active Risks
              </span>
              <AlertTriangle className="size-4 text-amber-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-amber-400">
                {totalRisks}
              </span>
              <span className="text-xs text-muted-foreground">flagged items</span>
            </div>
            <div className="mt-3 flex gap-1.5 text-xs">
              {summary.riskCountsBySeverity.High > 0 && (
                <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-medium">
                  {summary.riskCountsBySeverity.High} High
                </span>
              )}
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">
                {summary.riskCountsBySeverity.Medium} Medium
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">
                {summary.riskCountsBySeverity.Low} Low
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Recommended Actions Strip */}
      {summary.topRecommendedActions.length > 0 && (
        <Card className="border border-primary/20 bg-primary/5 backdrop-blur p-4 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
              <Sparkles className="size-4" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                Agent Top Recommendations This Sprint
              </h4>
              <ul className="space-y-1 text-sm text-foreground/90">
                {summary.topRecommendedActions.map((action, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary shrink-0" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
