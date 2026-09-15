export class QuestionPayload {
  questionId!: string;
  examPaperId!: string;
  number!: number;
  passageImageUrl?: string;
  prompt!: string;
  choices!: string[];
}

export class AdminQuestionPayload extends QuestionPayload {
  answer!: string;
}

export class AddQuestionInput {
  examPaperId!: string;
  number!: number;
  prompt!: string;
  passageImageUrl?: string;
  choices!: string[];
  answer!: string;
}

export class UpdateQuestionInput {
  questionId!: string;
  number?: number;
  prompt?: string;
  passageImageUrl?: string;
  choices?: string[];
  answer?: string;
}
