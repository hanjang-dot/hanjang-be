import { Inject, Injectable } from "@nestjs/common";
import { and, eq, gt, isNull } from "drizzle-orm";
import { hashToken } from "src/common/security/token-hash";
import { Database, DRIZZLE } from "src/modules/database/database.module";
import {
  authIdentities,
  refreshTokens,
  phoneVerificationTokens,
  users,
  type AuthIdentity,
  type RefreshToken,
  type PhoneVerificationToken,
  type User,
} from "src/modules/database/schema";
import { SigninAuthInput, SignupAuthRepositoryInput } from "./auth.types";

@Injectable()
export class AuthRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /**
   * 사용자 가입 정보를 저장한다.
   *
   * @param input 저장할 가입 정보
   * @returns 생성된 사용자
   */
  async signup(input: SignupAuthRepositoryInput): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values({
        userId: input.userId,
        email: input.email,
        phone: input.phone,
        password: input.password,
      })
      .returning();

    return user;
  }

  async signupWithPhoneVerificationToken(
    input: Omit<SignupAuthRepositoryInput, "phone">,
    token: string,
  ): Promise<User | undefined> {
    return this.db.transaction(async (tx) => {
      const [phoneVerificationToken] = await tx
        .update(phoneVerificationTokens)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(phoneVerificationTokens.tokenHash, hashToken(token)),
            isNull(phoneVerificationTokens.usedAt),
            gt(phoneVerificationTokens.expiresAt, new Date()),
          ),
        )
        .returning();
      if (!phoneVerificationToken) return undefined;

      const [user] = await tx
        .insert(users)
        .values({
          userId: input.userId,
          email: input.email,
          phone: phoneVerificationToken.phoneE164,
          password: input.password,
        })
        .returning();

      return user;
    });
  }

  /**
   * 로그인용 이메일로 사용자를 조회한다.
   *
   * @param input 로그인 입력값
   * @returns 조회된 사용자 또는 undefined
   */
  signin(input: SigninAuthInput): Promise<User | undefined> {
    return this.db.query.users.findFirst({ where: eq(users.email, input.email) });
  }

  /**
   * 이메일 가입 여부 확인용 사용자를 조회한다.
   *
   * @param email 확인할 이메일
   * @returns 조회된 사용자 또는 undefined
   */
  signed(email: string): Promise<User | undefined> {
    return this.db.query.users.findFirst({ where: eq(users.email, email) });
  }

  /**
   * 사용자/기기별 refresh token을 저장하거나 갱신한다.
   *
   * @param input 저장할 refresh token 정보
   * @returns 저장 완료 Promise
   */
  async saveRefreshToken(input: { userId: string; deviceId: string; refreshToken: string; refreshTokenExp: Date }) {
    await this.db
      .insert(refreshTokens)
      .values(input)
      .onConflictDoUpdate({
        target: [refreshTokens.userId, refreshTokens.deviceId],
        set: {
          refreshToken: input.refreshToken,
          refreshTokenExp: input.refreshTokenExp,
          updatedAt: new Date(),
        },
      });
  }

  findRefreshToken(userId: string, deviceId: string): Promise<RefreshToken | undefined> {
    return this.db.query.refreshTokens.findFirst({
      where: and(eq(refreshTokens.userId, userId), eq(refreshTokens.deviceId, deviceId)),
    });
  }

  async deleteRefreshToken(userId: string, deviceId: string): Promise<void> {
    await this.db
      .delete(refreshTokens)
      .where(and(eq(refreshTokens.userId, userId), eq(refreshTokens.deviceId, deviceId)));
  }

  /**
   * OAuth provider 식별자로 연결된 사용자를 조회한다.
   *
   * @param provider OAuth provider 이름
   * @param providerUserId OAuth provider 사용자 ID
   * @returns 연결된 사용자, null, 또는 undefined
   */
  async findUserByIdentity(provider: string, providerUserId: string): Promise<User | null | undefined> {
    const identity: AuthIdentity | undefined = await this.db.query.authIdentities.findFirst({
      where: and(eq(authIdentities.provider, provider), eq(authIdentities.providerUserId, providerUserId)),
    });
    if (!identity) return null;

    return this.db.query.users.findFirst({ where: eq(users.userId, identity.userId) });
  }

  async consumePhoneVerificationToken(token: string): Promise<PhoneVerificationToken | undefined> {
    const [savedToken] = await this.db
      .update(phoneVerificationTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(phoneVerificationTokens.tokenHash, hashToken(token)),
          isNull(phoneVerificationTokens.usedAt),
          gt(phoneVerificationTokens.expiresAt, new Date()),
        ),
      )
      .returning();

    return savedToken;
  }

  findPhoneVerificationToken(token: string): Promise<PhoneVerificationToken | undefined> {
    return this.db.query.phoneVerificationTokens.findFirst({
      where: and(
        eq(phoneVerificationTokens.tokenHash, hashToken(token)),
        isNull(phoneVerificationTokens.usedAt),
        gt(phoneVerificationTokens.expiresAt, new Date()),
      ),
    });
  }

  /**
   * userId로 사용자를 조회한다.
   *
   * @param userId 사용자 ID
   * @returns 조회된 사용자 또는 undefined
   */
  findUser(userId: string): Promise<User | undefined> {
    return this.db.query.users.findFirst({ where: eq(users.userId, userId) });
  }

  /**
   * 카카오 identity가 연결된 신규 사용자를 트랜잭션으로 생성한다.
   *
   * @param input 생성할 카카오 사용자 정보
   * @returns 생성된 사용자
   */
  async createKakaoUser(input: {
    userId: string;
    providerUserId: string;
    email: string;
    password: string;
  }): Promise<User> {
    return this.db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          userId: input.userId,
          email: input.email,
          password: input.password,
        })
        .returning();

      await tx.insert(authIdentities).values({
        userId: input.userId,
        provider: "kakao",
        providerUserId: input.providerUserId,
      });

      return user;
    });
  }
}
