import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { Request, Response } from "express";
import { KakaoGuard } from "src/guards/kakao.guard";
import { JwtRefreshTokenGuard } from "src/guards/refreshToken.guard";
import { deviceIdFromRequest, setTokenCookies } from "./auth-http";
import { AuthService } from "./auth.service";
import { authCookieOptions } from "./cookie-options";
import { KakaoRequest, RefreshAuthRequest, SigninAuthInput, SignupAuthInput } from "./auth.types";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  async signup(@Body() input: SignupAuthInput, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const tokenData = await this.authService.signup(input, deviceIdFromRequest(req));
    setTokenCookies(res, tokenData);
    return tokenData;
  }

  @Post("signin")
  async signin(@Body() input: SigninAuthInput, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const tokenData = await this.authService.signin(input, deviceIdFromRequest(req));
    setTokenCookies(res, tokenData);
    return tokenData;
  }

  @Get("signed")
  signed(@Query("email") email: string) {
    return this.authService.signed(email);
  }

  @UseGuards(JwtRefreshTokenGuard)
  @Post("refresh")
  async refresh(@Req() req: RefreshAuthRequest, @Res({ passthrough: true }) res: Response) {
    const tokenData = await this.authService.refresh(req.user.userId, req.user.deviceId, req.cookies.refresh_token);
    setTokenCookies(res, tokenData);
    return tokenData;
  }

  @UseGuards(JwtRefreshTokenGuard)
  @Post("logout")
  async logout(@Req() req: RefreshAuthRequest, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user.userId, req.user.deviceId);
    res.clearCookie("access_token", authCookieOptions);
    res.clearCookie("refresh_token", authCookieOptions);
    return { ok: true };
  }

  @UseGuards(KakaoGuard)
  @Get("kakao")
  kakaoLogin() {}

  @UseGuards(KakaoGuard)
  @Get("kakao/callback")
  async kakaoCallback(@Req() req: KakaoRequest, @Res() res: Response) {
    const result = await this.authService.loginWithKakao(req.user);
    res.clearCookie("kakao_oauth_state", authCookieOptions);
    const state = req.query.state;
    if (typeof state === "string" && state.split(":").at(-1) === "mobile") {
      const scheme = process.env.KAKAO_MOBILE_REDIRECT_SCHEME ?? "hanjang";
      return res.redirect(`${scheme}://auth/kakao?kpt=${encodeURIComponent(result.kakaoPhoneVerificationToken)}`);
    }
    res.cookie("kakao_phone_verification_token", result.kakaoPhoneVerificationToken, authCookieOptions);
    return res.json({ kakaoPhoneVerificationToken: result.kakaoPhoneVerificationToken });
  }
}
