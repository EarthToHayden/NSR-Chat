import { sendNotImplemented } from '../../server/not-implemented.mjs'

export function createLibraryRoutes() {
    return [
        {
            method: 'GET',
            path: '/api/library/search',
            handler: async (_req, res) => {
                sendNotImplemented(res, 'Library Search')
            },
        },
    ]
}