import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { ReportsService } from "./reports.service";
import { CreateReportDto, UpdateReportDto } from "./dto";

@ApiTags("reports")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("reports")
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateReportDto) {
    return this.service.create(req.user.sub, dto);
  }

  @Get()
  list(@Request() req: any, @Query() query: any) {
    return this.service.list(req.user, query);
  }

  @Get(":id/pdf")
  async pdf(
    @Param("id") id: string,
    @Request() req: any,
    @Res() response: Response,
  ) {
    const result = await this.service.generatePdf(id, req.user);

    response.setHeader("Content-Type", "application/pdf");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.fileName}"`,
    );
    response.setHeader(
      "Content-Length",
      String(result.buffer.length),
    );

    response.end(result.buffer);
  }

  @Get(":id")
  one(@Param("id") id: string, @Request() req: any) {
    return this.service.findOne(id, req.user);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Request() req: any,
    @Body() dto: UpdateReportDto,
  ) {
    return this.service.update(id, req.user, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Request() req: any) {
    return this.service.remove(id, req.user);
  }
}
