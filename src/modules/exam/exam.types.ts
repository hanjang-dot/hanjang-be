export class CreateExamPaperInput {
  title!: string;
  round!: string;
  subject!: string;
  year!: number;
  coverImageUrl?: string;
  timeLimitSec!: number;
}

export class UpdateExamPaperInput {
  examPaperId!: string;
  title?: string;
  round?: string;
  subject?: string;
  year?: number;
  coverImageUrl?: string | null;
  timeLimitSec?: number;
}
