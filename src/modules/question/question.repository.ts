import { Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { Database, DRIZZLE } from "src/modules/database/database.module";
import { questions, type Question } from "src/modules/database/schema";
import { AddQuestionInput } from "./question.types";

@Injectable()
export class QuestionRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  findQuestion(questionId: string): Promise<Question | undefined> {
    return this.db.query.questions.findFirst({ where: eq(questions.questionId, questionId) });
  }

  listByExamPaper(examPaperId: string): Promise<Question[]> {
    return this.db
      .select()
      .from(questions)
      .where(eq(questions.examPaperId, examPaperId))
      .orderBy(asc(questions.number));
  }

  async addQuestion(input: AddQuestionInput): Promise<Question> {
    const [question] = await this.db.insert(questions).values(input).returning();
    return question;
  }

  async updateQuestion(
    questionId: string,
    input: Partial<Pick<Question, "number" | "prompt" | "passageImageUrl" | "choices" | "answer">>,
  ): Promise<Question | undefined> {
    const [question] = await this.db
      .update(questions)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(questions.questionId, questionId))
      .returning();
    return question;
  }
}
