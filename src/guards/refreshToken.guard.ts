import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtRefreshTokenGuard extends AuthGuard("refresh_token") {
  getRequest(context: ExecutionContext) {
    return context.switchToHttp().getRequest();
  }
}
