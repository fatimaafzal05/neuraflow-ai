import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import {
  createOfflineCoverLetter,
  createOfflineInterviewTurn,
  createOfflineResume,
  createOfflineStudyPack,
  isCloudAiConfigured,
} from "@/lib/offline-assistant.server";
import type { Database } from "@/integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";

// ---------- shared ----------
type AppSupabaseClient = SupabaseClient<Database>;

function getGateway(structured = false) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Cloud AI is not configured.");
  return createLovableAiGatewayProvider(key, undefined, { structuredOutputs: structured });
}

async function ensureUsageAvailable(supabase: AppSupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("ai_messages_used, ai_messages_limit")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Your profile is still being created. Please try again in a moment.");
  if (data.ai_messages_used >= data.ai_messages_limit) {
    throw new Error("You've reached your AI message limit for this plan.");
  }
}

async function bumpUsage(supabase: AppSupabaseClient, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("ai_messages_used")
    .eq("id", userId)
    .maybeSingle();
  const used = (data?.ai_messages_used ?? 0) + 1;
  await supabase.from("profiles").update({ ai_messages_used: used }).eq("id", userId);
}

async function logActivity(
  supabase: AppSupabaseClient,
  userId: string,
  action: string,
  resourceType?: string,
  resourceId?: string,
) {
  await supabase
    .from("activity_logs")
    .insert({ user_id: userId, action, resource_type: resourceType, resource_id: resourceId });
}

// ---------- Resume: generate structured resume ----------
const ResumeInput = z.object({
  role: z.string().min(1).max(200),
  targetJob: z.string().max(400).optional().default(""),
  background: z.string().min(20).max(6000),
  tone: z.enum(["professional", "confident", "friendly", "concise"]).default("professional"),
});

const ResumeSchema = z.object({
  full_name: z.string(),
  headline: z.string(),
  summary: z.string(),
  contact: z.object({
    email: z.string(),
    phone: z.string(),
    location: z.string(),
    website: z.string(),
  }),
  experience: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      start: z.string(),
      end: z.string(),
      bullets: z.array(z.string()),
    }),
  ),
  education: z.array(
    z.object({
      school: z.string(),
      degree: z.string(),
      start: z.string(),
      end: z.string(),
    }),
  ),
  skills: z.array(z.string()),
  projects: z.array(z.object({ name: z.string(), description: z.string() })),
});

export const generateResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => ResumeInput.parse(raw))
  .handler(async ({ data, context }) => {
    const cloudAi = isCloudAiConfigured();
    if (cloudAi) await ensureUsageAvailable(context.supabase, context.userId);
    let resume: z.infer<typeof ResumeSchema>;
    if (cloudAi) {
      const gateway = getGateway(true);
      const model = gateway("google/gemini-2.5-flash");
      const prompt = `Craft a polished, ATS-friendly resume as strict JSON.

Target role: ${data.role}
${data.targetJob ? `Target job description:\n${data.targetJob}\n` : ""}
Candidate background (may be messy notes, prior resume, or bullets):
"""
${data.background}
"""

Tone: ${data.tone}. Rewrite bullets to start with strong verbs, quantify impact, and align keywords to the target role. Fill contact fields with placeholders like "you@email.com" if the candidate did not provide them.`;
      try {
        const { output } = await generateText({
          model,
          output: Output.object({ schema: ResumeSchema }),
          prompt,
        });
        resume = output;
      } catch (err) {
        if (NoObjectGeneratedError.isInstance(err))
          throw new Error("AI could not structure the resume. Please try again with more detail.");
        throw err;
      }
    } else resume = createOfflineResume(data);

    const { data: row, error } = await context.supabase
      .from("resumes")
      .insert({
        user_id: context.userId,
        title: `${resume.full_name || "Resume"} — ${data.role}`,
        target_role: data.role,
        data: resume,
      })
      .select("id")
      .single();
    if (error) throw error;

    if (cloudAi) await bumpUsage(context.supabase, context.userId);
    await logActivity(context.supabase, context.userId, "resume.generated", "resume", row.id);
    return { id: row.id, resume };
  });

// ---------- Cover letter ----------
const CoverInput = z.object({
  company: z.string().min(1).max(200),
  role: z.string().min(1).max(200),
  jobDescription: z.string().min(20).max(8000),
  background: z.string().min(20).max(6000),
  tone: z.enum(["professional", "enthusiastic", "warm", "concise"]).default("professional"),
});

export const generateCoverLetter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => CoverInput.parse(raw))
  .handler(async ({ data, context }) => {
    const cloudAi = isCloudAiConfigured();
    if (cloudAi) await ensureUsageAvailable(context.supabase, context.userId);
    let text: string;
    if (cloudAi) {
      const gateway = getGateway(false);
      const model = gateway("google/gemini-2.5-flash");
      ({ text } = await generateText({
        model,
        prompt: `Write a tailored cover letter (about 280-380 words) in a ${data.tone} tone.

Company: ${data.company}
Role: ${data.role}

Job description:
"""
${data.jobDescription}
"""

Candidate background:
"""
${data.background}
"""

Requirements:
- Open with a specific hook tied to the company/role — no generic "I am writing to apply".
- Three tight body paragraphs mapping candidate strengths to job requirements, with one concrete accomplishment.
- Close with a clear, confident call to action.
- Markdown formatting: paragraphs separated by blank lines, no headings, no bullet lists.
- Do not invent fake companies or metrics; when unknown, use plausible neutral phrasing.`,
      }));
    } else text = createOfflineCoverLetter(data);

    const { data: row, error } = await context.supabase
      .from("cover_letters")
      .insert({
        user_id: context.userId,
        company: data.company,
        role: data.role,
        content: text,
      })
      .select("id")
      .single();
    if (error) throw error;

    if (cloudAi) await bumpUsage(context.supabase, context.userId);
    await logActivity(
      context.supabase,
      context.userId,
      "cover_letter.generated",
      "cover_letter",
      row.id,
    );
    return { id: row.id, content: text };
  });

// ---------- Study: notes + flashcards + quiz ----------
const StudyInput = z.object({
  topic: z.string().min(2).max(400),
  level: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
  source: z.string().max(20000).optional().default(""),
});

const StudySchema = z.object({
  title: z.string(),
  summary: z.string(),
  key_points: z.array(z.string()),
  notes_markdown: z.string(),
  flashcards: z.array(z.object({ front: z.string(), back: z.string() })),
  quiz: z.array(
    z.object({
      question: z.string(),
      choices: z.array(z.string()),
      answer_index: z.number(),
      explanation: z.string(),
    }),
  ),
});

export const generateStudyPack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => StudyInput.parse(raw))
  .handler(async ({ data, context }) => {
    const cloudAi = isCloudAiConfigured();
    if (cloudAi) await ensureUsageAvailable(context.supabase, context.userId);
    let pack: z.infer<typeof StudySchema>;
    if (cloudAi) {
      const gateway = getGateway(true);
      const model = gateway("google/gemini-2.5-flash");
      const prompt = `Create a study pack as strict JSON for the topic "${data.topic}" at ${data.level} level.
${data.source ? `Base it on this source material:\n"""${data.source.slice(0, 18000)}"""\n` : ""}
Include:
- title, one-paragraph summary
- 5-8 key points
- notes_markdown: well-structured markdown notes with headings and bullets
- flashcards: 8-12 concise front/back cards
- quiz: 5 multiple-choice questions with 4 choices each, answer_index (0-3), and a one-line explanation.`;
      try {
        const { output } = await generateText({
          model,
          output: Output.object({ schema: StudySchema }),
          prompt,
        });
        pack = output;
      } catch (err) {
        if (NoObjectGeneratedError.isInstance(err))
          throw new Error("AI could not structure the study pack. Try a narrower topic.");
        throw err;
      }
    } else pack = createOfflineStudyPack(data);

    const { data: deck, error: deckErr } = await context.supabase
      .from("flashcard_decks")
      .insert({
        user_id: context.userId,
        title: pack.title,
        topic: data.topic,
        cards: pack.flashcards,
      })
      .select("id")
      .single();
    if (deckErr) throw deckErr;

    const { data: quiz, error: quizErr } = await context.supabase
      .from("quizzes")
      .insert({
        user_id: context.userId,
        title: pack.title,
        topic: data.topic,
        questions: pack.quiz,
      })
      .select("id")
      .single();
    if (quizErr) throw quizErr;

    if (cloudAi) await bumpUsage(context.supabase, context.userId);
    await logActivity(
      context.supabase,
      context.userId,
      "study.generated",
      "flashcard_deck",
      deck.id,
    );
    return { pack, deckId: deck.id, quizId: quiz.id };
  });

// ---------- Interview: next question + feedback ----------
const InterviewTurn = z.object({
  role: z.string().min(1).max(200),
  level: z.enum(["junior", "mid", "senior"]).default("mid"),
  transcript: z.array(
    z.object({
      role: z.enum(["interviewer", "candidate"]),
      text: z.string(),
    }),
  ),
});

const TurnSchema = z.object({
  question: z.string(),
  feedback_on_previous: z.string(),
  previous_score: z.number(),
  done: z.boolean(),
});

export const interviewTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => InterviewTurn.parse(raw))
  .handler(async ({ data, context }) => {
    const cloudAi = isCloudAiConfigured();
    if (cloudAi) await ensureUsageAvailable(context.supabase, context.userId);
    if (!cloudAi) return createOfflineInterviewTurn(data);
    const gateway = getGateway(true);
    const model = gateway("google/gemini-2.5-flash");
    const transcriptText = data.transcript
      .map((t) => `${t.role.toUpperCase()}: ${t.text}`)
      .join("\n");
    const prompt = `You are a senior hiring manager running a live mock interview for a ${data.level} ${data.role}.
Transcript so far:
"""
${transcriptText || "(no answers yet)"}
"""

Return strict JSON. Rules:
- If transcript is empty, question is a strong opening behavioral or technical question; feedback_on_previous = "", previous_score = 0.
- Otherwise, score the candidate's most recent answer (0-10), give 2-3 sentences of honest, specific feedback, and ask ONE next question that probes weakness or depth.
- After ~5 candidate answers, set done=true and put a final summary in feedback_on_previous, question = "".`;

    const { output } = await generateText({
      model,
      output: Output.object({ schema: TurnSchema }),
      prompt,
    });

    await bumpUsage(context.supabase, context.userId);
    return output;
  });

const SaveInterviewInput = z.object({
  role: z.string(),
  transcript: z.array(z.object({ role: z.enum(["interviewer", "candidate"]), text: z.string() })),
  overallScore: z.number(),
  feedback: z.string(),
});
export const saveInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => SaveInterviewInput.parse(raw))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("interview_sessions")
      .insert({
        user_id: context.userId,
        role: data.role,
        transcript: data.transcript,
        overall_score: data.overallScore,
        feedback: data.feedback,
      })
      .select("id")
      .single();
    if (error) throw error;
    await logActivity(context.supabase, context.userId, "interview.completed", "interview", row.id);
    return { id: row.id };
  });
