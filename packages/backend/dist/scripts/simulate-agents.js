import fs from 'fs';
const API_URL = 'http://localhost:3000/api/v1/proofs';
const agents = ['agent-001', 'agent-002', 'agent-003', 'agent-004', 'agent-005'];
const tasks = ['data-validation', 'model-inference', 'price-fetch'];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function run() {
    const results = [];
    for (const agentId of agents) {
        for (const taskId of tasks) {
            const body = { agentId, taskId, resultData: `${agentId}-${taskId}-${Date.now()}` };
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            console.log(`✅ ${agentId} | ${taskId} | proofId: ${data.proofId}`);
            results.push({ agentId, taskId, ...data });
            await sleep(1000);
        }
    }
    fs.mkdirSync('logs', { recursive: true });
    fs.writeFileSync('logs/simulation.json', JSON.stringify(results, null, 2));
    console.log('\n🎯 Simulation complete. 15 proofs registered on Hedera Testnet.');
    console.log('📄 Results saved to logs/simulation.json');
}
run().catch(console.error);
