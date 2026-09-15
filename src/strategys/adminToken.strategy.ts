import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy, StrategyOptions } from "passport-jwt";
import { CustomForbiddenException } from "src/common/errors/custom-exceptions";
import { AdminErrorMessage } from "src/modules/admin/admin.error";
import { AdminJwtPayload } from "src/modules/admin/admin.types";
import { JwtPayload } from "src/modules/auth/auth.types";

@Injectable()
export class JwtAdminTokenStrategy extends PassportStrategy(Strategy, "admin_token") {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => request.cookies?.access_token ?? null,
      ]),
      secretOrKey: configService.getOrThrow<string>("JWT_ACCESS_TOKEN_SECRET"),
      ignoreExpiration: false,
    } satisfies StrategyOptions);
  }

  validate(payload: JwtPayload & { adminId?: string; role?: string }): AdminJwtPayload {
    if (payload.role !== "admin" || !payload.adminId) {
      throw new CustomForbiddenException(AdminErrorMessage.AdminRoleRequired);
    }
    return { adminId: payload.adminId, role: "admin" };
  }
}
