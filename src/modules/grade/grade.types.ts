export class GradeAnswerInput {
  examSessionId!: string;
  questionId!: string;
  choice!: string;
}

export class GradeQuizAnswerInput {
  quizSessionId!: string;
  quizId!: string;
  choice!: string;
}

export class GradeResultPayload {
  runId!: string;
  correct!: boolean;
}
