'use client';

import { cn } from '@/lib/utils';
import { FileText, Link2, Coins, CheckCircle2 } from 'lucide-react';

interface TimelineStep {
    label: string;
    detail: string;
    timestamp?: string;
    completed: boolean;
}

interface ProofTimelineProps {
    steps: TimelineStep[];
}

const icons = [FileText, Link2, Coins, CheckCircle2];

export default function ProofTimeline({ steps }: ProofTimelineProps) {
    return (
        <div className="space-y-0">
            {steps.map((step, i) => {
                const Icon = icons[i] || CheckCircle2;
                return (
                    <div key={step.label} className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div
                                className={cn(
                                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                                    step.completed
                                        ? 'bg-accent-primary/10 border-accent-primary text-accent-primary'
                                        : 'bg-surface border-border text-text-muted'
                                )}
                            >
                                <Icon className="w-4 h-4" />
                            </div>
                            {i < steps.length - 1 && (
                                <div className={cn('w-[2px] h-12', step.completed ? 'bg-accent-primary/30' : 'bg-border')} />
                            )}
                        </div>
                        <div className="pt-2 pb-6">
                            <p className={cn('text-sm font-medium', step.completed ? 'text-text-primary' : 'text-text-muted')}>
                                {step.label}
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">{step.detail}</p>
                            {step.timestamp && (
                                <p className="text-[10px] text-text-muted/60 mt-1">{step.timestamp}</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
