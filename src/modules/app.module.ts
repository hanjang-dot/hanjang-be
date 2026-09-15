import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { ExamModule } from "./exam/exam.module";
import { GradeModule } from "./grade/grade.module";
import { McpModule } from "./mcp/mcp.module";
import { PhoneModule } from "./phone/phone.module";
import { QuestionModule } from "./question/question.module";
import { QuizModule } from "./quiz/quiz.module";
import { SessionModule } from "./session/session.module";
import { UserModule } from "./user/user.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    DatabaseModule,
    AuthModule,
    AdminModule,
    PhoneModule,
    UserModule,
    ExamModule,
    QuestionModule,
    SessionModule,
    GradeModule,
    QuizModule,
    McpModule,
  ],
})
export class AppModule {}
