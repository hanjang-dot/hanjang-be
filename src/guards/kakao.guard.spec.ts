import { ExecutionContext } from "@nestjs/common";
import { describe, expect, it, jest } from "@jest/globals";
import { Request } from "express";
import { KakaoGuard } from "src/guards/kakao.guard";
import { CustomUnauthorizedException } from "src/common/errors/custom-exceptions";
import { AuthErrorMessage } from "src/modules/auth/auth.error";

describe("KakaoGuard", () => {
  const guard = new KakaoGuard();

  const contextFor = (request: Partial<Request>) => {
    const response = { cookie: jest.fn(), clearCookie: jest.fn() };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;
    return { context, response };
  };

  it("appends :mobile to state when client=mobile", () => {
    const { context, response } = contextFor({
      path: "/auth/kakao",
      query: { client: "mobile" },
      cookies: {},
    });

    const options = guard.getAuthenticateOptions(context);

    expect(options.state).toMatch(/^[0-9a-f]{64}:mobile$/);
    expect(response.cookie).toHaveBeenCalledWith(
      "kakao_oauth_state",
      options.state,
      expect.objectContaining({ maxAge: 5 * 60 * 1000 }),
    );
  });

  it("keeps plain random state for web client", () => {
    const { context, response } = contextFor({
      path: "/auth/kakao",
      query: {},
      cookies: {},
    });

    const options = guard.getAuthenticateOptions(context);

    expect(options.state).toMatch(/^[0-9a-f]{64}$/);
    expect(response.cookie).toHaveBeenCalledWith("kakao_oauth_state", options.state, expect.anything());
  });

  it("accepts callback when query state matches cookie state", () => {
    const { context } = contextFor({
      path: "/auth/kakao/callback",
      query: { code: "code", state: "abc:mobile" },
      cookies: { kakao_oauth_state: "abc:mobile" },
    });

    expect(guard.getAuthenticateOptions(context)).toEqual({ state: "abc:mobile" });
  });

  it("rejects callback with tampered state", () => {
    const { context } = contextFor({
      path: "/auth/kakao/callback",
      query: { code: "code", state: "tampered:mobile" },
      cookies: { kakao_oauth_state: "abc:mobile" },
    });

    expect(() => guard.getAuthenticateOptions(context)).toThrow(
      new CustomUnauthorizedException(AuthErrorMessage.InvalidOauthState),
    );
  });

  it("rejects callback without state cookie", () => {
    const { context } = contextFor({
      path: "/auth/kakao/callback",
      query: { code: "code", state: "abc" },
      cookies: {},
    });

    expect(() => guard.getAuthenticateOptions(context)).toThrow(
      new CustomUnauthorizedException(AuthErrorMessage.InvalidOauthState),
    );
  });
});
