import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveUserKey } from '../../src/lib/resolve-user-key.mjs'

test('resolveUserKey: prefers the authenticated user id', () => {
    const req = { user: { id: 'user_42' }, headers: { 'x-user-id': 'spoof' }, socket: { remoteAddress: '1.2.3.4' } }
    assert.equal(resolveUserKey(req, { trustProxyHeader: true }), 'user_42')
})

test('resolveUserKey: uses X-User-Id when proxy headers are trusted', () => {
    const req = { headers: { 'x-user-id': 'header_user' }, socket: { remoteAddress: '1.2.3.4' } }
    assert.equal(resolveUserKey(req, { trustProxyHeader: true }), 'header_user')
})

test('resolveUserKey: uses the first X-Forwarded-For IP when trusted and no X-User-Id', () => {
    const req = { headers: { 'x-forwarded-for': '9.9.9.9, 10.0.0.1' }, socket: { remoteAddress: '1.2.3.4' } }
    assert.equal(resolveUserKey(req, { trustProxyHeader: true }), '9.9.9.9')
})

test('resolveUserKey: ignores proxy headers when not trusted (anti-spoof)', () => {
    const req = { headers: { 'x-user-id': 'spoof', 'x-forwarded-for': '9.9.9.9' }, socket: { remoteAddress: '1.2.3.4' } }
    assert.equal(resolveUserKey(req, { trustProxyHeader: false }), '1.2.3.4')
})

test('resolveUserKey: falls back to "unknown" when nothing is available', () => {
    assert.equal(resolveUserKey({ headers: {} }), 'unknown')
})
