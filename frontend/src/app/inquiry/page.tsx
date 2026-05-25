"use client";

import Link from "next/link";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { TkietChatbot } from "@/components/chat/TkietChatbot";
import { DashboardLayout } from "@/components/ui/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function InquiryPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="btn-secondary !py-2 !px-3 text-sm flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-emerald-500" />
              <h1 className="font-display text-2xl md:text-3xl font-bold">College Inquiry</h1>
            </div>
          </div>
          <p className="text-[var(--text-secondary)] text-sm">
            AI-powered answers about TKIET Warananagar — admissions, academics, placements, and campus life.
          </p>
          <TkietChatbot />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
