import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { JwtAdminGuard } from "src/guards/adminToken.guard";
import { JwtAdminTokenStrategy } from "src/strategys/adminToken.strategy";
import { AdminController } from "./admin.controller";
import { AdminRepository } from "./admin.repository";
import { AdminService } from "./admin.service";

@Module({
  imports: [JwtModule.register({ global: true })],
  controllers: [AdminController],
  providers: [AdminService, AdminRepository, JwtAdminGuard, JwtAdminTokenStrategy],
  exports: [AdminService],
})
export class AdminModule {}
