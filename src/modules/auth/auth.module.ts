import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { JwtRefreshTokenGuard } from "src/guards/refreshToken.guard";
import { KakaoGuard } from "src/guards/kakao.guard";
import { KakaoStrategy } from "src/strategys/kakao.strategy";
import { JwtRefreshTokenStrategy } from "src/strategys/refreshToken.strategy";
import { UserModule } from "src/modules/user/user.module";
import { AuthController } from "./auth.controller";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";

@Module({
  imports: [JwtModule.register({ global: true }), UserModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    JwtRefreshTokenGuard,
    JwtRefreshTokenStrategy,
    KakaoGuard,
    {
      provide: KakaoStrategy,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get<string>("KAKAO_CLIENT_ID") ? new KakaoStrategy(configService) : null,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
