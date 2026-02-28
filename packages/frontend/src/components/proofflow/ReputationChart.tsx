'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui';

interface DataPoint {
    date: string;
    proofs: number;
}

interface ReputationChartProps {
    data: DataPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass px-4 py-2.5 !rounded-xl text-xs">
            <p className="text-text-muted">{label}</p>
            <p className="text-text-primary font-semibold mt-0.5">{payload[0].value} proofs</p>
        </div>
    );
}

export default function ReputationChart({ data }: ReputationChartProps) {
    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-6">Network Activity</h3>
            <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                        <defs>
                            <linearGradient id="proofGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 11 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 11 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="proofs"
                            stroke="#06B6D4"
                            strokeWidth={2}
                            fill="url(#proofGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
