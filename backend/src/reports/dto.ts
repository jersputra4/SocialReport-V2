import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  Min,
} from "class-validator";
import { ContentType, ReportStatus } from "@prisma/client";

export class CreateReportDto {
  @IsUrl()
  url!: string;

  @IsUUID()
  policyId!: string;

  @IsEnum(ContentType)
  contentType!: ContentType;

  @IsOptional()
  @IsString()
  platformCode?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100000)
  reportQuantity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;
}

export class UpdateReportDto {
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsUUID()
  policyId?: string;

  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100000)
  reportQuantity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;
}
