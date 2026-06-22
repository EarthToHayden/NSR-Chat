import { sendNotImplemented } from '../../server/not-implemented.mjs'

export function createAuthRoutes() {
    return [
        {
            method: 'GET',
            path: '/api/auth/session',
            handler: async (_req, res) => {
                sendNotImplemented(res, 'Authentication')
            },
        },
        {
            method: 'POST',
            path: '/api/auth/magic-link',
            handler: async (_req, res) => {
                sendNotImplemented(res, 'Magic Link Authentication')
            },
        },
    ]
}