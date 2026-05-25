import { prisma } from "../lib/prisma.js";

export const ACHIEVEMENT_NAMES = {
  FIRST_STEPS: "First Steps",
  STREAK_MASTER: "Streak Master",
  QUIZ_CHAMPION: "Quiz Champion",
  NIGHT_OWL: "Night Owl",
  SUBJECT_MASTER: "Subject Master",
  FOCUS_HERO: "Focus Hero",
} as const;

export interface AwardedAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  badgeColor: string;
  earnedAt: Date;
}

async function awardIfEligible(
  userId: string,
  achievementName: string
): Promise<AwardedAchievement | null> {
  const achievement = await prisma.achievement.findUnique({
    where: { name: achievementName },
  });
  if (!achievement) return null;

  const existing = await prisma.userAchievement.findUnique({
    where: {
      userId_achievementId: { userId, achievementId: achievement.id },
    },
  });
  if (existing) return null;

  const earned = await prisma.userAchievement.create({
    data: { userId, achievementId: achievement.id },
    include: { achievement: true },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: achievement.xpReward } },
  });

  await prisma.leaderboardEntry.upsert({
    where: { userId },
    create: {
      userId,
      userName: (await prisma.user.findUnique({ where: { id: userId } }))?.name || "Student",
      xp: achievement.xpReward,
    },
    update: { xp: { increment: achievement.xpReward } },
  });

  await prisma.notification.create({
    data: {
      userId,
      title: "Achievement Unlocked!",
      message: `You earned "${achievement.name}" (+${achievement.xpReward} XP)`,
      type: "achievement",
    },
  });

  return {
    id: achievement.id,
    name: achievement.name,
    description: achievement.description,
    icon: achievement.icon,
    xpReward: achievement.xpReward,
    badgeColor: achievement.badgeColor,
    earnedAt: earned.earnedAt,
  };
}

/** Re-evaluate all achievement criteria (safe to call after any learning activity). */
export async function checkAndAwardAchievements(
  userId: string,
  context?: { accuracy?: number; activityAt?: Date }
): Promise<AwardedAchievement[]> {
  const awarded: AwardedAchievement[] = [];
  const push = async (name: string) => {
    const a = await awardIfEligible(userId, name);
    if (a) awarded.push(a);
  };

  const [attemptCount, highScoreCount, user, pomodoroCount, subjectComplete] =
    await Promise.all([
      prisma.quizAttempt.count({ where: { userId } }),
      prisma.quizAttempt.count({ where: { userId, accuracy: { gte: 90 } } }),
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.studySession.count({ where: { userId, pomodoro: true } }),
      prisma.userSubject.count({ where: { userId, progressPercent: { gte: 100 } } }),
    ]);

  if (attemptCount >= 1) await push(ACHIEVEMENT_NAMES.FIRST_STEPS);

  if (context?.accuracy !== undefined && context.accuracy >= 90) {
    await push(ACHIEVEMENT_NAMES.QUIZ_CHAMPION);
  } else if (highScoreCount >= 1) {
    await push(ACHIEVEMENT_NAMES.QUIZ_CHAMPION);
  }

  if ((user?.streakDays ?? 0) >= 7) await push(ACHIEVEMENT_NAMES.STREAK_MASTER);

  if (pomodoroCount >= 10) await push(ACHIEVEMENT_NAMES.FOCUS_HERO);

  if (subjectComplete >= 1) await push(ACHIEVEMENT_NAMES.SUBJECT_MASTER);

  const activityAt = context?.activityAt;
  let nightOwl = activityAt ? activityAt.getHours() >= 22 : false;
  if (!nightOwl) {
    const [attempts, sessions] = await Promise.all([
      prisma.quizAttempt.findMany({
        where: { userId },
        select: { completedAt: true },
        take: 100,
      }),
      prisma.studySession.findMany({
        where: { userId, pomodoro: true },
        select: { startedAt: true },
        take: 100,
      }),
    ]);
    nightOwl =
      attempts.some((a) => a.completedAt.getHours() >= 22) ||
      sessions.some((s) => s.startedAt.getHours() >= 22);
  }
  if (nightOwl) await push(ACHIEVEMENT_NAMES.NIGHT_OWL);

  return awarded;
}

export async function getAchievementsForUser(userId: string) {
  await checkAndAwardAchievements(userId);

  const [all, earned] = await Promise.all([
    prisma.achievement.findMany({ orderBy: { xpReward: "asc" } }),
    prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    }),
  ]);

  const earnedMap = new Map(
    earned.map((e) => [e.achievementId, e.earnedAt])
  );

  const achievements = all.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    icon: a.icon,
    xpReward: a.xpReward,
    badgeColor: a.badgeColor,
    earned: earnedMap.has(a.id),
    earnedAt: earnedMap.get(a.id)?.toISOString() ?? null,
  }));

  const earnedCount = achievements.filter((a) => a.earned).length;
  const xpFromAchievements = earned.reduce((s, e) => s + e.achievement.xpReward, 0);

  return {
    achievements,
    stats: {
      earned: earnedCount,
      total: achievements.length,
      xpFromAchievements,
    },
  };
}
