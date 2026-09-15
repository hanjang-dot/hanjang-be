CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "admin" (
  "adminId" uuid PRIMARY KEY,
  "loginId" varchar(50) NOT NULL UNIQUE,
  "passwordHash" text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "adminInvite" (
  "tokenHash" text PRIMARY KEY,
  "createdByAdminId" uuid NOT NULL REFERENCES "admin"("adminId"),
  "expiresAt" timestamp NOT NULL,
  "usedAt" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "examPaper" (
  "examPaperId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" varchar(255) NOT NULL,
  "round" varchar(50),
  "subject" varchar(50) NOT NULL,
  "year" integer,
  "coverImageUrl" text,
  "timeLimitSec" integer NOT NULL,
  "publishedAt" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "question" (
  "questionId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "examPaperId" uuid NOT NULL REFERENCES "examPaper"("examPaperId"),
  "number" integer NOT NULL,
  "passageImageUrl" text,
  "prompt" text NOT NULL,
  "choices" jsonb NOT NULL,
  "answer" text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "question" ADD CONSTRAINT "question_examPaperId_number_unique" UNIQUE ("examPaperId", "number");

CREATE TABLE IF NOT EXISTS "examSession" (
  "examSessionId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES "users"("userId"),
  "examPaperId" uuid NOT NULL REFERENCES "examPaper"("examPaperId"),
  "status" varchar(20) NOT NULL DEFAULT 'idle',
  "deadlineAt" timestamp NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "answer" (
  "answerId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "examSessionId" uuid NOT NULL REFERENCES "examSession"("examSessionId"),
  "questionId" uuid NOT NULL REFERENCES "question"("questionId"),
  "choice" text NOT NULL,
  "gradeRunId" varchar(64),
  "correct" boolean,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "answer" ADD CONSTRAINT "answer_examSessionId_questionId_unique" UNIQUE ("examSessionId", "questionId");

CREATE TABLE IF NOT EXISTS "stroke" (
  "strokeId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "examSessionId" uuid NOT NULL REFERENCES "examSession"("examSessionId"),
  "questionId" uuid NOT NULL REFERENCES "question"("questionId"),
  "points" jsonb NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "quiz" (
  "quizId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" varchar(20) NOT NULL,
  "prompt" text NOT NULL,
  "choices" jsonb NOT NULL,
  "answer" text NOT NULL,
  "direction" varchar(10),
  "publishedAt" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "quizSession" (
  "quizSessionId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES "users"("userId"),
  "quizIds" jsonb NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'idle',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);
