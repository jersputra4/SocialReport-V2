import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { PlatformsService } from "../platforms/platforms.service";
import { ContentType, ReportStatus } from "@prisma/client";
import { CreateReportDto, UpdateReportDto } from "./dto";

const UNIT_PRICE = 1500;
const MAX_QUANTITY = 100000;

function escapePdfText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapText(value: string, width = 92): string[] {
  const cleaned = value.replace(/\r?\n/g, " ").trim();
  if (!cleaned) return [""];

  const words = cleaned.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (`${current} ${word}`.length <= width) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function makePdfPages(lines: string[]): Buffer {
  const maxLinesPerPage = 43;
  const pages: string[][] = [];

  for (let i = 0; i < lines.length; i += maxLinesPerPage) {
    pages.push(lines.slice(i, i + maxLinesPerPage));
  }

  if (pages.length === 0) pages.push(["ReportHub"]);

  const objects: string[] = [];
  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;

  const pageIds: number[] = [];

  pages.forEach((pageLines, index) => {
    const pageId = 4 + index * 2;
    const contentId = pageId + 1;
    pageIds.push(pageId);

    const commands: string[] = [
      "BT",
      "/F1 18 Tf",
      "50 785 Td",
      "(ReportHub - Laporan Konten Media Sosial) Tj",
      "0 -28 Td",
      "/F1 10 Tf",
    ];

    pageLines.forEach((line, lineIndex) => {
      if (lineIndex > 0) commands.push("0 -16 Td");
      commands.push(`(${escapePdfText(line)}) Tj`);
    });

    commands.push("ET");
    const stream = commands.join("\n");

    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ` +
      `/Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;

    objects[contentId] =
      `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`;
  });

  objects[2] =
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  const chunks: Buffer[] = [];
  let offset = 0;

  const header = "%PDF-1.4\n%\xFF\xFF\xFF\xFF\n";
  const headerBuffer = Buffer.from(header, "binary");
  chunks.push(headerBuffer);
  offset += headerBuffer.length;

  const offsets: number[] = [];
  const maxObjectId = objects.length - 1;

  for (let id = 1; id <= maxObjectId; id += 1) {
    const objectBody = objects[id];
    if (!objectBody) continue;

    offsets[id] = offset;
    const objectBuffer = Buffer.from(
      `${id} 0 obj\n${objectBody}\nendobj\n`,
      "binary",
    );

    chunks.push(objectBuffer);
    offset += objectBuffer.length;
  }

  const xrefOffset = offset;
  let xref = `xref\n0 ${maxObjectId + 1}\n`;
  xref += "0000000000 65535 f \n";

  for (let id = 1; id <= maxObjectId; id += 1) {
    xref += `${String(offsets[id] || 0).padStart(10, "0")} 00000 n \n`;
  }

  xref +=
    `trailer\n<< /Size ${maxObjectId + 1} /Root 1 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF\n`;

  chunks.push(Buffer.from(xref, "binary"));
  return Buffer.concat(chunks);
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platforms: PlatformsService,
  ) {}

  private async nextCode() {
    const count = await this.prisma.report.count();
    return `RPT-${new Date().getFullYear()}-${String(count + 1).padStart(6, "0")}`;
  }

  async create(userId: string, dto: CreateReportDto) {
    const detected = await this.platforms.detectByUrl(dto.url);

    const policy = await this.prisma.policy.findFirst({
      where: {
        id: dto.policyId,
        platformId: detected.platform.id,
        active: true,
      },
    });

    if (!policy) {
      throw new BadRequestException(
        "Policy yang dipilih tidak tersedia untuk platform pada URL tersebut.",
      );
    }

    const reportQuantity = dto.reportQuantity ?? 1;

    if (reportQuantity < 1 || reportQuantity > MAX_QUANTITY) {
      throw new BadRequestException(
        `Jumlah Report harus antara 1 dan ${MAX_QUANTITY.toLocaleString("id-ID")}.`,
      );
    }

    const totalPrice = reportQuantity * UNIT_PRICE;

    return this.prisma.report.create({
      data: {
        reportCode: await this.nextCode(),
        reporterId: userId,
        createdById: userId,
        platformId: detected.platform.id,
        policyId: policy.id,
        contentType: dto.contentType,
        url: dto.url.trim(),
        description: policy.name,
        priority: dto.priority ?? 2,
        reportQuantity,
        unitPrice: UNIT_PRICE,
        totalPrice,
      },
      include: {
        platform: true,
        policy: true,
      },
    });
  }

  async list(user: any, query: any) {
    const where: any = {
      deletedAt: null,
      ...(user.role === "ADMIN" ? {} : { reporterId: user.sub }),
    };

    if (query.status) where.status = query.status;
    if (query.platform) where.platform = { code: query.platform };

    if (query.search) {
      where.OR = [
        {
          reportCode: {
            contains: query.search,
            mode: "insensitive",
          },
        },
        {
          url: {
            contains: query.search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: query.search,
            mode: "insensitive",
          },
        },
        {
          policy: {
            name: {
              contains: query.search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    return this.prisma.report.findMany({
      where,
      include: {
        platform: true,
        policy: true,
        reporter: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
        evidence: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findOne(id: string, user: any) {
    const report = await this.prisma.report.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        platform: true,
        policy: true,
        reporter: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
        evidence: true,
        reviews: {
          include: {
            admin: {
              select: {
                username: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        contents: true,
        platformReport: true,
      },
    });

    if (!report) {
      throw new NotFoundException("Laporan tidak ditemukan.");
    }

    if (
      user.role !== "ADMIN" &&
      report.reporterId !== user.sub
    ) {
      throw new ForbiddenException();
    }

    return report;
  }

  async update(
    id: string,
    user: any,
    dto: UpdateReportDto,
  ) {
    const existing = await this.findOne(id, user);

    if (
      user.role !== "ADMIN" &&
      existing.reporterId !== user.sub
    ) {
      throw new ForbiddenException();
    }

    if (
      user.role !== "ADMIN" &&
      dto.status !== undefined
    ) {
      throw new ForbiddenException(
        "Status hanya dapat diubah oleh admin.",
      );
    }

    let platformId = existing.platformId;
    let policyId = existing.policyId;
    let url = existing.url;
    let description = existing.description;

    if (dto.url) {
      url = dto.url.trim();

      const detected = await this.platforms.detectByUrl(url);
      platformId = detected.platform.id;

      if (dto.policyId) {
        const policy = await this.prisma.policy.findFirst({
          where: {
            id: dto.policyId,
            platformId,
            active: true,
          },
        });

        if (!policy) {
          throw new BadRequestException(
            "Policy tidak sesuai dengan platform pada URL baru.",
          );
        }

        policyId = policy.id;
        description = policy.name;
      } else if (existing.policyId) {
        const currentPolicy = await this.prisma.policy.findFirst({
          where: {
            id: existing.policyId,
            platformId,
            active: true,
          },
        });

        if (!currentPolicy) {
          policyId = null;
          description = "Policy perlu dipilih ulang oleh admin.";
        }
      }
    } else if (dto.policyId !== undefined) {
      const policy = await this.prisma.policy.findFirst({
        where: {
          id: dto.policyId,
          platformId,
          active: true,
        },
      });

      if (!policy) {
        throw new BadRequestException(
          "Policy yang dipilih tidak tersedia pada platform laporan.",
        );
      }

      policyId = policy.id;
      description = policy.name;
    }

    const quantity = dto.reportQuantity ?? existing.reportQuantity;

    if (quantity < 1 || quantity > MAX_QUANTITY) {
      throw new BadRequestException(
        `Jumlah Report harus antara 1 dan ${MAX_QUANTITY.toLocaleString("id-ID")}.`,
      );
    }

    const data: any = {
      url,
      platformId,
      policyId,
      description,
      reportQuantity: quantity,
      unitPrice: UNIT_PRICE,
      totalPrice: quantity * UNIT_PRICE,
    };

    if (dto.contentType !== undefined) {
      data.contentType = dto.contentType as ContentType;
    }

    if (dto.priority !== undefined) {
      data.priority = dto.priority;
    }

    if (dto.status !== undefined) {
      data.status = dto.status as ReportStatus;
    }

    return this.prisma.report.update({
      where: { id },
      data,
      include: {
        platform: true,
        policy: true,
        reporter: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: string, user: any) {
    if (user.role !== "ADMIN") {
      throw new ForbiddenException("Admin only");
    }

    await this.findOne(id, user);

    return this.prisma.report.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: ReportStatus.CLOSED,
      },
    });
  }

  async generatePdf(id: string, user: any) {
    const report = await this.findOne(id, user);

    const lines: string[] = [
      `Kode Report : ${report.reportCode}`,
      `Tanggal     : ${new Date(report.createdAt).toLocaleString("id-ID")}`,
      "",
      "INFORMASI PELAPOR",
      `Nama        : ${report.reporter.name}`,
      `Username    : ${report.reporter.username}`,
      `Email       : ${report.reporter.email}`,
      "",
      "TARGET LAPORAN",
      `Platform    : ${report.platform.name}`,
      `Jenis Konten: ${report.contentType}`,
    ];

    for (const part of wrapText(`URL         : ${report.url}`, 92)) {
      lines.push(part);
    }

    lines.push(
      "",
      "KEBIJAKAN",
      `Policy      : ${report.policy?.name || report.description}`,
      `Versi       : ${report.policy?.version || "-"}`,
    );

    for (const part of wrapText(
      `Sumber      : ${report.policy?.sourceUrl || "-"}`,
      92,
    )) {
      lines.push(part);
    }

    lines.push(
      "",
      "PERMINTAAN REPORT",
      `Jumlah Report: ${report.reportQuantity}`,
      `Harga / Report: Rp ${report.unitPrice.toLocaleString("id-ID")}`,
      `Total Harga : Rp ${report.totalPrice.toLocaleString("id-ID")}`,
      `Prioritas   : ${report.priority}`,
      `Status      : ${report.status}`,
      "",
      `Evidence    : ${report.evidence.filter((item) => !item.deletedAt).length} file`,
      "",
      "RIWAYAT REVIEW",
    );

    if (report.reviews.length === 0) {
      lines.push("Belum ada review admin.");
    } else {
      for (const review of report.reviews) {
        lines.push(
          `${review.createdAt.toLocaleString("id-ID")} | ${review.admin.name} | ${review.decision}`,
        );

        if (review.reason) {
          lines.push(...wrapText(`Alasan: ${review.reason}`, 88));
        }

        if (review.notes) {
          lines.push(...wrapText(`Catatan: ${review.notes}`, 88));
        }

        lines.push("");
      }
    }

    lines.push(
      "Catatan: dokumen ini merupakan salinan administratif dari data ReportHub saat diunduh.",
    );

    return {
      buffer: makePdfPages(lines),
      fileName: `ReportHub-${report.reportCode}.pdf`,
    };
  }
}
