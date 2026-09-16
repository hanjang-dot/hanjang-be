import { describe, expect, it, jest } from "@jest/globals";
import { QuestionService } from "src/modules/question/question.service";
import { QuizService } from "src/modules/quiz/quiz.service";
import { QuizSessionStatus } from "src/modules/quiz/quiz.types";
import { SessionService } from "src/modules/session/session.service";
import { ExamSessionStatus } from "src/modules/session/session.types";
import { GradeService } from "./grade.service";

const createService = (options: { sessionStatus?: ExamSessionStatus; quizSessionStatus?: QuizSessionStatus } = {}) => {
  const session = {
    examSessionId: "session-1",
    userId: "user-1",
    status: options.sessionStatus ?? ExamSessionStatus.Idle,
  };
  const quizSession = {
    quizSessionId: "quiz-session-1",
    userId: "user-1",
    status: options.quizSessionStatus ?? QuizSessionStatus.Idle,
  };
  const sessionService = {
    assertOwnedSession: jest.fn(async () => session),
    markGrading: jest.fn(async () => undefined),
    saveGradedAnswer: jest.fn(async () => ({})),
  } as unknown as SessionService;
  const questionService = {
    findQuestion: jest.fn(async () => ({ questionId: "q-1", answer: "a" })),
  } as unknown as QuestionService;
  const quizService = {
    assertOwnedQuizSession: jest.fn(async () => quizSession),
    markQuizSessionGrading: jest.fn(async () => undefined),
    findQuiz: jest.fn(async () => ({ quizId: "quiz-1", answer: "a" })),
  } as unknown as QuizService;
  return { service: new GradeService(sessionService, questionService, quizService), quizService };
};

describe("GradeService.gradeAnswer", () => {
  it("종료된 시험 세션은 400이다", async () => {
    const { service } = createService({ sessionStatus: ExamSessionStatus.Graded });
    await expect(
      service.gradeAnswer("user-1", { examSessionId: "session-1", questionId: "q-1", choice: "a" }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("정답 여부를 반환한다", async () => {
    const { service } = createService();
    await expect(
      service.gradeAnswer("user-1", { examSessionId: "session-1", questionId: "q-1", choice: "a" }),
    ).resolves.toMatchObject({ correct: true });
    await expect(
      service.gradeAnswer("user-1", { examSessionId: "session-1", questionId: "q-1", choice: "b" }),
    ).resolves.toMatchObject({ correct: false });
  });
});

describe("GradeService.gradeQuizAnswer", () => {
  it("종료된 퀴즈 세션은 400이다", async () => {
    for (const quizSessionStatus of [QuizSessionStatus.Graded, QuizSessionStatus.Aborted]) {
      const { service } = createService({ quizSessionStatus });
      await expect(
        service.gradeQuizAnswer("user-1", { quizSessionId: "quiz-session-1", quizId: "quiz-1", choice: "a" }),
      ).rejects.toMatchObject({ status: 400 });
    }
  });

  it("정답 여부를 반환한다", async () => {
    const { service } = createService();
    await expect(
      service.gradeQuizAnswer("user-1", { quizSessionId: "quiz-session-1", quizId: "quiz-1", choice: "a" }),
    ).resolves.toMatchObject({ correct: true });
  });
});
