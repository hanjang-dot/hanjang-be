import { Injectable } from "@nestjs/common";
import { CustomConflictException, CustomNotFoundException } from "src/common/errors/custom-exceptions";
import { isPgError } from "src/common/errors/pg-error";
import { ExamErrorMessage } from "./exam.error";
import { ExamRepository } from "./exam.repository";
import { CreateExamPaperInput, UpdateExamPaperInput } from "./exam.types";

@Injectable()
export class ExamService {
  constructor(private readonly examRepository: ExamRepository) {}

  listExamPapers(published?: boolean) {
    return this.examRepository.listExamPapers(published);
  }

  async findExamPaper(examPaperId: string) {
    const examPaper = await this.examRepository.findExamPaper(examPaperId);
    if (!examPaper) throw new CustomNotFoundException(ExamErrorMessage.ExamPaperNotFound);
    return examPaper;
  }

  async findPublishedExamPaper(examPaperId: string) {
    const examPaper = await this.findExamPaper(examPaperId);
    if (!examPaper.publishedAt) throw new CustomNotFoundException(ExamErrorMessage.ExamPaperNotFound);
    return examPaper;
  }

  createExamPaper(input: CreateExamPaperInput) {
    return this.examRepository.createExamPaper(input);
  }

  async setPublished(examPaperId: string, published: boolean) {
    const examPaper = await this.examRepository.setPublished(examPaperId, published);
    if (!examPaper) throw new CustomNotFoundException(ExamErrorMessage.ExamPaperNotFound);
    return examPaper;
  }

  async updateExamPaper(input: UpdateExamPaperInput) {
    const { examPaperId, ...fields } = input;
    const examPaper = await this.examRepository.updateExamPaper(examPaperId, fields);
    if (!examPaper) throw new CustomNotFoundException(ExamErrorMessage.ExamPaperNotFound);
    return examPaper;
  }

  async deleteExamPaper(examPaperId: string) {
    let deleted: boolean;
    try {
      deleted = await this.examRepository.deleteExamPaper(examPaperId);
    } catch (error) {
      if (isPgError(error, "23503")) throw new CustomConflictException(ExamErrorMessage.ExamPaperInUse);
      throw error;
    }
    if (!deleted) throw new CustomNotFoundException(ExamErrorMessage.ExamPaperNotFound);
    return { deleted: true };
  }
}
