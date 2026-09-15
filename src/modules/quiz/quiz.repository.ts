import { Inject, Injectable } from "@nestjs/common";
import { desc, eq, isNotNull, isNull } from "drizzle-orm";
import { Database, DRIZZLE } from "src/modules/database/database.module";
import { quizzes, quizSessions, type Quiz, type QuizSession } from "src/modules/database/schema";
import { AddQuizInput } from "./quiz.types";

@Injectable()
export class QuizRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  listQuizzes(published?: boolean): Promise<Quiz[]> {
    return this.db
      .select()
      .from(quizzes)
      .where(
        published === undefined ? undefined : published ? isNotNull(quizzes.publishedAt) : isNull(quizzes.publishedAt),
      )
      .orderBy(desc(quizzes.createdAt));
  }

  findQuiz(quizId: string): Promise<Quiz | undefined> {
    return this.db.query.quizzes.findFirst({ where: eq(quizzes.quizId, quizId) });
  }

  findQuizSession(quizSessionId: string): Promise<QuizSession | undefined> {
    return this.db.query.quizSessions.findFirst({ where: eq(quizSessions.quizSessionId, quizSessionId) });
  }

  async addQuiz(input: AddQuizInput): Promise<Quiz> {
    const [quiz] = await this.db.insert(quizzes).values(input).returning();
    return quiz;
  }

  async setPublished(quizId: string, published: boolean): Promise<Quiz | undefined> {
    const [quiz] = await this.db
      .update(quizzes)
      .set({ publishedAt: published ? new Date() : null, updatedAt: new Date() })
      .where(eq(quizzes.quizId, quizId))
      .returning();
    return quiz;
  }

  async createQuizSession(input: { userId: string; quizIds: string[] }): Promise<QuizSession> {
    const [session] = await this.db.insert(quizSessions).values(input).returning();
    return session;
  }

  async setQuizSessionStatus(quizSessionId: string, status: string): Promise<QuizSession | undefined> {
    const [session] = await this.db
      .update(quizSessions)
      .set({ status, updatedAt: new Date() })
      .where(eq(quizSessions.quizSessionId, quizSessionId))
      .returning();
    return session;
  }
}
