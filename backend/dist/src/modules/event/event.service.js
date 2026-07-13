"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../../prisma/prisma.service");
const ORGANIZER_ROLES = [
    client_1.UserRole.SUPER_ADMIN,
    client_1.UserRole.ORG_ADMIN,
];
let EventService = class EventService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createEvent(userId, dto) {
        const slug = `${this.slugify(dto.title)}-${Date.now().toString().slice(-4)}`;
        const price = dto.price ?? 0;
        const isPaid = dto.isPaid ?? price > 0;
        return this.prisma.event.create({
            data: {
                organizerId: userId,
                title: dto.title,
                description: dto.description,
                flyerUrl: dto.flyerUrl,
                category: dto.category,
                status: "PUBLISHED",
                maxCapacity: dto.maxCapacity,
                startDate: new Date(dto.startDate),
                endDate: dto.endDate ? new Date(dto.endDate) : null,
                registrationEndDate: dto.registrationEndDate
                    ? new Date(dto.registrationEndDate)
                    : null,
                isPaid,
                price,
                audiencePrice: dto.audiencePrice ?? price,
                artistPrice: dto.artistPrice ?? price,
                upiQrUrl: dto.audienceQrUrl || dto.upiQrUrl,
                upiVpa: dto.upiVpa || dto.upiId,
                upiId: dto.upiId || dto.upiVpa,
                artistQrUrl: dto.artistQrUrl || dto.upiQrUrl,
                termsConditions: dto.termsConditions,
                customFields: (dto.customFields ?? []),
                slug,
                location: {
                    create: {
                        venueName: dto.venueName,
                        venueAddress: dto.venueAddress,
                        mapsLink: dto.mapsLink,
                        city: dto.city,
                        state: dto.state,
                    },
                },
                ticketCategories: {
                    create: {
                        name: "General Admission",
                        price,
                        maxCapacity: dto.maxCapacity ?? 100,
                        description: isPaid ? "Standard paid admission" : "Standard free admission",
                        artistQrUrl: dto.artistQrUrl || dto.upiQrUrl,
                        audienceQrUrl: dto.audienceQrUrl || dto.upiQrUrl,
                    },
                },
            },
            include: {
                location: true,
                ticketCategories: true,
            },
        });
    }
    async listEvents(filters) {
        const limit = Math.min(filters.limit ? Number(filters.limit) : 20, 100);
        const offset = filters.offset ? Number(filters.offset) : 0;
        const where = {};
        if (filters.period === "past") {
            where.OR = [
                { status: { in: ["COMPLETED", "ARCHIVED", "CANCELLED"] } },
                { endDate: { lt: new Date() } },
            ];
        }
        else {
            where.status = "PUBLISHED";
        }
        if (filters.category) {
            where.category = filters.category;
        }
        if (filters.city) {
            where.location = {
                city: { contains: filters.city, mode: "insensitive" },
            };
        }
        if (filters.search) {
            where.AND = [
                ...(Array.isArray(where.AND) ? where.AND : []),
                {
                    OR: [
                        { title: { contains: filters.search, mode: "insensitive" } },
                        { description: { contains: filters.search, mode: "insensitive" } },
                    ],
                },
            ];
        }
        const [total, data] = await Promise.all([
            this.prisma.event.count({ where }),
            this.prisma.event.findMany({
                where,
                include: {
                    location: true,
                    ticketCategories: true,
                    organizer: { select: { id: true, fullName: true } },
                },
                take: limit,
                skip: offset,
                orderBy: { startDate: filters.period === "past" ? "desc" : "asc" },
            }),
        ]);
        return { total, limit, offset, data };
    }
    async getEvent(idOrSlug) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
        const event = await this.prisma.event.findFirst({
            where: isUUID ? { id: idOrSlug } : { slug: idOrSlug },
            include: {
                location: true,
                ticketCategories: true,
                organizer: {
                    select: { id: true, fullName: true, email: true },
                },
                sponsors: { include: { sponsor: true } },
                partners: { include: { partner: true } },
                announcements: { orderBy: { createdAt: "desc" } },
                media: { orderBy: { createdAt: "desc" } },
            },
        });
        if (!event) {
            throw new common_1.NotFoundException("Event not found");
        }
        await this.prisma.event
            .update({
            where: { id: event.id },
            data: { viewsCount: { increment: 1 } },
        })
            .catch(() => undefined);
        return event;
    }
    async register(userId, eventId, dto) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            include: { ticketCategories: true },
        });
        if (!event) {
            throw new common_1.NotFoundException("Event not found");
        }
        if (event.status !== "PUBLISHED") {
            throw new common_1.BadRequestException("Registration is not open for this event");
        }
        if (event.registrationEndDate && event.registrationEndDate < new Date()) {
            throw new common_1.BadRequestException("Registration has closed for this event");
        }
        const existing = await this.prisma.eventRegistration.findUnique({
            where: { eventId_userId: { eventId, userId } },
        });
        if (existing) {
            throw new common_1.ConflictException("You are already registered for this event");
        }
        return this.prisma.$transaction(async (tx) => {
            const currentEvent = await tx.event.findUnique({
                where: { id: eventId },
                include: { ticketCategories: true },
            });
            if (!currentEvent) {
                throw new common_1.NotFoundException("Event not found");
            }
            if (currentEvent.maxCapacity &&
                currentEvent.registrationsCount >= currentEvent.maxCapacity) {
                throw new common_1.BadRequestException("Event is fully booked");
            }
            const ticketCategory = dto.ticketCategoryId
                ? currentEvent.ticketCategories.find((cat) => cat.id === dto.ticketCategoryId)
                : currentEvent.ticketCategories[0];
            if (dto.ticketCategoryId && !ticketCategory) {
                throw new common_1.BadRequestException("Selected ticket category is invalid");
            }
            if (ticketCategory &&
                ticketCategory.maxCapacity &&
                ticketCategory.soldCount >= ticketCategory.maxCapacity) {
                throw new common_1.BadRequestException("Selected ticket category is sold out");
            }
            await tx.event.update({
                where: { id: eventId },
                data: { registrationsCount: { increment: 1 } },
            });
            if (ticketCategory) {
                await tx.ticketCategory.update({
                    where: { id: ticketCategory.id },
                    data: { soldCount: { increment: 1 } },
                });
            }
            const participationType = dto.customData?.participationType;
            let baseAmount = ticketCategory?.price ?? currentEvent.price;
            if (participationType === "AUDIENCE" && currentEvent.audiencePrice !== undefined && Number(currentEvent.audiencePrice) > 0) {
                baseAmount = currentEvent.audiencePrice;
            }
            else if (participationType === "ARTIST" && currentEvent.artistPrice !== undefined && Number(currentEvent.artistPrice) > 0) {
                baseAmount = currentEvent.artistPrice;
            }
            const paymentStatus = currentEvent.isPaid || Number(baseAmount) > 0
                ? client_1.PaymentStatus.PENDING
                : client_1.PaymentStatus.APPROVED;
            const registration = await tx.eventRegistration.create({
                data: {
                    eventId,
                    userId,
                    customData: {
                        ...(dto.customData ?? {}),
                        ticketCategoryId: ticketCategory?.id,
                        ticketCategoryName: ticketCategory?.name,
                    },
                    paymentScreenshotUrl: dto.paymentScreenshotUrl,
                    paymentStatus,
                    baseAmount,
                    totalAmount: baseAmount,
                },
            });
            const qrCode = this.signTicketCode(registration.id, userId, eventId);
            const ticket = await tx.eventTicket.create({
                data: {
                    registrationId: registration.id,
                    eventId,
                    userId,
                    qrCode,
                },
            });
            return { registration, ticket };
        });
    }
    async getMyTickets(userId) {
        const tickets = await this.prisma.eventTicket.findMany({
            where: { userId },
            include: {
                event: {
                    include: { location: true },
                },
                registration: {
                    select: {
                        id: true,
                        paymentStatus: true,
                        createdAt: true,
                        totalAmount: true,
                        customData: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return tickets.map((ticket) => ({
            ticketId: ticket.id,
            qrCode: ticket.qrCode,
            isUsed: ticket.isUsed,
            usedAt: ticket.usedAt,
            createdAt: ticket.createdAt,
            paymentStatus: ticket.registration.paymentStatus,
            registrationId: ticket.registration.id,
            totalAmount: ticket.registration.totalAmount,
            ticketCategoryName: this.getCustomString(ticket.registration.customData, "ticketCategoryName"),
            event: {
                id: ticket.event.id,
                title: ticket.event.title,
                slug: ticket.event.slug,
                flyerUrl: ticket.event.flyerUrl,
                category: ticket.event.category,
                status: ticket.event.status,
                startDate: ticket.event.startDate,
                endDate: ticket.event.endDate,
                isPaid: ticket.event.isPaid,
                price: ticket.event.price,
                location: ticket.event.location,
            },
        }));
    }
    async getOrganizerEvents(organizerId, roles = []) {
        const canViewAll = roles.some((role) => role === client_1.UserRole.SUPER_ADMIN || role === client_1.UserRole.ORG_ADMIN);
        return this.prisma.event.findMany({
            where: canViewAll ? undefined : { organizerId },
            include: {
                location: true,
                ticketCategories: true,
                _count: {
                    select: {
                        registrations: true,
                        tickets: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async getEventRegistrations(eventId, organizerId, roles = []) {
        await this.assertOrganizerAccess(eventId, organizerId, roles);
        return this.prisma.eventRegistration.findMany({
            where: { eventId },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        mobileNumber: true,
                        profilePhotoUrl: true,
                    },
                },
                tickets: {
                    select: { id: true, qrCode: true, isUsed: true, usedAt: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async getEventAnalytics(eventId, organizerId, roles = []) {
        await this.assertOrganizerAccess(eventId, organizerId, roles);
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            include: {
                ticketCategories: true,
                registrations: {
                    select: {
                        id: true,
                        paymentStatus: true,
                        createdAt: true,
                        totalAmount: true,
                    },
                },
                tickets: {
                    select: { id: true, isUsed: true, usedAt: true, createdAt: true },
                },
                checkInAuditLogs: {
                    select: { action: true, createdAt: true },
                    orderBy: { createdAt: "asc" },
                },
            },
        });
        if (!event) {
            throw new common_1.NotFoundException("Event not found");
        }
        const totalRegistrations = event.registrations.length;
        const approvedRegistrations = event.registrations.filter((registration) => registration.paymentStatus === "APPROVED").length;
        const pendingRegistrations = event.registrations.filter((registration) => registration.paymentStatus === "PENDING").length;
        const totalTickets = event.tickets.length;
        const checkedIn = event.tickets.filter((ticket) => ticket.isUsed).length;
        const capacityPct = event.maxCapacity
            ? Math.round((totalRegistrations / event.maxCapacity) * 100)
            : 0;
        const totalRevenue = event.registrations.reduce((sum, registration) => sum + Number(registration.totalAmount || 0), 0);
        const checkInsByHour = {};
        event.checkInAuditLogs
            .filter((log) => log.action === "CHECK_IN")
            .forEach((log) => {
            const key = new Date(log.createdAt).toISOString().slice(0, 13);
            checkInsByHour[key] = (checkInsByHour[key] || 0) + 1;
        });
        const registrationsByDay = {};
        event.registrations.forEach((registration) => {
            const key = new Date(registration.createdAt).toISOString().slice(0, 10);
            registrationsByDay[key] = (registrationsByDay[key] || 0) + 1;
        });
        return {
            eventId: event.id,
            title: event.title,
            status: event.status,
            maxCapacity: event.maxCapacity,
            totalRegistrations,
            approvedRegistrations,
            pendingRegistrations,
            totalTickets,
            checkedIn,
            notCheckedIn: totalTickets - checkedIn,
            capacityPct,
            attendanceRate: totalTickets > 0 ? Math.round((checkedIn / totalTickets) * 100) : 0,
            totalRevenue,
            viewsCount: event.viewsCount,
            checkInTimeline: Object.entries(checkInsByHour).map(([hour, count]) => ({
                hour,
                count,
            })),
            registrationTimeline: Object.entries(registrationsByDay).map(([date, count]) => ({ date, count })),
            ticketCategories: event.ticketCategories,
        };
    }
    async updateEvent(eventId, organizerId, dto, roles = []) {
        await this.assertOrganizerAccess(eventId, organizerId, roles);
        if (dto.status === "COMPLETED" || dto.status === "CANCELLED" || dto.status === "ARCHIVED") {
            await this.prisma.eventRegistration.updateMany({
                where: { eventId },
                data: { paymentScreenshotUrl: null }
            });
            console.log(`[Storage Cleanup] Cleared payment screenshots for event ${eventId} (Status: ${dto.status})`);
        }
        return this.prisma.event.update({
            where: { id: eventId },
            data: {
                ...(dto.status !== undefined && { status: dto.status }),
                ...(dto.title && { title: dto.title }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.flyerUrl !== undefined && { flyerUrl: dto.flyerUrl }),
                ...(dto.maxCapacity !== undefined && { maxCapacity: dto.maxCapacity }),
                ...(dto.startDate && { startDate: new Date(dto.startDate) }),
                ...(dto.endDate !== undefined && {
                    endDate: dto.endDate ? new Date(dto.endDate) : null,
                }),
                ...(dto.registrationEndDate !== undefined && {
                    registrationEndDate: dto.registrationEndDate
                        ? new Date(dto.registrationEndDate)
                        : null,
                }),
                ...(dto.isPaid !== undefined && { isPaid: dto.isPaid }),
                ...(dto.price !== undefined && { price: dto.price }),
                ...(dto.audiencePrice !== undefined && { audiencePrice: dto.audiencePrice }),
                ...(dto.artistPrice !== undefined && { artistPrice: dto.artistPrice }),
                ...(dto.upiVpa !== undefined && { upiVpa: dto.upiVpa }),
                ...(dto.upiId !== undefined && { upiId: dto.upiId, upiVpa: dto.upiId }),
                ...(dto.upiQrUrl !== undefined && { upiQrUrl: dto.upiQrUrl }),
                ...(dto.artistQrUrl !== undefined && { artistQrUrl: dto.artistQrUrl }),
                ...(dto.audienceQrUrl !== undefined && { upiQrUrl: dto.audienceQrUrl }),
                ...(dto.termsConditions !== undefined && {
                    termsConditions: dto.termsConditions,
                }),
                ...(dto.customFields !== undefined && {
                    customFields: dto.customFields,
                }),
                ...(dto.venueName ||
                    dto.venueAddress ||
                    dto.city ||
                    dto.state ||
                    dto.mapsLink !== undefined
                    ? {
                        location: {
                            upsert: {
                                create: {
                                    venueName: dto.venueName ?? "Venue TBA",
                                    venueAddress: dto.venueAddress ?? "Address TBA",
                                    city: dto.city ?? "City TBA",
                                    state: dto.state ?? "State TBA",
                                    mapsLink: dto.mapsLink,
                                },
                                update: {
                                    ...(dto.venueName && { venueName: dto.venueName }),
                                    ...(dto.venueAddress && { venueAddress: dto.venueAddress }),
                                    ...(dto.city && { city: dto.city }),
                                    ...(dto.state && { state: dto.state }),
                                    ...(dto.mapsLink !== undefined && { mapsLink: dto.mapsLink }),
                                },
                            },
                        },
                    }
                    : {}),
            },
            include: { location: true, ticketCategories: true },
        });
    }
    async reviewRegistration(registrationId, organizerId, action, roles = []) {
        const registration = await this.prisma.eventRegistration.findUnique({
            where: { id: registrationId },
            include: { event: { select: { id: true } } },
        });
        if (!registration) {
            throw new common_1.NotFoundException("Registration not found");
        }
        await this.assertOrganizerAccess(registration.event.id, organizerId, roles);
        return this.prisma.eventRegistration.update({
            where: { id: registrationId },
            data: {
                paymentStatus: action,
                reviewedAt: new Date(),
            },
        });
    }
    async checkInTicket(qrCode, ip, userAgent, fingerprint) {
        const ticket = await this.prisma.eventTicket.findUnique({
            where: { qrCode },
            include: {
                event: true,
                user: true,
                registration: true,
            },
        });
        if (!ticket) {
            throw new common_1.NotFoundException("Invalid ticket code");
        }
        if (ticket.registration.paymentStatus !== client_1.PaymentStatus.APPROVED) {
            await this.logCheckIn(ticket.id, ticket.eventId, "REJECT_PAYMENT_STATUS", {
                ip,
                userAgent,
                fingerprint,
                metadata: { paymentStatus: ticket.registration.paymentStatus },
            });
            throw new common_1.BadRequestException(`Ticket payment status is ${ticket.registration.paymentStatus}`);
        }
        const expiresAt = ticket.event.endDate
            ? new Date(ticket.event.endDate)
            : new Date(new Date(ticket.event.startDate).getTime() + 12 * 60 * 60 * 1000);
        if (ticket.event.status === "CANCELLED" || expiresAt < new Date()) {
            await this.logCheckIn(ticket.id, ticket.eventId, "REJECT_EXPIRED", {
                ip,
                userAgent,
                fingerprint,
                metadata: { eventStatus: ticket.event.status, expiresAt },
            });
            throw new common_1.BadRequestException("Ticket is expired or event is not active");
        }
        if (ticket.isUsed) {
            await this.logCheckIn(ticket.id, ticket.eventId, "REJECT_DUPLICATE", {
                ip,
                userAgent,
                fingerprint,
                metadata: { attemptedAt: new Date().toISOString() },
            });
            throw new common_1.BadRequestException(`Ticket already checked in at ${ticket.usedAt}`);
        }
        const updatedTicket = await this.prisma.eventTicket.update({
            where: { id: ticket.id },
            data: {
                isUsed: true,
                usedAt: new Date(),
            },
        });
        await this.logCheckIn(ticket.id, ticket.eventId, "CHECK_IN", {
            ip,
            userAgent,
            fingerprint,
        });
        return {
            success: true,
            message: "Check-in successful",
            attendee: ticket.user.fullName,
            eventName: ticket.event.title,
            checkedInAt: updatedTicket.usedAt,
        };
    }
    async checkOutTicket(qrCode, ip, userAgent, fingerprint) {
        const ticket = await this.prisma.eventTicket.findUnique({
            where: { qrCode },
            include: {
                event: true,
                user: true,
                registration: true,
            },
        });
        if (!ticket) {
            throw new common_1.NotFoundException("Invalid ticket code");
        }
        if (!ticket.isUsed) {
            throw new common_1.BadRequestException("Ticket is not currently checked in");
        }
        const updatedTicket = await this.prisma.eventTicket.update({
            where: { id: ticket.id },
            data: {
                isUsed: false,
                usedAt: null,
            },
        });
        await this.logCheckIn(ticket.id, ticket.eventId, "CHECK_OUT", {
            ip,
            userAgent,
            fingerprint,
        });
        return {
            success: true,
            message: "Check-out successful",
            attendee: ticket.user.fullName,
            eventName: ticket.event.title,
            checkedOutAt: new Date(),
        };
    }
    async assertOrganizerAccess(eventId, userId, roles = []) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            select: { organizerId: true },
        });
        if (!event) {
            throw new common_1.NotFoundException("Event not found");
        }
        const canManageAll = roles.some((role) => ORGANIZER_ROLES.includes(role));
        if (!canManageAll && event.organizerId !== userId) {
            throw new common_1.ForbiddenException("Access denied");
        }
    }
    async logCheckIn(ticketId, eventId, action, details) {
        await this.prisma.checkInAuditLog.create({
            data: {
                ticketId,
                eventId,
                action,
                ipAddress: details.ip,
                userAgent: details.userAgent,
                deviceFingerprint: details.fingerprint,
                verificationMethod: "QR_SCAN",
                metadata: details.metadata,
            },
        });
    }
    signTicketCode(registrationId, userId, eventId) {
        return crypto
            .createHmac("sha256", process.env.JWT_SECRET || "element5_jwt_secret")
            .update(`${registrationId}:${userId}:${eventId}:${Date.now()}:${crypto.randomUUID()}`)
            .digest("hex");
    }
    slugify(value) {
        return value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");
    }
    getCustomString(value, key) {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
            return undefined;
        }
        const found = value[key];
        return typeof found === "string" ? found : undefined;
    }
};
exports.EventService = EventService;
exports.EventService = EventService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EventService);
//# sourceMappingURL=event.service.js.map