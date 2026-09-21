import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { PrismaService } from "../prisma.service";
import { AuthModule } from "../auth/auth.module";
import { ReportsModule } from "../reports/reports.module";
@Module({ imports:[AuthModule,ReportsModule],controllers:[AdminController],providers:[AdminService,PrismaService] })
export class AdminModule {}
