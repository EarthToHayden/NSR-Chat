export const AuthSessionSchema = Object.freeze({
    authenticated: 'boolean',
    userId: 'string (optional)',
    email: 'string (optional)',
    displayName: 'string (optional)',
    provider: 'string (optional)',
    createdAt: 'iso-datetime (optional)',
})

export const AuthMagicLinkRequestSchema = Object.freeze({
    email: 'string',
})

export const AuthMagicLinkResponseSchema = Object.freeze({
    accepted: 'boolean',
    message: 'string',
})