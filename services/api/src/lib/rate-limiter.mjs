// Fixed-window per-key rate limiter. In-memory (per process) is correct for a
// single instance. A multi-instance deployment would back this with a shared 
// store (e.g. Redis), at which point check() becomes async. The public surface
// (check) is intentionally minimal so that swap touches only this module.
export function createRateLimiter({ max, windowMs, now = () => Date.now() }) {
    const windows = new Map() // key -> { count, windowStartMs }

    return {
        check(key) {
            const ts = now()
            const entry = windows.get(key)

            // New key, or the previous window has fully elapsed -> start fresh
            if (!entry || ts - entry.windowStart >= windowMs) {
                windows.set(key, { count: 1, windowStart: ts })
                return { allowed: true, retryAfterMs: 0 }
            }

            if (entry.count < max) {
                entry.count += 1
                return { allowed: true, retryAfterMs: 0 }
            }

            return { allowed: false, retryAfterMs: entry.windowStart + windowMs - ts}
        },
    }
}