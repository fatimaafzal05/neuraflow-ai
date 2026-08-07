export function createOfflineResume(input: {
  role: string;
  targetJob: string;
  background: string;
}) {
  const points = input.background
    .split(/[.!?\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
  return {
    full_name: "Your Name",
    headline: input.role,
    summary: `A ${input.role} candidate with experience in ${input.background.slice(0, 220)}.`,
    contact: { email: "you@email.com", phone: "", location: "", website: "" },
    experience: [
      {
        company: "Recent experience",
        role: input.role,
        start: "",
        end: "Present",
        bullets: points.length ? points : ["Delivered quality work and collaborated effectively."],
      },
    ],
    education: [],
    skills: [input.role, "Communication", "Problem solving"],
    projects: input.targetJob
      ? [{ name: "Target role alignment", description: input.targetJob.slice(0, 180) }]
      : [],
  };
}

export function createOfflineCoverLetter(input: {
  company: string;
  role: string;
  jobDescription: string;
  background: string;
}) {
  return `Dear Hiring Team at ${input.company},\n\nI am excited to apply for the ${input.role} position. My experience includes ${input.background.slice(0, 500)}. I am drawn to this opportunity because the role calls for ${input.jobDescription.slice(0, 280)}.\n\nI bring a practical, collaborative approach and a focus on clear results. I would welcome the opportunity to discuss how I can contribute to ${input.company}.\n\nSincerely,\nYour Name`;
}

export function createOfflineStudyPack(input: { topic: string; level: string; source: string }) {
  const source = input.source || `Study ${input.topic} using examples and active recall.`;
  const points = [
    "Define the core concept",
    "Identify the process",
    "Work through an example",
    "Explain it in your own words",
    "Test your understanding",
  ];
  return {
    title: `${input.topic} study pack`,
    summary: `A ${input.level} study guide. ${source.slice(0, 280)}`,
    key_points: points,
    notes_markdown: `## ${input.topic}\n\n${source}\n\n### Study method\n\n- Define the idea in one sentence.\n- Use a concrete example.\n- Test yourself without notes.`,
    flashcards: points.map((point) => ({ front: `${input.topic}: key idea`, back: point })),
    quiz: points.map((point) => ({
      question: `What is a useful way to study ${input.topic}?`,
      choices: [point, "Skip examples", "Memorize headings only", "Avoid practice"],
      answer_index: 0,
      explanation: "Active recall and examples improve understanding.",
    })),
  };
}

export function createOfflineInterviewTurn(input: {
  role: string;
  level: string;
  transcript: { role: "interviewer" | "candidate"; text: string }[];
}) {
  const answers = input.transcript.filter((turn) => turn.role === "candidate");
  if (!answers.length)
    return {
      question: `Tell me about yourself and why you want this ${input.level} ${input.role} role.`,
      feedback_on_previous: "",
      previous_score: 0,
      done: false,
    };
  const done = answers.length >= 5;
  return {
    question: done ? "" : `Describe a difficult ${input.role} problem you solved and the result.`,
    feedback_on_previous: done
      ? "You completed the interview. Keep using a clear situation, action, and result structure."
      : "Good start. Make your answer stronger by naming the situation, your specific action, and the outcome.",
    previous_score: 7,
    done,
  };
}
