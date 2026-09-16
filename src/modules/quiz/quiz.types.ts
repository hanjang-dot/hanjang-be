export enum QuizType {
  Ox = "ox",
  Cloze = "cloze",
  Word = "word",
  History = "history",
}

export enum QuizDirection {
  EnKo = "en-ko",
  KoEn = "ko-en",
}

export class QuizPayload {
  quizId!: string;
  type!: QuizType;
  prompt!: string;
  choices!: string[];
  direction?: QuizDirection;
}

export class AdminQuizPayload extends QuizPayload {
  answer!: string;
  publishedAt?: Date;
}

export class AddQuizInput {
  type!: QuizType;
  prompt!: string;
  choices!: string[];
  answer!: string;
  direction?: QuizDirection;
}

export class UpdateQuizInput {
  quizId!: string;
  type?: QuizType;
  prompt?: string;
  choices?: string[];
  answer?: string;
  direction?: QuizDirection | null;
}

export enum QuizSessionStatus {
  Idle = "idle",
  Grading = "grading",
  Graded = "graded",
  Aborted = "aborted",
}

export class StartQuizSessionInput {
  quizIds!: string[];
}
