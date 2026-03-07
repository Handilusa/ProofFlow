/**
 * Dynamic CAPTCHA Challenge Middleware — Layer 3 API Protection
 * 
 * Monitors per-IP behavior for bot-like patterns and forces suspicious
 * clients to solve a server-side CAPTCHA before proceeding.
 * 
 * Suspicion triggers:
 *   - Requests arrive with < 50ms jitter (machine-gun pattern)
 *   - More than 60 requests in 1 minute (high but below hard limit)
 *   - Missing or bot-like User-Agent header
 * 
 * NOTE: This middleware is purely additive and does NOT interfere with
 * any existing route logic, Gemini API calls, or EVM/Hedera operations.
 */

import { randomUUID } from "crypto";

const DEFAULT_CONFIG = {
    windowMs: 60_000,              // Monitoring window
    suspicionThreshold: 60,        // Requests in window to trigger suspicion
    minJitterMs: 50,               // Below this = bot-like timing
    jitterSampleSize: 5,           // Consecutive requests to analyze for jitter
    bypassDurationMs: 15 * 60_000, // 15 min bypass after solving CAPTCHA
    challengeExpiryMs: 5 * 60_000, // CAPTCHA token valid for 5 min
    cleanupIntervalMs: 60_000,     // Cleanup stale entries every 60s
    botUserAgents: [
        "", "curl", "wget", "python-requests", "python-urllib",
        "go-http-client", "java", "httpie", "postman", "insomnia",
    ],
};

export function createCaptchaChallenge(userConfig = {}) {
    const config = { ...DEFAULT_CONFIG, ...userConfig };

    // --- State ---
    const ipTracking = new Map();    // ip → { timestamps[], count, windowStart }
    const activeChallenges = new Map(); // captchaToken → { ip, question, answer, expiresAt }
    const bypassList = new Map();    // ip → expiresAt

    // Cleanup timer
    const cleanupTimer = setInterval(() => {
        const now = Date.now();
        // Clean expired bypasses
        for (const [ip, expiresAt] of bypassList) {
            if (now > expiresAt) bypassList.delete(ip);
        }
        // Clean expired challenges
        for (const [token, data] of activeChallenges) {
            if (now > data.expiresAt) activeChallenges.delete(token);
        }
        // Clean stale tracking
        for (const [ip, data] of ipTracking) {
            if (now - data.windowStart > config.windowMs * 2) ipTracking.delete(ip);
        }
    }, config.cleanupIntervalMs);

    if (cleanupTimer.unref) cleanupTimer.unref();

    // ── Generate a math CAPTCHA ──
    function generateCaptcha() {
        const a = Math.floor(Math.random() * 20) + 1;
        const b = Math.floor(Math.random() * 20) + 1;
        const ops = [
            { symbol: "+", fn: (x, y) => x + y },
            { symbol: "×", fn: (x, y) => x * y },
        ];
        const op = ops[Math.floor(Math.random() * ops.length)];
        return {
            question: `What is ${a} ${op.symbol} ${b}?`,
            answer: op.fn(a, b),
        };
    }

    // ── Check if User-Agent looks like a bot ──
    function isBotUserAgent(ua) {
        if (!ua || ua.trim() === "") return true;
        const lowerUA = ua.toLowerCase();
        return config.botUserAgents.some(bot => bot && lowerUA.includes(bot));
    }

    // ── Check for machine-gun timing pattern ──
    function hasMachineGunPattern(timestamps) {
        if (timestamps.length < config.jitterSampleSize) return false;
        const recent = timestamps.slice(-config.jitterSampleSize);
        let lowJitterCount = 0;
        for (let i = 1; i < recent.length; i++) {
            const gap = recent[i] - recent[i - 1];
            if (gap < config.minJitterMs) lowJitterCount++;
        }
        // If most gaps are suspiciously regular
        return lowJitterCount >= Math.floor((config.jitterSampleSize - 1) * 0.7);
    }

    // ── Main middleware ──
    function middleware(req, res, next) {
        const ip = req.ip || req.connection?.remoteAddress || "unknown";
        const now = Date.now();

        // Skip CAPTCHA verification endpoint itself
        if (req.path === "/api/v1/captcha/verify" && req.method === "POST") {
            return next();
        }

        // ── Check if IP has an active bypass ──
        const bypassExpiry = bypassList.get(ip);
        if (bypassExpiry && now < bypassExpiry) {
            return next(); // Verified human, let through
        }
        if (bypassExpiry && now >= bypassExpiry) {
            bypassList.delete(ip); // Expired bypass
        }

        // ── Check if client is sending a solved CAPTCHA inline ──
        const captchaToken = req.headers["x-captcha-token"];
        const captchaSolution = req.headers["x-captcha-solution"];
        if (captchaToken && captchaSolution) {
            const challenge = activeChallenges.get(captchaToken);
            if (challenge && challenge.ip === ip && now < challenge.expiresAt) {
                if (parseInt(captchaSolution, 10) === challenge.answer) {
                    // ✅ Correct → grant bypass
                    bypassList.set(ip, now + config.bypassDurationMs);
                    activeChallenges.delete(captchaToken);
                    console.log(`[CAPTCHA] ✅ IP ${ip} solved challenge, bypass granted for ${config.bypassDurationMs / 60_000} min`);
                    return next();
                }
            }
        }

        // ── Track request timing ──
        let tracking = ipTracking.get(ip);
        if (!tracking || now - tracking.windowStart > config.windowMs) {
            tracking = { timestamps: [], count: 0, windowStart: now };
            ipTracking.set(ip, tracking);
        }
        tracking.timestamps.push(now);
        tracking.count++;

        // Keep only recent timestamps (avoid memory bloat)
        if (tracking.timestamps.length > 100) {
            tracking.timestamps = tracking.timestamps.slice(-50);
        }

        // ── Evaluate suspicion ──
        let suspicious = false;
        let reason = "";

        // Check 1: Bot-like User-Agent
        const userAgent = req.headers["user-agent"] || "";
        if (isBotUserAgent(userAgent)) {
            // Only flag if also making many requests (don't block legitimate curl for health checks)
            if (tracking.count > 10) {
                suspicious = true;
                reason = "BOT_USER_AGENT";
            }
        }

        // Check 2: Too many requests (below hard limit but suspicious)
        if (tracking.count >= config.suspicionThreshold) {
            suspicious = true;
            reason = "HIGH_REQUEST_RATE";
        }

        // Check 3: Machine-gun timing
        if (hasMachineGunPattern(tracking.timestamps)) {
            suspicious = true;
            reason = "MACHINE_GUN_PATTERN";
        }

        if (!suspicious) {
            return next(); // Clean traffic, let through
        }

        // ── Issue CAPTCHA challenge ──
        const { question, answer } = generateCaptcha();
        const token = randomUUID();
        activeChallenges.set(token, {
            ip,
            question,
            answer,
            expiresAt: now + config.challengeExpiryMs,
        });

        console.warn(`[CAPTCHA] 🤖 Suspicious traffic from ${ip} (${reason}) — CAPTCHA challenge issued`);

        return res.status(403).json({
            success: false,
            error: "Suspicious traffic detected. Please solve the CAPTCHA to continue.",
            captchaRequired: true,
            captchaToken: token,
            captchaQuestion: question,
            reason,
        });
    }

    // ── CAPTCHA verification endpoint handler ──
    function verifyHandler(req, res) {
        const { captchaToken, captchaSolution } = req.body;

        if (!captchaToken || captchaSolution === undefined || captchaSolution === null) {
            return res.status(400).json({
                success: false,
                error: "captchaToken and captchaSolution are required.",
            });
        }

        const ip = req.ip || req.connection?.remoteAddress || "unknown";
        const challenge = activeChallenges.get(captchaToken);

        if (!challenge) {
            return res.status(400).json({
                success: false,
                error: "Invalid or expired CAPTCHA token.",
            });
        }

        if (challenge.ip !== ip) {
            return res.status(403).json({
                success: false,
                error: "CAPTCHA token does not match your IP.",
            });
        }

        const now = Date.now();
        if (now > challenge.expiresAt) {
            activeChallenges.delete(captchaToken);
            return res.status(400).json({
                success: false,
                error: "CAPTCHA has expired. Please request a new one.",
            });
        }

        if (parseInt(captchaSolution, 10) === challenge.answer) {
            bypassList.set(ip, now + config.bypassDurationMs);
            activeChallenges.delete(captchaToken);
            console.log(`[CAPTCHA] ✅ IP ${ip} verified via endpoint, bypass granted for ${config.bypassDurationMs / 60_000} min`);
            return res.status(200).json({
                success: true,
                message: "CAPTCHA verified. You are now bypassed for 15 minutes.",
                bypassExpiresAt: new Date(now + config.bypassDurationMs).toISOString(),
            });
        }

        return res.status(403).json({
            success: false,
            error: "Incorrect CAPTCHA solution.",
        });
    }

    // Expose internals for testing
    middleware._getState = () => ({
        trackedIPs: ipTracking.size,
        activeChallenges: activeChallenges.size,
        activeBypass: bypassList.size,
    });

    middleware._reset = () => {
        ipTracking.clear();
        activeChallenges.clear();
        bypassList.clear();
    };

    middleware._cleanup = () => {
        clearInterval(cleanupTimer);
    };

    middleware._grantBypass = (ip, durationMs) => {
        bypassList.set(ip, Date.now() + (durationMs || config.bypassDurationMs));
    };

    return { middleware, verifyHandler };
}
