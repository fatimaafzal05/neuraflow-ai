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
import {
  Loader2,
  Sparkles,
  BookOpen,
  Layers,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import { generateStudyPack } from "@/lib/ai.functions";
import { MessageContent } from "@/components/chat/message-content";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/study")({
  head: () => ({ meta: [{ title: "Study Assistant · NeuraFlow AI" }] }),
  component: StudyPage,
});

type Pack = {
  title: string;
  summary: string;
  key_points: string[];
  notes_markdown: string;
  flashcards: { front: string; back: string }[];
  quiz: { question: string; choices: string[]; answer_index: number; explanation: string }[];
};

function StudyPage() {
  const gen = useServerFn(generateStudyPack);
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [source, setSource] = useState("");
  const [pack, setPack] = useState<Pack | null>(null);

  const mutation = useMutation({
    mutationFn: async () => gen({ data: { topic, level, source } }),
    onSuccess: (res) => {
      setPack(res.pack as Pack);
      toast.success("Study pack ready");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Study Assistant"
        description="Notes, flashcards, and quizzes on any topic."
      />
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[380px_1fr]">
        <section className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur">
          <h2 className="font-display text-xl tracking-tight">Generate</h2>
          <div className="mt-5 space-y-4">
            <div>
              <Label>Topic</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Photosynthesis, closures in JS…"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Level</Label>
              <Select value={level} onValueChange={(v) => setLevel(v as typeof level)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Source material (optional)</Label>
              <Textarea
                value={source}
                onChange={(e) => setSource(e.target.value)}
                rows={6}
                placeholder="Paste notes, article, or textbook excerpt"
                className="mt-1.5"
              />
            </div>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || topic.trim().length < 2}
              className="w-full rounded-xl bg-foreground text-background hover:bg-foreground/90"
            >
              {mutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 size-4" />
              )}
              Generate study pack
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur">
          {!pack ? (
            <div className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center text-muted-foreground">
              <BookOpen className="mb-3 size-8 text-brand-glow" />
              <p className="text-sm">Your notes, flashcards and quiz will appear here.</p>
            </div>
          ) : (
            <Tabs defaultValue="notes">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl tracking-tight">{pack.title}</h2>
                <TabsList>
                  <TabsTrigger value="notes">
                    <BookOpen className="mr-1.5 size-3.5" /> Notes
                  </TabsTrigger>
                  <TabsTrigger value="cards">
                    <Layers className="mr-1.5 size-3.5" /> Flashcards
                  </TabsTrigger>
                  <TabsTrigger value="quiz">
                    <HelpCircle className="mr-1.5 size-3.5" /> Quiz
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent
                value="notes"
                className="mt-4 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-background p-6"
              >
                <p className="text-sm text-muted-foreground">{pack.summary}</p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  {pack.key_points.map((k, i) => (
                    <li key={i}>{k}</li>
                  ))}
                </ul>
                <div className="mt-6">
                  <MessageContent text={pack.notes_markdown} />
                </div>
              </TabsContent>
              <TabsContent value="cards" className="mt-4">
                <Flashcards cards={pack.flashcards} />
              </TabsContent>
              <TabsContent value="quiz" className="mt-4">
                <Quiz questions={pack.quiz} />
              </TabsContent>
            </Tabs>
          )}
        </section>
      </div>
    </div>
  );
}

function Flashcards({ cards }: { cards: { front: string; back: string }[] }) {
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  if (cards.length === 0) return null;
  const c = cards[i];
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={() => setFlip((v) => !v)}
        className="flex min-h-[220px] w-full max-w-xl flex-col items-center justify-center rounded-2xl border border-border bg-background p-8 text-center transition hover:border-brand-glow"
      >
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          {flip ? "Answer" : "Question"} · {i + 1}/{cards.length}
        </div>
        <div className="mt-3 text-lg">{flip ? c.back : c.front}</div>
      </button>
      <div className="mt-4 flex items-center gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => {
            setFlip(false);
            setI((v) => Math.max(0, v - 1));
          }}
          disabled={i === 0}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => {
            setFlip(false);
            setI((v) => Math.min(cards.length - 1, v + 1));
          }}
          disabled={i === cards.length - 1}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function Quiz({ questions }: { questions: Pack["quiz"] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const score = Object.entries(answers).reduce(
    (n, [i, a]) => (questions[Number(i)].answer_index === a ? n + 1 : n),
    0,
  );
  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <div key={qi} className="rounded-xl border border-border bg-background p-5">
          <div className="text-sm font-medium">
            {qi + 1}. {q.question}
          </div>
          <div className="mt-3 grid gap-2">
            {q.choices.map((c, ci) => {
              const picked = answers[qi] === ci;
              const correct = submitted && q.answer_index === ci;
              const wrong = submitted && picked && q.answer_index !== ci;
              return (
                <button
                  key={ci}
                  disabled={submitted}
                  onClick={() => setAnswers((a) => ({ ...a, [qi]: ci }))}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                    correct
                      ? "border-emerald-500/60 bg-emerald-500/10"
                      : wrong
                        ? "border-destructive/60 bg-destructive/10"
                        : picked
                          ? "border-brand-glow bg-brand/10"
                          : "border-border hover:border-brand-glow/60"
                  }`}
                >
                  <span>{c}</span>
                  {correct && <Check className="size-4 text-emerald-400" />}
                  {wrong && <X className="size-4 text-destructive" />}
                </button>
              );
            })}
          </div>
          {submitted && <p className="mt-2 text-xs text-muted-foreground">{q.explanation}</p>}
        </div>
      ))}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {submitted
            ? `Score: ${score}/${questions.length}`
            : `${Object.keys(answers).length}/${questions.length} answered`}
        </div>
        {!submitted ? (
          <Button
            disabled={Object.keys(answers).length < questions.length}
            onClick={() => setSubmitted(true)}
            className="rounded-xl bg-foreground text-background hover:bg-foreground/90"
          >
            Submit
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={() => {
              setAnswers({});
              setSubmitted(false);
            }}
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
