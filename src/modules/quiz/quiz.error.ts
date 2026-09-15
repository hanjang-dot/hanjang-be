export enum QuizErrorMessage {
  InvalidQuizChoices = "퀴즈 선지 개수가 잘못되었습니다.",
  AnswerNotInChoices = "정답은 선지 안의 값이어야 합니다.",
  DirectionOnlyForWord = "direction은 word 퀴즈에서만 사용할 수 있습니다.",
  QuizNotFound = "퀴즈를 찾을 수 없습니다.",
  QuizSessionNotFound = "퀴즈 세션을 찾을 수 없습니다.",
  QuizSessionNotOwned = "본인의 퀴즈 세션이 아닙니다.",
  QuizSessionClosed = "이미 종료된 퀴즈 세션입니다.",
}
