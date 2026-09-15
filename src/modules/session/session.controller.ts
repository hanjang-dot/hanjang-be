import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAccessTokenGuard } from "src/guards/accessToken.guard";
import { AuthRequest } from "src/modules/auth/auth.types";
import { SessionService } from "./session.service";
import { SaveAnswerInput, SaveStrokeDraftInput, StartExamSessionInput } from "./session.types";

@UseGuards(JwtAccessTokenGuard)
@Controller("sessions")
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  start(@Req() req: AuthRequest, @Body() input: StartExamSessionInput) {
    return this.sessionService.startExamSession(req.user.userId, input);
  }

  @Get()
  list(@Req() req: AuthRequest) {
    return this.sessionService.myExamSessions(req.user.userId);
  }

  @Get("ongoing")
  ongoing(@Req() req: AuthRequest, @Query("examPaperId") examPaperId: string) {
    return this.sessionService.ongoingExamSession(req.user.userId, examPaperId);
  }

  @Get(":id")
  async detail(@Req() req: AuthRequest, @Param("id") examSessionId: string) {
    const session = await this.sessionService.examSession(req.user.userId, examSessionId);
    const [sessionAnswers, strokes] = await Promise.all([
      this.sessionService.listAnswers(examSessionId),
      this.sessionService.listStrokes(examSessionId),
    ]);
    return { ...session, answers: sessionAnswers, strokes };
  }

  @Patch(":id/answers")
  saveAnswer(@Req() req: AuthRequest, @Param("id") examSessionId: string, @Body() input: SaveAnswerInput) {
    return this.sessionService.saveAnswer(req.user.userId, examSessionId, input);
  }

  @Post(":id/submit")
  submit(@Req() req: AuthRequest, @Param("id") examSessionId: string) {
    return this.sessionService.submitExamSession(req.user.userId, examSessionId);
  }

  @Post(":id/abort")
  abort(@Req() req: AuthRequest, @Param("id") examSessionId: string) {
    return this.sessionService.abortExamSession(req.user.userId, examSessionId);
  }

  @Post(":id/strokes")
  saveStrokes(@Req() req: AuthRequest, @Param("id") examSessionId: string, @Body() input: SaveStrokeDraftInput) {
    return this.sessionService.saveStrokeDraft(req.user.userId, { ...input, examSessionId });
  }
}
