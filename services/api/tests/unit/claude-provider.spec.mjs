// services/api/tests/unit/claude-provider.spec.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { createClaudeProvider } from "../../src/modules/providers/claude-provider.mjs";

test("Claude provider normalizes native stream chunks", async () => {
  const provider = createClaudeProvider({
    client: {
      async *streamMessage() {
        yield {
          type: "message_start",
          conversationId: "conv_1",
          messageId: "msg_1",
          timestamp: "2026-06-17T00:00:00.000Z",
        };
        yield { type: "content_delta", text: "Hello" };
        yield { type: "message_done", done: true };
      },
    },
  });

  const events = [];
  for await (const event of provider.streamMessage({
    conversationId: "conv_1",
    messageId: "msg_1",
    messages: [],
  })) {
    events.push(event);
  }

  assert.deepEqual(events, [
    {
      type: "start",
      conversationId: "conv_1",
      messageId: "msg_1",
      timestamp: "2026-06-17T00:00:00.000Z",
    },
    {
      type: "delta",
      conversationId: "conv_1",
      messageId: "msg_1",
      chunk: "Hello",
      timestamp: "2026-06-17T00:00:00.000Z",
    },
    {
      type: "done",
      conversationId: "conv_1",
      messageId: "msg_1",
      done: true,
      timestamp: "2026-06-17T00:00:00.000Z",
    },
  ]);
});
