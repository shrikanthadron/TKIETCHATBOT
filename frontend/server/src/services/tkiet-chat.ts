import Groq from "groq-sdk";
import { TKIET_KNOWLEDGE } from "../data/tkiet-knowledge.js";

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const MODEL = "llama-3.3-70b-versatile";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are TKIET Assistant, the official AI inquiry bot for Tatyasaheb Kore Institute of Engineering and Technology (TKIET), Warananagar, Maharashtra.

RULES:
1. Answer ONLY questions related to TKIET, Warananagar campus, its departments, admissions, academics, placements, facilities, exams, alumni, contacts, and affiliated programmes at this institute.
2. Use the KNOWLEDGE BASE below as your primary source. Do not fabricate fees, cut-offs, or dates — say to check the official website or contact info@tkietwarana.ac.in / 18005992328 for the latest circular.
3. If the user asks about unrelated topics (other colleges, coding homework, politics, etc.), politely reply: "I can only help with TKIET Warananagar college inquiries. Ask me about admissions, departments, placements, campus, or contacts."
4. Be friendly, concise, and helpful for prospective students, parents, and current students.
5. Use bullet points or short paragraphs for clarity. Include contact details when relevant.

KNOWLEDGE BASE:
${TKIET_KNOWLEDGE}`;

const SUGGESTED_QUESTIONS = [
  "What B.Tech branches are offered at TKIET?",
  "How do I apply for admission 2026-27?",
  "What is the placement record?",
  "Who is the Principal of TKIET?",
  "What accreditations does TKIET have?",
  "How can I contact the admission office?",
];

export function getSuggestedQuestions(): string[] {
  return SUGGESTED_QUESTIONS;
}

export function isChatAvailable(): boolean {
  return Boolean(groq);
}

function fallbackReply(userMessage: string): string {
  const q = userMessage.toLowerCase();
  if (!q.includes("tkiet") && !q.includes("warana") && !q.includes("admission") && !q.includes("placement") && !q.includes("department")) {
    return "I can only help with TKIET Warananagar college inquiries. Try asking about admissions, departments, placements, or contact details.\n\nFor live AI answers, set GROQ_API_KEY in the backend .env file.";
  }
  return `**TKIET Warananagar** (Tatyasaheb Kore Institute of Engineering and Technology)\n\n• Location: Warananagar, Kolhapur, Maharashtra — 416113\n• Email: info@tkietwarana.ac.in | Toll-free: **18005992328**\n• Website: https://www.tkietwarana.ac.in\n• Autonomous institute; NBA accredited; NAAC 'A' Grade\n• Departments: Mechanical, Chemical, Civil, ENTC, CSE, CSBS, Cyber Security, Electrical, MBA, MCA, M.Tech, and more\n• 540+ placements in 2024-25\n\nFor AI-powered detailed answers, configure **GROQ_API_KEY** on the server.`;
}

export async function chatWithTkietAssistant(
  messages: ChatMessage[]
): Promise<{ reply: string; model: string }> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser?.content.trim()) {
    throw new Error("Message is required");
  }

  if (!groq) {
    return { reply: fallbackReply(lastUser.content), model: "fallback" };
  }

  const groqMessages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.slice(-12).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: groqMessages,
      temperature: 0.4,
      max_tokens: 1024,
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ||
      "Sorry, I could not generate a response. Please try again or contact info@tkietwarana.ac.in.";

    return { reply, model: MODEL };
  } catch (e) {
    console.warn("TKIET chat Groq error:", e);
    return { reply: fallbackReply(lastUser.content), model: "fallback" };
  }
}
