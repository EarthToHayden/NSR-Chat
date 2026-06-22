// make sure that shi got the right content type for json body parsing

export function requireJsonContentType(req) {
    if (!['POST', 'PUT', 'PATCH'].includes(req.method ?? '')) return

    const contentType = req.headers['content-type'] ?? ''
    if (!contentType.toLowerCase().startsWith('application/json')) {
        const err = new Error('Content-Type must be application/json')
        err.statusCode = 415
        throw err
    }
}