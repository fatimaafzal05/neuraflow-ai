import { createOfflineChatReply } from "@/lib/offline-assistant.server";
import { createFileRoute } from "@tanstack/react-router";
import { createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from "ai";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const responseText = createOfflineChatReply(messages);
        const stream = createUIMessageStream({
          originalMessages: messages,
          execute: ({ writer }) => {
            const id = "offline-response";
            writer.write({ type: "text-start", id });
            writer.write({ type: "text-delta", id, delta: responseText });
            writer.write({ type: "text-end", id });
          },
        });
        return createUIMessageStreamResponse({ stream });
      },
    },
  },
});
