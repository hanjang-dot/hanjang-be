import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAdminGuard extends AuthGuard("admin_token") {
  getRequest(context: ExecutionContext) {
    return context.switchToHttp().getRequest();
  }
}
