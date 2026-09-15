import { Module } from "@nestjs/common";
import { AdminQuizController, QuizController, QuizSessionController } from "./quiz.controller";
import { QuizRepository } from "./quiz.repository";
import { QuizService } from "./quiz.service";

@Module({
  controllers: [QuizController, QuizSessionController, AdminQuizController],
  providers: [QuizService, QuizRepository],
  exports: [QuizService],
})
export class QuizModule {}
