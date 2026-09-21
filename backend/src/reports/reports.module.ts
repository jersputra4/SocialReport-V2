import { Module } from "@nestjs/common";

import {
  ReportsController,
} from "./reports.controller";

import {
  ReportsService,
} from "./reports.service";

import {
  PrismaService,
} from "../prisma.service";

import {
  AuthModule,
} from "../auth/auth.module";

import {
  PlatformsModule,
} from "../platforms/platforms.module";

@Module({
  imports: [
    AuthModule,
    PlatformsModule,
  ],

  controllers: [
    ReportsController,
  ],

  providers: [
    ReportsService,
    PrismaService,
  ],

  exports: [
    ReportsService,
  ],
})
export class ReportsModule {}