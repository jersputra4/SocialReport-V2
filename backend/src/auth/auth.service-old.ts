import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma.service";
import * as bcrypt from "bcrypt";
import { LoginDto, RegisterDto } from "./dto";

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const token = await this.jwt.signAsync({ sub: user.id, username: user.username, role: user.role });
    return { accessToken: token, user: this.safeUser(user) };
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findFirst({ where: { OR: [{ username: dto.username }, { email: dto.email }] } });
    if (exists) throw new ConflictException("Username or email already exists");
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({ data: { ...dto, password: undefined, passwordHash } as any });
    return { user: this.safeUser(user) };
  }

  safeUser(user: any) {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
