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

  if (/(exam|study|learn|certif|aws)/.test(normalized)) {
    return `## Study plan\n\nFor **${excerpt(question, 180)}**, focus on active recall and short daily practice.\n\n### This week\n\n1. Break the syllabus into 5–7 topics and study one per day.\n2. Make 5 flashcards after each session.\n3. End every session with 10 practice questions.\n\n### Next week\n\n1. Revisit weak topics first.\n2. Complete two timed practice sets.\n3. Write a one-page cheat sheet from memory, then correct it.\n\n**Today’s first step:** choose the first topic and spend 15 minutes outlining what you already know.`;
  }
  if (/(resume|cv|linkedin|job application)/.test(normalized)) {
    return `## Resume improvement\n\nFor **${excerpt(question, 180)}**, make each bullet follow this pattern:\n\n**Action + scope + measurable outcome**\n\nExample: “Redesigned the onboarding flow for 3,000 monthly users, reducing support requests by 22%.”\n\nStart by listing your three strongest projects, the problem in each, what you did, and the result.`;
  }
  if (/(interview|question|hiring)/.test(normalized)) {
    return `## Interview practice\n\nUse the **STAR** structure for **${excerpt(question, 180)}**:\n\n- **Situation:** Set the context in one sentence.\n- **Task:** Explain your responsibility.\n- **Action:** Describe what *you* did.\n- **Result:** End with a measurable outcome or lesson.\n\nKeep your first answer to 60–90 seconds, then pause for a follow-up.`;
  }
  return `## Action plan\n\nYou asked: **${excerpt(question, 240)}**\n\n1. Write the exact result you want by the end of today.\n2. Identify the single task with the largest impact.\n3. Block 25 minutes, remove distractions, and complete that task before planning the next one.\n\nIf you share your deadline and current situation, I can turn this into a more specific checklist.`;
}
