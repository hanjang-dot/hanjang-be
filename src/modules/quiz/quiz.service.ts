import { Injectable } from "@nestjs/common";
import {
  CustomBadRequestException,
  CustomForbiddenException,
  CustomNotFoundException,
} from "src/common/errors/custom-exceptions";
import { QuizErrorMessage } from "./quiz.error";
import { QuizRepository } from "./quiz.repository";
import { AddQuizInput, QuizDirection, QuizSessionStatus, QuizType } from "./quiz.types";

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

  private validateAddQuizInput(input: AddQuizInput) {
    if (input.choices.length !== QUIZ_CHOICE_COUNT[input.type]) {
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
