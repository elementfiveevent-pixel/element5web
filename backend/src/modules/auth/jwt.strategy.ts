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

  async validate(payload: { sub: string; email: string; roles?: string[] }) {
    let user: any = null;
    try {
      user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          roles: true,
          artistProfile: true,
        },
      });
    } catch {
      user = null;
    }

    if (user && user.status === "SUSPENDED") {
      throw new UnauthorizedException("Session is invalid, expired, or suspended");
    }

    if (!user) {
      return {
        id: payload.sub,
        email: payload.email,
        fullName: payload.email ? payload.email.split("@")[0] : "User",
        status: "ACTIVE",
        roles: payload.roles || ["AUDIENCE"],
      };
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      roles: Array.isArray(user.roles) ? user.roles.map((r: any) => typeof r === "string" ? r : r.role) : [],
      profilePhotoUrl: user.profilePhotoUrl,
      artistProfile: user.artistProfile,
    };
  }
}
