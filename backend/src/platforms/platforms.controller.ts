import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PlatformsService } from "./platforms.service";

@ApiTags("platforms")
@Controller("platforms")
export class PlatformsController {
  constructor(private readonly service: PlatformsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get("detect")
  detect(@Query("url") url?: string) {
    return this.service.detectByUrl(url || "");
  }

  @Get("policies")
  policies(@Query("platform") platform?: string) {
    return this.service.findPoliciesByCode(platform || "");
  }
}
