import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { JwtAccessTokenGuard } from "src/guards/accessToken.guard";
import { JwtAccessTokenStrategy } from "src/strategys/accessToken.strategy";
import { UserController } from "./user.controller";
import { UserRepository } from "./user.repository";
import { UserService } from "./user.service";

@Module({
  imports: [JwtModule.register({ global: true })],
  controllers: [UserController],
  providers: [UserService, UserRepository, JwtAccessTokenGuard, JwtAccessTokenStrategy],
  exports: [UserService, UserRepository],
})
export class UserModule {}
