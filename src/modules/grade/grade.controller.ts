import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAccessTokenGuard } from "src/guards/accessToken.guard";
import { AuthRequest } from "src/modules/auth/auth.types";
import { GradeService } from "./grade.service";
import { GradeAnswerInput, GradeQuizAnswerInput } from "./grade.types";

@UseGuards(JwtAccessTokenGuard)
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
