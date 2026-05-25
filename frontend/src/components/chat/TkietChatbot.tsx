"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bot, Send, Loader2, GraduationCap, Phone, Mail } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && process.env.NODE_ENV === "production"
    ? "/api"
    : "http://localhost:4000/api");

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatStatus {
  aiEnabled: boolean;
  suggestedQuestions: string[];
}

export function TkietChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Namaste! I am the **TKIET Warananagar** inquiry assistant. Ask me about admissions, departments, placements, campus facilities, exams, or how to contact the institute.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<ChatStatus | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_URL}/chat/tkiet/status`)
      .then((r) => r.json())
      .then((data: ChatStatus) => setStatus(data))
      .catch(() => setStatus({ aiEnabled: false, suggestedQuestions: [] }));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError("");
    const userMsg: Message = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat/tkiet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get response");

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach chat service");
    } finally {
      setLoading(false);
    }
  };

  const suggestions = status?.suggestedQuestions ?? [
    "What B.Tech branches are offered?",
    "How to apply for admission?",
    "Placement statistics?",
  ];

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-12rem)]">
      <div className="glass-card !p-4 mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-brand-600 flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg">TKIET Inquiry Assistant</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Tatyasaheb Kore Institute of Engineering & Technology, Warananagar
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 ml-auto text-xs text-[var(--text-secondary)]">
          <a href="tel:18005992328" className="flex items-center gap-1 hover:text-brand-500">
            <Phone className="w-3.5 h-3.5" /> 18005992328
          </a>
          <a href="mailto:info@tkietwarana.ac.in" className="flex items-center gap-1 hover:text-brand-500">
            <Mail className="w-3.5 h-3.5" /> info@tkietwarana.ac.in
          </a>
          {status && (
            <span className={status.aiEnabled ? "text-emerald-500" : "text-amber-500"}>
              {status.aiEnabled ? "● Groq AI online" : "● Offline mode (set GROQ_API_KEY)"}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 glass rounded-2xl border border-[var(--glass-border)] flex flex-col overflow-hidden min-h-[420px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-brand-500 text-white rounded-br-md"
                    : "glass bg-white/60 dark:bg-gray-900/60 rounded-bl-md"
                }`}
              >
                {m.content.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                  part.startsWith("**") && part.endsWith("**") ? (
                    <strong key={j}>{part.slice(2, -2)}</strong>
                  ) : (
                    <span key={j}>{part}</span>
                  )
                )}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex gap-3 items-center text-[var(--text-secondary)] text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Thinking...
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {suggestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => sendMessage(q)}
                className="text-xs px-3 py-1.5 rounded-full glass hover:bg-brand-500/10 hover:text-brand-500 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {error && <p className="px-4 text-red-500 text-sm">{error}</p>}

        <form
          className="p-4 border-t border-[var(--glass-border)] flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about TKIET admissions, departments, placements..."
            className="input-field flex-1"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()} className="btn-primary !px-4">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
