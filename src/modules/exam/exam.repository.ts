import { Inject, Injectable } from "@nestjs/common";
import { desc, eq, isNotNull, isNull } from "drizzle-orm";
import { Database, DRIZZLE } from "src/modules/database/database.module";
import { examPapers, type ExamPaper } from "src/modules/database/schema";
import { CreateExamPaperInput, UpdateExamPaperInput } from "./exam.types";

@Injectable()
export class ExamRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  listExamPapers(published?: boolean): Promise<ExamPaper[]> {
    return this.db
      .select()
      .from(examPapers)
      .where(
        published === undefined
          ? undefined
          : published
            ? isNotNull(examPapers.publishedAt)
            : isNull(examPapers.publishedAt),
      )
      .orderBy(desc(examPapers.createdAt));
  }

  findExamPaper(examPaperId: string): Promise<ExamPaper | undefined> {
    return this.db.query.examPapers.findFirst({ where: eq(examPapers.examPaperId, examPaperId) });
  }

  async createExamPaper(input: CreateExamPaperInput): Promise<ExamPaper> {
    const [examPaper] = await this.db.insert(examPapers).values(input).returning();
    return examPaper;
  }

  async setPublished(examPaperId: string, published: boolean): Promise<ExamPaper | undefined> {
    const [examPaper] = await this.db
      .update(examPapers)
      .set({ publishedAt: published ? new Date() : null, updatedAt: new Date() })
      .where(eq(examPapers.examPaperId, examPaperId))
      .returning();
    return examPaper;
  }

  async updateExamPaper(
    examPaperId: string,
    input: Omit<UpdateExamPaperInput, "examPaperId">,
  ): Promise<ExamPaper | undefined> {
    const [examPaper] = await this.db
      .update(examPapers)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(examPapers.examPaperId, examPaperId))
      .returning();
    return examPaper;
  }

  async deleteExamPaper(examPaperId: string): Promise<boolean> {
    const rows = await this.db
      .delete(examPapers)
      .where(eq(examPapers.examPaperId, examPaperId))
      .returning({ examPaperId: examPapers.examPaperId });
    return rows.length > 0;
  }
}
