import { sendJson } from './response.mjs'

export function sendNotImplemented(res, featureName) {
    sendJson(res, 501, {
        error: {
            message: `${featureName} is not implemented yet`,
        },
    })
}