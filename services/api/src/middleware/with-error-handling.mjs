import { sendJson } from '../server/response.mjs'

// fricking try/catch for handlers

export function withErrorHandling(handler) {
    return async (req, res, params) => {
        try {
            await handler(req, res, params)
        } catch (error) {
            const statusCode = error.statusCode ?? 500
            sendJson(res, statusCode, {
                error: {
                    message: statusCode === 500 ? 'Internal Server Error' : error.message,
                },
            })
        }
    }
}