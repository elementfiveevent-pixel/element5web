import { ArtistService } from "./artist.service";
import { UpdateArtistProfileDto } from "./dto/update-profile.dto";
export declare class ArtistController {
    private artistService;
    constructor(artistService: ArtistService);
    list(search?: string, genre?: string, isVerified?: string, city?: string, state?: string, limit?: number, offset?: number): Promise<{
        total: number;
        limit: number;
        offset: number;
        data: ({
            user: {
                id: string;
                fullName: string;
                profilePhotoUrl: string | null;
                reputationXp: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            stageName: string;
            biography: string | null;
            portfolioUrls: string[];
            genres: string[];
            skills: string[];
            languages: string[];
            isVerified: boolean;
            availabilityStatus: import("@prisma/client").$Enums.AvailabilityStatus;
            latitude: number | null;
            longitude: number | null;
            city: string | null;
            state: string | null;
            userId: string;
        })[];
    }>;
    nearby(lat: number, lng: number, radius?: number): Promise<unknown>;
    getProfile(user: any): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string;
            mobileNumber: string | null;
            profilePhotoUrl: string | null;
            status: import("@prisma/client").$Enums.UserStatus;
            reputationXp: number;
        };
        performances: ({
            event: {
                id: string;
                description: string | null;
                title: string;
                status: import("@prisma/client").$Enums.EventStatus;
                createdAt: Date;
                updatedAt: Date;
                category: import("@prisma/client").$Enums.EventCategory;
                slug: string;
                organizerId: string;
                flyerUrl: string | null;
                maxCapacity: number | null;
                registrationsCount: number;
                startDate: Date;
                endDate: Date | null;
                registrationEndDate: Date | null;
                isPaid: boolean;
                price: import("@prisma/client-runtime-utils").Decimal;
                upiQrUrl: string | null;
                upiVpa: string | null;
                termsConditions: string | null;
                customFields: import("@prisma/client/runtime/client").JsonValue;
                viewsCount: number;
            };
        } & {
            id: string;
            eventId: string;
            artistProfileId: string;
            roleDescription: string | null;
            performanceDate: Date;
            videoUrl: string | null;
        })[];
        achievements: ({
            achievement: {
                id: string;
                description: string;
                title: string;
                badgeIconUrl: string;
                xpReward: number;
            };
        } & {
            id: string;
            artistProfileId: string;
            achievementId: string;
            unlockedAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        stageName: string;
        biography: string | null;
        portfolioUrls: string[];
        genres: string[];
        skills: string[];
        languages: string[];
        isVerified: boolean;
        availabilityStatus: import("@prisma/client").$Enums.AvailabilityStatus;
        latitude: number | null;
        longitude: number | null;
        city: string | null;
        state: string | null;
        userId: string;
    }>;
    updateProfile(user: any, dto: UpdateArtistProfileDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        stageName: string;
        biography: string | null;
        portfolioUrls: string[];
        genres: string[];
        skills: string[];
        languages: string[];
        isVerified: boolean;
        availabilityStatus: import("@prisma/client").$Enums.AvailabilityStatus;
        latitude: number | null;
        longitude: number | null;
        city: string | null;
        state: string | null;
        userId: string;
    }>;
    getByUserId(userId: string): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string;
            mobileNumber: string | null;
            profilePhotoUrl: string | null;
            status: import("@prisma/client").$Enums.UserStatus;
            reputationXp: number;
        };
        performances: ({
            event: {
                id: string;
                description: string | null;
                title: string;
                status: import("@prisma/client").$Enums.EventStatus;
                createdAt: Date;
                updatedAt: Date;
                category: import("@prisma/client").$Enums.EventCategory;
                slug: string;
                organizerId: string;
                flyerUrl: string | null;
                maxCapacity: number | null;
                registrationsCount: number;
                startDate: Date;
                endDate: Date | null;
                registrationEndDate: Date | null;
                isPaid: boolean;
                price: import("@prisma/client-runtime-utils").Decimal;
                upiQrUrl: string | null;
                upiVpa: string | null;
                termsConditions: string | null;
                customFields: import("@prisma/client/runtime/client").JsonValue;
                viewsCount: number;
            };
        } & {
            id: string;
            eventId: string;
            artistProfileId: string;
            roleDescription: string | null;
            performanceDate: Date;
            videoUrl: string | null;
        })[];
        achievements: ({
            achievement: {
                id: string;
                description: string;
                title: string;
                badgeIconUrl: string;
                xpReward: number;
            };
        } & {
            id: string;
            artistProfileId: string;
            achievementId: string;
            unlockedAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        stageName: string;
        biography: string | null;
        portfolioUrls: string[];
        genres: string[];
        skills: string[];
        languages: string[];
        isVerified: boolean;
        availabilityStatus: import("@prisma/client").$Enums.AvailabilityStatus;
        latitude: number | null;
        longitude: number | null;
        city: string | null;
        state: string | null;
        userId: string;
    }>;
}
