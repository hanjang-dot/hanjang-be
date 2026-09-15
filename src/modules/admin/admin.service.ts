import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { randomBytes, randomUUID } from "crypto";
import { CustomBadRequestException, CustomUnauthorizedException } from "src/common/errors/custom-exceptions";
import { Admin } from "src/modules/database/schema";
import { AdminErrorMessage } from "./admin.error";
import { AdminRepository } from "./admin.repository";
import { AcceptAdminInviteInput, AdminSigninInput } from "./admin.types";

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signin(input: AdminSigninInput) {
    const admin = await this.adminRepository.findAdminByLoginId(input.loginId);
    if (!admin) throw new CustomUnauthorizedException(AdminErrorMessage.AdminAuthRequired);

    const isPasswordValid = await bcrypt.compare(input.password, admin.passwordHash);
    if (!isPasswordValid) throw new CustomUnauthorizedException(AdminErrorMessage.AdminAuthRequired);

    this.logger.log(JSON.stringify({ event: "admin_signin", result: "success" }));
    return { accessToken: await this.createAccessToken(admin) };
  }

  async createInvite(adminId: string) {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await this.adminRepository.createInvite({
      token,
      createdByAdminId: adminId,
      expiresAt,
    });

    const baseUrl = this.configService.get<string>("CLIENT_URL") ?? "";
    this.logger.log(JSON.stringify({ event: "admin_invite_create", result: "success" }));
    return { token, inviteUrl: `${baseUrl}/admin/invite?token=${token}`, expiresAt: invite.expiresAt };
  }

  async acceptInvite(input: AcceptAdminInviteInput) {
    const admin = await this.mapDuplicateLoginIdError(
      this.adminRepository.acceptInvite({
        token: input.token,
        adminId: randomUUID(),
        loginId: input.loginId,
        passwordHash: await bcrypt.hash(input.password, 10),
      }),
    );
    if (!admin) throw new CustomUnauthorizedException(AdminErrorMessage.InvalidAdminInviteToken);

    this.logger.log(JSON.stringify({ event: "admin_invite_accept", result: "success" }));
    return { accessToken: await this.createAccessToken(admin) };
  }

  private createAccessToken(admin: Admin) {
    return this.jwtService.signAsync(
      { adminId: admin.adminId, role: "admin" },
      {
        secret: this.configService.getOrThrow<string>("JWT_ACCESS_TOKEN_SECRET"),
        expiresIn: this.configService.getOrThrow<string>("JWT_ACCESS_TOKEN_EXP") as JwtSignOptions["expiresIn"],
      },
    );
  }

  private async mapDuplicateLoginIdError<T>(operation: Promise<T>) {
    try {
      return await operation;
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
        throw new CustomBadRequestException(AdminErrorMessage.DuplicateAdminLoginId);
      }
      throw error;
    }
  }
}
