import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { AlertCircle, Clock, GitBranch, Calendar } from 'lucide-react'

export interface DeliveryRiskItem {
  taskId: string
  taskTitle: string
  projectId: string
  memberId: string
  memberName: string
  riskType: 'deadline_feasibility' | 'dependency' | 'staleness'
  severity: 'Low' | 'Medium' | 'High'
  reason: string
  deadline: string
  remainingEffort?: number
  availableHours?: number
}

interface RiskAlertsPanelProps {
  risks: DeliveryRiskItem[]
}

export function RiskAlertsPanel({ risks }: RiskAlertsPanelProps) {
  const getSeverityBadge = (severity: DeliveryRiskItem['severity']) => {
    switch (severity) {
      case 'High':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">High Risk</span>
      case 'Medium':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">Medium Risk</span>
      case 'Low':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40">Low Risk</span>
    }
  }

  const getRiskIcon = (type: DeliveryRiskItem['riskType']) => {
    switch (type) {
      case 'deadline_feasibility':
        return <Clock className="size-4 text-amber-400" />
      case 'staleness':
        return <AlertCircle className="size-4 text-rose-400" />
      case 'dependency':
        return <GitBranch className="size-4 text-blue-400" />
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold tracking-tight">Flagged Delivery Risks</h3>
        <p className="text-xs text-muted-foreground">
          Autonomous feasibility detection based on prorated capacity, dependency chains, and staleness.
        </p>
      </div>

      {risks.length === 0 ? (
        <Card className="bg-card/50 border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No active delivery risks detected. All active sprints are mathematically feasible!
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {risks.map((risk, index) => (
            <Card
              key={`${risk.taskId}-${index}`}
              className="bg-card/70 backdrop-blur border-border/80 hover:border-amber-500/40 transition-colors"
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-muted flex items-center justify-center">
                      {getRiskIcon(risk.riskType)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">
                        {risk.taskTitle}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Assigned to: <span className="font-medium text-foreground">{risk.memberName}</span>
                      </p>
                    </div>
                  </div>
                  {getSeverityBadge(risk.severity)}
                </div>

                <div className="p-3 rounded-lg bg-muted/40 border border-border/40 text-xs text-foreground/90 leading-relaxed">
                  {risk.reason}
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="size-3" /> Due {risk.deadline}
                  </span>
                  <span className="uppercase text-[10px] tracking-wider font-semibold">
                    {risk.riskType.replace('_', ' ')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
