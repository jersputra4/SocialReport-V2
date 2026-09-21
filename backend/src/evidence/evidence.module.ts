import { Module } from "@nestjs/common";
import { EvidenceController } from "./evidence.controller";
import { EvidenceService } from "./evidence.service";
import { PrismaService } from "../prisma.service";
import { AuthModule } from "../auth/auth.module";
@Module({imports:[AuthModule],controllers:[EvidenceController],providers:[EvidenceService,PrismaService]})
export class EvidenceModule {}
