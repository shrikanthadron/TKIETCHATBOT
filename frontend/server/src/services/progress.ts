import { Difficulty } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { checkAndAwardAchievements } from "./achievements.js";

const PASS_THRESHOLD = 60;
const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

export async function recordSubtopicQuizProgress(
  userId: string,
  subtopicId: string,
  difficulty: Difficulty,
  accuracy: number
) {
  const passed = accuracy >= PASS_THRESHOLD;
  const entityId = `${subtopicId}:${difficulty}`;

  const existing = await prisma.progressRecord.findUnique({
    where: { userId_entityType_entityId: { userId, entityType: "subtopic_quiz", entityId } },
  });

  const percent = passed ? 100 : Math.max(existing?.percent ?? 0, Math.round(accuracy));
  await prisma.progressRecord.upsert({
    where: { userId_entityType_entityId: { userId, entityType: "subtopic_quiz", entityId } },
    create: {
      userId,
      entityType: "subtopic_quiz",
      entityId,
      percent,
      completed: passed,
    },
    update: {
      percent: passed ? 100 : Math.max(existing?.percent ?? 0, percent),
      completed: passed || (existing?.completed ?? false),
    },
  });

  await syncTopicAndSubjectProgress(userId, subtopicId);
}

export async function markSubtopicContentRead(userId: string, subtopicId: string) {
  const entityId = `${subtopicId}:read`;
  await prisma.progressRecord.upsert({
    where: { userId_entityType_entityId: { userId, entityType: "subtopic_read", entityId } },
    create: {
      userId,
      entityType: "subtopic_read",
      entityId,
      percent: 100,
      completed: true,
    },
    update: { percent: 100, completed: true },
  });
  await syncTopicAndSubjectProgress(userId, subtopicId);
}

async function syncTopicAndSubjectProgress(userId: string, subtopicId: string) {
  const subtopic = await prisma.subtopic.findUnique({
    where: { id: subtopicId },
    include: { topic: { include: { chapter: true } } },
  });
  if (!subtopic) return;

  const topicId = subtopic.topicId;
  const subjectId = subtopic.topic.chapter.subjectId;

  const subtopics = await prisma.subtopic.findMany({
    where: { topicId },
    orderBy: { orderIndex: "asc" },
  });

  let topicTotal = 0;
  let topicDone = 0;

  for (const st of subtopics) {
    const stPercent = await getSubtopicProgressPercent(userId, st.id);
    topicTotal += 100;
    topicDone += stPercent;
  }

  const topicPercent = subtopics.length ? topicDone / subtopics.length : 0;
  await prisma.progressRecord.upsert({
    where: { userId_entityType_entityId: { userId, entityType: "topic", entityId: topicId } },
    create: {
      userId,
      entityType: "topic",
      entityId: topicId,
      percent: topicPercent,
      completed: topicPercent >= 100,
    },
    update: { percent: topicPercent, completed: topicPercent >= 100 },
  });

  const chapters = await prisma.chapter.findMany({
    where: { subjectId },
    include: { topics: { include: { subtopics: true } } },
  });

  let subjectTotal = 0;
  let subjectDone = 0;

  for (const ch of chapters) {
    for (const t of ch.topics) {
      const records = await prisma.progressRecord.findMany({
        where: { userId, entityType: "topic", entityId: t.id },
      });
      const tp = records[0]?.percent ?? 0;
      subjectTotal += 100;
      subjectDone += tp;
    }
  }

  const pct = subjectTotal > 0 ? (subjectDone / subjectTotal) * 100 : 0;

  await prisma.userSubject.upsert({
    where: { userId_subjectId: { userId, subjectId } },
    create: { userId, subjectId, progressPercent: pct },
    update: { progressPercent: pct },
  });

  await prisma.progressRecord.upsert({
    where: { userId_entityType_entityId: { userId, entityType: "subject", entityId: subjectId } },
    create: {
      userId,
      entityType: "subject",
      entityId: subjectId,
      percent: pct,
      completed: pct >= 100,
    },
    update: { percent: pct, completed: pct >= 100 },
  });

  if (pct >= 100) {
    await checkAndAwardAchievements(userId);
  }
}

export async function getSubtopicProgressPercent(userId: string, subtopicId: string): Promise<number> {
  const read = await prisma.progressRecord.findUnique({
    where: {
      userId_entityType_entityId: {
        userId,
        entityType: "subtopic_read",
        entityId: `${subtopicId}:read`,
      },
    },
  });

  const quizPercents: number[] = [];
  for (const d of DIFFICULTIES) {
    const rec = await prisma.progressRecord.findUnique({
      where: {
        userId_entityType_entityId: {
          userId,
          entityType: "subtopic_quiz",
          entityId: `${subtopicId}:${d}`,
        },
      },
    });
    quizPercents.push(rec?.completed ? 100 : rec?.percent ?? 0);
  }

  const readWeight = read?.completed ? 15 : 0;
  const quizWeight = quizPercents.reduce((s, p) => s + p, 0) / DIFFICULTIES.length;
  const quizScaled = (quizWeight / 100) * 85;
  return Math.min(100, Math.round(readWeight + quizScaled));
}

export async function getSubjectProgressTree(userId: string, subjectId: string) {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      chapters: {
        orderBy: { orderIndex: "asc" },
        include: {
          topics: {
            orderBy: { orderIndex: "asc" },
            include: {
              subtopics: { orderBy: { orderIndex: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!subject) return null;

  const chapters = await Promise.all(
    subject.chapters.map(async (ch) => ({
      ...ch,
      topics: await Promise.all(
        ch.topics.map(async (t) => {
          const subtopics = await Promise.all(
            t.subtopics.map(async (st) => {
              const progress = await getSubtopicProgressPercent(userId, st.id);
              const quizStatus = await Promise.all(
                DIFFICULTIES.map(async (d) => {
                  const rec = await prisma.progressRecord.findUnique({
                    where: {
                      userId_entityType_entityId: {
                        userId,
                        entityType: "subtopic_quiz",
                        entityId: `${st.id}:${d}`,
                      },
                    },
                  });
                  const quiz = await prisma.quiz.findFirst({
                    where: { subtopicId: st.id, difficulty: d, createdById: userId },
                    select: { id: true },
                  });
                  return {
                    difficulty: d,
                    completed: rec?.completed ?? false,
                    percent: rec?.percent ?? 0,
                    quizId: quiz?.id ?? null,
                  };
                })
              );
              const read = await prisma.progressRecord.findUnique({
                where: {
                  userId_entityType_entityId: {
                    userId,
                    entityType: "subtopic_read",
                    entityId: `${st.id}:read`,
                  },
                },
              });
              return {
                ...st,
                progress,
                contentRead: read?.completed ?? false,
                quizzes: quizStatus,
              };
            })
          );
          const topicProgress = subtopics.length
            ? Math.round(subtopics.reduce((s, st) => s + st.progress, 0) / subtopics.length)
            : 0;
          return { ...t, progress: topicProgress, subtopics };
        })
      ),
    }))
  );

  const allSubtopics = chapters.flatMap((c) => c.topics.flatMap((t) => t.subtopics));
  const subjectProgress = allSubtopics.length
    ? Math.round(allSubtopics.reduce((s, st) => s + st.progress, 0) / allSubtopics.length)
    : 0;

  return { ...subject, chapters, progress: subjectProgress };
}
