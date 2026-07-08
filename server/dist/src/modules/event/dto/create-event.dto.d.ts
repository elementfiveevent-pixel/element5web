import { EventCategory } from "@prisma/client";
export declare class CreateEventDto {
    title: string;
    description?: string;
    category: EventCategory;
    maxCapacity?: number;
    startDate: string;
    endDate?: string;
    isPaid?: boolean;
    price?: number;
    upiVpa?: string;
    venueName: string;
    venueAddress: string;
    city: string;
    state: string;
}
