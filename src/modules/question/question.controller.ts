import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAdminGuard } from "src/guards/adminToken.guard";
import { QuestionService } from "./question.service";
import { AddQuestionInput, QuestionPayload, UpdateQuestionInput } from "./question.types";

const toPublicPayload = (question: {
  questionId: string;
  examPaperId: string;
  number: number;
  passageImageUrl: string | null;
  prompt: string;
  choices: string[];
}): QuestionPayload => ({
  questionId: question.questionId,
  examPaperId: question.examPaperId,
  number: question.number,
  passageImageUrl: question.passageImageUrl ?? undefined,
  prompt: question.prompt,
  choices: question.choices,
});

@Controller("exams")
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get(":id/questions")
  async listPublic(@Param("id") examPaperId: string) {
    const questions = await this.questionService.listByExamPaper(examPaperId);
    return questions.map(toPublicPayload);
  }
}

@UseGuards(JwtAdminGuard)
@Controller("admin")
export class AdminQuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get("exams/:id/questions")
  listAdmin(@Param("id") examPaperId: string) {
    return this.questionService.listByExamPaper(examPaperId);
  }

  @Post("questions")
  add(@Body() input: AddQuestionInput) {
    return this.questionService.addQuestion(input);
  }

  @Patch("questions/:id")
  update(@Param("id") questionId: string, @Body() input: UpdateQuestionInput) {
    return this.questionService.updateQuestion({ ...input, questionId });
  }

  @Delete("questions/:id")
  remove(@Param("id") questionId: string) {
    return this.questionService.deleteQuestion(questionId);
  }
}
