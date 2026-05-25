import { Router } from "express";
import {
  chatWithTkietAssistant,
  getSuggestedQuestions,
  isChatAvailable,
  type ChatMessage,
} from "../services/tkiet-chat.js";

const router = Router();

router.get("/tkiet/status", (_req, res) => {
  res.json({
    service: "TKIET College Inquiry Chatbot",
    institute: "Tatyasaheb Kore Institute of Engineering and Technology, Warananagar",
    aiEnabled: isChatAvailable(),
    model: "llama-3.3-70b-versatile",
    suggestedQuestions: getSuggestedQuestions(),
  });
});

router.post("/tkiet", async (req, res) => {
  try {
    const { messages } = req.body as { messages?: ChatMessage[] };

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const sanitized: ChatMessage[] = messages
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({
        role: m.role,
        content: m.content.slice(0, 4000),
      }));

    if (!sanitized.some((m) => m.role === "user")) {
      return res.status(400).json({ error: "At least one user message is required" });
    }

    const result = await chatWithTkietAssistant(sanitized);
    res.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Chat failed";
    res.status(500).json({ error: message });
  }
});

export default router;
