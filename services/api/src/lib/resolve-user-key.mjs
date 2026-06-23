// Resolves a stable identity strting for per-user limiting. Order of preference:
// 1. Autenticated user ID (from auth middleware)
// 2. trusted X-User-Id header (if trustProxyHeader is true)
// 3. first IP in X-Forwarded-For (i.e. behind a known/trusted proxy)
// 4. the socket's remote address
// 5. 'unknown' (last resort)
// Proxy/identity headers are honored ONLY behind the explicit trust flag, so
// a client cannot spoof another user's identity just by sending these headers.
export function resolveUserKey(req, { trustProxyHeader = false } = {}) {
    const authUserId = req?.user?.id
    if (authUserId) return String(authUserId)

    const headers = req?.headers ?? {}
    if (trustProxyHeader) {
        const headerUserId = headers['x-user-id']
        if (headerUserId) return String(headerUserId)

        const forwardedFor = headers['x-forwarded-for']
        if (forwardedFor) {
            const first = String(forwardedFor).split(',')[0].trim()
            if (first) return first
        }
    }

    const remote = req?.socket?.remoteAddress
    if (remote) return String(remote)

    return 'unknown'
}