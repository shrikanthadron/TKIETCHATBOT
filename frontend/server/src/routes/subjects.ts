import { Router } from "express";
import { z } from "zod";
import { Difficulty, QuestionType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { generateQuizQuestions } from "../services/ai.js";
import {
  getSubjectProgressTree,
  markSubtopicContentRead,
} from "../services/progress.js";

const router = Router();

const EXAM_SUBJECT_SLUGS: Record<string, string[]> = {
  JEE: ["mathematics", "physics", "chemistry"],
  NEET: ["chemistry", "biology", "physics"],
  GATE: ["cs", "mathematics", "physics"],
  CET: ["mathematics", "physics", "chemistry", "biology"],
};

router.get("/", async (req, res) => {
  const exam = String(req.query.exam || "").toUpperCase();
  const slugs = exam ? EXAM_SUBJECT_SLUGS[exam] : undefined;

  const subjects = await prisma.subject.findMany({
    where: slugs ? { slug: { in: slugs } } : undefined,
    include: {
      chapters: {
        orderBy: { orderIndex: "asc" },
        include: {
          topics: {
            orderBy: { orderIndex: "asc" },
            include: { subtopics: { orderBy: { orderIndex: "asc" } } },
          },
        },
      },
      _count: { select: { quizzes: true } },
    },
    orderBy: slugs ? undefined : { name: "asc" },
  });

  const ordered = slugs
    ? slugs.map((slug) => subjects.find((s) => s.slug === slug)).filter(Boolean)
    : subjects;

  res.json(ordered.length ? ordered : subjects);
});

router.get("/my", authenticate, async (req, res) => {
  const userSubjects = await prisma.userSubject.findMany({
    where: { userId: req.user!.userId },
    include: {
      subject: {
        include: {
          chapters: {
            include: { topics: { include: { subtopics: true } } },
          },
        },
      },
    },
  });
  res.json(userSubjects);
});

router.get("/:id/detail", authenticate, async (req, res) => {
  const tree = await getSubjectProgressTree(req.user!.userId, String(req.params.id));
  if (!tree) return res.status(404).json({ error: "Subject not found" });
  res.json(tree);
});

router.post("/enroll", authenticate, async (req, res) => {
  const { subjectId, targetExamDate, dailyStudyHours } = req.body;
  const enrollment = await prisma.userSubject.upsert({
    where: { userId_subjectId: { userId: req.user!.userId, subjectId } },
    create: {
      userId: req.user!.userId,
      subjectId,
      targetExamDate: targetExamDate ? new Date(targetExamDate) : undefined,
      dailyStudyHours: dailyStudyHours || 2,
    },
    update: {
      targetExamDate: targetExamDate ? new Date(targetExamDate) : undefined,
      dailyStudyHours,
    },
    include: { subject: true },
  });
  res.json(enrollment);
});

router.post("/subtopics/:subtopicId/read", authenticate, async (req, res) => {
  const subtopic = await prisma.subtopic.findUnique({
    where: { id: req.params.subtopicId },
    include: { topic: { include: { chapter: true } } },
  });
  if (!subtopic) return res.status(404).json({ error: "Subtopic not found" });
  await markSubtopicContentRead(req.user!.userId, subtopic.id);
  const tree = await getSubjectProgressTree(
    req.user!.userId,
    subtopic.topic.chapter.subjectId
  );
  res.json({ success: true, subjectProgress: tree?.progress ?? 0 });
});

const quizGenSchema = z.object({
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
});

router.post("/subtopics/:subtopicId/quiz", authenticate, async (req, res) => {
  try {
    const { difficulty } = quizGenSchema.parse(req.body);
    const userId = req.user!.userId;

    const subtopic = await prisma.subtopic.findUnique({
      where: { id: req.params.subtopicId },
      include: { topic: { include: { chapter: { include: { subject: true } } } } },
    });
    if (!subtopic) return res.status(404).json({ error: "Subtopic not found" });

    const existing = await prisma.quiz.findFirst({
      where: { subtopicId: subtopic.id, difficulty, createdById: userId },
      include: { _count: { select: { questions: true } } },
    });
    if (existing && existing._count.questions > 0) {
      return res.json(existing);
    }

    const topicLabel = `${subtopic.topic.chapter.subject.name} — ${subtopic.topic.title} — ${subtopic.title}`;
    const generated = await generateQuizQuestions(
      topicLabel,
      5,
      difficulty,
      ["MCQ", "TRUE_FALSE", "FILL_BLANK"]
    );

    const quiz = await prisma.quiz.create({
      data: {
        title: `${subtopic.title} (${difficulty})`,
        description: `AI quiz: ${subtopic.title}`,
        subjectId: subtopic.topic.chapter.subjectId,
        topicId: subtopic.topicId,
        subtopicId: subtopic.id,
        createdById: userId,
        difficulty: difficulty as Difficulty,
        timeLimitSec: 300,
        questions: {
          create: generated.map((q) => ({
            type: q.type as QuestionType,
            text: q.text,
            options: q.options ?? undefined,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty as Difficulty,
          })),
        },
      },
      include: { questions: true },
    });

    res.status(201).json(quiz);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    console.error(e);
    res.status(500).json({ error: "Failed to generate quiz" });
  }
});

export default router;
