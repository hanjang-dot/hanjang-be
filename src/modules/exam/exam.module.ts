import { Module } from "@nestjs/common";
import { AdminExamController, ExamController } from "./exam.controller";
import { ExamRepository } from "./exam.repository";
import { ExamService } from "./exam.service";

@Module({
  controllers: [ExamController, AdminExamController],
  providers: [ExamService, ExamRepository],
  exports: [ExamService],
})
export class ExamModule {}
