import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

const SYSTEM_PROMPT = `You are NeuraFlow AI, a warm and sharp career + productivity copilot for students, freelancers, and professionals.

Be concise, opinionated, and practical. Use markdown: headings, bullets, tables, and fenced code blocks with language tags. Prefer action over theory. If the user is vague, ask one focused follow-up question.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const authorization = request.headers.get("authorization");
        const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!token || !supabaseUrl || !supabaseKey) {
          return new Response("Please sign in before sending a message.", { status: 401 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (userError || !userData.user) {
          return new Response("Your session has expired. Please sign in again.", { status: 401 });
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("ai_messages_used, ai_messages_limit")
          .eq("id", userData.user.id)
          .maybeSingle();
        if (profileError) return new Response("Could not verify your AI usage.", { status: 500 });
        if (!profile)
          return new Response("Your profile is still being created. Please try again.", {
            status: 409,
          });
        if (profile.ai_messages_used >= profile.ai_messages_limit) {
          return new Response("You've reached your AI message limit for this plan.", {
            status: 429,
          });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response(
            "AI is not configured. Add LOVABLE_API_KEY to the server environment and try again.",
            { status: 503 },
          );
        }

        const gateway = createLovableAiGatewayProvider(key);
        try {
          const result = streamText({
            model: gateway("google/gemini-2.5-flash"),
            system: SYSTEM_PROMPT,
            messages: await convertToModelMessages(messages),
            onFinish: async () => {
              const { error } = await supabase
                .from("profiles")
                .update({ ai_messages_used: profile.ai_messages_used + 1 })
                .eq("id", userData.user.id);
              if (error) console.error("Unable to record AI usage", error);
            },
          });
          return result.toUIMessageStreamResponse({ originalMessages: messages });
        } catch (err) {
          const message = err instanceof Error ? err.message : "AI request failed";
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});
