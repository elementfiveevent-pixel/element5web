import { AvailabilityStatus } from "../../../prisma-stub.ts";
export declare class UpdateArtistProfileDto {
    stageName?: string;
    biography?: string;
    portfolioUrls?: string[];
    genres?: string[];
    skills?: string[];
    languages?: string[];
    availabilityStatus?: AvailabilityStatus;
}
