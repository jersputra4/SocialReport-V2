import { Injectable, NotFoundException } from "@nestjs/common";
import { createHash } from "crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaService } from "../prisma.service";
import { randomUUID } from "crypto";

@Injectable()
export class EvidenceService {
  private s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || "us-east-1",
    forcePathStyle: true,
    credentials: { accessKeyId:process.env.S3_ACCESS_KEY!, secretAccessKey:process.env.S3_SECRET_KEY! }
  });
  constructor(private prisma:PrismaService){}

  async upload(reportId:string,user:any,file:Express.Multer.File) {
    const report=await this.prisma.report.findUnique({where:{id:reportId}});
    if(!report) throw new NotFoundException("Report not found");
    if(user.role!=="ADMIN" && report.reporterId!==user.sub) throw new NotFoundException("Report not found");
    const hash=createHash("sha256").update(file.buffer).digest("hex");
    const key=`reports/${reportId}/${randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
    await this.s3.send(new PutObjectCommand({Bucket:process.env.S3_BUCKET!,Key:key,Body:file.buffer,ContentType:file.mimetype}));
    return this.prisma.evidence.create({data:{
      reportId,uploadedBy:user.sub,fileName:file.originalname,mimeType:file.mimetype,fileSize:file.size,storageKey:key,sha256:hash
    }});
  }
}
