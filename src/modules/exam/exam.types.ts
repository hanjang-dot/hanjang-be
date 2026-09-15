export class CreateExamPaperInput {
  title!: string;
  round!: string;
  subject!: string;
  year!: number;
  coverImageUrl?: string;
  timeLimitSec!: number;
}
