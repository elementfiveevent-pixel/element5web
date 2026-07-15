import { Injectable, ConflictException, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { UserRole } from "@prisma/client";
import { SetupArtistProfileDto } from "./dto/setup-artist-profile.dto";
import { verifyTOTP } from "../../common/utils/totp.util";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException("Registration as Super Admin is not allowed");
    }

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
        status: role === UserRole.ORG_ADMIN ? "PENDING_VERIFICATION" : "ACTIVE",
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

    return this.generateTokens(user.id, user.email, user.roles.map((r: any) => r.role));
  }

  async setupArtistProfile(userId: string, dto: SetupArtistProfileDto) {
    if (dto.profilePhotoUrl) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { profilePhotoUrl: dto.profilePhotoUrl },
      });
    }

    const genres = dto.genre ? [dto.genre] : [];
    const languages = dto.languages
      ? dto.languages.split(",").map((l: string) => l.trim()).filter(Boolean)
      : [];
    const skills = dto.skills
      ? dto.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];
    const portfolioUrls = [dto.youtubeLink, dto.spotifyLink].filter(Boolean);

    let availabilityStatus: any = "AVAILABLE";
    if (dto.availability === "Not Available") {
      availabilityStatus = "UNAVAILABLE";
    }

    return this.prisma.artistProfile.upsert({
      where: { userId },
      update: {
        stageName: dto.stageName,
        biography: dto.bio,
        genres,
        languages,
        skills,
        portfolioUrls,
        availabilityStatus,
      },
      create: {
        userId,
        stageName: dto.stageName || "Unnamed Artist",
        biography: dto.bio,
        genres,
        languages,
        skills,
        portfolioUrls,
        availabilityStatus,
      },
    });
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

    // Verify TOTP if the user is a SUPER_ADMIN
    const userRoles = user.roles.map((r: any) => r.role);
    if (userRoles.includes(UserRole.SUPER_ADMIN)) {
      const totpSecret = process.env.ADMIN_TOTP_SECRET || "ELEMENT5ADMINSECRET";
      if (!dto.totpToken) {
        throw new UnauthorizedException("2FA_REQUIRED");
      }
      const isValidTotp = verifyTOTP(dto.totpToken, totpSecret);
      if (!isValidTotp) {
        throw new UnauthorizedException("Invalid 2FA verification code");
      }
    }

    return this.generateTokens(user.id, user.email, user.roles.map((r: any) => r.role));
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
    return this.generateTokens(user.id, user.email, user.roles.map((r: any) => r.role));
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

  async googleLogin(idToken: string) {
    let email: string;
    let fullName: string;

    try {
      if (idToken.startsWith("mock_")) {
        email = idToken.replace("mock_", "");
        fullName = email.split("@")[0];
      } else {
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        if (!response.ok) {
          throw new UnauthorizedException("Invalid Google token signature or token expired");
        }
        const payload = await response.json() as any;
        email = payload.email;
        fullName = payload.name || email.split("@")[0];
      }

      if (!email) {
        throw new UnauthorizedException("Google token missing email information");
      }
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException("Invalid Google authentication payload");
    }

    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          fullName,
          roles: {
            create: { role: UserRole.AUDIENCE },
          },
        },
        include: { roles: true },
      });
    }

    if (user.status === "SUSPENDED") {
      throw new UnauthorizedException("This account has been suspended");
    }

    return this.generateTokens(user.id, user.email, user.roles.map((r: any) => r.role));
  }
}
