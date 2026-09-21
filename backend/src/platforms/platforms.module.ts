import { Module } from "@nestjs/common";
import { PlatformsController } from "./platforms.controller";
import { PlatformsService } from "./platforms.service";
import { PrismaService } from "../prisma.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [PlatformsController],
  providers: [PlatformsService, PrismaService],
  exports: [PlatformsService],
})
export class PlatformsModule {}
