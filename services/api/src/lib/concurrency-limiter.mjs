// Per-key in-flight counter. aquire() returns false when the key is at capacity.
// Every successful acquire() must be paired with exactly one release(). The
// route does this in a 'finally' so the slot frees on success, error, OR
// disconnect. In-memory per process; same shared-store note as the rate limiter.
export function createConcurrencyLimiter({ max }) {
    const counts = new Map() // key -> active in-flight count

    return {
        acquire(key) {
            const current = counts.get(key) ?? 0
            if (current >= max) return false
            counts.set(key, current + 1)
            return true
        },
        release(key) {
            const current = counts.get(key) ?? 0
            if (current <= 1) {
                counts.delete(key) // clean up so the map doesn't grow unbounded
                return
            }
            counts.set(key, current - 1)
        }
    }
}