import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateArtistProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class ArtistService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.artistProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            mobileNumber: true,
            profilePhotoUrl: true,
            reputationXp: true,
            status: true,
          },
        },
        achievements: {
          include: { achievement: true },
        },
        performances: {
          include: { event: true },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException("Artist profile not found");
    }

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateArtistProfileDto) {
    const profile = await this.prisma.artistProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Artist profile not found");
    }

    return this.prisma.artistProfile.update({
      where: { userId },
      data: {
        stageName: dto.stageName,
        biography: dto.biography,
        portfolioUrls: dto.portfolioUrls,
        genres: dto.genres,
        skills: dto.skills,
        languages: dto.languages,
        availabilityStatus: dto.availabilityStatus,
      },
    });
  }

  async listArtists(filters: {
    search?: string;
    genre?: string;
    isVerified?: boolean;
    city?: string;
    state?: string;
    limit?: number;
    offset?: number;
  }) {
    const limit = filters.limit ? Number(filters.limit) : 20;
    const offset = filters.offset ? Number(filters.offset) : 0;

    const whereClause: any = {};

    if (filters.isVerified !== undefined) {
      whereClause.isVerified = filters.isVerified;
    }

    if (filters.genre) {
      whereClause.genres = {
        has: filters.genre,
      };
    }

    if (filters.city) {
      whereClause.city = { contains: filters.city, mode: "insensitive" };
    }

    if (filters.state) {
      whereClause.state = { contains: filters.state, mode: "insensitive" };
    }

    if (filters.search) {
      whereClause.OR = [
        { stageName: { contains: filters.search, mode: "insensitive" } },
        { biography: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.artistProfile.count({ where: whereClause }),
      this.prisma.artistProfile.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              profilePhotoUrl: true,
              reputationXp: true,
            },
          },
        },
        take: limit,
        skip: offset,
      }),
    ]);

    return data;
  }

  async searchNearby(lat: number, lng: number, radiusKm = 50) {
    // Run mathematical Haversine query to find nearest artists
    return this.prisma.$queryRaw`
      SELECT * FROM (
        SELECT ap.*, u."fullName", u."profilePhotoUrl",
          (6371 * acos(
            cos(radians(${lat})) * cos(radians(ap.latitude)) *
            cos(radians(ap.longitude) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(ap.latitude))
          )) AS distance
        FROM "ArtistProfile" ap
        JOIN "User" u ON ap."userId" = u.id
        WHERE ap.latitude IS NOT NULL AND ap.longitude IS NOT NULL
      ) AS sub
      WHERE distance <= ${radiusKm}
      ORDER BY distance ASC;
    `;
  }
}
