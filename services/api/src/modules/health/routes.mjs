import { sendJson } from '../../server/response.mjs'

export function createHealthRoutes(startedAt) {
    return [
        {
            method: 'GET',
            path: '/api/health',
            handler: (req, res) => {
                const uptimeSeconds = Math.floor((Date.now() - startedAt) / 1000)
                sendJson(res, 200, {
                    status: 'ok',
                    service: 'nsr-api',
                    uptimeSeconds,
                })
            },
        },
    ]
}