/**
 * DDoS Shield Middleware — Layer 2 API Protection
 * 
 * Detects coordinated attacks by analyzing traffic patterns across all IPs.
 * When too many distinct IPs hit the server simultaneously with high volume,
 * the middleware triggers a global lockdown blocking ALL traffic.
 * 
 * NOTE: This middleware is purely additive and does NOT interfere with
 * any existing route logic, Gemini API calls, or EVM/Hedera operations.
 */

const DEFAULT_CONFIG = {
    windowMs: 60_000,            // 1 minute analysis window
    maxDistinctIPs: 500,         // Threshold: distinct IPs in window
    maxGlobalRequests: 5000,     // Threshold: total requests in window
    lockdownDurationMs: 5 * 60_000, // 5 minute lockdown
    cleanupIntervalMs: 30_000,   // Clean stale entries every 30s
};

export function createDDoSShield(userConfig = {}) {
    const config = { ...DEFAULT_CONFIG, ...userConfig };

    // --- State ---
    const ipHits = new Map();     // ip → { count, firstSeen }
    let totalRequests = 0;
    let windowStart = Date.now();
    let lockdownUntil = 0;

    // Periodic cleanup of stale entries
    const cleanupTimer = setInterval(() => {
        const now = Date.now();
        const cutoff = now - config.windowMs;
        for (const [ip, data] of ipHits) {
            if (data.firstSeen < cutoff) {
                ipHits.delete(ip);
            }
        }
    }, config.cleanupIntervalMs);

    // Allow Node to exit even if timer is running
    if (cleanupTimer.unref) cleanupTimer.unref();

    function resetWindow() {
        ipHits.clear();
        totalRequests = 0;
        windowStart = Date.now();
    }

    function middleware(req, res, next) {
        const now = Date.now();

        // ── Active lockdown? Block everything ──
        if (now < lockdownUntil) {
            const retryAfter = Math.ceil((lockdownUntil - now) / 1000);
            console.warn(`[DDoS Shield] 🛡️  BLOCKED request from ${req.ip} — lockdown active (${retryAfter}s remaining)`);
            return res.status(429).json({
                success: false,
                error: "Service temporarily unavailable due to unusual traffic patterns.",
                reason: "DDOS_SHIELD",
                retryAfter,
            });
        }

        // ── Slide the window ──
        if (now - windowStart > config.windowMs) {
            resetWindow();
        }

        // ── Track this request ──
        const ip = req.ip || req.connection?.remoteAddress || "unknown";
        const entry = ipHits.get(ip);
        if (entry) {
            entry.count++;
        } else {
            ipHits.set(ip, { count: 1, firstSeen: now });
        }
        totalRequests++;

        // ── Evaluate: coordinated attack? ──
        const distinctIPs = ipHits.size;
        if (distinctIPs >= config.maxDistinctIPs && totalRequests >= config.maxGlobalRequests) {
            lockdownUntil = now + config.lockdownDurationMs;
            console.error(
                `[DDoS Shield] 🚨 LOCKDOWN TRIGGERED — ${distinctIPs} distinct IPs, ` +
                `${totalRequests} total requests in ${config.windowMs / 1000}s window. ` +
                `Blocking ALL traffic for ${config.lockdownDurationMs / 1000}s.`
            );
            resetWindow();
            const retryAfter = Math.ceil(config.lockdownDurationMs / 1000);
            return res.status(429).json({
                success: false,
                error: "Service temporarily unavailable due to unusual traffic patterns.",
                reason: "DDOS_SHIELD",
                retryAfter,
            });
        }

        next();
    }

    // Expose internals for testing
    middleware._getState = () => ({
        distinctIPs: ipHits.size,
        totalRequests,
        lockdownUntil,
        windowStart,
    });

    middleware._reset = () => {
        resetWindow();
        lockdownUntil = 0;
    };

    middleware._cleanup = () => {
        clearInterval(cleanupTimer);
    };

    return middleware;
}
