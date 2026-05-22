"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Target, Loader2, ChevronDown, ChevronRight,
  Brain, CheckCircle2, Circle, FileText,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { getActiveUser } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/ui/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { getUserExamGoal } from "@/lib/hooks";

type Difficulty = "EASY" | "MEDIUM" | "HARD";

interface QuizStatus {
  difficulty: Difficulty;
  completed: boolean;
  percent: number;
  quizId: string | null;
}

interface Subtopic {
  id: string;
  title: string;
  description?: string | null;
  content?: string | null;
  progress: number;
  contentRead: boolean;
  quizzes: QuizStatus[];
}

interface Topic {
  id: string;
  title: string;
  description?: string | null;
  content?: string | null;
  progress: number;
  subtopics: Subtopic[];
}

interface Chapter {
  id: string;
  title: string;
  description?: string | null;
  topics: Topic[];
}

interface SubjectDetail {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon?: string | null;
  examMode?: string | null;
  progress: number;
  chapters: Chapter[];
}

interface SubjectListItem {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon?: string | null;
  examMode?: string | null;
}

interface UserSubject {
  subjectId: string;
  progressPercent: number;
}

const DIFF_LABELS: Record<Difficulty, { label: string; class: string }> = {
  EASY: { label: "Easy", class: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  MEDIUM: { label: "Medium", class: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  HARD: { label: "Hard", class: "bg-red-500/15 text-red-600 dark:text-red-400" },
};

function ProgressBar({ percent, color }: { percent: number; color?: string }) {
  return (
    <div className="progress-bar">
      <div
        className="progress-fill"
        style={{
          width: `${Math.min(100, Math.max(0, percent))}%`,
          background: color || undefined,
        }}
      />
    </div>
  );
}

export default function SubjectsPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const user = getActiveUser(authUser);
  const examGoal = getUserExamGoal(user.goals as Record<string, unknown> | null);

  const [subjects, setSubjects] = useState<SubjectListItem[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SubjectDetail | null>(null);
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);
  const [openSubtopicId, setOpenSubtopicId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadSubjects = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [all, my] = await Promise.all([
        api<SubjectListItem[]>(`/subjects?exam=${examGoal}`),
        api<UserSubject[]>("/subjects/my").catch(() => [] as UserSubject[]),
      ]);
      setSubjects(all);
      const map: Record<string, number> = {};
      for (const us of my) map[us.subjectId] = us.progressPercent;
      setProgressMap(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  }, [examGoal]);

  const loadDetail = useCallback(async (subjectId: string) => {
    setDetailLoading(true);
    try {
      await api("/subjects/enroll", {
        method: "POST",
        body: JSON.stringify({ subjectId }),
      });
      const tree = await api<SubjectDetail>(`/subjects/${subjectId}/detail`);
      setDetail(tree);
      setProgressMap((m) => ({ ...m, [subjectId]: tree.progress }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load subject content");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const toggleSubject = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      setOpenTopicId(null);
      setOpenSubtopicId(null);
      return;
    }
    setExpandedId(id);
    setOpenTopicId(null);
    setOpenSubtopicId(null);
    await loadDetail(id);
  };

  const markRead = async (subtopicId: string, subjectId: string) => {
    try {
      const res = await api<{ subjectProgress: number }>(
        `/subjects/subtopics/${subtopicId}/read`,
        { method: "POST" }
      );
      setProgressMap((m) => ({ ...m, [subjectId]: res.subjectProgress }));
      await loadDetail(subjectId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to mark as read");
    }
  };

  const startQuiz = async (subtopicId: string, difficulty: Difficulty, subjectId: string) => {
    const key = `${subtopicId}-${difficulty}`;
    setGenerating(key);
    setError("");
    try {
      const quiz = await api<{ id: string; quizId?: string }>(
        `/subjects/subtopics/${subtopicId}/quiz`,
        { method: "POST", body: JSON.stringify({ difficulty }) }
      );
      const quizId = quiz.id;
      router.push(`/quizzes/${quizId}?from=subjects&subjectId=${subjectId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate quiz");
    } finally {
      setGenerating(null);
    }
  };

  const openSubtopic = async (st: Subtopic, subjectId: string) => {
    const next = openSubtopicId === st.id ? null : st.id;
    setOpenSubtopicId(next);
    if (next && !st.contentRead) {
      await markRead(st.id, subjectId);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-brand-500" />
              All Subjects
            </h1>
            <p className="text-[var(--text-secondary)] flex items-center gap-2 mt-1">
              <Target className="w-4 h-4 text-brand-500" />
              Topics, subtopics & AI quizzes for <span className="font-semibold text-brand-500">{examGoal}</span>
            </p>
          </div>

          {error && <p className="text-red-500 text-sm glass-card">{error}</p>}

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : subjects.length === 0 ? (
            <p className="glass-card text-center text-[var(--text-secondary)] py-8">
              No subjects found for {examGoal}.
            </p>
          ) : (
            <div className="space-y-4">
              {subjects.map((s, i) => {
                const isOpen = expandedId === s.id;
                const progress =
                  isOpen && detail?.id === s.id
                    ? detail.progress
                    : progressMap[s.id] ?? 0;

                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSubject(s.id)}
                      className="w-full text-left flex items-center gap-4"
                    >
                      <span className="text-4xl">{s.icon || "📚"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-lg">{s.name}</h3>
                          {isOpen ? (
                            <ChevronDown className="w-5 h-5 shrink-0 text-[var(--text-secondary)]" />
                          ) : (
                            <ChevronRight className="w-5 h-5 shrink-0 text-[var(--text-secondary)]" />
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {s.examMode || examGoal} · Click to explore topics & quizzes
                        </p>
                        <div className="mt-3">
                          <ProgressBar percent={progress} color={s.color} />
                          <p className="text-sm text-[var(--text-secondary)] mt-1">
                            {Math.round(progress)}% complete
                          </p>
                        </div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-[var(--glass-border)] mt-4 pt-4"
                        >
                          {detailLoading ? (
                            <div className="flex justify-center py-8">
                              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                            </div>
                          ) : detail?.id === s.id ? (
                            <div className="space-y-6">
                              {detail.chapters.map((ch) => (
                                <div key={ch.id}>
                                  <h4 className="font-semibold text-brand-500 mb-1">{ch.title}</h4>
                                  {ch.description && (
                                    <p className="text-xs text-[var(--text-secondary)] mb-3">{ch.description}</p>
                                  )}

                                  {ch.topics.map((topic) => (
                                    <div key={topic.id} className="mb-4 rounded-xl bg-white/30 dark:bg-gray-900/30 p-4">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setOpenTopicId(openTopicId === topic.id ? null : topic.id)
                                        }
                                        className="w-full flex items-center justify-between text-left"
                                      >
                                        <div className="flex items-center gap-2">
                                          {openTopicId === topic.id ? (
                                            <ChevronDown className="w-4 h-4" />
                                          ) : (
                                            <ChevronRight className="w-4 h-4" />
                                          )}
                                          <span className="font-medium">{topic.title}</span>
                                        </div>
                                        <span className="text-xs text-[var(--text-secondary)]">
                                          {Math.round(topic.progress)}%
                                        </span>
                                      </button>
                                      <div className="mt-2 mb-2">
                                        <ProgressBar percent={topic.progress} color={s.color} />
                                      </div>

                                      <AnimatePresence>
                                        {openTopicId === topic.id && (
                                          <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-3 mt-3"
                                          >
                                            {topic.content && (
                                              <div className="text-sm text-[var(--text-secondary)] border-l-2 border-brand-500/40 pl-3 whitespace-pre-wrap">
                                                {topic.content}
                                              </div>
                                            )}

                                            {topic.subtopics.map((st) => (
                                              <div
                                                key={st.id}
                                                className="rounded-lg border border-[var(--glass-border)] p-3"
                                              >
                                                <button
                                                  type="button"
                                                  onClick={() => openSubtopic(st, s.id)}
                                                  className="w-full flex items-center justify-between text-left"
                                                >
                                                  <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-cyan-500" />
                                                    <span className="text-sm font-medium">{st.title}</span>
                                                    {st.contentRead ? (
                                                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                    ) : (
                                                      <Circle className="w-4 h-4 text-[var(--text-secondary)]" />
                                                    )}
                                                  </div>
                                                  <span className="text-xs">{Math.round(st.progress)}%</span>
                                                </button>
                                                <div className="mt-2">
                                                  <ProgressBar percent={st.progress} color={s.color} />
                                                </div>

                                                <AnimatePresence>
                                                  {openSubtopicId === st.id && (
                                                    <motion.div
                                                      initial={{ opacity: 0, height: 0 }}
                                                      animate={{ opacity: 1, height: "auto" }}
                                                      exit={{ opacity: 0, height: 0 }}
                                                      className="mt-3 space-y-3"
                                                    >
                                                      {st.description && (
                                                        <p className="text-xs text-[var(--text-secondary)]">
                                                          {st.description}
                                                        </p>
                                                      )}
                                                      {st.content && (
                                                        <div className="text-sm bg-white/40 dark:bg-gray-800/40 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
                                                          {st.content}
                                                        </div>
                                                      )}

                                                      <div>
                                                        <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                                                          <Brain className="w-3.5 h-3.5 text-brand-500" />
                                                          AI Quizzes (3 levels)
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                          {(["EASY", "MEDIUM", "HARD"] as Difficulty[]).map(
                                                            (d) => {
                                                              const qs = st.quizzes.find(
                                                                (q) => q.difficulty === d
                                                              );
                                                              const done = qs?.completed;
                                                              const genKey = `${st.id}-${d}`;
                                                              return (
                                                                <button
                                                                  key={d}
                                                                  type="button"
                                                                  disabled={generating === genKey}
                                                                  onClick={() => startQuiz(st.id, d, s.id)}
                                                                  className={`text-xs px-3 py-2 rounded-lg font-medium transition flex items-center gap-1.5 ${
                                                                    DIFF_LABELS[d].class
                                                                  } hover:opacity-90 disabled:opacity-50`}
                                                                >
                                                                  {generating === genKey ? (
                                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                                  ) : done ? (
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                  ) : null}
                                                                  {DIFF_LABELS[d].label}
                                                                  {done && " ✓"}
                                                                </button>
                                                              );
                                                            }
                                                          )}
                                                        </div>
                                                        <p className="text-[10px] text-[var(--text-secondary)] mt-2">
                                                          Pass ≥60% to complete · Reading content adds 15% progress
                                                        </p>
                                                      </div>
                                                    </motion.div>
                                                  )}
                                                </AnimatePresence>
                                              </div>
                                            ))}
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
