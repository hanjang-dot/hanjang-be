import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, inArray } from "drizzle-orm";
import { Database, DRIZZLE } from "src/modules/database/database.module";
import {
  answers,
  examSessions,
  strokes,
  type Answer,
  type ExamSession,
  type Stroke,
} from "src/modules/database/schema";

@Injectable()
export class SessionRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  findExamSession(examSessionId: string): Promise<ExamSession | undefined> {
    return this.db.query.examSessions.findFirst({ where: eq(examSessions.examSessionId, examSessionId) });
  }

  findOngoingByUserAndPaper(userId: string, examPaperId: string): Promise<ExamSession | undefined> {
    return this.db.query.examSessions.findFirst({
      where: and(
        eq(examSessions.userId, userId),
        eq(examSessions.examPaperId, examPaperId),
        inArray(examSessions.status, ["idle", "grading"]),
      ),
      orderBy: desc(examSessions.createdAt),
    });
  }

  listByUser(userId: string): Promise<ExamSession[]> {
    return this.db
      .select()
      .from(examSessions)
      .where(eq(examSessions.userId, userId))
      .orderBy(desc(examSessions.createdAt));
  }

  async createExamSession(input: { userId: string; examPaperId: string; deadlineAt: Date }): Promise<ExamSession> {
    const [session] = await this.db.insert(examSessions).values(input).returning();
    return session;
  }

  async setStatus(examSessionId: string, status: string): Promise<ExamSession | undefined> {
    const [session] = await this.db
      .update(examSessions)
      .set({ status, updatedAt: new Date() })
      .where(eq(examSessions.examSessionId, examSessionId))
      .returning();
    return session;
  }

  async upsertAnswer(input: {
    examSessionId: string;
    questionId: string;
    choice: string;
    gradeRunId: string;
    correct: boolean;
  }): Promise<Answer> {
    const [answer] = await this.db
      .insert(answers)
      .values(input)
      .onConflictDoUpdate({
        target: [answers.examSessionId, answers.questionId],
        set: {
          choice: input.choice,
          gradeRunId: input.gradeRunId,
          correct: input.correct,
          updatedAt: new Date(),
        },
      })
      .returning();
    return answer;
  }

  async upsertAnswerChoice(input: {
    examSessionId: string;
    questionId: string;
    choice: string;
  }): Promise<Answer> {
    const [answer] = await this.db
      .insert(answers)
      .values(input)
      .onConflictDoUpdate({
        target: [answers.examSessionId, answers.questionId],
        set: { choice: input.choice, updatedAt: new Date() },
      })
      .returning();
    return answer;
  }

  listAnswers(examSessionId: string): Promise<Answer[]> {
    return this.db.select().from(answers).where(eq(answers.examSessionId, examSessionId));
  }

  async saveStroke(input: {
    examSessionId: string;
    questionId: string;
    points: { x: number; y: number }[];
  }): Promise<Stroke> {
    const [stroke] = await this.db.insert(strokes).values(input).returning();
    return stroke;
  }

  listStrokes(examSessionId: string, questionId?: string): Promise<Stroke[]> {
    return this.db
      .select()
      .from(strokes)
      .where(
        and(eq(strokes.examSessionId, examSessionId), questionId ? eq(strokes.questionId, questionId) : undefined),
      );
  }
}
