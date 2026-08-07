import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Mic, Play, Send, RotateCcw, Save } from "lucide-react";
import { interviewTurn, saveInterview } from "@/lib/ai.functions";
import { MessageContent } from "@/components/chat/message-content";

export const Route = createFileRoute("/_authenticated/interview")({
  head: () => ({ meta: [{ title: "Interview Coach · NeuraFlow AI" }] }),
  component: InterviewPage,
});

type Turn = { role: "interviewer" | "candidate"; text: string };
type Feedback = { text: string; score: number };

function InterviewPage() {
  const turnFn = useServerFn(interviewTurn);
  const saveFn = useServerFn(saveInterview);
  const [role, setRole] = useState("Software Engineer");
  const [level, setLevel] = useState<"junior" | "mid" | "senior">("mid");
  const [started, setStarted] = useState(false);
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [answer, setAnswer] = useState("");
  const [done, setDone] = useState(false);
  const [finalSummary, setFinalSummary] = useState("");

  const turn = useMutation({
    mutationFn: async (t: Turn[]) => turnFn({ data: { role, level, transcript: t } }),
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: async () => {
      const overall = feedback.length
        ? Math.round((feedback.reduce((n, f) => n + f.score, 0) / feedback.length) * 10) / 10
        : 0;
      return saveFn({ data: { role, transcript, overallScore: overall, feedback: finalSummary } });
    },
    onSuccess: () => toast.success("Interview saved"),
    onError: (e: Error) => toast.error(e.message),
  });

  const start = async () => {
    setStarted(true);
    setTranscript([]);
    setFeedback([]);
    setDone(false);
    setFinalSummary("");
    const res = await turn.mutateAsync([]);
    setTranscript([{ role: "interviewer", text: res.question }]);
  };

  const submit = async () => {
    if (!answer.trim()) return;
    const next: Turn[] = [...transcript, { role: "candidate", text: answer.trim() }];
    setTranscript(next);
    setAnswer("");
    const res = await turn.mutateAsync(next);
    if (res.previous_score >= 0) {
      setFeedback((f) => [...f, { text: res.feedback_on_previous, score: res.previous_score }]);
    }
    if (res.done) {
      setDone(true);
      setFinalSummary(res.feedback_on_previous);
    } else {
      setTranscript((t) => [...t, { role: "interviewer", text: res.question }]);
    }
  };

  return (
    <div>
      <PageHeader
        title="Interview Coach"
        description="Live mock interviews with honest feedback."
      />
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[360px_1fr]">
        <section className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur">
          <h2 className="font-display text-xl tracking-tight">Setup</h2>
          <div className="mt-5 space-y-4">
            <div>
              <Label>Role</Label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1.5"
                disabled={started && !done}
              />
            </div>
            <div>
              <Label>Level</Label>
              <Select
                value={level}
                onValueChange={(v) => setLevel(v as typeof level)}
                disabled={started && !done}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="mid">Mid</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!started || done ? (
              <Button
                onClick={start}
                disabled={turn.isPending || !role.trim()}
                className="w-full rounded-xl bg-foreground text-background hover:bg-foreground/90"
              >
                {turn.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Play className="mr-2 size-4" />
                )}
                {done ? "Start new interview" : "Start interview"}
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setStarted(false)} className="w-full">
                <RotateCcw className="mr-2 size-4" /> End
              </Button>
            )}
            {done && (
              <Button
                onClick={() => save.mutate()}
                disabled={save.isPending}
                variant="secondary"
                className="w-full"
              >
                {save.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                Save session
              </Button>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur">
          {!started ? (
            <div className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center text-muted-foreground">
              <Mic className="mb-3 size-8 text-brand-glow" />
              <p className="text-sm">Choose your role, then start the interview.</p>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                {transcript.map((t, i) => {
                  const fbIndex =
                    t.role === "candidate" ? countTo(transcript, "candidate", i) - 1 : -1;
                  const fb = fbIndex >= 0 ? feedback[fbIndex] : null;
                  return (
                    <div key={i}>
                      <div
                        className={`rounded-2xl border p-4 text-sm ${t.role === "interviewer" ? "border-border bg-background" : "border-brand/30 bg-brand/5 ml-8"}`}
                      >
                        <div className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
                          {t.role === "interviewer" ? "Interviewer" : "You"}
                        </div>
                        {t.text}
                      </div>
                      {fb && (
                        <div className="ml-8 mt-2 rounded-xl border border-border/60 bg-card/40 p-3 text-xs text-muted-foreground">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="font-semibold text-foreground">
                              Score: {fb.score}/10
                            </span>
                          </div>
                          {fb.text}
                        </div>
                      )}
                    </div>
                  );
                })}
                {done && finalSummary && (
                  <div className="rounded-2xl border border-brand/40 bg-brand/5 p-4">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-glow">
                      Final feedback
                    </div>
                    <MessageContent text={finalSummary} />
                  </div>
                )}
              </div>
              {!done && (
                <div className="mt-4 border-t border-border pt-4">
                  <Textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer…"
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                    }}
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">⌘/Ctrl + Enter to submit</span>
                    <Button
                      onClick={submit}
                      disabled={turn.isPending || !answer.trim()}
                      className="rounded-xl bg-foreground text-background hover:bg-foreground/90"
                    >
                      {turn.isPending ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 size-4" />
                      )}
                      Send
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function countTo(list: Turn[], role: Turn["role"], upto: number) {
  let n = 0;
  for (let i = 0; i <= upto; i++) if (list[i].role === role) n++;
  return n;
}
