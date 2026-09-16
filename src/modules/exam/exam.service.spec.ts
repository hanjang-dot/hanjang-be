import { describe, expect, it, jest } from "@jest/globals";
import { ExamRepository } from "./exam.repository";
import { ExamService } from "./exam.service";

const createService = () => {
  const updateExamPaper = jest.fn<ExamRepository["updateExamPaper"]>();
  const deleteExamPaper = jest.fn<ExamRepository["deleteExamPaper"]>();
  const repository = { updateExamPaper, deleteExamPaper } as unknown as ExamRepository;
  return { service: new ExamService(repository), updateExamPaper, deleteExamPaper };
};

describe("ExamService.updateExamPaper", () => {
  it("없는 시험지는 404다", async () => {
    const { service, updateExamPaper } = createService();
    updateExamPaper.mockResolvedValue(undefined);
    await expect(service.updateExamPaper({ examPaperId: "x", title: "t" })).rejects.toMatchObject({ status: 404 });
  });

  it("수정된 시험지를 반환한다", async () => {
    const { service, updateExamPaper } = createService();
    updateExamPaper.mockResolvedValue({ examPaperId: "x", title: "t" } as never);
    await expect(service.updateExamPaper({ examPaperId: "x", title: "t" })).resolves.toEqual({
      examPaperId: "x",
      title: "t",
    });
  });
});

describe("ExamService.deleteExamPaper", () => {
  it("없는 시험지는 404다", async () => {
    const { service, deleteExamPaper } = createService();
    deleteExamPaper.mockResolvedValue(false);
    await expect(service.deleteExamPaper("x")).rejects.toMatchObject({ status: 404 });
  });

  it("문항·세션이 참조 중이면 409다", async () => {
    const { service, deleteExamPaper } = createService();
    deleteExamPaper.mockRejectedValue(Object.assign(new Error("fk"), { code: "23503" }));
    await expect(service.deleteExamPaper("x")).rejects.toMatchObject({ status: 409 });
  });
});
