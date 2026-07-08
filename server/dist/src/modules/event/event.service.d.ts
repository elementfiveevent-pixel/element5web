import { PrismaService } from "../../prisma/prisma.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { RegisterEventDto } from "./dto/register-event.dto";
export declare class EventService {
    private prisma;
    constructor(prisma: PrismaService);
    createEvent(userId: string, dto: CreateEventDto): Promise<{
        location: {
            id: string;
            latitude: number | null;
            longitude: number | null;
            city: string;
            state: string;
            venueName: string;
            venueAddress: string;
            mapsLink: string | null;
            eventId: string;
        } | null;
        ticketCategories: {
            id: string;
            description: string | null;
            name: string;
            createdAt: Date;
            maxCapacity: number;
            price: import("@prisma/client-runtime-utils").Decimal;
            eventId: string;
            soldCount: number;
        }[];
    } & {
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
    }>;
    listEvents(filters: {
        search?: string;
        category?: string;
        city?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        total: number;
        limit: number;
        offset: number;
        data: ({
            organizer: {
                fullName: string;
            };
            location: {
                id: string;
                latitude: number | null;
                longitude: number | null;
                city: string;
                state: string;
                venueName: string;
                venueAddress: string;
                mapsLink: string | null;
                eventId: string;
            } | null;
            ticketCategories: {
                id: string;
                description: string | null;
                name: string;
                createdAt: Date;
                maxCapacity: number;
                price: import("@prisma/client-runtime-utils").Decimal;
                eventId: string;
                soldCount: number;
            }[];
        } & {
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
        })[];
    }>;
    getEvent(idOrSlug: string): Promise<{
        organizer: {
            id: string;
            email: string;
            fullName: string;
        };
        location: {
            id: string;
            latitude: number | null;
            longitude: number | null;
            city: string;
            state: string;
            venueName: string;
            venueAddress: string;
            mapsLink: string | null;
            eventId: string;
        } | null;
        ticketCategories: {
            id: string;
            description: string | null;
            name: string;
            createdAt: Date;
            maxCapacity: number;
            price: import("@prisma/client-runtime-utils").Decimal;
            eventId: string;
            soldCount: number;
        }[];
    } & {
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
    }>;
    register(userId: string, eventId: string, dto: RegisterEventDto): Promise<{
        registration: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            eventId: string;
            userId: string;
            customData: import("@prisma/client/runtime/client").JsonValue;
            paymentScreenshotUrl: string | null;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            reviewedAt: Date | null;
            teamId: string | null;
            isGroupBooking: boolean;
            groupSize: number;
            baseAmount: import("@prisma/client-runtime-utils").Decimal;
            addonsAmount: import("@prisma/client-runtime-utils").Decimal;
            totalAmount: import("@prisma/client-runtime-utils").Decimal;
        };
        ticket: {
            id: string;
            createdAt: Date;
            eventId: string;
            userId: string;
            isUsed: boolean;
            qrCode: string;
            usedAt: Date | null;
            registrationId: string;
        };
    }>;
    checkInTicket(qrCode: string, ip?: string, ua?: string, fingerprint?: string): Promise<{
        success: boolean;
        message: string;
        attendee: string;
        eventName: string;
        checkedInAt: Date | null;
    }>;
}
