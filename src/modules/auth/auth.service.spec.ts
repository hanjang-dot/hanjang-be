import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { describe, expect, it, jest } from "@jest/globals";
import * as bcrypt from "bcrypt";
import { RefreshToken, PhoneVerificationToken, User } from "src/modules/database/schema";
import { UserService } from "src/modules/user/user.service";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  const user: User = {
    userId: "553a6422-2525-4bd5-a5ce-5af75ea475c0",
    email: "user@example.com",
    phone: "+821011111111",
    password: "hash",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const tokenServices = () => {
    const repository = {
      saveRefreshToken: jest.fn<() => Promise<void>>(),
    } as unknown as AuthRepository;
    const jwtService = {
      signAsync: jest.fn<() => Promise<string>>().mockResolvedValueOnce("access").mockResolvedValueOnce("refresh"),
      decode: jest.fn<() => { exp: number }>().mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 }),
    } as unknown as JwtService;
    const configService = {
      getOrThrow: jest.fn<() => string>().mockReturnValue("secret"),
    } as unknown as ConfigService;

    return { repository, jwtService, configService };
  };

  it("completes phone signup and issues tokens", async () => {
    const services = tokenServices();
    const repository = {
      ...services.repository,
      signupWithPhoneVerificationToken: jest.fn<() => Promise<User | undefined>>().mockResolvedValue(user),
    } as unknown as AuthRepository;
    const service = new AuthService(repository, services.jwtService, services.configService, {} as UserService);

    await expect(
      service.signup(
        { email: user.email, password: "password", userName: "", phoneVerificationToken: "signup-token" },
        "device",
      ),
    ).resolves.toEqual({ accessToken: "access", refreshToken: "refresh" });
  });

  it("maps duplicate signup to bad request", async () => {
    const repository = {
      signupWithPhoneVerificationToken: async () => {
        throw { code: "23505" };
      },
    } as unknown as AuthRepository;
    const service = new AuthService(repository, {} as JwtService, {} as ConfigService, {} as UserService);

    await expect(
      service.signup(
        { email: user.email, password: "password", userName: "", phoneVerificationToken: "signup-token" },
        "device",
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects signin with a phoneVerificationToken for another phone", async () => {
    const user: User = {
      userId: "553a6422-2525-4bd5-a5ce-5af75ea475c0",
      email: "user@example.com",
      phone: "+821011111111",
      password: await bcrypt.hash("password", 10),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const phoneVerificationToken: PhoneVerificationToken = {
      tokenHash: "token",
      phoneE164: "+821022222222",
      verificationId: "df881b8f-90ed-4358-8581-5e5c132ac01d",
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      createdAt: new Date(),
    };
    const consumePhoneVerificationToken = jest
      .fn<() => Promise<PhoneVerificationToken | undefined>>()
      .mockResolvedValue(phoneVerificationToken);
    const repository = {
      signin: async () => user,
      findPhoneVerificationToken: async () => phoneVerificationToken,
      consumePhoneVerificationToken,
    } as unknown as AuthRepository;
    const service = new AuthService(repository, {} as JwtService, {} as ConfigService, {} as UserService);

    await expect(
      service.signin(
        {
          email: user.email,
          password: "password",
          phoneVerificationToken: phoneVerificationToken.tokenHash,
        },
        "device",
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(consumePhoneVerificationToken).not.toHaveBeenCalled();
  });

  it("issues tokens for an existing kakao identity", async () => {
    const services = tokenServices();
    const repository = {
      ...services.repository,
      findUserByIdentity: jest.fn<() => Promise<User | null>>().mockResolvedValue(user),
      createKakaoUser: jest.fn<() => Promise<User>>(),
    } as unknown as AuthRepository;
    const service = new AuthService(repository, services.jwtService, services.configService, {} as UserService);

    await expect(
      service.loginWithKakao({ providerUserId: "kakao-user", email: user.email }, "device"),
    ).resolves.toEqual({ accessToken: "access", refreshToken: "refresh" });
    expect(repository.createKakaoUser).not.toHaveBeenCalled();
  });

  it("creates a user on first kakao login and issues tokens", async () => {
    const services = tokenServices();
    const repository = {
      ...services.repository,
      findUserByIdentity: jest.fn<() => Promise<null>>().mockResolvedValue(null),
      createKakaoUser: jest.fn<() => Promise<User>>().mockResolvedValue(user),
    } as unknown as AuthRepository;
    const service = new AuthService(repository, services.jwtService, services.configService, {} as UserService);

    await expect(
      service.loginWithKakao({ providerUserId: "kakao-user", email: user.email }, "device"),
    ).resolves.toEqual({ accessToken: "access", refreshToken: "refresh" });
    expect(repository.createKakaoUser).toHaveBeenCalledWith(
      expect.objectContaining({ providerUserId: "kakao-user", email: user.email }),
    );
  });

  it("falls back to a generated email when kakao profile has none", async () => {
    const services = tokenServices();
    const repository = {
      ...services.repository,
      findUserByIdentity: jest.fn<() => Promise<null>>().mockResolvedValue(null),
      createKakaoUser: jest.fn<() => Promise<User>>().mockResolvedValue(user),
    } as unknown as AuthRepository;
    const service = new AuthService(repository, services.jwtService, services.configService, {} as UserService);

    await service.loginWithKakao({ providerUserId: "kakao-user" }, "device");

    expect(repository.createKakaoUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: "kakao_kakao-user@kakao.local" }),
    );
  });

  it("rotates refresh token on refresh", async () => {
    const user: User = {
      userId: "553a6422-2525-4bd5-a5ce-5af75ea475c0",
      email: "user@example.com",
      phone: "+821011111111",
      password: "hash",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const savedToken: RefreshToken = {
      id: "d9d93b89-f8f4-4596-840a-82b167f0f91c",
      userId: user.userId,
      deviceId: "device",
      refreshToken: await bcrypt.hash("old-refresh", 10),
      refreshTokenExp: new Date(Date.now() + 60_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const repository = {
      findRefreshToken: jest.fn<() => Promise<RefreshToken | undefined>>().mockResolvedValue(savedToken),
      saveRefreshToken: jest.fn<() => Promise<void>>(),
    } as unknown as AuthRepository;
    const jwtService = {
      signAsync: jest
        .fn<() => Promise<string>>()
        .mockResolvedValueOnce("new-access")
        .mockResolvedValueOnce("new-refresh"),
      decode: jest.fn<() => { exp: number }>().mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 }),
    } as unknown as JwtService;
    const configService = {
      getOrThrow: jest.fn<() => string>().mockReturnValue("secret"),
    } as unknown as ConfigService;
    const userService = {
      findUser: jest.fn<() => Promise<User>>().mockResolvedValue(user),
    } as unknown as UserService;
    const service = new AuthService(repository, jwtService, configService, userService);

    await expect(service.refresh(user.userId, "device", "old-refresh")).resolves.toEqual({
      accessToken: "new-access",
      refreshToken: "new-refresh",
    });
    expect(repository.saveRefreshToken).toHaveBeenCalled();
  });

  it("logs out by deleting device refresh token", async () => {
    const repository = {
      deleteRefreshToken: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    } as unknown as AuthRepository;
    const service = new AuthService(repository, {} as JwtService, {} as ConfigService, {} as UserService);

    await expect(service.logout(user.userId, "device")).resolves.toBe(true);
    expect(repository.deleteRefreshToken).toHaveBeenCalledWith(user.userId, "device");
  });

  it("maps duplicate kakao signup to bad request", async () => {
    const repository = {
      findUserByIdentity: async () => null,
      createKakaoUser: async () => {
        throw { code: "23505" };
      },
    } as unknown as AuthRepository;
    const service = new AuthService(repository, {} as JwtService, {} as ConfigService, {} as UserService);

    await expect(service.loginWithKakao({ providerUserId: "kakao-user" }, "device")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
