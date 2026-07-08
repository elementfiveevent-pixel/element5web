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
const prisma_service_1 = require("../../prisma/prisma.service");
const crypto = __importStar(require("crypto"));
const client_1 = require("@prisma/client");
let EventService = class EventService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createEvent(userId, dto) {
        const slug = dto.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "") + "-" + Date.now().toString().slice(-4);
        const price = dto.price || 0.00;
        const isPaid = dto.isPaid || price > 0;
        return this.prisma.event.create({
            data: {
                title: dto.title,
                description: dto.description,
                category: dto.category,
                maxCapacity: dto.maxCapacity,
                startDate: new Date(dto.startDate),
                endDate: dto.endDate ? new Date(dto.endDate) : null,
                isPaid,
                price,
                upiVpa: dto.upiVpa,
                slug,
                organizerId: userId,
                status: "PUBLISHED",
                location: {
                    create: {
                        venueName: dto.venueName,
                        venueAddress: dto.venueAddress,
                        city: dto.city,
                        state: dto.state,
                    },
                },
                ticketCategories: {
                    createMany: {
                        data: [
                            { name: "General Admission", price, maxCapacity: dto.maxCapacity || 100 },
                        ],
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
        const limit = filters.limit ? Number(filters.limit) : 20;
        const offset = filters.offset ? Number(filters.offset) : 0;
        const where = { status: "PUBLISHED" };
        if (filters.category) {
            where.category = filters.category;
        }
        if (filters.city) {
            where.location = {
                city: { contains: filters.city, mode: "insensitive" },
            };
        }
        if (filters.search) {
            where.OR = [
                { title: { contains: filters.search, mode: "insensitive" } },
                { description: { contains: filters.search, mode: "insensitive" } },
            ];
        }
        const [total, data] = await Promise.all([
            this.prisma.event.count({ where }),
            this.prisma.event.findMany({
                where,
                include: { location: true, ticketCategories: true, organizer: { select: { fullName: true } } },
                take: limit,
                skip: offset,
                orderBy: { startDate: "asc" },
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
            },
        });
        if (!event) {
            throw new common_1.NotFoundException("Event not found");
        }
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
        const existing = await this.prisma.eventRegistration.findUnique({
            where: { eventId_userId: { eventId, userId } },
        });
        if (existing) {
            throw new common_1.ConflictException("You are already registered for this event");
        }
        return this.prisma.$transaction(async (tx) => {
            const currentEvent = await tx.event.findUnique({
                where: { id: eventId },
                select: { maxCapacity: true, registrationsCount: true, price: true, isPaid: true },
            });
            if (currentEvent && currentEvent.maxCapacity && currentEvent.registrationsCount >= currentEvent.maxCapacity) {
                throw new common_1.BadRequestException("Event is fully booked");
            }
            await tx.event.update({
                where: { id: eventId },
                data: { registrationsCount: { increment: 1 } },
            });
            const baseAmount = currentEvent?.price || 0;
            const totalAmount = baseAmount;
            const paymentStatus = currentEvent?.isPaid ? client_1.PaymentStatus.PENDING : client_1.PaymentStatus.APPROVED;
            const registration = await tx.eventRegistration.create({
                data: {
                    eventId,
                    userId,
                    customData: dto.customData || {},
                    paymentScreenshotUrl: dto.paymentScreenshotUrl,
                    paymentStatus,
                    baseAmount,
                    totalAmount,
                },
            });
            const ticketHash = crypto
                .createHmac("sha256", process.env.JWT_SECRET || "element5_jwt_secret")
                .update(`${registration.id}-${userId}-${eventId}`)
                .digest("hex");
            const ticket = await tx.eventTicket.create({
                data: {
                    registrationId: registration.id,
                    eventId,
                    userId,
                    qrCode: ticketHash,
                },
            });
            return {
                registration,
                ticket,
            };
        });
    }
    async checkInTicket(qrCode, ip, ua, fingerprint) {
        const ticket = await this.prisma.eventTicket.findUnique({
            where: { qrCode },
            include: { event: true, user: true },
        });
        if (!ticket) {
            throw new common_1.NotFoundException("Invalid ticket code");
        }
        if (ticket.isUsed) {
            await this.prisma.checkInAuditLog.create({
                data: {
                    ticketId: ticket.id,
                    eventId: ticket.eventId,
                    action: "REJECT_DUPLICATE",
                    ipAddress: ip,
                    userAgent: ua,
                    deviceFingerprint: fingerprint,
                    verificationMethod: "QR_SCAN",
                    metadata: { attemptedAt: new Date().toISOString() },
                },
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
        await this.prisma.checkInAuditLog.create({
            data: {
                ticketId: ticket.id,
                eventId: ticket.eventId,
                action: "CHECK_IN",
                ipAddress: ip,
                userAgent: ua,
                deviceFingerprint: fingerprint,
                verificationMethod: "QR_SCAN",
            },
        });
        return {
            success: true,
            message: "Check-in successful",
            attendee: ticket.user.fullName,
            eventName: ticket.event.title,
            checkedInAt: updatedTicket.usedAt,
        };
    }
};
exports.EventService = EventService;
exports.EventService = EventService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EventService);
//# sourceMappingURL=event.service.js.map