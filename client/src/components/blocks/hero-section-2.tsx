import React from 'react'
import { Sparkles, ArrowDown, Activity, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'

interface HeroSectionProps {
    onAnalyze: () => void;
    isLoading?: boolean;
    onExploreClick?: () => void;
}

export function HeroSection({ onAnalyze, isLoading, onExploreClick }: HeroSectionProps) {
    return (
        <section className="relative overflow-hidden pt-8 pb-12">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
                <AnimatedGroup preset="fade">
                    <div className="flex flex-col items-center text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur mb-6 shadow-sm">
                            <Sparkles className="size-3.5 text-primary animate-pulse" />
                            <span>AI Workload Visibility &amp; Rebalancing Engine</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-3xl text-balance">
                            Eliminate Engineering Burnout &amp; Project Slip
                        </h1>

                        <p className="mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
                            Live capacity scoring, deadline feasibility alerts, and autonomous task redistribution suggestions for high-performing engineering teams.
                        </p>

                        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                            <InteractiveHoverButton
                                text={isLoading ? "Analyzing..." : "Re-analyze Live Workload"}
                                onClick={onAnalyze}
                                disabled={isLoading}
                                className="min-w-[200px]"
                            />

                            {onExploreClick && (
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={onExploreClick}
                                    className="rounded-full px-6 text-sm"
                                >
                                    <ArrowDown className="mr-2 h-4 w-4" />
                                    View Dashboard
                                </Button>
                            )}
                        </div>
                    </div>
                </AnimatedGroup>
            </div>
        </section>
    )
}
