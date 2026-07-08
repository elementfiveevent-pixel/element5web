import { Injectable, ConflictException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { UserRole } from "@prisma/client";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException("An account with this email already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const role = dto.role || UserRole.AUDIENCE;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        mobileNumber: dto.mobileNumber,
        roles: {
          create: { role },
        },
      },
      include: {
        roles: true,
      },
    });

    // If role is ARTIST, proactively scaffold an empty ArtistProfile
    if (role === UserRole.ARTIST) {
      await this.prisma.artistProfile.create({
        data: {
          userId: user.id,
          stageName: dto.fullName, // Default stage name is full name
        },
      });
    }

    return this.generateTokens(user.id, user.email, user.roles.map((r) => r.role));
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { roles: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (user.status === "SUSPENDED") {
      throw new UnauthorizedException("This account has been suspended");
    }

    const validPassword = await bcrypt.compare(dto.password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.generateTokens(user.id, user.email, user.roles.map((r) => r.role));
  }

  async refreshTokens(refreshTokenString: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenString },
      include: { user: { include: { roles: true } } },
    });

    if (!tokenRecord || tokenRecord.isUsed || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token is invalid, used, or expired");
    }

    // Single-use token rotation: Mark old refresh token as used
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isUsed: true },
    });

    const user = tokenRecord.user;
    return this.generateTokens(user.id, user.email, user.roles.map((r) => r.role));
  }

  async logout(refreshTokenString: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshTokenString },
      data: { isRevoked: true },
    });
    return { success: true, message: "Logged out successfully" };
  }

  private async generateTokens(userId: string, email: string, roles: UserRole[]) {
    const payload = { sub: userId, email, roles };
    
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: "15m",
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: "7d",
    });

    // Save refresh token to PostgreSQL
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email,
        roles,
      },
    };
  }
}
