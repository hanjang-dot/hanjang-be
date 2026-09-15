import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ExamModule } from "src/modules/exam/exam.module";
import { QuestionModule } from "src/modules/question/question.module";
import { QuizModule } from "src/modules/quiz/quiz.module";
import { McpController } from "./mcp.controller";
import { McpService } from "./mcp.service";

@Module({
  imports: [JwtModule.register({}), ExamModule, QuestionModule, QuizModule],
  controllers: [McpController],
  providers: [McpService],
})
export class McpModule {}
