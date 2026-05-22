import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CURRICULUM } from "./curriculum.js";

const prisma = new PrismaClient();

async function seedCurriculum() {
  const subjects = [
    { name: "Mathematics", slug: "mathematics", color: "#6366f1", examMode: "JEE", icon: "📐" },
    { name: "Physics", slug: "physics", color: "#8b5cf6", examMode: "JEE", icon: "⚛️" },
    { name: "Chemistry", slug: "chemistry", color: "#06b6d4", examMode: "NEET", icon: "🧪" },
    { name: "Biology", slug: "biology", color: "#10b981", examMode: "NEET", icon: "🧬" },
    { name: "Computer Science", slug: "cs", color: "#f59e0b", examMode: "GATE", icon: "💻" },
  ];

  for (const s of subjects) {
    const subject = await prisma.subject.upsert({
      where: { slug: s.slug },
      update: { name: s.name, color: s.color, examMode: s.examMode, icon: s.icon },
      create: s,
    });

    const chapters = CURRICULUM[s.slug];
    if (!chapters) continue;

    await prisma.chapter.deleteMany({ where: { subjectId: subject.id } });

    for (let ci = 0; ci < chapters.length; ci++) {
      const chData = chapters[ci];
      const chapter = await prisma.chapter.create({
        data: {
          subjectId: subject.id,
          title: chData.title,
          description: chData.description,
          orderIndex: ci,
        },
      });

      for (let ti = 0; ti < chData.topics.length; ti++) {
        const tData = chData.topics[ti];
        const topic = await prisma.topic.create({
          data: {
            chapterId: chapter.id,
            title: tData.title,
            description: tData.description,
            content: tData.content,
            orderIndex: ti,
          },
        });

        for (let si = 0; si < tData.subtopics.length; si++) {
          const stData = tData.subtopics[si];
          await prisma.subtopic.create({
            data: {
              topicId: topic.id,
              title: stData.title,
              description: stData.description,
              content: stData.content,
              orderIndex: si,
            },
          });
        }
      }
    }
  }
}

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const student = await prisma.user.upsert({
    where: { email: "student@learniq.com" },
    update: {},
    create: {
      email: "student@learniq.com",
      passwordHash,
      name: "Alex Rivera",
      role: "STUDENT",
      xp: 1250,
      level: 5,
      streakDays: 12,
      goals: { exam: "JEE", dailyHours: 3, target: "IIT" },
    },
  });

  await prisma.user.upsert({
    where: { email: "teacher@learniq.com" },
    update: {},
    create: {
      email: "teacher@learniq.com",
      passwordHash,
      name: "Dr. Sarah Chen",
      role: "TEACHER",
      xp: 500,
      level: 3,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@learniq.com" },
    update: {},
    create: {
      email: "admin@learniq.com",
      passwordHash,
      name: "Admin User",
      role: "ADMIN",
    },
  });

  await seedCurriculum();

  const subjects = await prisma.subject.findMany();
  for (const subject of subjects) {
    await prisma.userSubject.upsert({
      where: { userId_subjectId: { userId: student.id, subjectId: subject.id } },
      update: {},
      create: {
        userId: student.id,
        subjectId: subject.id,
        progressPercent: 0,
        dailyStudyHours: 2,
      },
    });
  }

  const achievements = [
    { name: "First Steps", description: "Complete your first quiz", icon: "🎯", xpReward: 50, badgeColor: "#10b981" },
    { name: "Streak Master", description: "7-day study streak", icon: "🔥", xpReward: 100, badgeColor: "#f59e0b" },
    { name: "Quiz Champion", description: "Score 90%+ on a quiz", icon: "🏆", xpReward: 150, badgeColor: "#6366f1" },
    { name: "Night Owl", description: "Study after 10 PM", icon: "🦉", xpReward: 75, badgeColor: "#8b5cf6" },
    { name: "Subject Master", description: "Complete 100% of a subject", icon: "📚", xpReward: 200, badgeColor: "#06b6d4" },
    { name: "Focus Hero", description: "Complete 10 Pomodoro sessions", icon: "⏱️", xpReward: 80, badgeColor: "#ec4899" },
  ];

  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { name: a.name },
      update: a,
      create: a,
    });
  }

  await prisma.leaderboardEntry.upsert({
    where: { userId: student.id },
    update: { xp: 1250, userName: student.name, rank: 1 },
    create: { userId: student.id, userName: student.name, xp: 1250, rank: 1 },
  });

  await prisma.notification.deleteMany({ where: { userId: student.id } });
  await prisma.notification.createMany({
    data: [
      { userId: student.id, title: "Start Learning", message: "Explore subjects with topics and AI quizzes", type: "info" },
      { userId: student.id, title: "Streak Alert", message: "Keep your study streak going!", type: "streak" },
    ],
  });

  console.log("Seed complete:");
  console.log("  student@learniq.com / password123");
  console.log("  teacher@learniq.com / password123");
  console.log("  admin@learniq.com / password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
