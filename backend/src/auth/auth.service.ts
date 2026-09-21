import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma.service";
import { LoginDto, RegisterDto } from "./dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const username = dto.username.trim();

    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException("Username atau password salah");
    }

    const passwordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException("Username atau password salah");
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      accessToken,
      user: this.safeUser(user),
    };
  }

  async register(dto: RegisterDto) {
    const username = dto.username.trim();
    const name = dto.name.trim();
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone?.trim() || null;

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new ConflictException("Username sudah digunakan");
      }

      if (existingUser.email === email) {
        throw new ConflictException("Email sudah terdaftar");
      }

      throw new ConflictException("Username atau email sudah terdaftar");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    try {
      const user = await this.prisma.user.create({
        data: {
          username,
          name,
          email,
          phone,
          passwordHash,
          // role sengaja tidak diterima dari request.
          // Prisma akan menggunakan default: USER.
        },
      });

      // Register TIDAK membuat sesi login.
      // User harus kembali ke halaman login dan login secara manual.
      return {
        message: "Pendaftaran berhasil",
        user: this.safeUser(user),
      };
    } catch (error) {
      // Menangani kondisi race pada unique username/email.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Username atau email sudah terdaftar");
      }

      throw error;
    }
  }

  safeUser(user: {
    passwordHash: string;
    [key: string]: unknown;
  }) {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
