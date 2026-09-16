import { Body, Controller, Post, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import { JwtAccessTokenGuard } from "src/guards/accessToken.guard";
import { AuthRequest } from "src/modules/auth/auth.types";
import { GradeService } from "./grade.service";
import { GradeAnswerInput, GradeQuizAnswerInput } from "./grade.types";
import { TestHeadersInterceptor } from "./test-headers.interceptor";

@UseGuards(JwtAccessTokenGuard)
@UseInterceptors(TestHeadersInterceptor)
@Controller("grade")
export class GradeController {
  constructor(private readonly gradeService: GradeService) {}

  @Post()
  grade(@Req() req: AuthRequest, @Body() input: GradeAnswerInput) {
    return this.gradeService.gradeAnswer(req.user.userId, input);
  }

  @Post("quiz")
  gradeQuiz(@Req() req: AuthRequest, @Body() input: GradeQuizAnswerInput) {
    return this.gradeService.gradeQuizAnswer(req.user.userId, input);
  }
}
