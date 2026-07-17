import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Sparkles, Square, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageContent } from "@/components/chat/message-content";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "AI Chat · NeuraFlow AI" }] }),
  component: ChatPage,
});

const STARTERS = [
  { title: "Rewrite my LinkedIn bio", prompt: "Rewrite my LinkedIn bio to sound confident and specific. I'm a product designer with 6 years in B2B SaaS." },
  { title: "Draft a cover letter", prompt: "Draft a cover letter for a Senior Frontend Engineer role at a fintech startup. Highlight React, TypeScript, and shipping speed." },
  { title: "2-week study plan", prompt: "Build a 2-week study plan for the AWS Solutions Architect Associate exam. I have 1 hour a day." },
  { title: "Explain a hard concept", prompt: "Explain how JWTs work with a real analogy and a small TypeScript example." },
];

function ChatPage() {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, stop, setMessages } = useChat({
    transport,
    onError: (e) => toast.error(e.message || "Something went wrong"),
    onFinish: () => {
      void supabase.auth.getUser().then(({ data }) => {
        if (!data.user) return;
        void supabase.from("activity_logs").insert({
          user_id: data.user.id,
          action: "ai_message_sent",
          resource_type: "chat",
        });
      });
    },
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isStreaming = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (!isStreaming) textareaRef.current?.focus();
  }, [isStreaming]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const submit = (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || isStreaming) return;
    void sendMessage({ text: value });
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/60 px-6 py-3">
        <div className="text-sm text-muted-foreground">AI Chat</div>
        <Button variant="ghost" size="sm" onClick={() => setMessages([])} className="gap-1.5">
          <Plus className="size-4" /> New chat
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
          {messages.length === 0 ? (
            <EmptyState onPick={(p) => submit(p)} />
          ) : (
            <div className="space-y-8">
              {messages.map((m) => {
                const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
                return (
                  <div key={m.id} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
                    {m.role === "assistant" && (
                      <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--gradient-brand)" }}>
                        <Sparkles className="size-3.5 text-brand-foreground" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
                        m.role === "user" ? "bg-secondary text-foreground rounded-br-md" : "glass rounded-bl-md",
                      )}
                    >
                      {m.role === "user" ? (
                        <p className="whitespace-pre-wrap">{text}</p>
                      ) : (
                        <MessageContent text={text || "…"} />
                      )}
                    </div>
                  </div>
                );
              })}
              {status === "submitted" && (
                <div className="flex gap-3">
                  <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--gradient-brand)" }}>
                    <Sparkles className="size-3.5 text-brand-foreground animate-pulse" />
                  </div>
                  <div className="glass flex items-center gap-1.5 rounded-2xl rounded-bl-md px-4 py-3">
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border/60 bg-background/60 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6">
          <div className="glass flex items-end gap-2 rounded-2xl p-2 shadow-elevated">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Ask NeuraFlow anything…"
              rows={1}
              className="min-h-11 resize-none border-0 bg-transparent p-2 text-[15px] shadow-none focus-visible:ring-0"
            />
            {isStreaming ? (
              <Button size="icon" variant="secondary" onClick={() => stop()} className="rounded-xl">
                <Square className="size-4" fill="currentColor" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={() => submit()}
                disabled={!input.trim()}
                className="rounded-xl bg-foreground text-background hover:bg-foreground/90"
              >
                <ArrowUp className="size-4" />
              </Button>
            )}
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            NeuraFlow can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-6 rounded-2xl p-3 glass shadow-glow">
        <Sparkles className="size-6 text-brand-glow" />
      </div>
      <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
        How can I help you <span className="text-gradient italic">today</span>?
      </h1>
      <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
        {STARTERS.map((s) => (
          <button
            key={s.title}
            onClick={() => onPick(s.prompt)}
            className="group glass rounded-xl px-4 py-3 text-left text-sm transition-all hover:-translate-y-0.5 hover:border-brand/40"
          >
            <div className="font-medium">{s.title}</div>
            <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{s.prompt}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
