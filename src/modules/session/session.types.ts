export enum ExamSessionStatus {
  Idle = "idle",
  Grading = "grading",
  Graded = "graded",
  Aborted = "aborted",
}

export class StartExamSessionInput {
  examPaperId!: string;
}

export class SaveAnswerInput {
  questionId!: string;
  choice!: string;
}

export class StrokePointInput {
  x!: number;
  y!: number;
}

export class SaveStrokeDraftInput {
  questionId!: string;
  points!: StrokePointInput[];
}
