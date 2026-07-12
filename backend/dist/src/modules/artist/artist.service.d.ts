import { PrismaService } from "../../prisma/prisma.service";
import { UpdateArtistProfileDto } from "./dto/update-profile.dto";
export declare class ArtistService {
    private prisma;
    constructor(prisma: PrismaService);
    getProfile(userId: string): Promise<any>;
    updateProfile(userId: string, dto: UpdateArtistProfileDto): Promise<any>;
    listArtists(filters: {
        search?: string;
        genre?: string;
        isVerified?: boolean;
        city?: string;
        state?: string;
        limit?: number;
        offset?: number;
    }): Promise<any[]>;
    searchNearby(lat: number, lng: number, radiusKm?: number): Promise<any[]>;
}
