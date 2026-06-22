export async function readJsonBody(req, maxBytes = 1_000_000) {
    const chunks = []
    let total = 0

    for await (const chunk of req) {
        total += chunk.length
        if (total > maxBytes) {
            const err = new Error('Request body too large')
            err.statusCode = 413
            throw err
        }
        chunks.push(chunk)
    }

    const raw = Buffer.concat(chunks).toString('utf-8').trim()
    if (!raw) return {}

    try {
        return JSON.parse(raw)
    } catch {
        const err = new Error('Invalid JSON')
        err.statusCode = 400
        throw err
    }
}