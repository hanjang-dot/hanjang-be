import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Request, Response } from "express";
import { z } from "zod";
import { CustomForbiddenException, CustomUnauthorizedException } from "src/common/errors/custom-exceptions";
import { AdminErrorMessage } from "src/modules/admin/admin.error";
import { AuthErrorMessage } from "src/modules/auth/auth.error";
import { ExamService } from "src/modules/exam/exam.service";
import { QuestionService } from "src/modules/question/question.service";
import { QuizDirection, QuizType } from "src/modules/quiz/quiz.types";
import { QuizService } from "src/modules/quiz/quiz.service";

type AdminTokenVerifier = (token: string) => Promise<{ adminId?: string; role?: string }>;

export const verifyAdminAuthorization = async (verify: AdminTokenVerifier, authorization?: string) => {
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : undefined;
  if (!token) throw new CustomUnauthorizedException(AuthErrorMessage.AuthRequired);

  let payload: { adminId?: string; role?: string };
  try {
    payload = await verify(token);
  } catch {
    throw new CustomUnauthorizedException(AuthErrorMessage.AuthRequired);
  }

  if (payload.role !== "admin" || !payload.adminId) {
    throw new CustomForbiddenException(AdminErrorMessage.AdminRoleRequired);
  }

  return payload;
};

@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly examService: ExamService,
    private readonly questionService: QuestionService,
    private readonly quizService: QuizService,
  ) {}

  async handleRequest(req: Request, res: Response) {
    const payload = await verifyAdminAuthorization(
      (token) =>
        this.jwtService.verifyAsync(token, {
          secret: this.configService.getOrThrow<string>("JWT_ACCESS_TOKEN_SECRET"),
        }),
      req.headers.authorization,
    );
    this.logger.log(JSON.stringify({ event: "mcp_request", adminId: payload.adminId }));

    const server = this.createServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      void transport.close();
      void server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  }

  private createServer() {
    const server = new McpServer({ name: "hanjang-be", version: "0.0.1" });

    server.registerTool(
      "list_exam_papers",
      {
        description: "시험지 id·제목 목록. 문항을 넣을 대상을 고르는 용도.",
        inputSchema: { published: z.boolean().optional() },
      },
      async ({ published }) => {
        const papers = await this.examService.listExamPapers(published);
        const items = papers.map((paper) => ({ examPaperId: paper.examPaperId, title: paper.title }));
        return { content: [{ type: "text" as const, text: JSON.stringify(items) }] };
      },
    );

    server.registerTool(
      "add_question",
      {
        description: "시험지에 문항을 추가한다. choices는 2~6개, answer는 choices 안의 값.",
        inputSchema: {
          examPaperId: z.string(),
          number: z.number().int(),
          prompt: z.string(),
          passageImageUrl: z.string().optional(),
          choices: z.array(z.string()),
          answer: z.string(),
        },
      },
      async (input) => {
        const question = await this.questionService.addQuestion(input);
        return { content: [{ type: "text" as const, text: JSON.stringify({ questionId: question.questionId }) }] };
      },
    );

    server.registerTool(
      "add_quiz",
      {
        description: "퀴즈를 추가한다. ox는 선지 2개, word는 6개, 나머지는 5개. direction은 word만.",
        inputSchema: {
          type: z.enum(QuizType),
          prompt: z.string(),
          choices: z.array(z.string()),
          answer: z.string(),
          direction: z.enum(QuizDirection).optional(),
        },
      },
      async (input) => {
        const quiz = await this.quizService.addQuiz(input);
        return { content: [{ type: "text" as const, text: JSON.stringify({ quizId: quiz.quizId }) }] };
      },
    );

    return server;
  }
}
