import type { UIMessage } from "ai";

type ResumeInput = { role: string; targetJob: string; background: string; tone: string };
type StudyInput = { topic: string; level: string; source: string };
type InterviewInput = {
  role: string;
  level: string;
  transcript: { role: "interviewer" | "candidate"; text: string }[];
};

export const isCloudAiConfigured = () => Boolean(process.env.LOVABLE_API_KEY);

function excerpt(value: string, max = 360) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length > max ? `${cleaned.slice(0, max).trim()}…` : cleaned;
}

function sentences(value: string) {
  return value
    .split(/[.!?\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function pick<T>(items: T[], value: string) {
  const hash = [...value].reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 0);
  return items[hash % items.length];
}

function topicFrom(question: string) {
  const match = question.match(/(?:for|about|on|pass)\s+(.+?)(?:[?.!,]|$)/i);
  return match?.[1]?.trim() || excerpt(question, 100);
}

export function createOfflineResume(input: ResumeInput) {
  const highlights = sentences(input.background);
  const bullets = (
    highlights.length ? highlights : ["Delivered high-quality work in a collaborative environment."]
  )
    .slice(0, 3)
    .map((item) =>
      item.match(/^(Led|Built|Created|Improved|Managed|Designed)/i) ? item : `Delivered ${item}`,
    );

  return {
    full_name: "Your Name",
    headline: input.role,
    summary: `A ${input.tone} ${input.role} candidate with experience in ${excerpt(input.background, 180)}.`,
    contact: { email: "you@email.com", phone: "", location: "", website: "" },
    experience: [
      {
        company: "Recent experience",
        role: input.role,
        start: "",
        end: "Present",
        bullets,
      },
    ],
    education: [],
    skills: [input.role, "Communication", "Problem solving", "Collaboration"],
    projects: input.targetJob
      ? [
          {
            name: "Target role alignment",
            description: `Tailored for: ${excerpt(input.targetJob, 180)}`,
          },
        ]
      : [],
  };
}

export function createOfflineCoverLetter(input: {
  company: string;
  role: string;
  jobDescription: string;
  background: string;
  tone: string;
}) {
  const background = excerpt(input.background, 520);
  const roleNeeds = excerpt(input.jobDescription, 360);
  return `Dear Hiring Team at ${input.company},

I am excited to apply for the ${input.role} position. The role stands out because it combines meaningful ownership with the opportunity to contribute directly to your team’s goals.

My background includes ${background}. I would bring a ${input.tone} working style, clear communication, and a focus on turning priorities into dependable results. The experience described in the job posting—${roleNeeds}—aligns closely with the kind of work I am eager to take on.

I am particularly motivated by the chance to learn from the team at ${input.company} while contributing from day one. I would welcome the opportunity to discuss how my experience and approach can support this role.

Thank you for your time and consideration.

Sincerely,
Your Name`;
}

export function createOfflineStudyPack(input: StudyInput) {
  const source = input.source
    ? excerpt(input.source, 700)
    : "Use the topic as the starting point for your own notes and examples.";
  const points = [
    `Define the central idea of ${input.topic} in your own words.`,
    "Identify the inputs, process, and outcome.",
    "Connect the concept to a practical example.",
    "Compare it with a related concept to clarify boundaries.",
    "Review with retrieval practice instead of rereading.",
  ];
  return {
    title: `${input.topic} study pack`,
    summary: `A ${input.level} guide to ${input.topic}. Source focus: ${source}`,
    key_points: points,
    notes_markdown: `## ${input.topic}\n\n${source}\n\n### How to study it\n\n- Start with a one-sentence definition.\n- Draw or write the sequence of steps involved.\n- Create one example and one counterexample.\n- Explain the topic aloud without looking at your notes.`,
    flashcards: points.map((point, index) => ({
      front: `Key idea ${index + 1}: ${input.topic}`,
      back: point,
    })),
    quiz: points.map((point, index) => ({
      question: `Which study action best supports understanding of ${input.topic}?`,
      choices: [
        point,
        "Memorize the heading only",
        "Skip examples and practice",
        "Read once without checking understanding",
      ],
      answer_index: 0,
      explanation:
        "Active recall and a concrete explanation build stronger understanding than passive review.",
    })),
  };
}

export function createOfflineInterviewTurn(input: InterviewInput) {
  const answers = input.transcript.filter((turn) => turn.role === "candidate");
  if (answers.length === 0) {
    return {
      question: `Tell me about yourself and why you are interested in this ${input.level} ${input.role} role.`,
      feedback_on_previous: "",
      previous_score: 0,
      done: false,
    };
  }

  const latest = answers.at(-1)?.text ?? "";
  const score = Math.min(9, Math.max(4, Math.round(latest.trim().split(/\s+/).length / 20) + 4));
  const done = answers.length >= 5;
  return {
    question: done
      ? ""
      : `Tell me about a difficult ${input.role} decision you made, how you evaluated options, and what you learned.`,
    feedback_on_previous: done
      ? `You completed the practice interview. Your answers showed useful experience; keep using a clear situation, action, and result structure, and add measurable outcomes where possible.`
      : `Score: ${score}/10. Your answer has a useful starting point. Make it stronger by naming the situation, the action you personally took, and the measurable result.`,
    previous_score: score,
    done,
  };
}

export function createOfflineChatReply(messages: UIMessage[]) {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");
  const prompt = lastUserMessage?.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join(" ")
    .trim();
  const question = prompt || "Tell me what you are working on.";
  const normalized = question.toLowerCase();
  const turn = messages.filter((message) => message.role === "assistant").length + 1;
  const topic = topicFrom(question);

  if (/(exam|study|learn|certif|aws)/.test(normalized)) {
    const focus = pick(
      [
        "core concepts and vocabulary",
        "scenario-based practice questions",
        "weak areas revealed by practice tests",
      ],
      question,
    );
    return `## ${topic} study plan\n\n**Focus for session ${turn}:** ${focus}.\n\n### 60-minute session\n\n1. **10 min — Recall:** write everything you remember about ${topic}.\n2. **25 min — Learn:** study one subtopic and make 5 short flashcards.\n3. **15 min — Apply:** answer practice questions without notes.\n4. **10 min — Review:** explain the hardest answer in your own words.\n\n### Checkpoint\n\nAt the end, score yourself from 1–5. If you score under 4, repeat the same subtopic tomorrow with a new example.\n\n**Next question for you:** which part of ${topic} feels hardest right now?`;
  }
  if (/(resume|cv|linkedin|job application)/.test(normalized)) {
    const verb = pick(["Led", "Designed", "Improved", "Built", "Streamlined"], question);
    return `## Resume improvement\n\nFor **${topic}**, turn your experience into evidence-based bullets.\n\nUse this format:\n\n> **${verb}** [project or responsibility] for [scope], resulting in [measurable outcome].\n\n### Example\n\n“${verb} a cross-functional onboarding redesign for 3,000 monthly users, improving activation by 18%.”\n\nSend me one of your existing bullets and I’ll rewrite it in this format.`;
  }
  if (/(interview|question|hiring)/.test(normalized)) {
    return `## Interview practice\n\nFor **${topic}**, use the **STAR** structure:\n\n- **Situation:** Set the context in one sentence.\n- **Task:** Explain your responsibility.\n- **Action:** Describe what *you* did.\n- **Result:** End with a measurable outcome or lesson.\n\n### Practice prompt\n\n“Tell me about a time you had to make a difficult decision related to ${topic}.”\n\nKeep your answer to 60–90 seconds, then identify one detail you would improve on the next attempt.`;
  }
  const approach = pick(
    [
      "clarify the outcome",
      "reduce the task to a first step",
      "identify the highest-impact constraint",
    ],
    question,
  );
  return `## Action plan\n\nYou asked: **${excerpt(question, 240)}**\n\nFor this response, start by **${approach}**.\n\n1. State the exact result you want by the end of today.\n2. Write down the main obstacle and one way around it.\n3. Complete one 25-minute focused work block before planning more.\n\nReply with your deadline or current progress and I’ll make the next step more specific.`;
}
