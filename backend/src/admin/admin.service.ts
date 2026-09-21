import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  dashboard() {
    return this.prisma.report.groupBy({
      by:["status"],
      _count:{_all:true}
    });
  }

  async review(reportId:string, adminId:string, decision:string, reason?:string, notes?:string) {
    const status = decision==="APPROVE" ? "APPROVED" : decision==="REJECT" ? "REJECTED" : "NEED_INFORMATION";
    const review = await this.prisma.review.create({data:{reportId,adminId,decision,reason,notes}});
    await this.prisma.report.update({where:{id:reportId},data:{status}});
    const report=await this.prisma.report.findUnique({where:{id:reportId}});
    if(report) await this.prisma.notification.create({
      data:{userId:report.reporterId,reportId,type:"REPORT_STATUS",title:"Status laporan berubah",message:`Laporan ${report.reportCode} sekarang ${status}.`}
    });
    return review;
  }
}
