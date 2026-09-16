import { Body, Controller, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Request, Response } from "express";
import { JwtAccessTokenGuard } from "src/guards/accessToken.guard";
import { deviceIdFromRequest, setTokenCookies } from "src/modules/auth/auth-http";
import { AuthRequest } from "src/modules/auth/auth.types";
import { PhoneService } from "./phone.service";
import {
  AttachPhoneToMeInput,
  CompletePhoneSignupInput,
  RequestPhoneCodeInput,
  ResetPasswordWithPhoneInput,
  VerifyPhoneCodeInput,
} from "./phone.types";

@Controller("phone")
export class PhoneController {
  constructor(private readonly phoneService: PhoneService) {}

  @Post("code")
  requestPhoneCode(@Body() input: RequestPhoneCodeInput, @Req() req: Request) {
    return this.phoneService.requestPhoneCode(input, req.ip, req.headers["user-agent"]);
  }

  @Post("verify")
  verifyPhoneCode(@Body() input: VerifyPhoneCodeInput, @Req() req: Request) {
    return this.phoneService.verifyPhoneCode(input, deviceIdFromRequest(req));
  }

  @Post("signup")
  async completePhoneSignup(
    @Body() input: CompletePhoneSignupInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokenData = await this.phoneService.completePhoneSignup(input, deviceIdFromRequest(req));
    setTokenCookies(res, tokenData);
    return tokenData;
  }

  @Post("reset-password")
  resetPasswordWithPhone(@Body() input: ResetPasswordWithPhoneInput) {
    return this.phoneService.resetPasswordWithPhone(input);
  }

  @UseGuards(JwtAccessTokenGuard)
  @Post("attach")
  attachPhoneToMe(@Req() req: AuthRequest, @Body() input: AttachPhoneToMeInput) {
    return this.phoneService.attachPhoneToMe(req.user.userId, input);
  }
}
