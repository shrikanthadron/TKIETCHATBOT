"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Lock, Loader2, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { DashboardLayout } from "@/components/ui/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  badgeColor: string;
  earned: boolean;
  earnedAt: string | null;
}

interface AchievementsResponse {
  achievements: Achievement[];
  stats: {
    earned: number;
    total: number;
    xpFromAchievements: number;
  };
}

export default function AchievementsPage() {
  const [data, setData] = useState<AchievementsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api<AchievementsResponse>("/analytics/achievements")
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load achievements"))
      .finally(() => setLoading(false));
  }, []);

  const achievements = data?.achievements ?? [];
  const stats = data?.stats;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-2">
              <Trophy className="w-8 h-8 text-amber-500" />
              Achievements & Badges
            </h1>
            <p className="text-[var(--text-secondary)]">Earn XP and unlock rewards as you learn</p>
          </div>

          {error && <p className="text-red-500 text-sm glass-card">{error}</p>}

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : (
            <>
              {stats && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="glass-card !p-4 text-center">
                    <p className="text-2xl font-bold text-brand-500">
                      {stats.earned}/{stats.total}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">Unlocked</p>
                  </div>
                  <div className="glass-card !p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-500">
                      {stats.total > 0 ? Math.round((stats.earned / stats.total) * 100) : 0}%
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">Completion</p>
                  </div>
                  <div className="glass-card !p-4 text-center">
                    <p className="text-2xl font-bold text-amber-500 flex items-center justify-center gap-1">
                      <Sparkles className="w-5 h-5" />
                      {stats.xpFromAchievements}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">XP from badges</p>
                  </div>
                </div>
              )}

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: stats
                      ? `${(stats.earned / Math.max(stats.total, 1)) * 100}%`
                      : "0%",
                  }}
                />
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.08 }}
                    className={`glass-card relative ${!a.earned ? "opacity-70" : ""}`}
                    style={
                      a.earned
                        ? { borderColor: `${a.badgeColor}40`, borderWidth: 1 }
                        : undefined
                    }
                  >
                    {!a.earned && (
                      <Lock className="absolute top-4 right-4 w-5 h-5 text-[var(--text-secondary)]" />
                    )}
                    {a.earned && (
                      <span
                        className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full"
                        style={{
                          background: `${a.badgeColor}25`,
                          color: a.badgeColor,
                        }}
                      >
                        Earned
                      </span>
                    )}
                    <span className="text-4xl">{a.icon}</span>
                    <h3 className="font-semibold mt-3">{a.name}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{a.description}</p>
                    <p className="text-xs font-medium mt-3" style={{ color: a.badgeColor }}>
                      +{a.xpReward} XP
                    </p>
                    {a.earnedAt && (
                      <p className="text-[10px] text-[var(--text-secondary)] mt-2">
                        Unlocked {new Date(a.earnedAt).toLocaleDateString()}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>

              {achievements.length === 0 && (
                <p className="glass-card text-center text-[var(--text-secondary)] py-8">
                  No achievements in database. Run <code className="text-brand-500">npm run db:seed</code> in backend.
                </p>
              )}

              <div className="glass-card text-sm text-[var(--text-secondary)] space-y-1">
                <p className="font-semibold text-[var(--text-primary)]">How to unlock</p>
                <p>🎯 First Steps — complete any quiz</p>
                <p>🔥 Streak Master — study 7 days in a row (Pomodoro on planner)</p>
                <p>🏆 Quiz Champion — score 90% or higher on a quiz</p>
                <p>🦉 Night Owl — study after 10 PM</p>
                <p>📚 Subject Master — reach 100% on any subject</p>
                <p>⏱️ Focus Hero — complete 10 Pomodoro sessions</p>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
