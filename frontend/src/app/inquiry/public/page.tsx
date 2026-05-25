"use client";

import Link from "next/link";
import { GraduationCap, Zap } from "lucide-react";
import { TkietChatbot } from "@/components/chat/TkietChatbot";

/** Public TKIET inquiry — no login required (for prospective students & parents). */
export default function PublicInquiryPage() {
  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <header className="glass border-b border-[var(--glass-border)] px-4 py-3 flex items-center justify-between">
        <Link href="/inquiry/public" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-brand-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold">TKIET Inquiry</span>
        </Link>
        <div className="flex gap-2">
          <Link href="/login" className="text-sm text-[var(--text-secondary)] hover:text-brand-500 px-3 py-2">
            Student Login
          </Link>
          <Link href="/login" className="btn-primary !py-2 !px-4 text-sm flex items-center gap-1">
            <Zap className="w-4 h-4" /> LearnIQ
          </Link>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-1">
          Ask TKIET Warananagar
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mb-6">
          Official college inquiry chatbot — powered by Groq AI (llama-3.3-70b-versatile)
        </p>
        <TkietChatbot />
      </main>
    </div>
  );
}
