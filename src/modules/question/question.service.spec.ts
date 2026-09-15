import { describe, expect, it, jest } from "@jest/globals";
import { QuestionRepository } from "./question.repository";
import { QuestionService } from "./question.service";
import { AddQuestionInput } from "./question.types";

const validInput: AddQuestionInput = {
  examPaperId: "paper-1",
  number: 1,
  prompt: "다음 글의 주제로 가장 적절한 것은?",
  choices: ["a", "b", "c", "d", "e"],
  answer: "a",
};

const createService = () => {
  const addQuestion = jest.fn<QuestionRepository["addQuestion"]>();
  const repository = { addQuestion } as unknown as QuestionRepository;
  return { service: new QuestionService(repository), addQuestion };
};

describe("QuestionService.addQuestion", () => {
  it("선지가 2개 미만이면 거부한다", async () => {
    const { service } = createService();
    await expect(service.addQuestion({ ...validInput, choices: ["a"], answer: "a" })).rejects.toMatchObject({
      status: 400,
    });
  });

  it("선지가 6개를 넘으면 거부한다", async () => {
    const { service } = createService();
    const choices = ["a", "b", "c", "d", "e", "f", "g"];
    await expect(service.addQuestion({ ...validInput, choices })).rejects.toMatchObject({ status: 400 });
  });

  it("정답이 선지에 없으면 거부한다", async () => {
    const { service } = createService();
    await expect(service.addQuestion({ ...validInput, answer: "z" })).rejects.toMatchObject({ status: 400 });
  });

  it("같은 시험지+번호 중복은 409다", async () => {
    const { service, addQuestion } = createService();
    addQuestion.mockRejectedValue(Object.assign(new Error("dup"), { code: "23505" }));
    await expect(service.addQuestion(validInput)).rejects.toMatchObject({ status: 409 });
  });

  it("없는 시험지 FK는 400이다", async () => {
    const { service, addQuestion } = createService();
    addQuestion.mockRejectedValue(Object.assign(new Error("fk"), { code: "23503" }));
    await expect(service.addQuestion(validInput)).rejects.toMatchObject({ status: 400 });
  });

  it("유효한 입력은 저장된 문항을 반환한다", async () => {
    const { service, addQuestion } = createService();
    addQuestion.mockResolvedValue({ questionId: "q-1" } as never);
    await expect(service.addQuestion(validInput)).resolves.toEqual({ questionId: "q-1" });
  });
});
