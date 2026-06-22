// sendJson lives here

export function sendJson(res, statusCode, payload) {
    const body = JSON.stringify(payload)
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
    }) 
    res.end(body)
}