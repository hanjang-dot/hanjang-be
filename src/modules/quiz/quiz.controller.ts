import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAccessTokenGuard } from "src/guards/accessToken.guard";
import { JwtAdminGuard } from "src/guards/adminToken.guard";
import { AuthRequest } from "src/modules/auth/auth.types";
import { QuizService } from "./quiz.service";
import {
  AddQuizInput,
  QuizDirection,
  QuizPayload,
  StartQuizSessionInput,
  QuizType,
  UpdateQuizInput,
} from "./quiz.types";

const toPublicPayload = (quiz: {
  quizId: string;
  type: string;
  prompt: string;
  choices: string[];
  direction: string | null;
}): QuizPayload => ({
  quizId: quiz.quizId,
  type: quiz.type as QuizType,
  prompt: quiz.prompt,
  choices: quiz.choices,
  direction: (quiz.direction ?? undefined) as QuizDirection | undefined,
});

@Controller("quizzes")
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  async listPublished() {
    const quizzes = await this.quizService.listQuizzes(true);
    return quizzes.map(toPublicPayload);
  }

  @Get("today")
  async today() {
    const quizzes = await this.quizService.todayQuizSet();
    return quizzes.map(toPublicPayload);
  }
}

@UseGuards(JwtAccessTokenGuard)
@Controller("quiz-sessions")
export class QuizSessionController {
  constructor(private readonly quizService: QuizService) {}

  @Post()
  start(@Req() req: AuthRequest, @Body() input: StartQuizSessionInput) {
    return this.quizService.startQuizSession(req.user.userId, input.quizIds);
  }

  @Post(":id/submit")
  submit(@Req() req: AuthRequest, @Param("id") quizSessionId: string) {
    return this.quizService.submitQuizSession(req.user.userId, quizSessionId);
  }
}

@UseGuards(JwtAdminGuard)
@Controller("admin/quizzes")
export class AdminQuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  list(@Query("published") published?: string) {
    return this.quizService.listQuizzes(published === "true" ? true : published === "false" ? false : undefined);
  }

  @Post()
  add(@Body() input: AddQuizInput) {
    return this.quizService.addQuiz(input);
  }

  @Patch(":id")
  update(@Param("id") quizId: string, @Body() input: UpdateQuizInput) {
    return this.quizService.updateQuiz({ ...input, quizId });
  }

  @Patch(":id/publish")
  setPublished(@Param("id") quizId: string, @Body() body: { published: boolean }) {
    return this.quizService.setPublished(quizId, body.published === true);
  }

  @Delete(":id")
  remove(@Param("id") quizId: string) {
    return this.quizService.deleteQuiz(quizId);
  }
}
