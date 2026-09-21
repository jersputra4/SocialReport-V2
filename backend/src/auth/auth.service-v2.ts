import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma.service";
import * as bcrypt from "bcrypt";
import { LoginDto, RegisterDto } from "./dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid credentials");
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

    const exists = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (exists) {
      if (exists.username === username) {
        throw new ConflictException("Username sudah digunakan");
      }

      throw new ConflictException("Email sudah terdaftar");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        username,
        name,
        email,
        phone,
        passwordHash,
        // Role tidak diterima dari request agar user biasa tidak bisa
        // mendaftarkan dirinya sebagai ADMIN.
      },
    });

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      message: "Pendaftaran berhasil",
      accessToken,
      user: this.safeUser(user),
    };
  }

  safeUser(user: any) {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
