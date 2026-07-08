"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtistService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ArtistService = class ArtistService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(userId) {
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
            throw new common_1.NotFoundException("Artist profile not found");
        }
        return profile;
    }
    async updateProfile(userId, dto) {
        const profile = await this.prisma.artistProfile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException("Artist profile not found");
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
    async listArtists(filters) {
        const limit = filters.limit ? Number(filters.limit) : 20;
        const offset = filters.offset ? Number(filters.offset) : 0;
        const whereClause = {};
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
        return {
            total,
            limit,
            offset,
            data,
        };
    }
    async searchNearby(lat, lng, radiusKm = 50) {
        return this.prisma.$queryRaw `
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
};
exports.ArtistService = ArtistService;
exports.ArtistService = ArtistService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ArtistService);
//# sourceMappingURL=artist.service.js.map