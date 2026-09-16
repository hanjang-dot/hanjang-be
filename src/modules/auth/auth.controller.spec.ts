import { describe, expect, it, jest, afterEach } from "@jest/globals";
import { Response } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { KakaoRequest } from "./auth.types";

describe("AuthController kakaoCallback", () => {
  const authService = {
    loginWithKakao: jest.fn<() => Promise<{ kakaoPhoneVerificationToken: string }>>().mockResolvedValue({
      kakaoPhoneVerificationToken: "kpt-token",
    }),
  } as unknown as AuthService;
  const controller = new AuthController(authService);

  const responseFor = () =>
    ({
      clearCookie: jest.fn(),
      cookie: jest.fn(),
      redirect: jest.fn(),
      json: jest.fn(),
    }) as unknown as Response & {
      clearCookie: jest.Mock;
      cookie: jest.Mock;
      redirect: jest.Mock;
      json: jest.Mock;
    };

  const requestFor = (state: string) =>
    ({
      user: { providerUserId: "kakao-user" },
      query: { state },
    }) as unknown as KakaoRequest;

  afterEach(() => {
    delete process.env.KAKAO_MOBILE_REDIRECT_SCHEME;
  });

  it("redirects to mobile scheme when state carries mobile client", async () => {
    const res = responseFor();

    await controller.kakaoCallback(requestFor("abc:mobile"), res);

    expect(res.redirect).toHaveBeenCalledWith("hanjang://auth/kakao?kpt=kpt-token");
    expect(res.json).not.toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledWith("kakao_oauth_state", expect.anything());
  });

  it("uses KAKAO_MOBILE_REDIRECT_SCHEME when configured", async () => {
    process.env.KAKAO_MOBILE_REDIRECT_SCHEME = "myapp";
    const res = responseFor();

    await controller.kakaoCallback(requestFor("abc:mobile"), res);

    expect(res.redirect).toHaveBeenCalledWith("myapp://auth/kakao?kpt=kpt-token");
  });

  it("returns json and cookie for web client", async () => {
    const res = responseFor();

    await controller.kakaoCallback(requestFor("abc"), res);

    expect(res.cookie).toHaveBeenCalledWith("kakao_phone_verification_token", "kpt-token", expect.anything());
    expect(res.json).toHaveBeenCalledWith({ kakaoPhoneVerificationToken: "kpt-token" });
    expect(res.redirect).not.toHaveBeenCalled();
  });
});
