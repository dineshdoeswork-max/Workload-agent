import React, { useEffect, useState } from 'react'
import { DottedSurface } from '@/components/ui/dotted-surface'
import { DropdownNavigation, NavItem } from '@/components/ui/dorpdown-navigation'
import { HeroSection } from '@/components/blocks/hero-section-2'
import { Features } from '@/components/blocks/features-10'
import { KpiStrip, TeamSummaryData } from '@/components/dashboard/KpiStrip'
import { TeamWorkloadGrid, PersonScore } from '@/components/dashboard/TeamWorkloadGrid'
import { RiskAlertsPanel, DeliveryRiskItem } from '@/components/dashboard/RiskAlertsPanel'
import { RedistributionPanel, SuggestionItem } from '@/components/dashboard/RedistributionPanel'
import { Activity, ShieldAlert, Cpu, Layers, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AnalysisResponse {
  timestamp: string
  currentDate: string
  workloadScores: PersonScore[]
  deliveryRisks: DeliveryRiskItem[]
  idleCapacity: any[]
  redistributionSuggestions: SuggestionItem[]
  teamSummary: TeamSummaryData
}

export default function App() {
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null)
  const [skillsMap, setSkillsMap] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'team' | 'risks' | 'rebalance' | 'features'>('dashboard')
  const [notification, setNotification] = useState<string | null>(null)

  const fetchAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      // Use the seed reference date 2026-08-29
      const res = await fetch('/api/analysis?date=2026-08-29')
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const data: AnalysisResponse = await res.json()
      setAnalysisData(data)

      // Also fetch team members to get full skill mappings
      const membersRes = await fetch('/api/team-members')
      if (membersRes.ok) {
        const members = await membersRes.json()
        const map: Record<string, string[]> = {}
        members.forEach((m: any) => {
          map[m.id] = m.skills || []
        })
        setSkillsMap(map)
      }
    } catch (err: any) {
      console.error('Failed to load analysis', err)
      setError(err.message || 'Failed to connect to Workload Agent API')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalysis()
  }, [])

  const handleApplyReassignment = async (taskId: string, newAssigneeId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId: newAssigneeId }),
      })
      if (!res.ok) throw new Error('Failed to reassign task')

      setNotification(`Task reassigned successfully! Recalculating team workload...`)
      setTimeout(() => setNotification(null), 4000)

      // Re-run analysis immediately
      await fetchAnalysis()
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Error applying reassignment')
    }
  }

  const navItems: NavItem[] = [
    {
      id: 1,
      label: 'Views',
      subMenus: [
        {
          title: 'Live Agent Workspaces',
          items: [
            {
              label: 'Overview Dashboard',
              description: 'KPI strip, workload distribution, and active alerts',
              icon: Activity,
              onClick: () => setActiveTab('dashboard'),
            },
            {
              label: 'Team Capacity',
              description: 'Per-member allocated vs weekly hours',
              icon: Layers,
              onClick: () => setActiveTab('team'),
            },
            {
              label: 'Delivery Risks',
              description: 'Prorated feasibility & staleness flags',
              icon: ShieldAlert,
              onClick: () => setActiveTab('risks'),
            },
            {
              label: 'Redistribution Plan',
              description: 'AI-generated task rebalancing suggestions',
              icon: Sparkles,
              onClick: () => setActiveTab('rebalance'),
            },
          ],
        },
      ],
    },
    {
      id: 2,
      label: 'Agent Spec & Features',
      onClick: () => setActiveTab('features'),
    },
  ]

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col">
      {/* 3D Wave Particle Dotted Surface Background */}
      <DottedSurface size={6} opacity={0.65} />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
              <Cpu className="size-5" />
            </div>
            <div>
              <span className="font-bold text-sm sm:text-base tracking-tight">
                Workload Agent
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                v1.0 Live
              </span>
            </div>
          </div>

          <DropdownNavigation navItems={navItems} />

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchAnalysis}
              disabled={loading}
              className="rounded-full text-xs gap-1.5 h-9"
            >
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-card border border-emerald-500/40 text-foreground px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-20">
        {/* Hero Section Banner */}
        <HeroSection
          onAnalyze={fetchAnalysis}
          isLoading={loading}
          onExploreClick={() => {
            const el = document.getElementById('dashboard-content')
            el?.scrollIntoView({ behavior: 'smooth' })
          }}
        />

        <div id="dashboard-content" className="mx-auto max-w-7xl px-4 sm:px-6 space-y-10">
          {/* Tab Selector Buttons */}
          <div className="flex items-center justify-center sm:justify-start gap-1 p-1 bg-card/60 backdrop-blur rounded-xl border border-border/80 w-fit mx-auto sm:mx-0 overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All-In-One Dashboard
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'team'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Team Workload ({analysisData?.workloadScores.length ?? 0})
            </button>
            <button
              onClick={() => setActiveTab('risks')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'risks'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Delivery Risks ({analysisData?.deliveryRisks.length ?? 0})
            </button>
            <button
              onClick={() => setActiveTab('rebalance')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'rebalance'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              AI Rebalancing ({analysisData?.redistributionSuggestions.length ?? 0})
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'features'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Architecture &amp; Spec
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
              Failed to connect to backend server: {error}. Make sure port 3001 is active.
            </div>
          )}

          {/* Dynamic Views */}
          {analysisData && (
            <>
              {activeTab === 'dashboard' && (
                <div className="space-y-10">
                  <KpiStrip summary={analysisData.teamSummary} />
                  <TeamWorkloadGrid
                    scores={analysisData.workloadScores}
                    skillsMap={skillsMap}
                  />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <RiskAlertsPanel risks={analysisData.deliveryRisks} />
                    <RedistributionPanel
                      suggestions={analysisData.redistributionSuggestions}
                      onApplyReassignment={handleApplyReassignment}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'team' && (
                <div className="space-y-8">
                  <KpiStrip summary={analysisData.teamSummary} />
                  <TeamWorkloadGrid
                    scores={analysisData.workloadScores}
                    skillsMap={skillsMap}
                  />
                </div>
              )}

              {activeTab === 'risks' && (
                <div className="space-y-8">
                  <RiskAlertsPanel risks={analysisData.deliveryRisks} />
                </div>
              )}

              {activeTab === 'rebalance' && (
                <div className="space-y-8">
                  <RedistributionPanel
                    suggestions={analysisData.redistributionSuggestions}
                    onApplyReassignment={handleApplyReassignment}
                  />
                </div>
              )}

              {activeTab === 'features' && (
                <div className="space-y-8">
                  <Features />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        <p>
          Team Workload Visibility &amp; Rebalancing Agent &bull; Powered by Antigravity AI Engine
        </p>
      </footer>
    </div>
  )
}
