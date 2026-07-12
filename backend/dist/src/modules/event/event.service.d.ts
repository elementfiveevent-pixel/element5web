import { UserRole } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { RegisterEventDto } from "./dto/register-event.dto";
export declare class EventService {
    private prisma;
    constructor(prisma: PrismaService);
    createEvent(userId: string, dto: CreateEventDto): Promise<any>;
    listEvents(filters: {
        search?: string;
        category?: string;
        city?: string;
        period?: "upcoming" | "past";
        limit?: number;
        offset?: number;
    }): Promise<{
        total: any;
        limit: number;
        offset: number;
        data: any[];
    }>;
    getEvent(idOrSlug: string): Promise<any>;
    register(userId: string, eventId: string, dto: RegisterEventDto): Promise<any>;
    getMyTickets(userId: string): Promise<{
        ticketId: any;
        qrCode: any;
        isUsed: any;
        usedAt: any;
        createdAt: any;
        paymentStatus: any;
        registrationId: any;
        totalAmount: any;
        ticketCategoryName: string | undefined;
        event: {
            id: any;
            title: any;
            slug: any;
            flyerUrl: any;
            category: any;
            status: any;
            startDate: any;
            endDate: any;
            isPaid: any;
            price: any;
            location: any;
        };
    }[]>;
    getOrganizerEvents(organizerId: string, roles?: UserRole[]): Promise<any[]>;
    getEventRegistrations(eventId: string, organizerId: string, roles?: UserRole[]): Promise<any[]>;
    getEventAnalytics(eventId: string, organizerId: string, roles?: UserRole[]): Promise<{
        eventId: any;
        title: any;
        status: any;
        maxCapacity: any;
        totalRegistrations: any;
        approvedRegistrations: any;
        pendingRegistrations: any;
        totalTickets: any;
        checkedIn: any;
        notCheckedIn: number;
        capacityPct: number;
        attendanceRate: number;
        totalRevenue: any;
        viewsCount: any;
        checkInTimeline: {
            hour: string;
            count: number;
        }[];
        registrationTimeline: {
            date: string;
            count: number;
        }[];
        ticketCategories: any;
    }>;
    updateEvent(eventId: string, organizerId: string, dto: Partial<CreateEventDto>, roles?: UserRole[]): Promise<any>;
    reviewRegistration(registrationId: string, organizerId: string, action: "APPROVED" | "REJECTED", roles?: UserRole[]): Promise<any>;
    checkInTicket(qrCode: string, ip?: string, userAgent?: string, fingerprint?: string): Promise<{
        success: boolean;
        message: string;
        attendee: any;
        eventName: any;
        checkedInAt: any;
    }>;
    checkOutTicket(qrCode: string, ip?: string, userAgent?: string, fingerprint?: string): Promise<{
        success: boolean;
        message: string;
        attendee: any;
        eventName: any;
        checkedOutAt: Date;
    }>;
    private assertOrganizerAccess;
    private logCheckIn;
    private signTicketCode;
    private slugify;
    private getCustomString;
}
