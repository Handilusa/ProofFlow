import "dotenv/config";
import app from "../api/server.js";
import request from "supertest";

// Real services are used — GEMINI_API_KEY and Hedera credentials must be in .env or CI secrets.
// Gemini API calls can take 15-60s, so we set a generous timeout.
jest.setTimeout(120_000);

let server;

beforeAll(() => {
    server = app.listen(0); // bind to random port for testing
});

afterAll((done) => {
    server.close(done);
});

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

    describe("POST /api/v1/reason", () => {
        it("should return 400 for missing body fields", async () => {
            const response = await request(app)
                .post("/api/v1/reason")
                .send({ requesterAddress: "0x123" });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("errors");
            expect(response.body.errors.length).toBeGreaterThan(0);
        });

        it("should return 201 with correctly processed reasoning submission", async () => {
            const payload = {
                question: "What is the status of the network?",
                requesterAddress: "0x1234567890123456789012345678901234567890"
            };

            const response = await request(app)
                .post("/api/v1/reason")
                .send(payload);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("proofId");
            expect(response.body.proofId).toBeDefined();
            expect(response.body).toHaveProperty("question", payload.question);
            expect(response.body).toHaveProperty("status", "PUBLISHING_TO_HEDERA");

            // Give async Hedera operations time to complete
            await new Promise((resolve) => setTimeout(resolve, 5000));
        });
    });

    describe("GET /api/v1/stats", () => {
        it("should return 200 with the correct statistics structure", async () => {
            const response = await request(app).get("/api/v1/stats");

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("totalProofs");
            expect(response.body).toHaveProperty("totalAgents");
            expect(response.body).toHaveProperty("totalTokensMinted");
            expect(response.body).toHaveProperty("lastActivity");
        });
    });
});
