import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAdminGuard } from "src/guards/adminToken.guard";
import { AdminService } from "./admin.service";
import { AcceptAdminInviteInput, AdminRequest, AdminSigninInput } from "./admin.types";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post("login")
  async login(@Body() input: AdminSigninInput) {
    return this.adminService.signin(input);
  }

  @UseGuards(JwtAdminGuard)
  @Post("invites")
  async createInvite(@Req() req: AdminRequest) {
    return this.adminService.createInvite(req.user.adminId);
  }

  @Post("invites/accept")
  async acceptInvite(@Body() input: AcceptAdminInviteInput) {
    return this.adminService.acceptInvite(input);
  }
}
