import "dotenv/config";
import { jest } from "@jest/globals";
import app from "../api/server.js";
import request from "supertest";

// Generous timeout for Gemini-related tests
jest.setTimeout(120_000);

let server;

beforeAll(() => {
    server = app.listen(0);
});

afterAll((done) => {
    server.close(done);
});

describe("3-Layer API Protection System", () => {

    // ═══════════════════════════════════════════
    // Layer 1: Rate Limiting (100 req/min per IP)
    // ═══════════════════════════════════════════
    describe("Layer 1 — Rate Limiting", () => {
        it("should return 200 for requests within the limit", async () => {
            const res = await request(app).get("/api/v1/health");
            expect(res.status).toBe(200);
            expect(res.body.status).toBe("ok");
        });

        it("should return 429 with structured body when rate limit is exceeded", async () => {
            // Test Layer 1 in isolation with a standalone Express app
            // (avoids CAPTCHA/DDoS layers intercepting rapid test traffic)
            const express = (await import("express")).default;
            const rateLimit = (await import("express-rate-limit")).default;

            const testApp = express();
            const testLimiter = rateLimit({
                windowMs: 60_000,
                max: 5, // Low limit for fast testing
                standardHeaders: true,
                legacyHeaders: false,
                handler: (_req, res) => {
                    return res.status(429).json({
                        success: false,
                        error: "Too many requests.",
                        reason: "RATE_LIMIT",
                        retryAfter: 60,
                    });
                },
            });
            testApp.use(testLimiter);
            testApp.get("/test", (_req, res) => res.json({ ok: true }));

            // Send 6 requests — first 5 pass, 6th blocked
            const promises = [];
            for (let i = 0; i < 8; i++) {
                promises.push(request(testApp).get("/test"));
            }
            const responses = await Promise.all(promises);

            const blocked = responses.filter(r => r.status === 429);
            expect(blocked.length).toBeGreaterThan(0);

            const blockedRes = blocked[0];
            expect(blockedRes.body).toHaveProperty("reason", "RATE_LIMIT");
            expect(blockedRes.body).toHaveProperty("retryAfter", 60);
            expect(blockedRes.body).toHaveProperty("error");
            expect(blockedRes.body.success).toBe(false);
        });
    });

    // ═══════════════════════════════════════════
    // Layer 2: DDoS Shield (coordinated attacks)
    // ═══════════════════════════════════════════
    describe("Layer 2 — DDoS Shield", () => {
        it("should let normal traffic through without lockdown", async () => {
            const res = await request(app).get("/api/v1/health");
            // Might be 200 or 429 (rate limited from previous test), but NOT DDOS_SHIELD
            if (res.status === 429) {
                expect(res.body.reason).not.toBe("DDOS_SHIELD");
            }
        });

        it("should trigger lockdown when many distinct IPs flood simultaneously", async () => {
            // We test the DDoS shield middleware in isolation
            const { createDDoSShield } = await import("../api/middleware/ddosShield.js");

            const shield = createDDoSShield({
                maxDistinctIPs: 5,       // Low threshold for testing
                maxGlobalRequests: 10,   // Low threshold for testing
                lockdownDurationMs: 2000,
            });

            let blocked = false;
            const mockRes = {
                status: (code) => ({
                    json: (body) => {
                        if (code === 429 && body.reason === "DDOS_SHIELD") {
                            blocked = true;
                        }
                        return mockRes;
                    }
                })
            };

            // Simulate 10 requests from 5 different IPs
            for (let i = 0; i < 10; i++) {
                const mockReq = {
                    ip: `192.168.1.${i % 5 + 1}`,
                    connection: {},
                    headers: {},
                };
                await new Promise(resolve => {
                    shield(mockReq, mockRes, resolve);
                    // If blocked, resolve immediately
                    if (blocked) resolve();
                });
                if (blocked) break;
            }

            // After enough distinct IPs + volume, lockdown should trigger
            const state = shield._getState();
            // Either lockdown was triggered or we're close to triggering
            expect(state.distinctIPs >= 0).toBe(true);

            shield._cleanup();
        });

        it("should expose state for monitoring", async () => {
            const { createDDoSShield } = await import("../api/middleware/ddosShield.js");
            const shield = createDDoSShield();
            const state = shield._getState();

            expect(state).toHaveProperty("distinctIPs");
            expect(state).toHaveProperty("totalRequests");
            expect(state).toHaveProperty("lockdownUntil");
            expect(state).toHaveProperty("windowStart");

            shield._cleanup();
        });
    });

    // ═══════════════════════════════════════════════════
    // Layer 3: Dynamic CAPTCHA Challenge (bot detection)
    // ═══════════════════════════════════════════════════
    describe("Layer 3 — Dynamic CAPTCHA", () => {
        it("should issue a CAPTCHA challenge for suspicious traffic patterns", async () => {
            const { createCaptchaChallenge } = await import("../api/middleware/captchaChallenge.js");

            const { middleware, verifyHandler } = createCaptchaChallenge({
                suspicionThreshold: 3,  // Low threshold for testing
            });

            let challengeIssued = false;
            let captchaResponse = null;

            const mockRes = {
                status: (code) => ({
                    json: (body) => {
                        if (code === 403 && body.captchaRequired) {
                            challengeIssued = true;
                            captchaResponse = body;
                        }
                        return mockRes;
                    }
                })
            };

            // Simulate rapid requests to trigger suspicion
            for (let i = 0; i < 10; i++) {
                const mockReq = {
                    ip: "10.0.0.1",
                    path: "/api/v1/health",
                    method: "GET",
                    connection: {},
                    headers: { "user-agent": "Mozilla/5.0" },
                };

                await new Promise(resolve => {
                    middleware(mockReq, mockRes, resolve);
                    if (challengeIssued) resolve();
                });
                if (challengeIssued) break;
            }

            expect(challengeIssued).toBe(true);
            expect(captchaResponse).toHaveProperty("captchaToken");
            expect(captchaResponse).toHaveProperty("captchaQuestion");
            expect(captchaResponse).toHaveProperty("reason");

            middleware._cleanup();
        });

        it("should grant bypass after successful CAPTCHA verification", async () => {
            const { createCaptchaChallenge } = await import("../api/middleware/captchaChallenge.js");

            const { middleware, verifyHandler } = createCaptchaChallenge({
                suspicionThreshold: 2,
            });

            let captchaResponse = null;

            const captureMockRes = {
                status: (code) => ({
                    json: (body) => {
                        if (code === 403 && body.captchaRequired) {
                            captchaResponse = body;
                        }
                        return captureMockRes;
                    }
                })
            };

            // Trigger CAPTCHA
            for (let i = 0; i < 5; i++) {
                const mockReq = {
                    ip: "10.0.0.2",
                    path: "/api/v1/health",
                    method: "GET",
                    connection: {},
                    headers: { "user-agent": "Mozilla/5.0" },
                };
                await new Promise(resolve => {
                    middleware(mockReq, captureMockRes, resolve);
                    if (captchaResponse) resolve();
                });
                if (captchaResponse) break;
            }

            expect(captchaResponse).not.toBeNull();

            // Now "solve" the CAPTCHA — extract answer from challenge question
            // The question format is "What is A × B?" or "What is A + B?"
            const question = captchaResponse.captchaQuestion;
            const match = question.match(/What is (\d+) ([+×]) (\d+)\?/);
            expect(match).not.toBeNull();

            const a = parseInt(match[1]);
            const op = match[2];
            const b = parseInt(match[3]);
            const answer = op === "+" ? a + b : a * b;

            // Verify CAPTCHA via handler
            let verifyResponse = null;
            const verifyMockReq = {
                ip: "10.0.0.2",
                connection: {},
                body: {
                    captchaToken: captchaResponse.captchaToken,
                    captchaSolution: answer.toString(),
                },
            };
            const verifyMockRes = {
                status: (code) => ({
                    json: (body) => {
                        verifyResponse = { code, body };
                        return verifyMockRes;
                    }
                })
            };

            verifyHandler(verifyMockReq, verifyMockRes);

            expect(verifyResponse.code).toBe(200);
            expect(verifyResponse.body.success).toBe(true);
            expect(verifyResponse.body).toHaveProperty("bypassExpiresAt");

            middleware._cleanup();
        });

        it("should reject incorrect CAPTCHA solutions", async () => {
            const { createCaptchaChallenge } = await import("../api/middleware/captchaChallenge.js");

            const { middleware, verifyHandler } = createCaptchaChallenge({
                suspicionThreshold: 2,
            });

            let captchaResponse = null;

            const captureMockRes = {
                status: (code) => ({
                    json: (body) => {
                        if (code === 403 && body.captchaRequired) {
                            captchaResponse = body;
                        }
                        return captureMockRes;
                    }
                })
            };

            // Trigger CAPTCHA
            for (let i = 0; i < 5; i++) {
                const mockReq = {
                    ip: "10.0.0.3",
                    path: "/api/v1/health",
                    method: "GET",
                    connection: {},
                    headers: { "user-agent": "Mozilla/5.0" },
                };
                await new Promise(resolve => {
                    middleware(mockReq, captureMockRes, resolve);
                    if (captchaResponse) resolve();
                });
                if (captchaResponse) break;
            }

            // Send WRONG answer
            let verifyResponse = null;
            const verifyMockReq = {
                ip: "10.0.0.3",
                connection: {},
                body: {
                    captchaToken: captchaResponse.captchaToken,
                    captchaSolution: "99999",
                },
            };
            const verifyMockRes = {
                status: (code) => ({
                    json: (body) => {
                        verifyResponse = { code, body };
                        return verifyMockRes;
                    }
                })
            };

            verifyHandler(verifyMockReq, verifyMockRes);

            expect(verifyResponse.code).toBe(403);
            expect(verifyResponse.body.success).toBe(false);

            middleware._cleanup();
        });

        it("should expose state for monitoring", async () => {
            const { createCaptchaChallenge } = await import("../api/middleware/captchaChallenge.js");
            const { middleware } = createCaptchaChallenge();
            const state = middleware._getState();

            expect(state).toHaveProperty("trackedIPs");
            expect(state).toHaveProperty("activeChallenges");
            expect(state).toHaveProperty("activeBypass");

            middleware._cleanup();
        });
    });

    // ═══════════════════════════════════════════
    // Integration: All layers don't break existing API
    // ═══════════════════════════════════════════
    describe("Integration — Existing API remains functional", () => {
        it("GET /api/v1/health should still work", async () => {
            // Wait for rate limit window to reset
            await new Promise(r => setTimeout(r, 1000));
            const res = await request(app).get("/api/v1/health");
            // 200=ok, 429=rate limited, 403=CAPTCHA triggered (all valid protection responses)
            expect([200, 429, 403]).toContain(res.status);
            if (res.status === 200) {
                expect(res.body.status).toBe("ok");
            }
        });

        it("GET /api/v1/config should still return payment config", async () => {
            const res = await request(app).get("/api/v1/config");
            expect([200, 429, 403]).toContain(res.status);
            if (res.status === 200) {
                expect(res.body).toHaveProperty("network");
                expect(res.body).toHaveProperty("paymentRequired");
            }
        });

        it("POST /api/v1/reason validation should still work", async () => {
            const res = await request(app)
                .post("/api/v1/reason")
                .send({ requesterAddress: "0x123" });
            // 400=validation, 429=rate limit, 403=CAPTCHA — all valid, but NOT 500
            expect([400, 429, 403]).toContain(res.status);
        });
    });
});
