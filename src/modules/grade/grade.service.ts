import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import { CustomBadRequestException } from "src/common/errors/custom-exceptions";
import { SessionErrorMessage } from "src/modules/session/session.error";
import { ExamSessionStatus } from "src/modules/session/session.types";
import { QuestionService } from "src/modules/question/question.service";
import { QuizService } from "src/modules/quiz/quiz.service";
import { SessionService } from "src/modules/session/session.service";
import { GradeAnswerInput, GradeQuizAnswerInput } from "./grade.types";

@Injectable()
export class GradeService {
  private readonly logger = new Logger(GradeService.name);

  constructor(
    private readonly sessionService: SessionService,
    private readonly questionService: QuestionService,
    private readonly quizService: QuizService,
  ) {}

  async gradeAnswer(userId: string, input: GradeAnswerInput) {
    const session = await this.sessionService.assertOwnedSession(userId, input.examSessionId);
    if (session.status !== ExamSessionStatus.Idle && session.status !== ExamSessionStatus.Grading) {
      throw new CustomBadRequestException(SessionErrorMessage.ExamSessionClosed);
    }

    const runId = randomUUID();
    const question = await this.questionService.findQuestion(input.questionId);
    const correct = question.answer === input.choice;

    await this.sessionService.markGrading(input.examSessionId);
    await this.sessionService.saveGradedAnswer({
      examSessionId: input.examSessionId,
      questionId: input.questionId,
      choice: input.choice,
      gradeRunId: runId,
      correct,
    });

    this.logger.log(JSON.stringify({ event: "grade_answer", runId, correct }));
    return { runId, correct };
  }

  async gradeQuizAnswer(userId: string, input: GradeQuizAnswerInput) {
    await this.quizService.assertOwnedQuizSession(userId, input.quizSessionId);
    await this.quizService.markQuizSessionGrading(input.quizSessionId);

    const runId = randomUUID();
    const quiz = await this.quizService.findQuiz(input.quizId);
    const correct = quiz.answer === input.choice;

    this.logger.log(JSON.stringify({ event: "grade_quiz_answer", runId, correct }));
    return { runId, correct };
  }
}
