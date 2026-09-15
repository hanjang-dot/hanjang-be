import { Module } from "@nestjs/common";
import { ExamModule } from "src/modules/exam/exam.module";
import { SessionController } from "./session.controller";
import { SessionRepository } from "./session.repository";
import { SessionService } from "./session.service";

@Module({
  imports: [ExamModule],
  controllers: [SessionController],
  providers: [SessionService, SessionRepository],
  exports: [SessionService],
})
export class SessionModule {}
