import { EventService } from "./event.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { RegisterEventDto } from "./dto/register-event.dto";
export declare class EventController {
    private eventService;
    constructor(eventService: EventService);
    list(search?: string, category?: string, city?: string, period?: "upcoming" | "past", limit?: number, offset?: number): Promise<{
        total: any;
        limit: number;
        offset: number;
        data: any[];
    }>;
    get(idOrSlug: string): Promise<any>;
    create(user: any, dto: CreateEventDto): Promise<any>;
    register(user: any, eventId: string, dto: RegisterEventDto): Promise<any>;
    checkIn(qrCode: string, fingerprint: string, ip: string, ua?: string): Promise<{
        success: boolean;
        message: string;
        attendee: any;
        eventName: any;
        checkedInAt: any;
    }>;
    checkOut(qrCode: string, fingerprint: string, ip: string, ua?: string): Promise<{
        success: boolean;
        message: string;
        attendee: any;
        eventName: any;
        checkedOutAt: Date;
    }>;
    myTickets(user: any): Promise<{
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
    myEvents(user: any): Promise<any[]>;
    registrations(user: any, eventId: string): Promise<any[]>;
    analytics(user: any, eventId: string): Promise<{
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
    update(user: any, eventId: string, dto: Partial<CreateEventDto>): Promise<any>;
    reviewRegistration(user: any, registrationId: string, action: "APPROVED" | "REJECTED"): Promise<any>;
}
