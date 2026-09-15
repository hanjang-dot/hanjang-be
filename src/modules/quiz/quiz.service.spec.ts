import { describe, expect, it, jest } from "@jest/globals";
import { QuizRepository } from "./quiz.repository";
import { QuizService } from "./quiz.service";
import { AddQuizInput, QuizDirection, QuizType } from "./quiz.types";

const createService = () => {
  const repository = { addQuiz: jest.fn(async () => ({ quizId: "quiz-1" })) } as unknown as QuizRepository;
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
