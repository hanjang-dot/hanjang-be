import { Injectable } from "@nestjs/common";
import {
  CustomBadRequestException,
  CustomConflictException,
  CustomNotFoundException,
} from "src/common/errors/custom-exceptions";
import { isPgError } from "src/common/errors/pg-error";
import { QuestionErrorMessage } from "./question.error";
import { QuestionRepository } from "./question.repository";
import { AddQuestionInput, UpdateQuestionInput } from "./question.types";

@Injectable()
export class QuestionService {
  constructor(private readonly questionRepository: QuestionRepository) {}

  listByExamPaper(examPaperId: string) {
    return this.questionRepository.listByExamPaper(examPaperId);
  }

  async findQuestion(questionId: string) {
    const question = await this.questionRepository.findQuestion(questionId);
    if (!question) throw new CustomNotFoundException(QuestionErrorMessage.QuestionNotFound);
    return question;
  }

  async addQuestion(input: AddQuestionInput) {
    this.validateAddQuestionInput(input);
    try {
      return await this.questionRepository.addQuestion(input);
    } catch (error) {
      if (isPgError(error, "23505")) throw new CustomConflictException(QuestionErrorMessage.DuplicateQuestionNumber);
      if (isPgError(error, "23503")) throw new CustomBadRequestException(QuestionErrorMessage.InvalidExamPaper);
      throw error;
    }
  }

  async updateQuestion(input: UpdateQuestionInput) {
    const existing = await this.findQuestion(input.questionId);
    const merged = { ...existing, ...input };
    this.validateAddQuestionInput(merged);
    try {
      return await this.questionRepository.updateQuestion(input.questionId, {
        number: input.number,
        prompt: input.prompt,
        passageImageUrl: input.passageImageUrl,
        choices: input.choices,
        answer: input.answer,
      });
    } catch (error) {
      if (isPgError(error, "23505")) throw new CustomConflictException(QuestionErrorMessage.DuplicateQuestionNumber);
      throw error;
    }
  }

  async deleteQuestion(questionId: string) {
    let deleted: boolean;
    try {
      deleted = await this.questionRepository.deleteQuestion(questionId);
    } catch (error) {
      if (isPgError(error, "23503")) throw new CustomConflictException(QuestionErrorMessage.QuestionInUse);
      throw error;
    }
    if (!deleted) throw new CustomNotFoundException(QuestionErrorMessage.QuestionNotFound);
    return { deleted: true };
  }

  private validateAddQuestionInput(input: { choices: string[]; answer: string }) {
    if (input.choices.length < 2 || input.choices.length > 6) {
      throw new CustomBadRequestException(QuestionErrorMessage.InvalidChoices);
    }
    if (!input.choices.includes(input.answer)) {
      throw new CustomBadRequestException(QuestionErrorMessage.AnswerNotInChoices);
    }
  }
}
