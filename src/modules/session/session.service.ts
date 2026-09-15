import { Injectable } from "@nestjs/common";
import {
  CustomBadRequestException,
  CustomForbiddenException,
  CustomNotFoundException,
} from "src/common/errors/custom-exceptions";
import { ExamService } from "src/modules/exam/exam.service";
import { SessionErrorMessage } from "./session.error";
import { SessionRepository } from "./session.repository";
import { ExamSessionStatus, SaveStrokeDraftInput, StartExamSessionInput } from "./session.types";

@Injectable()
export class SessionService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly examService: ExamService,
  ) {}

  myExamSessions(userId: string) {
    return this.sessionRepository.listByUser(userId);
  }

  examSession(userId: string, examSessionId: string) {
    return this.assertOwnedSession(userId, examSessionId);
  }

  ongoingExamSession(userId: string, examPaperId: string) {
    return this.sessionRepository.findOngoingByUserAndPaper(userId, examPaperId);
  }

  async submitExamSession(userId: string, examSessionId: string) {
    const session = await this.assertOwnedSession(userId, examSessionId);
    if (session.status === ExamSessionStatus.Graded || session.status === ExamSessionStatus.Aborted) {
      throw new CustomBadRequestException(SessionErrorMessage.ExamSessionClosed);
    }
    return this.sessionRepository.setStatus(examSessionId, ExamSessionStatus.Graded);
  }

  listAnswers(examSessionId: string) {
    return this.sessionRepository.listAnswers(examSessionId);
  }

  listStrokes(examSessionId: string) {
    return this.sessionRepository.listStrokes(examSessionId);
  }

  async startExamSession(userId: string, input: StartExamSessionInput) {
    const examPaper = await this.examService.findPublishedExamPaper(input.examPaperId);
    return this.sessionRepository.createExamSession({
      userId,
      examPaperId: examPaper.examPaperId,
      deadlineAt: new Date(Date.now() + examPaper.timeLimitSec * 1000),
    });
  }

  async abortExamSession(userId: string, examSessionId: string) {
    const session = await this.assertOwnedSession(userId, examSessionId);
    if (session.status === ExamSessionStatus.Graded || session.status === ExamSessionStatus.Aborted) {
      throw new CustomBadRequestException(SessionErrorMessage.ExamSessionClosed);
    }
    return this.sessionRepository.setStatus(examSessionId, ExamSessionStatus.Aborted);
  }

  async saveStrokeDraft(userId: string, input: SaveStrokeDraftInput & { examSessionId: string }) {
    const session = await this.assertOwnedSession(userId, input.examSessionId);
    if (session.status !== ExamSessionStatus.Idle && session.status !== ExamSessionStatus.Grading) {
      throw new CustomBadRequestException(SessionErrorMessage.ExamSessionClosed);
    }
    return this.sessionRepository.saveStroke(input);
  }

  async assertOwnedSession(userId: string, examSessionId: string) {
    const session = await this.sessionRepository.findExamSession(examSessionId);
    if (!session) throw new CustomNotFoundException(SessionErrorMessage.ExamSessionNotFound);
    if (session.userId !== userId) throw new CustomForbiddenException(SessionErrorMessage.ExamSessionNotOwned);
    return session;
  }

  async markGrading(examSessionId: string) {
    const session = await this.sessionRepository.findExamSession(examSessionId);
    if (session?.status === ExamSessionStatus.Idle) {
      await this.sessionRepository.setStatus(examSessionId, ExamSessionStatus.Grading);
    }
  }

  async saveAnswer(userId: string, examSessionId: string, input: { questionId: string; choice: string }) {
    const session = await this.assertOwnedSession(userId, examSessionId);
    if (session.status !== ExamSessionStatus.Idle && session.status !== ExamSessionStatus.Grading) {
      throw new CustomBadRequestException(SessionErrorMessage.ExamSessionClosed);
    }
    return this.sessionRepository.upsertAnswerChoice({ examSessionId, ...input });
  }

  saveGradedAnswer(input: {
    examSessionId: string;
    questionId: string;
    choice: string;
    gradeRunId: string;
    correct: boolean;
  }) {
    return this.sessionRepository.upsertAnswer(input);
  }
}
