import { Module } from "@nestjs/common";
import { QuestionModule } from "src/modules/question/question.module";
import { QuizModule } from "src/modules/quiz/quiz.module";
import { SessionModule } from "src/modules/session/session.module";
import { GradeController } from "./grade.controller";
import { GradeService } from "./grade.service";
import { TestHeadersInterceptor } from "./test-headers.interceptor";

@Module({
  imports: [SessionModule, QuestionModule, QuizModule],
  controllers: [GradeController],
  providers: [GradeService, TestHeadersInterceptor],
  exports: [GradeService],
})
export class GradeModule {}
