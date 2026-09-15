import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAdminGuard } from "src/guards/adminToken.guard";
import { ExamService } from "./exam.service";
import { CreateExamPaperInput } from "./exam.types";

@Controller("exams")
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Get()
  listPublished() {
    return this.examService.listExamPapers(true);
  }

  @Get(":id")
  detail(@Param("id") examPaperId: string) {
    return this.examService.findPublishedExamPaper(examPaperId);
  }
}

@UseGuards(JwtAdminGuard)
@Controller("admin/exams")
export class AdminExamController {
  constructor(private readonly examService: ExamService) {}

  @Get()
  list(@Query("published") published?: string) {
    return this.examService.listExamPapers(published === "true" ? true : published === "false" ? false : undefined);
  }

  @Get(":id")
  detail(@Param("id") examPaperId: string) {
    return this.examService.findExamPaper(examPaperId);
  }

  @Post()
  create(@Body() input: CreateExamPaperInput) {
    return this.examService.createExamPaper(input);
  }

  @Patch(":id/publish")
  setPublished(@Param("id") examPaperId: string, @Body() body: { published: boolean }) {
    return this.examService.setPublished(examPaperId, body.published === true);
  }
}
