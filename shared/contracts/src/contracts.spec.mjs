import test from 'node:test';
import assert from 'node:assert/strict';

import {
    MESSAGE_ROLES,
    ConversationSchema,
    MessageSchema,
    STREAM_EVENT_TYPES,
    assertConversationId,
    assertRole,
    assertStreamEventType,
    assertTimestamp,
} from './index.mjs';

test('ConversationSchema includes required keys', () => {
    const requiredKeys = ['id', 'title', 'status', 'createdAt', 'updatedAt']
    for (const key of requiredKeys) {
        assert.ok(Object.hasOwn(ConversationSchema, key), `missing key: ${key}`)
    }
})

test('MessageSchema includes required keys', () => {
    const requiredKeys = ['id', 'conversationId', 'role', 'content', 'createdAt']
    for (const key of requiredKeys) {
        assert.ok(Object.hasOwn(MessageSchema, key), `missing key: ${key}`)
    }
})

test('message role constraints include user and assistant', () => {
    assert.deepEqual(MESSAGE_ROLES, ['user', 'assistant'])
})

test('stream event type list includes start, delta, done, error', () => {
    assert.deepEqual(STREAM_EVENT_TYPES, ['start', 'delta', 'done', 'error'])
})

test('assertConversationId throws for invalid values', () => {
    assert.throws(() => assertConversationId(''))
    assert.throws(() => assertConversationId('   '))
    assert.throws(() => assertConversationId(null))
})

test('assertRole accepts valid and rejects invalid roles', () => {
    assert.doesNotThrow(() => assertRole('user'))
    assert.doesNotThrow(() => assertRole('assistant'))
    assert.throws(() => assertRole('system'))
})

test('assertStreamEventType accepts valid and rejects invalid types', () => {
    assert.doesNotThrow(() => assertStreamEventType('start'))
    assert.doesNotThrow(() => assertStreamEventType('delta'))
    assert.doesNotThrow(() => assertStreamEventType('done'))
    assert.doesNotThrow(() => assertStreamEventType('error'))
    assert.throws(() => assertStreamEventType('chunk'))
})

test('assertTimestamp validates ISO datetime', () => {
    assert.doesNotThrow(() => assertTimestamp('2026-06-11T12:00:00.000Z'))
    assert.throws(() => assertTimestamp('not-a-date'))
    assert.throws(() => assertTimestamp(''))
})