import { EventCategory } from "../../../prisma-stub.ts";
export declare class CreateEventDto {
    title: string;
    description?: string;
    category: EventCategory;
    status?: string;
    maxCapacity?: number;
    startDate: string;
    endDate?: string;
    registrationEndDate?: string;
    isPaid?: boolean;
    price?: number;
    audiencePrice?: number;
    artistPrice?: number;
    upiVpa?: string;
    upiId?: string;
    upiQrUrl?: string;
    artistQrUrl?: string;
    audienceQrUrl?: string;
    flyerUrl?: string;
    venueName: string;
    venueAddress: string;
    mapsLink?: string;
    city: string;
    state: string;
    termsConditions?: string;
    customFields?: Array<Record<string, unknown>>;
}
