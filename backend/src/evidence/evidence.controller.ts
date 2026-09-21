import { Controller, Param, Post, Request, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { EvidenceService } from "./evidence.service";

@ApiTags("evidence")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("reports/:id/evidence")
export class EvidenceController {
  constructor(private service:EvidenceService){}
  @Post()
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file",{limits:{fileSize:25*1024*1024}}))
  upload(@Param("id") id:string,@Request() req:any,@UploadedFile() file:Express.Multer.File){
    return this.service.upload(id,req.user,file);
  }
}
