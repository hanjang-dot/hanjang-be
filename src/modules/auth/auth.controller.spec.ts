import { describe, expect, it, jest, afterEach } from "@jest/globals";
import { Response } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { KakaoRequest } from "./auth.types";

describe("AuthController kakaoCallback", () => {
  const tokenData = { accessToken: "at", refreshToken: "rt" };
  const authService = {
    loginWithKakao: jest
      .fn<(profile: unknown, deviceId: string) => Promise<typeof tokenData>>()
      .mockResolvedValue(tokenData),
  } as unknown as AuthService;
  const controller = new AuthController(authService);

  const responseFor = () =>
    ({
      setHeader: jest.fn(),
      clearCookie: jest.fn(),
      cookie: jest.fn(),
      redirect: jest.fn(),
      json: jest.fn(),
    }) as unknown as Response & {
      setHeader: jest.Mock;
      clearCookie: jest.Mock;
      cookie: jest.Mock;
      redirect: jest.Mock;
      json: jest.Mock;
    };

  const requestFor = (state: string, headers: Record<string, string> = {}) =>
    ({
      user: { providerUserId: "kakao-user" },
      query: { state },
      headers,
    }) as unknown as KakaoRequest;

  afterEach(() => {
    delete process.env.KAKAO_MOBILE_REDIRECT_SCHEME;
    jest.clearAllMocks();
  });

  it("redirects to mobile scheme with tokens when state carries mobile client", async () => {
    const res = responseFor();

    await controller.kakaoCallback(requestFor("abc:mobile"), res);

    expect(res.redirect).toHaveBeenCalledWith("hanjang://auth/kakao?access=at&refresh=rt");
    expect(res.json).not.toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledWith("kakao_oauth_state", expect.anything());
  });

  it("uses KAKAO_MOBILE_REDIRECT_SCHEME when configured", async () => {
    process.env.KAKAO_MOBILE_REDIRECT_SCHEME = "myapp";
    const res = responseFor();

    await controller.kakaoCallback(requestFor("abc:mobile"), res);

    expect(res.redirect).toHaveBeenCalledWith("myapp://auth/kakao?access=at&refresh=rt");
  });

  it("returns tokens and cookies for web client", async () => {
    const res = responseFor();

    await controller.kakaoCallback(requestFor("abc"), res);

    expect(res.cookie).toHaveBeenCalledWith("access_token", "at", expect.anything());
    expect(res.cookie).toHaveBeenCalledWith("refresh_token", "rt", expect.anything());
    expect(res.json).toHaveBeenCalledWith({ accessToken: "at", refreshToken: "rt" });
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it("generates a device id when the callback has no x-device-id header", async () => {
    const res = responseFor();

    await controller.kakaoCallback(requestFor("abc"), res);

    expect(authService.loginWithKakao).toHaveBeenCalledWith({ providerUserId: "kakao-user" }, expect.any(String));
  });

  it("passes x-device-id header to kakao login", async () => {
    const res = responseFor();

    await controller.kakaoCallback(requestFor("abc", { "x-device-id": "device-1" }), res);

    expect(authService.loginWithKakao).toHaveBeenCalledWith({ providerUserId: "kakao-user" }, "device-1");
  });
});
