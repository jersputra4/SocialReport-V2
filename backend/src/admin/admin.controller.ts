import { Body, Controller, Get, Param, Post, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { AdminService } from "./admin.service";

@ApiTags("admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("admin")
export class AdminController {
  constructor(private service:AdminService){}
  @Get("dashboard") dashboard(){return this.service.dashboard();}
  @Post("reports/:id/review")
  review(@Param("id") id:string,@Request() req:any,@Body() body:{decision:string,reason?:string,notes?:string}){
    return this.service.review(id,req.user.sub,body.decision,body.reason,body.notes);
  }
}
