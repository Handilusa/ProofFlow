import { jest } from '@jest/globals';

jest.unstable_mockModule("../services/mirrorNode.js", () => ({
    fetchProofFromMirrorNode: jest.fn(),
    fetchLeaderboard: jest.fn(),
    fetchStats: jest.fn().mockResolvedValue({
        totalProofs: 150,
        totalAgents: 42,
        totalTokensMinted: 150,
        lastActivity: 1700000000000
    })
}));

jest.unstable_mockModule("../services/hedera/proofflow.js", () => ({
    submitProof: jest.fn().mockResolvedValue({
        resultHash: "0xmockedhash123",
        hcsReceiptStatus: "SUCCESS",
        contractTxHash: "0xmockedtxhash456"
    })
}));

// We must dynamically import the modules AFTER mocking
const { default: app } = await import("../api/server.js");
const { default: request } = await import("supertest");

describe("ProofFlow API Integration Tests", () => {
    describe("GET /api/v1/health", () => {
        it("should return 200 and accurate health status", async () => {
            const response = await request(app).get("/api/v1/health");

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("status", "ok");
            expect(response.body).toHaveProperty("network", "testnet");
            expect(response.body).toHaveProperty("uptime");
            expect(typeof response.body.uptime).toBe("number");
        });
    });

    describe("POST /api/v1/proofs", () => {
        it("should return 400 for missing body fields", async () => {
            const response = await request(app)
                .post("/api/v1/proofs")
                .send({ agentId: "agent-001" });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("errors");
            expect(response.body.errors.length).toBeGreaterThan(0);
        });

        it("should return 201 with correctly mocked proof submission", async () => {
            const payload = {
                agentId: "agent-alpha-001",
                taskId: "task-jest-test",
                resultData: '{"prediction":"cat", "confidence":0.99}'
            };

            const response = await request(app)
                .post("/api/v1/proofs")
                .send(payload);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("proofId", "0xmockedhash123");
        });
    });

    describe("GET /api/v1/stats", () => {
        it("should return 200 with the correct statistics structure", async () => {
            const response = await request(app).get("/api/v1/stats");

            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual({
                totalProofs: 150,
                totalAgents: 42,
                totalTokensMinted: 150,
                lastActivity: 1700000000000
            });
        });
    });
});
