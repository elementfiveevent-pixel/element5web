import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PaymentStatus, Prisma, UserRole } from "@prisma/client";
import * as crypto from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { RegisterEventDto } from "./dto/register-event.dto";

const ORGANIZER_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ORG_ADMIN,
  UserRole.EVENT_MANAGER,
];

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  async createEvent(userId: string, dto: CreateEventDto) {
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
        upiQrUrl: dto.upiQrUrl,
        upiVpa: dto.upiVpa,
        termsConditions: dto.termsConditions,
        customFields: (dto.customFields ?? []) as Prisma.InputJsonValue,
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
          },
        },
      },
      include: {
        location: true,
        ticketCategories: true,
      },
    });
  }

  async listEvents(filters: {
    search?: string;
    category?: string;
    city?: string;
    period?: "upcoming" | "past";
    limit?: number;
    offset?: number;
  }) {
    const limit = Math.min(filters.limit ? Number(filters.limit) : 20, 100);
    const offset = filters.offset ? Number(filters.offset) : 0;
    const where: Prisma.EventWhereInput = {};

    if (filters.period === "past") {
      where.OR = [
        { status: { in: ["COMPLETED", "ARCHIVED", "CANCELLED"] } },
        { endDate: { lt: new Date() } },
      ];
    } else {
      where.status = "PUBLISHED";
    }

    if (filters.category) {
      where.category = filters.category as any;
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

  async getEvent(idOrSlug: string) {
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );

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
      throw new NotFoundException("Event not found");
    }

    await this.prisma.event
      .update({
        where: { id: event.id },
        data: { viewsCount: { increment: 1 } },
      })
      .catch(() => undefined);

    return event;
  }

  async register(userId: string, eventId: string, dto: RegisterEventDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketCategories: true },
    });

    if (!event) {
      throw new NotFoundException("Event not found");
    }
    if (event.status !== "PUBLISHED") {
      throw new BadRequestException("Registration is not open for this event");
    }
    if (event.registrationEndDate && event.registrationEndDate < new Date()) {
      throw new BadRequestException("Registration has closed for this event");
    }

    const existing = await this.prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (existing) {
      throw new ConflictException("You are already registered for this event");
    }

    return this.prisma.$transaction(async (tx) => {
      const currentEvent = await tx.event.findUnique({
        where: { id: eventId },
        include: { ticketCategories: true },
      });

      if (!currentEvent) {
        throw new NotFoundException("Event not found");
      }
      if (
        currentEvent.maxCapacity &&
        currentEvent.registrationsCount >= currentEvent.maxCapacity
      ) {
        throw new BadRequestException("Event is fully booked");
      }

      const ticketCategory = dto.ticketCategoryId
        ? currentEvent.ticketCategories.find((cat) => cat.id === dto.ticketCategoryId)
        : currentEvent.ticketCategories[0];

      if (dto.ticketCategoryId && !ticketCategory) {
        throw new BadRequestException("Selected ticket category is invalid");
      }
      if (
        ticketCategory &&
        ticketCategory.maxCapacity &&
        ticketCategory.soldCount >= ticketCategory.maxCapacity
      ) {
        throw new BadRequestException("Selected ticket category is sold out");
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

      const baseAmount = ticketCategory?.price ?? currentEvent.price;
      const paymentStatus =
        currentEvent.isPaid || Number(baseAmount) > 0
          ? PaymentStatus.PENDING
          : PaymentStatus.APPROVED;

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

  async getMyTickets(userId: string) {
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
      ticketCategoryName: this.getCustomString(
        ticket.registration.customData,
        "ticketCategoryName",
      ),
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

  async getOrganizerEvents(organizerId: string, roles: UserRole[] = []) {
    const canViewAll = roles.some(
      (role) => role === UserRole.SUPER_ADMIN || role === UserRole.ORG_ADMIN,
    );

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

  async getEventRegistrations(
    eventId: string,
    organizerId: string,
    roles: UserRole[] = [],
  ) {
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

  async getEventAnalytics(
    eventId: string,
    organizerId: string,
    roles: UserRole[] = [],
  ) {
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
      throw new NotFoundException("Event not found");
    }

    const totalRegistrations = event.registrations.length;
    const approvedRegistrations = event.registrations.filter(
      (registration) => registration.paymentStatus === "APPROVED",
    ).length;
    const pendingRegistrations = event.registrations.filter(
      (registration) => registration.paymentStatus === "PENDING",
    ).length;
    const totalTickets = event.tickets.length;
    const checkedIn = event.tickets.filter((ticket) => ticket.isUsed).length;
    const capacityPct = event.maxCapacity
      ? Math.round((totalRegistrations / event.maxCapacity) * 100)
      : 0;
    const totalRevenue = event.registrations.reduce(
      (sum, registration) => sum + Number(registration.totalAmount || 0),
      0,
    );

    const checkInsByHour: Record<string, number> = {};
    event.checkInAuditLogs
      .filter((log) => log.action === "CHECK_IN")
      .forEach((log) => {
        const key = new Date(log.createdAt).toISOString().slice(0, 13);
        checkInsByHour[key] = (checkInsByHour[key] || 0) + 1;
      });

    const registrationsByDay: Record<string, number> = {};
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
      attendanceRate:
        totalTickets > 0 ? Math.round((checkedIn / totalTickets) * 100) : 0,
      totalRevenue,
      viewsCount: event.viewsCount,
      checkInTimeline: Object.entries(checkInsByHour).map(([hour, count]) => ({
        hour,
        count,
      })),
      registrationTimeline: Object.entries(registrationsByDay).map(
        ([date, count]) => ({ date, count }),
      ),
      ticketCategories: event.ticketCategories,
    };
  }

  async updateEvent(
    eventId: string,
    organizerId: string,
    dto: Partial<CreateEventDto>,
    roles: UserRole[] = [],
  ) {
    await this.assertOrganizerAccess(eventId, organizerId, roles);

    return this.prisma.event.update({
      where: { id: eventId },
      data: {
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
        ...(dto.upiVpa !== undefined && { upiVpa: dto.upiVpa }),
        ...(dto.upiQrUrl !== undefined && { upiQrUrl: dto.upiQrUrl }),
        ...(dto.termsConditions !== undefined && {
          termsConditions: dto.termsConditions,
        }),
        ...(dto.customFields !== undefined && {
          customFields: dto.customFields as Prisma.InputJsonValue,
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

  async reviewRegistration(
    registrationId: string,
    organizerId: string,
    action: "APPROVED" | "REJECTED",
    roles: UserRole[] = [],
  ) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: { event: { select: { id: true } } },
    });

    if (!registration) {
      throw new NotFoundException("Registration not found");
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

  async checkInTicket(
    qrCode: string,
    ip?: string,
    userAgent?: string,
    fingerprint?: string,
  ) {
    const ticket = await this.prisma.eventTicket.findUnique({
      where: { qrCode },
      include: {
        event: true,
        user: true,
        registration: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException("Invalid ticket code");
    }

    if (ticket.registration.paymentStatus !== PaymentStatus.APPROVED) {
      await this.logCheckIn(ticket.id, ticket.eventId, "REJECT_PAYMENT_STATUS", {
        ip,
        userAgent,
        fingerprint,
        metadata: { paymentStatus: ticket.registration.paymentStatus },
      });
      throw new BadRequestException(
        `Ticket payment status is ${ticket.registration.paymentStatus}`,
      );
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
      throw new BadRequestException("Ticket is expired or event is not active");
    }

    if (ticket.isUsed) {
      await this.logCheckIn(ticket.id, ticket.eventId, "REJECT_DUPLICATE", {
        ip,
        userAgent,
        fingerprint,
        metadata: { attemptedAt: new Date().toISOString() },
      });
      throw new BadRequestException(`Ticket already checked in at ${ticket.usedAt}`);
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

  private async assertOrganizerAccess(
    eventId: string,
    userId: string,
    roles: UserRole[] = [],
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (!event) {
      throw new NotFoundException("Event not found");
    }

    const canManageAll = roles.some((role) => ORGANIZER_ROLES.includes(role));
    if (!canManageAll && event.organizerId !== userId) {
      throw new ForbiddenException("Access denied");
    }
  }

  private async logCheckIn(
    ticketId: string,
    eventId: string,
    action: string,
    details: {
      ip?: string;
      userAgent?: string;
      fingerprint?: string;
      metadata?: Prisma.InputJsonValue;
    },
  ) {
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

  private signTicketCode(registrationId: string, userId: string, eventId: string) {
    return crypto
      .createHmac("sha256", process.env.JWT_SECRET || "element5_jwt_secret")
      .update(`${registrationId}:${userId}:${eventId}:${Date.now()}:${crypto.randomUUID()}`)
      .digest("hex");
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  private getCustomString(value: unknown, key: string) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return undefined;
    }
    const found = (value as Record<string, unknown>)[key];
    return typeof found === "string" ? found : undefined;
  }
}
