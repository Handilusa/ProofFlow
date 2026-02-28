'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
    steps: string[];
    currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
    return (
        <div className="flex items-center justify-center gap-0 w-full">
            {steps.map((step, i) => (
                <div key={step} className="flex items-center">
                    <div className="flex flex-col items-center gap-2">
                        <div
                            className={cn(
                                'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-500',
                                i < currentStep
                                    ? 'bg-accent-primary border-accent-primary text-white'
                                    : i === currentStep
                                        ? 'border-accent-primary text-accent-primary bg-accent-primary/10'
                                        : 'border-border text-text-muted bg-surface'
                            )}
                        >
                            {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
                        </div>
                        <span
                            className={cn(
                                'text-[11px] font-medium whitespace-nowrap',
                                i <= currentStep ? 'text-text-primary' : 'text-text-muted'
                            )}
                        >
                            {step}
                        </span>
                    </div>
                    {i < steps.length - 1 && (
                        <div
                            className={cn(
                                'w-16 h-[2px] mx-2 mt-[-20px] transition-all duration-500',
                                i < currentStep ? 'bg-accent-primary' : 'bg-border'
                            )}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
