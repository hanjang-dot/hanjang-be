import { boolean, integer, jsonb, pgTable, text, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  userId: uuid("userId").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }).unique(),
  password: text("password").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const refreshTokens = pgTable(
  "refreshToken",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.userId),
    deviceId: varchar("deviceId", { length: 255 }).notNull(),
    refreshToken: text("refreshToken").notNull(),
    refreshTokenExp: timestamp("refreshTokenExp").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [unique("refreshToken_userId_deviceId_unique").on(table.userId, table.deviceId)],
);

export const authIdentities = pgTable(
  "authIdentity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.userId),
    provider: varchar("provider", { length: 50 }).notNull(),
    providerUserId: varchar("providerUserId", { length: 255 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [unique("authIdentity_provider_providerUserId_unique").on(table.provider, table.providerUserId)],
);

export const phoneVerifications = pgTable("phoneVerification", {
  id: uuid("id").primaryKey().defaultRandom(),
  phoneE164: varchar("phoneE164", { length: 20 }).notNull(),
  codeHash: text("codeHash").notNull(),
  purpose: varchar("purpose", { length: 50 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  verifiedAt: timestamp("verifiedAt"),
  attemptCount: integer("attemptCount").notNull().default(0),
  requestIpHash: text("requestIpHash"),
  userAgentHash: text("userAgentHash"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const phoneVerificationTokens = pgTable("phoneVerificationToken", {
  tokenHash: text("tokenHash").primaryKey(),
  phoneE164: varchar("phoneE164", { length: 20 }).notNull(),
  verificationId: uuid("verificationId")
    .notNull()
    .references(() => phoneVerifications.id),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const kakaoPhoneVerificationTokens = pgTable("kakaoPhoneVerificationToken", {
  tokenHash: text("tokenHash").primaryKey(),
  userId: uuid("userId").references(() => users.userId),
  providerUserId: varchar("providerUserId", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const admins = pgTable("admin", {
  adminId: uuid("adminId").primaryKey(),
  loginId: varchar("loginId", { length: 50 }).notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const adminInvites = pgTable("adminInvite", {
  tokenHash: text("tokenHash").primaryKey(),
  createdByAdminId: uuid("createdByAdminId")
    .notNull()
    .references(() => admins.adminId),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const examPapers = pgTable("examPaper", {
  examPaperId: uuid("examPaperId").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  round: varchar("round", { length: 50 }),
  subject: varchar("subject", { length: 50 }).notNull(),
  year: integer("year"),
  coverImageUrl: text("coverImageUrl"),
  timeLimitSec: integer("timeLimitSec").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const questions = pgTable(
  "question",
  {
    questionId: uuid("questionId").primaryKey().defaultRandom(),
    examPaperId: uuid("examPaperId")
      .notNull()
      .references(() => examPapers.examPaperId),
    number: integer("number").notNull(),
    passageImageUrl: text("passageImageUrl"),
    prompt: text("prompt").notNull(),
    choices: jsonb("choices").$type<string[]>().notNull(),
    answer: text("answer").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [unique("question_examPaperId_number_unique").on(table.examPaperId, table.number)],
);

export const examSessions = pgTable("examSession", {
  examSessionId: uuid("examSessionId").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.userId),
  examPaperId: uuid("examPaperId")
    .notNull()
    .references(() => examPapers.examPaperId),
  status: varchar("status", { length: 20 }).notNull().default("idle"),
  deadlineAt: timestamp("deadlineAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const answers = pgTable(
  "answer",
  {
    answerId: uuid("answerId").primaryKey().defaultRandom(),
    examSessionId: uuid("examSessionId")
      .notNull()
      .references(() => examSessions.examSessionId),
    questionId: uuid("questionId")
      .notNull()
      .references(() => questions.questionId),
    choice: text("choice").notNull(),
    gradeRunId: varchar("gradeRunId", { length: 64 }),
    correct: boolean("correct"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [unique("answer_examSessionId_questionId_unique").on(table.examSessionId, table.questionId)],
);

export const strokes = pgTable("stroke", {
  strokeId: uuid("strokeId").primaryKey().defaultRandom(),
  examSessionId: uuid("examSessionId")
    .notNull()
    .references(() => examSessions.examSessionId),
  questionId: uuid("questionId")
    .notNull()
    .references(() => questions.questionId),
  points: jsonb("points").$type<{ x: number; y: number }[]>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const quizzes = pgTable("quiz", {
  quizId: uuid("quizId").primaryKey().defaultRandom(),
  type: varchar("type", { length: 20 }).notNull(),
  prompt: text("prompt").notNull(),
  choices: jsonb("choices").$type<string[]>().notNull(),
  answer: text("answer").notNull(),
  direction: varchar("direction", { length: 10 }),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const quizSessions = pgTable("quizSession", {
  quizSessionId: uuid("quizSessionId").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.userId),
  quizIds: jsonb("quizIds").$type<string[]>().notNull(),
  status: varchar("status", { length: 20 }).notNull().default("idle"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type AuthIdentity = typeof authIdentities.$inferSelect;
export type PhoneVerification = typeof phoneVerifications.$inferSelect;
export type PhoneVerificationToken = typeof phoneVerificationTokens.$inferSelect;
export type KakaoPhoneVerificationToken = typeof kakaoPhoneVerificationTokens.$inferSelect;
export type Admin = typeof admins.$inferSelect;
export type AdminInvite = typeof adminInvites.$inferSelect;
export type ExamPaper = typeof examPapers.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type ExamSession = typeof examSessions.$inferSelect;
export type Answer = typeof answers.$inferSelect;
export type Stroke = typeof strokes.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type QuizSession = typeof quizSessions.$inferSelect;
