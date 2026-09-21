import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PrismaService } from "../prisma.service";
import { JwtAuthGuard } from "./jwt.guard";

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET || "dev-secret", signOptions: { expiresIn: "8h" } })],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtAuthGuard],
  exports: [JwtModule, AuthService, JwtAuthGuard]
})
export class AuthModule {}
