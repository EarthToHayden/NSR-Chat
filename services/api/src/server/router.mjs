import { sendJson } from '../server/response.mjs'

// handler matching

function matchPath(routePath, requestPath) {
    const routeParts = routePath.split('/').filter(Boolean)
    const requestParts = requestPath.split('/').filter(Boolean)

    if (routeParts.length !== requestParts.length) {
        return null
    }

    const params = {}

    for (let i = 0; i < routeParts.length; i += 1) {
        const routePart = routeParts[i]
        const requestPart = requestParts[i]

        if (routePart.startsWith(':')) {
            const key = routePart.slice(1)
            params[key] = decodeURIComponent(requestPart)
            continue
        }

        if (routePart !== requestPart) {
            return null
        }
    }

    return params
}

export function createRouter(routeDefs) {
    const routes = routeDefs.map((route) => ({
        method: route.method.toUpperCase(),
        path: route.path,
        handler: route.handler,
    }))
    
    return async (req, res) => {
        const url = new URL(req.url, 'http://localhost')
        const method = (req.method ?? '').toUpperCase()

        for (const route of routes) {
            if (route.method !== method) continue

            const params = matchPath(route.path, url.pathname)
            if (params == null) continue

            await route.handler(req, res, params)
            return
        }
        
        sendJson(res, 404, { error: { message: 'Route not found' } })
    }
}