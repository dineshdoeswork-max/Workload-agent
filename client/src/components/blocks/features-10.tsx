import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Activity, LucideIcon, Scale, ShieldAlert, Cpu } from 'lucide-react'
import { ReactNode } from 'react'

export function Features() {
    return (
        <section className="py-12 md:py-20">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
                <div className="text-center mb-12">
                    <span className="text-xs uppercase tracking-widest text-primary font-semibold px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                        Autonomous Intelligence
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">
                        How the Workload Agent Powers Team Feasibility
                    </h2>
                    <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-sm sm:text-base">
                        Mathematical load balancing, proactive idle capacity discovery, and automated skill-aware task redistributions.
                    </p>
                </div>

                <div className="mx-auto grid gap-4 lg:grid-cols-2">
                    <FeatureCard>
                        <CardHeader className="pb-3">
                            <CardHeading
                                icon={Activity}
                                title="Dynamic Load Ratio Scoring"
                                description="Real-time capacity analysis derived only from active, non-completed tasks."
                            />
                        </CardHeader>
                        <div className="p-6 pt-0">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Completed tasks instantly free bandwidth without static delays. Priority weights ensure P0 engineering bottlenecks are addressed before low-impact tickets.
                            </p>
                        </div>
                    </FeatureCard>

                    <FeatureCard>
                        <CardHeader className="pb-3">
                            <CardHeading
                                icon={ShieldAlert}
                                title="Deadline-Feasibility Risk Alerts"
                                description="Prorated working hours detection before schedules silently slip."
                            />
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Identifies when remaining effort exceeds available business hours before a deadline, plus staleness flags for blocked tasks untouched for &gt;7 days.
                            </p>
                        </CardContent>
                    </FeatureCard>

                    <FeatureCard className="p-6 lg:col-span-2">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div>
                                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                                    <Scale className="size-4 text-primary" />
                                    Smart Skill-Aware Redistribution
                                </span>
                                <p className="mt-2 text-xl font-semibold max-w-xl">
                                    Proactive matching from the idle pool using skill tags and deadline bandwidth checks.
                                </p>
                            </div>
                            <div className="flex justify-center gap-4 overflow-hidden shrink-0">
                                <CircularUI
                                    label="Capacity"
                                    circles={[{ pattern: 'border' }, { pattern: 'border' }]}
                                />
                                <CircularUI
                                    label="Skills"
                                    circles={[{ pattern: 'none' }, { pattern: 'primary' }]}
                                />
                                <CircularUI
                                    label="Feasible"
                                    circles={[{ pattern: 'blue' }, { pattern: 'none' }]}
                                />
                            </div>
                        </div>
                    </FeatureCard>
                </div>
            </div>
        </section>
    )
}

interface FeatureCardProps {
    children: ReactNode
    className?: string
}

const FeatureCard = ({ children, className }: FeatureCardProps) => (
    <Card className={cn('group relative rounded-xl border border-border bg-card/60 backdrop-blur shadow-sm overflow-hidden', className)}>
        <CardDecorator />
        {children}
    </Card>
)

const CardDecorator = () => (
    <>
        <span className="border-primary absolute -left-px -top-px block size-2 border-l-2 border-t-2"></span>
        <span className="border-primary absolute -right-px -top-px block size-2 border-r-2 border-t-2"></span>
        <span className="border-primary absolute -bottom-px -left-px block size-2 border-b-2 border-l-2"></span>
        <span className="border-primary absolute -bottom-px -right-px block size-2 border-b-2 border-r-2"></span>
    </>
)

interface CardHeadingProps {
    icon: LucideIcon
    title: string
    description: string
}

const CardHeading = ({ icon: Icon, title, description }: CardHeadingProps) => (
    <div>
        <span className="text-muted-foreground flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
            <Icon className="size-4 text-primary" />
            {title}
        </span>
        <p className="mt-3 text-lg font-semibold text-foreground">{description}</p>
    </div>
)

interface CircleConfig {
    pattern: 'none' | 'border' | 'primary' | 'blue'
}

interface CircularUIProps {
    label: string
    circles: CircleConfig[]
    className?: string
}

const CircularUI = ({ label, circles, className }: CircularUIProps) => (
    <div className={className}>
        <div className="bg-gradient-to-b from-border size-fit rounded-2xl to-transparent p-px">
            <div className="bg-gradient-to-b from-background to-muted/25 relative flex aspect-square w-fit items-center -space-x-4 rounded-[15px] p-3">
                {circles.map((circle, i) => (
                    <div
                        key={i}
                        className={cn('size-6 rounded-full border sm:size-7', {
                            'border-primary': circle.pattern === 'none',
                            'border-primary bg-[repeating-linear-gradient(-45deg,hsl(var(--border)),hsl(var(--border))_1px,transparent_1px,transparent_4px)]': circle.pattern === 'border',
                            'border-primary bg-background bg-[repeating-linear-gradient(-45deg,hsl(var(--primary)),hsl(var(--primary))_1px,transparent_1px,transparent_4px)]': circle.pattern === 'primary',
                            'bg-background z-1 border-blue-500 bg-[repeating-linear-gradient(-45deg,rgb(59,130,246),rgb(59,130,246)_1px,transparent_1px,transparent_4px)]': circle.pattern === 'blue',
                        })}></div>
                ))}
            </div>
        </div>
        <span className="text-muted-foreground mt-1.5 block text-center text-xs">{label}</span>
    </div>
)
