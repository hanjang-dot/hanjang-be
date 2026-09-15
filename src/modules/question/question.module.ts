import { Module } from "@nestjs/common";
import { AdminQuestionController, QuestionController } from "./question.controller";
import { QuestionRepository } from "./question.repository";
import { QuestionService } from "./question.service";

@Module({
  controllers: [QuestionController, AdminQuestionController],
  providers: [QuestionService, QuestionRepository],
  exports: [QuestionService],
})
export class QuestionModule {}
