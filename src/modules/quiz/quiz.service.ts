import { Injectable } from "@nestjs/common";
import {
  CustomBadRequestException,
  CustomForbiddenException,
  CustomNotFoundException,
} from "src/common/errors/custom-exceptions";
import { QuizErrorMessage } from "./quiz.error";
import { QuizRepository } from "./quiz.repository";
import { AddQuizInput, QuizDirection, QuizSessionStatus, QuizType, UpdateQuizInput } from "./quiz.types";

const TODAY_QUIZ_SET_SIZE = 10;

const QUIZ_CHOICE_COUNT: Record<QuizType, number> = {
  [QuizType.Ox]: 2,
  [QuizType.Cloze]: 5,
  [QuizType.Word]: 6,
  [QuizType.History]: 5,
};

@Injectable()
export class QuizService {
  constructor(private readonly quizRepository: QuizRepository) {}

  listQuizzes(published?: boolean) {
    return this.quizRepository.listQuizzes(published);
  }

  async findQuiz(quizId: string) {
    const quiz = await this.quizRepository.findQuiz(quizId);
    if (!quiz) throw new CustomNotFoundException(QuizErrorMessage.QuizNotFound);
    return quiz;
  }

  async todayQuizSet() {
    const quizzes = await this.quizRepository.listQuizzes(true);
    let wordIndex = 0;
    return quizzes.slice(0, TODAY_QUIZ_SET_SIZE).map((quiz) => {
      if (quiz.type !== QuizType.Word || quiz.direction) return quiz;
      const direction = wordIndex % 2 === 0 ? QuizDirection.EnKo : QuizDirection.KoEn;
      wordIndex += 1;
      return { ...quiz, direction };
    });
  }

  startQuizSession(userId: string, quizIds: string[]) {
    return this.quizRepository.createQuizSession({ userId, quizIds });
  }

  async submitQuizSession(userId: string, quizSessionId: string) {
    const session = await this.assertOwnedQuizSession(userId, quizSessionId);
    if (session.status === QuizSessionStatus.Graded || session.status === QuizSessionStatus.Aborted) {
      throw new CustomBadRequestException(QuizErrorMessage.QuizSessionClosed);
    }
    return this.quizRepository.setQuizSessionStatus(quizSessionId, QuizSessionStatus.Graded);
  }

  async assertOwnedQuizSession(userId: string, quizSessionId: string) {
    const session = await this.quizRepository.findQuizSession(quizSessionId);
    if (!session) throw new CustomNotFoundException(QuizErrorMessage.QuizSessionNotFound);
    if (session.userId !== userId) throw new CustomForbiddenException(QuizErrorMessage.QuizSessionNotOwned);
    return session;
  }

  async markQuizSessionGrading(quizSessionId: string) {
    const session = await this.quizRepository.findQuizSession(quizSessionId);
    if (session?.status === QuizSessionStatus.Idle) {
      await this.quizRepository.setQuizSessionStatus(quizSessionId, QuizSessionStatus.Grading);
    }
  }

  async addQuiz(input: AddQuizInput) {
    this.validateAddQuizInput(input);
    return this.quizRepository.addQuiz(input);
  }

  async setPublished(quizId: string, published: boolean) {
    const quiz = await this.quizRepository.setPublished(quizId, published);
    if (!quiz) throw new CustomNotFoundException(QuizErrorMessage.QuizNotFound);
    return quiz;
  }

  async updateQuiz(input: UpdateQuizInput) {
    const existing = await this.findQuiz(input.quizId);
    const merged = {
      type: (input.type ?? existing.type) as QuizType,
      prompt: input.prompt ?? existing.prompt,
      choices: input.choices ?? existing.choices,
      answer: input.answer ?? existing.answer,
      direction: input.direction === undefined ? existing.direction : input.direction,
    };
    this.validateAddQuizInput(merged);
    return this.quizRepository.updateQuiz(input.quizId, {
      ...merged,
      direction: merged.direction ?? null,
    });
  }

  async deleteQuiz(quizId: string) {
    const deleted = await this.quizRepository.deleteQuiz(quizId);
    if (!deleted) throw new CustomNotFoundException(QuizErrorMessage.QuizNotFound);
    return { deleted: true };
  }

  private validateAddQuizInput(input: { type: string; choices: string[]; answer: string; direction?: string | null }) {
    if (input.choices.length !== QUIZ_CHOICE_COUNT[input.type as QuizType]) {
      throw new CustomBadRequestException(QuizErrorMessage.InvalidQuizChoices);
    }
    if (!input.choices.includes(input.answer)) {
      throw new CustomBadRequestException(QuizErrorMessage.AnswerNotInChoices);
    }
    if (input.direction && input.type !== QuizType.Word) {
      throw new CustomBadRequestException(QuizErrorMessage.DirectionOnlyForWord);
    }
  }
}
