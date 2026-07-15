import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "element5_jwt_secret_token_signature_2026_key",
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: true,
        artistProfile: true,
      },
    });

    if (!user || user.status === "SUSPENDED") {
      throw new UnauthorizedException("Session is invalid, expired, or suspended");
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      roles: user.roles.map((r: any) => r.role),
      profilePhotoUrl: user.profilePhotoUrl,
      artistProfile: user.artistProfile,
    };
  }
}
