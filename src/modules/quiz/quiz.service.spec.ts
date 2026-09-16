import { describe, expect, it, jest } from "@jest/globals";
import { QuizRepository } from "./quiz.repository";
import { QuizService } from "./quiz.service";
import { AddQuizInput, QuizDirection, QuizType } from "./quiz.types";

const createService = () => {
  const repository = {
    addQuiz: jest.fn(async () => ({ quizId: "quiz-1" })),
    findQuiz: jest.fn<QuizRepository["findQuiz"]>(),
    updateQuiz: jest.fn<QuizRepository["updateQuiz"]>(),
    deleteQuiz: jest.fn<QuizRepository["deleteQuiz"]>(),
  } as unknown as QuizRepository;
  return { service: new QuizService(repository), repository };
};

const baseInput = (type: QuizType, choices: string[]): AddQuizInput => ({
  type,
  prompt: "p",
  choices,
  answer: choices[0],
});

describe("QuizService.addQuiz", () => {
  it("ox는 선지 정확히 2개다", async () => {
    const { service } = createService();
    await expect(service.addQuiz(baseInput(QuizType.Ox, ["o", "x", "maybe"]))).rejects.toMatchObject({ status: 400 });
    await expect(service.addQuiz(baseInput(QuizType.Ox, ["o", "x"]))).resolves.toBeDefined();
  });

  it("word는 선지 정확히 6개다", async () => {
    const { service } = createService();
    await expect(service.addQuiz(baseInput(QuizType.Word, ["a", "b", "c", "d", "e"]))).rejects.toMatchObject({
      status: 400,
    });
  });

  it("cloze와 history는 선지 5개다", async () => {
    const { service } = createService();
    await expect(service.addQuiz(baseInput(QuizType.Cloze, ["a", "b"]))).rejects.toMatchObject({ status: 400 });
    await expect(service.addQuiz(baseInput(QuizType.History, ["a", "b", "c", "d", "e"]))).resolves.toBeDefined();
  });

  it("direction은 word에서만 허용한다", async () => {
    const { service } = createService();
    await expect(
      service.addQuiz({ ...baseInput(QuizType.Ox, ["o", "x"]), direction: QuizDirection.EnKo }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      service.addQuiz({
        ...baseInput(QuizType.Word, ["a", "b", "c", "d", "e", "f"]),
        direction: QuizDirection.KoEn,
      }),
    ).resolves.toBeDefined();
  });

  it("정답이 선지에 없으면 거부한다", async () => {
    const { service } = createService();
    await expect(service.addQuiz({ ...baseInput(QuizType.Ox, ["o", "x"]), answer: "z" })).rejects.toMatchObject({
      status: 400,
    });
  });
});

describe("QuizService.updateQuiz", () => {
  const existing = {
    quizId: "quiz-1",
    type: "word",
    prompt: "p",
    choices: ["a", "b", "c", "d", "e", "f"],
    answer: "a",
    direction: "en-ko",
  };

  it("없는 퀴즈는 404다", async () => {
    const { service, repository } = createService();
    (repository.findQuiz as jest.Mock).mockResolvedValue(undefined as never);
    await expect(service.updateQuiz({ quizId: "quiz-1", prompt: "q" })).rejects.toMatchObject({ status: 404 });
  });

  it("부분 수정은 기존 값과 합쳐 검증한다", async () => {
    const { service, repository } = createService();
    (repository.findQuiz as jest.Mock).mockResolvedValue(existing as never);
    (repository.updateQuiz as jest.Mock).mockResolvedValue({ ...existing, prompt: "q" } as never);
    await expect(service.updateQuiz({ quizId: "quiz-1", prompt: "q" })).resolves.toMatchObject({ prompt: "q" });
  });

  it("type 변경 시 새 type의 선지 수 규칙을 적용한다", async () => {
    const { service, repository } = createService();
    (repository.findQuiz as jest.Mock).mockResolvedValue(existing as never);
    await expect(service.updateQuiz({ quizId: "quiz-1", type: QuizType.Ox })).rejects.toMatchObject({ status: 400 });
  });

  it("word가 아니면 direction을 남길 수 없다", async () => {
    const { service, repository } = createService();
    (repository.findQuiz as jest.Mock).mockResolvedValue(existing as never);
    const choices = ["a", "b"];
    await expect(
      service.updateQuiz({ quizId: "quiz-1", type: QuizType.Ox, choices, answer: "a" }),
    ).rejects.toMatchObject({ status: 400 });
    (repository.updateQuiz as jest.Mock).mockResolvedValue({
      ...existing,
      type: "ox",
      choices,
      direction: null,
    } as never);
    await expect(
      service.updateQuiz({ quizId: "quiz-1", type: QuizType.Ox, choices, answer: "a", direction: null }),
    ).resolves.toBeDefined();
  });
});

describe("QuizService.deleteQuiz", () => {
  it("없는 퀴즈는 404다", async () => {
    const { service, repository } = createService();
    (repository.deleteQuiz as jest.Mock).mockResolvedValue(false as never);
    await expect(service.deleteQuiz("quiz-x")).rejects.toMatchObject({ status: 404 });
  });
});
