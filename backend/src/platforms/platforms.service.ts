import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PlatformsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.platform.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
  }

  async detectByUrl(targetUrl: string) {
    let parsed: URL;

    try {
      parsed = new URL(targetUrl);
    } catch {
      throw new BadRequestException("URL tidak valid.");
    }

    if (!/^https?:$/.test(parsed.protocol)) {
      throw new BadRequestException("URL harus menggunakan HTTP atau HTTPS.");
    }

    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");

    let code: string | null = null;

    if (
      hostname === "instagram.com" ||
      hostname.endsWith(".instagram.com")
    ) {
      code = "INSTAGRAM";
    } else if (
      hostname === "facebook.com" ||
      hostname.endsWith(".facebook.com") ||
      hostname === "fb.watch" ||
      hostname.endsWith(".fb.watch")
    ) {
      code = "FACEBOOK";
    } else if (
      hostname === "tiktok.com" ||
      hostname.endsWith(".tiktok.com") ||
      hostname === "vm.tiktok.com" ||
      hostname === "vt.tiktok.com"
    ) {
      code = "TIKTOK";
    } else if (
      hostname === "x.com" ||
      hostname.endsWith(".x.com") ||
      hostname === "twitter.com" ||
      hostname.endsWith(".twitter.com")
    ) {
      code = "X";
    } else if (
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "youtu.be" ||
      hostname.endsWith(".youtu.be")
    ) {
      code = "YOUTUBE";
    }

    if (!code) {
      throw new BadRequestException(
        "Platform tidak didukung. Gunakan link Facebook, Instagram, TikTok, X, atau YouTube.",
      );
    }

    const platform = await this.prisma.platform.findFirst({
      where: {
        code,
        active: true,
      },
    });

    if (!platform) {
      throw new BadRequestException("Platform belum tersedia di sistem.");
    }

    const policies = await this.prisma.policy.findMany({
      where: {
        platformId: platform.id,
        active: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        version: true,
        sourceUrl: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      detected: true,
      platform: {
        id: platform.id,
        name: platform.name,
        code: platform.code,
        baseUrl: platform.baseUrl,
      },
      policies,
    };
  }

  async findPoliciesByCode(code: string) {
    const platform = await this.prisma.platform.findFirst({
      where: {
        code: code.toUpperCase(),
        active: true,
      },
    });

    if (!platform) {
      throw new BadRequestException("Platform tidak ditemukan.");
    }

    return this.prisma.policy.findMany({
      where: {
        platformId: platform.id,
        active: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        version: true,
        sourceUrl: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }
}
