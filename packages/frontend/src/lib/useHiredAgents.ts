import { useState, useEffect } from 'react';

export interface HiredAgent {
    id: string;
    name: string;
    specialty: string;
    hiredAt: number;
}

export function useHiredAgents() {
    const [hiredAgents, setHiredAgents] = useState<HiredAgent[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('proofflow_hired_agents');
        if (stored) {
            try {
                setHiredAgents(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse hired agents", e);
            }
        }
    }, []);

    const hireAgent = (agent: { id: string; name: string; specialty: string }) => {
        setHiredAgents(prev => {
            if (prev.find(a => a.id === agent.id)) return prev; // Already hired
            const newAgents = [...prev, { ...agent, hiredAt: Date.now() }];
            localStorage.setItem('proofflow_hired_agents', JSON.stringify(newAgents));
            return newAgents;
        });
    };

    const isHired = (agentId: string) => {
        return hiredAgents.some(a => a.id === agentId);
    };

    return { hiredAgents, hireAgent, isHired };
}
