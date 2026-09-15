import { Body, Controller, Get, Patch, Req, UseGuards } from "@nestjs/common";
import { JwtAccessTokenGuard } from "src/guards/accessToken.guard";
import { AuthRequest } from "src/modules/auth/auth.types";
import { UserService } from "./user.service";
import { UpdateEmailInput, UpdatePasswordInput } from "./user.types";

@UseGuards(JwtAccessTokenGuard)
@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("me")
  async me(@Req() req: AuthRequest) {
    const user = await this.userService.findUser(req.user.userId);
    return { email: user.email };
  }

  @Patch("me/email")
  async updateEmail(@Req() req: AuthRequest, @Body() input: UpdateEmailInput) {
    await this.userService.updateEmail({ ...input, userId: req.user.userId });
    return { ok: true };
  }

  @Patch("me/password")
  async updatePassword(@Req() req: AuthRequest, @Body() input: UpdatePasswordInput) {
    await this.userService.updatePassword({ ...input, userId: req.user.userId });
    return { ok: true };
  }
}
